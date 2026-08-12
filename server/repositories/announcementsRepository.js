import { withDb } from './db.js';

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    pinned: row.pinned,
    status: row.status,
    scheduledFor: row.scheduled_for,
    expiresAt: row.expires_at,
    targetRole: row.target_role,
    targetStage: row.target_stage,
    targetDepartment: row.target_department,
    targetGraduationYear: row.target_graduation_year,
    priority: row.priority,
    ctaText: row.cta_text,
    ctaUrl: row.cta_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const announcementsRepository = {
  async list({ page = 1, limit = 50 } = {}) {
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const { rows } = await client.query(
        'SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      const countResult = await client.query('SELECT COUNT(*)::int AS total FROM announcements');
      return {
        announcements: rows.map(mapRow),
        total: countResult.rows[0]?.total ?? 0,
      };
    });
  },

  async listAll() {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC'
      );
      return rows.map(mapRow);
    });
  },

  async listActiveForUser(user = {}) {
    return withDb(async (client) => {
      // Find all announcements that are published (either directly, or scheduled and already due) and not expired
      const { rows } = await client.query(
        `SELECT * FROM announcements 
         WHERE status = 'published' 
           AND (scheduled_for IS NULL OR scheduled_for <= NOW())
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY pinned DESC, created_at DESC`
      );

      return rows
        .filter((ann) => {
          if (ann.target_role && ann.target_role !== 'all' && ann.target_role !== user.role) {
            return false;
          }
          if (ann.target_stage && ann.target_stage !== 'all' && ann.target_stage !== user.stage) {
            return false;
          }
          if (
            ann.target_department &&
            ann.target_department !== 'all' &&
            ann.target_department !== user.department
          ) {
            return false;
          }
          if (
            ann.target_graduation_year &&
            user.graduationYear != null &&
            Number(ann.target_graduation_year) !== Number(user.graduationYear)
          ) {
            return false;
          }
          return true;
        })
        .map(mapRow);
    });
  },

  async getById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM announcements WHERE id = $1', [id]);
      if (!rows.length) return null;
      return mapRow(rows[0]);
    });
  },

  async create(data) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO announcements (
          title, content, category, pinned, status, scheduled_for, expires_at,
          target_role, target_stage, target_department, target_graduation_year,
          priority, cta_text, cta_url
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          data.title,
          data.content,
          data.category || 'general',
          data.pinned || false,
          data.status || 'published',
          data.scheduledFor || null,
          data.expiresAt || null,
          data.targetRole || 'all',
          data.targetStage || 'all',
          data.targetDepartment || 'all',
          data.targetGraduationYear || null,
          data.priority || 'info',
          data.ctaText || null,
          data.ctaUrl || null,
        ]
      );
      return mapRow(rows[0]);
    });
  },

  async update(id, data) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE announcements
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             category = COALESCE($3, category),
             pinned = COALESCE($4, pinned),
             status = COALESCE($5, status),
             scheduled_for = $6,
             expires_at = $7,
             target_role = COALESCE($8, target_role),
             target_stage = COALESCE($9, target_stage),
             target_department = COALESCE($10, target_department),
             target_graduation_year = $11,
             priority = COALESCE($12, priority),
             cta_text = $13,
             cta_url = $14,
             updated_at = NOW()
         WHERE id = $15
         RETURNING *`,
        [
          data.title,
          data.content,
          data.category,
          data.pinned,
          data.status,
          data.scheduledFor === undefined ? null : data.scheduledFor,
          data.expiresAt === undefined ? null : data.expiresAt,
          data.targetRole,
          data.targetStage,
          data.targetDepartment,
          data.targetGraduationYear === undefined ? null : data.targetGraduationYear,
          data.priority,
          data.ctaText === undefined ? null : data.ctaText,
          data.ctaUrl === undefined ? null : data.ctaUrl,
          id,
        ]
      );
      if (!rows.length) return null;
      return mapRow(rows[0]);
    });
  },

  async delete(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('DELETE FROM announcements WHERE id = $1', [id]);
      return rowCount > 0;
    });
  },

  async publishScheduled() {
    return withDb(async (client) => {
      // Find all announcements that are scheduled and scheduled_for <= NOW(), then update status to 'published'
      const { rows } = await client.query(
        `UPDATE announcements
         SET status = 'published', updated_at = NOW()
         WHERE status = 'scheduled' AND scheduled_for <= NOW()
         RETURNING *`
      );
      return rows.map(mapRow);
    });
  },
};
