import { test, describe } from "node:test";
import assert from "node:assert";
import http from "http";
import express from "express";
import pg from "pg";
import { appContext } from "../config/appContext.js";
import { tracingMiddleware } from "../middleware/tracingMiddleware.js";

describe("API Request Tracing and Distributed Correlation IDs", () => {
  test("generates a new X-Request-ID if not provided", async () => {
    const app = express();
    app.use(tracingMiddleware);
    let capturedReqId = null;
    let asyncContextReqId = null;
    app.get("/", (req, res) => {
      capturedReqId = req.reqId;
      asyncContextReqId = appContext.getStore()?.reqId;
      res.send("ok");
    });

    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(res.status, 200);
    const headerReqId = res.headers.get("x-request-id");

    server.close();

    assert.ok(capturedReqId, "reqId should be generated on the request");
    assert.equal(
      capturedReqId,
      headerReqId,
      "reqId should be exposed in response headers"
    );
    assert.equal(
      asyncContextReqId,
      capturedReqId,
      "reqId should be available in AsyncLocalStorage"
    );
  });

  test("preserves existing X-Request-ID if provided", async () => {
    const app = express();
    app.use(tracingMiddleware);
    app.get("/", (req, res) => res.send("ok"));

    const server = app.listen(0);
    const port = server.address().port;

    const testId = "test-correlation-id-123";
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { "X-Request-ID": testId },
    });
    server.close();

    assert.equal(
      res.headers.get("x-request-id"),
      testId,
      "Should preserve incoming request ID"
    );
  });

  test("prepends reqId to pg client queries", async () => {
    // Create a mock client
    const client = new pg.Client({
      connectionString: "postgres://localhost/mock",
    });

    // We prevent actual execution by throwing inside a mock of the internal method, or just let it fail
    // But since the patch mutates the config object, we can just inspect the object after calling it!
    const testId = "db-tracing-test-id";
    const config = { text: "SELECT * FROM users" };

    appContext.run({ reqId: testId }, () => {
      client.query(config).catch(() => {}); // Catch any errors, we don't need it to succeed
    });

    // Close the client so the event loop doesn't hang
    client.end();

    assert.ok(
      config.text.includes(`/* reqId: ${testId} */`),
      "SQL should include the reqId comment"
    );
    assert.ok(
      config.text.includes("SELECT * FROM users"),
      "SQL should include the original query"
    );
  });

  test("injects X-Request-ID into downstream fetch calls", async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ header: req.headers["x-request-id"] }));
    });

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const testId = "fetch-tracing-test-id";
    await appContext.run({ reqId: testId }, async () => {
      const res = await fetch(`http://127.0.0.1:${port}/test`);
      const data = await res.json();
      assert.equal(
        data.header,
        testId,
        "Downstream fetch should have the X-Request-ID header injected"
      );
    });

    server.close();
  });
});
