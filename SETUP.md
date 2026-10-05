# Getting Access & Setup Guide

Follow this guide to get into the repo and set up your machine. There are instructions for both Mac and Windows.

---

## Step 1 — Create a GitHub Account (if you don't have one)

Go to **github.com** and sign up. It's free. Use your school email if you want GitHub Pro for free via the Student Developer Pack later.

---

## Step 2 — Get Invited to the Repo

You need to be added as a collaborator before you can push anything.

1. Go to your GitHub profile and copy your **GitHub username**
2. Send it to Alex
3. Alex will add you at: `github.com/TrueEldenLord/mini-paas → Settings → Collaborators → Add people`
4. You'll get an email from GitHub — **click Accept** or go to `github.com/notifications`

Once accepted you have full access to clone, push, and open pull requests.

---

## Step 3 — Install Git

Git is the only thing you need installed before you can clone the repo. Install it first, everything else comes after.

### Mac

Open **Terminal** (`Cmd + Space`, search "Terminal").

```bash
xcode-select --install
```

A popup will appear — click Install. This installs Git along with other dev tools.

Verify:
```bash
git --version
```

### Windows

Open **PowerShell** as Administrator (search "PowerShell" → right click → Run as Administrator).

Download the Git installer from: **git-scm.com/download/win**

Run the installer. When asked about the default editor, pick VS Code. Leave everything else as default.

Open a **new** PowerShell window after installing, then verify:
```powershell
git --version
```

---

## Step 4 — Clone the Repo

```bash
git clone https://github.com/TrueEldenLord/mini-paas.git
cd mini-paas
```

This downloads the full project onto your machine.

---

## Step 5 — Sign Into the Team File

Open `TEAM.md`, add your name, GitHub username, and role, then push it back:

```bash
git add TEAM.md
git commit -m "add your name"
git push
```

If this pushes without errors, Git is working and you're in the repo. ✓

---

## Step 6 — Install the Rest of the Tools

Now install everything else. You don't need all of these on day one — start with the ones your role needs.

### Mac

```bash
# Homebrew (Mac package manager — install this first)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python 3.11+
brew install python@3.11
python3 --version

# Node.js 18+
brew install node
node --version
```

**Docker Desktop** — download from: **docker.com/products/docker-desktop**
Open it after installing and wait for it to say "Docker is running".

**VS Code** — download from: **code.visualstudio.com**

---

### Windows

**Python 3.11+** — download from: **python.org/downloads**
During install, **check "Add Python to PATH"** — this is important.
```powershell
python --version
```

**Node.js 18+** — download the LTS version from: **nodejs.org**
Run the installer with defaults.
```powershell
node --version
```

**Docker Desktop** — download from: **docker.com/products/docker-desktop**
If prompted to install WSL 2, say yes and follow the steps. Open Docker Desktop and wait for "Docker is running".

**VS Code** — download from: **code.visualstudio.com**

---

## Step 7 — Run the Phase 1 Stack (Verify Everything Works)

This step confirms Docker and Traefik are working correctly on your machine.

### 1. Add `test.localhost` to your hosts file (one-time, requires your password)

**Mac:**
```bash
echo "127.0.0.1 test.localhost" | sudo tee -a /etc/hosts
```

**Windows** (run PowerShell as Administrator):
```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 test.localhost"
```

### 2. Start the stack

```bash
cd "Mini Paas/infra"
docker compose up --build
```

Wait for both containers to show as running. You'll see Flask output like `Running on http://0.0.0.0:8000`.

### 3. Verify in browser

Open **http://test.localhost** in your browser.

You should see: **"Hello from Team Helios!"**

If it loads, Phase 1 is verified on your machine. Hit `Ctrl+C` to stop.

### Troubleshooting

**"docker compose: command not found"**
Close your terminal and reopen it after installing Docker Desktop. Docker needs a fresh terminal session to be recognized.

**"http://test.localhost" shows "Safari can't find the server"**
You haven't added the hosts file entry yet. Run the command in Step 1 above.

**"404 page not found"**
The containers are running but Traefik isn't routing correctly. Run `docker compose down` then `docker compose up --build` again from the `infra/` folder.

---

## Step 8 — Go to Your Component Folder

Navigate to your role's folder and read the README inside — it has the specific packages to install and the tasks you're responsible for.

| Role | Folder |
|---|---|
| Role 1 — API & Data Layer | `/api` |
| Role 2 — Build Service | `/build-service` |
| Role 3 — Container Scheduler & Networking | `/infra` |
| Roles 4, 5, 6 — Dashboard | `/dashboard` |

---

## Troubleshooting

**"Permission denied" when pushing**
You haven't accepted the GitHub invite yet. Check your email or go to `github.com/notifications`.

**"git is not recognized" on Windows**
Git wasn't added to PATH. Reinstall and check "Add Git to PATH".

**"python is not recognized" on Windows**
Reinstall Python and check "Add Python to PATH".

**Docker says "WSL 2 not installed" on Windows**
Follow the WSL 2 install guide that Docker Desktop links to — takes about 5 minutes.

**"rejected" error when pushing**
Someone pushed to the same branch before you. You need to pull their changes before Git will let you push yours. Pick one of the options below based on your situation.

**Option 1 — You haven't started any work yet (safest)**
Just pull and you're done:
```bash
git pull
```
If this fails or you're unsure, message Alex.

**Option 2 — You have local changes you haven't committed**
Discard your local changes and pull:
```bash
git reset --hard HEAD
git pull
```
> ⚠️ This permanently deletes any uncommitted changes.

**Option 3 — You want to keep your local changes**
Stash your changes, pull, then restore:
```bash
git stash
git pull
git stash pop
```
> ⚠️ `git stash pop` can fail if the pull brought in files with the same names as your stashed changes. If you see an error, message Alex.
> Alternatively, commit your changes before pulling:
> ```bash
> git add .
> git commit -m "wip: saving changes before pull"
> git pull
> ```

**Option 4 — Nothing else worked (nuclear option)**
Reset your branch to match the remote exactly:
```bash
git reset --hard origin/<your-branch>
```
Replace `<your-branch>` with your actual branch name (e.g. `origin/alex/build-service`).
> ⚠️ This permanently deletes all uncommitted changes **and any local commits that haven't been pushed yet.**

---

## Need Help?

Message Alex or open an issue at:
`github.com/TrueEldenLord/mini-paas/issues`
