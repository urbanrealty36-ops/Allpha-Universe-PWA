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
