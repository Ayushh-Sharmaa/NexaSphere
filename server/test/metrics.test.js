import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { initObservability } from '../observability/index.js';
import {
  httpRequestsTotal,
  recordEventRegistration,
  register,
} from '../observability/metrics.js';

test('GET /metrics returns Prometheus text format', async () => {
  const prev = process.env.METRICS_ENABLED;
  process.env.METRICS_ENABLED = 'true';
  process.env.OTEL_ENABLED = 'false';

  const app = express();
  initObservability(app);
  app.get('/ping', (_req, res) => res.status(200).send('ok'));

  const server = app.listen(0);
  const { port } = server.address();

  try {
    await fetch(`http://127.0.0.1:${port}/ping`);
    const res = await fetch(`http://127.0.0.1:${port}/metrics`);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/plain/);
    assert.match(body, /http_requests_total/);
    assert.match(body, /nexasphere_/);
  } finally {
    server.close();
    process.env.METRICS_ENABLED = prev;
  }
});

test('custom counters increment', async () => {
  const metric = register.getSingleMetric('nexasphere_events_registered_total');
  const before = (await metric.get()).values.reduce((sum, v) => sum + v.value, 0);
  recordEventRegistration();
  const after = (await metric.get()).values.reduce((sum, v) => sum + v.value, 0);
  assert.ok(after > before);
});
