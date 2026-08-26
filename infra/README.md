# Role 3 — Container Scheduler & Networking

**Owner:** TBD
**Language:** Python 3.11+ / YAML
**Folder:** `/infra`

You take a built Docker image and make it reachable at a real URL. Once Role 2 finishes a build, your code runs it as a Docker Swarm service and configures Traefik to route traffic to it at `{deployment-id}.localhost`. You also track the container ID in the database and tear things down cleanly when a deployment is removed.

---

## Your Tasks

- [ ] Write the base `docker-compose.yml` for the full local stack (API, DB, Traefik, registry)
- [ ] Configure Traefik as a reverse proxy with Docker provider enabled
- [ ] Initialize Docker Swarm locally (`docker swarm init`)
- [ ] Deploy a container from a given image as a Docker Swarm service
- [ ] Attach Traefik labels to the service so `{deployment-id}.localhost` routes correctly
- [ ] Write the container ID and public URL back to the deployment record in the database
- [ ] Tear down the Swarm service when a deployment is deleted
- [ ] Test that a running container is reachable at its subdomain in a browser

---

## Setup

### 1. Install Python packages

```bash
cd infra
python3 -m venv venv
source venv/bin/activate
pip install docker requests python-dotenv
pip freeze > requirements.txt
```

### 2. Start the local stack

```bash
docker compose up -d
```

### 3. Initialize Docker Swarm

```bash
docker swarm init
```

### 4. Add local domain to /etc/hosts (one-time setup)

```bash
sudo echo "127.0.0.1 traefik.localhost" >> /etc/hosts
```

Traefik will handle `*.localhost` subdomains automatically once configured.

---

## Packages

| Package | What it does |
|---|---|
| `docker` | Docker Python SDK — create and manage Swarm services |
| `requests` | HTTP calls to the API to write container ID and URL |
| `python-dotenv` | Load `.env` config |

### Key config files (you will write these)

| File | What it does |
|---|---|
| `docker-compose.yml` | Defines all services for local dev — API, DB, Traefik |
| `traefik.yml` | Traefik static config — enables Docker provider, dashboard |

---

## Resources

- Traefik Docker provider: https://doc.traefik.io/traefik/providers/docker
- Docker Swarm mode tutorial: https://docs.docker.com/engine/swarm
- Docker Python SDK (services): https://docker-py.readthedocs.io/en/stable/services.html
- "How a reverse proxy works" — search for any intro article before diving into Traefik config
