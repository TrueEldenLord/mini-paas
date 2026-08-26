# Roles 4, 5 & 6 — React Dashboard

**Owners:** TBD (3 people)
**Language:** JavaScript / TypeScript
**Folder:** `/dashboard`

The dashboard is what users actually see and touch. It has three areas of ownership — the shared API layer (Role 6), the main deployment list and submit form (Role 4), and the per-deployment detail view (Role 5). Role 6 should set up the API client first so Roles 4 and 5 aren't blocked.

---

## Role Breakdown

### Role 6 — API Integration & Shared State
**Start here. Roles 4 and 5 depend on what you build.**

**Tasks:**
- [ ] Set up the Vite + React project (`npm create vite@latest`)
- [ ] Install and configure axios as the HTTP client
- [ ] Build a central API client module — all fetch calls live here, Roles 4 and 5 import from it
- [ ] Set up shared state with Zustand (deployment list, selected deployment)
- [ ] Define TypeScript types for the API response shapes (Deployment, Status, etc.)
- [ ] Handle loading states, errors, and retries in the API client
- [ ] Set up `.env` for the API base URL and polling interval

---

### Role 4 — Deployment List & Submit Form
**The home page — the first thing users see.**

**Tasks:**
- [ ] Build the deployment list page — shows all deployments with status badges
- [ ] Color-code status badges: queued (gray), building (yellow), running (green), failed (red)
- [ ] Build the submit form — repo URL input that calls `POST /deployments`
- [ ] Poll the API every few seconds to refresh the list automatically
- [ ] Add navigation to the detail page when a deployment is clicked

---

### Role 5 — Deployment Detail View
**The deep-dive page for a single deployment.**

**Tasks:**
- [ ] Build the per-deployment detail page
- [ ] Show current status with a clear visual indicator
- [ ] Display the full build log in a scrollable, auto-refreshing panel
- [ ] Auto-scroll the log to the bottom as new lines arrive
- [ ] Show the live URL as a clickable link when status is `running`
- [ ] Poll for updates every few seconds while status is `building`
- [ ] Handle the `failed` state with a clear error message

---

## Setup (Everyone in /dashboard)

### 1. Create the Vite + React app (Role 6 does this first)

```bash
cd dashboard
npm create vite@latest . -- --template react-ts
npm install
```

### 2. Install shared packages

```bash
npm install axios zustand react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Run the dev server

```bash
npm run dev
```

Dashboard will be at `http://localhost:5173`

---

## Packages

| Package | What it does | Who uses it |
|---|---|---|
| `axios` | HTTP client — API calls | Role 6 |
| `zustand` | Lightweight shared state | Role 6 |
| `react-router-dom` | Client-side navigation between pages | Role 6 |
| `tailwindcss` | Utility CSS — styling and layout | Roles 4 & 5 |

---

## Resources

- React docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- Zustand: https://zustand-demo.pmnd.rs
- Axios: https://axios-http.com/docs/intro
- TypeScript handbook: https://www.typescriptlang.org/docs
- Vite docs: https://vitejs.dev/guide
