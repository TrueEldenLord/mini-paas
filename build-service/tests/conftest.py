import os

os.environ.setdefault("API_URL", "http://localhost:8000")
os.environ.setdefault("POLL_INTERVAL_SECONDS", "5")
os.environ.setdefault("REGISTRY_TYPE", "dockerhub")
os.environ.setdefault("DOCKERHUB_USERNAME", "testuser")
os.environ.setdefault("LOCAL_REGISTRY_URL", "localhost:5000")
