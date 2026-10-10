"""Unit tests for the V1/V2-style internal V3 reconciliation key boundary."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.theme_generation import _require_owner_studio_key


def test_developer_reconcile_rejects_wrong_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_TOKEN", "expected-test-token")
    with pytest.raises(HTTPException) as exc:
        _require_owner_studio_key("wrong-token")
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "OWNER_THEME_STUDIO_KEY_INVALID"


def test_developer_reconcile_fails_closed_when_key_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ALLPHA_THEME_STUDIO_OWNER_TOKEN", raising=False)
    with pytest.raises(HTTPException) as exc:
        _require_owner_studio_key("anything")
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "OWNER_THEME_STUDIO_NOT_CONFIGURED"


def test_developer_reconcile_accepts_existing_owner_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_TOKEN", "expected-test-token")
    _require_owner_studio_key("expected-test-token")


@pytest.mark.asyncio
async def test_developer_reconcile_wrong_key_never_calls_reconcile_core(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Invalid credentials must stop before any Supabase/storage reconciliation work."""
    import app.api.theme_generation as theme_generation

    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_TOKEN", "expected-test-token")

    async def forbidden_reconcile(*args, **kwargs):
        raise AssertionError("reconciliation core must not run for an invalid key")

    monkeypatch.setattr(theme_generation, "reconcile_existing_v3_tripo_assets", forbidden_reconcile)
    with pytest.raises(HTTPException) as exc:
        await theme_generation.reconcile_existing_v3_tripo_assets_developer(
            x_allpha_owner_studio_key="wrong-token"
        )

    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "OWNER_THEME_STUDIO_KEY_INVALID"


@pytest.mark.asyncio
async def test_developer_reconcile_fails_closed_without_owner_identity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.api.theme_generation as theme_generation

    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_TOKEN", "expected-test-token")
    monkeypatch.delenv("ALLPHA_THEME_STUDIO_OWNER_USER_ID", raising=False)

    async def forbidden_reconcile(*args, **kwargs):
        raise AssertionError("reconciliation core must not run without a configured operator identity")

    monkeypatch.setattr(theme_generation, "reconcile_existing_v3_tripo_assets", forbidden_reconcile)
    with pytest.raises(HTTPException) as exc:
        await theme_generation.reconcile_existing_v3_tripo_assets_developer(
            x_allpha_owner_studio_key="expected-test-token"
        )

    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "OWNER_THEME_STUDIO_IDENTITY_NOT_CONFIGURED"


@pytest.mark.asyncio
async def test_developer_reconcile_uses_configured_operator_without_lifecycle_promotion(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.api.theme_generation as theme_generation

    operator_id = "521d2b16-e035-452b-82fe-dd7df00c0611"
    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_TOKEN", "expected-test-token")
    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_USER_ID", operator_id)
    observed: dict[str, object] = {}

    async def fake_reconcile(*, context):
        observed.update(context)
        return {"data": {"asset_count": 17, "publication_ready": False}}

    monkeypatch.setattr(theme_generation, "reconcile_existing_v3_tripo_assets", fake_reconcile)
    result = await theme_generation.reconcile_existing_v3_tripo_assets_developer(
        x_allpha_owner_studio_key="expected-test-token"
    )

    assert observed["execution_source"] == "owner_studio_internal_key"
    assert observed["user"].user_id == operator_id
    assert result["data"]["audit"]["operator_id"] == operator_id
    assert result["data"]["audit"]["lifecycle_approval_performed"] is False
    assert result["data"]["publication_ready"] is False
