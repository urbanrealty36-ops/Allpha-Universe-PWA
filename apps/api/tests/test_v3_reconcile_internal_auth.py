"""Unit tests for the internal V3 reconciliation token boundary."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.theme_generation import _require_v3_reconcile_token


def test_developer_reconcile_rejects_wrong_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLPHA_V3_RECONCILE_TOKEN", "expected-test-token")
    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_USER_ID", "11111111-1111-4111-8111-111111111111")
    with pytest.raises(HTTPException) as exc:
        _require_v3_reconcile_token("wrong-token")
    assert exc.value.status_code == 403
    assert exc.value.detail["code"] == "V3_RECONCILE_TOKEN_INVALID"


def test_developer_reconcile_fails_closed_when_token_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ALLPHA_V3_RECONCILE_TOKEN", raising=False)
    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_USER_ID", "11111111-1111-4111-8111-111111111111")
    with pytest.raises(HTTPException) as exc:
        _require_v3_reconcile_token("anything")
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "V3_RECONCILE_NOT_CONFIGURED"


def test_developer_reconcile_requires_existing_owner_identity(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLPHA_V3_RECONCILE_TOKEN", "expected-test-token")
    monkeypatch.delenv("ALLPHA_THEME_STUDIO_OWNER_USER_ID", raising=False)
    with pytest.raises(HTTPException) as exc:
        _require_v3_reconcile_token("expected-test-token")
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "V3_RECONCILE_OPERATOR_NOT_CONFIGURED"


def test_developer_reconcile_accepts_configured_token_and_owner(monkeypatch: pytest.MonkeyPatch) -> None:
    operator_id = "11111111-1111-4111-8111-111111111111"
    monkeypatch.setenv("ALLPHA_V3_RECONCILE_TOKEN", "expected-test-token")
    monkeypatch.setenv("ALLPHA_THEME_STUDIO_OWNER_USER_ID", operator_id)
    assert _require_v3_reconcile_token("expected-test-token") == operator_id
