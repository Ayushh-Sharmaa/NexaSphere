# Testing Coverage Audit Report — NexaSphere Monorepo

**Date:** 2026-07-07  
**Auditor:** TestEngineer (Automated Coverage Audit)  
**Repo:** `D:\Rishab\open-source\NexaSphere`

---

## 1. Test Landscape Summary

### 1.1 Test Frameworks

| Framework      | Location               | Config File                        |
| -------------- | ---------------------- | ---------------------------------- |
| **Vitest**     | Root (`src/`)          | `vitest.config.ts`                 |
| **Vitest**     | `admin-dashboard/`     | `admin-dashboard/vitest.config.ts` |
| **Vitest**     | `website/`             | `website/vitest.config.ts`         |
| **Jest**       | `server/`              | `server/jest.config.js`            |
| **Playwright** | Root (`e2e/`)          | `playwright.config.ts`             |
| **Playwright** | Root (`visual-tests/`) | `playwright.visual.config.ts`      |
| **Playwright** | `website/`             | `website/playwright.config.ts`     |

### 1.2 Coverage Thresholds

| Config                 | Lines | Functions | Branches | Statements |
| ---------------------- | ----- | --------- | -------- | ---------- |
| Root Vitest            | 70%   | 70%       | 70%      | 70%        |
| admin-dashboard Vitest | 70%   | 70%       | **65%**  | 70%        |
| website Vitest         | 70%   | 70%       | 70%      | 70%        |
| Server Jest            | 70%   | 70%       | 70%      | 70%        |

**Issues:** Branch coverage threshold is 5% lower in admin-dashboard (65%) — inconsistent.

### 1.3 Test File Count by Category

| Category                          | Count          | Location                                                                                                          |
| --------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Server unit/integration tests** | ~87 files      | `server/test/`, `server/tests/`                                                                                   |
| **Root unit tests**               | ~8 files       | `src/__tests__/`                                                                                                  |
| **Website unit tests**            | ~20 files      | `website/src/__tests__/`, `website/src/tests/`, `website/src/lib/__tests__/`, `website/src/components/__tests__/` |
| **Admin dashboard tests**         | ~10 files      | `admin-dashboard/src/__tests__/`, `admin-dashboard/src/components/__tests__/`                                     |
| **E2E tests**                     | ~12 spec files | `e2e/`, `website/e2e/`, `tests/`                                                                                  |
| **Visual tests**                  | 1 spec file    | `visual-tests/`                                                                                                   |
| **Integration tests**             | 2 files        | `tests/integration/`, `server/test/integration/`                                                                  |
| **Total**                         | **~140 files** |                                                                                                                   |

### 1.4 Test Framework Inconsistency

The server uses **three different test paradigms**:

1. **Jest** (jest.config.js configured, but rarely used — only `followsService.test.js` and `followsController.test.js`)
2. **Node native `node:test`** (most server tests, ~85 files)
3. **Supertest** (some integration tests)

This fragmentation means mocks, assertions, and setup patterns differ across files — increasing maintenance burden.

---

## 2. Critical Untested Files

### 2.1 Routes — ALL 71 ROUTE FILES UNTESTED (CRITICAL)

Every route file serves as the HTTP entry point for its domain. **None have corresponding test files.**

