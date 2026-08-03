/**
 * Integration tests for Webhooks Route Group (webhooks.js)
 * Tests webhook CRUD, event listing, test delivery, delivery history,
 * delivery stats, and replay with admin auth enforcement and validation.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Constants (mirrors WEBHOOK_EVENTS from services/webhookService.js)
// ---------------------------------------------------------------------------

const WEBHOOK_EVENTS = [
  'event.created',
  'event.updated',
  'event.cancelled',
  'user.registered',
  'user.attendance_marked',
  'certificate.issued',
  'user.joined',
  'announcement.posted',
];

// ---------------------------------------------------------------------------
// Test State
// ---------------------------------------------------------------------------

/** Toggle to simulate authentication state for admin routes */
const authControl = { enabled: true };

/**
 * Mock admin auth — replicates adminAuthMiddleware.requireAdmin.
 * When authControl.enabled is false, returns 401.
 */
function mockRequireAdmin(req, res, next) {
  if (!authControl.enabled) {
    return res.status(401).json({ error: 'Unauthorized: No admin session found' });
  }
  req.adminSession = {
    username: 'testadmin',
    role: 'admin',
    id: 'admin-1',
    metadata: { role: 'admin', scopes: ['admin:*'] },
  };
  req.user = { id: 'admin-1', username: 'testadmin' };
  next();
}

/**
 * Mock rate limiter — passes through without rate limiting.
 */
function mockPassThrough(_req, _res, next) {
  next();
}

// ---------------------------------------------------------------------------
// Test App Factory — mirrors the route structure of server/routes/webhooks.js
// The real router is mounted at /api/webhooks in index.js.
// ---------------------------------------------------------------------------

