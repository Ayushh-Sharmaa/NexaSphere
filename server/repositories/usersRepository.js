import { withDb } from "./db.js";

function buildUserListQuery({
  includeEmail = false,
  page = 1,
  limit = 20,
  role,
  search,
}) {
  const selectColumns = [
    "id",
    "username",
    "display_name",
    "avatar_url",
    "bio",
    "phone_number",
    "created_at as joined_at",
  ];

  if (includeEmail) {
    selectColumns.push("email", "admin_roles", "last_login");
  }

  const params = [limit, (page - 1) * limit];
  const conditions = [];

  if (role) {
    params.push(role);
    conditions.push(
      `(role = $${params.length} OR admin_roles = $${params.length})`
    );
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(username ILIKE $${params.length} OR display_name ILIKE $${params.length})`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return {
    text: `
      SELECT
        ${selectColumns.join(",\n        ")}
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1
      OFFSET $2
    `,
    values: params,
  };
}

export const usersRepository = {
  async getAllPublicUsers({ page = 1, limit = 20, role, search } = {}) {
    return withDb(async (client) => {
      const { text, values } = buildUserListQuery({
        page,
        limit,
        role,
        search,
      });
      const { rows } = await client.query(text, values);
      return rows;
    });
  },

  async getAllUsersAdmin({ page = 1, limit = 20, role, search } = {}) {
    return withDb(async (client) => {
      const { text, values } = buildUserListQuery({
        includeEmail: true,
        page,
        limit,
        role,
        search,
      });
      const { rows } = await client.query(text, values);
      return rows;
    });
  },

  async createUser({ username, display_name, email, role }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (username, display_name, email, admin_roles, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, username, display_name, email, admin_roles, created_at as joined_at`,
        [username, display_name, email, role || "member"]
      );
      return rows[0];
    });
  },

  async getUserById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT id, username, display_name, avatar_url, bio, phone_number, created_at as joined_at, email, admin_roles FROM users WHERE id = $1 LIMIT 1",
        [id]
      );
      return rows[0] || null;
    });
  },

  async getUserByUsername(username) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT id, username, display_name, avatar_url, email FROM users WHERE username = $1 LIMIT 1",
        [username]
      );
      return rows[0] || null;
    });
  },

  async getUserByEmail(email) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT id, username, display_name, email, admin_roles, created_at FROM users WHERE email = $1",
        [email]
      );
      return rows[0] || null;
    });
  },

  async updateUser(id, updates) {
    return withDb(async (client) => {
      let i = 1;
      const fields = [];
      const values = [];

      if (updates.display_name !== undefined) {
        fields.push(`display_name = $${i++}`);
        values.push(updates.display_name);
      }
      if (updates.email !== undefined) {
        fields.push(`email = $${i++}`);
        values.push(updates.email);
      }
      if (updates.phone_number !== undefined) {
        fields.push(`phone_number = $${i++}`);
        values.push(updates.phone_number);
      }
      if (updates.admin_roles !== undefined) {
        fields.push(`admin_roles = $${i++}`);
        values.push(updates.admin_roles);
      }

      if (fields.length === 0) return null;
      values.push(id);

      const queryText = `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING id, username, display_name, email, phone_number, admin_roles, created_at as joined_at`;
      const { rows } = await client.query(queryText, values);
      return rows[0] || null;
    });
  },

  async deactivateUser(id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE users SET admin_roles = 'deactivated' WHERE id = $1
         RETURNING id, username, display_name, email, admin_roles`,
        [id]
      );
      return rows[0] || null;
    });
  },
};
