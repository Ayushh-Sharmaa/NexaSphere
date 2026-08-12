import { withDb } from './db.js';

/**
 * Repository for Custom Event Tracking.
 * Handles admin-defined event definitions (templates) and event occurrence logs.
 */
export const customEventRepository = {
  // ---------------------------------------------------------------------------
  // Event Definitions (Templates)
  // ---------------------------------------------------------------------------

  /** Create a new custom event definition */
  async createDefinition({ name, description, properties, createdBy }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO custom_event_definitions (name, description, properties, created_by, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING *`,
        [name, description || null, JSON.stringify(properties || []), createdBy]
      );
      return rows[0];
    });
  },

  /** List all event definitions, optionally only active ones */
  async listDefinitions({ activeOnly = false } = {}) {
    return withDb(async (client) => {
      const where = activeOnly ? 'WHERE is_active = true' : '';
      const { rows } = await client.query(
        `SELECT * FROM custom_event_definitions ${where} ORDER BY created_at DESC`
      );
      return rows;
    });
  },

  /** Get a single event definition by id */
  async getDefinition(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM custom_event_definitions WHERE id = $1', [
        id,
      ]);
      return rows[0] || null;
    });
  },

  /** Update an event definition */
  async updateDefinition(id, { name, description, properties, isActive }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE custom_event_definitions
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             properties = COALESCE($3, properties),
             is_active = COALESCE($4, is_active),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [
          name || null,
          description || null,
          properties ? JSON.stringify(properties) : null,
          isActive !== undefined ? isActive : null,
          id,
        ]
      );
      return rows[0] || null;
    });
  },

  /** Delete (hard-delete) an event definition and all its logs (CASCADE) */
  async deleteDefinition(id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'DELETE FROM custom_event_definitions WHERE id = $1 RETURNING *',
        [id]
      );
      return rows[0] || null;
    });
  },

  // ---------------------------------------------------------------------------
  // Event Logs (Occurrences)
  // ---------------------------------------------------------------------------

  /** Log an occurrence of a custom event */
  async logEvent({ eventDefinitionId, userId, sessionId, properties }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO custom_event_logs (event_definition_id, user_id, session_id, properties, occurred_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [eventDefinitionId, userId || null, sessionId || null, JSON.stringify(properties || {})]
        [
          eventDefinitionId,
          userId || null,
          sessionId || null,
          JSON.stringify(properties || {}),
      return rows[0];
    });
  },

  /**
   * Get analytics for a specific event definition:
   * - Total occurrences
   * - Occurrences grouped by day (last N days)
   * - Top property values (for string properties)
   * - Unique user/session counts
   */
  async getEventAnalytics(eventDefinitionId, { days = 30 } = {}) {
    return withDb(async (client) => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Total occurrences in range
      const { rows: totalRows } = await client.query(
        `SELECT COUNT(*) AS total,
                COUNT(DISTINCT user_id) AS unique_users,
                COUNT(DISTINCT session_id) AS unique_sessions
         FROM custom_event_logs
         WHERE event_definition_id = $1 AND occurred_at >= $2`,
        [eventDefinitionId, since]
      );

      // Daily breakdown
      const { rows: dailyRows } = await client.query(
        `SELECT DATE(occurred_at) AS date, COUNT(*) AS count
         FROM custom_event_logs
         WHERE event_definition_id = $1 AND occurred_at >= $2
         GROUP BY DATE(occurred_at)
         ORDER BY date ASC`,
        [eventDefinitionId, since]
      );

      // All-time total
      const { rows: allTimeRows } = await client.query(
        `SELECT COUNT(*) AS total FROM custom_event_logs WHERE event_definition_id = $1`,
        [eventDefinitionId]
      );

      return {
        total: parseInt(totalRows[0]?.total || 0, 10),
        uniqueUsers: parseInt(totalRows[0]?.unique_users || 0, 10),
        uniqueSessions: parseInt(totalRows[0]?.unique_sessions || 0, 10),
        allTimeTotal: parseInt(allTimeRows[0]?.total || 0, 10),
        dailyBreakdown: dailyRows.map((r) => ({
          date: r.date,
          count: parseInt(r.count, 10),
        })),
      };
    });
  },

  /**
   * Export raw event logs for a definition as an array of rows.
   * Optionally filter by date range.
   */
  async exportEventLogs(eventDefinitionId, { since, until } = {}) {
    return withDb(async (client) => {
      let query = `SELECT id, user_id, session_id, properties, occurred_at
                   FROM custom_event_logs
                   WHERE event_definition_id = $1`;
      const values = [eventDefinitionId];
      let idx = 2;

      if (since) {
        query += ` AND occurred_at >= $${idx++}`;
        values.push(since);
      }
      if (until) {
        query += ` AND occurred_at <= $${idx++}`;
        values.push(until);
      }

      query += ' ORDER BY occurred_at DESC';
      const { rows } = await client.query(query, values);
      return rows;
    });
  },

  /**
   * Get paginated recent logs for a definition.
   */
  async getRecentLogs(eventDefinitionId, { page = 1, limit = 50 } = {}) {
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const { rows } = await client.query(
        `SELECT id, user_id, session_id, properties, occurred_at
         FROM custom_event_logs
         WHERE event_definition_id = $1
         ORDER BY occurred_at DESC
         LIMIT $2 OFFSET $3`,
        [eventDefinitionId, limit, offset]
      );

      const { rows: countRows } = await client.query(
        'SELECT COUNT(*) AS total FROM custom_event_logs WHERE event_definition_id = $1',
        [eventDefinitionId]
      );

      return {
        logs: rows,
        total: parseInt(countRows[0]?.total || 0, 10),
        page,
        limit,
      };
    });
  },
};