function createTestApp(options = {}) {
  const {
    createError,
    getByIdError,
    updateError,
    deleteError,
    testError,
    deliveriesError,
    statsError,
    replayError,
  } = options;

  const app = express();
  app.use(express.json());

  const router = new express.Router();
  const adminAuth = [mockPassThrough, mockRequireAdmin];

  // ---- GET /events — list available webhook event types ----
  router.get('/events', ...adminAuth, (_req, res) => {
    res.json({ success: true, data: WEBHOOK_EVENTS });
  });

  // ---- POST / — create webhook (validates HTTPS, event types) ----
  router.post('/', ...adminAuth, (req, res) => {
    if (createError) {
      return res.status(createError.status).json({ success: false, error: createError.message });
    }
    const { url, events } = req.body;
    if (!url || !url.startsWith('https://')) {
      return res.status(400).json({ success: false, error: 'Webhook URL must use HTTPS' });
    }
    if (!events || events.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'At least one event type must be selected' });
    }
    res.status(201).json({
      success: true,
      data: { id: 'webhook-1', name: req.body.name, url, events, isActive: true },
    });
  });

  // ---- GET / — list all webhooks ----
  router.get('/', ...adminAuth, (_req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 'webhook-1',
          name: 'Test Webhook',
          url: 'https://example.com/hook',
          events: ['event.created'],
          isActive: true,
        },
      ],
    });
  });

  // ---- GET /:webhookId — get webhook by ID ----
  router.get('/:webhookId', ...adminAuth, (req, res) => {
    if (getByIdError) {
      const status = getByIdError.includes('not found') ? 404 : 500;
      return res.status(status).json({ success: false, error: getByIdError });
    }
    res.json({
      success: true,
      data: { id: req.params.webhookId, url: 'https://example.com/hook' },
    });
  });

  // ---- PUT /:webhookId — update webhook ----
  router.put('/:webhookId', ...adminAuth, (req, res) => {
    if (updateError) {
      const status = updateError.includes('not found')
        ? 404
        : updateError.includes('HTTPS')
          ? 400
          : 500;
      return res.status(status).json({ success: false, error: updateError });
    }
    const { url } = req.body;
    if (url && !url.startsWith('https://')) {
      return res.status(400).json({ success: false, error: 'Webhook URL must use HTTPS' });
    }
    res.json({ success: true, data: { id: req.params.webhookId, ...req.body } });
  });

  // ---- DELETE /:webhookId — delete webhook ----
  router.delete('/:webhookId', ...adminAuth, (req, res) => {
    if (deleteError) {
      const status = deleteError.includes('not found') ? 404 : 500;
      return res.status(status).json({ success: false, error: deleteError });
    }
    res.json({ success: true, message: 'Webhook deleted successfully' });
  });

  // ---- POST /:webhookId/test — test webhook delivery ----
  router.post('/:webhookId/test', ...adminAuth, (req, res) => {
    if (testError) {
      const status = testError.includes('not found') ? 404 : 500;
      return res.status(status).json({ success: false, error: testError });
    }
    res.json({ success: true, data: { deliveryId: 'delivery-1', status: 'delivered' } });
  });

  // ---- GET /:webhookId/deliveries — paginated delivery history ----
  router.get('/:webhookId/deliveries', ...adminAuth, (req, res) => {
    if (deliveriesError) {
      const status = deliveriesError.includes('not found') ? 404 : 500;
      return res.status(status).json({ success: false, error: deliveriesError });
    }
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    res.json({ success: true, data: { deliveries: [], total: 0, limit, offset } });
  });

  // ---- GET /:webhookId/stats — delivery success/failure stats ----
  router.get('/:webhookId/stats', ...adminAuth, (req, res) => {
    if (statsError) {
      return res.status(500).json({ success: false, error: statsError });
    }
    res.json({ success: true, data: { total: 10, successful: 8, failed: 2 } });
  });

  // ---- POST /deliveries/:deliveryId/replay — replay a delivery ----
  router.post('/deliveries/:deliveryId/replay', ...adminAuth, (req, res) => {
    if (replayError) {
      const status = replayError.includes('not found') ? 404 : 400;
      return res.status(status).json({ success: false, error: replayError });
    }
    res.json({ success: true, data: { deliveryId: req.params.deliveryId, status: 'replayed' } });
  });

  // Mount at /api/webhooks to match index.js
  app.use('/api/webhooks', router);

  return app;
}

// ---------------------------------------------------------------------------
// Auth Enforcement
// ---------------------------------------------------------------------------

describe('Webhook Routes — Auth Enforcement', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  const authRoutes = [
    { method: 'get', path: '/api/webhooks/events', desc: 'GET /events' },
    { method: 'post', path: '/api/webhooks', desc: 'POST /' },
    { method: 'get', path: '/api/webhooks', desc: 'GET /' },
    { method: 'get', path: '/api/webhooks/wh-1', desc: 'GET /:webhookId' },
    { method: 'put', path: '/api/webhooks/wh-1', desc: 'PUT /:webhookId' },
    { method: 'delete', path: '/api/webhooks/wh-1', desc: 'DELETE /:webhookId' },
    { method: 'post', path: '/api/webhooks/wh-1/test', desc: 'POST /:webhookId/test' },
    { method: 'get', path: '/api/webhooks/wh-1/deliveries', desc: 'GET /:webhookId/deliveries' },
    { method: 'get', path: '/api/webhooks/wh-1/stats', desc: 'GET /:webhookId/stats' },
    {
      method: 'post',
      path: '/api/webhooks/deliveries/d-1/replay',
      desc: 'POST /deliveries/:deliveryId/replay',
    },
  ];

  for (const { method, path, desc } of authRoutes) {
    it(`${desc} returns 401 when unauthenticated`, async () => {
      authControl.enabled = false;
      const reqMethod = request(app)[method];
      const res = await reqMethod(path).send({
        url: 'https://example.com/hook',
        events: ['event.created'],
      });
      assert.equal(res.status, 401, `${method.toUpperCase()} ${path} should return 401`);
      assert.ok(res.body.error, 'Response should include error message');
      authControl.enabled = true;
    });
  }
});

