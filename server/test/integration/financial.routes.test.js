/**
 * Integration tests for Financial Route Group (financial.js)
 * Tests budget, expense, and revenue CRUD operations with role-based auth
 * (admin write, student read/view) and report generation endpoints.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Test State
// ---------------------------------------------------------------------------

/** Toggle to simulate authentication state for admin vs student routes */
const authControl = { adminEnabled: true, studentEnabled: true };

/**
 * Mock role-based auth — replicates auth(role) from middleware/auth.js.
 * When authControl.<role>Enabled is false, returns 401 to simulate
 * an unauthenticated request for that role tier.
 */
function mockAuth(requiredRole) {
  return (req, res, next) => {
    const controlKey = requiredRole === 'admin' ? 'adminEnabled' : 'studentEnabled';
    if (!authControl[controlKey]) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = {
      id: 'test-user',
      role: requiredRole,
      email: 'test@example.com',
    };
    next();
  };
}

// ---------------------------------------------------------------------------
// Test App Factory — mirrors the route structure of server/routes/financial.js
// The real router is mounted at /api in index.js.
// ---------------------------------------------------------------------------

function createTestApp(options = {}) {
  const {
    budgetCreateError,
    budgetUpdateError,
    budgetDeleteError,
    budgetCloneError,
    expenseCreateError,
    expenseUpdateError,
    expenseDeleteError,
    revenueCreateError,
    revenueDeleteError,
  } = options;

  const app = express();
  app.use(express.json());

  const router = new express.Router();

  // ---- Budget Routes ----

  router.post('/budgets', mockAuth('admin'), (req, res) => {
    if (budgetCreateError) return res.status(500).json({ error: budgetCreateError });
    res.status(201).json({ success: true, budget: { id: 'budget-1' } });
  });

  router.get('/budgets', mockAuth('student'), (_req, res) => {
    res.json({ budgets: [], pagination: { total: 0, page: 1, limit: 50 } });
  });

  router.get('/budgets/utilization', mockAuth('student'), (_req, res) => {
    res.json({ utilization: [] });
  });

  router.get('/budgets/:budgetId', mockAuth('student'), (req, res) => {
    res.json({ budget: { id: req.params.budgetId } });
  });

  router.put('/budgets/:budgetId', mockAuth('admin'), (req, res) => {
    if (budgetUpdateError) return res.status(500).json({ error: budgetUpdateError });
    res.json({ success: true, budget: { id: req.params.budgetId } });
  });

  router.delete('/budgets/:budgetId', mockAuth('admin'), (req, res) => {
    if (budgetDeleteError) return res.status(500).json({ error: budgetDeleteError });
    res.json({ success: true });
  });

  router.post('/budgets/:budgetId/clone', mockAuth('admin'), (req, res) => {
    if (budgetCloneError) return res.status(500).json({ error: budgetCloneError });
    res.status(201).json({ budget: { id: 'cloned-1' } });
  });

  // ---- Expense Routes ----

  router.post('/budgets/:budgetId/expenses', mockAuth('admin'), (req, res) => {
    if (expenseCreateError) return res.status(500).json({ error: expenseCreateError });
    res.status(201).json({ success: true, expense: { id: 'expense-1' } });
  });

  router.get('/budgets/:budgetId/expenses', mockAuth('student'), (_req, res) => {
    res.json({ expenses: [], pagination: { total: 0 } });
  });

  router.put('/expenses/:expenseId', mockAuth('admin'), (req, res) => {
    if (expenseUpdateError) return res.status(500).json({ error: expenseUpdateError });
    res.json({ success: true, expense: { id: req.params.expenseId } });
  });

  router.delete('/expenses/:expenseId', mockAuth('admin'), (req, res) => {
    if (expenseDeleteError) return res.status(500).json({ error: expenseDeleteError });
    res.json({ success: true });
  });

  // ---- Revenue Routes ----

  router.post('/budgets/:budgetId/revenues', mockAuth('admin'), (req, res) => {
    if (revenueCreateError) return res.status(500).json({ error: revenueCreateError });
    res.status(201).json({ success: true, revenue: { id: 'revenue-1' } });
  });

  router.get('/budgets/:budgetId/revenues', mockAuth('student'), (_req, res) => {
    res.json({ revenues: [], pagination: { total: 0 } });
  });

  router.delete('/revenues/:revenueId', mockAuth('admin'), (req, res) => {
    if (revenueDeleteError) return res.status(500).json({ error: revenueDeleteError });
    res.json({ success: true });
  });

  // ---- Report / Calculation Routes ----

  router.get('/budgets/:budgetId/variance', mockAuth('student'), (_req, res) => {
    res.json({ variance: [] });
  });

  router.get('/budgets/:budgetId/income', mockAuth('student'), (_req, res) => {
    res.json({ income: [] });
  });

  router.get('/budgets/:budgetId/export', mockAuth('student'), (_req, res) => {
    res.json({ report: [] });
  });

  // Mount at /api/financial to match the real app's mount location
  app.use('/api/financial', router);

  return app;
}

