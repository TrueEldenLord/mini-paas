# Clone Progress Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a 3-step progress tracker (Clone → Build → Push) with an elapsed timer on the Deployment Detail page while a build is in flight.

**Architecture:** A new nullable `sub_status` column on the deployments table is written by the build service at each phase transition. The dashboard reads it via the existing 5s poll and renders a progress tracker component — no new polling or websockets needed.

**Tech Stack:** Python/FastAPI/SQLAlchemy/Alembic (API), Python/GitPython/Docker SDK (build service), React/TypeScript/CSS (dashboard)

## Global Constraints

- `sub_status` valid values: `cloning`, `building`, `pushing` (nullable — null when not in a build)
- New API endpoint auth: `SERVICE_API_KEY` (same as `/status` and `/logs`)
- Progress tracker visible only when `deployment.status === 'building'`
- No changes to the deployment list page
- Follow existing code patterns in each file (naming, style, structure)

---

### Task 1: API — `sub_status` column, migration, endpoint

**Files:**
- Modify: `api/models.py`
- Create: `api/alembic/versions/<generated>_add_sub_status_to_deployments.py`
- Modify: `api/main.py`
- Modify: `api/test_main.py`

**Interfaces:**
- Produces: `PATCH /deployments/{id}/sub-status` — body `{"sub_status": "cloning"|"building"|"pushing"}`, auth via `X-Service-API-Key`, returns updated deployment object including `sub_status` field

---

- [ ] **Step 1: Add `sub_status` to the SQLAlchemy model**

In `api/models.py`, add one column to the `Deployment` class after the `logs` column:

```python
sub_status = Column(String, nullable=True)  # cloning | building | pushing | null
```

The full `Deployment` class should now end with:
```python
    logs = Column(String, nullable=True)
    sub_status = Column(String, nullable=True)  # cloning | building | pushing | null
```

- [ ] **Step 2: Generate and inspect the Alembic migration**

The API must be running (or DATABASE_URL must point to the running Postgres). Run from `api/`:

```bash
cd "Mini Paas/api"
source venv/bin/activate
alembic revision --autogenerate -m "add_sub_status_to_deployments"
```

Open the generated file in `alembic/versions/`. Verify `upgrade()` contains:
```python
op.add_column('deployments', sa.Column('sub_status', sa.String(), nullable=True))
```
And `downgrade()` contains:
```python
op.drop_column('deployments', 'sub_status')
```

If the auto-generated content looks correct, leave it as-is.

- [ ] **Step 3: Apply the migration to the running database**

```bash
alembic upgrade head
```

Expected output ends with: `Running upgrade 7adc721a5d56 -> <new_id>, add_sub_status_to_deployments`

- [ ] **Step 4: Write the failing API tests**

Add these tests at the bottom of `api/test_main.py`:

```python
def test_update_sub_status_valid():
    deployment_id = _create_deployment()
    for value in ("cloning", "building", "pushing"):
        response = client.patch(
            f"/deployments/{deployment_id}/sub-status",
            json={"sub_status": value},
            headers=SERVICE_HEADERS,
        )
        assert response.status_code == 200
        assert response.json()["sub_status"] == value


def test_update_sub_status_invalid():
    deployment_id = _create_deployment()
    response = client.patch(
        f"/deployments/{deployment_id}/sub-status",
        json={"sub_status": "banana"},
        headers=SERVICE_HEADERS,
    )
    assert response.status_code == 400


def test_update_sub_status_not_found():
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.patch(
        f"/deployments/{fake_id}/sub-status",
        json={"sub_status": "cloning"},
        headers=SERVICE_HEADERS,
    )
    assert response.status_code == 404


def test_update_sub_status_without_credentials():
    deployment_id = _create_deployment()
    response = client.patch(
        f"/deployments/{deployment_id}/sub-status",
        json={"sub_status": "cloning"},
    )
    assert response.status_code == 401


def test_create_deployment_includes_sub_status_field():
    response = client.post(
        "/deployments",
        json={"repo_url": "https://github.com/test/repo"},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 200
    assert "sub_status" in response.json()
    assert response.json()["sub_status"] is None
```

- [ ] **Step 5: Run tests — verify they fail**