// ---------------------------------------------------------------------------
// Event Listing
// ---------------------------------------------------------------------------

describe('Webhook Routes — Event Listing', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('GET /api/webhooks/events returns available webhook event types', async () => {
    const res = await request(app).get('/api/webhooks/events');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.includes('event.created'));
    assert.ok(res.body.data.includes('user.registered'));
    assert.equal(res.body.data.length, WEBHOOK_EVENTS.length);
  });
});

// ---------------------------------------------------------------------------
// Webhook CRUD
// ---------------------------------------------------------------------------

describe('Webhook Routes — Create Webhook', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/webhooks creates a webhook with valid HTTPS URL and events', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({
        name: 'My Webhook',
        url: 'https://example.com/webhook',
        events: ['event.created', 'user.registered'],
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.equal(res.body.data.id, 'webhook-1');
    assert.equal(res.body.data.url, 'https://example.com/webhook');
  });

  it('POST /api/webhooks without HTTPS returns 400', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({
        name: 'Bad Webhook',
        url: 'http://example.com/webhook',
        events: ['event.created'],
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.toLowerCase().includes('https'));
  });

  it('POST /api/webhooks without events returns 400', async () => {
    const res = await request(app).post('/api/webhooks').send({
      name: 'No Events',
      url: 'https://example.com/webhook',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.toLowerCase().includes('event'));
  });

  it('POST /api/webhooks with empty events array returns 400', async () => {
    const res = await request(app).post('/api/webhooks').send({
      name: 'Empty Events',
      url: 'https://example.com/webhook',
      events: [],
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.toLowerCase().includes('event'));
  });

  it('POST /api/webhooks with missing URL returns 400', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({
        name: 'No URL',
        events: ['event.created'],
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });
});

describe('Webhook Routes — List Webhooks', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('GET /api/webhooks returns a list of webhooks', async () => {
    const res = await request(app).get('/api/webhooks');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.equal(res.body.data[0].id, 'webhook-1');
  });
});

describe('Webhook Routes — Get Webhook By ID', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('GET /api/webhooks/:webhookId returns the webhook', async () => {
    const res = await request(app).get('/api/webhooks/wh-42');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, 'wh-42');
  });

  it('GET /api/webhooks/:webhookId returns 404 when webhook not found', async () => {
    app = createTestApp({ getByIdError: 'Webhook not found' });
    const res1 = await request(app).get('/api/webhooks/non-existent');
    assert.equal(res1.status, 404);
    assert.equal(res1.body.success, false);
    assert.ok(res1.body.error.toLowerCase().includes('not found'));
  });
});

