# NexaSphere

> The official tech community platform for GL Bajaj Group of Institutions, Mathura.
> Built by students, for students — featuring events, activities, team management, student applications, portfolios, and more.

[![CI](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml)
[![Security Scanning](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/security-scan.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/security-scan.yml)
[![CodeQL Analysis](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/codeql.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/codeql.yml)
[![License](https://img.shields.io/github/license/Ayushh-Sharmaa/NexaSphere)](LICENSE)

---

## 📁 Repository Structure

```text
NexaSphere/
├── website/              # Student-facing web application (React + Vite)
├── admin-dashboard/      # Administrative management console (React + Vite)
├── server/               # Canonical Backend REST API + Socket.IO (Node.js + Express)
│   ├── config/           # Database, Socket, and Service configuration
│   ├── controllers/      # Route controllers and request handlers
│   ├── middleware/       # Authentication, CSRF, rate limiting, logging
│   ├── migrations/       # PostgreSQL / database migration scripts
│   ├── prisma/           # Prisma schema and generated models
│   ├── repositories/     # Data persistence and query layer
│   ├── routes/           # Express route definitions
│   ├── services/         # Core business logic services
│   ├── test/             # Comprehensive API test suite
│   ├── utils/            # Shared utilities, security, and logging
│   └── validators/       # Request validation schemas (Zod)
│
├── package.json          # Monorepo workspaces and script coordination
├── vercel.json           # Frontend production deployment configuration
├── render.yaml           # Backend production deployment configuration
└── README.md             # Project documentation
```

---

## ✨ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Website (Frontend)** | React 18, Vite 8, React Router v6, TanStack Query, Clerk Auth |
| **Admin Dashboard** | React 18, Vite 8, React Router v6, Session Authentication |
| **Server (Backend API)** | Node.js (ESM), Express 4, PostgreSQL (Supabase / Prisma), Socket.IO |
| **Testing** | Vitest (Website & Admin), Node Native Test Runner (Server) |
| **Deployment** | Vercel (`website/`), Render (`server/`) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x or v22.x LTS (refer to `.nvmrc`)
- **npm**: v10+

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Ayushh-Sharmaa/NexaSphere.git
cd NexaSphere
npm install
```

### 2. Configure Environment Variables

Create environment configuration files for the applications:

```bash
# Server configuration
cp server/.env.example server/.env

# Website configuration
cp website/.env.example website/.env.local

# Admin Dashboard configuration
cp admin-dashboard/.env.example admin-dashboard/.env.local
```

Essential environment variables in `server/.env`:

```env
PORT=8787
NODE_ENV=development
CORS_ORIGIN=http://localhost:5175,http://localhost:5001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpassword123
ADMIN_EVENT_PASSWORD=admineventpassword123
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
ENCRYPTION_KEY=12345678901234567890123456789012
```

### 3. Start Development Servers

Run all services concurrently:

```bash
npm run dev:all
```

Or run individual apps:

| Command | Application | Local URL |
| :--- | :--- | :--- |
| `npm run dev:website` | Student Website | <http://localhost:5175> |
| `npm run dev:admin` | Admin Dashboard | <http://localhost:5001> |
| `npm run dev:server` | Backend API | <http://localhost:8787> |

---

## 🧪 Testing & Validation

Run comprehensive test suites across the monorepo:

```bash
# Run all frontend tests (website & admin-dashboard)
npm test

# Run server unit and integration tests
npm run test:server

# Run code style formatting check
npm run format:check

# Run ESLint across codebase
npm run lint

# Build all applications for production verification
npm run build:all
```

---

## 🚢 Deployment

- **Website**: Configured via [`vercel.json`](vercel.json) to build `website/` and deploy from `website/dist`.
- **Backend API**: Configured via [`render.yaml`](render.yaml) to run `server/index.js` as a web service.

---

## 🤝 Contributing

Contributions from students and community members are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting pull requests.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
