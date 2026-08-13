/**
 * Server-Sent Events (SSE) Service
 * Provides real-time event stream to admin dashboard
 */

import logger from '../utils/logger.js';
import { getPublicAppUrl } from '../utils/publicAppUrl.js';
import { resolveAdminPermissions, adminCanReceiveEvent } from '../config/eventPermissions.js';

/**
 * Map<res, { joinedAt, admin: { username, permissions: Set<string> } }>
 * Tracks each SSE client together with the admin session that opened it,
 * so that broadcasts can be filtered to the right audience.
 */
const adminClients = new Map();
const MAX_SSE_CLIENTS = Math.max(1, parseInt(process.env.MAX_SSE_CLIENTS || '200', 10) || 200);
const HEARTBEAT_INTERVAL_MS = Math.max(
  5_000,
  parseInt(process.env.SSE_HEARTBEAT_INTERVAL_MS || '15000', 10) || 15_000
);
const MAX_DROPPED_WRITES = Math.max(
  1,
  parseInt(process.env.SSE_MAX_DROPPED_WRITES || '3', 10) || 3
);
const HEALTH_CHECK_INTERVAL_MS = 60000;

let healthCheckTimer = null;

function cleanupClient(res, reason, meta = {}) {
  const entry = adminClients.get(res);
  if (!entry) return;
  adminClients.delete(res);
  if (res._heartbeat) clearInterval(res._heartbeat);
  res._heartbeat = null;
  res._droppedWrites = 0;
  logger.info('SSE client removed', {
    reason,
    totalClients: adminClients.size,
    admin: entry.admin?.username,
    ...meta,
  });
}

function writeToClient(client, message) {
  try {
    const ok = client.write(message);
    if (typeof client.flush === 'function') client.flush();
    if (!ok) {
      client._droppedWrites = (client._droppedWrites || 0) + 1;
      if (client._droppedWrites >= MAX_DROPPED_WRITES) {
        cleanupClient(client, 'backpressure');
        try {
          client.end();
        } catch (_) {
          // ignore
        }
        return false;
      }
    } else {
      client._droppedWrites = 0;
    }
  } catch (error) {
    logger.error('Failed to send SSE event', { error: error.message });
    cleanupClient(client, 'write_error', { error: error?.message });
    return false;
  }
  return true;
}
import { getAdminSession } from '../repositories/adminSessionsRepository.js';

const SSE_VALIDATION_INTERVAL_MS = 5000;
let sseValidationTimer = null;

/**
 * Start periodic verification of active SSE clients against the database
 */
export function startSSEValidation() {
  if (sseValidationTimer) return sseValidationTimer;

  sseValidationTimer = setInterval(async () => {
    const clients = Array.from(adminClients);
    for (const client of clients) {
      const token = client.adminSessionToken;
      if (!token) {
        logger.warn('SSE client missing token, force terminating');
        client.end();
        adminClients.delete(client);
        if (client._heartbeat) clearInterval(client._heartbeat);
        continue;
      }
      try {
        const session = await getAdminSession(token);
        if (!session) {
          logger.warn('Revoked or expired admin SSE session detected. Force terminating connection.', { token: token.slice(0, 8) });
          try {
            client.write(`event: admin:revoked\ndata: ${JSON.stringify({ error: 'Session has been revoked or expired' })}\n\n`);
          } catch (e) {
            // Client might already be closed
          }
          client.end();
          adminClients.delete(client);
          if (client._heartbeat) clearInterval(client._heartbeat);
        }
      } catch (error) {
        logger.error('Failed to validate active SSE client session', { error: error.message });
      }
    }
  }, SSE_VALIDATION_INTERVAL_MS);

  if (sseValidationTimer && typeof sseValidationTimer.unref === 'function') {
    sseValidationTimer.unref();
  }
  return sseValidationTimer;
}

/**
 * Stop periodic verification of active SSE clients
 */
export function stopSSEValidation() {
  if (sseValidationTimer) {
    clearInterval(sseValidationTimer);
    sseValidationTimer = null;
  }
}

// Start validation automatically at the module level
startSSEValidation();

