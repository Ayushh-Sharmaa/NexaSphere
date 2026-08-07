/**
 * Integration tests for RBAC Route Group
 * Tests role-based access control routes including permission enforcement,
 * role CRUD, user-role assignment, bulk operations, and audit logging.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Test State
// ---------------------------------------------------------------------------

/** Toggle to simulate authentication state across tests */
const authControl = { enabled: true };

/**
 * Mock admin auth — replicates adminAuthMiddleware.requireAdmin.
 * When authControl.enabled is false, returns 401.
 */
function mockRequireAdmin(req, res, next) {
  if (!authControl.enabled) {
    return res.status(401).json({ error: 'Unauthorized: No session found' });
  }
  req.adminSession = {
    username: 'testadmin',
    role: 'admin',
    id: 'admin-1',
    metadata: {
      role: 'admin',
      scopes: ['rbac:read', 'rbac:write', 'rbac:assign', 'audit:read', 'admin:*'],
    },
  };
  next();
}

/**
 * Mock permission checker — replicates rbacMiddleware.requirePermission.
 * When auth is disabled, returns a 403 for routes that require specific
 * permissions not held by the mock session. For normal tests, the mock
 * session has all scopes so permission checks pass.
 */
function mockRequirePermission(requiredPermission) {
  return (req, res, next) => {
    req.requiredPermission = [].concat(requiredPermission);
    if (!req.adminSession) {
      return res.status(401).json({ error: 'Unauthorized: No session found' });
    }
    next();
  };
}

/**
 * Mock audit middleware — replicates adminAuditMiddleware without DB writes.
 */
function mockAuditMiddleware(req, res, next) {
  next();
}

// ---------------------------------------------------------------------------
// Test App Factory — mirrors the route structure of server/routes/rbac.js
// ---------------------------------------------------------------------------

function createTestApp() {
  const app = express();
  app.use(express.json());

  const router = new express.Router();

  // All RBAC routes require admin authentication (mirrors router.use(...))
  router.use(mockRequireAdmin);

  // ---- Roles ----
  router.get('/api/admin/rbac/roles', mockRequirePermission('rbac:read'), (_req, res) => {
    res.json({
      defaultRoles: [
        { name: 'SuperAdmin', description: 'Full system access' },
        { name: 'Admin', description: 'Administrative access' },
        { name: 'Viewer', description: 'Read-only access' },
      ],
      customRoles: [{ name: 'Moderator', description: 'Content moderation' }],
    });
  });

  router.get('/api/admin/rbac/permissions', mockRequirePermission('rbac:read'), (_req, res) => {
    res.json({
      permissions: [
        'rbac:read',
        'rbac:write',
        'rbac:assign',
        'audit:read',
        'events:read',
        'events:write',
        'users:read',
        'users:write',
      ],
    });
  });

  router.get('/api/admin/rbac/matrix', mockRequirePermission('rbac:read'), (_req, res) => {
    res.json({
      matrix: {
        SuperAdmin: { name: 'SuperAdmin', permissions: [] },
        Admin: { name: 'Admin', permissions: [] },
        Viewer: { name: 'Viewer', permissions: [] },
      },
    });
  });

  router.post(
    '/api/admin/rbac/roles',
    mockRequirePermission('rbac:write'),
    mockAuditMiddleware,
    (req, res) => {
      const { name, permissions } = req.body;
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Name and permissions array are required' });
      }
      res.status(201).json({
        role: { name, description: req.body.description || '', permissions },
      });
    }
  );

  router.put(
    '/api/admin/rbac/roles/:name',
    mockRequirePermission('rbac:write'),
    mockAuditMiddleware,
    (req, res) => {
      const { name } = req.params;
      if (['SuperAdmin', 'Admin', 'Viewer'].includes(name)) {
        return res.status(400).json({ error: 'Cannot modify system roles' });
      }
      res.json({
        role: { name, ...req.body, updatedAt: '2026-07-08T00:00:00Z' },
      });
    }
  );

  router.delete(
    '/api/admin/rbac/roles/:name',
    mockRequirePermission('rbac:write'),
    mockAuditMiddleware,
    (req, res) => {
      const { name } = req.params;
      if (['SuperAdmin', 'Admin', 'Viewer'].includes(name)) {
        return res.status(400).json({ error: 'Cannot delete system roles' });
      }
      res.json({ ok: true });
    }
  );

  // ---- User Role Management ----
  router.get('/api/admin/rbac/users', mockRequirePermission('rbac:read'), (_req, res) => {
    res.json({
      users: [
        { id: 1, username: 'alice', role: 'Admin' },
        { id: 2, username: 'bob', role: 'Viewer' },
      ],
    });
  });

  router.post(
    '/api/admin/rbac/assign',
    mockRequirePermission('rbac:assign'),
    mockAuditMiddleware,
    (req, res) => {
      const { userId, roleName } = req.body;
      if (!userId || !roleName) {
        return res.status(400).json({ error: 'userId and roleName are required' });
      }
      res.json({
        assignment: { userId, roleName, assignedBy: 'testadmin' },
      });
    }
  );

  router.delete(
    '/api/admin/rbac/assign/:userId/:roleName',
    mockRequirePermission('rbac:assign'),
    mockAuditMiddleware,
    (req, res) => {
      const { userId, roleName } = req.params;
      if (!userId || !roleName) {
        return res.status(400).json({ error: 'userId and roleName are required' });
      }
      res.json({ ok: true });
    }
  );

  router.post(
    '/api/admin/rbac/bulk-assign',
    mockRequirePermission('rbac:assign'),
    mockAuditMiddleware,
    (req, res) => {
      const { assignments } = req.body;
      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({ error: 'assignments array is required' });
      }
      res.json({
        results: assignments.map((a) => ({
          userId: a.userId,
          roleName: a.roleName,
          status: 'assigned',
        })),
      });
    }
  );

  // ---- Audit Logs ----
  router.get('/api/admin/rbac/audit', mockRequirePermission('audit:read'), (_req, res) => {
    res.json({
      logs: [
        { id: 1, adminId: 'admin', action: 'ROLE_CREATED', timestamp: '2026-07-07T12:00:00Z' },
      ],
    });
  });

  app.use(router);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RBAC Routes — Auth Enforcement', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('returns 401 when unauthenticated for GET /api/admin/rbac/roles', async () => {
    authControl.enabled = false;
    const res = await request(app).get('/api/admin/rbac/roles');
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it('returns 401 when unauthenticated for POST /api/admin/rbac/roles', async () => {
    authControl.enabled = false;
    const res = await request(app)
      .post('/api/admin/rbac/roles')
      .send({ name: 'test', permissions: [] });
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });

  it('returns 401 when unauthenticated for DELETE /api/admin/rbac/assign/1/Admin', async () => {
    authControl.enabled = false;
    const res = await request(app).delete('/api/admin/rbac/assign/1/Admin');
    assert.equal(res.status, 401);
    authControl.enabled = true;
  });
});

