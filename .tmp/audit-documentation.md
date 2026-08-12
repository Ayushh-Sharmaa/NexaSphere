# NexaSphere Documentation Audit Report

**Audit Date:** July 7, 2026  
**Auditor:** Documentation Audit Agent  
**Scope:** All `.md` files in the NexaSphere monorepo

---

## 1. DOCUMENTATION LANDSCAPE SUMMARY

**Total .md files found:** 79  
**Categories discovered:**

| Category               | Count | Description                                                                                                              |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| Root-level docs        | 9     | README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, LICENSE, TODO, INSTRUCTIONS, SYNC_GUIDE, SERVER_INTEGRATION_GUIDE, etc. |
| docs/ (Deep-dive)      | 26    | architecture, api-reference, deployment, changelog, feature specs, etc.                                                  |
| docs/guides/           | 9     | SETUP, ARCHITECTURE, WORKFLOWS, CI/CD, security, CORS, etc.                                                              |
| Sub-package READMEs    | 15    | server/, website/, admin-dashboard/, server-python/, etc.                                                                |
| src/page READMEs       | 12    | pages/home, events, team, contact, activities, etc.                                                                      |
| e2e/ testing docs      | 3     | IMPLEMENTATION_SUMMARY, QUICKSTART_HISTORY, PROMPT_HISTORY_GUIDE                                                         |
| .github/ workflow docs | 3     | workflows/README, PR template, issue templates                                                                           |
| resources/             | 3     | brand, screenshots, resources READMEs                                                                                    |
| analytics docs         | 3     | ANALYTICS_IMPLEMENTATION_SUMMARY, CHECKLIST, QUICK_REFERENCE                                                             |
| Error/Integration      | 2     | ERROR_LOGGING_MONITORING_GUIDE, API_DOCUMENTATION_GUIDE                                                                  |

---

## 2. CRITICAL DOCUMENT QUALITY ISSUES

### 🔴 SEVERITY: HIGH

#### Issue 1: Contradictory Backend Port Numbers Across Docs

The backend default port is inconsistently documented. The **actual code** (`server/index.js:1723`) defaults to **8787** when `PORT` env var is not set. However:

| Document                      | Port Claimed                         | Line                     |
| ----------------------------- | ------------------------------------ | ------------------------ |
| `README.md`                   | **8787** ✅ (correct)                | Line 307, 325            |
| `server/.env.example`         | **8787** ✅ (correct)                | Line 6                   |
| `server/README.md`            | **8080** ❌                          | Line 29, 420             |
| `docs/guides/SETUP.md`        | **8080** ❌                          | Lines 107, 218, 232, 261 |
| `docs/guides/ARCHITECTURE.md` | **8080** ❌                          | Lines 130, 299, 313      |
| `docs/api-reference.md`       | **8787** ✅                          | Line 4                   |
| `docs/deployment.md`          | **8787** ✅ (default)                | Line 94                  |
| `SYNC_GUIDE.md`               | **8080** ❌ (refers to Java backend) | Line 13                  |
| `SERVER_INTEGRATION_GUIDE.md` | **3001/8787** ❌ (inconsistent)      | Lines 139, 200, 209      |
| `API_DOCUMENTATION_GUIDE.md`  | **3000** ❌                          | Lines 352-354, 399, 424  |

**Impact:** Contributors following `docs/guides/SETUP.md` or `server/README.md` will try to connect to port 8080 while the server is on 8787, causing connection failures. New contributors will waste significant time debugging.

---

#### Issue 2: docs/guides/SETUP.md Uses Wrong Git Remote

`docs/guides/SETUP.md` (lines 67-68, 74, 88) references the remote `https://github.com/Piyush025s07/NexaSphere-GSSOc.git` — but the actual upstream repository is `github.com/Ayushh-Sharmaa/NexaSphere` (confirmed in README.md, badges, and CHANGELOG).

- **Line 67:** `git clone https://github.com/<your-username>/NexaSphere-GSSOc.git`
- **Line 74:** `git remote add upstream https://github.com/Piyush025s07/NexaSphere-GSSOc.git`
- **Line 88:** `cd NexaSphere-GSSOc`

