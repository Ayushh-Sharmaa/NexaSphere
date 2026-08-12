import { withDb } from './db.js';

export const notificationPreferencesRepository = {
  async list(userId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1 ORDER BY category',
        [userId]
      );
      return rows;
    });
  },

  async set(userId, category, channels = {}) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO notification_preferences (user_id, category, email, push, in_app, sms, frequency, quiet_start, quiet_end, dnd, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (user_id, category) DO UPDATE SET
           email = COALESCE($3, notification_preferences.email),
           push = COALESCE($4, notification_preferences.push),
           in_app = COALESCE($5, notification_preferences.in_app),
           sms = COALESCE($6, notification_preferences.sms),
           frequency = COALESCE($7, notification_preferences.frequency),
           quiet_start = COALESCE($8, notification_preferences.quiet_start),
           quiet_end = COALESCE($9, notification_preferences.quiet_end),
           dnd = COALESCE($10, notification_preferences.dnd),
           updated_at = NOW()
         RETURNING *`,
        [
          userId,
          category,
          channels.email ?? true,
          channels.push ?? true,
          channels.in_app ?? true,
          channels.sms ?? true,
          channels.frequency ?? 'immediate',
          channels.quiet_start ?? null,
          channels.quiet_end ?? null,
          channels.dnd ?? false,
        ]
      );
      return rows[0];
    });
  },

  async setBulk(userId, prefs) {
    return withDb(async (client) => {
      const results = [];
      for (const pref of prefs) {
        const { category, email, push, in_app, sms, frequency, quiet_start, quiet_end, dnd } = pref;
        const { rows } = await client.query(
          `INSERT INTO notification_preferences (user_id, category, email, push, in_app, sms, frequency, quiet_start, quiet_end, dnd, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
           ON CONFLICT (user_id, category) DO UPDATE SET
             email = COALESCE($3, notification_preferences.email),
             push = COALESCE($4, notification_preferences.push),
             in_app = COALESCE($5, notification_preferences.in_app),
             sms = COALESCE($6, notification_preferences.sms),
             frequency = COALESCE($7, notification_preferences.frequency),
             quiet_start = COALESCE($8, notification_preferences.quiet_start),
             quiet_end = COALESCE($9, notification_preferences.quiet_end),
             dnd = COALESCE($10, notification_preferences.dnd),
             updated_at = NOW()
           RETURNING *`,
          [
            userId,
            category,
            email ?? true,
            push ?? true,
            in_app ?? true,
            sms ?? true,
            frequency ?? 'immediate',
            quiet_start ?? null,
            quiet_end ?? null,
            dnd ?? false,
          ]
        );
        results.push(rows[0]);
      }
      return results;
    });
  },

  async get(userId, category) {
    return withDb(async (client) => {
      if (category) {
        const { rows } = await client.query(
          'SELECT * FROM notification_preferences WHERE user_id = $1 AND category = $2 LIMIT 1',
          [userId, category]
        );
        return rows[0] || null;
      } else {
        const { rows } = await client.query(
          'SELECT * FROM notification_preferences WHERE user_id = $1',
          [userId]
        );
        const types = {};
        for (const row of rows) {
          types[row.category] = {
            email: row.email,
            push: row.push,
            in_app: row.in_app,
            sms: row.sms,
            frequency: row.frequency,
            quiet_start: row.quiet_start,
            quiet_end: row.quiet_end,
            dnd: row.dnd,
          };
        }
        return { types };
      }
    });
  },

  async isDNDActive(userId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT 1 FROM notification_preferences WHERE user_id = $1 AND dnd = true LIMIT 1',
        [userId]
      );
      return rows.length > 0;
    });
  },

  async isInsideQuietHours(userId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT quiet_start, quiet_end FROM notification_preferences WHERE user_id = $1 AND quiet_start IS NOT NULL AND quiet_end IS NOT NULL',
        [userId]
      );
      if (rows.length === 0) return false;

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const row of rows) {
        const { quiet_start, quiet_end } = row;
        const startParts = quiet_start.split(':');
        const endParts = quiet_end.split(':');
        const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

        if (startMinutes <= endMinutes) {
          if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            return true;
          }
        } else {
          if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
            return true;
          }
        }
      }
      return false;
    });
  },

  async isInsideQuietHours(userId, category = 'event_reminders') {
    const pref = await this.get(userId, category);
    if (!pref || !pref.quiet_start || !pref.quiet_end) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const start = pref.quiet_start;
    const end = pref.quiet_end;

    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  },

  async isDNDActive(userId, category = 'event_reminders') {
    const pref = await this.get(userId, category);
    return pref ? !!pref.dnd : false;
  },
};
