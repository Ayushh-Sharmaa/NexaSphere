import { withDb } from "./db.js";
import { HAS_SUPABASE } from "../storage/supabaseClient.js";

export const studentUsersRepository = {
  async ensureSchema() {
    if (!HAS_SUPABASE) return;
    return withDb(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS student_users (
          id SERIAL PRIMARY KEY,
          provider VARCHAR(40) NOT NULL,
          provider_id VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          avatar_url VARCHAR(2048),
          role VARCHAR(40) NOT NULL DEFAULT 'student',
          scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
          last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(provider, provider_id)
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_student_users_email ON student_users(email)
      `);
    });
  },

  async findByProvider(provider, providerId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM student_users WHERE provider = $1 AND provider_id = $2 LIMIT 1",
        [provider, providerId]
      );
      return rows[0] || null;
    });
  },

  async findByEmail(email) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM student_users WHERE email = $1 LIMIT 1",
        [email]
      );
      return rows[0] || null;
    });
  },

  async upsertFromOAuth({ provider, providerId, email, fullName, avatarUrl }) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const check = await client.query(
        "SELECT id FROM student_users WHERE provider = $1 AND provider_id = $2 LIMIT 1",
        [provider, providerId]
      );
      const isNewUser = check.rows.length === 0;

      const { rows } = await client.query(
        `INSERT INTO student_users (provider, provider_id, email, full_name, avatar_url, last_login_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (provider, provider_id) DO UPDATE SET
           email = EXCLUDED.email,
           full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), student_users.full_name),
           avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), student_users.avatar_url),
           last_login_at = NOW(),
           updated_at = NOW()
         RETURNING *`,
        [provider, providerId, email, fullName || null, avatarUrl || null]
      );

      if (isNewUser && rows[0]) {
        try {
          const { trackRegistration } =
            await import("../middleware/performanceMonitor.js");
          trackRegistration();
        } catch (e) {
          // ignore
        }
      }

      return rows[0];
    });
  },

  async updateRole(id, role) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        "UPDATE student_users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [role, id]
      );
      return rows[0] || null;
    });
  },

  async listAll() {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM student_users ORDER BY last_login_at DESC"
      );
      return rows;
    });
  },
};
