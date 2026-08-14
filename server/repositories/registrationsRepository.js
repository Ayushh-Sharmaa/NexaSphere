import { withDb } from "./db.js";
import { HAS_SUPABASE } from "../storage/supabaseClient.js";

export const registrationsRepository = {
  async findByEventId(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM event_registrations WHERE event_id = $1 ORDER BY created_at ASC",
        [eventId]
      );
      return rows;
    });
  },

  async findByEventIds(eventIds) {
    if (!HAS_SUPABASE || !eventIds || eventIds.length === 0) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM event_registrations WHERE event_id = ANY($1) ORDER BY created_at ASC",
        [eventIds]
      );
      return rows;
    });
  },

  async findByEmailAndEvent(email, eventId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM event_registrations WHERE email = $1 AND event_id = $2 LIMIT 1",
        [email, eventId]
      );
      return rows[0] || null;
    });
  },

  async create({
    eventId,
    fullName,
    email,
    department,
    year,
    teamName,
    teamSize,
    customFields,
    waitlist,
    attendanceMode,
    seatCode,
  }) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO event_registrations (event_id, full_name, email, department, year, team_name, team_size, custom_fields, waitlist, status, attendance_mode, seat_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (event_id, email) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           department = EXCLUDED.department,
           year = EXCLUDED.year,
           team_name = EXCLUDED.team_name,
           team_size = EXCLUDED.team_size,
           custom_fields = EXCLUDED.custom_fields,
           waitlist = EXCLUDED.waitlist,
           status = EXCLUDED.status,
           attendance_mode = EXCLUDED.attendance_mode,
           seat_code = EXCLUDED.seat_code
         RETURNING *`,
        [
          eventId,
          fullName,
          email,
          department || null,
          year || null,
          teamName || null,
          teamSize || null,
          customFields ? JSON.stringify(customFields) : null,
          waitlist || false,
          waitlist ? "waitlisted" : "confirmed",
          attendanceMode || "in_person",
          seatCode || null,
        ]
      );
      return rows[0];
    });
  },

  async isSeatTaken(eventId, seatCode) {
    if (!HAS_SUPABASE || !seatCode) return false;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT 1 FROM event_registrations
         WHERE event_id = $1 AND seat_code = $2 AND status = 'confirmed'
         LIMIT 1`,
        [eventId, seatCode]
      );
      return rows.length > 0;
    });
  },

  async findOccupiedSeats(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT seat_code FROM event_registrations
         WHERE event_id = $1 AND seat_code IS NOT NULL AND status = 'confirmed'
         ORDER BY seat_code ASC`,
        [eventId]
      );
      return rows.map((row) => row.seat_code);
    });
  },

  async updateStatus(id, status) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        "UPDATE event_registrations SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );
      return rows[0] || null;
    });
  },

  async promoteFromWaitlist(eventId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_registrations SET status = 'pending_confirmation', waitlist = false, waitlist_status = 'pending'
         WHERE id = (
           SELECT id FROM event_registrations
           WHERE event_id = $1 AND waitlist = true AND status = 'waitlisted'
           ORDER BY created_at ASC LIMIT 1
         )
         RETURNING *`,
        [eventId]
      );
      return rows[0] || null;
    });
  },

  async markAttendance(id) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_registrations SET attended = true, attended_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      return rows[0] || null;
    });
  },

  async findByTicketToken(token) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM event_registrations WHERE ticket_token = $1 LIMIT 1",
        [token]
      );
      return rows[0] || null;
    });
  },

  async updateTicketToken(id, token) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        "UPDATE event_registrations SET ticket_token = $1 WHERE id = $2 RETURNING *",
        [token, id]
      );
      return rows[0];
    });
  },

  async getRegistrationStats(eventId) {
    if (!HAS_SUPABASE)
      return { total: 0, confirmed: 0, waitlisted: 0, attended: 0 };
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
           COUNT(*) FILTER (WHERE waitlist = true) AS waitlisted,
           COUNT(*) FILTER (WHERE attended = true) AS attended
         FROM event_registrations WHERE event_id = $1`,
        [eventId]
      );
      return rows[0] || { total: 0, confirmed: 0, waitlisted: 0, attended: 0 };
    });
  },

  async getDepartmentBreakdown(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT department, COUNT(*) AS count
         FROM event_registrations WHERE event_id = $1 AND department IS NOT NULL
         GROUP BY department ORDER BY count DESC`,
        [eventId]
      );
      return rows;
    });
  },

  async getYearBreakdown(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT year, COUNT(*) AS count
         FROM event_registrations WHERE event_id = $1 AND year IS NOT NULL
         GROUP BY year ORDER BY year`,
        [eventId]
      );
      return rows;
    });
  },

  async getWaitlist(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM event_registrations
         WHERE event_id = $1 AND waitlist = true AND status = 'waitlisted'
         ORDER BY created_at ASC`,
        [eventId]
      );
      return rows;
    });
  },
  async getPosition(eventId, email) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT position FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS position
           FROM event_registrations
           WHERE event_id = $1 AND waitlist = true AND status = 'waitlisted'
         ) ranked
         WHERE id = (
           SELECT id FROM event_registrations
           WHERE event_id = $1 AND email = $2 AND waitlist = true AND status = 'waitlisted'
           LIMIT 1
         )`,
        [eventId, email]
      );
      return rows[0]?.position ? Number(rows[0].position) : null;
    });
  },

  async getWaitlistCount(eventId) {
    if (!HAS_SUPABASE) return 0;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT COUNT(*) AS count FROM event_registrations
         WHERE event_id = $1 AND waitlist = true AND status = 'waitlisted'`,
        [eventId]
      );
      return Number(rows[0]?.count || 0);
    });
  },

  async removeFromWaitlist(eventId, email) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_registrations SET status = 'cancelled'
         WHERE event_id = $1 AND email = $2 AND waitlist = true AND status = 'waitlisted'
         RETURNING *`,
        [eventId, email]
      );
      return rows[0] || null;
    });
  },

  async cancelConfirmedRegistration(eventId, email) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_registrations SET status = 'cancelled'
         WHERE event_id = $1 AND email = $2 AND status = 'confirmed'
         RETURNING *`,
        [eventId, email]
      );
      return rows[0] || null;
    });
  },
  async countByEmail(email) {
    if (!HAS_SUPABASE) return 0;

    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS count
       FROM event_registrations
       WHERE email = $1`,
        [email]
      );

      return rows[0]?.count || 0;
    });
  },
};
