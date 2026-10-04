import os
import shutil
import logging
import time

import docker
import git
import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = os.environ["API_URL"]
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "5"))
REGISTRY_TYPE = os.environ["REGISTRY_TYPE"]
DOCKERHUB_USERNAME = os.environ.get("DOCKERHUB_USERNAME", "")
LOCAL_REGISTRY_URL = os.environ.get("LOCAL_REGISTRY_URL", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("build-service")


def get_queued_deployments():
    response = requests.get(f"{API_URL}/deployments")
    response.raise_for_status()
    return [d for d in response.json() if d["status"] == "queued"]


def update_status(deployment_id, status):
    response = requests.patch(
        f"{API_URL}/deployments/{deployment_id}/status",
        json={"status": status},
    )
    response.raise_for_status()


def update_logs(deployment_id, logs):
    response = requests.patch(
        f"{API_URL}/deployments/{deployment_id}/logs",
        json={"logs": logs},
    )
    response.raise_for_status()


if __name__ == "__main__":
    logger.info("Build service starting...")