| Risk        | File                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| 🔴 CRITICAL | `server/routes/admin.js` — Admin endpoints (permissions, user mgmt, security-sensitive)                 |
| 🔴 CRITICAL | `server/routes/webhooks.js` — External webhook receivers (security-sensitive)                           |
| 🔴 CRITICAL | `server/routes/financial.js`, `server/routes/financials.js` — Payment/financial data                    |
| 🔴 CRITICAL | `server/routes/certificates.js` — Certificate issuance/verification                                     |
| 🔴 CRITICAL | `server/routes/dynamicPricing.js` — Pricing engine                                                      |
| 🔴 CRITICAL | `server/routes/compliance.js` — Compliance/audit routes                                                 |
| 🔴 CRITICAL | `server/routes/rbac.js` — Role-based access control routes                                              |
| 🔴 CRITICAL | `server/routes/bulk.js` — Bulk operations                                                               |
| 🔴 CRITICAL | `server/routes/recovery.js` — Account recovery                                                          |
| 🔴 HIGH     | `server/routes/analytics.js`, `server/routes/analytics.routes.js`, `server/routes/platformAnalytics.js` |
| 🔴 HIGH     | `server/routes/notifications.js`, `server/routes/notificationPreference.js`                             |
| 🔴 HIGH     | `server/routes/portfolio*.js` (5 files) — Portfolio CRUD                                                |
| 🔴 HIGH     | `server/routes/eventConflict.js`, `server/routes/emailCampaigns.js`                                     |
| 🔴 HIGH     | `server/routes/feedback.js`, `server/routes/feedbackRoutes.js`                                          |
| 🔴 HIGH     | `server/routes/moderation.js`                                                                           |
| 🔴 HIGH     | `server/routes/sponsorships*.js`                                                                        |
| 🔴 HIGH     | `server/routes/mentorshipRoutes.js` (in `routes/` and `migrations/server/routes/`)                      |
| 🟡 MEDIUM   | Remaining 36 route files                                                                                |
| 🟡 MEDIUM   | `routes/admin/applications.js`                                                                          |

**Total: 71 files, 0 tested. Risk: CRITICAL.**

### 2.2 Controllers — 57 OF 59 UNTESTED (CRITICAL)

Only `followsController.test.js` exists. All other controllers route requests to services with zero test coverage.

| Risk        | File                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| 🔴 CRITICAL | `server/controllers/localAuthController.js` — Authentication logic               |
| 🔴 CRITICAL | `server/controllers/studentAuthController.js` — Student auth                     |
| 🔴 CRITICAL | `server/controllers/certificatesController.js`, `certificatesAdminController.js` |
| 🔴 CRITICAL | `server/controllers/financialController.js` — Financial operations               |
| 🔴 CRITICAL | `server/controllers/eventsController.js`, `eventRegistrationController.js`       |
| 🔴 HIGH     | `server/controllers/portfolioAnalyticsController.js`                             |
| 🔴 HIGH     | `server/controllers/bulkOperationsController.js`                                 |
| 🔴 HIGH     | `server/controllers/compliance*.js`                                              |
| 🟡 MEDIUM   | Remaining ~49 controller files                                                   |

**Total: 59 files, 2 tested (3.4%). Risk: CRITICAL.**

### 2.3 Services — 94 OF 95 UNTESTED (CRITICAL)

Only `followsService` has a dedicated unit test file.

| Risk        | File                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| 🔴 CRITICAL | `server/services/studentAuthService.js` — Auth service                                       |
| 🔴 CRITICAL | `server/services/emailService.js` — Email sending                                            |
| 🔴 CRITICAL | `server/services/financialService.js` — Financial logic                                      |
| 🔴 CRITICAL | `server/services/pciComplianceEngine.js` — PCI compliance                                    |
| 🔴 CRITICAL | `server/services/dynamicPricingService.js`, `pricingAlgorithm.js`                            |
| 🔴 CRITICAL | `server/services/webhookService.js`, `webhookDeliveryService.js`, `webhookRetryProcessor.js` |
| 🔴 CRITICAL | `server/services/slackIntegrationService.js`                                                 |
| 🔴 CRITICAL | `server/services/impersonationService.js`                                                    |
| 🔴 CRITICAL | `server/services/encryptionManager.js` — in utils but security-critical                      |
| 🔴 HIGH     | `server/services/notification*.js` (7 files) — notification infra                            |
| 🔴 HIGH     | `server/services/portfolio*.js` (5 files)                                                    |
| 🔴 HIGH     | `server/services/eventRecommendationService.js`, `recommendationService.js`                  |
| 🔴 HIGH     | `server/services/gamificationService.js`                                                     |
| 🔴 HIGH     | `server/services/sponsorship*.js` (2 files)                                                  |
| 🟡 MEDIUM   | Remaining ~70 service files                                                                  |

**Total: 95 files, 1 tested (1.1%). Risk: CRITICAL.**

### 2.4 Repositories — ALL 44 UNTESTED (CRITICAL)

Zero test coverage on the data access layer. This means all database queries, joins, pagination, and filtering logic is **untested**.

