import { dbPool } from "../config/supabase.js";

export const teamsService = {
  async listTeams({ search, topic, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    if (dbPool) {
      const conditions = [];
      const params = [];

      if (topic) {
        params.push(topic);
        conditions.push(`t.topic = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(
          `(t.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`
        );
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const countRes = await dbPool.query(
        `SELECT COUNT(*) as total FROM teams t ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

      params.push(limit, offset);
      const dataRes = await dbPool.query(
        `SELECT t.*, p.full_name as leader_name, p.avatar_url as leader_avatar,
                (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count
         FROM teams t
         JOIN profiles p ON t.leader_clerk_id = p.clerk_user_id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return {
        teams: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    return { teams: [], pagination: { page, limit, total: 0, totalPages: 1 } };
  },

  async createTeam(clerkUserId, { name, description, topic, maxMembers = 4 }) {
    if (!clerkUserId) throw new Error("clerkUserId is required");

    if (dbPool) {
      const client = await dbPool.connect();
      try {
        await client.query("BEGIN");
        const teamRes = await client.query(
          `INSERT INTO teams (name, description, topic, leader_clerk_id, max_members)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [name, description || null, topic || null, clerkUserId, maxMembers]
        );

        const newTeam = teamRes.rows[0];

        // Add leader as first member
        await client.query(
          `INSERT INTO team_members (team_id, clerk_user_id, role)
           VALUES ($1, $2, 'leader')`,
          [newTeam.id, clerkUserId]
        );

        await client.query("COMMIT");
        return newTeam;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
    return null;
  },

  async requestJoinTeam(teamId, clerkUserId, message) {
    if (!clerkUserId) throw new Error("clerkUserId is required");

    if (dbPool) {
      const res = await dbPool.query(
        `INSERT INTO team_join_requests (team_id, clerk_user_id, message, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (team_id, clerk_user_id, status) DO NOTHING
         RETURNING *`,
        [teamId, clerkUserId, message || null]
      );
      return res.rows[0] || null;
    }
    return null;
  },
};
