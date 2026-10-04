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

if __name__ == "__main__":
    logger.info("Build service starting...")
