/**
 * coreTeamApplicationsRepository.js
 * Database operations for core team applications.
 * Uses the same Supabase/pg pattern as other repositories.
 */
import { withDb } from './db.js';

const HAS_SUPABASE = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

export const coreTeamApplicationsRepository = {
  /**
   * Create a new application.
   */
  async create({ studentId, name, email, year, branch, section, whatsapp, reason }) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const result = await client.query(
        `INSERT INTO core_team_applications
          (student_id, name, email, year, branch, section, whatsapp, reason, status, applied_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
         RETURNING *`,
        [studentId, name, email, year, branch, section, whatsapp, reason]
      );
      return result.rows[0] ?? null;
    });
  },

  /**
   * List all applications, optionally filtered by status.
   */
  async list(status = null) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const query = status
        ? `SELECT * FROM core_team_applications WHERE status = $1 ORDER BY applied_at DESC`
        : `SELECT * FROM core_team_applications ORDER BY applied_at DESC`;
      const params = status ? [status] : [];
      const result = await client.query(query, params);
      return result.rows;
    });
  },

  /**
   * Find application by ID.
   */
  async findById(id) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const result = await client.query(`SELECT * FROM core_team_applications WHERE id = $1`, [id]);
      return result.rows[0] ?? null;
    });
  },

  /**
   * Check if a student already has a pending or approved application.
   */
  async findByStudentId(studentId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const result = await client.query(
        `SELECT * FROM core_team_applications
         WHERE student_id = $1 AND status IN ('pending', 'approved')
         ORDER BY applied_at DESC LIMIT 1`,
        [studentId]
      );
      return result.rows[0] ?? null;
    });
  },

  /**
   * Update application status.
   */
  async updateStatus(id, status, reviewedBy = null, reviewNote = null) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const result = await client.query(
        `UPDATE core_team_applications
         SET status = $1, reviewed_by = $2, review_note = $3, reviewed_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, reviewedBy, reviewNote, id]
      );
      return result.rows[0] ?? null;
    });
  },
};
