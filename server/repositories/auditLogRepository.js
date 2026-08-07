import { withDb } from "./db.js";
import crypto from "crypto";
import logger from "../utils/logger.js";

class AuditLogRepository {
  async init() {
    await withDb(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY,
          admin_id VARCHAR(255) NOT NULL,
          action VARCHAR(255) NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          old_state JSONB,
          new_state JSONB,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    });
  }

  async insertAuditLog(logEntry) {
    const { adminId, action, ipAddress, userAgent, oldState, newState } =
      logEntry;

    const id = crypto.randomUUID();
    const delays = [100, 500, 1000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        await withDb(async (client) => {
          await client.query(
            `INSERT INTO audit_logs (id, admin_id, action, ip_address, user_agent, old_state, new_state, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              id,
              adminId,
              action,
              ipAddress || null,
              userAgent || null,
              oldState ? JSON.stringify(oldState) : null,
              newState ? JSON.stringify(newState) : null,
            ]
          );
        });
        return;
      } catch (err) {
        if (attempt === delays.length) {
          logger.error("Failed to insert audit log", {
            error: err.message,
            logEntry,
          });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  async clearAll_TEST_ONLY() {
    if (process.env.NODE_ENV === "test") {
      await withDb(async (client) => {
        await client.query("DELETE FROM audit_logs");
      });
    }
  }
}

export const auditLogRepository = new AuditLogRepository();

// Initialize the table on load
auditLogRepository.init().catch((err) => {
  logger.error("Failed to initialize audit_logs table", { error: err.message });
});