```bash
pytest test_main.py::test_update_sub_status_valid test_main.py::test_update_sub_status_invalid test_main.py::test_update_sub_status_not_found test_main.py::test_update_sub_status_without_credentials test_main.py::test_create_deployment_includes_sub_status_field -v
```

Expected: all 5 FAIL (404 — route not found)

- [ ] **Step 6: Add the endpoint to `api/main.py`**

Add a Pydantic model after the existing `LogsUpdate` class:

```python
class SubStatusUpdate(BaseModel):
    sub_status: str
```

Add the endpoint after the existing `update_logs` endpoint:

```python
VALID_SUB_STATUSES = {"cloning", "building", "pushing"}


@app.patch("/deployments/{deployment_id}/sub-status")
def update_sub_status(
    deployment_id: uuid.UUID,
    body: SubStatusUpdate,
    db: Session = Depends(get_db),
    caller: str = Depends(get_current_caller),
):
    if body.sub_status not in VALID_SUB_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sub_status '{body.sub_status}'. Must be one of: {', '.join(VALID_SUB_STATUSES)}"
        )
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    deployment.sub_status = body.sub_status
    deployment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deployment)
    logger.info(f"Deployment {deployment.id} sub_status set to {body.sub_status}")
    return deployment
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
pytest test_main.py -v
```

Expected: all tests PASS (including the 5 new ones)

- [ ] **Step 8: Commit**

```bash
cd "Mini Paas/api"
git add models.py main.py test_main.py alembic/versions/
git commit -m "feat: add sub_status column and PATCH endpoint"
```

---

### Task 2: Build service — `update_sub_status()` and phase calls

**Files:**
- Modify: `build-service/worker.py`
- Modify: `build-service/tests/test_worker.py`

**Interfaces:**
- Consumes: `PATCH /deployments/{id}/sub-status` from Task 1
- Produces: `update_sub_status(deployment_id: str, sub_status: str) -> None`

---

- [ ] **Step 1: Write the failing tests**

Add these tests at the bottom of `build-service/tests/test_worker.py`:

```python
def test_update_sub_status_calls_correct_endpoint():
    mock_resp = MagicMock()
    with patch("worker.requests.patch", return_value=mock_resp) as mock_patch:
        worker.update_sub_status("abc-123", "cloning")
    mock_patch.assert_called_once_with(
        "http://localhost:8000/deployments/abc-123/sub-status",
        json={"sub_status": "cloning"},
        headers={"X-Service-API-Key": worker.SERVICE_API_KEY},
    )


def test_update_sub_status_sends_auth_header():
    mock_resp = MagicMock()
    with patch("worker.requests.patch", return_value=mock_resp) as mock_patch:
        worker.update_sub_status("abc-123", "building")
    _, kwargs = mock_patch.call_args
    assert kwargs["headers"]["X-Service-API-Key"] == worker.SERVICE_API_KEY


def test_process_calls_sub_status_at_each_phase():
    deployment = {"id": "deploy-123", "repo_url": "https://github.com/user/repo.git"}
    with patch("worker.update_status"), \
         patch("worker.update_sub_status") as mock_sub, \
         patch("worker.clone_repo"), \
         patch("worker.os.path.exists", return_value=True), \
         patch("worker.build_image", return_value=[]), \
         patch("worker.push_image"), \
         patch("worker.update_logs"), \
         patch("worker.shutil.rmtree"):
        worker.process(deployment)

    sub_calls = [call[0][1] for call in mock_sub.call_args_list]
    assert sub_calls == ["cloning", "building", "pushing"]


def test_process_sub_status_failure_does_not_fail_deployment():
    deployment = {"id": "deploy-123", "repo_url": "https://github.com/user/repo.git"}
    with patch("worker.update_status") as mock_status, \
         patch("worker.update_sub_status", side_effect=Exception("API down")), \
         patch("worker.clone_repo"), \
         patch("worker.os.path.exists", return_value=True), \
         patch("worker.build_image", return_value=[]), \
         patch("worker.push_image"), \
         patch("worker.update_logs"), \
         patch("worker.shutil.rmtree"):
        worker.process(deployment)

    mock_status.assert_any_call("deploy-123", "running")
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd "Mini Paas/build-service"
source venv/bin/activate
pytest tests/ -v -k "sub_status"
```

Expected: all 4 FAIL (AttributeError: module 'worker' has no attribute 'update_sub_status')

- [ ] **Step 3: Add `update_sub_status()` to `worker.py`**

