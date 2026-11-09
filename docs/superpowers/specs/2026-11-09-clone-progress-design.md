# Clone Progress Tracker — Design Spec

**Date:** 2026-11-09
**Feature:** Build progress tracker with elapsed timer on the Deployment Detail page

---

## Problem

When deploying a large repository (tested with ~4 GB), the deployment sits in `building` status with no visible sub-step feedback. Users cannot tell whether the build service is cloning, building the Docker image, or pushing — and have no indication the process is still alive.

---

## Goal

Show users exactly which build phase is running (Clone → Build → Push), how long it has been running, and confirm it is still active — all without adding clutter to the deployment list page.

---

## Scope

Changes are limited to three files/areas:

1. `api/models.py` + a new Alembic migration — add `sub_status` column
2. `api/main.py` — expose `sub_status` in responses; add `PATCH /deployments/{id}/sub-status`
3. `build-service/worker.py` — call the new endpoint before each phase
4. `dashboard/src/pages/DeploymentDetail.tsx` + its CSS — render the progress tracker

No changes to the deployment list page, store, or other routes.

---

## Data Model

Add a nullable `sub_status` column to the `deployments` table:

```
sub_status  String  nullable  default null
            values: cloning | building | pushing | null
```

- Set to `"cloning"` immediately before `git.Repo.clone_from()`
- Set to `"building"` immediately before `client.images.build()`
- Set to `"pushing"` immediately before `client.images.push()`
- Automatically becomes irrelevant (ignored by frontend) once `status` transitions to `running` or `failed`

A new Alembic migration adds the column. No existing data needs backfilling — `null` is the correct value for all existing rows.

---

## API Changes

### Model / response
`sub_status` is added to the `Deployment` SQLAlchemy model. All existing endpoints that return a deployment object automatically include it.

### New endpoint
```
PATCH /deployments/{id}/sub-status
Body: { "sub_status": "cloning" | "building" | "pushing" }
Auth: SERVICE_API_KEY (same as /status and /logs)
```

Returns the updated deployment object. Validates that `sub_status` is one of the three allowed values.

---

## Build Service Changes

Add a `update_sub_status(deployment_id, sub_status)` helper (mirrors the existing `update_status` helper) and call it in `process()`:

```
update_status(deployment_id, "building")   # existing
update_sub_status(deployment_id, "cloning")
clone_repo(repo_url, tmp_dir)

update_sub_status(deployment_id, "building")
build_image(tmp_dir, deployment_id)

update_sub_status(deployment_id, "pushing")
push_image(deployment_id)
```

No other logic changes. If `update_sub_status` fails, it logs a warning but does not fail the deployment.

---

## Frontend Changes

### `src/types/index.ts`
Add `sub_status: 'cloning' | 'building' | 'pushing' | null` to the `Deployment` interface.

### `src/pages/DeploymentDetail.tsx`
Add a `BuildProgress` component rendered inside the Deployment Status card, only when `deployment.status === 'building'`.

**BuildProgress props:** `subStatus: string | null`

**Component structure:**
```
[status badge — existing]

[Build Progress section — NEW, only while building]
  Step indicators: Clone → Build → Push
    - Completed steps: green circle with checkmark
    - Active step: blue circle, bold label
    - Pending steps: grey, 40% opacity
  Connector lines between steps turn green when the left step is done

  Animated indeterminate progress bar
    - Sweeps left-to-right continuously (CSS animation)
    - Communicates activity without implying a known percentage

  Elapsed timer row
    - Left: "Elapsed: Xm XXs"
    - Right: contextual hint ("Large repos may take several minutes to clone"
             during cloning, "Running Dockerfile instructions" during building,
             "Almost done" during pushing)
```

**Timer implementation:**
- `buildStartRef = useRef<number | null>(null)` — set once when status first becomes `"building"`, never reset on re-renders
- `useEffect` with `setInterval(1000)` increments a `elapsedSeconds` state counter
- Timer clears when status leaves `"building"`

### CSS
New classes added to `DeploymentDetail.css` for the progress section. Follows the existing card/section visual language (same font sizes, border radius, blue `#1e518c` accent).

---

## Step → subStatus Mapping

| `sub_status` value | Step 1 (Clone) | Step 2 (Build) | Step 3 (Push) | Hint text |
|--------------------|---------------|----------------|---------------|-----------|
| `cloning`          | active        | pending        | pending       | "Large repos may take several minutes to clone" |
| `building`         | done          | active         | pending       | "Running Dockerfile instructions" |
| `pushing`          | done          | done           | active        | "Almost done" |
| `null`             | (hide section) | —             | —             | — |

---

## What Does Not Change

- Deployment list page — no progress tracker there by design
- Cancel/delete behavior — existing button already works
- Poll interval — stays at 5s; no new API calls needed
- All other deployment fields and endpoints

---

## Files Changed

| File | Change |
|------|--------|
| `api/models.py` | Add `sub_status` column |
| `api/alembic/versions/<new>.py` | Migration: add `sub_status` |
| `api/main.py` | Add `PATCH /deployments/{id}/sub-status` endpoint |
| `build-service/worker.py` | Add `update_sub_status()` + 3 calls in `process()` |
| `dashboard/src/types/index.ts` | Add `sub_status` to `Deployment` interface |
| `dashboard/src/pages/DeploymentDetail.tsx` | Add `BuildProgress` component |
| `dashboard/src/pages/DeploymentDetail.css` | Add progress tracker styles |
