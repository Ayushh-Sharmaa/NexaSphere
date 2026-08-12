import { withDb } from './db.js';

export const emailTemplateRepository = {
  async getAll() {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM email_templates ORDER BY name ASC');
      return rows;
    });
  },

  async getByName(name) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM email_templates WHERE name = $1 LIMIT 1', [
        name,
      ]);
      return rows[0] || null;
    });
  },

  async upsertTemplate({ name, subject, body }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO email_templates (name, subject, body, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET
           subject = EXCLUDED.subject,
           body = EXCLUDED.body,
           updated_at = NOW()
         RETURNING *`,
        [name, subject, body]
      );
      return rows[0];
    });
  },

  async deleteTemplate(name) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'DELETE FROM email_templates WHERE name = $1 RETURNING *',
        [name]
      );
      return rows[0] || null;
    });
  },
};
