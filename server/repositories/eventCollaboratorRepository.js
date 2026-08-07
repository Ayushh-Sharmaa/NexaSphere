import { withDb } from './db.js';

export const eventCollaboratorRepository = {
  async inviteCollaborator({ event_id, email, role, permissions }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO event_collaborators (event_id, email, role, permissions, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
         ON CONFLICT (event_id, email) DO UPDATE SET
           role = EXCLUDED.role,
           permissions = EXCLUDED.permissions,
           updated_at = NOW()
         RETURNING *`,
        [
          event_id,
          email,
          role || 'co-organizer',
          permissions ||
            '{"can_edit": true, "can_delete": false, "can_view_attendance": true, "can_message": true}',
        ]
      );
      return rows[0];
    });
  },

  async getCollaboratorsForEvent(event_id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM event_collaborators WHERE event_id = $1 ORDER BY created_at DESC',
        [event_id]
      );
      return rows;
    });
  },

  async getCollaborator(event_id, email) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM event_collaborators WHERE event_id = $1 AND email = $2 LIMIT 1',
        [event_id, email]
      );
      return rows[0] || null;
    });
  },

  async acceptInvitation(event_id, email) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_collaborators SET status = 'accepted', updated_at = NOW()
         WHERE event_id = $1 AND email = $2 RETURNING *`,
        [event_id, email]
      );
      return rows[0] || null;
    });
  },

  async removeCollaborator(event_id, email) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `DELETE FROM event_collaborators WHERE event_id = $1 AND email = $2 RETURNING *`,
        [event_id, email]
      );
      return rows[0] || null;
    });
  },

  async addMessage(event_id, sender_email, message) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO event_collaborator_messages (event_id, sender_email, message, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [event_id, sender_email, message]
      );
      return rows[0];
    });
  },

  async getMessages(event_id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM event_collaborator_messages WHERE event_id = $1 ORDER BY created_at ASC`,
        [event_id]
      );
      return rows;
    });
  },
};
