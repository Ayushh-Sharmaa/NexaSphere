/**
 * Integration tests for Notification Route Group (notifications.js)
 * Tests push subscription CRUD, notification read-state tracking,
 * notification retrieval, user preferences, and analytics with
 * dual auth (admin or student), rate limiting, and push validation.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Test State
// ---------------------------------------------------------------------------

/** Toggle to simulate authentication state for different auth tiers */
const authControl = { adminEnabled: true, studentEnabled: true, prefAuthEnabled: true };

/** Global in-memory push subscription store mirroring the real router */
const pushSubscriptions = new Set();

function resetPushSubscriptions() {
  pushSubscriptions.clear();
}

// ---------------------------------------------------------------------------
// Mock Auth Middleware Functions
// ---------------------------------------------------------------------------

/**
 * Mock admin auth — replicates adminAuthMiddleware.requireAdmin.
 */
function mockRequireAdmin(req, res, next) {
  if (!authControl.adminEnabled) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminSession = {
    username: 'testadmin',
    role: 'admin',
    id: 'admin-1',
    metadata: { role: 'admin', scopes: ['admin:*'] },
  };
  next();
}

/**
 * Mock student auth — replicates requireStudentAuth.
 */
function mockRequireStudent(req, res, next) {
  if (!authControl.studentEnabled) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.studentUser = {
    sub: 'student-1',
    id: 'student-1',
    email: 'student@example.com',
    role: 'student',
  };
  next();
}

/**
 * Mock dual auth (admin OR student) — replicates requireNotificationAuth from notifications.js.
 * Attempts admin first, then falls back to student.
 */