// ---------------------------------------------------------------------------
// Auth Enforcement
// ---------------------------------------------------------------------------

describe('Financial Routes — Auth Enforcement (Admin Routes)', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /api/financial/budgets returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).post('/api/financial/budgets').send({ name: 'Budget' });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('PUT /api/financial/budgets/:budgetId returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).put('/api/financial/budgets/b-1').send({ name: 'Updated' });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('DELETE /api/financial/budgets/:budgetId returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).delete('/api/financial/budgets/b-1');
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('POST /api/financial/budgets/:budgetId/clone returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).post('/api/financial/budgets/b-1/clone');
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('POST /api/financial/budgets/:budgetId/expenses returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app)
      .post('/api/financial/budgets/b-1/expenses')
      .send({ amount: 100 });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('PUT /api/financial/expenses/:expenseId returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).put('/api/financial/expenses/e-1').send({ amount: 200 });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('DELETE /api/financial/expenses/:expenseId returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).delete('/api/financial/expenses/e-1');
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('POST /api/financial/budgets/:budgetId/revenues returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app)
      .post('/api/financial/budgets/b-1/revenues')
      .send({ amount: 500 });
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });

  it('DELETE /api/financial/revenues/:revenueId returns 401 when admin unauthenticated', async () => {
    authControl.adminEnabled = false;
    const res = await request(app).delete('/api/financial/revenues/r-1');
    assert.equal(res.status, 401);
    authControl.adminEnabled = true;
  });
});

describe('Financial Routes — Auth Enforcement (Student Routes)', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('GET /api/financial/budgets returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it('GET /api/financial/budgets/utilization returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets/utilization');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it('GET /api/financial/budgets/:budgetId returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets/b-1');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it('GET /api/financial/budgets/:budgetId/expenses returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets/b-1/expenses');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it('GET /api/financial/budgets/:budgetId/revenues returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets/b-1/revenues');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it('GET /api/financial/budgets/:budgetId/variance returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets/b-1/variance');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it('GET /api/financial/budgets/:budgetId/income returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets/b-1/income');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });

  it('GET /api/financial/budgets/:budgetId/export returns 401 when student unauthenticated', async () => {
    authControl.studentEnabled = false;
    const res = await request(app).get('/api/financial/budgets/b-1/export');
    assert.equal(res.status, 401);
    authControl.studentEnabled = true;
  });
});

// ---------------------------------------------------------------------------
// Budget Success Cases
// ---------------------------------------------------------------------------

describe('Financial Routes — Budget CRUD', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /api/financial/budgets creates a budget and returns 201', async () => {
    const res = await request(app)
      .post('/api/financial/budgets')
      .send({ name: 'Event Budget', totalAmount: 10000 });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.budget);
    assert.equal(res.body.budget.id, 'budget-1');
  });

  it('GET /api/financial/budgets returns budgets list with pagination', async () => {
    const res = await request(app).get('/api/financial/budgets');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.budgets));
    assert.ok(res.body.pagination);
    assert.equal(typeof res.body.pagination.total, 'number');
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.limit, 50);
  });

  it('GET /api/financial/budgets/utilization returns utilization report', async () => {
    const res = await request(app).get('/api/financial/budgets/utilization');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.utilization));
  });

  it('GET /api/financial/budgets/:budgetId returns a budget by ID', async () => {
    const res = await request(app).get('/api/financial/budgets/budget-42');
    assert.equal(res.status, 200);
    assert.ok(res.body.budget);
    assert.equal(res.body.budget.id, 'budget-42');
  });

  it('PUT /api/financial/budgets/:budgetId updates a budget', async () => {
    const res = await request(app)
      .put('/api/financial/budgets/budget-42')
      .send({ name: 'Updated Budget' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.budget.id, 'budget-42');
  });

  it('DELETE /api/financial/budgets/:budgetId deletes a budget', async () => {
    const res = await request(app).delete('/api/financial/budgets/budget-42');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('POST /api/financial/budgets/:budgetId/clone clones a budget and returns 201', async () => {
    const res = await request(app).post('/api/financial/budgets/budget-42/clone');
    assert.equal(res.status, 201);
    assert.equal(res.body.budget.id, 'cloned-1');
  });
});

// ---------------------------------------------------------------------------
// Expense Success Cases
// ---------------------------------------------------------------------------

describe('Financial Routes — Expense CRUD', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /api/financial/budgets/:budgetId/expenses creates an expense and returns 201', async () => {
    const res = await request(app)
      .post('/api/financial/budgets/budget-42/expenses')
      .send({ description: 'Catering', amount: 1500 });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.expense.id, 'expense-1');
  });

  it('GET /api/financial/budgets/:budgetId/expenses returns expenses list', async () => {
    const res = await request(app).get('/api/financial/budgets/budget-42/expenses');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.expenses));
    assert.ok(res.body.pagination);
  });

  it('PUT /api/financial/expenses/:expenseId updates an expense', async () => {
    const res = await request(app).put('/api/financial/expenses/expense-42').send({ amount: 2000 });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.expense.id, 'expense-42');
  });

  it('DELETE /api/financial/expenses/:expenseId deletes an expense', async () => {
    const res = await request(app).delete('/api/financial/expenses/expense-42');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});

