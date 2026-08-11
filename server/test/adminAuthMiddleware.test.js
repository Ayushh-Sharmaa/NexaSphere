import assert from "node:assert/strict";
import test from "node:test";

// Configure environment variables
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'AdminStrongPass123!';
process.env.ADMIN_LOGIN_WINDOW_MS = '100';
process.env.ADMIN_LOGIN_MAX_ATTEMPTS = '2';
process.env.ADMIN_LOGIN_MAX_TRACKED_IPS = '5';
process.env.ADMIN_PASSWORD = 'dummy-test-password-do-not-use';
process.env.ADMIN_LOGIN_WINDOW_MS = '100'; // Short window for testing: 100ms
process.env.ADMIN_LOGIN_MAX_ATTEMPTS = '2'; // Trigger rate limit after attempts > 2
process.env.ADMIN_LOGIN_MAX_TRACKED_IPS = '5'; // Keep tracked limit low to test eviction instantly

const { adminAuthMiddleware } = await import('../middleware/adminAuthMiddleware.js');
const { setWithDbOverride } = await import('../repositories/db.js');

setWithDbOverride(async (fn) => {
  const mockClient = {
    query: async (text, params) => {
      return {
        rows: [
          {
            id: '1',
            admin_username: 'admin',
            mfa_secret: null,
            mfa_enabled: false,
            backup_codes: '[]',
          },
        ],
      };
    },
  };
  return fn(mockClient);
});