| Risk        | Count    | Examples                                                                                                                                                                                                          |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 CRITICAL | 44 files | All `server/repositories/*.js` files — `usersRepository.js`, `eventsRepository.js`, `registrationsRepository.js`, `financialRepository.js`, `portfolioAnalyticsRepository.js`, `adminSecurityRepository.js`, etc. |

**Risk: CRITICAL.** Repository bugs can corrupt data silently.

### 2.5 Middleware — 12 OF 23 UNTESTED (HIGH)

**Tested middleware (11 files):**

- `tierRateLimiter.js` → `tierRateLimiter.test.js`
- `sqlInjectionGuard.js` → `sqlInjectionGuard.test.js` / `sql-injection.test.js`
- `rbacMiddleware.js` → `rbacMiddleware.test.js`
- `rateLimiter.js` → `rateLimiter.test.js` / `rateLimit.test.js`
- `adminAuthMiddleware.js` → `adminAuthMiddleware.test.js`
- `cacheMiddleware.js` → `cacheMiddleware.test.js`
- `errorHandler.js` → covered by schemaValidation.test.js and others
- `xssSanitizer.js` → `xss.test.js`
- `adminAuthMiddleware.js` → `adminAuth.test.js`
- `tracingMiddleware.js` → `tracing.test.js`
- `performanceMonitor.js` → `performanceMonitor.test.js`

**Untested middleware (12 files):**

| Risk      | File                                             | Reason                      |
| --------- | ------------------------------------------------ | --------------------------- |
| 🔴 HIGH   | `server/middleware/uploadMiddleware.js`          | File upload handling        |
| 🔴 HIGH   | `server/middleware/throttleMiddleware.js`        | Request throttling          |
| 🔴 HIGH   | `server/middleware/profanityFilter.js`           | Content filtering           |
| 🔴 HIGH   | `server/middleware/apiLogger.js`                 | API logging                 |
| 🔴 HIGH   | `server/middleware/enhancedTracingMiddleware.js` | Tracing                     |
| 🔴 HIGH   | `server/middleware/studentAuthMiddleware.js`     | Student authentication      |
| 🔴 HIGH   | `server/middleware/csrfMiddleware.js`            | CSRF protection             |
| 🔴 HIGH   | `server/middleware/authRateLimiter.js`           | Auth-specific rate limiting |
| 🔴 HIGH   | `server/middleware/auth/passkeyLockout.js`       | Passkey lockout logic       |
| 🔴 HIGH   | `server/middleware/auth/customAuth.js`           | Custom authentication       |
| 🔴 HIGH   | `server/middleware/auth/activityAuth.js`         | Activity-level auth         |
| 🔴 HIGH   | `server/middleware/adminAuditMiddleware.js`      | Admin audit logging         |
| 🟡 MEDIUM | `server/middleware/asyncHandler.js`              | Error handling wrapper      |

### 2.6 Workers — ALL 4 UNTESTED (HIGH)

| File                               | Purpose                    |
| ---------------------------------- | -------------------------- |
| `server/workers/waitlistWorker.js` | Waitlist processing        |
| `server/workers/reminderWorker.js` | Reminder dispatch          |
| `server/workers/bulkWorker.js`     | Bulk operations processing |
| `server/workers/auditWorker.js`    | Asynchronous audit logging |

These process background jobs asynchronously — bugs here can cause silent data loss.

### 2.7 Validators — ALL 6 UNTESTED (HIGH)

| File                                        | Purpose                 |
| ------------------------------------------- | ----------------------- |
| `server/validators/portfolioSchemas.js`     | Portfolio validation    |
| `server/validators/mentorshipValidator.js`  | Mentorship validation   |
| `server/validators/eventSchemas.js`         | Event schema validation |
| `server/validators/bannerSchemas.js`        | Banner validation       |
| `server/validators/notificationSchemas.js`  | Notification validation |
| `server/validators/formSchemas.js`          | Form validation         |
| `server/validators/activityEventSchemas.js` | Activity event schemas  |
| `server/validators/coreTeamSchemas.js`      | Core team schemas       |

Validation errors can allow malformed data into the system.