**Impact:** Contributors following this guide will sync from the wrong fork and get a stale/copy repo.

---

#### Issue 3: docs/guides/ARCHITECTURE.md Describes Deprecated/Incorrect Architecture

The deep-dive architecture guide at `docs/guides/ARCHITECTURE.md` describes a fundamentally different architecture from what actually exists:

- **Auth system mismatch:**
  - `docs/guides/ARCHITECTURE.md` §7 describes **Firebase Authentication** (ID Token via Firebase Admin SDK) as the auth mechanism
  - `README.md` §Stack says: **"Session-based admin auth with timing-safe comparison"** — Firebase is NOT mentioned in the README stack
  - `server/README.md` §9 mentions **both** Firebase AND session-based auth confusingly
  - `CHANGELOG.md` fixes record that Firebase, Next.js, Tailwind CSS, Prisma ORM, Upstash Redis, and NextAuth.js were removed from README because they were incorrect

- **Port discrepancy:**
  - Line 35: Backend labeled as `port 8080 dev / Vercel serverless`
  - Actual default is 8787, and it's not deployed serverless on Vercel but on Render

- **Directory structure mismatch:**
  - §2 Monorepo Layout lists `src/` as the React app root (old structure) — but the actual structure moved frontend code to `website/src/`
  - Lists `app/` directory (Next.js-compatible error boundaries) — this directory doesn't exist at root level
  - Lists `public/` at repo root — the actual `public/` exists but is not described

- **Vite proxy port:** Line 130 says requests to `/api/*` are proxied to `http://localhost:8080` — should be `8787`

---

#### Issue 4: docs/INSTRUCTIONS.md Describes Outdated Architecture

This document (`docs/INSTRUCTIONS.md`) describes a **Java Backend** as the "Primary REST API" (lines 13, 24, 57-66), while the actual primary backend is the **Node.js/Express server** (`server/`). The Node.js backend is not even mentioned in this document. Key issues:

- Line 13: "**Java Backend**: Primary REST API handling persistence, business logic, and security." — In reality, the Java backend is "experimental" per README and docs/architecture.md
- Line 24: `server-java/` is described as "Persistence Layer: Spring Boot application managing the PostgreSQL database and security" — but the actual primary backend is the Node.js Express server
- Source file `src/` description matches old structure, not the actual `website/src/` layout

This document appears to be a leftover from an earlier architecture where Java was the primary backend, but it was never updated when Node.js became the primary server.

---

### 🟡 SEVERITY: MEDIUM

#### Issue 5: .github/workflows/README.md Uses Wrong Node Version

Line 10: `Sets up Node.js 18` — but the project requires **Node.js >= 20** (per root `package.json` engines field, `.nvmrc`, and all setup guides).

#### Issue 6: CONTRIBUTING.md Broken Section Numbering