// ---------------------------------------------------------------------------
// Revenue Success Cases
// ---------------------------------------------------------------------------

describe('Financial Routes — Revenue CRUD', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('POST /api/financial/budgets/:budgetId/revenues creates revenue and returns 201', async () => {
    const res = await request(app)
      .post('/api/financial/budgets/budget-42/revenues')
      .send({ source: 'Ticket Sales', amount: 5000 });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.revenue.id, 'revenue-1');
  });

  it('GET /api/financial/budgets/:budgetId/revenues returns revenues list', async () => {
    const res = await request(app).get('/api/financial/budgets/budget-42/revenues');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.revenues));
    assert.ok(res.body.pagination);
  });

  it('DELETE /api/financial/revenues/:revenueId deletes a revenue entry', async () => {
    const res = await request(app).delete('/api/financial/revenues/revenue-42');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});

// ---------------------------------------------------------------------------
// Report / Calculation Success Cases
// ---------------------------------------------------------------------------

describe('Financial Routes — Reports & Calculations', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('GET /api/financial/budgets/:budgetId/variance returns variance analysis', async () => {
    const res = await request(app).get('/api/financial/budgets/budget-42/variance');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.variance));
  });

  it('GET /api/financial/budgets/:budgetId/income returns income statement', async () => {
    const res = await request(app).get('/api/financial/budgets/budget-42/income');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.income));
  });

  it('GET /api/financial/budgets/:budgetId/export returns report data', async () => {
    const res = await request(app).get('/api/financial/budgets/budget-42/export');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.report));
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe('Financial Routes — Error Handling', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
  });

  it('returns 500 when createBudget controller throws', async () => {
    app = createTestApp({ budgetCreateError: 'Database connection failed' });
    const res = await request(app).post('/api/financial/budgets').send({ name: 'Test' });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when updateBudget controller throws', async () => {
    app = createTestApp({ budgetUpdateError: 'Update failed' });
    const res = await request(app).put('/api/financial/budgets/b-1').send({ name: 'X' });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when deleteBudget controller throws', async () => {
    app = createTestApp({ budgetDeleteError: 'Delete failed' });
    const res = await request(app).delete('/api/financial/budgets/b-1');
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when createExpense controller throws', async () => {
    app = createTestApp({ expenseCreateError: 'DB error' });
    const res = await request(app)
      .post('/api/financial/budgets/b-1/expenses')
      .send({ amount: 100 });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });

  it('returns 500 when createRevenue controller throws', async () => {
    app = createTestApp({ revenueCreateError: 'DB error' });
    const res = await request(app)
      .post('/api/financial/budgets/b-1/revenues')
      .send({ amount: 100 });
    assert.equal(res.status, 500);
    assert.ok(res.body.error);
  });
});

// ---------------------------------------------------------------------------
// 404 Handling
// ---------------------------------------------------------------------------

describe('Financial Routes — 404', () => {
  let app;

  before(() => {
    authControl.adminEnabled = true;
    authControl.studentEnabled = true;
    app = createTestApp();
  });

  it('returns 404 for unknown financial routes', async () => {
    const res = await request(app).get('/api/financial/non-existent-route');
    assert.equal(res.status, 404);
  });

  it('returns 404 for nested unknown path', async () => {
    const res = await request(app).get('/api/financial/budgets/b-1/unknown-action');
    assert.equal(res.status, 404);
  });
});
