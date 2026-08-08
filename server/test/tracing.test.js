import { test, describe } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import express from 'express';
import pg from 'pg';

let capturedPgArgs = null;
const originalPgQuery = pg.Client.prototype.query;
pg.Client.prototype.query = function (...args) {
  capturedPgArgs = args;
  return originalPgQuery.apply(this, args);
};

const { appContext, tracedFetch } = await import('../config/appContext.js');
const { tracingMiddleware } = await import('../middleware/tracingMiddleware.js');

describe('API Request Tracing and Distributed Correlation IDs', () => {
  test('generates a new X-Correlation-ID if not provided', async () => {
  test('generates a new X-Request-ID if not provided', async (t) => {
    const app = express();
    app.use(tracingMiddleware);
    let capturedReqId = null;
    let asyncContextReqId = null;
    app.get('/', (req, res) => {
      capturedReqId = req.reqId;
      asyncContextReqId = appContext.getStore()?.reqId;
      res.send('ok');
    });

    const server = app.listen(0);
    t.after(() => server.close());
    const port = server.address().port;

    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(res.status, 200);
    const headerReqId = res.headers.get('X-Correlation-ID');

    assert.ok(capturedReqId, 'reqId should be generated on the request');
    assert.equal(capturedReqId, headerReqId, 'reqId should be exposed in response headers');
    assert.equal(
      asyncContextReqId,
      capturedReqId,
      'reqId should be available in AsyncLocalStorage'
    );
  });

  test('preserves existing X-Correlation-ID if provided', async () => {
  test('preserves existing X-Request-ID if provided', async (t) => {
    const app = express();
    app.use(tracingMiddleware);
    app.get('/', (req, res) => res.send('ok'));

    const server = app.listen(0);
    t.after(() => server.close());
    const port = server.address().port;

    const testId = 'test-correlation-id-123';
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { 'X-Correlation-ID': testId },
    });

    assert.equal(
      res.headers.get('X-Correlation-ID'),
      testId,
      'Should preserve incoming request ID'
    );
  });

  test('prepends reqId to pg client queries', async (t) => {
    // Create a mock client
    const client = new pg.Client({ connectionString: 'postgres://localhost/mock' });
    t.after(() => client.end());

    // We prevent actual execution by throwing inside a mock of the internal method, or just let it fail
    // But since the patch mutates the config object, we can just inspect the object after calling it!
    const testId = 'db-tracing-test-id';
    const config = { text: 'SELECT * FROM users' };

    capturedPgArgs = null;
    appContext.run({ reqId: testId }, () => {
      client.query(config).catch(() => {
        // Intentionally suppressed: we're testing query capture, not query success.
        // The query may fail due to missing DB in test env, but we only care that
        // the pg query wrapper fires the capture callback.
      });
    });

    // Close the client so the event loop doesn't hang
    client.end();

    console.log('capturedPgArgs:', capturedPgArgs);

    assert.ok(capturedPgArgs, 'query should be captured');
    const queryText =
      typeof capturedPgArgs[0] === 'string' ? capturedPgArgs[0] : capturedPgArgs[0]?.text;
    assert.ok(
      config.text.includes(`/* reqId: ${testId} */`),
      'SQL should include the reqId comment'
    );
    assert.ok(config.text.includes('SELECT * FROM users'), 'SQL should include the original query');
  });

  test('injects X-Correlation-ID into downstream fetch calls', async () => {
  test('injects X-Request-ID into downstream fetch calls', async (t) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ header: req.headers['X-Correlation-ID'] }));
    });

    await new Promise((resolve) => server.listen(0, resolve));
    t.after(() => server.close());
    const port = server.address().port;

    const testId = 'fetch-tracing-test-id';
    await appContext.run({ reqId: testId }, async () => {
      const res = await tracedFetch(`http://127.0.0.1:${port}/test`);
      const data = await res.json();
      assert.equal(
        data.header,
        testId,
        'Downstream fetch should have the X-Correlation-ID header injected'
      );
    });
  });
});
