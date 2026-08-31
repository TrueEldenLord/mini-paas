# Project Phases — Self-Hosted Mini PaaS

## Timeline Overview

| Phase | Target Completion | Time Given |
|---|---|---|
| Phase 1 — Manual Proof of Concept | September 5 | ~1 week |
| Phase 2 — Full Automation | October 17 | 6 weeks |
| Phase 3 — Testing | October 31 | 2 weeks |
| Polish & Buffer | November 7 | 1 week |
| Phase 4 — Stretch Goals (if time allows) | November 14 | 1 week |

---

## Phase 1 — Manual Proof of Concept
> Goal: Get a hello world app running at `test.localhost` in a browser — manually, no automation.
> Target: **September 5**
> Alex and Gabe work in parallel to finish this fast.

| Task | Owner | Status |
|---|---|---|
| Write hello world app + Dockerfile | Alex | Not started |
| Manually `docker build` the image | Alex | Not started |
| Set up Docker Compose + Traefik | Gabe | Not started |
| Manually `docker run` the container | Gabe | Not started |
| Verify app loads at `test.localhost` | Everyone | Not started |

---

## Phase 2 — Full Automation
> Goal: One-click deploys via the API, live status updates, and a working React dashboard.
> Target: **October 17**
> Frontend team starts UI work in parallel during Phase 1 using hardcoded data.

### Backend

| Task | Owner | Status |
|---|---|---|
| FastAPI app + endpoints (POST /deployments, GET /deployments, GET /deployments/{id}) | Endri | In progress |
| PostgreSQL schema — deployment table (id, repo_url, status, created_at, container_id, public_url) | Endri | In progress |
| Request validation and error responses | Endri | In progress |
| git clone repo into temp dir + docker build via Python SDK | Alex | Not started |
| Push built image to registry + update deployment status | Alex | Not started |
| Capture and store build logs | Alex | Not started |
| Run Docker Swarm services from built image | Gabe | Not started |
| Attach Traefik labels for {deployment-id}.localhost routing | Gabe | Not started |
| Tear down containers on deployment delete | Gabe | Not started |

### Frontend — Can start now (Phase 1 does not block this)

| Task | Owner | Status |
|---|---|---|
| React + Vite project setup | Will | Not started |
| Zustand state management setup | Will | Not started |
| Central API client (axios, placeholder URLs) | Will | Not started |
| `.env` config for API base URL + polling interval | Will | Not started |
| Deployment list page UI — creative freedom on design | Kayla | Not started |
| Submit form UI — repo URL input | Kayla | Not started |
| React Router navigation setup | Kayla | Not started |
| Polling API every few seconds to refresh list | Kayla | Not started |
| Per-deployment detail page UI — creative freedom on design | Richelle | Not started |
| Auto-scrolling log display component | Richelle | Not started |
| Status indicator (queued / building / running / failed) | Richelle | Not started |
| Polling for live updates on detail page | Richelle | Not started |
| Swap hardcoded data for real API calls (after Endri's API is live) | Will, Kayla, Richelle | Not started |

---

## Phase 3 — Testing
> Goal: Unit, integration, and end-to-end tests covering the full pipeline.
> Target: **October 31**

| Task | Owner | Status |
|---|---|---|
| Unit tests — mock Docker/git, test API validation and status transitions | Everyone | Not started |
| Integration test — Docker Compose full stack, one real deployment | Everyone | Not started |
| E2E test — HTTP request to deployed app URL, assert 200 response | Everyone | Not started |

---

## Phase 4 — Stretch Goals
> Only after Phase 2 and 3 are solid.
> Target: **November 14**

| Task | Owner | Status |
|---|---|---|
| GitHub webhook support — auto-redeploy on push | TBD | Not started |
| Auth / user accounts | TBD | Not started |
| AWS migration — ECR, ECS Fargate, ALB, RDS | TBD | Not started |
| Chaos test — kill container mid-demo, confirm dashboard updates | TBD | Not started |
