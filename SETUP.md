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

## Step 7 — Go to Your Component Folder

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
Someone pushed before you. Run `git pull` first, then push again.

---

## Need Help?

Message Alex or open an issue at:
`github.com/TrueEldenLord/mini-paas/issues`
