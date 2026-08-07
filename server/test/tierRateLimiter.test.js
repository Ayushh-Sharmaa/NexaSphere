import assert from "node:assert/strict";
import test from "node:test";
import { tierRateLimiter } from "../middleware/tierRateLimiter.js";

test("Tier-Based Rate Limiting & Backoff Middleware Tests", async (t) => {
  await t.test(
    "1. Guest rate limit checks (IP-based keying & headers)",
    async () => {
      const middleware = tierRateLimiter({ capacity: 5, refillRate: 0.1 });
      const req = { ip: "192.168.1.50", adminSession: null, user: null };

      let headers = {};
      const res = {
        setHeader(name, val) {
          headers[name] = val.toString();
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        },
      };

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      // 1st request -> Allowed
      await middleware(req, res, next);
      assert.ok(nextCalled);
      assert.equal(headers["X-RateLimit-Limit"], "5");
      assert.equal(headers["X-RateLimit-Remaining"], "4");

      // Consume remaining 4 tokens
      for (let i = 0; i < 4; i++) {
        nextCalled = false;
        await middleware(req, res, next);
        assert.ok(nextCalled);
      }
      assert.equal(headers["X-RateLimit-Remaining"], "0");

      // 6th request -> Blocked with 429 and Retry-After
      nextCalled = false;
      await middleware(req, res, next);
      assert.ok(!nextCalled);
      assert.equal(res.statusCode, 429);
      assert.ok(headers["Retry-After"]);
      assert.ok(
        res.jsonData.error.includes("Rate limit exceeded") ||
          res.jsonData.error.includes("Too many requests")
      );
    }
  );

  await t.test(
    "2. Authenticated user rate limit checks (higher capacity)",
    async () => {
      const middleware = tierRateLimiter({ capacity: 10, refillRate: 1 });
      const req = {
        ip: "127.0.0.1",
        adminSession: { username: "superadmin", id: "session-123" },
        user: null,
      };

      let headers = {};
      const res = {
        setHeader(name, val) {
          headers[name] = val.toString();
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        },
      };

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      // 1st request allowed
      await middleware(req, res, next);
      assert.ok(nextCalled);
      assert.equal(headers["X-RateLimit-Limit"], "10");
      assert.equal(headers["X-RateLimit-Remaining"], "9");
    }
  );

  await t.test("3. Exponential Backoff Block checks", async () => {
    const middleware = tierRateLimiter({
      capacity: 1,
      refillRate: 0.1,
      baseCooldown: 2,
    });
    const req = { ip: "10.0.0.99", adminSession: null, user: null };

    const res = {
      headers: {},
      setHeader(name, val) {
        this.headers[name] = val.toString();
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    // 1st request -> Allowed (remains 0 tokens)
    await middleware(req, res, next);
    assert.ok(nextCalled);

    // 2nd request -> Violates limit -> Cooldown 1st level: baseCooldown * 2^(1-1) = 2 seconds
    nextCalled = false;
    await middleware(req, res, next);
    assert.ok(!nextCalled);
    assert.equal(res.statusCode, 429);
    assert.equal(res.headers["Retry-After"], "2");

    // 3rd request (while blocked) -> Still blocked with 2s cooldown
    nextCalled = false;
    await middleware(req, res, next);
    assert.ok(!nextCalled);
    assert.equal(res.statusCode, 429);
    assert.equal(res.headers["Retry-After"], "2");
  });
});
