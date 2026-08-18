import { dbPool } from "../config/supabase.js";

export const mentorsService = {
  async listMentors({ search, expertise, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    if (dbPool) {
      const conditions = ["is_active = true"];
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        conditions.push(
          `(name ILIKE $${params.length} OR company ILIKE $${params.length} OR bio ILIKE $${params.length})`
        );
      }
      if (expertise) {
        params.push(expertise);
        conditions.push(`expertise ? $${params.length}`);
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const countRes = await dbPool.query(
        `SELECT COUNT(*) as total FROM mentors ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

      params.push(limit, offset);
      const dataRes = await dbPool.query(
        `SELECT * FROM mentors ${whereClause} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return {
        mentors: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }
    return {
      mentors: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
    };
  },
};
