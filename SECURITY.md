<!-- markdownlint-disable MD013 -->

# Security Policy

## Supported Versions

| Version                | Supported |
| ---------------------- | --------- |
| Latest (`main` branch) | ✅ Yes    |
| Any previous release   | ❌ No     |

Only the current `main` branch receives security patches. Please ensure you are running the latest version before reporting.

---

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report them responsibly by emailing the maintainers or using GitHub's private vulnerability reporting:

### How to Report

Contact the maintainers privately through one of these channels:

| Contact       | Handle                                               |
| ------------- | ---------------------------------------------------- |
| Project Admin | [@S3DFX-CYBER](https://github.com/S3DFX-CYBER)       |
| Mentor        | [@Ayushh-Sharmaa](https://github.com/Ayushh-Sharmaa) |

Send a direct message on GitHub or reach out via the GSSoC Discord (project channel) with the subject line: **[SECURITY] NexaSphere — Vulnerability Report**.

1. Go to the **Security** tab of this repository
2. Click **"Report a vulnerability"**
3. Fill in the structured form

### What to Include

Please provide as much detail as possible:

- **Type of vulnerability** (e.g., XSS, CSRF, Auth bypass, Injection, Information disclosure)
- **Severity** (Critical / High / Medium / Low — use CVSS if possible)
- **Affected component** (file path, endpoint, or feature name)
- **Steps to reproduce** (detailed, reproducible steps)
- **Proof of concept** (code, screenshots, or video)
- **Impact** (what an attacker could do if this is exploited)
- **Suggested fix** (optional but appreciated)

### Severity Definitions

| Severity | Description |
| ---------- | ------------- |
| **Critical** | Remote code execution, full auth bypass, mass data exfiltration |
| **High** | Privilege escalation, significant data exposure, CSRF on critical actions |
| **Medium** | Limited data exposure, stored XSS, missing rate limiting |
| **Low** | Information disclosure, minor logic flaws |

## Response Timeline

| Milestone                              | Target                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| Acknowledgement of report              | Within **48 hours**                                                         |
| Initial assessment and severity rating | Within **5 business days**                                                  |
| Fix deployed to `main`                 | Depends on severity (Critical: 72h, High: 1 week, Medium/Low: next release) |
| Public disclosure                      | After fix is confirmed deployed                                             |

We follow a **coordinated disclosure** policy. We will credit the reporter in the changelog unless they prefer to remain anonymous.

---

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix timeline**: Depends on severity (Critical: 24–72h, High: 1 week, Medium/Low: next release)

## Scope

In scope:

- NexaSphere website frontend
- Admin dashboard
- Backend API (Express.js)
- Authentication and session management
- File upload endpoints
- Database query logic

Out of scope:

- Third-party services (Supabase, Vercel, Render)
- Social engineering attacks
- DoS via overwhelming legitimate traffic

## Bug Bounty

This is an open-source community project and does not currently offer monetary bug bounties.
However, security contributors will be credited in the release notes and CONTRIBUTORS file.

## Credits

- **Never commit secrets** — no API keys, passwords, or tokens in code (use `.env` files)
- **Validate all inputs** — use Zod schemas on the backend for every external input
- **Keep dependencies updated** — run `npm audit` and address high/critical advisories
- **Follow least-privilege** — request only the permissions your code needs
- **Use parameterised queries** — never concatenate user input into SQL strings

---

## Admin Session Architecture

NexaSphere uses a **shared Redis session store** to manage administrative
authentication across multiple backend services (Java Spring Boot and Node.js
Express). This eliminates the need for cross-service HTTP calls and enables
horizontal scaling.

### How It Works

```text
┌──────────────────┐     ┌──────────────────┐
│  Java Backend    │     │  Node.js Backend  │
│  (Spring Boot)   │     │  (Express)        │
│                  │     │                   │
│  TokenService    │     │  adminAuthMiddle- │
│  .createSession()│────▶│  ware.requireAdmin│
│  .validate()     │     │  ()               │
│  .revoke()       │     │                   │
└────────┬─────────┘     └────────┬──────────┘
         │                        │
         │   ┌──────────────┐     │
         └──▶│  Shared      │◀────┘
             │  Redis       │
             │  Instance    │
             └──────────────┘
```

### Session Key Namespace

Sessions are stored under the Redis key pattern:

```text
session:admin:{sha256_hash_of_token}
```

- **Raw tokens are never stored in Redis.** Only the SHA-256 hash of the bearer
  token is used as the key, preventing token exposure even if the Redis instance
  is compromised.
- The value is a JSON string containing the session metadata:

```json
{
  "token": "<sha256_hash>",
  "email": "admin@example.com",
  "createdAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-01-01T08:00:00Z"
}
```

### Session Lifecycle

| Event          | Action                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| **Login**      | A new key is written to Redis with an 8-hour TTL. Node.js backend also writes to PostgreSQL for audit. |
| **Validation** | Both services compute `SHA-256(token)` and perform a Redis `GET`. No cross-service HTTP calls.         |
| **Logout**     | The Redis key is deleted immediately (`DEL`), revoking the session. PostgreSQL is updated for audit.   |
| **Expiry**     | Redis TTL automatically evicts expired keys. No scheduled cleanup tasks are required.                  |

### Configuration

The following environment variables configure the Redis connection:

| Variable         | Default                  | Description                         |
| ---------------- | ------------------------ | ----------------------------------- |
| `REDIS_HOST`     | `localhost`              | Redis server hostname               |
| `REDIS_PORT`     | `6379`                   | Redis server port                   |
| `REDIS_PASSWORD` | _(empty)_                | Redis AUTH password                 |
| `REDIS_URL`      | `redis://localhost:6379` | Full Redis connection URL (Node.js) |

### Security Considerations

- **Token hashing**: All tokens are SHA-256 hashed before being used as Redis
  keys. Raw bearer tokens never persist on disk or in Redis.
- **TTL enforcement**: Sessions auto-expire after 8 hours via Redis TTL, even
  if explicit logout is not performed.
- **Immediate revocation**: Admin logout deletes the Redis key synchronously,
  ensuring the session is revoked across all services immediately.
- **Dual storage**: PostgreSQL retains a full audit trail of admin sessions
  (creation, last-seen, revocation timestamps). Redis serves only as the
  fast-path validation layer.
- **Graceful degradation**: If Redis is unreachable during login, the
  PostgreSQL session is still created. Validation will fail gracefully with a
  500 status until Redis connectivity is restored.
Only the latest version of this project is currently supported with security updates. Please ensure you are running the most recent release before reporting any issues.

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please do **NOT** open a public issue. Instead, report the vulnerability by emailing the maintainers directly.

Please include the following details in your report:

- A description of the vulnerability and its potential impact.
- Step-by-step instructions (or a proof-of-concept script) to reproduce the behavior.
- Any potential mitigations or fixes.

We will acknowledge receipt of your report within 48 hours and work to resolve the issue as quickly as possible.
We thank the security researchers who responsibly disclose vulnerabilities to us.

## Security Patch Log

| Date | Package | Severity | Fix Applied | PR |
| ------ | --------- | ---------- | ------------- | ----- |
| 2026-06-09 | Automated scanning setup | - | Added dependency-scan.yml + dependabot.yml | #1697 |
| 2026-06-09 | Automated scanning setup | - | Added dependency-scan.yml + dependabot.yml | #1698 |

## Automated Scanning

This project uses:

- **npm audit** — runs on every push and weekly schedule
- **Dependabot** — auto-creates PRs for patch updates
- **GitHub Actions** — fails CI on critical vulnerabilities

To manually run a scan:

```bash
npm audit                    # Check vulnerabilities
npm audit fix                # Auto-fix safe patches
npm audit fix --force        # Force fix (may break things, review carefully)
```
