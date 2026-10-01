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


def test_human_identity_endpoint_requires_bearer_token() -> None:
    response = client.get("/api/v1/identity/me")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_agent_collection_requires_bearer_token() -> None:
    response = client.get("/api/v1/agents/me")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_memory_endpoint_requires_bearer_token() -> None:
    response = client.get("/api/v1/agents/00000000-0000-0000-0000-000000000000/memory")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_knowledge_endpoint_requires_bearer_token() -> None:
    response = client.get("/api/v1/agents/00000000-0000-0000-0000-000000000000/knowledge")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_personalization_snapshot_requires_bearer_token() -> None:
    response = client.get("/api/v1/personalization/me")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_personalization_ontology_requires_bearer_token() -> None:
    response = client.get("/api/v1/personalization/ontology/interests")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_personalization_signal_requires_bearer_token() -> None:
    response = client.post("/api/v1/personalization/signals", json={"signal_type": "view"})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"


def test_personalization_goal_requires_bearer_token() -> None:
    response = client.post("/api/v1/personalization/goals", json={"title": "real goal"})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "AUTH_REQUIRED"
