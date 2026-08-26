# Role 1 — API & Data Layer

**Owner:** TBD
**Language:** Python 3.11+
**Folder:** `/api`

You are the hub. Every other component depends on the API contracts and database schema you define. Start here before anyone else writes code that touches the backend.

---

## Your Tasks

- [ ] Set up the FastAPI project structure
- [ ] Connect to PostgreSQL and define the deployment model
- [ ] Write and run the initial database migration
- [ ] Implement `POST /deployments` — accepts a repo URL, creates a record with status `queued`
- [ ] Implement `GET /deployments` — returns a list of all deployments
- [ ] Implement `GET /deployments/{id}` — returns one deployment's status and logs
- [ ] Add request validation using Pydantic models
- [ ] Return clean error responses (404, 422, 500)
- [ ] Document the API response shapes so the frontend team can build against them

### Deployment Record Fields
```
id            — unique identifier (UUID)
repo_url      — the submitted GitHub URL
status        — queued | building | running | failed
created_at    — timestamp
container_id  — filled in by Role 3 once running
public_url    — filled in by Role 3 once routed
logs          — build output captured by Role 2
```

---

## Setup

### 1. Install Python packages

```bash
cd api
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlmodel alembic psycopg2-binary python-dotenv
pip freeze > requirements.txt
```

### 2. Run the API locally

```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### 3. Set up the database

Make sure PostgreSQL is running (via Docker Compose in `/infra`), then:

```bash
alembic upgrade head
```

---

## Packages

| Package | What it does |
|---|---|
| `fastapi` | Web framework — defines your routes |
| `uvicorn` | ASGI server — runs the FastAPI app |
| `sqlmodel` | ORM — Python classes that map to database tables |
| `alembic` | Database migrations — tracks schema changes |
| `psycopg2-binary` | PostgreSQL driver for Python |
| `python-dotenv` | Loads `.env` config files |
| `pydantic` | Request/response validation (comes with FastAPI) |

---

## Resources

- FastAPI docs: https://fastapi.tiangolo.com
- SQLModel docs: https://sqlmodel.tiangolo.com
- Alembic tutorial: https://alembic.sqlalchemy.org/en/latest/tutorial.html
- PostgreSQL tutorial: https://www.postgresqltutorial.com