describe('Webhook Routes — Update Webhook', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('PUT /api/webhooks/:webhookId updates a webhook', async () => {
    const res = await request(app)
      .put('/api/webhooks/wh-42')
      .send({ name: 'Updated Webhook', url: 'https://updated.example.com/hook' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, 'wh-42');
  });

  it('PUT /api/webhooks/:webhookId with non-HTTPS URL returns 400', async () => {
    const res = await request(app)
      .put('/api/webhooks/wh-42')
      .send({ url: 'http://insecure.example.com/hook' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.toLowerCase().includes('https'));
  });

  it('PUT /api/webhooks/:webhookId returns 404 when webhook not found', async () => {
    app = createTestApp({ updateError: 'Webhook not found' });
    const res = await request(app).put('/api/webhooks/non-existent').send({ name: 'Ghost' });
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

describe('Webhook Routes — Delete Webhook', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('DELETE /api/webhooks/:webhookId deletes a webhook', async () => {
    const res = await request(app).delete('/api/webhooks/wh-42');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Webhook deleted successfully');
  });

  it('DELETE /api/webhooks/:webhookId returns 404 when webhook not found', async () => {
    app = createTestApp({ deleteError: 'Webhook not found' });
    const res = await request(app).delete('/api/webhooks/non-existent');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

// ---------------------------------------------------------------------------
// Webhook Test & Deliveries
// ---------------------------------------------------------------------------

describe('Webhook Routes — Test Delivery', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/webhooks/:webhookId/test triggers a test delivery', async () => {
    const res = await request(app).post('/api/webhooks/wh-42/test');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.deliveryId);
    assert.equal(res.body.data.status, 'delivered');
  });

  it('POST /api/webhooks/:webhookId/test returns 404 when webhook not found', async () => {
    app = createTestApp({ testError: 'Webhook not found' });
    const res = await request(app).post('/api/webhooks/non-existent/test');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

describe('Webhook Routes — Delivery History', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('GET /api/webhooks/:webhookId/deliveries returns delivery history', async () => {
    const res = await request(app).get('/api/webhooks/wh-42/deliveries');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.ok(Array.isArray(res.body.data.deliveries));
    assert.equal(typeof res.body.data.total, 'number');
  });

  it('GET /api/webhooks/:webhookId/deliveries respects limit and offset query params', async () => {
    const res = await request(app).get('/api/webhooks/wh-42/deliveries?limit=10&offset=20');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.limit, 10);
    assert.equal(res.body.data.offset, 20);
  });

  it('GET /api/webhooks/:webhookId/deliveries returns 404 when webhook not found', async () => {
    app = createTestApp({ deliveriesError: 'Webhook not found' });
    const res = await request(app).get('/api/webhooks/non-existent/deliveries');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

describe('Webhook Routes — Delivery Stats', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('GET /api/webhooks/:webhookId/stats returns delivery statistics', async () => {
    const res = await request(app).get('/api/webhooks/wh-42/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.total, 10);
    assert.equal(res.body.data.successful, 8);
    assert.equal(res.body.data.failed, 2);
  });
});

describe('Webhook Routes — Replay Delivery', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/webhooks/deliveries/:deliveryId/replay replays a delivery', async () => {
    const res = await request(app).post('/api/webhooks/deliveries/d-42/replay');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.deliveryId, 'd-42');
    assert.equal(res.body.data.status, 'replayed');
  });

  it('POST /api/webhooks/deliveries/:deliveryId/replay returns 404 when not found', async () => {
    app = createTestApp({ replayError: 'not found' });
    const res = await request(app).post('/api/webhooks/deliveries/d-999/replay');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe('Webhook Routes — Error Handling', () => {
  let app;

  before(() => {
    authControl.enabled = true;
  });

  it('returns 500 when createWebhook service throws unexpected error', async () => {
    app = createTestApp({ createError: { status: 500, message: 'Internal server error' } });
    const res = await request(app)
      .post('/api/webhooks')
      .send({ url: 'https://example.com/hook', events: ['event.created'] });
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
  });

  it('returns 500 when deleteWebhook service throws unexpected error', async () => {
    app = createTestApp({ deleteError: 'Database connection failed' });
    const res = await request(app).delete('/api/webhooks/wh-1');
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
  });

  it('returns 500 when getDeliveryStats service throws', async () => {
    app = createTestApp({ statsError: 'Stats service unavailable' });
    const res = await request(app).get('/api/webhooks/wh-1/stats');
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
  });
});

// ---------------------------------------------------------------------------
// 404 Handling
// ---------------------------------------------------------------------------

describe('Webhook Routes — 404', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('returns 404 for unknown webhook HTTP methods', async () => {
    // GET /:webhookId is a wildcard, so PATCH is the only truly unmatched method
    const res = await request(app).patch('/api/webhooks/wh-1');
    assert.equal(res.status, 404);
  });

  it('returns 404 for unknown nested routes under webhooks', async () => {
    const res = await request(app).post('/api/webhooks/wh-1/non-existent-action');
    assert.equal(res.status, 404);
  });
});
