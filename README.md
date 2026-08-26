# mini-paas

A self-hosted Platform-as-a-Service built by a 6-person senior project team.

You give it a GitHub repo URL. It clones it, builds it into a Docker image, runs it as a container, and exposes it at a public URL. A React dashboard lets you submit deployments, track build status, and view logs in real time.

Think of it as a mini Heroku — running entirely on your own machine.

---

## How It Works

```
Developer → React Dashboard → FastAPI → PostgreSQL
                                ↓
                         Build Service (docker build)
                                ↓
                         Docker Swarm (runs container)
                                ↓
                         Traefik → {deployment-id}.localhost
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend API | Python 3.11+, FastAPI |
| Database | PostgreSQL |
| Containerization | Docker, Docker Swarm |
| Routing | Traefik |
| Frontend | React, Vite |
| Local dev | Docker Compose |
| CI/CD | GitHub Actions |

---

## Project Structure

```
/api            — FastAPI backend (control plane + data layer)
/build-service  — git clone, docker build, image push logic
/dashboard      — React frontend
/infra          — Docker Compose, Traefik config
/tests          — Integration and end-to-end tests
```

---

## Team Roles

| Role | Owns |
|---|---|
| API & Data Layer | FastAPI endpoints, PostgreSQL schema, deployment records |
| Build Service | git clone, docker build, image push, status updates |
| Container Scheduler & Networking | Docker Swarm, Traefik routing, container lifecycle |
| Deployment List & Submit Form | Main dashboard page, submit form, status polling |
| Deployment Detail View | Per-deployment logs, status, live URL link |
| API Integration & Shared State | API client layer, shared state, TypeScript types |

---

## Roadmap

- **Phase 1** — Manual proof-of-concept: deploy a single hello-world app end-to-end by hand
- **Phase 2** — Full automation: one-click deploys, live status, logs, React dashboard
- **Phase 3** — Testing: unit tests, integration tests, end-to-end HTTP assertions
- **Phase 4** — Stretch: GitHub webhooks, auth, AWS migration (ECR, ECS Fargate, ALB, RDS)

---

## Getting Started

> Prerequisites: Docker, Docker Compose, Python 3.11+, Node.js 18+

```bash
# Clone the repo
git clone https://github.com/TrueEldenLord/mini-paas.git
cd mini-paas

# Start the full stack locally
docker compose -f infra/docker-compose.yml up
```

More detailed setup instructions coming as each component is built out.

---

## Contributing

Each team member owns a specific component — see the role table above. Branch off `main`, keep PRs focused to your component, and open a pull request when ready for review.

```
git checkout -b your-name/feature-description
```