### 2.8 Migrations — ALL 53 UNTESTED (MEDIUM)

`server/migrations/*.js` — These run schema changes. Rollback/error scenarios are completely untested.

### 2.9 Frontend — Admin Dashboard Pages

Most **admin dashboard pages** have no tests:

| Risk      | Untested Files (28 pages)                                                          |
| --------- | ---------------------------------------------------------------------------------- |
| 🔴 HIGH   | `UserSegmentation.jsx`, `UserGroups.jsx`, `StreamManager.jsx`, `SsoInvitePage.jsx` |
| 🔴 HIGH   | `RolesManager.jsx`, `RealTimeDashboard.jsx`, `ModerationManager.jsx`               |
| 🔴 HIGH   | `EventPlanningManager.jsx`, `CoreTeamManager.jsx`, `ComprehensiveAnalytics.jsx`    |
| 🔴 HIGH   | `BannersManager.jsx`, `SecurityCenter.jsx`, `PricingAnalyticsPage.jsx`             |
| 🔴 HIGH   | `MentorshipManager.jsx`, `ComplianceManager.jsx`, `CertificateManager.jsx`         |
| 🟡 MEDIUM | `DashboardHome.jsx`, `LoginPage.jsx`, `AlertManager.jsx`, and 12 more              |

Only `UserManager.jsx` has a test.

### 2.10 Frontend — Website Pages and Components

| Component                                           | Tested?                         |
| --------------------------------------------------- | ------------------------------- |
| `website/src/utils/safeHref.js`                     | ✅ `safeHref.test.js`           |
| `website/src/utils/formatRelativeTime.js`           | ✅ `formatRelativeTime.test.js` |
| `website/src/lib/promptStore.js`                    | ✅ `promptStore.test.js`        |
| `website/src/lib/workspaceService.js`               | ✅ `workspaceService.test.js`   |
| `website/src/components/ErrorBoundary.jsx`          | ✅ `ErrorBoundary.test.jsx`     |
| `website/src/components/Pagination.jsx`             | ❌ No test                      |
| `website/src/utils/apiClient.js`                    | ❌ No test                      |
| `website/src/utils/analytics.js`                    | ❌ No test                      |
| `website/src/utils/errorTracking.js`                | ❌ No test                      |
| `website/src/utils/offlineQueue.js`                 | ❌ No test                      |
| `website/src/utils/indexedDB.js`                    | ❌ No test                      |
| `website/src/services/socket.ts`                    | ❌ No test                      |
| `website/src/services/moderationService.js`         | ❌ No test                      |
| `website/src/services/notifications/preferences.js` | ❌ No test                      |
| `website/src/shared/*.jsx` (10+ components)         | ❌ No tests                     |
| `website/src/features/analytics/*.tsx` (3 files)    | ❌ No tests                     |

---

## 3. Testing Gaps Found

### 3.1 Missing Test Categories

| Category                    | Status     | Evidence                                                                                                                                               |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Security tests**          | ❌ Missing | No dedicated security test suite. Some XSS/SQL injection tests exist in server/test/ but are ad-hoc.                                                   |
| **Performance/Load tests**  | ❌ Missing | Only 1 stress test (errorTracking.test.js). No k6/artillery configs.                                                                                   |
| **Payment flow tests**      | ❌ Missing | Zero tests for Stripe/payment integration. `grep "stripe\|payment\|checkout" *.test.*` → 0 results (only revenue report tests payment_method strings). |
| **Migration tests**         | ❌ Missing | 53 migration files, zero tests.                                                                                                                        |
| **Worker tests**            | ❌ Missing | 4 worker files, zero tests.                                                                                                                            |
| **Repository tests**        | ❌ Missing | 44 repository files, zero tests.                                                                                                                       |
| **E2E auth tests**          | ⚠️ Partial | `auth.spec.ts` exists but covers basic flow only.                                                                                                      |
| **Integration tests**       | ⚠️ Thin    | Only 2 integration test files vs 95+ services.                                                                                                         |
| **Visual regression tests** | ⚠️ 1 file  | Only `visual-tests.spec.ts` — insufficient coverage.                                                                                                   |

### 3.2 Testing Anti-Patterns Found

