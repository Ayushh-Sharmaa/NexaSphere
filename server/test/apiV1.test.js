import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidActivityKey,
  ACTIVITY_CATEGORIES,
} from "../config/activityTypes.js";
import { applicationsService } from "../services/applicationsService.js";
import {
  requireRole,
  requirePermission,
} from "../middleware/rbacMiddleware.js";

test("Activity Types — 8 Canonical Normalized Keys", () => {
  assert.equal(ACTIVITY_CATEGORIES.length, 8);

  const expectedKeys = [
    "hackathon",
    "codathon",
    "ideathon",
    "promptathon",
    "workshop",
    "insight_session",
    "open_source_day",
    "tech_debate",
  ];

  for (const key of expectedKeys) {
    assert.equal(isValidActivityKey(key), true, `Expected ${key} to be valid`);
  }

  assert.equal(isValidActivityKey("invalid_hack"), false);
  assert.equal(isValidActivityKey("unknown"), false);
});

test("Applications — Application Number Formats", async () => {
  const memNum =
    await applicationsService.generateApplicationNumber("membership");
  const coreNum =
    await applicationsService.generateApplicationNumber("core_team");

  const year = new Date().getFullYear();
  assert.match(memNum, new RegExp(`^NX-MEM-${year}-\\d{6}$`));
  assert.match(coreNum, new RegExp(`^NX-CORE-${year}-\\d{6}$`));
});

test("RBAC Middleware — Role and Permission Verification", () => {
  const reqStudent = { auth: { userId: "user_123", role: "student" } };
  const reqAdmin = { auth: { userId: "admin_456", role: "admin" } };
  const reqSuperAdmin = { auth: { userId: "super_789", role: "super_admin" } };

  // 1. Admin Role Guard
  let called = false;
  const adminGuard = requireRole(["admin", "super_admin"]);

  // Student should be rejected (403)
  const resForbidden = {
    status(code) {
      assert.equal(code, 403);
      return { json: (data) => assert.equal(data.error.code, "FORBIDDEN") };
    },
  };
  adminGuard(reqStudent, resForbidden, () => {
    called = true;
  });
  assert.equal(called, false);

  // Admin should be allowed
  adminGuard(reqAdmin, resForbidden, () => {
    called = true;
  });
  assert.equal(called, true);

  // Super Admin should be allowed
  called = false;
  adminGuard(reqSuperAdmin, resForbidden, () => {
    called = true;
  });
  assert.equal(called, true);
});
