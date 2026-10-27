import logging
import os
import time

import docker
import requests

from scheduler import (
    deploy,
    get_client,
    list_managed_services,
    normalize_id,
    remove_service,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger("helios-controller")


API_URL = os.getenv("API_URL", "http://api:8000").rstrip("/")
API_KEY = os.environ["SERVICE_API_KEY"]

POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))

REGISTRY_TYPE = os.getenv("REGISTRY_TYPE", "dockerhub")
DOCKERHUB_USERNAME = os.getenv("DOCKERHUB_USERNAME", "")
LOCAL_REGISTRY_URL = os.getenv("LOCAL_REGISTRY_URL", "")
DEPLOYMENT_DOMAIN = os.getenv("DEPLOYMENT_DOMAIN", "localhost")


def auth_headers():
    """Authenticate requests to the existing API."""
    return {
        "X-Service-API-Key": API_KEY
    }

def update_deployment_metadata(deployment_id, service_id, public_url):
    """Save Docker Swarm service details through the API."""
    response = requests.patch(
        f"{API_URL}/deployments/{deployment_id}/metadata",
        json={
            "container_id": service_id,
            "public_url": public_url,
        },
        headers=auth_headers(),
        timeout=15,
    )

    response.raise_for_status()
    return response.json()

def image_for(deployment_id):
    """Generate the image tag used by the Build Service."""
    deployment_id = normalize_id(deployment_id)

    if REGISTRY_TYPE == "dockerhub":
        if not DOCKERHUB_USERNAME:
            raise ValueError(
                "DOCKERHUB_USERNAME is required"
            )

        return f"{DOCKERHUB_USERNAME}/mini-paas:{deployment_id}"

    if REGISTRY_TYPE == "local":
        if not LOCAL_REGISTRY_URL:
            raise ValueError(
                "LOCAL_REGISTRY_URL is required"
            )

        return f"{LOCAL_REGISTRY_URL}/mini-paas:{deployment_id}"

    raise ValueError(
        f"Unsupported registry type: {REGISTRY_TYPE}"
    )


def fetch_deployments():
    """Retrieve all deployments from the API."""
    deployments = []

    offset = 0
    page_size = 100

    while True:
        response = requests.get(
            f"{API_URL}/deployments",
            params={
                "skip": offset,
                "limit": page_size,
            },
            headers=auth_headers(),
            timeout=15,
        )

        response.raise_for_status()

        page = response.json()

        if not isinstance(page, list):
            raise ValueError(
                "API returned an invalid deployment list"
            )

        deployments.extend(page)

        if len(page) < page_size:
            break

        offset += page_size

    return deployments


def managed_service_map():
    """Map deployment UUIDs to Docker Swarm service IDs."""
    client = get_client()

    try:
        services = {}

        for service in list_managed_services(client):
            labels = service.attrs.get(
                "Spec", {}
            ).get("Labels", {})

            deployment_id = labels.get(
                "helios.deployment_id"
            )

            if deployment_id:
                services[deployment_id] = service.id

        return services

    finally:
        client.close()


def reconcile():
    """
    Synchronize API deployments with Docker Swarm.

    Create missing services for running deployments.

    Remove services whose deployment records no longer exist.
    """
    deployments = fetch_deployments()

    records = {
        normalize_id(item["id"]): item
        for item in deployments
    }

    existing = managed_service_map()

    # Create missing services and synchronize deployment metadata.
    for deployment_id, deployment in records.items():

        if deployment["status"] != "running":
            continue

        try:
            if deployment_id in existing:
                service_id = existing[deployment_id]
                public_url = f"http://{deployment_id}.{DEPLOYMENT_DOMAIN}"

            else:
                image = image_for(deployment_id)

                result = deploy(
                    deployment_id,
                    image,
                )

                service_id = result["service_id"]
                public_url = result["public_url"]

                logger.info(
                    "Deployment %s: service=%s url=%s",
                    deployment_id,
                    service_id,
                    public_url,
                )

            # Avoid unnecessary API updates on every polling cycle.
            if (
                deployment.get("container_id") != service_id
                or deployment.get("public_url") != public_url
            ):
                update_deployment_metadata(
                    deployment_id,
                    service_id,
                    public_url,
                )

                logger.info(
                    "Saved metadata for deployment %s",
                    deployment_id,
                )

        except (
            docker.errors.DockerException,
            requests.exceptions.RequestException,
            RuntimeError,
            TimeoutError,
            ValueError,
        ) as exc:

            logger.error(
                "Could not reconcile deployment %s: %s",
                deployment_id,
                exc,
            )

    # Remove orphaned services.
    for deployment_id, service_id in existing.items():

        if deployment_id in records:
            continue

        try:
            remove_service(service_id)

            logger.info(
                "Removed orphaned service %s "
                "for deployment %s",
                service_id,
                deployment_id,
            )

        except (
            docker.errors.DockerException,
            RuntimeError,
            ValueError,
        ) as exc:

            logger.error(
                "Could not remove service %s: %s",
                service_id,
                exc,
            )


def main():
    logger.info(
        "Helios controller started. "
        "Polling every %s seconds.",
        POLL_INTERVAL,
    )

    while True:
        try:
            reconcile()

        except Exception:
            logger.exception(
                "Reconciliation failed"
            )

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()