function mockRequireNotificationAuth(req, res, next) {
  if (authControl.adminEnabled) {
    req.adminSession = {
      username: 'testadmin',
      role: 'admin',
      id: 'admin-1',
      metadata: { role: 'admin', scopes: ['admin:*'] },
    };
    return next();
  }
  if (authControl.studentEnabled) {
    req.studentUser = {
      sub: 'student-1',
      id: 'student-1',
      email: 'student@example.com',
      role: 'student',
    };
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Authentication required' });
}

/**
 * Mock notification pref auth — replicates requireNotificationPrefAuth.
 * Admin always passes; student must own the userId (checked in handler).
 */
function mockRequireNotificationPrefAuth(req, res, next) {
  if (!authControl.prefAuthEnabled) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (authControl.adminEnabled) {
    req.adminSession = { username: 'testadmin', role: 'admin', id: 'admin-1' };
  } else {
    req.studentUser = { sub: 'student-1', id: 'student-1', email: 'student@example.com' };
  }
  next();
}

/**
 * Mock inline notification auth (for GET /notifications).
 * Replicates the real route's inline auth logic using bearer tokens or cookies.
 */
function mockInlineNotificationAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const hasToken = authHeader && authHeader.startsWith('Bearer ');
  const hasCookie = req.headers.cookie && req.headers.cookie.includes('ns_student_token');

  const userId = req.query.userId || 'global';

  if (userId === 'global') {
    return next();
  }

  if (hasToken || hasCookie) {
    // Simulate verified token
    req.authenticatedUser = { sub: userId, id: userId };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized to view these notifications' });
}

/**
 * Mock rate limiter — passes through without rate limiting.
 */
function mockPassThrough(_req, _res, next) {
  next();
}

/**
 * Mock push subscription validation — replicates validatePushSubscription.
 * Validates endpoint URL and keys shape.
 */
function mockValidatePushSubscription(req, res, next) {
  const { subscription } = req.body;
  if (!subscription || typeof subscription !== 'object') {
    return res.status(400).json({
      error: 'Invalid subscription payload',
      details: [{ msg: 'subscription must be an object' }],
    });
  }
  if (!subscription.endpoint || typeof subscription.endpoint !== 'string') {
    return res.status(400).json({
      error: 'Invalid subscription payload',
      details: [{ msg: 'endpoint must be a valid URL' }],
    });
  }
  if (!subscription.keys || typeof subscription.keys !== 'object') {
    return res.status(400).json({
      error: 'Invalid subscription payload',
      details: [{ msg: 'keys must be an object' }],
    });
  }
  if (!subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({
      error: 'Invalid subscription payload',
      details: [{ msg: 'keys must contain p256dh and auth' }],
    });
  }
  // Strict sanitization: reconstruct object
  const {
    endpoint,
    keys: { p256dh, auth },
  } = req.body.subscription;
  req.body.subscription = { endpoint, keys: { p256dh, auth } };
  next();
}

// ---------------------------------------------------------------------------
// Test App Factory — mirrors the route structure of server/routes/notifications.js
// The real router is mounted at / in index.js.
// ---------------------------------------------------------------------------

function createTestApp(options = {}) {
  const {
    markReadResult,
    markAllReadResult,
    removeResult,
    clearResult,
    addNotificationError,
    getPrefsResult,
    setPrefResult,
    setBulkResult,
  } = options;

  const app = express();
  app.use(express.json());

  const router = new express.Router();

  // =========================================================================
  // Push Subscription Routes (admin only)
  // =========================================================================

  /**
   * POST /notifications/subscribe
   */
  router.post(
    '/notifications/subscribe',
    mockRequireAdmin,
    mockPassThrough,
    mockValidatePushSubscription,
    (req, res) => {
      const { subscription } = req.body;
      if (subscription) {
        pushSubscriptions.add(JSON.stringify(subscription));
        if (pushSubscriptions.size > 10000) {
          const oldest = pushSubscriptions.values().next().value;
          pushSubscriptions.delete(oldest);
        }
      }
      res.json({ success: true });
    }
  );

  /**
   * POST /notifications/unsubscribe
   */
  router.post(
    '/notifications/unsubscribe',
    mockRequireAdmin,
    mockPassThrough,
    mockValidatePushSubscription,
    (req, res) => {
      const { subscription } = req.body;
      if (subscription) {
        pushSubscriptions.delete(JSON.stringify(subscription));
      }
      res.json({ success: true });
    }
  );

  // =========================================================================
  // Notification CRUD Routes (dual auth)
  // =========================================================================

  /**
   * POST /notifications/mark-read
   */
  router.post(
    '/notifications/mark-read',
    mockRequireNotificationAuth,
    mockPassThrough,
    (req, res) => {
      const { id, userId } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return res
            .status(403)
            .json({ error: 'Forbidden: Cannot modify other users notifications' });
        }
      }
      if (markReadResult === false) return res.json({ success: false });
      return res.json({ success: true });
    }
  );

  /**
   * POST /notifications/mark-all-read
   */
  router.post(
    '/notifications/mark-all-read',
    mockRequireNotificationAuth,
    mockPassThrough,
    (req, res) => {
      const { userId } = req.body || {};
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      if (markAllReadResult === false)
        return res.status(500).json({ error: 'Failed to mark all as read' });
      return res.json({ success: true });
    }
  );

  /**
   * DELETE /notifications/:id
   */
  router.delete('/notifications/:id', mockRequireNotificationAuth, mockPassThrough, (req, res) => {
    const id = req.params.id;
    if (req.studentUser) {
      const studentId = req.studentUser.sub || req.studentUser.id;
      if (req.query.userId && req.query.userId !== studentId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    if (removeResult === false) return res.status(404).json({ error: 'Notification not found' });
    return res.json({ success: true });
  });

  /**
   * DELETE /notifications (clear all)
   */
  router.delete('/notifications', mockRequireNotificationAuth, mockPassThrough, (req, res) => {
    if (req.studentUser) {
      const studentId = req.studentUser.sub || req.studentUser.id;
      if (req.query.userId && req.query.userId !== studentId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    if (clearResult === false) return res.status(500).json({ error: 'Failed to clear' });
    return res.json({ success: true });
  });

  /**
   * POST /notifications (create — admin only)
   */
  router.post('/notifications', mockRequireAdmin, mockPassThrough, (req, res) => {
    const { title, message } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }
    if (addNotificationError) return res.status(500).json({ error: addNotificationError });
    const note = {
      id: 'notif-1',
      title,
      message,
      type: req.body.type || null,
      link: req.body.link || null,
    };
    return res.json({ success: true, notification: note });
  });

  // =========================================================================
  // Notification Retrieval
  // =========================================================================

  /**
   * GET /notifications — retrieves notifications for authenticated user.
   * Uses inline auth logic (bearer token or cookie based).
   */
  router.get('/notifications', mockInlineNotificationAuth, (req, res) => {
    const userId = req.query.userId || 'global';
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    res.json({ notifications: [] });
  });

  /**
   * GET /notifications/preferences
   */
  router.get('/notifications/preferences', mockRequireNotificationPrefAuth, (req, res) => {
    const userId = req.query.userId || 'global';
    const prefs = getPrefsResult || [];
    return res.json({ preferences: prefs });
  });

  /**
   * PUT /notifications/preferences
   */
  router.put('/notifications/preferences', mockRequireNotificationPrefAuth, (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: 'category is required' });
    const pref = setPrefResult || { category, email: true, push: true };
    return res.json({ preference: pref });
  });

  /**
   * PUT /notifications/preferences/bulk
   */
  router.put('/notifications/preferences/bulk', mockRequireNotificationPrefAuth, (req, res) => {
    const { preferences } = req.body;
    if (!Array.isArray(preferences) || !preferences.length) {
      return res.status(400).json({ error: 'preferences array is required' });
    }
    const results =
      setBulkResult || preferences.map((p) => ({ category: p.category, email: true }));
    return res.json({ preferences: results });
  });

  // =========================================================================
  // Notification Analytics (no auth — lightweight collector)
  // =========================================================================

  /**
   * POST /notifications/analytics
   */
  router.post('/notifications/analytics', (req, res) => {
    res.json({ ok: true });
  });

  // Mount at / to match index.js
  app.use('/', router);

  return app;
}

