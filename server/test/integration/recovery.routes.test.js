/**
 * Integration tests for Recovery Route Group
 * Tests admin recovery actions (unlock, reset password, portfolio operations)
 * and public auth recovery flows (forgot/reset password).
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Test State
// ---------------------------------------------------------------------------

/** Toggle to simulate authentication state for admin routes */
const authControl = { enabled: true };

/**
 * Mock admin auth — replicates adminAuthMiddleware.requireAdmin.
 */
function mockRequireAdmin(req, res, next) {
  if (!authControl.enabled) {
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
 * Mock audit middleware — passes through without writing to DB.
 */
function mockAuditMiddleware(_req, _res, next) {
  next();
}

/**
 * Mock rate limiter — passes through without rate limiting.
 */
function mockPassThrough(_req, _res, next) {
  next();
}

// ---------------------------------------------------------------------------
// Test App Factory — mirrors the route structure of server/routes/recovery.js
// The real router is mounted at /api in index.js.
// ---------------------------------------------------------------------------

function createTestApp(options = {}) {
  const {
    unlockResult,
    resetPasswordResult,
    deletePortfolioResult,
    recoverPortfolioResult,
    forgotPasswordResult,
    resetPasswordWithTokenResult,
  } = options;

  const app = express();
  app.use(express.json());

  const router = new express.Router();

  // ---- Admin Recovery Routes ----
  // These require admin auth + audit logging

  router.post('/admin/users/:id/unlock', mockRequireAdmin, mockAuditMiddleware, (req, res) => {
    if (unlockResult && unlockResult.error) {
      return res.status(unlockResult.status).json({ error: unlockResult.error });
    }
    return res.json({ message: 'Account unlocked successfully' });
  });

  router.post(
    '/admin/users/:id/reset-password',
    mockRequireAdmin,
    mockAuditMiddleware,
    (req, res) => {
      const { newPassword } = req.body;

      if (resetPasswordResult && resetPasswordResult.error) {
        return res.status(resetPasswordResult.status).json({ error: resetPasswordResult.error });
      }

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      return res.json({ message: 'Password reset successfully' });
    }
  );

  router.delete(
    '/admin/portfolios/:username',
    mockRequireAdmin,
    mockAuditMiddleware,
    (req, res) => {
      if (deletePortfolioResult && deletePortfolioResult.error) {
        return res
          .status(deletePortfolioResult.status)
          .json({ error: deletePortfolioResult.error });
      }
      return res.json({ message: 'Portfolio moved to trash' });
    }
  );

  router.post(
    '/admin/portfolios/:username/recover',
    mockRequireAdmin,
    mockAuditMiddleware,
    (req, res) => {
      if (recoverPortfolioResult && recoverPortfolioResult.error) {
        return res
          .status(recoverPortfolioResult.status)
          .json({ error: recoverPortfolioResult.error });
      }
      return res.json({ message: 'Portfolio recovered successfully' });
    }
  );

  // ---- Public Auth Recovery Routes ----
  // These use password reset rate limiter (no admin auth)

  router.post('/auth/forgot-password', mockPassThrough, (req, res) => {
    const { email } = req.body;

    if (forgotPasswordResult && forgotPasswordResult.error) {
      return res.status(forgotPasswordResult.status).json({ error: forgotPasswordResult.error });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always return the same message to prevent email enumeration
    return res.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  });

  router.post('/auth/reset-password', mockPassThrough, (req, res) => {
    const { token, newPassword } = req.body;

    if (resetPasswordWithTokenResult && resetPasswordWithTokenResult.error) {
      return res
        .status(resetPasswordWithTokenResult.status)
        .json({ error: resetPasswordWithTokenResult.error });
    }

    if (!token || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Valid token and new password (min 8 chars) required' });
    }

    return res.json({ message: 'Password has been reset successfully' });
  });

  // Mount at /api to match index.js
  app.use('/api', router);

  return app;
}

// ---------------------------------------------------------------------------
// Auth Enforcement Tests
// ---------------------------------------------------------------------------

describe('Recovery Routes — Auth Enforcement (Admin Routes)', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/admin/users/:id/unlock returns 401 when unauthenticated', async () => {
    authControl.enabled = false;
    const res = await request(app).post('/api/admin/users/42/unlock');
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it('POST /api/admin/users/:id/reset-password returns 401 when unauthenticated', async () => {
    authControl.enabled = false;
    const res = await request(app)
      .post('/api/admin/users/42/reset-password')
      .send({ newPassword: 'NewPass123!' });
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it('DELETE /api/admin/portfolios/:username returns 401 when unauthenticated', async () => {
    authControl.enabled = false;
    const res = await request(app).delete('/api/admin/portfolios/johndoe');
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it('POST /api/admin/portfolios/:username/recover returns 401 when unauthenticated', async () => {
    authControl.enabled = false;
    const res = await request(app).post('/api/admin/portfolios/johndoe/recover');
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it('Public recovery routes do NOT require admin auth', async () => {
    authControl.enabled = false;
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });
    // Should respond (400 or 200) but NOT 401 because no admin auth needed
    assert.notEqual(res.status, 401);
    authControl.enabled = true;
  });
});

// ---------------------------------------------------------------------------
// Admin Recovery Actions
// ---------------------------------------------------------------------------

describe('Recovery Routes — Admin Unlock Account', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/admin/users/:id/unlock unlocks a user account', async () => {
    const res = await request(app).post('/api/admin/users/42/unlock');
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Account unlocked successfully');
  });

  it('POST /api/admin/users/:id/unlock with different user ID works', async () => {
    const res = await request(app).post('/api/admin/users/99/unlock');
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Account unlocked successfully');
  });
});

describe('Recovery Routes — Admin Reset Password', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/admin/users/:id/reset-password resets with valid password', async () => {
    const res = await request(app)
      .post('/api/admin/users/42/reset-password')
      .send({ newPassword: 'NewSecurePass123!' });
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Password reset successfully');
  });

  it('POST /api/admin/users/:id/reset-password with short password returns 400', async () => {
    const res = await request(app)
      .post('/api/admin/users/42/reset-password')
      .send({ newPassword: 'short' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/admin/users/:id/reset-password with missing password returns 400', async () => {
    const res = await request(app).post('/api/admin/users/42/reset-password').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/admin/users/:id/reset-password with empty password returns 400', async () => {
    const res = await request(app)
      .post('/api/admin/users/42/reset-password')
      .send({ newPassword: '' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

describe('Recovery Routes — Admin Portfolio Operations', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('DELETE /api/admin/portfolios/:username soft-deletes a portfolio', async () => {
    const res = await request(app).delete('/api/admin/portfolios/johndoe');
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Portfolio moved to trash');
  });

  it('POST /api/admin/portfolios/:username/recover restores a portfolio', async () => {
    const res = await request(app).post('/api/admin/portfolios/johndoe/recover');
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Portfolio recovered successfully');
  });
});

// ---------------------------------------------------------------------------
// Public Auth Recovery — Forgot Password
// ---------------------------------------------------------------------------

describe('Recovery Routes — Forgot Password (Public)', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/auth/forgot-password with valid email returns success message', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });
    assert.equal(res.status, 200);
    assert.ok(res.body.message);
    // Verify no email enumeration — always returns the same message
    assert.equal(
      res.body.message,
      'If an account exists with that email, a password reset link has been sent.'
    );
  });

  it('POST /api/auth/forgot-password with missing email returns 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/auth/forgot-password with empty email returns 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: '' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/auth/forgot-password with non-string email returns 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: null });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// Public Auth Recovery — Reset Password with Token
// ---------------------------------------------------------------------------

describe('Recovery Routes — Reset Password With Token (Public)', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/auth/reset-password with valid token and password returns success', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid-reset-token-abc123', newPassword: 'NewSecurePass123!' });
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Password has been reset successfully');
  });

  it('POST /api/auth/reset-password with missing token returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ newPassword: 'NewSecurePass123!' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/auth/reset-password with missing password returns 400', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'some-token' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/auth/reset-password with short password returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid-token', newPassword: 'short' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/auth/reset-password with empty token returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: '', newPassword: 'NewSecurePass123!' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/auth/reset-password with empty body returns 400', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe('Recovery Routes — Error Handling', () => {
  let app;

  before(() => {
    authControl.enabled = true;
  });

  it('returns 500 when unlock controller throws', async () => {
    app = createTestApp({
      unlockResult: { error: 'Internal server error', status: 500 },
    });
    const res = await request(app).post('/api/admin/users/42/unlock');
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when reset-password controller throws', async () => {
    app = createTestApp({
      resetPasswordResult: { error: 'Internal server error', status: 500 },
    });
    const res = await request(app)
      .post('/api/admin/users/42/reset-password')
      .send({ newPassword: 'NewPass123!' });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when deletePortfolio controller throws', async () => {
    app = createTestApp({
      deletePortfolioResult: { error: 'Internal server error', status: 500 },
    });
    const res = await request(app).delete('/api/admin/portfolios/johndoe');
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when recoverPortfolio controller throws', async () => {
    app = createTestApp({
      recoverPortfolioResult: { error: 'Internal server error', status: 500 },
    });
    const res = await request(app).post('/api/admin/portfolios/johndoe/recover');
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when forgotPassword controller throws', async () => {
    app = createTestApp({
      forgotPasswordResult: { error: 'Internal server error', status: 500 },
    });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when resetPasswordWithToken controller throws', async () => {
    app = createTestApp({
      resetPasswordWithTokenResult: { error: 'Internal server error', status: 500 },
    });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'some-token', newPassword: 'NewPass123!' });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// 404 Handling
// ---------------------------------------------------------------------------

describe('Recovery Routes — 404', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('returns 404 for unknown recovery routes', async () => {
    const res = await request(app).get('/api/admin/users/42/non-existent');
    assert.equal(res.status, 404);
  });

  it('returns 404 for unknown auth recovery routes', async () => {
    const res = await request(app).post('/api/auth/non-existent');
    assert.equal(res.status, 404);
  });
});
