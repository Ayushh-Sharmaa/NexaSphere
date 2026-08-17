import assert from "node:assert/strict";
import test from "node:test";

process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "AdminStrongPass123!";
process.env.ADMIN_LOGIN_WINDOW_MS = "100";
process.env.ADMIN_LOGIN_MAX_ATTEMPTS = "2";
process.env.ADMIN_LOGIN_MAX_TRACKED_IPS = "5";

const { adminAuthMiddleware } =
  await import("../middleware/adminAuthMiddleware.js");
const { setWithDbOverride } = await import("../repositories/db.js");

setWithDbOverride(async (fn) => {
  const mockClient = {
    query: async () => ({
      rows: [
        {
          id: "1",
          admin_username: "admin",
          mfa_secret: null,
          mfa_enabled: false,
          backup_codes: "[]",
        },
      ],
    }),
  };
  return fn(mockClient);
});

const createMockReqRes = (ip, username, password) => {
  const req = {
    body: { username, password },
    ip,
    headers: {},
    get: () => "",
  };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    cookie() {
      return this;
    },
    clearCookie() {
      return this;
    },
    statusCode() {
      return statusCode;
    },
    responseData() {
      return responseData;
    },
  };
  return { req, res };
};

test("Security + Concurrency Validation", async (t) => {
  await t.test("Initial map is empty", () => {
    adminAuthMiddleware._clearAllLoginAttempts();
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test("Expired entries cleanup works", async () => {
    adminAuthMiddleware._clearAllLoginAttempts();
    const { req, res } = createMockReqRes("192.168.0.1", "admin", "wrongpass");
    await adminAuthMiddleware.login(req, res);
    assert.equal(res.statusCode(), 401);
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 1);
    await new Promise((resolve) => setTimeout(resolve, 150));
    adminAuthMiddleware._cleanupExpiredAttempts();
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test("Successful login clears attempts", async () => {
    adminAuthMiddleware._clearAllLoginAttempts();
    const ip = "192.168.0.2";
    const failed = createMockReqRes(ip, "admin", "wrongpass");
    await adminAuthMiddleware.login(failed.req, failed.res);
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 1);
    const success = createMockReqRes(ip, "admin", "AdminStrongPass123!");
    await adminAuthMiddleware.login(success.req, success.res);
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test("Rate limiting blocks brute force", async () => {
    adminAuthMiddleware._clearAllLoginAttempts();
    const ip = "192.168.0.3";
    for (let i = 0; i < 3; i += 1) {
      const { req, res } = createMockReqRes(ip, "admin", "wrongpass");
      await adminAuthMiddleware.login(req, res);
      assert.equal(res.statusCode(), 401);
    }
    const blocked = createMockReqRes(ip, "admin", "wrongpass");
    await adminAuthMiddleware.login(blocked.req, blocked.res);
    assert.equal(blocked.res.statusCode(), 429);
  });

  await t.test("FIFO eviction stays bounded", async () => {
    adminAuthMiddleware._clearAllLoginAttempts();
    for (let i = 1; i <= 6; i += 1) {
      const { req, res } = createMockReqRes(
        `10.0.0.${i}`,
        "admin",
        "wrongpass"
      );
      await adminAuthMiddleware.login(req, res);
    }
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);
  });

  await t.test("Massive forwarded header is safe", async () => {
    adminAuthMiddleware._clearAllLoginAttempts();
    const req = {
      body: { username: "admin", password: "wrongpass" },
      headers: { "x-forwarded-for": `1.1.1.1,${"A".repeat(50000)}` },
      get: () => "",
    };
    let code = 200;
    const res = {
      status(status) {
        code = status;
        return this;
      },
      json() {
        return this;
      },
    };
    await adminAuthMiddleware.login(req, res);
    assert.equal(code, 401);
  });

  await t.test("Concurrent request stress test", async () => {
    adminAuthMiddleware._clearAllLoginAttempts();
    const total = 1000;
    const jobs = [];
    const start = Date.now();
    for (let i = 0; i < total; i += 1) {
      const { req, res } = createMockReqRes(
        `172.16.0.${i % 255}`,
        "admin",
        "wrongpass"
      );
      jobs.push(adminAuthMiddleware.login(req, res));
    }
    await Promise.all(jobs);
    const duration = Date.now() - start;
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);
    assert.ok(
      duration < 2000,
      `Expected stress test under 2 seconds, received ${duration}ms`
    );
  });
});

test("logout rejects when no active session is present", async () => {
  const { req, res } = createMockReqRes("127.0.0.1", "", "");
  await adminAuthMiddleware.logout(req, res);
  assert.equal(res.statusCode(), 401);
  assert.equal(res.responseData().error, "No active session to revoke");
});

test("safeEqual verifies string equality securely and correctly", () => {
  const { _safeEqual } = adminAuthMiddleware;
  assert.equal(_safeEqual("hello", "hello"), true);
  assert.equal(_safeEqual("", ""), true);
  assert.equal(_safeEqual("hello", "world"), false);
  assert.equal(_safeEqual("hello", "hell"), false);
  assert.equal(_safeEqual("hell", "hello"), false);
  assert.equal(_safeEqual("hello", "hello\0"), false);
  assert.equal(_safeEqual("hello\0", "hello"), false);
  const longStringA = "a".repeat(100);
  const longStringB = "a".repeat(100);
  const longStringC = `${"a".repeat(99)}b`;
  assert.equal(_safeEqual(longStringA, longStringB), true);
  assert.equal(_safeEqual(longStringA, longStringC), false);
});
