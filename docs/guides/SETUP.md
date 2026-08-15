# NexaSphere — Local Development Setup Guide

> A step-by-step guide to getting NexaSphere running on your machine, including troubleshooting for common issues.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Fork & Clone](#2-fork--clone)
3. [Frontend Setup](#3-frontend-setup)
4. [Backend Setup](#4-backend-setup)
5. [Database Setup](#5-database-setup)
6. [Environment Variables Explained](#6-environment-variables-explained)
7. [Running the Full Stack](#7-running-the-full-stack)
8. [Optional Services](#8-optional-services)
9. [Troubleshooting](#9-troubleshooting)
10. [Verifying Your Setup](#10-verifying-your-setup)

---

## 1. Prerequisites

Install and verify these tools before starting:

### Node.js & npm

```bash
node -v   # Recommended: v20.x or v22.x
npm -v    # Must be >= 10.0.0
```

Download from [nodejs.org](https://nodejs.org/) — use the **LTS** version.  
We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions. The repo includes `.nvmrc` with the pinned version:

```bash
nvm install   # Reads .nvmrc automatically
nvm use
```

### PostgreSQL

```bash
psql --version   # Must be >= 14
```

**macOS:** `brew install postgresql@16`  
**Ubuntu/Debian:** `sudo apt install postgresql postgresql-contrib`  
**Windows:** Download the installer from [postgresql.org](https://www.postgresql.org/download/windows/)

### Git

```bash
git --version   # Any recent version
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## 2. Fork & Clone

1. **Fork** the repository on GitHub: click **Fork** at the top-right of the repo page
2. **Clone** your fork:

```bash
git clone https://github.com/<your-username>/NexaSphere-GSSOc.git
cd NexaSphere-GSSOc
```

1. **Add the upstream remote** so you can sync with the original repo:

```bash
git remote add upstream https://github.com/Piyush025s07/NexaSphere-GSSOc.git

# Verify remotes
git remote -v
# origin    https://github.com/<you>/NexaSphere-GSSOc.git (fetch)
# upstream  https://github.com/Piyush025s07/NexaSphere-GSSOc.git (fetch)
```

---

## 3. Frontend Setup

```bash
# Make sure you are in the repo root (not server/)
cd NexaSphere-GSSOc

# Install all frontend dependencies
npm install

# Verify Husky was installed (you should see .husky/ hooks)
ls .husky/
```

### Configure Frontend Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and set **at minimum** these two values for local development:

```env
VITE_APP_URL=http://localhost:5175
VITE_API_BASE=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

You can leave `VITE_GEMINI_API_KEY`, `VITE_SENTRY_DSN`, and `VITE_TURNSTILE_SITE_KEY` empty unless your issue specifically requires those features.

### Start the Frontend Dev Server

```bash
npm run dev
```

Expected output:

```
  VITE v5.x.x  ready in 400ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: http://192.168.x.x:5175/
```

Open [http://localhost:5175](http://localhost:5175) in your browser.

---

## 4. Backend Setup

Open a **new terminal window** — keep the frontend running in the first one.

```bash
cd NexaSphere-GSSOc/server

# Install backend dependencies separately
npm install
```

### Configure Backend Environment

```bash
cp .env.example .env
```

Open `server/.env` and fill in:

```env
# Required — your local database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nexasphere

# Required — what origins the server accepts
CORS_ORIGIN=http://localhost:5175

# Optional for basic development — leave blank if not using these features
SENDGRID_API_KEY=
SENTRY_DSN=
```

For Firebase authentication, you'll need a service account key — see [Optional Services](#8-optional-services).

---

## 5. Database Setup

### Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE nexasphere;

# Exit psql
\q
```

### Run Migrations

```bash
cd NexaSphere-GSSOc/server

# Apply all pending migrations
npm run migrate:latest
```

Expected output:

```
> node-pg-migrate -f .postgres_migrations_config.json up
...
Migrations complete!
```

### Seed Data (Optional)

If the issue you're working on requires sample data:

```bash
# From server/
psql -U postgres -d nexasphere -f supabase-schema.sql
psql -U postgres -d nexasphere -f seed_recommendation_data.sql
```

---

## 6. Environment Variables Explained

### Frontend Variables (`.env.local`)

| Variable                  | Example Value               | What it does                           |
| ------------------------- | --------------------------- | -------------------------------------- |
| `VITE_APP_URL`            | `http://localhost:5175`     | The URL the frontend is served from    |
| `VITE_API_BASE`           | `http://localhost:8080`     | Where the Express backend is running   |
| `VITE_AI_API_BASE`        | `http://localhost:8000`     | Python AI microservice (optional)      |
| `VITE_SOCKET_URL`         | `http://localhost:8080`     | Socket.io server URL                   |
| `VITE_SOCKET_PATH`        | `/socket.io`                | Socket.io mount path                   |
| `VITE_GEMINI_API_KEY`     | `AIza...`                   | Google Generative AI key (AI features) |
| `VITE_SENTRY_DSN`         | `https://...@sentry.io/...` | Sentry frontend error tracking         |
| `VITE_TURNSTILE_SITE_KEY` | `0x4AAA...`                 | Cloudflare Turnstile CAPTCHA           |
| `VITE_BASE_PATH`          | `/` or `/NexaSphere/`       | Base URL path for deployment           |

### Backend Variables (`server/.env`)

| Variable                | Example Value                                      | What it does                         |
| ----------------------- | -------------------------------------------------- | ------------------------------------ |
| `DATABASE_URL`          | `postgresql://user:pass@localhost:5432/nexasphere` | PostgreSQL connection                |
| `PORT`                  | `8080`                                             | Server listening port (default 8080) |
| `CORS_ORIGIN`           | `http://localhost:5175`                            | Comma-separated allowed origins      |
| `FIREBASE_PROJECT_ID`   | `nexasphere-xxx`                                   | Firebase project ID                  |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxx@...`                        | Firebase service account email       |
| `FIREBASE_PRIVATE_KEY`  | `paste-your-firebase-private-key-here`              | Firebase service account private key |
| `SENDGRID_API_KEY`      | `SG.xxx`                                           | SendGrid email API key               |
| `SENTRY_DSN`            | `https://...@sentry.io/...`                        | Sentry backend error tracking        |

> ⚠️ **Never commit `.env` or `.env.local` files.** They are already in `.gitignore`.

---

## 7. Running the Full Stack

You need **two terminal windows** running simultaneously:

**Terminal 1 — Frontend:**

```bash
cd NexaSphere-GSSOc
npm run dev
# → http://localhost:5175
```

**Terminal 2 — Backend:**

```bash
cd NexaSphere-GSSOc/server
npm run dev
# → http://localhost:8080
```

The Vite dev server proxies `/api/*` requests from port 5175 to port 8080 automatically — no CORS configuration needed in development.

---

## 8. Optional Services

### Firebase Authentication

Required only if you're working on admin features or authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your project → Project Settings → Service Accounts
2. Click **Generate New Private Key** — download the JSON file
3. Extract these values into `server/.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (wrap the multi-line key in double quotes, replace newlines with `\n`)

### Google Generative AI (Gemini)

Required only for AI features (roadmap builder, resume analyser):

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `.env.local`: `VITE_GEMINI_API_KEY=your_key_here`

### Python AI Microservice

Required only for ML-based recommendation features:

```bash
cd NexaSphere-GSSOc/server-python

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python main.py
# → http://localhost:8000
```

---

## 9. Troubleshooting

### Frontend won't start: `Error: Cannot find module`

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Vite port 5175 already in use

```bash
# Kill whatever is using the port
# macOS/Linux:
lsof -ti:5175 | xargs kill -9

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 5175).OwningProcess | Stop-Process
```

### Backend: `ECONNREFUSED` when connecting to PostgreSQL

- Confirm PostgreSQL is running: `pg_isready` or `sudo systemctl status postgresql`
- Check `DATABASE_URL` format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- Make sure the database exists: `psql -U postgres -c "\l"` to list databases

### Backend: Migrations fail with `relation already exists`

```bash
# Roll back and re-apply
npm run migrate:rollback
npm run migrate:latest
```

### `CORS error` in browser console

- Ensure `CORS_ORIGIN` in `server/.env` includes `http://localhost:5175`
- Restart the backend server after changing `.env`

### Husky pre-commit hook not running

```bash
# Re-install Husky
npm run prepare
```

### ESLint errors on save not auto-fixing

- Ensure your editor uses the project's ESLint config (`eslint.config.js`)
- VS Code: install the **ESLint extension** and set `"editor.codeActionsOnSave": { "source.fixAll.eslint": true }`

### `npm run build` fails: `TypeScript errors`

The project has both `.jsx` (no TS checking) and `.tsx` (with TS) files. TS errors only affect files in `src/` that use TypeScript. Fix the specific file mentioned in the error output.

---

## 10. Verifying Your Setup

Run this checklist before opening a PR:

```bash
# 1. Frontend builds without errors
npm run build
# → Expected: "dist/" directory created, no errors

# 2. Unit tests pass
npm run test
# → Expected: all tests pass (or pre-existing failures only)

# 3. Backend starts cleanly
cd server && npm run dev
# → Expected: "Server running on port 8080" (no errors)

# 4. Migrations are up-to-date
cd server && npm run migrate:latest
# → Expected: "No migrations to run" (or applies pending ones cleanly)
```

If all four pass, your environment is set up correctly. 🎉

---

_Need more help? Ask in the issue you're working on or ping [@Ayushh-Sharmaa](https://github.com/Ayushh-Sharmaa)._
