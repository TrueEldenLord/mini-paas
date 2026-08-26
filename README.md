# mini-paas

A self-hosted Platform-as-a-Service built by a 6-person senior project team.

You give it a GitHub repo URL. It clones it, builds it into a Docker image, runs it as a container, and exposes it at a public URL. A React dashboard lets you submit deployments, track build status, and view logs in real time.

Think of it as a mini Heroku — running entirely on your own machine.

---

## Accessing the Project

1. **Get added to the repo** — ask the repo owner to add you as a collaborator at:
   `github.com/TrueEldenLord/mini-paas → Settings → Collaborators`

2. **Clone it locally**
   ```bash
   git clone https://github.com/TrueEldenLord/mini-paas.git
   cd mini-paas
   ```

3. **Navigate to your component folder** and read the README inside it — each folder has its own setup instructions, packages, and tasks specific to that role.

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
/api            — FastAPI backend (control plane + data layer)     → Role 1
/build-service  — git clone, docker build, image push              → Role 2
/dashboard      — React frontend                                   → Roles 4, 5, 6
/infra          — Docker Compose, Traefik config                   → Role 3
/tests          — Integration and end-to-end tests                 → Everyone
```

Each folder has its own README with setup steps, packages to install, and task breakdown for that role.

---

## Team Roles & Tasks

### Backend

| Role | Owner | Folder |
|---|---|---|
| Role 1 — API & Data Layer | TBD | `/api` |
| Role 2 — Build Service | TBD | `/build-service` |
| Role 3 — Container Scheduler & Networking | TBD | `/infra` |

### Frontend

| Role | Owner | Folder |
|---|---|---|
| Role 4 — Deployment List & Submit Form | TBD | `/dashboard` |
| Role 5 — Deployment Detail View | TBD | `/dashboard` |
| Role 6 — API Integration & Shared State | TBD | `/dashboard` |

> Replace "TBD" with your name once roles are assigned.

---

## Roadmap

- **Phase 1** — Manual proof-of-concept: deploy a single hello-world app end-to-end by hand
- **Phase 2** — Full automation: one-click deploys, live status, logs, React dashboard
- **Phase 3** — Testing: unit tests, integration tests, end-to-end HTTP assertions
- **Phase 4** — Stretch: GitHub webhooks, auth, AWS migration (ECR, ECS Fargate, ALB, RDS)

---

## Required Software (Install Before Anything Else)

Everyone on the team needs these regardless of role:

| Tool | Install |
|---|---|
| Git | [git-scm.com](https://git-scm.com) |
| Docker Desktop | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| VS Code | [code.visualstudio.com](https://code.visualstudio.com) |
| Python 3.11+ | [python.org/downloads](https://www.python.org/downloads) |
| Node.js 18+ | [nodejs.org](https://nodejs.org) |

Then check your component's README for role-specific packages.

---

## Git Workflow

Branch off `main` for every piece of work. Keep branches scoped to your component.

```bash
# Create your branch
git checkout -b yourname/what-youre-building

# Stage and commit your work
git add .
git commit -m "short description of what you did"

# Push and open a pull request
git push origin yourname/what-youre-building
```

Open a pull request on GitHub when you're ready for review. Don't push directly to `main`.

---

## Further Reading

- `/api/README.md` — Role 1 setup and tasks
- `/build-service/README.md` — Role 2 setup and tasks
- `/infra/README.md` — Role 3 setup and tasks
- `/dashboard/README.md` — Roles 4, 5, and 6 setup and tasks
- `/tests/README.md` — How to run the test suite
