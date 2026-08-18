import { dbPool, supabaseAdmin } from "../config/supabase.js";

export async function getNotifications(clerkUserId, options = {}) {
  const { unreadOnly = false, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  if (dbPool) {
    const conditions = ["clerk_user_id = $1"];
    const params = [clerkUserId];

    if (unreadOnly) {
      conditions.push("read_at IS NULL");
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countRes = await dbPool.query(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    params.push(limit, offset);
    const dataRes = await dbPool.query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return dataRes.rows;
  }
  return [];
}

export async function addNotification(payload = {}) {
  const {
    userId,
    clerkUserId = userId,
    title,
    message,
    type = "info",
    data = {},
  } = payload;

  if (dbPool) {
    const res = await dbPool.query(
      `INSERT INTO notifications (clerk_user_id, title, message, type, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [clerkUserId, title, message, type, JSON.stringify(data)]
    );
    return res.rows[0];
  }
  return null;
}

export async function markAsRead(id, clerkUserId) {
  if (dbPool) {
    const res = await dbPool.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND clerk_user_id = $2 RETURNING *`,
      [id, clerkUserId]
    );
    return res.rows[0];
  }
  return null;
}

export async function markAllAsRead(clerkUserId) {
  if (dbPool) {
    await dbPool.query(
      `UPDATE notifications SET read_at = NOW() WHERE clerk_user_id = $1 AND read_at IS NULL`,
      [clerkUserId]
    );
    return { success: true };
  }
  return { success: false };
}

export async function clearAll(clerkUserId) {
  if (dbPool) {
    await dbPool.query(`DELETE FROM notifications WHERE clerk_user_id = $1`, [
      clerkUserId,
    ]);
    return { success: true };
  }
  return { success: false };
}

export async function removeNotification(id, clerkUserId) {
  if (dbPool) {
    await dbPool.query(
      `DELETE FROM notifications WHERE id = $1 AND clerk_user_id = $2`,
      [id, clerkUserId]
    );
    return { success: true };
  }
  return { success: false };
}

export const notificationsService = {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
  removeNotification,
};

export default notificationsService;
