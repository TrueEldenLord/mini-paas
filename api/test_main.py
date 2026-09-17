import uuid
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


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