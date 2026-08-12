import { withDb } from '../repositories/db.js';
import logger from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getDeploymentHealth = async (req, res) => {
  sendSuccess(res, {
    status: 'healthy',
    rollbackAvailable: true,
    trafficSwitchReady: true,
  });
};
export const syncController = {
  async getSyncStatus(req, res) {
    try {
      const result = await withDb(async (client) => {
        await client.query('SELECT 1');
        const pendingRes = await client.query(
          `SELECT COUNT(*)::int AS count
           FROM events
           WHERE updated_at > NOW() - INTERVAL '24 hours'`
        );
        return pendingRes.rows[0]?.count || 0;
      });
      return sendSuccess(res, {
        status: 'ok',
        serverTime: new Date().toISOString(),
        databaseConnected: true,
        lastSyncTimestamp: req.query.since || null,
        pendingOperations: result,
        compressionSupported: true,
      });
    } catch (err) {
      return sendError(req, res, err.message, 500, 'INTERNAL_ERROR', {
        status: 'error',
        serverTime: new Date().toISOString(),
        databaseConnected: false,

}
);
}
}
}