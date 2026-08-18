/** Set env vars before any imports */
process.env.JWT_SECRET = "test-jwt-secret-key-for-integration-tests-1234567890";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "AdminStrongPass123!";

/**
 * Integration tests for Admin Route Group (server/routes/admin.js)
 *
 * Tests the actual admin route definitions, auth enforcement, response shapes,
 * and error handling. The router is mounted at root to match its mixed path
 * conventions (some routes use relative paths like /membership, others use
 * absolute paths like /api/admin/config-review).
 *
 * Auth middleware is mocked to avoid requiring real admin credentials.
 * Service-layer dependencies (financialService, circuitBreaker, etc.) are
 * mocked via mock.module to avoid real external calls.
 */
import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import express from "express";
import { Router } from "express";

// ---------------------------------------------------------------------------
// Mock service dependencies used by the admin route handlers
// ---------------------------------------------------------------------------

// Mock dataIntegrityValidator — used by database-* and read-only endpoints
mock.module("../../utils/dataIntegrityValidator.js", {
  namedExports: {
    runIntegrityCheck: () => ({ status: "healthy", checks: 12, passed: 12 }),
    detectCorruption: () => ({ corrupted: false, tables: [] }),
    generateRecoveryRecommendation: () => ({ actionable: false, steps: [] }),
    createRecoveryAuditLog: () => ({ logs: [], total: 0 }),
  },
});

// Mock readOnlyMode — used by read-only-* endpoints
mock.module("../../routes/readOnlyMode.js", {
  namedExports: {
    activateReadOnlyMode: () => ({
      enabled: true,
      activatedAt: new Date().toISOString(),
    }),
    deactivateReadOnlyMode: () => ({
      enabled: false,
      deactivatedAt: new Date().toISOString(),
    }),
    getReadOnlyStatus: () => ({ enabled: false, reason: null }),
    createIncidentLog: () => ({ incidents: [], total: 0 }),
  },
});

// Mock serviceStatus — used by service-* endpoints
mock.module("../../utils/serviceStatus.js", {
  namedExports: {
    getServiceStatus: () => ({
      operational: true,
      services: { api: "up", db: "up" },
    }),
    getIncidentTimeline: () => ({ incidents: [] }),
    getMaintenanceSchedule: () => ({ scheduled: [] }),
    getHistoricalUptime: () => ({ uptime: 99.9, period: "30d" }),
    getSubscriberNotifications: () => ({ subscribers: [] }),
  },
});

// Mock consistencyVerifier — used by consistency-* endpoints
mock.module("../../utils/consistencyVerifier.js", {
  namedExports: {
    runConsistencyCheck: () => ({ consistent: true, mismatches: [] }),
    getSynchronizationStatus: () => ({
      synced: true,
      lastSync: new Date().toISOString(),
    }),
    detectConflicts: () => ({ conflicts: [] }),
    generateIntegrityReport: () => ({ passed: true, score: 100 }),
    getConsistencyAlerts: () => ({ alerts: [] }),
    triggerForceSync: () => ({ success: true }),
  },
});

// Mock configApproval — used by config-review endpoint
mock.module("../../utils/configApproval.js", {
  namedExports: {
    validateConfigChange: (body) => ({ valid: true, errors: [] }),
    createChangeHistory: (body) => ({ entries: [{ change: body }] }),
    rollbackConfig: (body) => ({ needed: false }),
  },
});

// Mock financialService — used by revenue report endpoint
mock.module("../../services/financialService.js", {
  namedExports: {
    financialService: {
      getRevenueReport: async (user) => ({
        totalRevenue: 50000,
        monthly: [{ month: "2026-01", revenue: 5000 }],
        breakdown: { registrations: 30000, sponsorships: 15000, other: 5000 },
      }),
    },
  },
});

// Mock supabaseClient — used at module level for HAS_SUPABASE check
mock.module("../../storage/supabaseClient.js", {
  namedExports: {
    supabaseBreaker: {
      execute: async () => [],
    },
    HAS_SUPABASE: false,
  },
});

