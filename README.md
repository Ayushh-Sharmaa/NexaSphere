# NexaSphere

> The official tech community platform for GL Bajaj Group of Institutions, Mathura.
> Built by students, for students — featuring events, activities, team management, portfolios, and more.

[![CI](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml)
[![Docker Build](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/docker-ci.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/docker-ci.yml)
[![Security Scanning](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/security-scan.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/security-scan.yml)
[![CodeQL Analysis](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/codeql.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/codeql.yml)
[![Production Deployment](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/production-deployment.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/production-deployment.yml)
[![Lint Markdown](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/lint-markdown.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/lint-markdown.yml)
[![License](https://img.shields.io/github/license/Ayushh-Sharmaa/NexaSphere)](LICENSE)

---

## Table of Contents

- [✨ Stack](#-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [🔧 Troubleshooting](#-troubleshooting)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📚 Documentation](#-documentation)
- [👥 Contributors](#-contributors)
- [📄 License](#-license)

---

## ✨ Stack

| Layer                  | Technology                                               |
| ---------------------- | -------------------------------------------------------- |
| **Website (Frontend)** | React 18 + Vite 5 + React Router v6                      |
| **Admin Dashboard**    | React 18 + Vite 5                                        |
| **Backend API**        | Node.js 20 + Express 4 (ESM)                             |
| **Database**           | PostgreSQL via Supabase (JSON file fallback for offline) |
| **Real-time**          | Socket.IO                                                |
| **Emails**             | Nodemailer / Resend / SendGrid                           |
| **Auth**               | Session-based admin auth with timing-safe comparison     |
| **Deployment**         | Frontend → Vercel · Backend → Render · Docker supported  |

---

## 📁 Project Structure

```text
NexaSphere/
├── website/              # Main public website (React + Vite)
│   ├── src/
│   │   ├── assets/       # Images, fonts, icons
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── data/         # Static data (events, activities)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route-level page components
│   │   ├── shared/       # Shared UI primitives (Navbar, Footer, etc.)
│   │   ├── styles/       # Global CSS + theme tokens
│   │   └── utils/        # API client, helpers, PWA utils
│   ├── .env.example      # Required environment variables
│   ├── vite.config.js
│   └── vercel.json       # Website-specific Vercel overrides
│
├── admin-dashboard/      # Admin UI (React + Vite, separate deploy)
│   ├── src/
│   ├── .env.example
│   └── vite.config.js
│
├── server/               # Express.js REST API + Socket.IO
│   ├── config/           # DB, socket, and service config
│   ├── controllers/      # Route handler functions
│   ├── middleware/        # Auth, rate limiting, error handling
│   ├── migrations/        # Database migration files
│   ├── repositories/     # DB access layer (repository pattern)
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Helpers (Sentry, email, etc.)
│   ├── validators/       # Zod schema validators
│   ├── index.js          # Entry point
│   ├── .env.example      # All required environment variables
│   └── Dockerfile        # Production Docker image
│
├── server-python/        # FastAPI ML/AI microservice (optional)
├── server-java/          # Spring Boot alternative (experimental)
├── google-apps-script/   # Google Sheets / Forms integration scripts
├── docs/                 # Deep-dive documentation
├── e2e/                  # Playwright end-to-end tests
│
├── vercel.json           # Root Vercel config (deploys website/)
├── render.yaml           # Render config (deploys server/)
├── docker-compose.yml    # Local dev with Docker
├── package.json          # Monorepo root (npm workspaces)
└── .github/workflows/    # CI/CD GitHub Actions
```

---

## Node Version Management & Environment Setup

Consistent development environments are crucial for the stability, performance, and scaling of NexaSphere. To prevent compatibility issues among contributors, this project supports Node.js versions **v20.x (LTS)** or **v22.x (LTS)**.

### Why Node.js v20/v22 (LTS)?

- **LTS (Long Term Support) Stability**: Using LTS versions ensures the NexaSphere platform is built on a rock-solid foundation with long-term security updates.
- **Modern Runtime Features**: Node.js 20 includes native features such as the stable `fetch` API, a built-in test runner, and refined ESM (ECMAScript Modules) support, which are heavily utilized across our backend services.
- **Dependency Compatibility**: Our modern toolchain (including React 18, Vite 5, Express 4, and ESLint) is optimized and tested against Node.js 20. Running older or newer versions might result in unexpected compilation or runtime errors.
- **Production Alignment**: Since our backend is deployed on Render and Docker containers configured for Node 20, using the exact same version locally prevents environment-specific bugs.

---

### Step-by-Step Installation Guide

We recommend using **NVM (Node Version Manager)** to manage Node versions. NVM allows you to switch between different Node versions effortlessly.

#### A. macOS and Linux

1. **Install NVM**:
   Run the installation script in your terminal using either `curl` or `wget`:

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```

   _OR_

   ```bash
   wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```

2. **Load NVM into the Shell**:
   The installer script should automatically append the loading code to your profile file (such as `~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`). If it doesn't, manually append the following block:

   ```bash
   export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && echo "$HOME/.nvm" || echo "$XDG_CONFIG_HOME/nvm")"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
   ```

3. **Reload your Profile**:
   Apply the changes by running:

   ```bash
   source ~/.zshrc
   # Or for bash
   source ~/.bashrc
   ```

#### B. Windows

Windows does not natively support the UNIX `nvm` script. Instead, use **nvm-windows**:

1. **Download the Installer**:
   Go to the [nvm-windows releases page](https://github.com/coreybutler/nvm-windows/releases) and download the latest `nvm-setup.exe` installer.

2. **Run the Installer**:
   Follow the wizard to complete the installation. Ensure that the installation paths do not contain spaces to prevent issues with Node binaries.

3. **Verify Installation**:
   Open a new command prompt or PowerShell window and run:

   ```cmd
   nvm version
   ```

---

### Enforcing the Version with `.nvmrc`

NexaSphere includes a `.nvmrc` file in the root directory. When you navigate to the project root, you can configure your shell to automatically switch to the correct version, or you can do it manually.

#### Manual Switch

Run the following commands in the project root:

```bash
# Install the Node.js version specified in .nvmrc (v20)
nvm install 20

# Switch your current terminal session to Node.js v20
nvm use

# Verify that the active version is correct
node -v
```

#### Automatic Version Switching (Optional but Recommended)

You can configure your shell to automatically call `nvm use` whenever you change directories (`cd`) into a folder containing a `.nvmrc` file.

- **Zsh (~/.zshrc)**:
  Append the following function to your `~/.zshrc` file:

  ```bash
  # Place this at the end of your ~/.zshrc
  autoload -U add-zsh-hook
  load-nvmrc() {
    local nvmrc_path="$(nvm_find_nvmrc)"
    if [ -n "$nvmrc_path" ]; then
      local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
      if [ "$nvmrc_node_version" = "N/A" ]; then
        nvm install
      elif [ "$nvmrc_node_version" != "$(nvm current)" ]; then
        nvm use
      fi
    elif [ "$(nvm current)" != "$(nvm version default)" ]; then
      echo "Reverting to nvm default..."
      nvm use default
    fi
  }
  add-zsh-hook chpwd load-nvmrc
  load-nvmrc
  ```

- **Bash (~/.bashrc)**:
  Append the following block to your `~/.bashrc`:

  ```bash
  cdnvm() {
    cd "$@" || return
    if [ -f .nvmrc ]; then
      nvm use
    fi
  }
  alias cd="cdnvm"
  ```

---

### Alternative: FNM (Fast Node Manager)

If you find NVM slow during shell startup, you can use **FNM**, a fast, Rust-based alternative:

1. **Installation**:
   - macOS (via Homebrew): `brew install fnm`
   - Linux/macOS (via Curl): `curl -fsSL https://fnm.vercel.app/install | bash`
   - Windows (via Scoop): `scoop install fnm`

2. **Shell Integration**:
   Add the following to your shell profile configuration (`~/.zshrc`, `~/.bashrc`, or PowerShell profile):

   ```bash
   eval "$(fnm env --use-on-cd)"
   ```

   This automatically checks for the `.nvmrc` file and switches the version seamlessly whenever you navigate into the project directory.

---

### Troubleshooting & Common Errors

#### 1. `command not found: nvm`

This occurs when NVM is installed, but your shell profile has not been reloaded or does not load NVM automatically.

- **Fix**: Verify that your profile file (`~/.zshrc` for Zsh or `~/.bash_profile` / `~/.bashrc` for Bash) contains the NVM loading script. Then run `source ~/.zshrc` or `source ~/.bashrc` to reload.

#### 2. `nvm use` fails with "N/A version is not installed"

This happens if you run `nvm use` but haven't installed Node v20 locally.

- **Fix**: Run `nvm install 20` first, then run `nvm use`.

#### 3. Windows PowerShell Execution Policy Error

In PowerShell, running NVM or executing global node scripts may fail due to restricted execution policies.

- **Fix**: Run PowerShell as an Administrator and execute:

  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

#### 4. Permission Denied (`EACCES` or `EPERM`)

If you find yourself needing to run `sudo npm install`, **stop immediately**. Using `sudo` causes permission mismatches on your project directories.

- **Fix**: Since NVM installs Node.js and global packages under your user directory (`~/.nvm`), it completely avoids permission issues. Discard the `sudo` command and simply run `npm install` inside the project root with the NVM-managed Node runtime active.

#### 5. Native Module Compilation Failures (node-gyp)

Some dependencies compile native C/C++ code. If compilation fails:

- **macOS Fix**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux Fix**: Install development tools: `sudo apt install build-essential`
- **Windows Fix**: Run `npm install --global --production windows-build-tools` from an elevated PowerShell command.

---

## 🚀 Quick Start

> **3 steps to get NexaSphere running locally.**

### Node Version Management

To ensure consistency across development, testing, and production environments, NexaSphere strictly enforces the use of **Node.js v20 (LTS)**. Standardizing on Node v20 allows the development team to leverage modern V8 engine optimizations, stable ESM support, native fetch APIs, and consistent execution across our monorepo's React/Vite frontend and Node/Express backend runtimes. This prevents the classic "works on my machine" bugs caused by minor version differences or deprecated APIs.

We use **NVM (Node Version Manager)** to manage multiple active Node.js versions. A `.nvmrc` file is located in the project root to automate Node version selection.

#### 📦 Installing NVM (macOS / Linux)

On macOS and Linux, you can install the official POSIX-compliant NVM via cURL or Wget:

```bash
# Install via cURL
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Or install via Wget
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

After the installation script finishes, reload your shell configuration by running `source ~/.zshrc` (or `source ~/.bashrc` depending on your active shell), or restart your terminal.

Verify the installation by querying the NVM version:

```bash
nvm --version
```

#### 🪟 Installing NVM on Windows (nvm-windows)

Since NVM does not officially support Windows, developers on Windows should use the [nvm-windows](https://github.com/coreybutler/nvm-windows) utility:

1. **Uninstall Existing Node.js Versions**: Before installing, uninstall any existing standalone Node.js installations to prevent PATH environment conflicts. Delete any residual folders like `C:\Program Files\nodejs` or `%APPDATA%\npm`.
2. **Download the Installer**: Visit the [nvm-windows releases page](https://github.com/coreybutler/nvm-windows/releases), download the latest `nvm-setup.exe` installer, and run it.
3. **Verify Installation**: Open a new Command Prompt or PowerShell window as Administrator and run:

   ```cmd
   nvm version
   ```

#### 🚀 Activating the Project Node Version

Once NVM is successfully installed, navigate to the NexaSphere repository root and run the following commands to install and switch to Node v20:

```bash
# 1. Install Node.js v20 (reads the version defined in .nvmrc)
nvm install 20

# 2. Switch the current shell to Node.js v20
nvm use
```

If you have NVM installed, running `nvm use` in the repository root will automatically detect the `.nvmrc` file and switch to the correct version.

#### 🔧 Troubleshooting Common Setup Issues

- **Error: `command not found: nvm` (macOS/Linux)**
  This occurs when your shell profile script does not export the path variables. Ensure the following configuration is appended to your shell configuration file (`~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`):

  ```bash
  export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && echo "$HOME/.nvm" || echo "$XDG_CONFIG_HOME/nvm")"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
  ```

  After adding the lines, run `source ~/.zshrc` to reload.

- **Error: `nvm is not recognized as an internal or external command` (Windows)**
  Make sure you closed and reopened your terminal emulator (Command Prompt, PowerShell, or Git Bash) after installing `nvm-windows`. If the error persists, check your User and System environment variables to verify that the `NVM_HOME` and `NVM_SYMLINK` paths have been set correctly.

- **Version Mismatch or Symlink Errors (Windows)**
  If running `nvm use 20` outputs a success message but `node -v` still shows a different version, it means an old Node.js installation is shadowing the NVM symlink in your system's `PATH`. Ensure the NVM directories in your environment variables are placed higher than any other Node.js references.

- **Download Failures or Network Timeout (Global)**
  If downloading Node.js through NVM fails due to network restrictions or firewalls, you can configure NVM to use official mirrors:

  ```bash
  # For macOS/Linux
  export NVM_NODEJS_ORG_MIRROR=https://nodejs.org/dist
  
  # For Windows (cmd)
  nvm node_mirror https://npmmirror.com/mirrors/node/
  ```

---

## 🚀 Quick Start

> **3 steps to get NexaSphere running locally.**

### 1. Clone & Install

```bash
git clone https://github.com/Ayushh-Sharmaa/NexaSphere.git
cd NexaSphere
npm install
```

### 2. Configure Environment

```bash
cp website/.env.example website/.env.local
cp admin-dashboard/.env.example admin-dashboard/.env.local
cp server/.env.example server/.env
```

Minimum values needed in `server/.env`:

```env
PORT=8787
NODE_ENV=development
CORS_ORIGIN=http://localhost:5175,http://localhost:5001
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_EVENT_PASSWORD=YourEventPass456!
```

### 3. Run Development Servers

```bash
npm run dev:all     # Start website + admin + API together
```

Or start services individually:

| Command               | Service          | URL                            |
| --------------------- | ---------------- | ------------------------------ |
| `npm run dev:website` | Website          | <http://localhost:5175>        |
| `npm run dev:admin`   | Admin Dashboard  | <http://localhost:5001>        |
| `npm run dev:server`  | Backend API      | <http://localhost:8787>        |
| —                     | API Health Check | <http://localhost:8787/health> |
| Command                 | Service          | URL                          |
| ----------------------- | ---------------- | ---------------------------- |
| `npm run dev:website`   | Website          | <http://localhost:5175>        |
| `npm run dev:admin`     | Admin Dashboard  | <http://localhost:5001>        |
| `npm run dev:server`    | Backend API      | <http://localhost:8787>        |
| —                       | API Health Check | <http://localhost:8787/health> |

> **Tip:** The website works in **offline mode** when `VITE_API_BASE` is empty.
> All data comes from localStorage / static JSON files — no backend needed.

---

## 🔧 Troubleshooting

This section covers common issues you may encounter during setup and development.

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::8787`

**Solution:** The port is already being used by another process. You can either:

1. **Kill the process using the port:**

   ```bash
   # Find the process ID
   npx lsof -i :8787  # macOS/Linux
   # or
   netstat -ano | findstr :8787  # Windows

   # Kill the process (replace PID with actual process ID)
   kill -9 PID  # macOS/Linux
   # or
   taskkill /PID PID /F  # Windows
   ```

2. **Change the port in your `.env` file:**

   ```env
   PORT=8788  # Change to a different port
   ```

### Environment Variables Not Loading

**Error:** `VITE_API_BASE is not defined` or similar environment variable errors.

**Solution:**

1. Ensure you've copied the `.env.example` files:

   ```bash
   cp website/.env.example website/.env.local
   cp admin-dashboard/.env.example admin-dashboard/.env.local
   cp server/.env.example server/.env
   ```

2. Verify the file names are correct:
   - Website: `website/.env.local` (not `.env`)
   - Admin: `admin-dashboard/.env.local` (not `.env`)
   - Server: `server/.env`

3. Restart your development server after adding environment variables.

### CORS Errors During Development

**Error:** `Access to fetch at 'http://localhost:8787' from origin 'http://localhost:5175' has been blocked by CORS policy`

**Solution:** Ensure your `server/.env` file includes the correct `CORS_ORIGIN`:

```env
CORS_ORIGIN=http://localhost:5175,http://localhost:5001
```

Make sure the ports match your running frontend services.

### Backend API Unavailable

**Error:** `Failed to fetch` or `Network Error` when calling API endpoints.

**Solution:**

1. **Check if the server is running:**

   ```bash
   curl http://localhost:8787/health
   # or visit http://localhost:8787/health in your browser
   ```

2. **Start the server if not running:**

   ```bash
   npm run dev:server
   ```

3. **Verify the port matches your frontend configuration:**
   - Check `VITE_API_BASE` in `website/.env.local`
   - Check `PORT` in `server/.env`

### Dependencies Fail to Install

**Error:** `npm ERR! code ERESOLVE` or peer dependency conflicts.

**Solution:**

1. **Verify Node.js version:**

   ```bash
   node -v  # Should be v20.x or v22.x
   ```

2. **Clear npm cache and reinstall:**

   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json  # macOS/Linux
   # or
   Remove-Item -Recurse -Force node_modules, package-lock.json  # Windows
   npm install
   ```

3. **Use legacy peer resolver (if needed):**

   ```bash
   npm install --legacy-peer-deps
   ```

### Permission Denied Errors

**Error:** `EACCES: permission denied` when running npm commands.

**Solution:** Never use `sudo` with npm. Instead:

1. **Ensure you're using NVM-managed Node:**

   ```bash
   nvm use
   ```

2. **Fix npm permissions (if using system Node):**

   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

### Build Fails with Module Not Found

**Error:** `Module not found: Can't resolve './component'`

**Solution:**

1. **Check file paths are correct** (case-sensitive on Linux/macOS)
2. **Ensure all dependencies are installed:**

   ```bash
   npm install
   ```

3. **Clear build cache:**

   ```bash
   rm -rf dist build .vite  # macOS/Linux
   # or
   Remove-Item -Recurse -Force dist, build, .vite  # Windows
   ```

### Tests Failing Locally

**Error:** Tests pass on CI but fail locally.

**Solution:**

1. **Ensure you're on the correct Node version:**

   ```bash
   nvm use
   ```

2. **Clear test cache:**

   ```bash
   rm -rf node_modules/.vitest  # macOS/Linux
   # or
   Remove-Item -Recurse -Force node_modules\.vitest  # Windows
   ```

3. **Run tests with coverage disabled (if needed):**

   ```bash
   npm test -- --no-coverage
   ```

---

## 🧪 Testing

```bash
npm test                # Website unit tests (Vitest)
npm run test:server     # Server unit tests (Node test runner)
npx playwright test     # End-to-end tests (Playwright)
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### End-to-End Tests (Playwright)

# Seed the database with dummy data

npx prisma db seed

# Start the backend server

npm run dev

# → Runs at <http://localhost:8080>

```bash
# Run E2E tests
npm run e2e

# Run E2E tests in debug mode
npm run e2e:debug
```

### Linting & Formatting

```bash
# Lint the codebase
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

```

---

## 🚢 Deployment

| Target            | Config File          | Notes                                          |
| ----------------- | -------------------- | ---------------------------------------------- |
| Vercel (frontend) | `vercel.json`        | Connect repo, set `VITE_API_BASE` env var      |
| Render (backend)  | `render.yaml`        | Set `sync: false` env vars in Render dashboard |
| Docker (backend)  | `server/Dockerfile`  | `docker build -t nexasphere-api ./server`      |
| Docker Compose    | `docker-compose.yml` | `docker-compose up --build`                    |
| Target              | Config File       | Notes                                              |
| ------------------- | ----------------- | -------------------------------------------------- |
| Vercel (frontend)   | `vercel.json`     | Connect repo, set `VITE_API_BASE` env var          |
| Render (backend)    | `render.yaml`     | Set `sync: false` env vars in Render dashboard     |
| Docker (backend)    | `server/Dockerfile` | `docker build -t nexasphere-api ./server`        |
| Docker Compose      | `docker-compose.yml` | `docker-compose up --build`                     |

For full deployment instructions see [docs/deployment.md](docs/deployment.md).

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.
See [CONTRIBUTING.md](docs/community/CONTRIBUTING.md) for guidelines.

This project is part of **GSSoC 2026** — check the open issues for tasks labelled `good first issue`.

---

## 📚 Documentation

Deep-dive references live in the [`/docs`](docs/) directory:

| Document                                                   | Description                                      |
| ---------------------------------------------------------- | ------------------------------------------------ |
| [docs/architecture.md](docs/architecture.md)               | System architecture & component overview         |
| [docs/api-reference.md](docs/api-reference.md)             | REST API endpoint reference                      |
| [docs/deployment.md](docs/deployment.md)                   | Full deployment guide (Vercel / Render / Docker) |
| [docs/database-backups.md](docs/database-backups.md)       | Database backup & restore procedures             |
| [docs/DATABASE_MIGRATIONS.md](docs/DATABASE_MIGRATIONS.md) | Running & writing DB migrations                  |
| [Swagger API Docs](http://localhost:8787/api-docs)         | Interactive API documentation (run server first) |

---

## Future Improvments

- [x] API Swagger documentation — available at `/api-docs` when server is running

## 👥 Contributors

Thanks to all contributors ❤️

[![Contributors](https://contrib.rocks/image?repo=Ayushh-Sharmaa/NexaSphere)](https://github.com/Ayushh-Sharmaa/NexaSphere/graphs/contributors)
| Document                                            | Description                              |
| --------------------------------------------------- | ---------------------------------------- |
| [docs/architecture.md](docs/architecture.md)        | System architecture & component overview |
| [docs/api-reference.md](docs/api-reference.md)      | REST API endpoint reference              |
| [docs/deployment.md](docs/deployment.md)            | Full deployment guide (Vercel / Render / Docker) |
| [docs/database-backups.md](docs/database-backups.md) | Database backup & restore procedures    |
| [docs/DATABASE_MIGRATIONS.md](docs/DATABASE_MIGRATIONS.md) | Running & writing DB migrations   |

---

## 📄 License

[MIT](LICENSE) © NexaSphere Core Team
ADMIN_EMAIL=your-admin-email@yourdomain.com
ADMIN_PASSWORD=your-strong-admin-password
## Troubleshooting

### Installation fails
- Ensure you are using the supported Node.js version.
- Run `npm install` or `npm ci`.
- Delete `node_modules` and reinstall dependencies if necessary.

### Environment variables not loading
- Verify that a `.env` file exists.
- Ensure all required variables are defined.
- Restart the development server after making changes.

## FAQ

### How do I start the project?
Run:

```bash
npm install
npm run dev
```

### How do I report a bug?

Please open a GitHub issue with reproduction steps and relevant logs.
