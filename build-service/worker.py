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

if REGISTRY_TYPE not in ("dockerhub", "local"):
    raise ValueError(
        f"REGISTRY_TYPE must be 'dockerhub' or 'local', got '{REGISTRY_TYPE}'"
    )

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


def clone_repo(repo_url, dest_path):
    git.Repo.clone_from(repo_url, dest_path)


def build_image(repo_path, deployment_id):
    client = docker.from_env()
    tag = f"mini-paas:{deployment_id}"
    _, logs = client.images.build(path=repo_path, tag=tag, rm=True)
    lines = []
    for chunk in logs:
        if "stream" in chunk:
            line = chunk["stream"].strip()
            if line:
                lines.append(line)
    return lines


def push_image(deployment_id):
    client = docker.from_env()
    local_tag = f"mini-paas:{deployment_id}"
    if REGISTRY_TYPE == "dockerhub":
        remote_tag = f"{DOCKERHUB_USERNAME}/mini-paas:{deployment_id}"
    else:
        remote_tag = f"{LOCAL_REGISTRY_URL}/mini-paas:{deployment_id}"
    image = client.images.get(local_tag)
    image.tag(remote_tag)
    client.images.push(remote_tag)


def process(deployment):
    deployment_id = deployment["id"]
    repo_url = deployment["repo_url"]
    tmp_dir = f"/tmp/{deployment_id}"
    log_lines = []

    try:
        update_status(deployment_id, "building")
        clone_repo(repo_url, tmp_dir)

        if not os.path.exists(os.path.join(tmp_dir, "Dockerfile")):
            raise FileNotFoundError("No Dockerfile found at repo root")

        log_lines = build_image(tmp_dir, deployment_id)
        push_image(deployment_id)

        update_status(deployment_id, "running")
        update_logs(deployment_id, "\n".join(log_lines))
        logger.info(f"Deployment {deployment_id} succeeded")

    except Exception as exc:
        error_msg = f"{type(exc).__name__}: {exc}"
        log_lines.append(error_msg)
        logger.error(f"Deployment {deployment_id} failed: {error_msg}")
        try:
            update_status(deployment_id, "failed")
            update_logs(deployment_id, "\n".join(log_lines))
        except Exception as report_exc:
            logger.error(
                f"Deployment {deployment_id}: could not report failure to API: {report_exc}"
            )

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def poll():
    logger.info(f"Build service started. Polling every {POLL_INTERVAL}s")
    while True:
        try:
            for deployment in get_queued_deployments():
                logger.info(f"Processing deployment {deployment['id']}")
                process(deployment)
        except Exception as exc:
            logger.error(f"Poll error: {exc}")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    poll()
