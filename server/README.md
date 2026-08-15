# NexaSphere — Backend (server/)

The `server/` directory contains the **Node.js / Express** backend API that powers NexaSphere. It handles all data persistence, real-time events, email delivery, and authentication verification.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Getting Started](#4-getting-started)
5. [API Routes](#5-api-routes)
6. [Architecture Layers](#6-architecture-layers)
7. [Database & Migrations](#7-database--migrations)
8. [Real-Time (Socket.io)](#8-real-time-socketio)
9. [Authentication](#9-authentication)
10. [Email Service](#10-email-service)
11. [Logging & Error Tracking](#11-logging--error-tracking)
12. [Testing](#12-testing)
13. [Environment Variables](#13-environment-variables)

---

## 1. Overview

- **Runtime:** Node.js `>= 20`
- **Framework:** Express 4
- **Port:** `8080` (configurable via `PORT` env var)
- **Database:** PostgreSQL (via `pg` driver + `node-pg-migrate`)
- **Auth:** Firebase Admin SDK (token verification)
- **Real-Time:** Socket.io 4
- **Validation:** Zod schemas
- **API Docs:** Swagger UI at `/api/docs` · ReDoc at `/api/redoc` · OpenAPI JSON at `/api/swagger.json`

---

## 2. Tech Stack

| Package              | Version | Purpose                       |
| -------------------- | ------- | ----------------------------- |
| `express`            | ^4.19   | HTTP framework                |
| `pg`                 | ^8.21   | PostgreSQL driver             |
| `node-pg-migrate`    | ^8.0    | Schema migration runner       |
| `socket.io`          | ^4.7    | WebSocket server              |
| `firebase-admin`     | ^12.0   | Authentication (token verify) |
| `@sendgrid/mail`     | ^8.1    | Email delivery                |
| `nodemailer`         | ^8.0    | SMTP email alternative        |
| `zod`                | ^4.4    | Request schema validation     |
| `express-validator`  | ^7.0    | Additional input validation   |
| `winston`            | ^3.11   | Structured logging            |
| `cors`               | ^2.8    | CORS header management        |
| `swagger-jsdoc`      | ^6.2    | OpenAPI spec generation       |
| `swagger-ui-express` | ^5.0    | Swagger UI serving            |
| `redoc-express`      | ^1.0    | ReDoc alternative UI          |
| `@sentry/node`       | ^7.84   | Error tracking                |

---

## 3. Directory Structure

````text
server/
├── index.js                       ← Entry point (Express app + Socket.io init)
│
├── 📂 routes/                     ← Express router definitions
│   ├── api.js                     ← Core REST API routes
│   ├── analytics.js               ← Analytics endpoints
│   ├── monitoring.js              ← Health & metrics endpoints
│   ├── documentation.js           ← Swagger UI / ReDoc serving
│   └── adminStream.js             ← SSE admin event stream
│
├── 📂 controllers/                ← Request handlers (thin layer)
│   ├── eventsController.js        ← Events CRUD handlers
│   ├── coreTeamController.js      ← Team member handlers
│   ├── activityEventsController.js← Activity log handlers
│   └── formsController.js         ← Form submission handlers
│
├── 📂 services/                   ← Business logic layer
│   ├── eventsService.js           ← Events business logic
│   ├── coreTeamService.js         ← Team business logic
│   ├── activityEventsService.js   ← Activity tracking logic
│   ├── formsService.js            ← Form processing logic
│   ├── emailService.js            ← Email dispatch (SendGrid/SMTP)
│   ├── notificationsService.js    ← In-app notification logic
│   ├── pushNotificationService.js ← Web push notifications
│   ├── eventEmitterService.js     ← Internal event bus
│   ├── sseService.js              ← Server-Sent Events management
│   └── errorTrackingService.js    ← Sentry integration
│
├── 📂 repositories/               ← Database query layer (all SQL here)
│   └── (one per domain entity)
│
├── 📂 models/                     ← Data model definitions
│
├── 📂 middleware/                 ← Express middleware
│   ├── adminAuthMiddleware.js     ← Firebase token verification
│   ├── rateLimiter.js             ← Per-IP rate limiting
│   ├── errorHandler.js            ← Centralised error formatter
│   ├── performanceMonitor.js      ← Request timing metrics
│   └── asyncHandler.js            ← Async route error boundary
│
├── 📂 schemas/                    ← Zod validation schemas
│
├── 📂 migrations/                 ← node-pg-migrate SQL files
│
├── 📂 sockets/                    ← Socket.io event handlers
│
├── 📂 swagger-docs/               ← OpenAPI YAML specification files
│
├── 📂 utils/                      ← Server-side utility functions
│
├── 📂 config/                     ← Database and app configuration
│
├── 📂 data/                       ← Static/seed data files
│
├── 📂 storage/                    ← File upload storage handling
│
├── 📂 test/                       ← Jest test files
│
├── .env.example                   ← Backend environment variable template
├── .postgres_migrations_config.json ← node-pg-migrate configuration
├── package.json                   ← Backend dependencies and scripts
├── jest.config.js                 ← Jest test configuration
├── supabase-schema.sql            ← Full database schema (reference)
└── seed_recommendation_data.sql   ← Sample data for recommendations
```text

---

## 4. Getting Started

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in DATABASE_URL, Firebase credentials, etc.

# Run database migrations
npm run migrate:latest

# Start the development server
npm run dev
# → Server running at http://localhost:8080
```text

Verify the server is running:

```bash
curl http://localhost:8080/healthz
# → { "status": "ok" }
```text

---

## 5. API Routes

### Core API (`/api`)

| Method   | Path              | Description            |
| -------- | ----------------- | ---------------------- |
| `GET`    | `/api/events`     | List all events        |
| `GET`    | `/api/events/:id` | Get event by ID        |
| `POST`   | `/api/events`     | Create event (admin)   |
| `PUT`    | `/api/events/:id` | Update event (admin)   |
| `DELETE` | `/api/events/:id` | Delete event (admin)   |
| `GET`    | `/api/team`       | List core team members |
| `GET`    | `/api/activity`   | Get activity event log |
| `POST`   | `/api/forms`      | Submit a form          |

### Analytics (`/api/analytics`)

| Method | Path                      | Description              |
| ------ | ------------------------- | ------------------------ |
| `GET`  | `/api/analytics/overview` | Dashboard overview stats |
| `GET`  | `/api/analytics/events`   | Event engagement metrics |

### Monitoring (`/api/monitoring`)

| Method | Path                      | Description         |
| ------ | ------------------------- | ------------------- |
| `GET`  | `/healthz`                | Health check        |
| `GET`  | `/api/monitoring/metrics` | Performance metrics |

### Documentation

| URL         | Description             |
| ----------- | ----------------------- |
| `/api-docs` | Interactive Swagger UI  |
| `/api/docs` | Swagger UI API documentation |
| `/api/redoc` | ReDoc API documentation |
| `/api/swagger.json` | OpenAPI JSON specification |
| `/api/swagger.yaml` | OpenAPI YAML specification |

---

## 6. Architecture Layers

Every request follows this chain — **never skip a layer**:

```text
Route → Middleware → Controller → Service → Repository → PostgreSQL
```text

### Rules

| Layer            | Rule                                                               |
| ---------------- | ------------------------------------------------------------------ |
| **Routes**       | Only define the path + HTTP method, call controller function       |
| **Controllers**  | Parse request params/body, call service, format response           |
| **Services**     | All business logic, orchestration, calls to external APIs          |
| **Repositories** | All SQL queries via `pg`. Never put SQL in controllers or services |
| **Middleware**   | Cross-cutting concerns only (auth, logging, validation)            |

### Adding a New Feature

1. Add migration: `npm run migrate:create -- add-my-table`
2. Add repository: `server/repositories/myFeatureRepository.js`
3. Add service: `server/services/myFeatureService.js`
4. Add controller: `server/controllers/myFeatureController.js`
5. Add Zod schema: `server/schemas/myFeatureSchema.js`
6. Add route: register in `server/routes/api.js`
7. Add Swagger docs: update `server/swagger-docs/`
8. Add tests: `server/test/myFeature.test.js`

---

## 7. Database & Migrations

### Configuration

Connection string is read from `DATABASE_URL` in `server/.env`.
Migration config: `server/.postgres_migrations_config.json`

```json
{
  "database-url-var": "DATABASE_URL",
  "migrations-dir": "migrations"
}
````

### Migration Commands

```bash
# Apply all pending migrations
npm run migrate:latest

# Roll back the last migration
npm run migrate:rollback

# Create a new migration file
npm run migrate:create -- <descriptive-name>
# → Creates: migrations/TIMESTAMP_descriptive-name.js
```

### Migration File Format

```js
// migrations/TIMESTAMP_add-notifications-table.js
export const up = (pgm) => {
  pgm.createTable('notifications', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'text', notNull: true },
    message: { type: 'text', notNull: true },
    read: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
};

export const down = (pgm) => {
  pgm.dropTable('notifications');
};
```

---

## 8. Real-Time (Socket.io)

Socket.io is initialised in `server/index.js` alongside the Express app.

Event handlers are registered in `server/sockets/`. Each file exports a function that receives the `io` instance:

```js
// server/sockets/notificationSocket.js
export function registerNotificationHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('subscribe:notifications', (userId) => {
      socket.join(`user:${userId}`);
    });
  });
}
```

The frontend connects via `src/utils/socketClient.js` using `VITE_SOCKET_URL`.

---

## 9. Authentication

Admin-protected routes use `server/middleware/adminAuthMiddleware.js`:

```js
// Usage in routes/api.js
import { verifyAdmin } from '../middleware/adminAuthMiddleware.js';

router.post('/events', verifyAdmin, eventsController.create);
```

The middleware:

1. Reads `Authorization: Bearer <token>` header
2. Calls `firebase-admin.auth().verifyIdToken(token)`
3. Sets `req.user` with decoded token claims
4. Returns `401` if token is missing or invalid

**Frontend:** The React app obtains a Firebase ID token client-side and attaches it to all API requests.

---

## 10. Email Service

Two email delivery options are configured:

| Provider            | Service                           | Config                                             |
| ------------------- | --------------------------------- | -------------------------------------------------- |
| **SendGrid**        | `server/services/emailService.js` | `SENDGRID_API_KEY`                                 |
| **SMTP/Nodemailer** | `server/services/emailService.js` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |

Email templates live in `server/services/templates/`.

```js
import { sendEmail } from './services/emailService.js';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to NexaSphere',
  template: 'welcome', // matches a file in services/templates/
  variables: { name: 'Alex' },
});
```

---

## 11. Logging & Error Tracking

### Winston Logger

All server-side logging uses **Winston** with structured JSON output.

```js
import { logger } from './utils/logger.js';

logger.info('Event created', { eventId: 42, userId: 'abc' });
logger.error('Database query failed', { error: err.message });
```

### Sentry

Sentry is initialised at the top of `server/index.js` using `SENTRY_DSN`. Unhandled errors are automatically captured. Use `server/services/errorTrackingService.js` for manual captures:

```js
import { captureError } from './services/errorTrackingService.js';

captureError(err, { context: 'email delivery', userId });
```

### Error Response Format

All errors pass through `server/middleware/errorHandler.js` and return:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "status": 400
}
```

---

## 12. Testing

Tests use the **Node.js built-in test runner** (`node:test`).

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch
```

Test files live in `server/test/`. Follow the naming convention: `*.test.js`.  
All `test/**/*.test.js` files are automatically discovered and executed via glob pattern.

```js
// server/test/events.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

test('GET /api/events returns array', async () => {
  // ...
});
```

---

## 13. Environment Variables

Copy `server/.env.example` to `server/.env` and fill in values:

```env
# ── Database ─────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexasphere

# ── Server ───────────────────────────────────────────────────────
PORT=8080
CORS_ORIGIN=http://localhost:5175,https://nexasphere-glbajaj.vercel.app

# ── Firebase Admin (download service account key from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="paste-your-firebase-private-key-here"

# ── Email ─────────────────────────────────────────────────────────
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
# Or use SMTP:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password

# ── Error Tracking ────────────────────────────────────────────────
SENTRY_DSN=https://xxx@oXXXXXX.ingest.sentry.io/XXXXXX
```

---

_For frontend documentation, see the [main README](../README.md)._  
_For full architecture details, see [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)._
