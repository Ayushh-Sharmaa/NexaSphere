import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";

process.env.NODE_ENV = "test";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "StrongPassword123!";
process.env.ADMIN_EVENT_PASSWORD = "StrongEventPassword123!";
process.env.CORS_ORIGIN = "http://localhost:3000,http://localhost:5173";
process.env.JWT_SECRET =
  "secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit";
process.env.PORT = "0";

test("CORS Policy Configuration Verification", async (t) => {
  const { default: app } = await import("../index.js");
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const sendRequest = (method, originHeader, path = "/health") => {
    return new Promise((resolve) => {
      const options = {
        hostname: "localhost",
        port: port,
        path: path,
        method: method,
        headers: originHeader ? { Origin: originHeader } : {},
      };

      const req = http.request(options, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
        });
      });
      req.end();
    });
  };

  try {
    await t.test("1. Whitelisted origin is allowed", async () => {
      const res = await sendRequest("GET", "http://localhost:5173");
      assert.equal(res.status, 200);
      assert.equal(
        res.headers["access-control-allow-origin"],
        "http://localhost:5173"
      );
      assert.equal(res.headers["access-control-allow-credentials"], "true");
    });

    await t.test(
      "2. Disallowed origin is blocked (rejected by CORS handler)",
      async () => {
        const res = await sendRequest("GET", "http://malicious-domain.com");
        assert.ok(res.status >= 400);
        assert.equal(res.headers["access-control-allow-origin"], undefined);
      }
    );

    await t.test("3. Preflight OPTIONS request handling", async () => {
      const res = await sendRequest("OPTIONS", "http://localhost:5173");
      assert.equal(res.status, 204);
      assert.equal(
        res.headers["access-control-allow-origin"],
        "http://localhost:5173"
      );
      assert.equal(
        res.headers["access-control-allow-methods"],
        "GET,POST,PUT,DELETE,OPTIONS"
      );
      assert.equal(res.headers["access-control-max-age"], "86400");
    });
  } finally {
    server.close();
  }
});