/**
 * Add SSE client
 * @param {Object} res - Express response object
 * @param {Object} [adminSession] - Admin session from auth middleware
 */
export function addSSEClient(res, adminSession = null) {
  if (adminClients.has(res)) {
    return;
  }
  if (adminClients.size >= MAX_SSE_CLIENTS) {
    logger.warn('SSE client rejected: max clients reached', {
      totalClients: adminClients.size,
      maxClients: MAX_SSE_CLIENTS,
    });
    try {
      res.status(503).end('Too many SSE connections');
    } catch (err) {
      logger.warn('Failed to reject excess SSE connection', { error: err.message });
    }
    return;
  }

  const permissions = resolveAdminPermissions(adminSession);
  const username = adminSession?.username || 'unknown';
  res._joinedTime = Date.now();
  adminClients.add(res);
  logger.info('SSE client connected', { totalClients: adminClients.size });

  adminClients.set(res, {
    joinedAt: Date.now(),
    admin: { username, permissions },
  });

  logger.info('SSE client connected', {
    totalClients: adminClients.size,
    admin: username,
  });

  // Start the heartbeat interval immediately upon successful connection
  logger.info('SSE client connected', { totalClients: adminClients.size });
}

export function broadcastSSEEvent(eventName, data) {
  const eventData = JSON.stringify({
    type: eventName,
    data,
    timestamp: new Date().toISOString(),
  });
  const message = `event: ${eventName}\ndata: ${eventData}\n\n`;

  adminClients.forEach((client) => {
    try {
      const ok = client.write(message);
      if (!ok) {
        client._droppedWrites = (client._droppedWrites || 0) + 1;
        if (client._droppedWrites >= MAX_DROPPED_WRITES) {
          cleanupClient(client, 'backpressure');
          try {
            client.end();
          } catch (_) {
            // ignore
          }
        }
      } else {
        client._droppedWrites = 0;
      }
    } catch (error) {
      logger.error('Failed to send SSE event', { error: error.message });
      cleanupClient(client, 'write_error', { error: error?.message });
    }
  });

  logger.debug('SSE event broadcast', { event: eventName, clientCount: adminClients.size });
}

export function getConnectedSSEClientsCount() {
  return adminClients.size;
}


setInterval(() => {
  const now = Date.now();
  // Iterate the Set directly to avoid destructuring TypeError (adminClients is a Set)
  for (const client of adminClients) {
    const joined = client._joinedTime || now;
    if (now - joined > HEALTH_CHECK_INTERVAL_MS) {
      try {
        client.write(': ping\n\n');
      } catch {
        if (client._heartbeat) clearInterval(client._heartbeat);
        adminClients.delete(client);
        logger.warn('SSE client evicted (health check failed)', {
          totalClients: adminClients.size,
        });
      }
    }
  }
}, HEALTH_CHECK_INTERVAL_MS).unref();

export function setupSSEHeaders(req, res, next) {
  if (adminClients.size >= MAX_SSE_CLIENTS) {
    res.status(503).end('Too many SSE connections');
    return;
  }

  const allowedOrigin = getPublicAppUrl();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // The app-level cors() middleware already selected the correct origin.
  // Do not overwrite it here, or multi-origin deployments break.

  res.write(': SSE connection established\n\n');

  res._heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
      if (typeof res.flush === 'function') res.flush();
    } catch (error) {
      clearInterval(res._heartbeat);
      cleanupClient(res, 'heartbeat_error', { error: error?.message });
    }
  }, HEARTBEAT_INTERVAL_MS);

  res.on('close', () => {
    // Clear interval is handled inside cleanupClient, but keeping it explicit here is safe
    if (res._heartbeat) clearInterval(res._heartbeat);
    cleanupClient(res, 'close');
  });

  res.on('error', (error) => {
    cleanupClient(res, 'error', { error: error.message });

/**
 * Broadcast an event to all SSE clients whose admin session has
 * permission to receive the event type.  Events with no required
 * permission are delivered to every connected client.
 *
 * @param {string} eventName - SSE event name
 * @param {Object} data - Event payload
 * Send SSE event to all connected clients
 */
}
);
}