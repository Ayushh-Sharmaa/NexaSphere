# Security & Vulnerability Audit Guide

This guide describes the security design, mitigation strategies, and audit procedures implemented in NexaSphere to protect against critical web application vulnerabilities (OWASP Top 10), specifically Cross-Site Scripting (XSS), SQL Injection (SQLi), and broken access controls.

## 1. Cross-Site Scripting (XSS) Protection

XSS attacks occur when malicious scripts are injected into trusted web pages. NexaSphere enforces defense-in-depth across the backend and frontend.

### 1.1 Content Security Policy (CSP) & HTTP Headers

We use `helmet` in the Express gateway (`server/index.js`) to set secure HTTP headers:

- **X-Frame-Options**: Set to `DENY` to prevent clickjacking/frame-hijacking.
- **X-Content-Type-Options**: Set to `nosniff` to prevent MIME-type sniffing.
- **Content-Security-Policy (CSP)**: Strict rules restrict scripts, style sheets, and connections:
  - `default-src: ['self']` (blocks third-party scripts/assets by default).
  - `script-src: ['self']` (disallows inline scripts and external untrusted scripts).
  - `object-src: ['none']` (blocks legacy plugins like Flash).
  - `frame-ancestors: ['none']` (blocks embedding the app in iframes).

### 1.2 User Input Sanitization (Backend)

All incoming request payloads (`req.body`, `req.query`, `req.params`) are automatically sanitized using DOMPurify on the backend:

- **Library**: `isomorphic-dompurify` (v8 spec compliant).
- **Mechanism**: The global XSS middleware (`server/middleware/xssSanitizer.js`) recursively traverses payload objects and strips all HTML tags, script constructs, and Javascript attributes (`onclick`, etc.) from incoming string fields.

### 1.3 Safe Output Rendering (Frontend)

- The React client encodes strings in JSX by default (e.g. `{username}`), converting special characters (`<`, `>`, `&`, `"`, `'`) to their safe HTML entity counterparts.
- Avoid using `dangerouslySetInnerHTML` unless input has been explicitly sanitized. If required, sanitize inputs on the frontend using `dompurify`.

---

## 2. SQL Injection (SQLi) Prevention

SQL injection vulnerabilities allow attackers to execute arbitrary SQL commands on the backend database.

### 2.1 Parameterized Queries (Prepared Statements)

All repositories in `server/repositories/` must use parameterized queries when passing variables:

```javascript
// SAFE: Parameterized Query
await client.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
```

Never concatenate strings or interpolate variables directly into SQL queries:

All repositories in `server/repositories/` must use parameterized queries when passing variables:

```javascript
// SAFE: Parameterized Query
await client.query(
  'SELECT * FROM users WHERE email = $1 AND role = $2',
  [email, role]
);
```

Never concatenate strings or interpolate variables directly into SQL queries:

```javascript
// VULNERABLE: Direct string interpolation (DO NOT DO THIS)
await client.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### 2.2 Automated SQL Verification

An automated AST-based static code analysis script runs during the build pipeline to detect direct variable interpolation in `client.query` calls:

```bash
npm run audit:sql
```

An automated AST-based static code analysis script runs during the build pipeline to detect direct variable interpolation in `client.query` calls:

```bash
npm run audit:sql
```

This is executed automatically in the CI pipeline to block any PR introducing non-parameterized SQL statements.

---

## 3. Regular Security Audit Protocol

To maintain a secure posture, the project team should execute the following audit protocol:

### 3.1 Automated Scanning in CI/CD

- **Dependency Audit**: Run `npm audit` on every pull request to check for packages with known CVEs.
- **Static Analysis (SAST)**: Use automated SAST tools (e.g. SonarQube, GitHub CodeQL, ESLint security plugin) to scan codebase changes.

### 3.2 Manual Audit Checklist

Execute this check quarterly or before major release versions:

1. **Verify Middleware Placement**: Ensure `helmet`, `cors`, and `xssSanitizer` are registered before any business logic routes in `server/index.js`.
2. **Review Repository Queries**: Manually inspect all files in `server/repositories/` to ensure no raw string concatenation is present in database queries.
3. **Inspect Rate Limiters**: Verify that auth endpoints (login, registration) have strict rate limiting enabled via `express-rate-limit`.

### 3.3 Penetration Testing (Staging)

- Deploy the application to a staging environment.
- Run automated security scanners (e.g., OWASP ZAP, Nikto) against the staging API to identify missing headers, outdated configurations, or input validation weaknesses.