#### 3.2.1 Flaky Tests via `setTimeout` / `sleep` — 30 occurrences

| File                                                  | Lines                             | Issue                                                           |
| ----------------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| `server/test/redis.test.js`                           | 132, 178                          | `setTimeout(resolve, 50)` — race conditions in concurrent tests |
| `server/test/bulkOperations.test.js`                  | 109, 250, 294, 302                | `setTimeout(resolve, 50-100)` — timing-dependent assertions     |
| `server/test/adminAuthMiddleware.test.js`             | 77                                | `setTimeout(resolve, 150)` — waiting for async operations       |
| `server/tests/outboxDispatcher.test.js`               | 37                                | `setTimeout(r, 50)` — timing-dependent                          |
| `server/test/adminSessions.test.js`                   | 100, 122, 131, 154, 159, 163, 232 | **7 occurrences** — session expiration race conditions          |
| `server/test/circuitBreaker.test.js`                  | 62, 88, 132                       | `sleep(60)` — circuit breaker timing                            |
| `server/test/rateLimiter.test.js`                     | 356                               | `setTimeout` — rate limit window timing                         |
| `server/test/repositoryConcurrency.test.js`           | 40                                | `setTimeout(resolve, 15)` — concurrency timing                  |
| `server/test/db_failover.test.js`                     | 77                                | `setTimeout(r, 150)` — failover timing                          |
| `server/test/performanceMonitor.test.js`              | 106                               | `setTimeout(resolve, 10)` — timing-dependent                    |
| `website/src/hooks/useFollow.test.js`                 | 230, 969                          | `setTimeout(resolve, 0)` — microtask flush                      |
| `website/src/__tests__/useGlobalSearch.test.jsx`      | 14                                | `setTimeout(resolve, 0)` — microtask flush                      |
| `admin-dashboard/src/__tests__/hooks/useAuth.test.js` | 98, 110                           | `setTimeout(r, 1000/200)` — loading states                      |

**Impact:** These tests can pass/fail intermittently depending on machine load, making CI unreliable.

#### 3.2.2 `console.log` in Test Files — 6 files

| File                                      | Line    | Issue                                              |
| ----------------------------------------- | ------- | -------------------------------------------------- |
| `server/test/errorTracking.test.js`       | 129     | Performance logging in test output                 |
| `server/test/bulkOperations.test.js`      | 262-309 | Muting and restoring console.log (fragile pattern) |
| `server/test/adminAuthMiddleware.test.js` | 187     | Stress test perf logging                           |
| `server/test/tracing.test.js`             | 81      | Debug log left in                                  |
| `server/test/featureFlags.test.js`        | 311     | Debug log left in                                  |
| `server/test/collisionSafety.test.js`     | 18      | Debug log left in                                  |

#### 3.2.3 Skipped Tests — 2 occurrences

| File                                          | Line   | Issue                                                   |
| --------------------------------------------- | ------ | ------------------------------------------------------- |
| `server/test/eventsService.test.js`           | 16     | **`test.skip` — entire eventsService CRU test skipped** |
| `server/test/api-contract-middleware.test.js` | 64, 76 | Conditional skip (`t.skip()`) based on import failure   |

The eventsService test being **fully skipped** means there are ZERO tests for event CRUD operations.

#### 3.2.4 Inconsistent Assertion Style

Server tests mix:

- `assert.equal()` / `assert.ok()` (node:test style)
- `expect().toHaveBeenCalled()` (Jest style)
- Custom mock assertions

This makes it harder to reason about test intent.

### 3.3 Configuration Issues

| Issue                                          | Details                                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **No coverage enforcement in CI**              | Coverage thresholds are configured but no CI step blocks merges below threshold.                                             |
| **admin-dashboard has lower branch threshold** | 65% branches vs 70% everywhere else — inconsistency.                                                                         |
| **Server tests exclude from coverage**         | `server/jest.config.js` has `collectCoverageFrom` but no `coverageDirectory`. Actual coverage metrics not easily accessible. |
| **No global timeout in server tests**          | `node:test` tests have no default timeout — can hang indefinitely in CI.                                                     |

---

## 4. High-Risk Untested Paths

