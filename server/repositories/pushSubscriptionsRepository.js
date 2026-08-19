import { withDb } from "./db.js";

function mapRow(row) {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

export const pushSubscriptionsRepository = {
  async list({ limit = 10000 } = {}) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "select endpoint, p256dh, auth from push_subscriptions order by created_at desc limit $1",
        [limit]
      );
      return rows.map(mapRow);
    });
  },

  async add(subscription) {
    return withDb(async (client) => {
      await client.query(
        `insert into push_subscriptions (endpoint, p256dh, auth, subscription)
         values ($1, $2, $3, $4)
         on conflict (endpoint) do update set
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           subscription = excluded.subscription`,
        [
          subscription.endpoint,
          subscription.keys.p256dh,
          subscription.keys.auth,
          JSON.stringify(subscription),
        ]
      );
    });
  },

  async remove(endpoint) {
    return withDb(async (client) => {
      await client.query("delete from push_subscriptions where endpoint = $1", [
        endpoint,
      ]);
    });
  },

  async listByUser(userId) {
    return withDb(async (client) => {
      try {
        const { rows } = await client.query(
          "select endpoint, p256dh, auth from push_subscriptions where user_id = $1 order by created_at asc",
          [userId]
        );
        return rows.map(mapRow);
      } catch (err) {
        // Fallback if user_id column does not exist
        return [];
      }
    });
  },
};
