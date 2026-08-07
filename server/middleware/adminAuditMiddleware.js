import { auditLogRepository } from '../repositories/auditLogRepository.js';

function getResourceType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('/users') || lower.includes('/membership') || lower.includes('/admin/me'))
    return 'user';
  if (lower.includes('/events')) return 'event';
  if (lower.includes('/announcements')) return 'announcement';
  if (lower.includes('/settings') || lower.includes('/config') || lower.includes('/feature-flag'))
    return 'setting';
  if (lower.includes('/moderation') || lower.includes('/forms') || lower.includes('/submissions'))
    return 'moderation';
  if (lower.includes('/financial') || lower.includes('/budget') || lower.includes('/expense'))
    return 'financial';
  if (lower.includes('/login') || lower.includes('/logout') || lower.includes('/auth'))
    return 'auth';
  return 'other';
}

function getResourceId(req) {
  let id = req.params.id || req.body.id || req.body.userId || req.body.eventId;
  if (!id) {
    const parts = req.originalUrl.split('?')[0].split('/');
    const last = parts[parts.length - 1];
    const excluded = [
      'users',
      'events',
      'announcements',
      'login',
      'logout',
      'config-review',
      'read-only-enable',
      'read-only-disable',
      'membership',
      'database-health',
      'database-corruption',
      'database-recovery',
      'database-audit-log',
      'service-status',
      'incidents',
      'maintenance',
      'uptime-report',
      'status-subscribers',
      'consistency-check',
      'sync-status',
      'conflicts',
      'integrity-report',
      'consistency-alerts',
      'security-analytics',
    ];
    if (last && !excluded.includes(last)) {
      id = last;
    }
  }
  return id ? String(id) : null;
}

/**
 * Middleware that logs administrative actions.
 * It intercepts the response to capture the new state.
 */
export function adminAuditMiddleware(req, res, next) {
  // Only log modifying requests (and auth requests)
  const isAuthRequest = req.originalUrl.includes('/login') || req.originalUrl.includes('/logout');
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && !isAuthRequest) {
    return next();
  }

  const originalJson = res.json;
  const originalSend = res.send;

  // We'll capture the new state from the response body
  let newStateStr = null;

  res.json = function (body) {
    newStateStr = JSON.stringify(body);
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    if (!newStateStr) {
      try {
        if (typeof body === 'object') {
          newStateStr = JSON.stringify(body);
        } else {
          newStateStr = body;
        }
      } catch (e) {
        // ignore stringify errors
      }
    }
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

    // For normal administrative actions, we log only successful ones.
    // For auth login attempts, we log both successful and failed ones.
    const isLogin = req.originalUrl.includes('/login');
    const shouldLog = isSuccess || isLogin;

    if (shouldLog) {
      let adminId = req.adminSession?.username || 'unknown';
      let action = `${req.method} ${req.originalUrl}`;
      const resourceType = getResourceType(req.originalUrl);
      const resourceId = getResourceId(req);
      const sessionId = req.adminSession?.token || req.headers['x-session-id'] || null;

      if (isLogin) {
        adminId = req.body?.username || 'unknown';
        action = isSuccess ? 'login' : 'failed_login';
      } else if (req.originalUrl.includes('/logout')) {
        action = 'logout';
      }

      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    // Determine if it was a successful request (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const adminId = req.adminSession?.username || 'unknown';
      const action = `${req.method} ${req.originalUrl}`;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');
      const timestamp = new Date().toISOString();

      const riskLevel =
        req.method === 'DELETE' ? 'HIGH' : req.method === 'PATCH' ? 'MEDIUM' : 'LOW';
        req.method === 'DELETE'
          ? 'HIGH'
          : req.method === 'PATCH'
            ? 'MEDIUM'
            : 'LOW';

      const oldState = req.oldState || null;

      let newState = null;
      if (newStateStr) {
        try {
          newState = JSON.parse(newStateStr);
        } catch (e) {
          newState = { raw: newStateStr };
        }
      } else if (req.method === 'POST') {
        newState = req.body;
      }

      await auditLogRepository.insertAuditLog({
        adminId,
        action,
        ipAddress,
        userAgent,
        oldState,
        newState,
        timestamp,
        riskLevel,
        resourceType,
        resourceId,
        sessionId,
      });
    }
  });

  next();
}

/**
 * Helper to attach old state to the request before the controller modifies it.
 * @param {Function} fetcher Async function that takes req and returns the old state object.
 */
export const attachOldState = (fetcher) => async (req, res, next) => {
  try {
    req.oldState = await fetcher(req);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to fetch old state for audit');
  }
  next();
};