Add this function after `update_logs()` in `build-service/worker.py`:

```python
def update_sub_status(deployment_id, sub_status):
    try:
        response = requests.patch(
            f"{API_URL}/deployments/{deployment_id}/sub-status",
            json={"sub_status": sub_status},
            headers=_auth_headers(),
        )
        response.raise_for_status()
    except Exception as exc:
        logger.warning(f"Deployment {deployment_id}: could not set sub_status to {sub_status}: {exc}")
```

Note: unlike `update_status` and `update_logs`, this swallows exceptions so a sub-status failure never kills the deployment.

- [ ] **Step 4: Add `update_sub_status()` calls to `process()`**

Replace the `process()` function body in `worker.py` with:

```python
def process(deployment):
    deployment_id = deployment["id"]
    repo_url = deployment["repo_url"]
    tmp_dir = f"/tmp/{deployment_id}"
    log_lines = []

    try:
        update_status(deployment_id, "building")

        update_sub_status(deployment_id, "cloning")
        clone_repo(repo_url, tmp_dir)

        if not os.path.exists(os.path.join(tmp_dir, "Dockerfile")):
            raise FileNotFoundError("No Dockerfile found at repo root")

        update_sub_status(deployment_id, "building")
        log_lines = build_image(tmp_dir, deployment_id)

        update_sub_status(deployment_id, "pushing")
        push_image(deployment_id)

        update_logs(deployment_id, "\n".join(log_lines))
        update_status(deployment_id, "running")
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
```

- [ ] **Step 5: Run all build-service tests — verify they pass**

```bash
pytest tests/ -v
```

Expected: all tests PASS. The existing `test_process_happy_path` test will now need `update_sub_status` patched — if it fails, add it to the patch list:

```python
def test_process_happy_path():
    deployment = {"id": "deploy-123", "repo_url": "https://github.com/user/repo.git"}
    with patch("worker.update_status") as mock_status, \
         patch("worker.update_sub_status"), \          # add this line
         patch("worker.clone_repo") as mock_clone, \
         ...
```

Apply the same fix to `test_process_clone_failure_marks_failed_and_cleans_up`, `test_process_no_dockerfile_marks_failed`, `test_process_build_failure_marks_failed` if they fail for the same reason.

- [ ] **Step 6: Commit**

```bash
cd "Mini Paas/build-service"
git add worker.py tests/test_worker.py
git commit -m "feat: emit sub_status at each build phase"
```

---

### Task 3: Dashboard — types, BuildProgress component, CSS

**Files:**
- Modify: `dashboard/src/types/index.ts`
- Modify: `dashboard/src/pages/DeploymentDetail.tsx`
- Modify: `dashboard/src/pages/DeploymentDetail.css`

**Interfaces:**
- Consumes: `deployment.sub_status: 'cloning' | 'building' | 'pushing' | null` from Task 1

---

- [ ] **Step 1: Add `sub_status` to the TypeScript `Deployment` interface**

In `dashboard/src/types/index.ts`, add one line to the `Deployment` interface after `logs`:

```typescript
export interface Deployment {
  id: string;
  repo_url: string;
  status: DeploymentStatus;
  created_at: string;
  updated_at: string;
  container_id: string | null;
  public_url: string | null;
  logs: string | null;
  sub_status: 'cloning' | 'building' | 'pushing' | null;
}
```

- [ ] **Step 2: Add the `BuildProgress` component to `DeploymentDetail.tsx`**

Add this component definition above the `export default function DeploymentDetail()` line in `dashboard/src/pages/DeploymentDetail.tsx`:

