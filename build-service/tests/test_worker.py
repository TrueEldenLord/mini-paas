import pytest
from unittest.mock import patch, MagicMock

import docker

import worker


def test_get_queued_deployments_filters_status():
    mock_resp = MagicMock()
    mock_resp.json.return_value = [
        {"id": "aaa", "status": "queued"},
        {"id": "bbb", "status": "running"},
        {"id": "ccc", "status": "failed"},
    ]
    with patch("worker.requests.get", return_value=mock_resp):
        result = worker.get_queued_deployments()
    assert len(result) == 1
    assert result[0]["id"] == "aaa"


def test_get_queued_deployments_raises_on_http_error():
    mock_resp = MagicMock()
    mock_resp.raise_for_status.side_effect = Exception("500 Server Error")
    with patch("worker.requests.get", return_value=mock_resp):
        with pytest.raises(Exception, match="500 Server Error"):
            worker.get_queued_deployments()


def test_update_status_calls_correct_endpoint():
    mock_resp = MagicMock()
    with patch("worker.requests.patch", return_value=mock_resp) as mock_patch:
        worker.update_status("abc-123", "building")
    mock_patch.assert_called_once_with(
        "http://localhost:8000/deployments/abc-123/status",
        json={"status": "building"},
    )


def test_update_logs_calls_correct_endpoint():
    mock_resp = MagicMock()
    with patch("worker.requests.patch", return_value=mock_resp) as mock_patch:
        worker.update_logs("abc-123", "build output here")
    mock_patch.assert_called_once_with(
        "http://localhost:8000/deployments/abc-123/logs",
        json={"logs": "build output here"},
    )


def test_clone_repo_calls_gitpython():
    with patch("worker.git.Repo.clone_from") as mock_clone:
        worker.clone_repo("https://github.com/user/repo.git", "/tmp/abc")
    mock_clone.assert_called_once_with(
        "https://github.com/user/repo.git", "/tmp/abc"
    )


def test_clone_repo_propagates_git_error():
    import git as git_module
    with patch(
        "worker.git.Repo.clone_from",
        side_effect=git_module.exc.GitCommandError("clone", 128),
    ):
        with pytest.raises(git_module.exc.GitCommandError):
            worker.clone_repo("https://github.com/bad/repo.git", "/tmp/abc")


def test_build_image_returns_log_lines():
    mock_client = MagicMock()
    mock_logs = iter([
        {"stream": "Step 1/3 : FROM python:3.11\n"},
        {"stream": "Step 2/3 : COPY . .\n"},
        {"stream": "\n"},          # empty — should be filtered
        {"other_key": "ignored"},  # no "stream" key — should be ignored
    ])
    mock_client.images.build.return_value = (MagicMock(), mock_logs)
    with patch("worker.docker.from_env", return_value=mock_client):
        logs = worker.build_image("/tmp/abc", "deploy-123")
    assert logs == ["Step 1/3 : FROM python:3.11", "Step 2/3 : COPY . ."]
    mock_client.images.build.assert_called_once_with(
        path="/tmp/abc", tag="mini-paas:deploy-123", rm=True
    )


def test_build_image_raises_on_build_error():
    mock_client = MagicMock()
    mock_client.images.build.side_effect = docker.errors.BuildError(
        "build failed", []
    )
    with patch("worker.docker.from_env", return_value=mock_client):
        with pytest.raises(docker.errors.BuildError):
            worker.build_image("/tmp/abc", "deploy-123")


def test_push_image_dockerhub():
    mock_client = MagicMock()
    worker.REGISTRY_TYPE = "dockerhub"
    worker.DOCKERHUB_USERNAME = "testuser"
    with patch("worker.docker.from_env", return_value=mock_client):
        worker.push_image("deploy-123")
    mock_client.images.get.assert_called_once_with("mini-paas:deploy-123")
    mock_client.images.get.return_value.tag.assert_called_once_with(
        "testuser/mini-paas:deploy-123"
    )
    mock_client.images.push.assert_called_once_with("testuser/mini-paas:deploy-123")


