from __future__ import annotations

import asyncio
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api import themes
from app.core.supabase_rest import SupabaseRestError


def test_lifecycle_gate_request_requires_evidence():
    with pytest.raises(Exception):
        themes.ThemeAssetLifecycleGateRequest(
            gate="safety", decision="passed", evidence={}
        )


def test_lifecycle_gate_request_rejects_unknown_gate():
    with pytest.raises(Exception):
        themes.ThemeAssetLifecycleGateRequest(
            gate="upload", decision="passed", evidence={"scan_id": "scan-1"}
        )


@pytest.mark.parametrize(
    ("gate", "decision", "expected_code"),
    [
        ("moderation", "passed", "INVALID_MODERATION_DECISION"),
        ("safety", "approved", "INVALID_TECHNICAL_GATE_DECISION"),
        ("performance", "approved", "INVALID_TECHNICAL_GATE_DECISION"),
    ],
)
def test_lifecycle_endpoint_rejects_incompatible_decision_before_rpc(
    monkeypatch, gate, decision, expected_code
):
    async def fail_if_called(*args, **kwargs):
        raise AssertionError("RPC must not be called for an invalid decision")

    monkeypatch.setattr(themes, "rpc", fail_if_called)
    payload = themes.ThemeAssetLifecycleGateRequest(
        gate=gate, decision=decision, evidence={"evidence": "present"}
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            themes.record_platform_asset_lifecycle_gate(
                uuid4(), payload, {"user": object(), "permissions": ["admin.manage"]}
            )
        )
    assert exc.value.status_code == 422
    assert exc.value.detail["code"] == expected_code


def test_lifecycle_endpoint_records_valid_gate(monkeypatch):
    expected = {
        "asset_id": str(uuid4()),
        "gate": "safety",
        "decision": "passed",
        "status": "recorded",
    }
    calls = []

    async def fake_rpc(user, function, payload):
        calls.append((user, function, payload))
        return expected

    monkeypatch.setattr(themes, "rpc", fake_rpc)
    user = object()
    asset_id = uuid4()
    payload = themes.ThemeAssetLifecycleGateRequest(
        gate="safety",
        decision="passed",
        evidence={
            "asset_checksum_sha256": "a" * 64,
            "scanner": "scanner-name",
            "scan_id": "scan-123",
            "findings": "0",
        },
    )
    result = asyncio.run(
        themes.record_platform_asset_lifecycle_gate(
            asset_id, payload, {"user": user, "permissions": ["admin.manage"]}
        )
    )
    assert result == {"data": expected}
    assert calls[0][0] is user
    assert calls[0][1] == "record_v3_theme_asset_gate"
    assert calls[0][2]["p_asset_id"] == str(asset_id)


def test_lifecycle_endpoint_maps_rpc_permission_denial(monkeypatch):
    async def deny(*args, **kwargs):
        raise SupabaseRestError(403, "permission denied")

    monkeypatch.setattr(themes, "rpc", deny)
    payload = themes.ThemeAssetLifecycleGateRequest(
        gate="moderation",
        decision="approved",
        evidence={"reviewer_note": "reviewed by authorized reviewer"},
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            themes.record_platform_asset_lifecycle_gate(
                uuid4(), payload, {"user": object(), "permissions": ["admin.manage"]}
            )
        )
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "THEME_ASSET_LIFECYCLE_GATE_FAILED"


def test_route_is_protected_by_permission_dependency():
    route = next(
        route for route in themes.router.routes
        if getattr(route, "path", None)
        == "/api/v1/themes/platform-assets/{asset_id}/lifecycle-gate"
    )
    dependencies = route.dependant.dependencies
    assert dependencies, "lifecycle gate route must not be publicly callable"
    assert all(
        getattr(dependency.call, "__name__", "") != "get_auth_context"
        for dependency in dependencies
    ), "lifecycle gate must use an explicit permission dependency"