// Mock circuitBreaker — used for membershipBreaker
mock.module("../../utils/circuitBreaker.js", {
  namedExports: {
    CircuitBreaker: class MockCircuitBreaker {
      constructor(fn, opts) {
        this.fn = fn;
        this.opts = opts;
      }
      async execute(...args) {
        return this.fn(...args);
      }
    },
    circuitBreakerRegistry: {
      register: (name, breaker) => breaker,
    },
  },
});

// Mock appContext — used for tracedFetch and logContext
mock.module("../../config/appContext.js", {
  namedExports: {
    appContext: {
      getStore: () => ({ reqId: "test-req-id" }),
      run: (store, fn) => fn(),
    },
    tracedFetch: async (url, opts) => ({
      status: 200,
      ok: true,
      json: async () => ({}),
    }),
  },
});

// Mock rateLimiter to pass through
mock.module("../../middleware/rateLimiter.js", {
  namedExports: {
    apiRateLimiter: (req, res, next) => next(),
  },
});

// Mock adminAuthMiddleware — provide requireAdmin that checks req.adminSession
mock.module("../../middleware/adminAuthMiddleware.js", {
  namedExports: {
    adminAuthMiddleware: {
      requireAdmin: (req, res, next) => {
        if (!req.adminSession) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        next();
      },
      getSecurityOverview: (req, res) =>
        res.json({
          activeSessions: 3,
          recentLogins: [],
          securityScore: 85,
        }),
      extendSession: (req, res) => res.json({ success: true }),
      revokeSession: (req, res) =>
        res.json({ success: true, revoked: req.params.sessionId }),
      logoutOtherSessions: (req, res) =>
        res.json({ success: true, remaining: 1 }),
    },
  },
});

// ---------------------------------------------------------------------------
// Import the real admin router after mocks are registered
// ---------------------------------------------------------------------------

let adminRouter;
let app;

async function setup() {
  const mod = await import("../../routes/admin.js");
  adminRouter = mod.default;
  app = express();
  app.use(express.json());
  app.use(adminRouter);
  // 404 handler for unknown routes
  app.use((req, res) => res.status(404).json({ error: "Not found" }));
}

function withAuth() {
  // Wrap app to inject adminSession before each request
  const wrapped = express();
  wrapped.use(express.json());
  wrapped.use((req, res, next) => {
    req.adminSession = { username: "testadmin", role: "admin", id: "admin-1" };
    next();
  });
  wrapped.use(adminRouter);
  wrapped.use((req, res) => res.status(404).json({ error: "Not found" }));
  return wrapped;
}

