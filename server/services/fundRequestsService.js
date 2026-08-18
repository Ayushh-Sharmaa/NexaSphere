import { dbPool } from "../config/supabase.js";

export const fundRequestsService = {
  async submitRequest(
    clerkUserId,
    { teamId, title, description, amountRequested, purpose, documentUrls = [] }
  ) {
    if (!clerkUserId) throw new Error("clerkUserId is required");

    if (dbPool) {
      const res = await dbPool.query(
        `INSERT INTO fund_requests (clerk_user_id, team_id, title, description, amount_requested, purpose, document_urls, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [
          clerkUserId,
          teamId || null,
          title,
          description,
          amountRequested,
          purpose,
          JSON.stringify(documentUrls),
        ]
      );
      return res.rows[0];
    }
    return null;
  },

  async getUserRequests(clerkUserId) {
    if (dbPool) {
      const res = await dbPool.query(
        `SELECT fr.*, t.name as team_name
         FROM fund_requests fr
         LEFT JOIN teams t ON fr.team_id = t.id
         WHERE fr.clerk_user_id = $1
         ORDER BY fr.created_at DESC`,
        [clerkUserId]
      );
      return res.rows;
    }
    return [];
  },

  async listAdminRequests({ status, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    if (dbPool) {
      const conditions = [];
      const params = [];

      if (status) {
        params.push(status);
        conditions.push(`fr.status = $${params.length}`);
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const countRes = await dbPool.query(
        `SELECT COUNT(*) as total FROM fund_requests fr ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

      params.push(limit, offset);
      const dataRes = await dbPool.query(
        `SELECT fr.*, p.full_name, p.email, p.roll_number, p.branch, t.name as team_name
         FROM fund_requests fr
         JOIN profiles p ON fr.clerk_user_id = p.clerk_user_id
         LEFT JOIN teams t ON fr.team_id = t.id
         ${whereClause}
         ORDER BY fr.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return {
        requests: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }
    return {
      requests: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
    };
  },

  async updateRequestStatus(id, { status, notes, adminUserId }) {
    if (dbPool) {
      const res = await dbPool.query(
        `UPDATE fund_requests
         SET status = $1, reviewer_notes = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, notes || null, id]
      );
      return res.rows[0];
    }
    return null;
  },
};
