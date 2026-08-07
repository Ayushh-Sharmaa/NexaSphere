import logger from "../utils/logger.js";
import { getPublicAppUrl } from "../utils/publicAppUrl.js";
import {
  resolveAdminPermissions,
  adminCanReceiveEvent,
} from "../config/eventPermissions.js";

/**
 * Map<res, { joinedAt, admin: { username, permissions: Set<string> } }>
 * Tracks each SSE client together with the admin session that opened it,
 * so that broadcasts can be filtered to the right audience.
 */
const adminClients = new Map();
const MAX_SSE_CLIENTS = Math.max(
  1,
  parseInt(process.env.MAX_SSE_CLIENTS || "200", 10) || 200
);
const HEARTBEAT_INTERVAL_MS = Math.max(
  5_000,
  parseInt(process.env.SSE_HEARTBEAT_INTERVAL_MS || "15000", 10) || 15_000
);
const MAX_DROPPED_WRITES = Math.max(
  1,
  parseInt(process.env.SSE_MAX_DROPPED_WRITES || "3", 10) || 3
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
  logger.info("SSE client removed", {
    reason,
    totalClients: adminClients.size,
    admin: entry.admin?.username,
    ...meta,
  });
}

function writeToClient(client, message) {
  try {
    const ok = client.write(message);
    if (typeof client.flush === "function") client.flush();
    if (!ok) {
      client._droppedWrites = (client._droppedWrites || 0) + 1;
      if (client._droppedWrites >= MAX_DROPPED_WRITES) {
        cleanupClient(client, "backpressure");
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
    logger.error("Failed to send SSE event", { error: error.message });
    cleanupClient(client, "write_error", { error: error?.message });
    return false;
  }
  return true;
}

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
    logger.warn("SSE client rejected: max clients reached", {
      totalClients: adminClients.size,
      maxClients: MAX_SSE_CLIENTS,
    });
    try {
      res.status(503).end("Too many SSE connections");
    } catch (_) {}
    return;
  }

  const permissions = resolveAdminPermissions(adminSession);
  const username = adminSession?.username || "unknown";

  adminClients.set(res, {
    joinedAt: Date.now(),
    admin: { username, permissions },
  });

  logger.info("SSE client connected", {
    totalClients: adminClients.size,
    admin: username,
  });

  // Start the heartbeat interval immediately upon successful connection
  res._heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
      if (typeof res.flush === "function") res.flush();
    } catch (error) {
      clearInterval(res._heartbeat);
      cleanupClient(res, "heartbeat_error", { error: error?.message });
    }
  }, HEARTBEAT_INTERVAL_MS);

  res.on("close", () => {
    // Clear interval is handled inside cleanupClient, but keeping it explicit here is safe
    if (res._heartbeat) clearInterval(res._heartbeat);
    cleanupClient(res, "close");
  });

  res.on("error", (error) => {
    cleanupClient(res, "error", { error: error.message });
  });
}

/**
 * Broadcast an event to all SSE clients whose admin session has
 * permission to receive the event type.  Events with no required
 * permission are delivered to every connected client.
 *
 * @param {string} eventName - SSE event name
 * @param {Object} data - Event payload
 */
export function broadcastSSEEvent(eventName, data) {
  const eventData = JSON.stringify({
    type: eventName,
    data,
    timestamp: new Date().toISOString(),
  });
  const message = `event: ${eventName}\ndata: ${eventData}\n\n`;

  let delivered = 0;
  let skipped = 0;

  for (const [client, entry] of adminClients) {
    if (!adminCanReceiveEvent(eventName, entry.admin.permissions)) {
      skipped += 1;
      continue;
    }
    if (writeToClient(client, message)) {
      delivered += 1;
    }
  }

  logger.debug("SSE event broadcast", {
    event: eventName,
    delivered,
    skipped,
    totalClients: adminClients.size,
  });
}

export function getConnectedSSEClientsCount() {
  return adminClients.size;
}

function startHealthCheck() {
  if (healthCheckTimer) return;
  healthCheckTimer = setInterval(() => {
    const now = Date.now();
    for (const [client, entry] of adminClients) {
      if (now - entry.joinedAt > HEALTH_CHECK_INTERVAL_MS) {
        try {
          client.write(": ping\n\n");
        } catch {
          cleanupClient(client, "health_check_failed");
        }
      }
    }
  }, HEALTH_CHECK_INTERVAL_MS);
  if (typeof healthCheckTimer.unref === "function") {
    healthCheckTimer.unref();
  }
}

export function setupSSEHeaders(req, res, next) {
  if (adminClients.size >= MAX_SSE_CLIENTS) {
    res.status(503).end("Too many SSE connections");
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(": SSE connection established\n\n");

  res._heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch (error) {
      clearInterval(res._heartbeat);
      cleanupClient(res, "heartbeat_error", { error: error?.message });
    }
  }, HEARTBEAT_INTERVAL_MS);

  res.on("close", () => {
    clearInterval(res._heartbeat);
    cleanupClient(res, "close");
  });

  startHealthCheck();
  if (typeof res.flush === "function") res.flush();

  next();
}

export function _resetSSEClientsForTests() {
  for (const [res] of adminClients) {
    if (res._heartbeat) clearInterval(res._heartbeat);
  }
  adminClients.clear();
}

export default {
  addSSEClient,
  broadcastSSEEvent,
  getConnectedSSEClientsCount,
  setupSSEHeaders,
  _resetSSEClientsForTests,
};