function withoutAuth() {
  const wrapped = express();
  wrapped.use(express.json());
  wrapped.use(adminRouter);
  wrapped.use((req, res) => res.status(404).json({ error: "Not found" }));
  return wrapped;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Admin Routes", () => {
  before(async () => {
    await setup();
  });

  describe("Auth Enforcement", () => {
    it("should return 401 for GET routes when unauthenticated", async () => {
      const noAuth = withoutAuth();
      await request(noAuth).get("/membership").expect(401);
      await request(noAuth).get("/me").expect(401);
      await request(noAuth).get("/sessions").expect(401);
    });

    it("should return 401 for POST routes when unauthenticated", async () => {
      const noAuth = withoutAuth();
      await request(noAuth)
        .post("/api/admin/config-review")
        .send({})
        .expect(401);
      await request(noAuth).post("/api/admin/read-only-enable").expect(401);
      await request(noAuth).post("/api/admin/sso-invite").send({}).expect(401);
    });

    it("should return 401 for DELETE routes when unauthenticated", async () => {
      const noAuth = withoutAuth();
      await request(noAuth).delete("/sessions/abc123").expect(401);
    });
  });

  describe("GET routes return 200 with JSON", () => {
    it("GET /membership returns 200", async () => {
      const res = await request(withAuth()).get("/membership");
      assert.equal(res.status, 200);
      assert.ok(res.body.responses);
    });

    it("GET /me returns 200", async () => {
      const res = await request(withAuth()).get("/me");
      assert.equal(res.status, 200);
      assert.equal(res.body.username, "testadmin");
    });

    it("GET /api/admin/database-health returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/database-health");
      assert.equal(res.status, 200);
      assert.ok(res.body.status);
    });

    it("GET /api/admin/database-corruption returns 200", async () => {
      const res = await request(withAuth()).get(
        "/api/admin/database-corruption"
      );
      assert.equal(res.status, 200);
      assert.equal(res.body.corrupted, false);
    });

    it("GET /api/admin/database-recovery returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/database-recovery");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/database-audit-log returns 200", async () => {
      const res = await request(withAuth()).get(
        "/api/admin/database-audit-log"
      );
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/read-only-status returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/read-only-status");
      assert.equal(res.status, 200);
      assert.equal(res.body.enabled, false);
    });

    it("GET /api/admin/read-only-log returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/read-only-log");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/service-status returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/service-status");
      assert.equal(res.status, 200);
      assert.ok(res.body.operational);
    });

    it("GET /api/admin/incidents returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/incidents");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/maintenance returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/maintenance");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/uptime-report returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/uptime-report");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/status-subscribers returns 200", async () => {
      const res = await request(withAuth()).get(
        "/api/admin/status-subscribers"
      );
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/consistency-check returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/consistency-check");
      assert.equal(res.status, 200);
      assert.ok(res.body.consistent);
    });

    it("GET /api/admin/sync-status returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/sync-status");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/conflicts returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/conflicts");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/integrity-report returns 200", async () => {
      const res = await request(withAuth()).get("/api/admin/integrity-report");
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/consistency-alerts returns 200", async () => {
      const res = await request(withAuth()).get(
        "/api/admin/consistency-alerts"
      );
      assert.equal(res.status, 200);
    });

    it("GET /api/admin/reports/engagement returns 200", async () => {
      const res = await request(withAuth()).get(
        "/api/admin/reports/engagement"
      );
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.users));
    });

    it("GET /sessions returns 200", async () => {
      const res = await request(withAuth()).get("/sessions");
      assert.equal(res.status, 200);
      assert.ok(res.body.activeSessions !== undefined);
    });
  });

  describe("POST routes return 200/201 with JSON", () => {
    it("POST /api/admin/config-review returns 200", async () => {
      const res = await request(withAuth())
        .post("/api/admin/config-review")
        .send({ key: "test", value: "new" });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it("POST /api/admin/read-only-enable returns 200", async () => {
      const res = await request(withAuth()).post("/api/admin/read-only-enable");
      assert.equal(res.status, 200);
      assert.equal(res.body.enabled, true);
    });

    it("POST /api/admin/read-only-disable returns 200", async () => {
      const res = await request(withAuth()).post(
        "/api/admin/read-only-disable"
      );
      assert.equal(res.status, 200);
      assert.equal(res.body.enabled, false);
    });
  });

  describe("SSO Invite Validation", () => {
    it("POST /api/admin/sso-invite with no email returns 400", async () => {
      const res = await request(withAuth())
        .post("/api/admin/sso-invite")
        .send({});
      assert.equal(res.status, 400);
    });

    it("POST /api/admin/sso-invite with empty email returns 400", async () => {
      const res = await request(withAuth())
        .post("/api/admin/sso-invite")
        .send({ email: "" });
      assert.equal(res.status, 400);
    });

    it("POST /api/admin/sso-invite with invalid email returns 400", async () => {
      const res = await request(withAuth())
        .post("/api/admin/sso-invite")
        .send({ email: "not-an-email" });
      assert.equal(res.status, 400);
    });

    it("POST /api/admin/sso-invite with valid email returns 200", async () => {
      const res = await request(withAuth())
        .post("/api/admin/sso-invite")
        .send({ email: "admin@example.com" });
      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.ok(res.body.inviteUrl);
    });
  });

  describe("Session Management", () => {
    it("DELETE /sessions/:sessionId revokes a session", async () => {
      const res = await request(withAuth()).delete("/sessions/abc123");
      assert.equal(res.status, 200);
      assert.equal(res.body.revoked, "abc123");
    });

    it("DELETE /sessions revokes all other sessions", async () => {
      const res = await request(withAuth()).delete("/sessions");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe("Error Handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(withAuth()).get("/nonexistent");
      assert.equal(res.status, 404);
    });
  });
});
