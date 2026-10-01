from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_remains_public() -> None:
    response = client.get("/health")
    assert response.status_code == 200


def test_protected_auth_endpoint_requires_bearer_token() -> None:
    response = client.get("/api/v1/auth/permissions")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_protected_domain_requires_bearer_token() -> None:
    response = client.get("/api/v1/agents")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"
