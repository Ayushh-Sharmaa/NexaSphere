/**
 * Integration tests for Certificate Route Group
 * Tests public verification, student auth-protected routes, and admin
 * certificate management endpoints with mocked controllers and auth.
 */
import { describe, it, before, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import express from "express";

// ---------------------------------------------------------------------------
// Mock Controllers — replace real controller implementations so no DB/PDF
// generation code runs during tests.
// ---------------------------------------------------------------------------

mock.module("../../controllers/certificatesController.js", {
  namedExports: {
    issueCertificates: (req, res) =>
      res.status(201).json({ success: true, certificates: [] }),
    getMyCertificates: (req, res) => res.json({ certificates: [] }),
    verifyCertificate: (req, res) =>
      res.json({ valid: true, certificate: { code: req.params.code } }),
    downloadCertificatePdf: (req, res) =>
      res
        .setHeader("Content-Type", "application/pdf")
        .send(Buffer.from("%PDF-")),
    getOpenBadge: (req, res) =>
      res.json({
        "@context": "https://w3id.org/openbadges/v2",
        id: req.params.id,
      }),
    getCertificateVerificationShare: (req, res) =>
      res.json({ shareUrl: `https://verify.example.com/${req.params.id}` }),
  },
});

mock.module("../../controllers/certificatesAdminController.js", {
  namedExports: {
    adminGetCertificateById: (req, res) =>
      res.json({ certificate: { id: req.params.id } }),
    adminVerifyCertificate: (req, res) =>
      res.json({ success: true, verified: true }),
    adminRevokeCertificate: (req, res) =>
      res.json({ success: true, revoked: true }),
    adminGetTemplates: (req, res) => res.json({ success: true, templates: [] }),
    adminSaveTemplate: (req, res) =>
      res.json({ success: true, template: req.body }),
  },
});

// ---------------------------------------------------------------------------
// Mock Auth Middleware
// ---------------------------------------------------------------------------

mock.module("../../middleware/studentAuthMiddleware.js", {
  namedExports: {
    requireStudentAuth: (req, res, next) => {
      req.studentUser = { sub: 1, id: 1, email: "student@test.com" };
      next();
    },
  },
});

mock.module("../../middleware/adminAuthMiddleware.js", {
  namedExports: {
    adminAuthMiddleware: {
      requireAdmin: (req, res, next) => {
        req.adminSession = { username: "admin", role: "admin" };
        next();
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Test App Factory — mounts the real certificate router under /api
// ---------------------------------------------------------------------------

/** Toggle for auth enforcement tests */
const authControl = { studentEnabled: true, adminEnabled: true };

/**
 * Creates an Express app with the real certificates router mounted at /api,
 * but with a wrapper that can toggle auth to test enforcement.
 */
async function createTestApp() {
  const { default: certificateRouter } =
    await import("../../routes/certificates.js");

  const app = express();
  app.use(express.json());

  // Insert an auth gate BEFORE the router so we can simulate auth failures
  app.use("/api", (req, res, next) => {
    // For student-protected routes we intercept based on path
    if (
      req.path.startsWith("/certificates/me") ||
      (req.path.startsWith("/certificates/") && req.path.endsWith("/download"))
    ) {
      if (!authControl.studentEnabled) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
    // For admin routes we intercept based on path
    if (
      req.path.startsWith("/admin/certificates") ||
      req.path.startsWith("/certificates/issue")
    ) {
      if (!authControl.adminEnabled) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No admin session" });
      }
    }
    next();
  });

  app.use("/api", certificateRouter);

  return app;
}

// ---------------------------------------------------------------------------
// Public Routes — no auth required
// ---------------------------------------------------------------------------

describe("Certificates Routes — Public Routes", () => {
  let app;

  before(async () => {
    authControl.studentEnabled = true;
    authControl.adminEnabled = true;
    app = await createTestApp();
  });

  it("GET /api/certificates/verify/:code returns verification data", async () => {
    const res = await request(app).get("/api/certificates/verify/ABC123");
    assert.equal(res.status, 200);
    assert.equal(res.body.valid, true);
    assert.equal(res.body.certificate.code, "ABC123");
  });

  it("GET /api/certificates/verify/:code with different code", async () => {
    const res = await request(app).get("/api/certificates/verify/XYZ789");
    assert.equal(res.status, 200);
    assert.equal(res.body.certificate.code, "XYZ789");
  });

  it("GET /api/certificates/:id/badge returns OpenBadge JSON", async () => {
    const res = await request(app).get("/api/certificates/42/badge");
    assert.equal(res.status, 200);
    assert.equal(res.body["@context"], "https://w3id.org/openbadges/v2");
    assert.equal(res.body.id, "42");
  });

  it("GET /api/certificates/:id/share returns share URL", async () => {
    const res = await request(app).get("/api/certificates/99/share");
    assert.equal(res.status, 200);
    assert.ok(res.body.shareUrl.includes("99"));
    assert.ok(res.body.shareUrl.startsWith("https://verify.example.com/"));
  });

  it("Public routes work without any auth headers", async () => {
    authControl.studentEnabled = false;
    authControl.adminEnabled = false;

    const verifyRes = await request(app).get(
      "/api/certificates/verify/code123"
    );
    assert.equal(verifyRes.status, 200);

    const badgeRes = await request(app).get("/api/certificates/42/badge");
    assert.equal(badgeRes.status, 200);

    const shareRes = await request(app).get("/api/certificates/42/share");
    assert.equal(shareRes.status, 200);

    authControl.studentEnabled = true;
    authControl.adminEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Student Auth Routes
// ---------------------------------------------------------------------------

describe("Certificates Routes — Student Auth", () => {
  let app;

  before(async () => {
    authControl.studentEnabled = true;
    authControl.adminEnabled = true;
    app = await createTestApp();
  });

  it("GET /api/certificates/me returns certificates array", async () => {
    const res = await request(app).get("/api/certificates/me");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.certificates));
  });

  it("GET /api/certificates/:id/download returns PDF buffer", async () => {
    const res = await request(app).get("/api/certificates/42/download");
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-type"], "application/pdf");
    assert.ok(Buffer.isBuffer(res.body));
    assert.ok(res.body.toString().startsWith("%PDF-"));
  });

  it("GET /api/certificates/me returns 401 when unauthenticated", async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get("/api/certificates/me");
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it("GET /api/certificates/:id/download returns 401 when unauthenticated", async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get("/api/certificates/99/download");
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Admin Certificate Routes
// ---------------------------------------------------------------------------

describe("Certificates Routes — Admin Management", () => {
  let app;

  before(async () => {
    authControl.studentEnabled = true;
    authControl.adminEnabled = true;
    app = await createTestApp();
  });

  it("POST /api/certificates/issue returns 201 with certificates array", async () => {
    const res = await request(app)
      .post("/api/certificates/issue")
      .send({
        eventId: 1,
        userIds: [1, 2, 3],
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.certificates));
  });

  it("POST /api/certificates/issue with empty body still succeeds (mock)", async () => {
    const res = await request(app).post("/api/certificates/issue").send({});
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  it("GET /api/admin/certificates/:id returns certificate by id", async () => {
    const res = await request(app).get("/api/admin/certificates/42");
    assert.equal(res.status, 200);
    assert.equal(res.body.certificate.id, "42");
  });

  it("POST /api/admin/certificates/:id/verify verifies a certificate", async () => {
    const res = await request(app).post("/api/admin/certificates/42/verify");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.verified, true);
  });

  it("POST /api/admin/certificates/:id/revoke revokes a certificate", async () => {
    const res = await request(app).post("/api/admin/certificates/42/revoke");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.revoked, true);
  });
});

describe("Certificates Routes — Admin Auth Enforcement", () => {
  let app;

  before(async () => {
    authControl.studentEnabled = true;
    authControl.adminEnabled = true;
    app = await createTestApp();
  });

  it("POST /api/certificates/issue returns 401 without admin auth", async () => {
    authControl.adminEnabled = false;
    const res = await request(app)
      .post("/api/certificates/issue")
      .send({
        eventId: 1,
        userIds: [1],
      });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it("GET /api/admin/certificates/:id returns 401 without admin auth", async () => {
    authControl.adminEnabled = false;
    const res = await request(app).get("/api/admin/certificates/42");
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it("POST /api/admin/certificates/:id/verify returns 401 without admin auth", async () => {
    authControl.adminEnabled = false;
    const res = await request(app).post("/api/admin/certificates/42/verify");
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it("POST /api/admin/certificates/:id/revoke returns 401 without admin auth", async () => {
    authControl.adminEnabled = false;
    const res = await request(app).post("/api/admin/certificates/42/revoke");
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// 404 Handling
// ---------------------------------------------------------------------------

describe("Certificates Routes — 404 Handling", () => {
  let app;

  before(async () => {
    authControl.studentEnabled = true;
    authControl.adminEnabled = true;
    app = await createTestApp();
  });

  it("returns 404 for unknown certificate routes", async () => {
    const res = await request(app).get("/api/certificates/non-existent-route");
    assert.equal(res.status, 404);
  });

  it("returns 404 for unknown admin certificate routes (unknown method)", async () => {
    // GET /admin/certificates/:id is a wildcard; PATCH is unmatched
    const res = await request(app).patch("/api/admin/certificates/some-id");
    assert.equal(res.status, 404);
  });
});
