import { withDb } from "./db.js";

function mapRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
    expiresAt: row.expires_at,

    // Priority / grouping
    priorityClass: row.priority_class,
    priorityScore: row.priority_score,
    dedupeKey: row.dedupe_key,
    snoozedUntil: row.snoozed_until,
    groupType: row.group_type,
    groupKey: row.group_key,
    sender: row.sender,
    eventId: row.event_id,

    // Rich + actions
    image: row.image,
    actions: row.actions,
    data: row.data,
    critical: row.critical,

    // Archive
    archivedAt: row.archived_at,
  };
}

export const notificationsRepository = {
  async list({
    userId = "global",
    limit = 100,
    offset = 0,
    tab = "all",
    q = null,
  } = {}) {
    return withDb(async (client) => {
      // Tabs:
      // - all: all non-archived
      // - unread: is_read=false
      // - priority: order by priority_score desc
      const conditions = [`user_id = $1`, `archived_at is null`];
      const params = [userId];

      if (tab === "unread") conditions.push("is_read = false");

      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        conditions.push(
          `(title ILIKE $${params.length} OR message ILIKE $${params.length})`
        );
      }

      const where = conditions.length
        ? `where ${conditions.join(" and ")}`
        : "";

      const orderBy =
        tab === "priority"
          ? "order by priority_score desc, created_at desc"
          : "order by created_at desc";

      params.push(limit);
      params.push(offset);

      const { rows } = await client.query(
        `select * from notifications\n         ${where}\n         ${orderBy}\n         limit $${params.length - 1} offset $${params.length}`,
        params
      );
      return rows.map(mapRow);
    });
  },

  async findDuplicate({ userId, dedupeKey }) {
    if (!dedupeKey) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select * from notifications\n         where user_id = $1 and dedupe_key = $2 and archived_at is null\n         order by created_at desc\n         limit 1`,
        [userId, dedupeKey]
      );
      return rows[0] ? mapRow(rows[0]) : null;
    });
  },

  async create(note) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into notifications\n          (id, user_id, type, title, message, link, is_read, priority_class, priority_score, dedupe_key, snoozed_until, group_type, group_key, sender, event_id, image, actions, data, critical, archived_at)\n         values\n          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)\n         returning *`,
        [
          note.id,
          note.userId,
          note.type,
          note.title,
          note.message,
          note.link,
          note.isRead,
          note.priorityClass,
          note.priorityScore,
          note.dedupeKey,
          note.snoozedUntil,
          note.groupType,
          note.groupKey,
          note.sender,
          note.eventId,
          note.image,
          note.actions,
          note.data,
          note.critical,
          note.archivedAt ?? null,
        ]
      );
      return mapRow(rows[0]);
    });
  },

  async markAsRead(userId, id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "update notifications set is_read = true where user_id = $1 and id = $2",
        [userId, id]
      );
      return rowCount > 0;
    });
  },

  async markAsUnread(userId, id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "update notifications set is_read = false where user_id = $1 and id = $2",
        [userId, id]
      );
      return rowCount > 0;
    });
  },

  async markAllAsRead(userId) {
    return withDb(async (client) => {
      await client.query(
        "update notifications set is_read = true where user_id = $1 and is_read = false",
        [userId]
      );
    });
  },

  async remove(userId, id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "delete from notifications where user_id = $1 and id = $2",
        [userId, id]
      );
      return rowCount > 0;
    });
  },

  async clearAll(userId) {
    return withDb(async (client) => {
      await client.query("delete from notifications where user_id = $1", [
        userId,
      ]);
    });
  },

  async findByIds(userId, ids = []) {
    if (!Array.isArray(ids) || !ids.length) return [];
    return withDb(async (client) => {
      const safeIds = ids.filter(Boolean);
      if (!safeIds.length) return [];
      const placeholders = safeIds.map((_, i) => `$${i + 2}`).join(",");
      const { rows } = await client.query(
        `select * from notifications where user_id = $1 and id in (${placeholders}) and archived_at is null`,
        [userId, ...safeIds]
      );
      return rows.map(mapRow);
    });
  },

  async markUnread(userId, id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "update notifications set is_read = false where user_id = $1 and id = $2",
        [userId, id]
      );
      return rowCount > 0;
    });
  },

  async snooze(userId, id, snoozedUntil) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "update notifications set snoozed_until = $1 where user_id = $2 and id = $3",
        [snoozedUntil, userId, id]
      );
      return rowCount > 0;
    });
  },

  async archive(userId, ids = []) {
    if (!Array.isArray(ids) || !ids.length) return { archived: 0 };
    return withDb(async (client) => {
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(",");
      const { rowCount } = await client.query(
        `update notifications set archived_at = NOW() where user_id = $1 and id in (${placeholders}) and archived_at is null`,
        [userId, ...ids]
      );
      return { archived: rowCount };
    });
  },

  async bulk(userId, { ids = [], action } = {}) {
    if (!Array.isArray(ids) || !ids.length) return { updated: 0 };
    return withDb(async (client) => {
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(",");
      let sql = "";
      if (action === "mark_read") {
        sql = `update notifications set is_read = true where user_id = $1 and id in (${placeholders})`;
      } else if (action === "mark_unread") {
        sql = `update notifications set is_read = false where user_id = $1 and id in (${placeholders})`;
      } else if (action === "archive") {
        sql = `update notifications set archived_at = NOW() where user_id = $1 and id in (${placeholders}) and archived_at is null`;
      } else if (action === "clear_snooze") {
        sql = `update notifications set snoozed_until = NULL where user_id = $1 and id in (${placeholders})`;
      } else {
        throw new Error("Invalid bulk action");
      }
      const { rowCount } = await client.query(sql, [userId, ...ids]);
      return { updated: rowCount };
    });
  },

  async deleteExpired() {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "delete from notifications where expires_at <= now()"
      );
      return rowCount;
    });
  },
};
