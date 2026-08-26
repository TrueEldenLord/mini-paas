# Tests

**Everyone contributes here.**
**Folder:** `/tests`

Three levels of testing — unit tests for the API logic, integration tests for the full stack running together, and an end-to-end check that confirms a deployed app is actually reachable at its public URL.

---

## Test Types

### Unit Tests (Role 1 leads)
Test the API's request validation and status transitions in isolation. Mock out Docker and git calls so tests run fast without any external dependencies.

- [ ] Test `POST /deployments` with a valid repo URL → returns 201 with `status: queued`
- [ ] Test `POST /deployments` with a missing URL → returns 422
- [ ] Test `GET /deployments/{id}` with a valid ID → returns deployment record
- [ ] Test `GET /deployments/{id}` with an unknown ID → returns 404
- [ ] Test status transitions: queued → building → running, queued → building → failed

### Integration Tests (Role 2 & 3 lead)
Spin up the full stack with Docker Compose and run one real deployment against a known test repo end-to-end.

- [ ] Stack starts cleanly with `docker compose up`
- [ ] Submit a deployment via the API — a real container gets built and started
- [ ] Deployment status moves through `queued → building → running` in the database
- [ ] Container is reachable at its assigned subdomain

### End-to-End Test (Everyone)
After a successful integration test, make an HTTP request to the live URL and assert the response.

- [ ] `GET {deployment-id}.localhost` returns HTTP 200
- [ ] Response body contains expected content from the test app

---

## Setup

```bash
cd tests
python3 -m venv venv
source venv/bin/activate
pip install pytest pytest-asyncio httpx
pip freeze > requirements.txt
```

### Run unit tests

```bash
pytest tests/unit
```

### Run integration tests (requires Docker running)

```bash
docker compose -f ../infra/docker-compose.yml up -d
pytest tests/integration
```

---

## Packages

| Package | What it does |
|---|---|
| `pytest` | Test runner |
| `pytest-asyncio` | Async test support for FastAPI |
| `httpx` | HTTP client for testing API endpoints |

---

## Resources

- pytest docs: https://docs.pytest.org
- FastAPI testing guide: https://fastapi.tiangolo.com/tutorial/testing
- httpx docs: https://www.python-httpx.org
