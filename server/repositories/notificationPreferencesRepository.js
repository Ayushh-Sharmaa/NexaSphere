import { withDb } from "./db.js";

export const notificationPreferencesRepository = {
  async list(userId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM notification_preferences WHERE user_id = $1 ORDER BY category",
        [userId]
      );
      return rows;
    });
  },

  async set(userId, category, channels = {}) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO notification_preferences (user_id, category, email, push, in_app, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, category) DO UPDATE SET
           email = COALESCE($3, notification_preferences.email),
           push = COALESCE($4, notification_preferences.push),
           in_app = COALESCE($5, notification_preferences.in_app),
           updated_at = NOW()
         RETURNING *`,
        [
          userId,
          category,
          channels.email ?? true,
          channels.push ?? true,
          channels.in_app ?? true,
        ]
      );
      return rows[0];
    });
  },

  async setBulk(userId, prefs) {
    return withDb(async (client) => {
      const results = [];
      for (const { category, email, push, in_app } of prefs) {
        const { rows } = await client.query(
          `INSERT INTO notification_preferences (user_id, category, email, push, in_app, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id, category) DO UPDATE SET
             email = COALESCE($3, notification_preferences.email),
             push = COALESCE($4, notification_preferences.push),
             in_app = COALESCE($5, notification_preferences.in_app),
             updated_at = NOW()
           RETURNING *`,
          [userId, category, email ?? true, push ?? true, in_app ?? true]
        );
        results.push(rows[0]);
      }
      return results;
    });
  },

  async get(userId, category) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM notification_preferences WHERE user_id = $1 AND category = $2 LIMIT 1",
        [userId, category]
      );
      return rows[0] || null;
    });
  },
};
