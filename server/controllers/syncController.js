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

export const syncController = {
  async getSyncStatus(req, res) {
    try {
      await withDb(async (client) => {
        // Ping database
        await client.query('SELECT 1');
      });
      return res.json({
        status: 'ok',
        serverTime: new Date().toISOString(),
        databaseConnected: true,
      });
    } catch (err) {
      return res.status(500).json({
        status: 'error',
        serverTime: new Date().toISOString(),
        databaseConnected: false,
        error: err.message,
      });
    }
  },

  async getUpdates(req, res) {
    const since = req.query.since;
    if (!since) {
      return sendError(req, res, 'Missing "since" query parameter', 400, 'VALIDATION_ERROR');
    }
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return sendError(req, res, 'Invalid "since" date format', 400, 'VALIDATION_ERROR');
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
        const portfolioRes = await client.query(
          `SELECT id, title, updated_at
           FROM portfolios
           WHERE updated_at > $1`,
          [sinceDate]
        );

        return sendSuccess(res, {

        return res.json({
          serverTime: new Date().toISOString(),
          events: eventsRes.rows,
          portfolios: portfolioRes.rows,
        
        return res.json({
          serverTime: new Date().toISOString(),
          events: eventsRes.rows,
          portfolios: [],
        });
      });
    } catch (err) {
      logger.error('Failed to retrieve sync updates', { error: err.message });
      return sendError(req, res, 'Sync retrieval failed', 500, 'INTERNAL_ERROR');
      return res.status(500).json({ error: 'Sync retrieval failed' });
    }
  },

  async syncBatch(req, res) {
    const { changes } = req.body;
    if (!Array.isArray(changes)) {
      return sendError(
        req,
        res,
        'Expected "changes" array in request body',
        400,
        'VALIDATION_ERROR'
      );
    }

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      if (!change || typeof change !== 'object') {
        return sendError(req, res, `changes[${i}] must be an object`, 400, 'VALIDATION_ERROR');
      }
      if (!change.type || typeof change.type !== 'string') {
        return sendError(
          req,
          res,
          `changes[${i}].type is required and must be a string`,
          400,
          'VALIDATION_ERROR'
        );
      }
      if (!['event'].includes(change.type)) {
        return sendError(
          req,
          res,
          `changes[${i}].type "event" is the only supported type`,
          400,
          'VALIDATION_ERROR'
        );
      }
      if (!change.id || typeof change.id !== 'string') {
        return sendError(
          req,
          res,
          `changes[${i}].id is required and must be a string`,
          400,
          'VALIDATION_ERROR'
        );
      }
      if (!change.data || typeof change.data !== 'object' || Array.isArray(change.data)) {
        return sendError(
          req,
          res,
          `changes[${i}].data is required and must be an object`,
          400,
          'VALIDATION_ERROR'
        );
      }
      if (!change.data.name || typeof change.data.name !== 'string') {
        return sendError(
          req,
          res,
          `changes[${i}].data.name is required and must be a string`,
          400,
          'VALIDATION_ERROR'
        );
      }
      return res.status(400).json({ error: 'Expected "changes" array in request body' });
    }

    const results = [];
    try {
      await withDb(async (client) => {
        for (const change of changes) {
          const { type, id, data, lastKnownTimestamp } = change;

          if (type === 'event') {
            // 1. Check for conflict
            const currentRes = await client.query(
              'SELECT updated_at, name, description FROM events WHERE id = $1',
              [id]
            );

            if (currentRes.rows.length > 0) {
              const current = currentRes.rows[0];
              const serverUpdated = new Date(current.updated_at);
              const clientKnown = new Date(lastKnownTimestamp);

              if (!lastKnownTimestamp || isNaN(clientKnown.getTime())) {
                results.push({
                  id,
                  type,
                  status: 'error',
                  message: 'Invalid or missing lastKnownTimestamp.',
                });
                continue;
              }

              if (serverUpdated > clientKnown) {
                results.push({
                  id,
                  type,
                  status: 'conflict',
                  message: 'Conflict detected: Server version is newer.',
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
                [id, data.name, data.date_text || new Date().toISOString(), data.description]
              );
            } else {
              await client.query(
                `UPDATE events 
                 SET name = $1, description = $2, updated_at = NOW() 
                 WHERE id = $3`,
                [data.name, data.description, id]
              );
            }

            results.push({ id, type, status: 'success' });
          } else {
            results.push({ id, type, status: 'ignored', error: 'Unsupported sync type' });
          }
        }
      });

      const hasConflicts = results.some((r) => r.status === 'conflict');
      return sendSuccess(
        res,
        {
          serverTime: new Date().toISOString(),
          results,
          ...(hasConflicts
            ? { retryAfterConflict: 'Use POST /api/sync/resolve-conflicts to force update' }
            : {}),
        },
        hasConflicts ? 409 : 200
      );
    } catch (err) {
      logger.error('Sync batch execution failed', { error: err.message });
      return sendError(req, res, 'Sync batch failed', 500, 'INTERNAL_ERROR');
    }
  },

  async resolveConflicts(req, res) {
    const { changes } = req.body;
    if (!Array.isArray(changes)) {
      return sendError(
        req,
        res,
        'Expected "changes" array in request body',
        400,
        'VALIDATION_ERROR'
      );
    }

    const results = [];
    try {
      await withDb(async (client) => {
        for (const change of changes) {
          if (!change || typeof change !== 'object') {
            results.push({ status: 'error', message: 'Invalid change object' });
            continue;
          }
          const { type, id, data } = change;
          if (type === 'event' && id && data) {
            await client.query(
              `INSERT INTO events (id, name, date_text, description, updated_at)
               VALUES ($1, $2, $3, $4, NOW())
               ON CONFLICT (id) DO UPDATE
               SET name = EXCLUDED.name,
                   description = EXCLUDED.description,
                   updated_at = NOW()`,
              [id, data.name, data.date_text || new Date().toISOString(), data.description]
            );
            results.push({ id, type, status: 'resolved' });
          } else {
            results.push({ id, type, status: 'ignored', message: 'Unsupported sync type' });
          }
        }
      });

      return sendSuccess(res, {
      const hasConflicts = results.some(r => r.status === 'conflict');
      return res.status(hasConflicts ? 409 : 200).json({
        serverTime: new Date().toISOString(),
        results,
      });
    } catch (err) {
      logger.error('Conflict resolution failed', { error: err.message });
      return sendError(req, res, 'Conflict resolution failed', 500, 'INTERNAL_ERROR');
    }
  },
      logger.error('Sync batch execution failed', { error: err.message });
      return res.status(500).json({ error: 'Sync batch failed' });
    }
  }
};
