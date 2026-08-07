import { withDb } from './db.js';

export const featureFlagsRepository = {
  async getFlagByKey(key) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM feature_flags WHERE key = $1', [key]);
      return rows[0] || null;
    });
  },

  async getAllFlags() {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM feature_flags ORDER BY key ASC');
      return rows;
    });
  },

  async createFlag({
    key,
    name,
    description,
    type,
    is_active,
    rollout_percentage,
    target_users,
    target_roles,
    environments,
    start_time,
    end_time,
    fallback_value,
  }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO feature_flags (
          key, name, description, type, is_active, rollout_percentage,
          target_users, target_roles, environments, start_time, end_time, fallback_value,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *`,
        [
          key,
          name,
          description || '',
          type,
          is_active ?? true,
          rollout_percentage ?? 100,
          JSON.stringify(target_users || []),
          JSON.stringify(target_roles || []),
          JSON.stringify(environments || []),
          start_time || null,
          end_time || null,
          fallback_value ?? false,
        ]
      );
      return rows[0];
    });
  },

  async updateFlag(key, updates) {
    return withDb(async (client) => {
      const fields = [];
      const values = [];
      let i = 1;

      const keysToUpdate = [
        'name',
        'description',
        'type',
        'is_active',
        'rollout_percentage',
        'target_users',
        'target_roles',
        'environments',
        'start_time',
        'end_time',
        'fallback_value',
      ];

      for (const k of keysToUpdate) {
        if (updates[k] !== undefined) {
          fields.push(`${k} = $${i++}`);
          if (Array.isArray(updates[k]) || typeof updates[k] === 'object') {
            values.push(JSON.stringify(updates[k]));
          } else {
            values.push(updates[k]);
          }
        }
      }

      if (fields.length === 0) return null;

      fields.push(`updated_at = NOW()`);
      values.push(key);
      const sql = `UPDATE feature_flags SET ${fields.join(', ')} WHERE key = $${i} RETURNING *`;
      const { rows } = await client.query(sql, values);
      return rows[0] || null;
    });
  },

  async deleteFlag(key) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('DELETE FROM feature_flags WHERE key = $1', [key]);
      return rowCount > 0;
    });
  },

  async recordHistory({ flagKey, action, changedBy, oldState, newState }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO feature_flag_history (flag_key, action, changed_by, old_state, new_state, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          flagKey,
          action,
          changedBy || 'anonymous',
          oldState ? JSON.stringify(oldState) : null,
          newState ? JSON.stringify(newState) : null,
        ]
      );
      return rows[0];
    });
  },

  async getHistory(flagKey) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM feature_flag_history WHERE flag_key = $1 ORDER BY created_at DESC',
        [flagKey]
      );
      return rows;
    });
  },

  async getABTestMetrics(flagKey) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM ab_test_metrics WHERE flag_key = $1', [
        flagKey,
      ]);
      return rows;
    });
  },

  async initializeABMetrics(flagKey) {
    return withDb(async (client) => {
      await client.query(
        `INSERT INTO ab_test_metrics (flag_key, group_name, participants_count, conversions_count)
         VALUES ($1, 'control', 0, 0), ($1, 'variant', 0, 0)
         ON CONFLICT (flag_key, group_name) DO NOTHING`,
        [flagKey]
      );
    });
  },

  async recordABParticipant(flagKey, groupName) {
    return withDb(async (client) => {
      await client.query(
        `UPDATE ab_test_metrics 
         SET participants_count = participants_count + 1 
         WHERE flag_key = $1 AND group_name = $2`,
        [flagKey, groupName]
      );
    });
  },

  async recordABConversion(flagKey, groupName) {
    return withDb(async (client) => {
      await client.query(
        `UPDATE ab_test_metrics 
         SET conversions_count = conversions_count + 1 
         WHERE flag_key = $1 AND group_name = $2`,
        [flagKey, groupName]
      );
    });
  },

  async resetABMetrics(flagKey) {
    return withDb(async (client) => {
      await client.query(
        `UPDATE ab_test_metrics 
         SET participants_count = 0, conversions_count = 0 
         WHERE flag_key = $1`,
        [flagKey]
      );
    });
  },

  async getStaleFlags(staleThresholdDays = 30) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM feature_flags 
         WHERE updated_at < NOW() - make_interval(days => $1::double precision)`,
        [staleThresholdDays]
      );
      return rows;
    });
  },
};