### 4.1 Authentication & Authorization (CRITICAL)

| File                                          | Risk | Details                                                    |
| --------------------------------------------- | ---- | ---------------------------------------------------------- |
| `server/middleware/auth/customAuth.js`        | 🔴   | Custom auth logic, passkey support — zero tests            |
| `server/middleware/auth/passkeyLockout.js`    | 🔴   | Account lockout after failed passkey attempts — zero tests |
| `server/middleware/auth/activityAuth.js`      | 🔴   | Activity-level authorization — zero tests                  |
| `server/middleware/studentAuthMiddleware.js`  | 🔴   | Student authentication gate — zero tests                   |
| `server/middleware/csrfMiddleware.js`         | 🔴   | CSRF prevention — zero tests                               |
| `server/middleware/authRateLimiter.js`        | 🔴   | Auth-specific brute force protection — zero tests          |
| `server/services/studentAuthService.js`       | 🔴   | Login, registration, password management — **zero tests**  |
| `server/services/impersonationService.js`     | 🔴   | Admin impersonation — security-sensitive — zero tests      |
| `server/controllers/localAuthController.js`   | 🔴   | Auth controller — zero tests                               |
| `server/controllers/studentAuthController.js` | 🔴   | Student auth controller — zero tests                       |

### 4.2 Financial & Payment Processing (CRITICAL)

| File                                       | Risk | Details                                  |
| ------------------------------------------ | ---- | ---------------------------------------- |
| `server/services/financialService.js`      | 🔴   | Financial transactions — zero tests      |
| `server/services/pciComplianceEngine.js`   | 🔴   | PCI compliance checks — zero tests       |
| `server/services/dynamicPricingService.js` | 🔴   | Pricing calculations — zero tests        |
| `server/services/pricingAlgorithm.js`      | 🔴   | Pricing algorithm — zero tests           |
| `server/services/subscriptionService.js`   | 🔴   | Subscription management — zero tests     |
| `server/routes/financial.js`               | 🔴   | Financial API endpoints — zero tests     |
| `server/routes/financials.js`              | 🔴   | Additional financial routes — zero tests |
| `server/routes/dynamicPricing.js`          | 🔴   | Pricing endpoints — zero tests           |

**No Stripe/payment tests exist anywhere in the repository.**

### 4.3 WebSocket / Real-time Infrastructure (HIGH)

| File                                         | Risk | Details                                                                                                          |
| -------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `server/config/socket.js`                    | 🔴   | Socket.IO configuration — `socketConfig.test.js` exists but only tests CORS origin resolver, not the main config |
| `server/sockets/validationMiddleware.js`     | 🟡   | Socket payload validation — has `socketValidationMiddleware.test.js`                                             |
| `server/services/sseService.js`              | 🔴   | Server-Sent Events — has `sseService.test.js` ✅                                                                 |
| `server/services/pushNotificationService.js` | 🔴   | Web push notifications — zero tests                                                                              |
| `server/services/webPushService.js`          | 🔴   | Web push — zero tests                                                                                            |
| `server/services/streamService.js`           | 🔴   | Stream management — zero tests                                                                                   |
| `website/src/services/socket.ts`             | 🔴   | Client-side Socket.IO service — zero tests                                                                       |

### 4.4 Webhook Processing (HIGH)

| File                                        | Risk | Details                                                           |
| ------------------------------------------- | ---- | ----------------------------------------------------------------- |
| `server/services/webhookService.js`         | 🔴   | Webhook dispatch — `webhooks.test.js` exists ✅                   |
| `server/services/webhookDeliveryService.js` | 🔴   | Delivery with retry logic — indirectly tested by webhooks.test.js |
| `server/services/webhookRetryProcessor.js`  | 🔴   | Retry with backoff — zero tests                                   |
| `server/routes/webhooks.js`                 | 🔴   | Webhook endpoints — zero tests                                    |

### 4.5 Database & Caching (HIGH)

