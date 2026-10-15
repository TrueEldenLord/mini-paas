import os
import uuid
from fastapi.testclient import TestClient
from main import app

os.environ["SERVICE_API_KEY"] = "test-service-key"

client = TestClient(app)
SERVICE_HEADERS = {"X-Service-API-Key": "test-service-key"}


def get_auth_headers():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "testpass123"
    client.post("/auth/register", json={"email": email, "username": "testuser", "password": password})
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


AUTH_HEADERS = get_auth_headers()


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "API is alive"}


def test_register_and_login():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post("/auth/register", json={"email": email, "username": "newuser", "password": "testpass123"})
    assert response.status_code == 200
    assert response.json()["email"] == email

    login_response = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_create_deployment():
    response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo"}, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["repo_url"] == "https://github.com/test/repo"
    assert data["status"] == "queued"
    assert "id" in data


def test_create_deployment_without_token():
    response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo"})
    assert response.status_code == 401


def test_list_deployments():
    response = client.get("/deployments", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_deployment():
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/deployments/{fake_id}", headers=AUTH_HEADERS)
    assert response.status_code == 404


def test_update_status_invalid():
    create_response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo2"}, headers=AUTH_HEADERS)
    deployment_id = create_response.json()["id"]

    response = client.patch(f"/deployments/{deployment_id}/status", json={"status": "banana"}, headers=AUTH_HEADERS)
    assert response.status_code == 400


def test_update_status_valid():
    create_response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo3"}, headers=AUTH_HEADERS)
    deployment_id = create_response.json()["id"]

    response = client.patch(f"/deployments/{deployment_id}/status", json={"status": "building"}, headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert response.json()["status"] == "building"


def test_delete_deployment():
    create_response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo4"}, headers=AUTH_HEADERS)
    deployment_id = create_response.json()["id"]

    response = client.delete(f"/deployments/{deployment_id}", headers=AUTH_HEADERS)
    assert response.status_code == 200

    get_response = client.get(f"/deployments/{deployment_id}", headers=AUTH_HEADERS)
    assert get_response.status_code == 404


def _create_deployment():
    response = client.post(
        "/deployments",
        json={"repo_url": "https://github.com/octocat/Hello-World"},
        headers=AUTH_HEADERS,
    )
    return response.json()["id"]


def test_update_logs_with_user_token():
    deployment_id = _create_deployment()
    response = client.patch(f"/deployments/{deployment_id}/logs", json={"logs": "build ok"}, headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert response.json()["logs"] == "build ok"


def test_update_logs_not_found():
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.patch(f"/deployments/{fake_id}/logs", json={"logs": "x"}, headers=AUTH_HEADERS)
    assert response.status_code == 404


def test_update_logs_without_credentials():
    deployment_id = _create_deployment()
    response = client.patch(f"/deployments/{deployment_id}/logs", json={"logs": "x"})
    assert response.status_code == 401


def test_service_key_can_list_deployments():
    response = client.get("/deployments", headers=SERVICE_HEADERS)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_service_key_can_update_status_and_logs():
    deployment_id = _create_deployment()
    r1 = client.patch(f"/deployments/{deployment_id}/status", json={"status": "building"}, headers=SERVICE_HEADERS)
    r2 = client.patch(f"/deployments/{deployment_id}/logs", json={"logs": "cloning repo"}, headers=SERVICE_HEADERS)
    assert r1.status_code == 200
    assert r1.json()["status"] == "building"
    assert r2.status_code == 200
    assert r2.json()["logs"] == "cloning repo"


def test_wrong_service_key_rejected():
    response = client.get("/deployments", headers={"X-Service-API-Key": "wrong-key"})
    assert response.status_code == 401


def test_list_without_credentials_rejected():
    response = client.get("/deployments")
    assert response.status_code == 401


def test_service_key_cannot_create_or_delete():
    deployment_id = _create_deployment()
    r_create = client.post("/deployments", json={"repo_url": "https://github.com/x/y"}, headers=SERVICE_HEADERS)
    r_delete = client.delete(f"/deployments/{deployment_id}", headers=SERVICE_HEADERS)
    assert r_create.status_code in (401, 403)
    assert r_delete.status_code in (401, 403)


def test_service_key_not_configured_fails_loudly(monkeypatch):
    monkeypatch.delenv("SERVICE_API_KEY", raising=False)
    response = client.get("/deployments", headers={"X-Service-API-Key": "anything"})
    assert response.status_code == 500
    assert response.json()["detail"] == "SERVICE_API_KEY not configured"


def test_token_without_sub_claim_rejected():
    from datetime import datetime, timedelta, timezone
    from jose import jwt
    import auth

    token = jwt.encode(
        {"exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        auth.SECRET_KEY,
        algorithm=auth.ALGORITHM,
    )
    response = client.get("/deployments", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401