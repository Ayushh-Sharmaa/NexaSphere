import { getScopesForRole } from '../config/rbac.js';

/**
 * Middleware to check if user has required permission
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @param {object} options - Options
 * @param {boolean} options.requireAll - If true, user must have ALL permissions (default: any)
 */
export function requirePermission(requiredPermissions, options = {}) {
  const { requireAll = false } = options;
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return async (req, res, next) => {
    if (!req.adminSession) {
      return res.status(401).json({ error: 'Unauthorized: No session found' });
    }

    const userRole = req.adminSession.metadata?.role || 'Viewer';
    const userScopes = req.adminSession.metadata?.scopes || getScopesForRole(userRole);

    const hasPermission = requireAll
      ? permissions.every((p) => userScopes.includes(p))
      : permissions.some((p) => userScopes.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        required: permissions,
        has: userScopes,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has higher role than target
 */
export function requireHigherRole(targetRoleGetter) {
  return async (req, res, next) => {
    if (!req.adminSession) {
      return res.status(401).json({ error: 'Unauthorized: No session found' });
    }

    const userRole = req.adminSession.metadata?.role || 'Viewer';
    const targetRole =
      typeof targetRoleGetter === 'function' ? targetRoleGetter(req) : targetRoleGetter;

    const { hasHigherRole } = await import('../config/rbac.js');

    if (!hasHigherRole(userRole, targetRole)) {
      return res.status(403).json({
        error: 'Forbidden: Cannot manage users with equal or higher role',
        userRole,
        targetRole,
      });
    }

    next();
  };
}

/**
 * Middleware to log permission checks for audit
 */
export function auditPermissionCheck(req, res, next) {
  if (!req.adminSession) {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 403) {
      const auditLog = {
        timestamp: new Date().toISOString(),
        adminId: req.adminSession.username,
        action: 'PERMISSION_DENIED',
        path: req.originalUrl,
        method: req.method,
        requiredPermission: req.requiredPermission,
        userRole: req.adminSession.metadata?.role,
        ipAddress: req.ip,
      };
      console.warn('[AUDIT] Permission denied:', auditLog);
    }
    return originalJson.call(this, body);
  };

  next();
}