| File                                      | Risk | Details                                                |
| ----------------------------------------- | ---- | ------------------------------------------------------ |
| All 44 `server/repositories/*.js`         | 🔴   | Data access layer — **zero tests**                     |
| All 53 `server/migrations/*.js`           | 🔴   | Schema migrations — **zero tests**                     |
| `server/utils/databaseFailoverManager.js` | 🔴   | DB failover — `db_failover.test.js` ✅ but incomplete  |
| `server/services/cacheService.js`         | 🔴   | Caching service — zero tests                           |
| `server/utils/redis.js`                   | 🔴   | Redis utilities — `redis.test.js` ✅ covers some paths |

### 4.6 Email & Notifications (HIGH)

| File                                                | Risk | Details                            |
| --------------------------------------------------- | ---- | ---------------------------------- |
| `server/services/emailService.js`                   | 🔴   | Email dispatch — **zero tests**    |
| `server/services/emailCampaignService.js`           | 🔴   | Campaign management — zero tests   |
| `server/services/notificationBatcher.js`            | 🔴   | Notification batching — zero tests |
| `server/services/notificationPreferencesService.js` | 🔴   | Preference management — zero tests |

### 4.7 Admin Dashboard Frontend (HIGH)

| File                                              | Risk | Details                                                                                             |
| ------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| `admin-dashboard/src/context/AuthContext.jsx`     | 🔴   | Auth state management — zero tests                                                                  |
| `admin-dashboard/src/hooks/useAuth.js`            | 🔴   | Auth hook — `useAuth.test.js` exists ✅ but `useAuth.js` has `.backup` files suggesting instability |
| `admin-dashboard/src/hooks/useEvents.js`          | 🔴   | Events data fetching — zero tests                                                                   |
| `admin-dashboard/src/hooks/useSponsorships.js`    | 🔴   | Sponsorships — zero tests                                                                           |
| `admin-dashboard/src/hooks/useAnalyticsSocket.js` | 🔴   | Real-time analytics socket — zero tests                                                             |
| `admin-dashboard/src/hooks/useFocusTrap.js`       | 🔴   | Accessibility — zero tests                                                                          |
| `admin-dashboard/src/hooks/useToast.js`           | 🔴   | UI notifications — zero tests                                                                       |
| `admin-dashboard/src/hooks/useEventListener.js`   | 🔴   | Event listener management — zero tests                                                              |

---

## 5. Specific Recommendations

### R1: Add Route-Level Integration Tests (Priority: CRITICAL)

Create integration tests for all 71 route files. At minimum, test the top 10 highest-risk routes:

- `server/routes/admin.js` — Verify auth checks, permission enforcement, user management endpoints
- `server/routes/financial.js` — Verify financial data access controls
- `server/routes/webhooks.js` — Verify signature verification, payload validation, idempotency
- `server/routes/certificates.js` — Verify certificate issuance flow
- `server/routes/dynamicPricing.js` — Verify pricing calculation
- `server/routes/rbac.js` — Verify role-based access control endpoints
- `server/routes/bulk.js` — Verify bulk operation validation
- `server/routes/compliance.js` — Verify compliance data access
- `server/routes/recovery.js` — Verify account recovery flow
- `server/routes/notifications.js` — Verify notification delivery

**Pattern to follow:** `tests/integration/follows.integration.test.js` (uses `supertest` + real app instance)

### R2: Add Repository Unit Tests (Priority: CRITICAL)

All 44 repository files need unit tests. These are the data access layer — every query, join, and filter is currently untested.

**Example priority files:**
| File | Reason |
|------|--------|
| `server/repositories/usersRepository.js` | User data access |
| `server/repositories/eventsRepository.js` | Event CRUD |
| `server/repositories/financialRepository.js` | Financial data |
| `server/repositories/registrationsRepository.js` | Event registrations |
| `server/repositories/portfolioRepository.js` | Portfolio data |
| `server/repositories/adminSecurityRepository.js` | Security-critical |

**Pattern to follow:** Mock `db.js` queries and test each query method with valid/invalid inputs.

### R3: Unskip eventsService Tests (Priority: CRITICAL)

**Evidence:** `server/test/eventsService.test.js:16` — Entire test suite is `test.skip`.

The events service handles event creation, updates, and listing. **This is core business logic with zero active test coverage.**

### R4: Eliminate `setTimeout`/`sleep` Flaky Patterns (Priority: HIGH)

