import { withDb } from "../repositories/db.js";
import logger from "../utils/logger.js";

export const syncController = {
  async getSyncStatus(req, res) {
    try {
      await withDb(async (client) => {
        // Ping database
        await client.query("SELECT 1");
      });
      return res.json({
        status: "ok",
        serverTime: new Date().toISOString(),
        databaseConnected: true,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        serverTime: new Date().toISOString(),
        databaseConnected: false,
        error: err.message,
      });
    }
  },

  async getUpdates(req, res) {
    const since = req.query.since;
    if (!since) {
      return res.status(400).json({ error: 'Missing "since" query parameter' });
    }
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({ error: 'Invalid "since" date format' });
    }

    try {
      await withDb(async (client) => {
        const eventsRes = await client.query(
          `SELECT id, name, description, updated_at 
           FROM events 
           WHERE updated_at > $1`,
          [sinceDate]
        );

        return res.json({
          serverTime: new Date().toISOString(),
          events: eventsRes.rows,
          portfolios: [],
        });
      });
    } catch (err) {
      logger.error("Failed to retrieve sync updates", { error: err.message });
      return res.status(500).json({ error: "Sync retrieval failed" });
    }
  },

  async syncBatch(req, res) {
    const { changes } = req.body;
    if (!Array.isArray(changes)) {
      return res
        .status(400)
        .json({ error: 'Expected "changes" array in request body' });
    }

    const results = [];
    try {
      await withDb(async (client) => {
        for (const change of changes) {
          const { type, id, data, lastKnownTimestamp } = change;

          if (type === "event") {
            // 1. Check for conflict
            const currentRes = await client.query(
              "SELECT updated_at, name, description FROM events WHERE id = $1",
              [id]
            );

            if (currentRes.rows.length > 0) {
              const current = currentRes.rows[0];
              const serverUpdated = new Date(current.updated_at);
              const clientKnown = new Date(lastKnownTimestamp);

              if (serverUpdated > clientKnown) {
                results.push({
                  id,
                  type,
                  status: "conflict",
                  message: "Conflict detected: Server version is newer.",
                  serverVersion: current,
                });
                continue;
              }
            }

            // 2. Perform write / update
            if (currentRes.rows.length === 0) {
              await client.query(
                `INSERT INTO events (id, name, date_text, description, updated_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [
                  id,
                  data.name,
                  data.date_text || new Date().toISOString(),
                  data.description,
                ]
              );
            } else {
              await client.query(
                `UPDATE events 
                 SET name = $1, description = $2, updated_at = NOW() 
                 WHERE id = $3`,
                [data.name, data.description, id]
              );
            }

            results.push({ id, type, status: "success" });
          } else {
            results.push({
              id,
              type,
              status: "ignored",
              error: "Unsupported sync type",
            });
          }
        }
      });

      const hasConflicts = results.some((r) => r.status === "conflict");
      return res.status(hasConflicts ? 409 : 200).json({
        serverTime: new Date().toISOString(),
        results,
      });
    } catch (err) {
      logger.error("Sync batch execution failed", { error: err.message });
      return res.status(500).json({ error: "Sync batch failed" });
    }
  },
};
