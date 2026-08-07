import test from 'node:test';
import assert from 'node:assert';

const PERMISSION_MATRIX = {
  SUPER_ADMIN: [
    'system_metrics',
    'rate_limit_monitor',
    'user_management',
    'audit_logs',
    'settings',
  ],
  ADMIN: [
    'system_metrics',
    'rate_limit_monitor',
    'user_management',
  ],
  AUDITOR: [
    'system_metrics',
    'audit_logs',
  ],
  VIEWER: [
    'system_metrics',
  ],
};

function hasPermission(role, routeKey) {
  if (!role || !routeKey) return false;
  const allowedRoutes = PERMISSION_MATRIX[role.toUpperCase()] || [];
  return allowedRoutes.includes(routeKey.toLowerCase());
}

test('SUPER_ADMIN has access to all admin sub-routes', () => {
  assert.strictEqual(hasPermission('SUPER_ADMIN', 'system_metrics'), true);
  assert.strictEqual(hasPermission('SUPER_ADMIN', 'rate_limit_monitor'), true);
  assert.strictEqual(hasPermission('SUPER_ADMIN', 'settings'), true);
});

test('ADMIN has access to management sub-routes but not settings', () => {
  assert.strictEqual(hasPermission('ADMIN', 'rate_limit_monitor'), true);
  assert.strictEqual(hasPermission('ADMIN', 'user_management'), true);
  assert.strictEqual(hasPermission('ADMIN', 'settings'), false);
});

test('VIEWER has restricted access only to system_metrics', () => {
  assert.strictEqual(hasPermission('VIEWER', 'system_metrics'), true);
  assert.strictEqual(hasPermission('VIEWER', 'user_management'), false);
  assert.strictEqual(hasPermission('VIEWER', 'rate_limit_monitor'), false);
});

test('Invalid roles or undefined parameters return false', () => {
  assert.strictEqual(hasPermission('', 'system_metrics'), false);
  assert.strictEqual(hasPermission('INVALID_ROLE', 'system_metrics'), false);
  assert.strictEqual(hasPermission('ADMIN', ''), false);
});
