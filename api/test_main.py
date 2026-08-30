from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "API is alive"}


def test_create_deployment():
    response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo"})
    assert response.status_code == 200
    data = response.json()
    assert data["repo_url"] == "https://github.com/test/repo"
    assert data["status"] == "queued"
    assert "id" in data


def test_list_deployments():
    response = client.get("/deployments")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_deployment():
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/deployments/{fake_id}")
    assert response.status_code == 404


def test_update_status_invalid():
    create_response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo2"})
    deployment_id = create_response.json()["id"]

    response = client.patch(f"/deployments/{deployment_id}/status", json={"status": "banana"})
    assert response.status_code == 400


def test_update_status_valid():
    create_response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo3"})
    deployment_id = create_response.json()["id"]

    response = client.patch(f"/deployments/{deployment_id}/status", json={"status": "building"})
    assert response.status_code == 200
    assert response.json()["status"] == "building"


def test_delete_deployment():
    create_response = client.post("/deployments", json={"repo_url": "https://github.com/test/repo4"})
    deployment_id = create_response.json()["id"]

    response = client.delete(f"/deployments/{deployment_id}")
    assert response.status_code == 200

    get_response = client.get(f"/deployments/{deployment_id}")
    assert get_response.status_code == 404