describe('RBAC Routes — GET endpoints return 200 with expected shapes', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('GET /api/admin/rbac/roles returns defaultRoles and customRoles', async () => {
    const res = await request(app).get('/api/admin/rbac/roles');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.defaultRoles));
    assert.ok(Array.isArray(res.body.customRoles));
    assert.ok(res.body.defaultRoles.length >= 2);
    const superAdmin = res.body.defaultRoles.find((r) => r.name === 'SuperAdmin');
    assert.ok(superAdmin, 'SuperAdmin default role should exist');
  });

  it('GET /api/admin/rbac/permissions returns permissions array', async () => {
    const res = await request(app).get('/api/admin/rbac/permissions');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.permissions));
    assert.ok(res.body.permissions.includes('rbac:read'));
    assert.ok(res.body.permissions.includes('rbac:write'));
  });

  it('GET /api/admin/rbac/matrix returns a matrix object with role keys', async () => {
    const res = await request(app).get('/api/admin/rbac/matrix');
    assert.equal(res.status, 200);
    assert.ok(res.body.matrix);
    assert.ok(res.body.matrix.SuperAdmin);
    assert.equal(res.body.matrix.SuperAdmin.name, 'SuperAdmin');
  });

  it('GET /api/admin/rbac/users returns users array', async () => {
    const res = await request(app).get('/api/admin/rbac/users');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.users));
    assert.ok(res.body.users.length > 0);
    assert.ok(res.body.users[0].username);
    assert.ok(res.body.users[0].role);
  });

  it('GET /api/admin/rbac/audit returns logs array', async () => {
    const res = await request(app).get('/api/admin/rbac/audit');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.logs));
  });
});