// Helper
const createMockReqRes = (ip, username, password) => {
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "AdminStrongPass123!";
process.env.ADMIN_LOGIN_WINDOW_MS = "100";
process.env.ADMIN_LOGIN_MAX_ATTEMPTS = "2";
process.env.ADMIN_LOGIN_MAX_TRACKED_IPS = "5";

// Helper
const createMockReqRes = (
  ip,
  username,
  password
) => {

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

test('Security + Concurrency Validation', async (t) => {
  await t.test('Initial map is empty', () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
    const { adminAuthMiddleware } =
      await import(
        "../middleware/adminAuthMiddleware.js"
      );
  const { adminAuthMiddleware } = await import('../middleware/adminAuthMiddleware.js');

  await t.test('Initial map is empty', () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test('Expired entries cleanup works', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const { req, res } = createMockReqRes('192.168.0.1', 'admin', 'wrongpass');

    await adminAuthMiddleware.login(req, res);

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const { req, res } =
          createMockReqRes(
            "192.168.0.1",
            "admin",
            "wrongpass"
          );

        await adminAuthMiddleware.login(
          req,
          res
        );

        assert.equal(
          res.statusCode(),
          401
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          1
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 150)
        );

        adminAuthMiddleware
          ._cleanupExpiredAttempts();

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          0
        );
      }
    );

    await t.test(
      "Successful login clears attempts",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const ip = "192.168.0.2";

        const failed =
          createMockReqRes(
            ip,
            "admin",
            "wrongpass"
          );

        await adminAuthMiddleware.login(
          failed.req,
          failed.res
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          1
        );

        const success =
          createMockReqRes(
            ip,
            "admin",
            "AdminStrongPass123!"
          );

        await adminAuthMiddleware.login(
          success.req,
          success.res
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          0
        );
      }
    );

    await t.test(
      "Rate limiting blocks brute force",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const ip = "192.168.0.3";

        for (let i = 0; i < 3; i++) {

          const { req, res } =
            createMockReqRes(
              ip,
              "admin",
              "wrongpass"
            );

          await adminAuthMiddleware.login(
            req,
            res
          );

          assert.equal(
            res.statusCode(),
            401
          );
        }

        const blocked =
          createMockReqRes(
            ip,
            "admin",
            "wrongpass"
          );

        await adminAuthMiddleware.login(
          blocked.req,
          blocked.res
        );

        assert.equal(
          blocked.res.statusCode(),
          429
        );
      }
    );

    await t.test(
      "FIFO eviction stays bounded",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        for (let i = 1; i <= 6; i++) {

          const { req, res } =
            createMockReqRes(
              `10.0.0.${i}`,
              "admin",
              "wrongpass"
            );

          await adminAuthMiddleware.login(
            req,
            res
          );
        }

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          5
        );
      }
    );

    await t.test(
      "Massive forwarded header is safe",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const req = {
          body: {
            username: "admin",
            password: "wrongpass",
          },

          headers: {
            "x-forwarded-for":
              "1.1.1.1," +
              "A".repeat(50000),
          },

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

        await adminAuthMiddleware.login(
          req,
          res
        );

        assert.equal(code, 401);
      }
    );

    await t.test(
      "Concurrent request stress test",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const total = 1000;

        const jobs = [];

        const start = Date.now();

        for (let i = 0; i < total; i++) {

          const { req, res } =
            createMockReqRes(
              `172.16.0.${i % 255}`,
              "admin",
              "wrongpass"
            );

          jobs.push(
            adminAuthMiddleware.login(
              req,
              res
            )
          );
        }

        await Promise.all(jobs);

        const duration =
          Date.now() - start;

        console.log(
          `[Stress Test] ${total} requests processed in ${duration}ms`
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          5
        );

        assert.ok(duration < 500);
      }
    );

    await t.test(
      "logout rejects when no active session is present",
      async () => {
        const { req, res } = createMockReqRes(
          "127.0.0.1",
          "",
          ""
        );
        await adminAuthMiddleware.logout(req, res);
        assert.equal(res.statusCode(), 401);
        assert.equal(res.responseData().error, 'No active session to revoke');
      }
    );

    await t.test('safeEqual verifies string equality securely and correctly', () => {
      const { _safeEqual } = adminAuthMiddleware;

      // Correct comparison
      assert.equal(_safeEqual('hello', 'hello'), true);
      assert.equal(_safeEqual('', ''), true);

      // Incorrect comparison
      assert.equal(_safeEqual('hello', 'world'), false);
      assert.equal(_safeEqual('hello', 'hell'), false);
      assert.equal(_safeEqual('hell', 'hello'), false);

      // Null-byte collision safety (tests against previous Buffer allocation vulnerability)
      assert.equal(_safeEqual('hello', 'hello\0'), false);
      assert.equal(_safeEqual('hello\0', 'hello'), false);

      // Truncation/large string safety (tests against previous 64-byte padding limit)
      const longStringA = 'a'.repeat(100);
      const longStringB = 'a'.repeat(100);
      const longStringC = 'a'.repeat(99) + 'b';
      assert.equal(_safeEqual(longStringA, longStringB), true);
      assert.equal(_safeEqual(longStringA, longStringC), false);
    });
  }
);
    assert.equal(res.statusCode(), 401);

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 1);

    await new Promise((resolve) => setTimeout(resolve, 150));

    adminAuthMiddleware._cleanupExpiredAttempts();

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test('Successful login clears attempts', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const ip = '192.168.0.2';

    const failed = createMockReqRes(ip, 'admin', 'wrongpass');

    await adminAuthMiddleware.login(failed.req, failed.res);

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 1);

    const success = createMockReqRes(ip, 'admin', 'AdminStrongPass123!');

    await adminAuthMiddleware.login(success.req, success.res);

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test('Rate limiting blocks brute force', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const ip = '192.168.0.3';

    for (let i = 0; i < 3; i++) {
      const { req, res } = createMockReqRes(ip, 'admin', 'wrongpass');

      await adminAuthMiddleware.login(req, res);

      assert.equal(res.statusCode(), 401);
    }

    const blocked = createMockReqRes(ip, 'admin', 'wrongpass');

    await adminAuthMiddleware.login(blocked.req, blocked.res);

    assert.equal(blocked.res.statusCode(), 429);
  });

  await t.test('FIFO eviction stays bounded', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    for (let i = 1; i <= 6; i++) {
      const { req, res } = createMockReqRes(`10.0.0.${i}`, 'admin', 'wrongpass');

      await adminAuthMiddleware.login(req, res);
    }

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);
  });

  await t.test('Massive forwarded header is safe', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const req = {
      body: {
        username: 'admin',
        password: 'wrongpass',
      },

      headers: {
        'x-forwarded-for': '1.1.1.1,' + 'A'.repeat(50000),
      },

      get: () => '',
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

  await t.test('Concurrent request stress test', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const total = 1000;

    const jobs = [];

    const start = Date.now();

    for (let i = 0; i < total; i++) {
      const { req, res } = createMockReqRes(`172.16.0.${i % 255}`, 'admin', 'wrongpass');

      jobs.push(adminAuthMiddleware.login(req, res));
    }

    await Promise.all(jobs);

    const duration = Date.now() - start;

    console.log(`[Stress Test] ${total} requests processed in ${duration}ms`);

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);

    assert.ok(duration < 500);
  });

  await t.test('Expired entries cleanup works', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const { req, res } = createMockReqRes('192.168.0.1', 'admin', 'wrongpass');
    const ip = '192.168.1.50';
    const { req, res } = createMockReqRes(ip, 'admin', 'wrongpass');

    await adminAuthMiddleware.login(req, res);

    assert.equal(res.statusCode(), 401);

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 1);

    await new Promise((resolve) => setTimeout(resolve, 150));

    adminAuthMiddleware._cleanupExpiredAttempts();

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test('Successful login clears attempts', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const ip = '192.168.0.2';

    const failed = createMockReqRes(ip, 'admin', 'wrongpass');

    await adminAuthMiddleware.login(failed.req, failed.res);

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 1);

    const success = createMockReqRes(ip, 'admin', 'AdminStrongPass123!');

    await adminAuthMiddleware.login(success.req, success.res);

    const ip = '192.168.1.60';

    // Failed attempt 1
    const { req: reqFail, res: resFail } = createMockReqRes(ip, 'admin', 'wrongpass');
    await adminAuthMiddleware.login(reqFail, resFail);
    assert.equal(resFail.statusCode(), 401);
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 1);

    // Successful attempt
    const { req: reqSuccess, res: resSuccess } = createMockReqRes(
      ip,
      'admin',
      'AdminStrongPass123!'
    );
    const { req: reqSuccess, res: resSuccess } = createMockReqRes(ip, 'admin', 'dummy-test-password-do-not-use');
    await adminAuthMiddleware.login(reqSuccess, resSuccess);

    // The credentials match and success returns 200 (or calls createAdminSession which fails because DB isn't connected, returning 500 but it should have cleared the attempts first!)
    // Yes! clearLoginAttempts(ip) is called before createAdminSession:
    // 113: clearLoginAttempts(ip);
    // 115: const session = await createAdminSession({...})
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 0);
  });

  await t.test('Rate limiting blocks brute force', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const ip = '192.168.0.3';
    const ip = '192.168.1.70';

    // Attempt 1: Failed (Attempts set to 1)
    const { req: req1, res: res1 } = createMockReqRes(ip, 'admin', 'wrongpass');
    await adminAuthMiddleware.login(req1, res1);
    assert.equal(res1.statusCode(), 401);

    for (let i = 0; i < 3; i++) {
      const { req, res } = createMockReqRes(ip, 'admin', 'wrongpass');

      await adminAuthMiddleware.login(req, res);

      assert.equal(res.statusCode(), 401);
    }

    const blocked = createMockReqRes(ip, 'admin', 'wrongpass');

    await adminAuthMiddleware.login(blocked.req, blocked.res);

    assert.equal(blocked.res.statusCode(), 429);
  });

  await t.test('FIFO eviction stays bounded', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    for (let i = 1; i <= 6; i++) {
      const { req, res } = createMockReqRes(`10.0.0.${i}`, 'admin', 'wrongpass');

      await adminAuthMiddleware.login(req, res);
    }

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);
  });

  await t.test('Massive forwarded header is safe', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const massiveHeader = '1.1.1.1,' + 'A'.repeat(50000);
    const req = {
      body: {
        username: 'admin',
        password: 'wrongpass',
      },

      headers: {
        'x-forwarded-for': '1.1.1.1,' + 'A'.repeat(50000),
      },

      get: () => '',
    };

    let code = 200;

    const res = {
      status(status) {
        code = status;
        return this;
      },

    let statusCode = 200;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };

    await adminAuthMiddleware.login(req, res);

    assert.equal(code, 401);
  });

  await t.test('Concurrent request stress test', async () => {
    adminAuthMiddleware._clearAllLoginAttempts();

    const total = 1000;

    const jobs = [];

    const start = Date.now();

    for (let i = 0; i < total; i++) {
      const { req, res } = createMockReqRes(`172.16.0.${i % 255}`, 'admin', 'wrongpass');

      jobs.push(adminAuthMiddleware.login(req, res));
    }

    await Promise.all(jobs);

    const duration = Date.now() - start;

    console.log(`[Stress Test] ${total} requests processed in ${duration}ms`);

    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);

  await t.test(
    'Adversarial: Eviction priority evicts blocked IPs before unblocked ones',
    async () => {
      adminAuthMiddleware._clearAllLoginAttempts();

      const blockedIp = '10.0.0.1';
      const unblockedIp = '10.0.0.2';

      // Block blockedIp with 3 failed attempts (> max 2)
      for (let i = 0; i < 3; i++) {
        const { req, res } = createMockReqRes(blockedIp, 'admin', 'wrongpass');
        await adminAuthMiddleware.login(req, res);
      }
      const { req: reqCheckBlocked, res: resCheckBlocked } = createMockReqRes(
        blockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqCheckBlocked, resCheckBlocked);
      assert.equal(resCheckBlocked.statusCode(), 429);

      // Add unblockedIp with 1 failed attempt
      const { req: reqUnblocked, res: resUnblocked } = createMockReqRes(
        unblockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqUnblocked, resUnblocked);
      assert.equal(resUnblocked.statusCode(), 401);

      // Flood map with 8 more unique IPs to fill past capacity (5) and trigger eviction
      for (let i = 3; i <= 10; i++) {
        const { req, res } = createMockReqRes(`10.0.0.${i}`, 'admin', 'wrongpass');
        await adminAuthMiddleware.login(req, res);
      }

      assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);

      // blockedIp must be evicted (blocked IPs are evicted first)
      const { req: reqVerifyEvicted, res: resVerifyEvicted } = createMockReqRes(
        blockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqVerifyEvicted, resVerifyEvicted);
      assert.equal(resVerifyEvicted.statusCode(), 401);

      // unblockedIp must still be in map (unblocked IPs preserved)
      const { req: reqVerifyPreserved, res: resVerifyPreserved } = createMockReqRes(
        unblockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqVerifyPreserved, resVerifyPreserved);
      assert.equal(resVerifyPreserved.statusCode(), 401);
    }
  await t.test(
    'Adversarial: Eviction priority evicts blocked IPs before unblocked ones',
    async () => {
      adminAuthMiddleware._clearAllLoginAttempts();

      const blockedIp = '10.0.0.1';
      const unblockedIp = '10.0.0.2';

      // Block blockedIp with 3 failed attempts (> max 2)
      for (let i = 0; i < 3; i++) {
        const { req, res } = createMockReqRes(blockedIp, 'admin', 'wrongpass');
        await adminAuthMiddleware.login(req, res);
      }
      const { req: reqCheckBlocked, res: resCheckBlocked } = createMockReqRes(
        blockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqCheckBlocked, resCheckBlocked);
      assert.equal(resCheckBlocked.statusCode(), 429);

      // Add unblockedIp with 1 failed attempt
      const { req: reqUnblocked, res: resUnblocked } = createMockReqRes(
        unblockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqUnblocked, resUnblocked);
      assert.equal(resUnblocked.statusCode(), 401);

      // Flood map with 8 more unique IPs to fill past capacity (5) and trigger eviction
      for (let i = 3; i <= 10; i++) {
        const { req, res } = createMockReqRes(`10.0.0.${i}`, 'admin', 'wrongpass');
        await adminAuthMiddleware.login(req, res);
      }

      assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);

      // blockedIp must be evicted (blocked IPs are evicted first)
      const { req: reqVerifyEvicted, res: resVerifyEvicted } = createMockReqRes(
        blockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqVerifyEvicted, resVerifyEvicted);
      assert.equal(resVerifyEvicted.statusCode(), 401);

      // unblockedIp must still be in map (unblocked IPs preserved)
      const { req: reqVerifyPreserved, res: resVerifyPreserved } = createMockReqRes(
        unblockedIp,
        'admin',
        'wrongpass'
      );
      await adminAuthMiddleware.login(reqVerifyPreserved, resVerifyPreserved);
      assert.equal(resVerifyPreserved.statusCode(), 401);
    }
  await t.test(
    'Adversarial: Eviction priority evicts blocked IPs before unblocked ones',
    async () => {
      adminAuthMiddleware._clearAllLoginAttempts();

      const blockedIp = '10.0.0.1';
      const unblockedIp = '10.0.0.2';

      // Block blockedIp with 3 failed attempts (> max 2)
      for (let i = 0; i < 3; i++) {
        const { req, res } = createMockReqRes(blockedIp, 'admin', 'wrongpass');
        await adminAuthMiddleware.login(req, res);
test(
  "Security + Concurrency Validation",
  async (t) => {

    const { adminAuthMiddleware } =
      await import(
        "../middleware/adminAuthMiddleware.js"
      );

    await t.test(
      "Initial map is empty",
      () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          0
        );
      }
    );
    assert.equal(adminAuthMiddleware._getLoginAttemptsMapSize(), 5);
    assert.ok(duration < 500);
  });
});

