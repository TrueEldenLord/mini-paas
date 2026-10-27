import os
import time
import uuid

import docker
from docker.errors import NotFound
from docker.types import ServiceMode


NETWORK = os.getenv("SWARM_NETWORK", "helios-web")
DOMAIN = os.getenv("DEPLOYMENT_DOMAIN", "localhost")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
STARTUP_TIMEOUT = int(os.getenv("STARTUP_TIMEOUT", "90"))


def normalize_id(deployment_id):
    """Validate and normalize a deployment UUID."""
    return str(uuid.UUID(str(deployment_id)))


def service_name(deployment_id):
    """Generate a unique Docker Swarm service name."""
    return f"helios-{normalize_id(deployment_id)}"


def deployment_url(deployment_id):
    """Generate the deployment's public URL."""
    return f"http://{normalize_id(deployment_id)}.{DOMAIN}"


def get_client():
    """Connect to the local Docker engine."""
    return docker.from_env()


def check_swarm(client):
    """Verify Docker Swarm is active."""
    state = client.info().get("Swarm", {}).get("LocalNodeState")

    if state != "active":
        raise RuntimeError(
            "Docker Swarm is inactive. Run: docker swarm init"
        )


def get_network(client):
    """Find the overlay network used by deployed applications."""
    for network in client.networks.list(names=[NETWORK]):
        if network.name == NETWORK:
            if network.attrs.get("Driver") != "overlay":
                raise RuntimeError(
                    f"{NETWORK} must be an overlay network"
                )

            return network.id

    raise RuntimeError(
        f"Missing network {NETWORK}. Create it with: "
        f"docker network create --driver overlay "
        f"--attachable {NETWORK}"
    )


def service_labels(deployment_id):
    """Generate Traefik routing labels for a deployment."""
    deployment_id = normalize_id(deployment_id)
    name = service_name(deployment_id)

    return {
        "helios.managed": "true",
        "helios.deployment_id": deployment_id,

        "traefik.enable": "true",
        "traefik.swarm.network": NETWORK,

        f"traefik.http.routers.{name}.rule":
            f"Host(`{deployment_id}.{DOMAIN}`)",

        f"traefik.http.routers.{name}.entrypoints": "web",

        f"traefik.http.routers.{name}.service": name,

        f"traefik.http.services.{name}.loadbalancer.server.port":
            str(APP_PORT),
    }


def list_managed_services(client):
    """List only services created by the Helios scheduler."""
    return client.services.list(
        filters={"label": "helios.managed=true"}
    )


def find_service(client, deployment_id):
    """Find an existing service for a deployment."""
    deployment_id = normalize_id(deployment_id)

    for service in list_managed_services(client):
        labels = service.attrs.get("Spec", {}).get("Labels", {})

        if labels.get("helios.deployment_id") == deployment_id:
            return service

    return None


def wait_for_running(service, timeout=STARTUP_TIMEOUT):
    """Wait for at least one Swarm task to reach running state."""
    deadline = time.monotonic() + timeout

    while time.monotonic() < deadline:
        for task in service.tasks():
            status = task.get("Status", {})
            state = status.get("State")
            desired = task.get("DesiredState")

            if state == "running" and desired == "running":
                return True

        time.sleep(2)

    raise TimeoutError(
        f"Swarm service {service.id} did not become running"
    )


def deploy(deployment_id, image):
    """
    Create a Docker Swarm service.

    Returns the service ID and public URL.
    """
    deployment_id = normalize_id(deployment_id)

    if not image or not image.strip():
        raise ValueError("Docker image reference cannot be empty")

    client = get_client()

    try:
        check_swarm(client)
        network_id = get_network(client)

        existing = find_service(client, deployment_id)

        if existing:
            return {
                "service_id": existing.id,
                "public_url": deployment_url(deployment_id),
                "created": False,
            }

        service = client.services.create(
            image=image,
            name=service_name(deployment_id),
            mode=ServiceMode("replicated", replicas=1),
            networks=[network_id],
            labels=service_labels(deployment_id),
        )

        try:
            wait_for_running(service)

        except Exception:
            service.remove()
            raise

        return {
            "service_id": service.id,
            "public_url": deployment_url(deployment_id),
            "created": True,
        }

    finally:
        client.close()


def remove_service(service_id):
    """Remove a Helios-managed Docker Swarm service."""
    client = get_client()

    try:
        check_swarm(client)

        try:
            service = client.services.get(service_id)

        except NotFound:
            return False

        labels = service.attrs.get("Spec", {}).get("Labels", {})

        if labels.get("helios.managed") != "true":
            raise ValueError(
                "Refusing to remove an unmanaged Docker service"
            )

        service.remove()
        return True

    finally:
        client.close()