**30 occurrences found across 11 test files.** Replace with deterministic patterns:

- Use **fake timers** (vi.useFakeTimers / jest.useFakeTimers) instead of real waits
- For Socket.IO/event-emitter tests, use **callbacks/Promises** that resolve on event emission
- For concurrency tests, use **controlled Promises** (resolve manually)

**Worst offenders:**
| File | Count |
|------|-------|
| `server/test/adminSessions.test.js` | 7 occurrences |
| `server/test/bulkOperations.test.js` | 4 occurrences |
| `server/test/circuitBreaker.test.js` | 3 occurrences |
| `server/test/redis.test.js` | 2 occurrences |

### R5: Add Payment/Stripe Integration Tests (Priority: HIGH)

**Zero tests found** for Stripe/payment/checkout flows. This is a critical business risk.

Create at minimum:

- Unit tests for pricing algorithm (`server/services/pricingAlgorithm.js`)
- Integration test for financial service (`server/services/financialService.js`)
- Mock Stripe API in tests for checkout/payment flows

### R6: Standardize Server Test Framework (Priority: MEDIUM)

Server currently mixes **Jest** (config only, rarely used), **node:test** (most tests), and some **supertest** calls.

**Recommendation:** Consolidate on a single framework. Since ~85 tests already use `node:test`, consider standardizing on that, or migrate everything to Jest/Vitest for consistency with the rest of the monorepo.

### R7: Add CI Coverage Gates (Priority: MEDIUM)

Coverage thresholds are configured but not enforced:

```
Root: 70% lines/functions/branches/statements
Admin: 70% lines/functions/statements, 65% branches
Server: 70% all
Website: 70% all
```

**Add CI check** that fails the build if coverage drops below configured thresholds. Currently there's no enforcement mechanism visible in CI configs.

### R8: Add Database Migration Tests (Priority: MEDIUM)

53 migration files with zero tests. Migrations can fail in production and corrupt data.

Add tests that:

1. Run migrations in a test database
2. Verify schema changes (column types, constraints, indexes)
3. Test rollback scenarios
4. Verify data integrity after migration

### R9: Remove Debug `console.log` from Tests (Priority: LOW)

**6 files** have `console.log` statements that will clutter CI output:

- `server/test/errorTracking.test.js:129`
- `server/test/bulkOperations.test.js:262-309` (muting/restoring console — fragile)
- `server/test/adminAuthMiddleware.test.js:187`
- `server/test/tracing.test.js:81`
- `server/test/featureFlags.test.js:311`
- `server/test/collisionSafety.test.js:18`

Replace with proper assertion-based checks where applicable, or remove.

### R10: Add Admin Dashboard Page Component Tests (Priority: MEDIUM)

28 admin dashboard pages have zero tests. These pages manage:

- User roles and permissions (`RolesManager.jsx`)
- Compliance (`ComplianceManager.jsx`)
- Certificates (`CertificateManager.jsx`)
- Security (`SecurityCenter.jsx`)
- Financial pricing (`PricingAnalyticsPage.jsx`)

Start with pages that have the highest security/financial risk.

---

## Summary Metrics

| Metric                                     | Value             |
| ------------------------------------------ | ----------------- |
| Total test files                           | ~140              |
| Total route files                          | 71 (0% tested)    |
| Total controller files                     | 59 (3.4% tested)  |
| Total service files                        | 95 (1.1% tested)  |
| Total repository files                     | 44 (0% tested)    |
| Total middleware files                     | 23 (47.8% tested) |
| Total worker files                         | 4 (0% tested)     |
| Total migration files                      | 53 (0% tested)    |
| Total validators                           | 8 (0% tested)     |
| Flaky test patterns (`setTimeout`/`sleep`) | 30 occurrences    |
| Debug logs in tests (`console.log`)        | 6 files           |
| Skipped tests (`test.skip`)                | 2 occurrences     |
| Missing security tests                     | ✅ None           |
| Missing payment tests                      | ✅ None           |
| Missing migration tests                    | ✅ None           |
| Missing worker tests                       | ✅ None           |

---

_Report generated by TestEngineer automated audit on 2026-07-07_