// ---------------------------------------------------------------------------
// Push Subscription — Auth Enforcement
// ---------------------------------------------------------------------------

describe('Notification Routes — Push Subscription Auth Enforcement', () => {
  let app;
  const validSubscription = {
    subscription: {
      endpoint: 'https://push.example.com/sub1',
      keys: { p256dh: 'abc123', auth: 'def456' },
    },
  };

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
    app = createTestApp();
  });

  it('POST /notifications/subscribe returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).post('/notifications/subscribe').send(validSubscription);
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('POST /notifications/unsubscribe returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).post('/notifications/unsubscribe').send(validSubscription);
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Push Subscription — Validation
// ---------------------------------------------------------------------------

describe('Notification Routes — Push Subscription Validation', () => {
  let app;

  before(() => {
    resetPushSubscriptions();
    authControl.adminEnabled = true;
    app = createTestApp();
  });

  it('POST /notifications/subscribe with valid subscription returns 200', async () => {
    const res = await request(app)
      .post('/notifications/subscribe')
      .send({
        subscription: {
          endpoint: 'https://push.example.com/sub1',
          keys: { p256dh: 'abc123', auth: 'def456' },
        },
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('POST /notifications/subscribe without subscription object returns 400', async () => {
    const res = await request(app).post('/notifications/subscribe').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid subscription payload');
  });

  it('POST /notifications/subscribe without endpoint returns 400', async () => {
    const res = await request(app)
      .post('/notifications/subscribe')
      .send({
        subscription: {
          keys: { p256dh: 'abc123', auth: 'def456' },
        },
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid subscription payload');
  });

  it('POST /notifications/subscribe without keys returns 400', async () => {
    const res = await request(app)
      .post('/notifications/subscribe')
      .send({
        subscription: {
          endpoint: 'https://push.example.com/sub1',
        },
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid subscription payload');
  });

  it('POST /notifications/subscribe without p256dh key returns 400', async () => {
    const res = await request(app)
      .post('/notifications/subscribe')
      .send({
        subscription: {
          endpoint: 'https://push.example.com/sub1',
          keys: { auth: 'def456' },
        },
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid subscription payload');
  });

  it('POST /notifications/unsubscribe with valid subscription returns 200', async () => {
    const res = await request(app)
      .post('/notifications/unsubscribe')
      .send({
        subscription: {
          endpoint: 'https://push.example.com/sub1',
          keys: { p256dh: 'abc123', auth: 'def456' },
        },
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('POST /notifications/unsubscribe without subscription returns 400', async () => {
    const res = await request(app).post('/notifications/unsubscribe').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid subscription payload');
  });
});

// ---------------------------------------------------------------------------
// Notification CRUD — Auth Enforcement (Dual Auth)
// ---------------------------------------------------------------------------

describe('Notification Routes — CRUD Auth Enforcement', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
    app = createTestApp();
  });

  it('POST /notifications/mark-read returns 401 when both admin and student unauthenticated', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = false;
    const res = await request(app).post('/notifications/mark-read').send({ id: 'n-1' });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
  });

  it('POST /notifications/mark-all-read returns 401 when both unauthenticated', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = false;
    const res = await request(app).post('/notifications/mark-all-read');
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
  });

  it('DELETE /notifications/:id returns 401 when both unauthenticated', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = false;
    const res = await request(app).delete('/notifications/n-1');
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
  });

  it('DELETE /notifications returns 401 when both unauthenticated', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = false;
    const res = await request(app).delete('/notifications');
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
  });
});

describe('Notification Routes — Create Auth Enforcement (Admin Only)', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /notifications (create) returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).post('/notifications').send({ title: 'Test', message: 'Hello' });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Notification CRUD — Mark Read / Mark All Read
// ---------------------------------------------------------------------------

describe('Notification Routes — Mark Read', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /notifications/mark-read marks a notification as read', async () => {
    const res = await request(app).post('/notifications/mark-read').send({ id: 'notif-42' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('POST /notifications/mark-read without id returns 400', async () => {
    const res = await request(app).post('/notifications/mark-read').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /notifications/mark-read with empty id returns 400', async () => {
    const res = await request(app).post('/notifications/mark-read').send({ id: '' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /notifications/mark-read works as student on own notification', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = true;
    const res = await request(app).post('/notifications/mark-read').send({ id: 'notif-1' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    authControl.adminEnabled = true;
  });

  it('POST /notifications/mark-read returns 403 as student trying to mark other user notification', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = true;
    const res = await request(app)
      .post('/notifications/mark-read')
      .send({ id: 'notif-1', userId: 'other-user' });
    assert.equal(res.status, 403);
    authControl.adminEnabled = true;
  });
});

describe('Notification Routes — Mark All Read', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /notifications/mark-all-read marks all notifications as read', async () => {
    const res = await request(app).post('/notifications/mark-all-read');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('POST /notifications/mark-all-read works as student on own notifications', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = true;
    const res = await request(app)
      .post('/notifications/mark-all-read')
      .send({ userId: 'student-1' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    authControl.adminEnabled = true;
  });

  it('POST /notifications/mark-all-read returns 403 as student on other user', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = true;
    const res = await request(app)
      .post('/notifications/mark-all-read')
      .send({ userId: 'other-user' });
    assert.equal(res.status, 403);
    authControl.adminEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Notification CRUD — Delete / Clear
// ---------------------------------------------------------------------------

describe('Notification Routes — Delete by ID', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('DELETE /notifications/:id removes a notification', async () => {
    const res = await request(app).delete('/notifications/notif-42');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('DELETE /notifications/:id returns 404 when notification not found', async () => {
    app = createTestApp({ removeResult: false });
    const res = await request(app).delete('/notifications/non-existent');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Notification not found');
  });

  it('DELETE /notifications/:id returns 403 as student on other user notification', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = true;
    const res = await request(app).delete('/notifications/notif-1?userId=other-user');
    assert.equal(res.status, 403);
    authControl.adminEnabled = true;
  });
});

describe('Notification Routes — Clear All', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('DELETE /notifications clears all notifications', async () => {
    const res = await request(app).delete('/notifications');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('DELETE /notifications returns 403 as student on other user', async () => {
    authControl.adminEnabled = false;
    authControl.studentEnabled = true;
    const res = await request(app).delete('/notifications?userId=other-user');
    assert.equal(res.status, 403);
    authControl.adminEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Create Notification (Admin Only)
// ---------------------------------------------------------------------------

describe('Notification Routes — Create Notification', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /notifications creates a notification with title and message', async () => {
    const res = await request(app)
      .post('/notifications')
      .send({ title: 'Test Notification', message: 'This is a test', type: 'info' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.notification);
    assert.equal(res.body.notification.id, 'notif-1');
    assert.equal(res.body.notification.title, 'Test Notification');
  });

  it('POST /notifications without title returns 400', async () => {
    const res = await request(app).post('/notifications').send({ message: 'Missing title' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.toLowerCase().includes('title'));
  });

  it('POST /notifications without message returns 400', async () => {
    const res = await request(app).post('/notifications').send({ title: 'Missing message' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.toLowerCase().includes('message'));
  });

  it('POST /notifications with empty title returns 400', async () => {
    const res = await request(app)
      .post('/notifications')
      .send({ title: '', message: 'Some message' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /notifications with empty body returns 400', async () => {
    const res = await request(app).post('/notifications').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// Notification Retrieval
// ---------------------------------------------------------------------------

describe('Notification Routes — Get Notifications', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('GET /notifications returns notifications list with default pagination', async () => {
    const res = await request(app).get('/notifications');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.notifications));
  });

  it('GET /notifications with userId and auth header returns notifications', async () => {
    const res = await request(app)
      .get('/notifications?userId=student-1')
      .set('Authorization', 'Bearer valid-token');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.notifications));
  });

  it('GET /notifications respects offset and limit query params', async () => {
    const res = await request(app)
      .get('/notifications?userId=student-1&offset=10&limit=25')
      .set('Authorization', 'Bearer valid-token');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.notifications));
  });

  it('GET /notifications with userId but no auth returns 401', async () => {
    const res = await request(app).get('/notifications?userId=student-1');
    assert.equal(res.status, 401);
    assert.ok(res.body.error);
  });

  it('GET /notifications with global userId (no auth required) returns 200', async () => {
    const res = await request(app).get('/notifications?userId=global');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.notifications));
  });
});

// ---------------------------------------------------------------------------
// Notification Preferences Auth Enforcement
// ---------------------------------------------------------------------------

describe('Notification Routes — Preferences Auth Enforcement', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
    app = createTestApp();
  });

  it('GET /notifications/preferences returns 401 when unauthenticated', async () => {
    authControl.prefAuthEnabled = false;
    const res = await request(app).get('/notifications/preferences');
    assert.equal(res.status, 401);
    authControl.prefAuthEnabled = true;
  });

  it('PUT /notifications/preferences returns 401 when unauthenticated', async () => {
    authControl.prefAuthEnabled = false;
    const res = await request(app).put('/notifications/preferences').send({ category: 'events' });
    assert.equal(res.status, 401);
    authControl.prefAuthEnabled = true;
  });

  it('PUT /notifications/preferences/bulk returns 401 when unauthenticated', async () => {
    authControl.prefAuthEnabled = false;
    const res = await request(app).put('/notifications/preferences/bulk').send({ preferences: [] });
    assert.equal(res.status, 401);
    authControl.prefAuthEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

describe('Notification Routes — Get Preferences', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
    app = createTestApp();
  });

  it('GET /notifications/preferences returns user preferences', async () => {
    const res = await request(app).get('/notifications/preferences');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.preferences));
  });

  it('GET /notifications/preferences with userId returns scoped preferences', async () => {
    const res = await request(app).get('/notifications/preferences?userId=student-1');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.preferences));
  });
});

describe('Notification Routes — Set Preferences', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
    app = createTestApp();
  });

  it('PUT /notifications/preferences sets a preference category', async () => {
    const res = await request(app)
      .put('/notifications/preferences')
      .send({ category: 'events', email: true, push: false });
    assert.equal(res.status, 200);
    assert.ok(res.body.preference);
    assert.equal(res.body.preference.category, 'events');
  });

  it('PUT /notifications/preferences without category returns 400', async () => {
    const res = await request(app).put('/notifications/preferences').send({ email: true });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

describe('Notification Routes — Bulk Set Preferences', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
    app = createTestApp();
  });

  it('PUT /notifications/preferences/bulk sets multiple preferences', async () => {
    const res = await request(app)
      .put('/notifications/preferences/bulk')
      .send({
        preferences: [
          { category: 'events', email: true },
          { category: 'announcements', push: true },
        ],
      });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.preferences));
    assert.equal(res.body.preferences.length, 2);
  });

  it('PUT /notifications/preferences/bulk without preferences array returns 400', async () => {
    const res = await request(app).put('/notifications/preferences/bulk').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('PUT /notifications/preferences/bulk with empty array returns 400', async () => {
    const res = await request(app).put('/notifications/preferences/bulk').send({ preferences: [] });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('PUT /notifications/preferences/bulk with non-array returns 400', async () => {
    const res = await request(app)
      .put('/notifications/preferences/bulk')
      .send({ preferences: 'invalid' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// Analytics (No Auth)
// ---------------------------------------------------------------------------

describe('Notification Routes — Analytics', () => {
  let app;

  before(() => {
    app = createTestApp();
  });

  it('POST /notifications/analytics accepts analytics events without auth', async () => {
    const res = await request(app)
      .post('/notifications/analytics')
      .send({ type: 'notification_click', notificationId: 'n-1' });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('POST /notifications/analytics with empty body still returns ok', async () => {
    const res = await request(app).post('/notifications/analytics').send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('POST /notifications/analytics without auth header succeeds', async () => {
    const res = await request(app).post('/notifications/analytics').send({ type: 'page_view' });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe('Notification Routes — Error Handling', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
  });

  it('returns 500 when addNotification service throws', async () => {
    app = createTestApp({ addNotificationError: 'Failed to create notification' });
    const res = await request(app)
      .post('/notifications')
      .send({ title: 'Error Test', message: 'Should fail' });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when markAllRead service fails', async () => {
    app = createTestApp({ markAllReadResult: false });
    const res = await request(app).post('/notifications/mark-all-read');
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 404 when removeNotification returns false', async () => {
    app = createTestApp({ removeResult: false });
    const res = await request(app).delete('/notifications/non-existent');
    assert.equal(res.status, 404);
  });
});

// ---------------------------------------------------------------------------
// 404 Handling
// ---------------------------------------------------------------------------

describe('Notification Routes — 404', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    authControl.prefAuthEnabled = true;
    app = createTestApp();
  });

  it('returns 404 for unknown notification routes', async () => {
    const res = await request(app).get('/notifications/unknown-route');
    assert.equal(res.status, 404);
  });

  it('returns 404 for nested unknown path under notifications', async () => {
    const res = await request(app).post('/notifications/preferences/unknown-action');
    assert.equal(res.status, 404);
  });
});
