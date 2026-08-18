import { dbPool, supabaseAdmin } from "../config/supabase.js";
import {
  isValidActivityKey,
  ACTIVITY_CATEGORIES,
} from "../config/activityTypes.js";

export const activitiesService = {
  getCategories() {
    return ACTIVITY_CATEGORIES;
  },

  async listActivities({
    type,
    status = "published",
    search,
    page = 1,
    limit = 20,
  }) {
    const offset = (page - 1) * limit;

    if (dbPool) {
      const conditions = [];
      const params = [];

      if (type && isValidActivityKey(type)) {
        params.push(type.toLowerCase());
        conditions.push(`activity_type = $${params.length}`);
      }
      if (status && status !== "all") {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(
          `(title ILIKE $${params.length} OR description ILIKE $${params.length} OR tagline ILIKE $${params.length})`
        );
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const countRes = await dbPool.query(
        `SELECT COUNT(*) as total FROM activities ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

      params.push(limit, offset);
      const dataRes = await dbPool.query(
        `SELECT * FROM activities ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return {
        activities: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    return {
      activities: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
    };
  },

  async getActivityById(id) {
    if (dbPool) {
      const res = await dbPool.query(`SELECT * FROM activities WHERE id = $1`, [
        id,
      ]);
      return res.rows[0] || null;
    }
    return null;
  },

  async createActivity({
    id,
    activityType,
    title,
    tagline,
    description,
    dateText,
    location,
    coverImage,
    createdBy,
  }) {
    const cleanType = String(activityType || "").toLowerCase();
    if (!isValidActivityKey(cleanType)) {
      throw new Error(
        `Invalid activity type '${activityType}'. Must be one of the 8 canonical activity types.`
      );
    }

    const activityId = id || `act-${cleanType}-${Date.now()}`;

    if (dbPool) {
      const res = await dbPool.query(
        `INSERT INTO activities (id, activity_type, title, tagline, description, date_text, location, cover_image, created_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published')
         RETURNING *`,
        [
          activityId,
          cleanType,
          title,
          tagline || null,
          description,
          dateText || null,
          location || "GL Bajaj Campus",
          coverImage || null,
          createdBy || null,
        ]
      );
      return res.rows[0];
    }
    return null;
  },

  async updateActivity(id, updates) {
    if (updates.activityType && !isValidActivityKey(updates.activityType)) {
      throw new Error(`Invalid activity type '${updates.activityType}'.`);
    }

    if (dbPool) {
      const current = await this.getActivityById(id);
      if (!current) throw new Error("Activity not found.");

      const cleanType = updates.activityType
        ? updates.activityType.toLowerCase()
        : current.activity_type;

      const res = await dbPool.query(
        `UPDATE activities
         SET activity_type = COALESCE($1, activity_type),
             title = COALESCE($2, title),
             tagline = COALESCE($3, tagline),
             description = COALESCE($4, description),
             date_text = COALESCE($5, date_text),
             location = COALESCE($6, location),
             cover_image = COALESCE($7, cover_image),
             status = COALESCE($8, status),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          cleanType,
          updates.title || null,
          updates.tagline || null,
          updates.description || null,
          updates.dateText || null,
          updates.location || null,
          updates.coverImage || null,
          updates.status || null,
          id,
        ]
      );
      return res.rows[0];
    }
    return null;
  },

  async setActivityStatus(id, status) {
    if (!["draft", "published", "archived"].includes(status)) {
      throw new Error(
        "Invalid status. Must be 'draft', 'published', or 'archived'."
      );
    }
    if (dbPool) {
      const res = await dbPool.query(
        `UPDATE activities SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );
      return res.rows[0];
    }
    return null;
  },
};
