import pytest
from unittest.mock import patch, MagicMock

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
