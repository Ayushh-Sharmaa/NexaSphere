/**
 * Integration tests for Bulk Operations Route Group
 * Tests all admin bulk operation endpoints including user/event imports,
 * exports, role/status/tag assignments, event cloning, reminders, and
 * rollback — with mocked service layer and auth enforcement.
 */
import { describe, it, before, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import express from "express";

// ---------------------------------------------------------------------------
// Mock Service — replaces bulkOperationsService so no DB/queue operations run
// ---------------------------------------------------------------------------

mock.module("../../services/bulkOperationsService.js", {
  namedExports: {
    bulkOperationsService: {
      getJob: (id) => {
        if (id === "unknown-job") return null;
        return { id, status: "completed", createdBy: "admin" };
      },
      previewImportUsers: (csv) => {
        if (!csv || csv.trim().length === 0) {
          return {
            preview: [],
            errors: [{ row: 1, errors: ["CSV data is empty"] }],
          };
        }
        return {
          preview: [{ display_name: "Test User", email: "test@test.com" }],
          errors: [],
        };
      },
      importUsers: async (csv, adminId) => {
        if (!csv || csv.trim().length === 0) {
          throw new Error("CSV data is required");
        }
        return { id: "job-1", status: "processing" };
      },
      exportUsers: async (fields, filters) =>
        "name,email\nTest User,test@test.com",
      bulkRoleAssignment: async (userIds, role, adminId) => {
        if (!Array.isArray(userIds) || userIds.length === 0) {
          throw new Error("userIds array is required");
        }
        return { id: "job-2", status: "processing" };
      },
      bulkStatusChange: async (userIds, status, adminId) => {
        if (!Array.isArray(userIds) || userIds.length === 0) {
          throw new Error("userIds array is required");
        }
        return { id: "job-3", status: "processing" };
      },
      bulkTagAssignment: async (userIds, tags, adminId) => {
        if (!Array.isArray(userIds) || !Array.isArray(tags)) {
          throw new Error("userIds and tags arrays are required");
        }
        return { id: "job-4", status: "processing" };
      },
      bulkEmail: async (userIds, subject, message, adminId) => {
        if (!Array.isArray(userIds) || !subject || !message) {
          throw new Error("userIds, subject, and message are required");
        }
        return { id: "job-5", status: "processing" };
      },
      previewImportEvents: (csv) => {
        if (!csv || csv.trim().length === 0) {
          return {
            preview: [],
            errors: [{ row: 1, errors: ["CSV data is empty"] }],
          };
        }
        return {
          preview: [{ title: "Test Event", date: "2026-07-01" }],
          errors: [],
        };
      },
      importEvents: async (csv, adminId) => {
        if (!csv || csv.trim().length === 0) {
          throw new Error("CSV data is required");
        }
        return { id: "job-6", status: "processing" };
      },
      bulkUpdateEventStatus: async (eventIds, status, adminId) => {
        if (!Array.isArray(eventIds) || eventIds.length === 0) {
          throw new Error("eventIds array is required");
        }
        return { id: "job-7", status: "processing" };
      },
      bulkEventCloning: async (eventIds, offsetDays, adminId) => {
        if (!Array.isArray(eventIds) || typeof offsetDays !== "number") {
          throw new Error("eventIds array and numeric offsetDays are required");
        }
        return { id: "job-8", status: "processing" };
      },
      exportEventData: async (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) {
          throw new Error("eventIds are required");
        }
        return "title,date\nTest Event,2026-07-01";
      },
      bulkSendReminders: async (eventIds, adminId) => {
        if (!Array.isArray(eventIds) || eventIds.length === 0) {
          throw new Error("eventIds array is required");
        }
        return { id: "job-9", status: "processing" };
      },
      rollback: async (auditLogId, adminId) => {
        if (auditLogId === "fail-rollback") {
          throw new Error("Rollback failed: audit log entry not found");
        }
        return { success: true, restored: 5 };
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Mock Middleware — admin auth + rate limiter
// ---------------------------------------------------------------------------

const authControl = { enabled: true };

mock.module("../../middleware/adminAuthMiddleware.js", {
  namedExports: {
    adminAuthMiddleware: {
      requireAdmin: (req, res, next) => {
        if (!authControl.enabled) {
          return res
            .status(401)
            .json({ error: "Unauthorized: No admin session" });
        }
        req.adminSession = { username: "admin", role: "admin" };
        next();
      },
    },
  },
});

mock.module("../../middleware/rateLimiter.js", {
  namedExports: {
    apiRateLimiter: (_req, _res, next) => next(),
  },
});

// ---------------------------------------------------------------------------
// Test App Factory — mounts the real bulk router at root so that the
// path patterns from paths() helper (both /bulk/... and /api/admin/bulk/...)
// resolve correctly.
// ---------------------------------------------------------------------------

async function createTestApp() {
  const { default: bulkRouter } = await import("../../routes/bulk.js");

  const app = express();
  app.use(express.json());

  // Mount the router at root; the paths() helper in bulk.js defines both
  // /bulk/... and /api/admin/bulk/... so we test via the latter.
  app.use("/", bulkRouter);

  return app;
}

// ---------------------------------------------------------------------------
// Auth Enforcement
// ---------------------------------------------------------------------------

describe("Bulk Routes — Auth Enforcement", () => {
  let app;

  before(async () => {
    authControl.enabled = true;
    app = await createTestApp();
  });

  it("returns 401 for GET /api/admin/bulk/jobs/:id when unauthenticated", async () => {
    authControl.enabled = false;
    const res = await request(app).get("/api/admin/bulk/jobs/job-1");
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it("returns 401 for POST /api/admin/bulk/users/preview when unauthenticated", async () => {
    authControl.enabled = false;
    const res = await request(app)
      .post("/api/admin/bulk/users/preview")
      .send({ csv: "name,email\nTest,test@test.com" });
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it("returns 401 for POST /api/admin/bulk/rollback/:id when unauthenticated", async () => {
    authControl.enabled = false;
    const res = await request(app).post("/api/admin/bulk/rollback/audit-1");
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });
});

// ---------------------------------------------------------------------------
// Job Management
// ---------------------------------------------------------------------------

describe("Bulk Routes — Job Management", () => {
  let app;

  before(async () => {
    authControl.enabled = true;
    app = await createTestApp();
  });

  it("GET /api/admin/bulk/jobs/:id returns job status when found", async () => {
    const res = await request(app).get("/api/admin/bulk/jobs/job-1");
    assert.equal(res.status, 200);
    assert.equal(res.body.id, "job-1");
    assert.equal(res.body.status, "completed");
    assert.equal(res.body.createdBy, "admin");
  });

  it("GET /api/admin/bulk/jobs/:id returns 404 for unknown job", async () => {
    const res = await request(app).get("/api/admin/bulk/jobs/unknown-job");
    assert.equal(res.status, 404);
    assert.equal(res.body.error, "Job not found");
  });
});

// ---------------------------------------------------------------------------
// User Bulk Operations
// ---------------------------------------------------------------------------

describe("Bulk Routes — User Operations", () => {
  let app;

  before(async () => {
    authControl.enabled = true;
    app = await createTestApp();
  });

  // --- Preview ---

  it("POST /api/admin/bulk/users/preview returns preview with valid CSV", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/preview")
      .send({ csv: "name,email\nTest User,test@test.com" });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.preview));
    assert.equal(res.body.preview.length, 1);
    assert.equal(res.body.preview[0].display_name, "Test User");
    assert.equal(res.body.preview[0].email, "test@test.com");
    assert.ok(Array.isArray(res.body.errors));
  });

  it("POST /api/admin/bulk/users/preview returns 400 with missing CSV", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/preview")
      .send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Import ---

  it("POST /api/admin/bulk/users/import returns 202 with job info", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/import")
      .send({ csv: "name,email\nTest User,test@test.com" });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-1");
    assert.equal(res.body.status, "processing");
  });

  it("POST /api/admin/bulk/users/import returns 400 with missing CSV", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/import")
      .send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Upload ---

  it("POST /api/admin/bulk/users/upload returns 202 with CSV file", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/upload")
      .attach(
        "file",
        Buffer.from("name,email\nTest User,test@test.com"),
        "test.csv"
      );
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-1");
  });

  it("POST /api/admin/bulk/users/upload returns 400 without file", async () => {
    const res = await request(app).post("/api/admin/bulk/users/upload");
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Export ---

  it("GET /api/admin/bulk/users/export returns CSV with headers", async () => {
    const res = await request(app)
      .get("/api/admin/bulk/users/export")
      .query({ fields: "name,email" });
    assert.equal(res.status, 200);
    assert.ok(res.headers["content-type"].startsWith("text/csv"));
    assert.ok(res.headers["content-disposition"].includes("attachment"));
    assert.ok(res.text.includes("name,email"));
  });

  it("GET /api/admin/bulk/users/export works without query params", async () => {
    const res = await request(app).get("/api/admin/bulk/users/export");
    assert.equal(res.status, 200);
    assert.ok(res.headers["content-type"].startsWith("text/csv"));
  });

  // --- Role Assignment ---

  it("POST /api/admin/bulk/users/role returns 202 with job info", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/role")
      .send({ userIds: [1, 2, 3], role: "admin" });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-2");
    assert.equal(res.body.status, "processing");
  });

  it("POST /api/admin/bulk/users/role returns 400 with missing userIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/role")
      .send({ role: "admin" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/bulk/users/role returns 400 with missing role", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/role")
      .send({ userIds: [1, 2] });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/bulk/users/role returns 400 with non-array userIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/role")
      .send({ userIds: "not-array", role: "admin" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Status Change ---

  it("POST /api/admin/bulk/users/status returns 202 with job info", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/status")
      .send({ userIds: [1, 2], status: "active" });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-3");
  });

  it("POST /api/admin/bulk/users/status returns 400 with missing userIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/status")
      .send({ status: "active" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Tag Assignment ---

  it("POST /api/admin/bulk/users/tags returns 202 with job info", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/tags")
      .send({ userIds: [1, 2], tags: ["vip", "alumni"] });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-4");
  });

  it("POST /api/admin/bulk/users/tags returns 400 with missing tags", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/tags")
      .send({ userIds: [1, 2] });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/bulk/users/tags returns 400 with non-array userIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/tags")
      .send({ userIds: "invalid", tags: ["vip"] });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Bulk Email ---

  it("POST /api/admin/bulk/users/email returns 202 with job info", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/email")
      .send({ userIds: [1, 2], subject: "Welcome!", message: "Hello there" });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-5");
  });

  it("POST /api/admin/bulk/users/email returns 400 with missing subject", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/email")
      .send({ userIds: [1, 2], message: "Hello" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/bulk/users/email returns 400 with missing message", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/email")
      .send({ userIds: [1, 2], subject: "Hi" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/bulk/users/email returns 400 with non-array userIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/users/email")
      .send({ userIds: "invalid", subject: "Hi", message: "Hello" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// Event Bulk Operations
// ---------------------------------------------------------------------------

describe("Bulk Routes — Event Operations", () => {
  let app;

  before(async () => {
    authControl.enabled = true;
    app = await createTestApp();
  });

  // --- Preview ---

  it("POST /api/admin/bulk/events/preview returns preview with valid CSV", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/preview")
      .send({ csv: "title,date\nTest Event,2026-07-01" });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.preview));
    assert.equal(res.body.preview[0].title, "Test Event");
  });

  it("POST /api/admin/bulk/events/preview returns 400 with missing CSV", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/preview")
      .send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Import ---

  it("POST /api/admin/bulk/events/import returns 202 with job info", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/import")
      .send({ csv: "title,date\nEvent,2026-07-01" });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-6");
  });

  it("POST /api/admin/bulk/events/import returns 400 with missing CSV", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/import")
      .send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Upload ---

  it("POST /api/admin/bulk/events/upload returns 202 with CSV file", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/upload")
      .attach(
        "file",
        Buffer.from("title,date\nEvent,2026-07-01"),
        "events.csv"
      );
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-6");
  });

  it("POST /api/admin/bulk/events/upload returns 400 without file", async () => {
    const res = await request(app).post("/api/admin/bulk/events/upload");
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Status Change ---

  it("POST /api/admin/bulk/events/status returns 202", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/status")
      .send({ eventIds: [1, 2], status: "cancelled" });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-7");
  });

  it("POST /api/admin/bulk/events/status returns 400 with missing eventIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/status")
      .send({ status: "cancelled" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Clone ---

  it("POST /api/admin/bulk/events/clone returns 202", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/clone")
      .send({ eventIds: [1, 2], offsetDays: 30 });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-8");
  });

  it("POST /api/admin/bulk/events/clone returns 400 with missing offsetDays", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/clone")
      .send({ eventIds: [1, 2] });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/bulk/events/clone returns 400 with non-numeric offsetDays", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/clone")
      .send({ eventIds: [1, 2], offsetDays: "thirty" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Export ---

  it("GET /api/admin/bulk/events/export returns CSV", async () => {
    const res = await request(app)
      .get("/api/admin/bulk/events/export")
      .query({ eventIds: "1,2,3" });
    assert.equal(res.status, 200);
    assert.ok(res.headers["content-type"].startsWith("text/csv"));
    assert.ok(res.headers["content-disposition"].includes("attachment"));
    assert.ok(res.text.includes("title,date"));
  });

  it("GET /api/admin/bulk/events/export returns 400 without eventIds", async () => {
    const res = await request(app).get("/api/admin/bulk/events/export");
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  // --- Reminders ---

  it("POST /api/admin/bulk/events/remind returns 202", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/remind")
      .send({ eventIds: [1, 2, 3] });
    assert.equal(res.status, 202);
    assert.equal(res.body.id, "job-9");
  });

  it("POST /api/admin/bulk/events/remind returns 400 with missing eventIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/remind")
      .send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/bulk/events/remind returns 400 with non-array eventIds", async () => {
    const res = await request(app)
      .post("/api/admin/bulk/events/remind")
      .send({ eventIds: "not-array" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------

describe("Bulk Routes — Rollback", () => {
  let app;

  before(async () => {
    authControl.enabled = true;
    app = await createTestApp();
  });

  it("POST /api/admin/bulk/rollback/:id returns success", async () => {
    const res = await request(app).post("/api/admin/bulk/rollback/audit-123");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.restored, 5);
  });

  it("POST /api/admin/bulk/rollback/:id returns 400 on rollback failure", async () => {
    const res = await request(app).post(
      "/api/admin/bulk/rollback/fail-rollback"
    );
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
    assert.ok(res.body.error.includes("Rollback failed"));
  });
});

// ---------------------------------------------------------------------------
// 404 Handling
// ---------------------------------------------------------------------------

describe("Bulk Routes — 404 Handling", () => {
  let app;

  before(async () => {
    authControl.enabled = true;
    app = await createTestApp();
  });

  it("returns 404 for unknown bulk routes", async () => {
    const res = await request(app).get("/api/admin/bulk/non-existent-route");
    assert.equal(res.status, 404);
  });
});
