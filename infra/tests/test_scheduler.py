import os
import sys

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest


sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1])
)

os.environ.setdefault(
    "SERVICE_API_KEY",
    "test-key"
)


import scheduler
import controller


TEST_ID = "123e4567-e89b-12d3-a456-426614174000"


def test_service_name():
    assert scheduler.service_name(TEST_ID) == (
        f"helios-{TEST_ID}"
    )


def test_public_url():
    assert scheduler.deployment_url(TEST_ID) == (
        f"http://{TEST_ID}.localhost"
    )


def test_invalid_deployment_id():
    with pytest.raises(ValueError):
        scheduler.normalize_id("invalid-id")


def test_traefik_labels():
    labels = scheduler.service_labels(TEST_ID)

    assert labels["traefik.enable"] == "true"

    assert labels["helios.managed"] == "true"

    assert labels["helios.deployment_id"] == TEST_ID

    router = f"helios-{TEST_ID}"

    assert (
        labels[f"traefik.http.routers.{router}.rule"]
        == f"Host(`{TEST_ID}.localhost`)"
    )


def test_docker_swarm_inactive():
    client = MagicMock()

    client.info.return_value = {
        "Swarm": {
            "LocalNodeState": "inactive"
        }
    }

    with pytest.raises(RuntimeError, match="inactive"):
        scheduler.check_swarm(client)


def test_docker_swarm_active():
    client = MagicMock()

    client.info.return_value = {
        "Swarm": {
            "LocalNodeState": "active"
        }
    }

    scheduler.check_swarm(client)


def test_image_for_dockerhub(monkeypatch):
    monkeypatch.setattr(
        controller,
        "REGISTRY_TYPE",
        "dockerhub"
    )

    monkeypatch.setattr(
        controller,
        "DOCKERHUB_USERNAME",
        "heliostest"
    )

    assert controller.image_for(TEST_ID) == (
        f"heliostest/mini-paas:{TEST_ID}"
    )


def test_deploy_creates_swarm_service():
    client = MagicMock()

    client.info.return_value = {
        "Swarm": {
            "LocalNodeState": "active"
        }
    }

    network = MagicMock()

    network.name = "helios-web"
    network.id = "network-123"
    network.attrs = {
        "Driver": "overlay"
    }

    client.networks.list.return_value = [network]

    client.services.list.return_value = []

    service = MagicMock()
    service.id = "service-123"

    client.services.create.return_value = service

    with patch(
        "scheduler.get_client",
        return_value=client
    ):
        with patch("scheduler.wait_for_running"):
            result = scheduler.deploy(
                TEST_ID,
                f"heliostest/mini-paas:{TEST_ID}"
            )

    assert result["service_id"] == "service-123"

    assert result["created"] is True

    assert result["public_url"] == (
        f"http://{TEST_ID}.localhost"
    )

    client.services.create.assert_called_once()


def test_remove_managed_service():
    client = MagicMock()

    client.info.return_value = {
        "Swarm": {
            "LocalNodeState": "active"
        }
    }

    service = MagicMock()

    service.attrs = {
        "Spec": {
            "Labels": {
                "helios.managed": "true"
            }
        }
    }

    client.services.get.return_value = service

    with patch(
        "scheduler.get_client",
        return_value=client
    ):
        result = scheduler.remove_service(
            "service-123"
        )

    assert result is True

    service.remove.assert_called_once()


def test_refuse_unmanaged_service():
    client = MagicMock()

    client.info.return_value = {
        "Swarm": {
            "LocalNodeState": "active"
        }
    }

    service = MagicMock()

    service.attrs = {
        "Spec": {
            "Labels": {}
        }
    }

    client.services.get.return_value = service

    with patch(
        "scheduler.get_client",
        return_value=client
    ):
        with pytest.raises(
            ValueError,
            match="unmanaged"
        ):
            scheduler.remove_service(
                "unmanaged-service"
            )

    service.remove.assert_not_called()


def test_reconcile_creates_missing_service(monkeypatch):
    monkeypatch.setattr(
        controller,
        "DOCKERHUB_USERNAME",
        "heliostest"
    )

    monkeypatch.setattr(
        controller,
        "REGISTRY_TYPE",
        "dockerhub"
    )

    deployments = [
        {
            "id": TEST_ID,
            "status": "running"
        }
    ]

    with patch(
        "controller.fetch_deployments",
        return_value=deployments
    ), patch(
        "controller.managed_service_map",
        return_value={}
    ), patch(
        "controller.deploy"
    ) as mock_deploy:

        mock_deploy.return_value = {
            "service_id": "service-123",
            "public_url": f"http://{TEST_ID}.localhost"
        }

        controller.reconcile()

    mock_deploy.assert_called_once_with(
        TEST_ID,
        f"heliostest/mini-paas:{TEST_ID}"
    )


def test_reconcile_removes_deleted_deployment():
    with patch(
        "controller.fetch_deployments",
        return_value=[]
    ), patch(
        "controller.managed_service_map",
        return_value={
            TEST_ID: "service-123"
        }
    ), patch(
        "controller.remove_service"
    ) as mock_remove:

        controller.reconcile()

    mock_remove.assert_called_once_with(
        "service-123"
    )


def test_reconcile_preserves_existing_deployment():
    deployments = [
        {
            "id": TEST_ID,
            "status": "building"
        }
    ]

    with patch(
        "controller.fetch_deployments",
        return_value=deployments
    ), patch(
        "controller.managed_service_map",
        return_value={
            TEST_ID: "service-123"
        }
    ), patch(
        "controller.remove_service"
    ) as mock_remove:

        controller.reconcile()

    mock_remove.assert_not_called()