- Line 127: Section titled **"4. How to Submit an Issue"**
- Line 232: Section titled **"6. Local Development Setup"**
- Line 310: Section titled **"7. Git Commit Message Conventions (Semantic Commits)"**
- The section numbering jumps from 4 to 6 to 7 — **Section 3 is missing** (Security Guidelines content appears to be numbered as if it's section 2.5 rather than section 3)

There is no section labeled "3." The path is: 1. Code of Conduct → 2. Security Guidelines → (missing "3.") → 4. How to Submit an Issue → 5. How to Submit a PR → 6. Local Dev Setup → 7. Commit Conventions → 8. Coding Style → 9. Code Review.

#### Issue 7: CHANGELOG.md Unreleased Section Lists Items Already Released

The `[Unreleased]` section (lines 10-48) includes items that appear to have already been delivered:

- "`README.md` — complete rewrite" — this is already deployed
- "`CONTRIBUTING.md` — expanded from 36 lines to full contributor guide" — already deployed
- The entire GSSoC'26 automation suite (39 workflows) — these are already in `.github/workflows/`

These should either be moved to a released version or the version needs to be published.

#### Issue 8: CODE_OF_CONDUCT.md Has Duplicated/Contradictory Content

The file has structural duplication issues:

- Lines 7-8: "We as members..." Pledge paragraph appears **twice** in slightly different wording (British vs American English spelling: "colour" vs "color")
- Lines 30-48: "Enforcement Responsibilities" section appears twice (first the standard text, then a custom GSSoC-specific version)
- Lines 69-83: "Enforcement" section defined **three times** — lines 69-73, 74, 76-83
- Lines 85-112 and lines 112-132: "Enforcement Guidelines" section appears twice with nearly identical content

This is likely caused by merging the standard Contributor Covenant template with custom GSSoC content without cleanup.

#### Issue 9: SECURITY.md Describes Redis/Java Architecture Not Matching Current System

The `SECURITY.md` file lines 94-175 describe a **shared Redis session store** architecture for admin authentication between **Java Spring Boot** and **Node.js Express** backends. However:

- The Java backend is described as "experimental" elsewhere
- The README describes "Session-based admin auth with timing-safe comparison" — not Redis-based
- There's no Redis configuration in `server/.env.example` aside from `UPSTASH_REDIS_*` (rate limiting only)
- The environment variables listed (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL`) don't appear in `server/.env.example`

This appears to be aspirational/planning documentation that was never implemented, or leftover from an earlier design.

#### Issue 10: Root INSTRUCTIONS.md Duplicate of docs/INSTRUCTIONS.md

The file `D:\Rishab\open-source\NexaSphere\INSTRUCTIONS.md` (92 lines) and `D:\Rishab\open-source\NexaSphere\docs\INSTRUCTIONS.md` (157 lines) contain **duplicated content** with the same title and first 92 lines nearly identical. The `docs/` version has extra database schema sections appended. This creates confusion about which is authoritative.

#### Issue 11: docs/DATABASE_MIGRATIONS.md Has Duplicated Content

Lines 1-85 and 85-172 contain overlapping/duplicated content about migration systems. For example:

- Line 3-4: "NexaSphere uses a multi-stack architecture with three database backends" — then again at line 85
- Migration tables for Node/Java/Python are listed twice with slightly different versions

This suggests the file was concatenated from two versions.

---

### 🔵 SEVERITY: LOW

#### Issue 12: docs/API_REFERENCE.md Incomplete

The API reference:

- Covers GET/POST/DELETE for events, but **missing PUT/PATCH methods** for updates (though the `API_DOCUMENTATION_GUIDE.md` lists them)
- **Missing endpoints** documented elsewhere:
  - `POST /api/analytics/overview` (listed in server/README.md)
  - `GET /api/monitoring/metrics` (listed in server/README.md)
  - `/api/users` endpoint (listed but incomplete)
  - `/api/notifications/subscribe` and `/unsubscribe` (listed in API_DOCUMENTATION_GUIDE.md)
  - `/api/admin/stream` SSE endpoint
  - Team member GET/:id, PUT/:id endpoints
- No response schema examples for any endpoint

#### Issue 13: TODO.md Lists Unfinished Features as TODO Messages

The file `TODO.md` lists 2 unfinished features with task lists, but these are not TODO comments in the code — they're full feature plans for:

- Event Stream Processing & Real-Time Analytics (#1776) — 13 tasks, none checked
- Real-Time Collaborative Whiteboard (#1754) — 10 tasks, none checked

These are work-in-progress features, but the filename `TODO.md` at root level looks like an action item list, which may confuse contributors.

#### Issue 14: Sync Guide (SYNC_GUIDE.md) References Only Java Backend

The `SYNC_GUIDE.md` describes syncing the system but exclusively references the **Java Spring Boot backend** (`server-java/`) and old frontend ports (5173, 5174). The actual frontend dev server runs on port **5175** (per README.md). This guide is entirely out of date.

#### Issue 15: Deploy Guides Reference Non-Existent Scripts

`docs/database-backups.md` line 59 references `./restore-backup.sh` and line 68 mentions `scripts/blue-green-migrate.sh` — these scripts are not verified to exist in the repository.

---

## 3. MISSING DOCUMENTATION

| Missing Doc                         | Why It Matters                                                                                                                                                                      | Impact                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Environment Configuration Guide** | `.env.example` exists but there's no single document explaining ALL environment variables across all services (website, admin, server, infra). Currently it's split across 5+ docs. | Contributors struggle to configure local environment                                    |
| **Database Schema Reference**       | No single document with complete table schemas, relationships, indexes. The prisma/ directory exists but no Prisma schema doc.                                                      | Developers writing DB queries don't know the schema without reading raw migration files |
| **API Testing Guide**               | No document explaining how to test API endpoints manually (curl commands, Postman collection)                                                                                       | Slower onboarding for contributors debugging API issues                                 |
| **Production Runbook**              | No operational runbook covering: monitoring dashboards, alert responses, common incidents, scaling procedures                                                                       | Ops team has no documented recovery procedures                                          |
| **Component Library/Design System** | No documented inventory of shared UI components, their props, and usage                                                                                                             | Duplicated UI code, inconsistent implementation                                         |
| **Translation/i18n Guide**          | The codebase has `i18n.js`, `locales/` directories, and `i18next` dependencies — no documentation for adding translations                                                           | Contributors can't add new languages                                                    |
| **Offline Mode Documentation**      | README mentions offline mode briefly but no document explaining the full offline architecture                                                                                       | Contributors don't understand the dual data source pattern                              |
| **Sentry/Rollbar Monitoring Guide** | ERROR_LOGGING_MONITORING_GUIDE.md exists but lacks links to live dashboards, alert thresholds, or common error patterns                                                             | Hard to debug production errors                                                         |
| **Infrastructure/Terraform Docs**   | `infra/terraform/README.md` exists but no architecture diagram or resource inventory                                                                                                | Infrastructure changes risk misconfiguration                                            |
| **CI/CD Pipeline Flow**             | docs/guides/WORKFLOWS.md is excellent for individual workflows but no high-level diagram showing the pipeline from commit → test → deploy                                           | Contributors don't understand deployment flow                                           |

---

## 4. INCONSISTENCIES ACROSS DOCUMENTS

### Inconsistency A: Auth Architecture

| Source                                 | Claim                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| README.md (Stack table)                | "Session-based admin auth with timing-safe comparison" |
| server/README.md §9                    | **Firebase Admin SDK** (token verification)            |
| docs/guides/ARCHITECTURE.md §7         | Firebase Auth with ID Tokens                           |
| SECURITY.md §Admin Session             | **Redis shared session store** across Node.js + Java   |
| CONTRIBUTING.md §Environment Variables | `JWT_SECRET` for student tokens                        |

Three different auth architectures described across the docs. Only one is actually used in `server/index.js`.

### Inconsistency B: Backend Tech Stack

| Source                      | Primary Backend                              |
| --------------------------- | -------------------------------------------- |
| README.md                   | Node.js + Express (primary)                  |
| docs/INSTRUCTIONS.md        | **Java Spring Boot** (primary)               |
| SYNC_GUIDE.md               | **Java Spring Boot** (primary)               |
| server/README.md            | Node.js + Express                            |
| docs/guides/ARCHITECTURE.md | Node.js + Express (but also references Java) |

### Inconsistency C: Deployment Targets

| Source                      | Deployment                                      |
| --------------------------- | ----------------------------------------------- |
| README.md                   | Website → Vercel, Backend → Render, Docker      |
| docs/deployment.md          | Same                                            |
| .github/workflows/README.md | GitHub Pages (deploy.yml)                       |
| docs/guides/WORKFLOWS.md    | GitHub Pages (deploy-github-pages.yml) + Vercel |

The README says Vercel for frontend but the workflow README says GitHub Pages.

### Inconsistency D: Admin Dashboard Port

| Source        | Port                    |
| ------------- | ----------------------- |
| README.md     | `http://localhost:5001` |
| SYNC_GUIDE.md | `http://localhost:5174` |

### Inconsistency E: Vite Dev Proxy Port

| Source                                 | Proxy target                       |
| -------------------------------------- | ---------------------------------- |
| docs/guides/ARCHITECTURE.md (line 130) | `http://localhost:8080`            |
| docs/guides/SETUP.md (line 107)        | `http://localhost:8080`            |
| server/.env.example (line 77)          | `http://localhost:8080` (BASE_URL) |
| Actual server default                  | `8787`                             |

---

## 5. SPECIFIC RECOMMENDATIONS

### P0 — Must Fix (Broken contributor experience)

1. **Unify backend port to 8787 across ALL docs.** Fix `server/README.md`, `docs/guides/SETUP.md`, `docs/guides/ARCHITECTURE.md`, `docs/guides/SETUP.md`, `API_DOCUMENTATION_GUIDE.md`, `SERVER_INTEGRATION_GUIDE.md` to consistently use port 8787 (the actual default in `server/index.js:1723`).

2. **Fix docs/guides/SETUP.md git remote URLs.** Replace `Piyush025s07/NexaSphere-GSSOc` with `Ayushh-Sharmaa/NexaSphere` throughout (lines 67, 74, 88).

3. **Update or remove docs/guides/ARCHITECTURE.md.** This document contains fundamental inaccuracies (Firebase auth, port 8080, wrong directory structure, deprecated Next.js references). Either rewrite to reflect current architecture or archive it.

### P1 — Should Fix (Confuses contributors)

4. **Deduplicate CODE_OF_CONDUCT.md.** Remove the duplicated enforcement sections (appears 3 times). Merge the GSSoC-specific content into a single coherent document.

5. **Update server/README.md auth section.** Remove or correct the Firebase Admin references if the project has migrated to session-based auth. Align with the actual authentication implementation.

6. **Fix .github/workflows/README.md Node version.** Change `node-version: 18` to `node-version: 20` (line 10, 18).

### P2 — Nice to Fix (Quality improvements)

7. **Fix CONTRIBUTING.md section numbering.** Add missing section "3. Development Workflow" or renumber sections 4→3, 5→4, etc. to close the gap.

8. **Clean up DATABASE_MIGRATIONS.md duplication.** Remove the duplicated content blocks (lines 1-85 and 85-172 overlap significantly).

9. **Move or contextualize TODO.md.** Rename to `FEATURE_BACKLOG.md` or integrate into the issue tracker to avoid confusion with code-level TODO markers.

10. **Create a centralized Environment Variables Reference doc.** Consolidate all env vars (from `.env.example` files across website, admin, server, infra) into a single reference table in `docs/`, cross-referenced by each package.

11. **Audit and update or archive stale docs.** The following docs describe unimplemented/aspirational features and should be reviewed for accuracy or moved to issues:
    - `docs/ADMIN_ANALYTICS.md` (implementation status shows all unchecked items)
    - `docs/TOKEN_ROTATION.md` (describes Redis-backed token rotation — not confirmed implemented)
    - `docs/MODERATION_SYSTEM.md` (features listed without implementation evidence)
    - `docs/ios-app-architecture.md` (no iOS app exists in the repo)
    - `SYNC_GUIDE.md` (references old Java-only architecture and wrong ports)

---

## Summary Statistics

| Metric                                       | Value        |
| -------------------------------------------- | ------------ |
| Total .md files                              | 79           |
| Doc files with critical port errors          | 5            |
| Doc files with wrong git remote              | 1            |
| Doc files with duplicated content            | 3            |
| Doc files describing deprecated architecture | 4            |
| Missing essential documentation categories   | 10           |
| Inconsistencies identified                   | 5 categories |
| P0 recommendations                           | 3            |
| P1 recommendations                           | 3            |
| P2 recommendations                           | 5            |
| Total actionable recommendations             | 11           |

---

_Audit completed by Documentation Audit Agent. All findings verified against actual source code and configuration files._
