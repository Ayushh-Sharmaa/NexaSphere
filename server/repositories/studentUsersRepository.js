import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { withDb } from './db.js';
import { HAS_SUPABASE } from '../storage/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SLACK_STUDENTS_FILE = path.join(__dirname, '..', 'data', 'student_users_slack.json');

async function ensureLocalFile() {
  const dir = path.dirname(SLACK_STUDENTS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(SLACK_STUDENTS_FILE);
  } catch {
    await fs.writeFile(SLACK_STUDENTS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readLocalSlackSettings() {
  await ensureLocalFile();
  const raw = await fs.readFile(SLACK_STUDENTS_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeLocalSlackSettings(data) {
  await ensureLocalFile();
  await fs.writeFile(SLACK_STUDENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}


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
      await client.query(`
        ALTER TABLE student_users ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT NULL;
      `);
      await client.query(`
        ALTER TABLE student_users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;
      `);
      await client.query(`
        ALTER TABLE student_users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS xp_transactions (
          id SERIAL PRIMARY KEY,
          student_user_id INTEGER REFERENCES student_users(id) ON DELETE CASCADE,
          amount INTEGER NOT NULL,
          action VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(student_user_id)
        ALTER TABLE student_users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) DEFAULT NULL;
      `);
    });
  },

  async findByProvider(provider, providerId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM student_users WHERE provider = $1 AND provider_id = $2 LIMIT 1',
        [provider, providerId]
      );
      return rows[0] || null;
    });
  },

  async findByEmail(email) {
    if (!HAS_SUPABASE) {
      const localSettings = await readLocalSlackSettings();
      const settings = localSettings[email] || {};
      return {
        email,
        full_name: 'Local Student',
        slack_user_id: settings.slackUserId || null,
        slack_dm_reminders: settings.slackDmReminders || false,
      };
    }
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM student_users WHERE email = $1 LIMIT 1', [
        email,
      ]);
      return rows[0] || null;
    });
  },

  async findById(id) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM student_users WHERE id = $1 LIMIT 1', [
        id,
      ]);
      return rows[0] || null;
    });
  },

  async upsertFromOAuth({ provider, providerId, email, fullName, avatarUrl }) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const check = await client.query(
        'SELECT id FROM student_users WHERE provider = $1 AND provider_id = $2 LIMIT 1',
        [provider, providerId]
      );
      const isNewUser = check.rows.length === 0;

      const { rows } = await client.query(
        `INSERT INTO student_users (provider, provider_id, email, full_name, avatar_url, last_login_at, updated_at, xp, level, badges)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0, 1, '[]'::jsonb)
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
          const { trackRegistration } = await import('../middleware/performanceMonitor.js');
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
        'UPDATE student_users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [role, id]
      );
      return rows[0] || null;
    });
  },

  async saveRecoveryCode(email, hashedCode) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS recovery_codes (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          code_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(
        `INSERT INTO recovery_codes (email, code_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [email, hashedCode]
      );
      return true;
    });
  },

  async getRecoveryCode(email) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT id, code_hash, expires_at
         FROM recovery_codes
         WHERE email = $1 AND used = false AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );
      return rows[0] || null;
    });
  },

  async markRecoveryCodeUsed(id) {
    if (!HAS_SUPABASE) return;
    return withDb(async (client) => {
      await client.query('UPDATE recovery_codes SET used = true WHERE id = $1', [id]);
    });
  },

  async awardXP(userId, amount, action = 'generic', description = null) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {

      const userRes = await client.query(
        'SELECT xp, level, badges FROM student_users WHERE id = $1',
        [userId]
      );
      if (userRes.rows.length === 0) return null;

      const currentXP = userRes.rows[0].xp || 0;
      const newXP = currentXP + amount;

      let newLevel = 1;
      if (newXP >= 10000) newLevel = 5;
      else if (newXP >= 4000) newLevel = 4;
      else if (newXP >= 1500) newLevel = 3;
      else if (newXP >= 500) newLevel = 2;

      let badges = Array.isArray(userRes.rows[0].badges) ? userRes.rows[0].badges : [];
      if (newLevel >= 2 && !badges.includes('explorer')) badges.push('explorer');
      if (newLevel >= 3 && !badges.includes('contributor')) badges.push('contributor');
      if (newLevel >= 4 && !badges.includes('expert')) badges.push('expert');
      if (newLevel >= 5 && !badges.includes('legend')) badges.push('legend');

      await client.query(
        `INSERT INTO xp_transactions (student_user_id, amount, action, description)
         VALUES ($1, $2, $3, $4)`,
        [userId, amount, action, description]
      );

      const { rows } = await client.query(
        `UPDATE student_users
         SET xp = $1, level = $2, badges = $3::jsonb, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [newXP, newLevel, JSON.stringify(badges), userId]
      );
      return rows[0];
    });
  },

  async getXPHistory(userId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT id, amount, action, description, created_at
         FROM xp_transactions
         WHERE student_user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    });
  },

  async getLeaderboard(filter = 'all') {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT id, full_name as name, email, avatar_url, xp, level, badges
         FROM student_users
         ORDER BY xp DESC, level DESC
         LIMIT 50`
      );
      return rows;
    });
  },

  async updateTheme(id, theme) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'UPDATE student_users SET theme = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [theme, id]
      );
      return rows[0] || null;
    });
  },

  async updateProfile(id, updates) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const setClauses = [];
      const values = [];
      let idx = 1;

      if (updates.full_name !== undefined) {
        setClauses.push(`full_name = $${idx++}`);
        values.push(updates.full_name);
      }
      if (updates.bio !== undefined) {
        setClauses.push(`bio = $${idx++}`);
        values.push(updates.bio);
      }
      if (updates.social_links !== undefined) {
        setClauses.push(`social_links = $${idx++}::jsonb`);
        values.push(
          typeof updates.social_links === 'string'
            ? updates.social_links
            : JSON.stringify(updates.social_links)
        );
      }
      if (updates.phone_number !== undefined) {
        setClauses.push(`phone_number = $${idx++}`);
        values.push(updates.phone_number);
      }

      if (setClauses.length === 0) {
        const { rows } = await client.query('SELECT * FROM student_users WHERE id = $1 LIMIT 1', [
          id,
        ]);
        return rows[0] || null;
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const { rows } = await client.query(
        `UPDATE student_users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows[0] || null;
    });
  },

  async listAll() {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM student_users ORDER BY last_login_at DESC'
      );
      return rows;
    });
  },

  async updateSlackSettings(email, { slackUserId, slackDmReminders }) {
    if (!HAS_SUPABASE) {
      const localSettings = await readLocalSlackSettings();
      localSettings[email] = {
        slackUserId,
        slackDmReminders: Boolean(slackDmReminders),
      };
      await writeLocalSlackSettings(localSettings);
      return {
        email,
        slack_user_id: slackUserId,
        slack_dm_reminders: Boolean(slackDmReminders),
      };
    }
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE student_users
         SET slack_user_id = $1, slack_dm_reminders = $2, updated_at = NOW()
         WHERE email = $3
         RETURNING *`,
        [slackUserId, Boolean(slackDmReminders), email]
      );
      return rows[0] || null;
    });
  },
};