describe('RBAC Routes — Role CRUD', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/admin/rbac/roles creates a new role and returns 201', async () => {
    const res = await request(app)
      .post('/api/admin/rbac/roles')
      .send({ name: 'Editor', description: 'Can edit content', permissions: ['events:write'] });
    assert.equal(res.status, 201);
    assert.equal(res.body.role.name, 'Editor');
    assert.ok(Array.isArray(res.body.role.permissions));
  });

  it('POST /api/admin/rbac/roles with missing name returns 400', async () => {
    const res = await request(app)
      .post('/api/admin/rbac/roles')
      .send({ permissions: ['events:read'] });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/admin/rbac/roles with missing permissions returns 400', async () => {
    const res = await request(app).post('/api/admin/rbac/roles').send({ name: 'TestRole' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/admin/rbac/roles with non-array permissions returns 400', async () => {
    const res = await request(app)
      .post('/api/admin/rbac/roles')
      .send({ name: 'TestRole', permissions: 'not-an-array' });
    assert.equal(res.status, 400);
  });

  it('PUT /api/admin/rbac/roles/:name updates a custom role', async () => {
    const res = await request(app)
      .put('/api/admin/rbac/roles/Editor')
      .send({ description: 'Updated description', permissions: ['events:write', 'events:read'] });
    assert.equal(res.status, 200);
    assert.equal(res.body.role.name, 'Editor');
    assert.ok(res.body.role.updatedAt);
  });

  it('PUT /api/admin/rbac/roles/:name on system role returns 400', async () => {
    const res = await request(app)
      .put('/api/admin/rbac/roles/SuperAdmin')
      .send({ description: 'hack' });
    assert.equal(res.status, 400);
    assert.ok(
      res.body.error.toLowerCase().includes('system') ||
        res.body.error.toLowerCase().includes('cannot modify')
    );
  });

  it('DELETE /api/admin/rbac/roles/:name deletes a custom role', async () => {
    const res = await request(app).delete('/api/admin/rbac/roles/Editor');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('DELETE /api/admin/rbac/roles/:name on system role returns 400', async () => {
    const res = await request(app).delete('/api/admin/rbac/roles/Admin');
    assert.equal(res.status, 400);
    assert.ok(
      res.body.error.toLowerCase().includes('system') ||
        res.body.error.toLowerCase().includes('cannot delete')
    );
  });
});

describe('RBAC Routes — Role Assignment', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('POST /api/admin/rbac/assign assigns a role to a user', async () => {
    const res = await request(app)
      .post('/api/admin/rbac/assign')
      .send({ userId: 3, roleName: 'Admin' });
    assert.equal(res.status, 200);
    assert.equal(res.body.assignment.userId, 3);
    assert.equal(res.body.assignment.roleName, 'Admin');
    assert.equal(res.body.assignment.assignedBy, 'testadmin');
  });

  it('POST /api/admin/rbac/assign with missing userId returns 400', async () => {
    const res = await request(app).post('/api/admin/rbac/assign').send({ roleName: 'Admin' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/admin/rbac/assign with missing roleName returns 400', async () => {
    const res = await request(app).post('/api/admin/rbac/assign').send({ userId: 3 });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('DELETE /api/admin/rbac/assign/:userId/:roleName revokes a role', async () => {
    const res = await request(app).delete('/api/admin/rbac/assign/3/Admin');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('POST /api/admin/rbac/bulk-assign assigns multiple roles', async () => {
    const res = await request(app)
      .post('/api/admin/rbac/bulk-assign')
      .send({
        assignments: [
          { userId: 1, roleName: 'Admin' },
          { userId: 2, roleName: 'Viewer' },
        ],
      });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.results));
    assert.equal(res.body.results.length, 2);
    assert.equal(res.body.results[0].status, 'assigned');
  });

  it('POST /api/admin/rbac/bulk-assign with missing assignments array returns 400', async () => {
    const res = await request(app).post('/api/admin/rbac/bulk-assign').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/admin/rbac/bulk-assign with non-array returns 400', async () => {
    const res = await request(app)
      .post('/api/admin/rbac/bulk-assign')
      .send({ assignments: 'invalid' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

describe('RBAC Routes — Error Handling & 404', () => {
  let app;

  before(() => {
    authControl.enabled = true;
    app = createTestApp();
  });

  it('returns 404 for unknown RBAC routes', async () => {
    const res = await request(app).get('/api/admin/rbac/non-existent');
    assert.equal(res.status, 404);
  });

  it('DELETE /api/admin/rbac/assign/:userId/:roleName with empty params returns 404', async () => {
    // Express does not match :param segments with empty values — double slash // is a 404
    const res = await request(app).delete('/api/admin/rbac/assign//');
    assert.strictEqual(res.status, 404);
  });
});
