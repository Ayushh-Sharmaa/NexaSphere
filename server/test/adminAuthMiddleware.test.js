import assert from "node:assert/strict";
import test from "node:test";

process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "AdminStrongPass123!";
process.env.ADMIN_LOGIN_WINDOW_MS = "100";
process.env.ADMIN_LOGIN_MAX_ATTEMPTS = "2";
process.env.ADMIN_LOGIN_MAX_TRACKED_IPS = "5";

const { adminAuthMiddleware } =
  await import("../middleware/adminAuthMiddleware.js");

test("adminAuthMiddleware exports login helpers", () => {
  assert.equal(typeof adminAuthMiddleware.login, "function");
  assert.equal(typeof adminAuthMiddleware._clearAllLoginAttempts, "function");
  assert.equal(typeof adminAuthMiddleware._safeEqual, "function");
});

test("safeEqual compares strings securely", () => {
  const { _safeEqual } = adminAuthMiddleware;
  assert.equal(_safeEqual("hello", "hello"), true);
  assert.equal(_safeEqual("hello", "world"), false);
  assert.equal(_safeEqual("hello", "hello\0"), false);
});

test("login attempt map can be cleared", () => {
  adminAuthMiddleware._clearAllLoginAttempts();
  assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
});