test('safeEqual verifies string equality securely and correctly', () => {
  const { _safeEqual } = adminAuthMiddleware;

  // Correct comparison
  assert.equal(_safeEqual('hello', 'hello'), true);
  assert.equal(_safeEqual('', ''), true);

  // Incorrect comparison
  assert.equal(_safeEqual('hello', 'world'), false);
  assert.equal(_safeEqual('hello', 'hell'), false);
  assert.equal(_safeEqual('hell', 'hello'), false);

  // Null-byte collision safety (tests against previous Buffer allocation vulnerability)
  assert.equal(_safeEqual('hello', 'hello\0'), false);
  assert.equal(_safeEqual('hello\0', 'hello'), false);

  // Truncation/large string safety (tests against previous 64-byte padding limit)
  const longStringA = 'a'.repeat(100);
  const longStringB = 'a'.repeat(100);
  const longStringC = 'a'.repeat(99) + 'b';
  assert.equal(_safeEqual(longStringA, longStringB), true);
  assert.equal(_safeEqual(longStringA, longStringC), false);
  await t.test('safeEqual verifies string equality securely and correctly', () => {
    const { _safeEqual } = adminAuthMiddleware;

    // Correct comparison
    assert.equal(_safeEqual('hello', 'hello'), true);
    assert.equal(_safeEqual('', ''), true);

    // Incorrect comparison
    assert.equal(_safeEqual('hello', 'world'), false);
    assert.equal(_safeEqual('hello', 'hell'), false);
    assert.equal(_safeEqual('hell', 'hello'), false);

    // Null-byte collision safety (tests against previous Buffer allocation vulnerability)
    assert.equal(_safeEqual('hello', 'hello\0'), false);
    assert.equal(_safeEqual('hello\0', 'hello'), false);

    // Truncation/large string safety (tests against previous 64-byte padding limit)
    const longStringA = 'a'.repeat(100);
    const longStringB = 'a'.repeat(100);
    const longStringC = 'a'.repeat(99) + 'b';
    assert.equal(_safeEqual(longStringA, longStringB), true);
    assert.equal(_safeEqual(longStringA, longStringC), false);
  });
});