```tsx
const BUILD_STEPS = [
  { key: 'cloning',  label: 'Clone' },
  { key: 'building', label: 'Build' },
  { key: 'pushing',  label: 'Push'  },
] as const;

const STEP_HINTS: Record<string, string> = {
  cloning:  'Large repos may take several minutes to clone',
  building: 'Running Dockerfile instructions',
  pushing:  'Almost done',
};

function BuildProgress({ subStatus }: { subStatus: string | null }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeIndex = BUILD_STEPS.findIndex(s => s.key === subStatus);
  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, '0');
  const hint = subStatus ? STEP_HINTS[subStatus] : '';

  return (
    <div className="build-progress">
      <p className="build-progress-title">Build Progress</p>

      <div className="bp-steps">
        {BUILD_STEPS.map((step, i) => {
          const isDone   = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={step.key} className="bp-step-group">
              <div className={`bp-step ${isDone ? 'bp-step--done' : ''} ${isActive ? 'bp-step--active' : ''}`}>
                <div className="bp-circle">{isDone ? '✓' : i + 1}</div>
                <div className="bp-label">{step.label}</div>
              </div>
              {i < BUILD_STEPS.length - 1 && (
                <div className={`bp-connector ${isDone ? 'bp-connector--done' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bp-bar-wrap">
        <div className="bp-bar-fill" />
      </div>

      <div className="bp-meta">
        <span className="bp-timer">Elapsed: <strong>{minutes}m {seconds}s</strong></span>
        <span className="bp-hint">{hint}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Render `BuildProgress` inside the status card**

In `DeploymentDetail.tsx`, find the closing `</section>` of the "Deployment Status" card (after the `connectionError` block, around line 248). Insert `<BuildProgress>` just before it, so the section ends like this:

```tsx
            {connectionError && (
                <p className="connection-message">
                    API unavailable. Displaying demo data while waiting
                    for the connection.
                </p>
            )}

            {deployment.status === 'building' && (
                <BuildProgress subStatus={deployment.sub_status} />
            )}
        </section>
```

- [ ] **Step 4: Add CSS for the progress tracker**

Append the following to `dashboard/src/pages/DeploymentDetail.css`:

```css
/* ── Build Progress Tracker ── */

.build-progress {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e5eaf0;
}

.build-progress-title {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
}

.bp-steps {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
}

.bp-step-group {
    display: flex;
    align-items: center;
    flex: 1;
}

.bp-step-group:last-child {
    flex: 0;
}

.bp-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.4;
}

.bp-step--done,
.bp-step--active {
    opacity: 1;
}

.bp-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: bold;
    border: 2px solid #d1d5db;
    background: #fff;
    color: #9ca3af;
    transition: all 0.3s;
}

.bp-step--done .bp-circle {
    background: #27a65a;
    border-color: #27a65a;
    color: #fff;
}

.bp-step--active .bp-circle {
    background: #1e518c;
    border-color: #1e518c;
    color: #fff;
    box-shadow: 0 0 0 4px rgba(30, 81, 140, 0.15);
}

.bp-label {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 7px;
    font-weight: 500;
}

.bp-step--done .bp-label { color: #27a65a; }
.bp-step--active .bp-label { color: #1e518c; font-weight: 700; }

.bp-connector {
    height: 2px;
    flex: 1;
    background: #e5e7eb;
    margin-bottom: 24px;
    transition: background 0.3s;
}

.bp-connector--done {
    background: #27a65a;
}

.bp-bar-wrap {
    background: #e5eaf0;
    border-radius: 999px;
    height: 8px;
    overflow: hidden;
    margin-bottom: 12px;
}

.bp-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #1e518c, #3b82f6);
    animation: bp-sweep 1.6s ease-in-out infinite;
}

@keyframes bp-sweep {
    0%   { width: 20%; margin-left: 0%; }
    50%  { width: 45%; margin-left: 25%; }
    100% { width: 20%; margin-left: 80%; }
}

.bp-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bp-timer {
    font-size: 12px;
    color: #6b7280;
}

.bp-timer strong {
    color: #1e518c;
    font-size: 13px;
}

.bp-hint {
    font-size: 11px;
    color: #9ca3af;
    font-style: italic;
}
```

- [ ] **Step 5: Verify in the browser**

The dashboard dev server should still be running (`npm run dev`). Open a deployment that is currently in `building` status (or redeploy something small to trigger it). Verify:

1. Progress tracker appears below the status badge when status is `building`
2. Active step is highlighted blue, completed steps are green with a checkmark
3. Elapsed timer counts up and does not reset on each 5s poll
4. Tracker disappears when status changes to `running` or `failed`

If `sub_status` is `null` (build service not yet updated), all three steps will show at 40% opacity — that's correct fallback behavior.

- [ ] **Step 6: Commit**

```bash
cd "Mini Paas/dashboard"
git add src/types/index.ts src/pages/DeploymentDetail.tsx src/pages/DeploymentDetail.css
git commit -m "feat: add build progress tracker with elapsed timer"
```
