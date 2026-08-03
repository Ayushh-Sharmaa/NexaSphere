const express = require('express');
const router = express.Router();
const client = require('prom-client');

// Initialize Prometheus metrics collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Custom metric: HTTP request duration
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Expose Prometheus metrics
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Standardized health check for Kubernetes liveness/readiness probes
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'up',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  router,
  httpRequestDurationMicroseconds
};
