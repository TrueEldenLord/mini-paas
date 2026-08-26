# Role 2 — Build Service

**Owner:** TBD
**Language:** Python 3.11+
**Folder:** `/build-service`

You take a repo URL and turn it into a Docker image. When a deployment is submitted, your code picks it up, clones the repo, builds the image, pushes it to the registry, and updates the status in the database at every step. If anything fails, you capture the error and mark it as failed — nothing is hidden.

---

## Your Tasks

- [ ] Poll or listen for deployments with status `queued`
- [ ] `git clone` the repo URL into a temp directory
- [ ] Run `docker build` on the cloned repo using the Docker Python SDK
- [ ] Push the built image to Docker Hub (or local registry)
- [ ] Update deployment status: `queued → building → running` or `building → failed`
- [ ] Capture build output line by line and write it to the `logs` field in the database
- [ ] Clean up the temp directory after the build completes or fails
- [ ] Handle edge cases: repo not found, no Dockerfile present, build timeout

---

## Setup

### 1. Install Python packages

```bash
cd build-service
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install docker gitpython requests python-dotenv
pip freeze > requirements.txt
```

### 2. Make sure Docker is running

The Docker Python SDK talks directly to the Docker daemon. Docker Desktop must be open.

```bash
docker info   # should return system info if Docker is running
```

### 3. Log in to Docker Hub

```bash
docker login
```

---

## Packages

| Package | What it does |
|---|---|
| `docker` | Docker Python SDK — programmatically build, tag, and push images |
| `gitpython` | Clone and interact with git repos from Python |
| `requests` | HTTP calls to the API to update deployment status |
| `python-dotenv` | Load `.env` config (registry credentials, API URL) |

---

## Resources

- Docker Python SDK: https://docker-py.readthedocs.io
- GitPython docs: https://gitpython.readthedocs.io
- Docker overview (images & containers): https://docs.docker.com/get-started
- Real Python async articles: https://realpython.com/async-io-python
