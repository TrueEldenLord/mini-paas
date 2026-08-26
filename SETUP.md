# Getting Access & Setup Guide

Follow this guide to get into the repo and set up your machine. There are instructions for both Mac and Windows.

---

## Step 1 — Get Invited to the Repo

You need to be added as a collaborator before you can push anything.

**Ask Alex (TrueEldenLord) to invite you:**
1. Go to your GitHub profile and copy your **GitHub username**
2. Send it to Alex
3. Alex will go to: `github.com/TrueEldenLord/mini-paas → Settings → Collaborators → Add people`
4. You'll get an email from GitHub — **click Accept** in that email or go to `github.com/notifications`

Once accepted, you have full access to clone, push, and open pull requests.

---

## Step 2 — Create a GitHub Account (if you don't have one)

Go to **github.com** and sign up. It's free. Use your school email if you want GitHub Pro for free via the Student Developer Pack later.

---

## Step 3 — Install Required Software

Install everything in this section before moving on.

---

### Mac

Open **Terminal** (search "Terminal" in Spotlight with `Cmd + Space`).

#### Git
```bash
xcode-select --install
```
A popup will appear — click Install. This installs Git and other dev tools.

Verify it worked:
```bash
git --version
```

#### Homebrew (Mac package manager)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Python 3.11+
```bash
brew install python@3.11
```
Verify:
```bash
python3 --version
```

#### Node.js 18+
```bash
brew install node
```
Verify:
```bash
node --version
```

#### Docker Desktop
Download and install from: **docker.com/products/docker-desktop**
Open Docker Desktop after installing and wait for it to say "Docker is running".

#### VS Code
Download from: **code.visualstudio.com**

---

### Windows

Open **PowerShell** as Administrator (search "PowerShell" → right click → Run as Administrator).

#### Git
Download the installer from: **git-scm.com/download/win**

Run the installer. When asked about the default editor, pick VS Code. Leave everything else as default.

Verify (open a new PowerShell window after installing):
```powershell
git --version
```

#### Python 3.11+
Download from: **python.org/downloads**

During install, **check the box that says "Add Python to PATH"** — this is important.

Verify:
```powershell
python --version
```

#### Node.js 18+
Download the LTS version from: **nodejs.org**

Run the installer, leave defaults. Verify:
```powershell
node --version
```

#### Docker Desktop
Download from: **docker.com/products/docker-desktop**

If prompted to install WSL 2, say yes and follow the steps. Open Docker Desktop after installing and wait for it to say "Docker is running".

#### VS Code
Download from: **code.visualstudio.com**

---

## Step 4 — Clone the Repo

After installing Git, run this in your terminal (Mac) or PowerShell (Windows):

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

If this works without errors, you're fully set up.

---

## Step 6 — Go to Your Component Folder

Navigate to your role's folder and read the README inside it — it has the specific packages you need to install and the tasks you're responsible for.

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
Git wasn't added to PATH during install. Reinstall and make sure to check "Add Git to PATH".

**"python is not recognized" on Windows**
Same issue — reinstall Python and check "Add Python to PATH".

**Docker says "WSL 2 not installed" on Windows**
Follow the WSL 2 install guide that Docker Desktop links to — it takes about 5 minutes.

**"rejected" error when pushing**
Someone else pushed since you last pulled. Run `git pull` first, then push again.

---

## Need Help?

Message Alex or open an issue on the repo at:
`github.com/TrueEldenLord/mini-paas/issues`
