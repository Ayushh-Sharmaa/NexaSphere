import { dbPool, supabaseAdmin } from "../config/supabase.js";

export const eventsService = {
  async listEvents({ status = "upcoming", page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    if (dbPool) {
      const conditions = [];
      const params = [];

      if (status && status !== "all") {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const countRes = await dbPool.query(
        `SELECT COUNT(*) as total FROM events ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

      params.push(limit, offset);
      const dataRes = await dbPool.query(
        `SELECT e.*, 
                COALESCE((SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id), 0) as registration_count
         FROM events e
         ${whereClause}
         ORDER BY e.starts_at ASC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return {
        events: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    return { events: [], pagination: { page, limit, total: 0, totalPages: 1 } };
  },

  async getEventById(id) {
    if (dbPool) {
      const res = await dbPool.query(
        `SELECT e.*, 
                COALESCE((SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id), 0) as registration_count
         FROM events e
         WHERE e.id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    return null;
  },

  async registerForEvent(eventId, clerkUserId, { fullName, email }) {
    if (!clerkUserId) throw new Error("clerkUserId is required");

    if (dbPool) {
      const client = await dbPool.connect();
      try {
        await client.query("BEGIN");

        // Check if already registered
        const existing = await client.query(
          `SELECT id FROM event_registrations WHERE event_id = $1 AND clerk_user_id = $2`,
          [eventId, clerkUserId]
        );
        if (existing.rows.length) {
          await client.query("ROLLBACK");
          const error = new Error("You are already registered for this event.");
          error.statusCode = 409;
          throw error;
        }

        // Lock event row for capacity check
        const eventRes = await client.query(
          `SELECT capacity, name FROM events WHERE id = $1 FOR UPDATE`,
          [eventId]
        );
        if (!eventRes.rows.length) {
          await client.query("ROLLBACK");
          const error = new Error("Event not found.");
          error.statusCode = 404;
          throw error;
        }

        const event = eventRes.rows[0];
        const countRes = await client.query(
          `SELECT COUNT(*) as count FROM event_registrations WHERE event_id = $1`,
          [eventId]
        );
        const registeredCount = parseInt(countRes.rows[0]?.count || 0, 10);

        if (event.capacity && registeredCount >= event.capacity) {
          await client.query("ROLLBACK");
          const error = new Error("Event capacity has been reached.");
          error.statusCode = 400;
          throw error;
        }

        const regRes = await client.query(
          `INSERT INTO event_registrations (event_id, clerk_user_id, full_name, email)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [eventId, clerkUserId, fullName, email]
        );

        // Add notification
        await client.query(
          `INSERT INTO notifications (clerk_user_id, type, title, message, data)
           VALUES ($1, 'event_registered', $2, $3, $4)`,
          [
            clerkUserId,
            `Registered for ${event.name}`,
            `Your seat has been confirmed for ${event.name}.`,
            JSON.stringify({ eventId, registrationId: regRes.rows[0].id }),
          ]
        );

        await client.query("COMMIT");
        return regRes.rows[0];
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    return null;
  },

  async getUserRegistrations(clerkUserId) {
    if (dbPool) {
      const res = await dbPool.query(
        `SELECT er.*, e.name as event_name, e.starts_at, e.date_text, e.location, e.icon
         FROM event_registrations er
         JOIN events e ON er.event_id = e.id
         WHERE er.clerk_user_id = $1
         ORDER BY e.starts_at ASC`,
        [clerkUserId]
      );
      return res.rows;
    }
    return [];
  },
};