def test_push_image_local_registry():
    mock_client = MagicMock()
    worker.REGISTRY_TYPE = "local"
    worker.LOCAL_REGISTRY_URL = "localhost:5000"
    with patch("worker.docker.from_env", return_value=mock_client):
        worker.push_image("deploy-123")
    mock_client.images.get.assert_called_once_with("mini-paas:deploy-123")
    mock_client.images.get.return_value.tag.assert_called_once_with(
        "localhost:5000/mini-paas:deploy-123"
    )
    mock_client.images.push.assert_called_once_with(
        "localhost:5000/mini-paas:deploy-123"
    )


def test_push_image_raises_on_api_error():
    mock_client = MagicMock()
    worker.REGISTRY_TYPE = "dockerhub"
    worker.DOCKERHUB_USERNAME = "testuser"
    mock_client.images.push.side_effect = docker.errors.APIError("push failed")
    with patch("worker.docker.from_env", return_value=mock_client):
        with pytest.raises(docker.errors.APIError):
            worker.push_image("deploy-123")


def test_process_happy_path():
    deployment = {"id": "deploy-123", "repo_url": "https://github.com/user/repo.git"}
    with patch("worker.update_status") as mock_status, \
         patch("worker.clone_repo") as mock_clone, \
         patch("worker.os.path.exists", return_value=True), \
         patch("worker.build_image", return_value=["Step 1", "Step 2"]) as mock_build, \
         patch("worker.push_image") as mock_push, \
         patch("worker.update_logs") as mock_logs, \
         patch("worker.shutil.rmtree") as mock_rm:
        worker.process(deployment)

    mock_status.assert_any_call("deploy-123", "building")
    mock_status.assert_any_call("deploy-123", "running")
    mock_clone.assert_called_once_with(
        "https://github.com/user/repo.git", "/tmp/deploy-123"
    )
    mock_build.assert_called_once_with("/tmp/deploy-123", "deploy-123")
    mock_push.assert_called_once_with("deploy-123")
    mock_logs.assert_called_once_with("deploy-123", "Step 1\nStep 2")
    mock_rm.assert_called_once_with("/tmp/deploy-123", ignore_errors=True)


def test_process_clone_failure_marks_failed_and_cleans_up():
    import git as git_module
    deployment = {"id": "deploy-123", "repo_url": "https://github.com/bad/repo.git"}
    with patch("worker.update_status") as mock_status, \
         patch("worker.clone_repo",
               side_effect=git_module.exc.GitCommandError("clone", 128)), \
         patch("worker.update_logs") as mock_logs, \
         patch("worker.shutil.rmtree") as mock_rm:
        worker.process(deployment)

    mock_status.assert_any_call("deploy-123", "building")
    mock_status.assert_any_call("deploy-123", "failed")
    mock_rm.assert_called_once_with("/tmp/deploy-123", ignore_errors=True)
    logs_written = mock_logs.call_args[0][1]
    assert "GitCommandError" in logs_written


def test_process_no_dockerfile_marks_failed():
    deployment = {"id": "deploy-123", "repo_url": "https://github.com/user/repo.git"}
    with patch("worker.update_status") as mock_status, \
         patch("worker.clone_repo"), \
         patch("worker.os.path.exists", return_value=False), \
         patch("worker.build_image") as mock_build, \
         patch("worker.update_logs") as mock_logs, \
         patch("worker.shutil.rmtree"):
        worker.process(deployment)

    mock_status.assert_any_call("deploy-123", "failed")
    mock_build.assert_not_called()
    logs_written = mock_logs.call_args[0][1]
    assert "No Dockerfile" in logs_written


def test_process_build_failure_marks_failed():
    deployment = {"id": "deploy-123", "repo_url": "https://github.com/user/repo.git"}
    with patch("worker.update_status") as mock_status, \
         patch("worker.clone_repo"), \
         patch("worker.os.path.exists", return_value=True), \
         patch("worker.build_image",
               side_effect=docker.errors.BuildError("build failed", [])), \
         patch("worker.update_logs") as mock_logs, \
         patch("worker.push_image") as mock_push, \
         patch("worker.shutil.rmtree"):
        worker.process(deployment)

    mock_status.assert_any_call("deploy-123", "failed")
    mock_push.assert_not_called()
    assert mock_logs.called