test('safeEqual verifies string equality securely and correctly', () => {
  const { _safeEqual } = adminAuthMiddleware;

  // Correct comparison
  assert.equal(_safeEqual('hello', 'hello'), true);
  assert.equal(_safeEqual('', ''), true);

  // Incorrect comparison
  assert.equal(_safeEqual('hello', 'world'), false);
  assert.equal(_safeEqual('hello', 'hell'), false);
  assert.equal(_safeEqual('hell', 'hello'), false);

  // Null-byte collision safety (tests against previous Buffer allocation vulnerability)
  assert.equal(_safeEqual('hello', 'hello\0'), false);
  assert.equal(_safeEqual('hello\0', 'hello'), false);

  // Truncation/large string safety (tests against previous 64-byte padding limit)
  const longStringA = 'a'.repeat(100);
  const longStringB = 'a'.repeat(100);
  const longStringC = 'a'.repeat(99) + 'b';
  assert.equal(_safeEqual(longStringA, longStringB), true);
  assert.equal(_safeEqual(longStringA, longStringC), false);

    await t.test(
      "Expired entries cleanup works",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const { req, res } =
          createMockReqRes(
            "192.168.0.1",
            "admin",
            "wrongpass"
          );

        await adminAuthMiddleware.login(
          req,
          res
        );

        assert.equal(
          res.statusCode(),
          401
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          1
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 150)
        );

        adminAuthMiddleware
          ._cleanupExpiredAttempts();

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          0
        );
      }
    );

    await t.test(
      "Successful login clears attempts",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const ip = "192.168.0.2";

        const failed =
          createMockReqRes(
            ip,
            "admin",
            "wrongpass"
          );

        await adminAuthMiddleware.login(
          failed.req,
          failed.res
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          1
        );

        const success =
          createMockReqRes(
            ip,
            "admin",
            "AdminStrongPass123!"
          );

        await adminAuthMiddleware.login(
          success.req,
          success.res
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          0
        );
      }
    );

    await t.test(
      "Rate limiting blocks brute force",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const ip = "192.168.0.3";

        for (let i = 0; i < 3; i++) {

          const { req, res } =
            createMockReqRes(
              ip,
              "admin",
              "wrongpass"
            );

          await adminAuthMiddleware.login(
            req,
            res
          );

          assert.equal(
            res.statusCode(),
            401
          );
        }

        const blocked =
          createMockReqRes(
            ip,
            "admin",
            "wrongpass"
          );

        await adminAuthMiddleware.login(
          blocked.req,
          blocked.res
        );

        assert.equal(
          blocked.res.statusCode(),
          429
        );
      }
    );

    await t.test(
      "FIFO eviction stays bounded",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        for (let i = 1; i <= 6; i++) {

          const { req, res } =
            createMockReqRes(
              `10.0.0.${i}`,
              "admin",
              "wrongpass"
            );

          await adminAuthMiddleware.login(
            req,
            res
          );
        }

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          5
        );
      }
    );

    await t.test(
      "Massive forwarded header is safe",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const req = {
          body: {
            username: "admin",
            password: "wrongpass",
          },

          headers: {
            "x-forwarded-for":
              "1.1.1.1," +
              "A".repeat(50000),
          },

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

        await adminAuthMiddleware.login(
          req,
          res
        );

        assert.equal(code, 401);
      }
    );

    await t.test(
      "Concurrent request stress test",
      async () => {

        adminAuthMiddleware
          ._clearAllLoginAttempts();

        const total = 1000;

        const jobs = [];

        const start = Date.now();

        for (let i = 0; i < total; i++) {

          const { req, res } =
            createMockReqRes(
              `172.16.0.${i % 255}`,
              "admin",
              "wrongpass"
            );

          jobs.push(
            adminAuthMiddleware.login(
              req,
              res
            )
          );
        }

        await Promise.all(jobs);

        const duration =
          Date.now() - start;

        console.log(
          `[Stress Test] ${total} requests processed in ${duration}ms`
        );

        assert.equal(
          adminAuthMiddleware
            ._getLoginAttemptsMapSize(),
          5
        );

        assert.ok(duration < 500);
      }
    );
  }
);
```
    assert.equal(res.statusCode(), 401);
    assert.equal(res.responseData().error, 'No active session to revoke');
  });

  await t.test('safeEqual verifies string equality securely and correctly', () => {
    const { _safeEqual } = adminAuthMiddleware;

    // Correct comparison
    assert.equal(_safeEqual('hello', 'hello'), true);
    assert.equal(_safeEqual('', ''), true);

    // Incorrect comparison
    assert.equal(_safeEqual('hello', 'world'), false);
    assert.equal(_safeEqual('hello', 'hell'), false);
    assert.equal(_safeEqual('hell', 'hello'), false);

    // Null-byte collision safety (tests against previous Buffer allocation vulnerability)
    assert.equal(_safeEqual('hello', 'hello\0'), false);
    assert.equal(_safeEqual('hello\0', 'hello'), false);

    // Truncation/large string safety (tests against previous 64-byte padding limit)
    const longStringA = 'a'.repeat(100);
    const longStringB = 'a'.repeat(100);
    const longStringC = 'a'.repeat(99) + 'b';
    assert.equal(_safeEqual(longStringA, longStringB), true);
    assert.equal(_safeEqual(longStringA, longStringC), false);
  });
});
