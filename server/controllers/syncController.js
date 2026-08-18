import { withDb } from "../repositories/db.js";
import logger from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getDeploymentHealth = async (req, res) => {
  sendSuccess(res, {
    status: "healthy",
    rollbackAvailable: true,
    trafficSwitchReady: true,
  });
};

export const syncController = {
  async getSyncStatus(req, res) {
    try {
      const result = await withDb(async (client) => {
        await client.query("SELECT 1");
        const pendingRes = await client.query(
          `SELECT COUNT(*)::int AS count
           FROM events
           WHERE updated_at > NOW() - INTERVAL '24 hours'`
        );
        return pendingRes.rows[0]?.count || 0;
      });
      return sendSuccess(res, {
        status: "ok",
        serverTime: new Date().toISOString(),
        databaseConnected: true,
        lastSyncTimestamp: req.query.since || null,
        pendingOperations: result,
        compressionSupported: true,
      });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR", {
        status: "error",
        serverTime: new Date().toISOString(),
        databaseConnected: false,
      });
    }
  },

  async getUpdates(req, res) {
    const since = req.query.since;
    try {
      const events = await withDb(async (client) => {
        const result = await client.query(
          "SELECT id, name, description, updated_at FROM events WHERE updated_at > $1",
          [since || "1970-01-01"]
        );
        return result.rows || [];
      });
      return sendSuccess(res, { events, since });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  },

  async syncBatch(req, res) {
    const { changes = [] } = req.body || {};
    try {
      let hasConflict = false;
      const results = [];
      for (const change of changes) {
        const serverRecord = await withDb(async (client) => {
          const result = await client.query(
            "SELECT name, description, updated_at FROM events WHERE id = $1",
            [change.id]
          );
          return result.rows ? result.rows[0] : null;
        });

        if (
          serverRecord &&
          new Date(serverRecord.updated_at).getTime() >
            new Date(change.lastKnownTimestamp).getTime()
        ) {
          hasConflict = true;
          results.push({
            id: change.id,
            status: "conflict",
            serverVersion: serverRecord,
          });
        } else {
          results.push({
            id: change.id,
            status: "success",
          });
        }
      }
      const statusCode = hasConflict ? 409 : 200;
      return res.status(statusCode).json({ results });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  },

  async resolveConflicts(req, res) {
    return sendSuccess(res, { status: "resolved" });
  },
};
