import { withDb } from './db.js';

export const smartFormsRepository = {
  async createForm(eventId, title, type, schema) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into smart_forms (event_id, title, type, schema)
         values ($1, $2, $3, $4)
         returning *`,
        [eventId, title, type, JSON.stringify(schema)]
      );
      return rows[0];
    });
  },

  async getFormsByEvent(eventId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select * from smart_forms where event_id = $1 order by created_at desc`,
        [eventId]
      );
      return rows;
    });
  },

  async getFormById(formId) {
    return withDb(async (client) => {
      const { rows } = await client.query(`select * from smart_forms where id = $1`, [formId]);
      return rows[0] || null;
    });
  },

  async updateForm(formId, patch) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update smart_forms set
           title = coalesce($2, title),
           type = coalesce($3, type),
           schema = coalesce($4, schema),
           is_active = coalesce($5, is_active),
           updated_at = current_timestamp
         where id = $1
         returning *`,
        [
          formId,
          patch.title,
          patch.type,
          patch.schema ? JSON.stringify(patch.schema) : null,
          patch.isActive,
        ]
      );
      return rows[0];
    });
  },

  async deleteForm(formId) {
    return withDb(async (client) => {
      await client.query(`delete from smart_forms where id = $1`, [formId]);
    });
  },

  async submitResponse(formId, userId, answers) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into smart_form_responses (form_id, user_id, answers)
         values ($1, $2, $3)
         returning *`,
        [formId, userId || null, JSON.stringify(answers)]
      );
      return rows[0];
    });
  },

  async getResponses(formId, filters = {}) {
    return withDb(async (client) => {
      let query = `select * from smart_form_responses where form_id = $1`;
      const values = [formId];

      if (filters.status) {
        values.push(filters.status);
        query += ` and status = $${values.length}`;
      }

      query += ` order by submitted_at desc`;

      const { rows } = await client.query(query, values);
      return rows;
    });
  },

  async updateResponseStatus(responseId, status) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update smart_form_responses set status = $2 where id = $1 returning *`,
        [responseId, status]
      );
      return rows[0];
    });
  },

  async getAnalytics(formId) {
    return withDb(async (client) => {
      const { rows: responses } = await client.query(
        `select answers from smart_form_responses where form_id = $1`,
        [formId]
      );

      const { rows: formRows } = await client.query(
        `select schema from smart_forms where id = $1`,
        [formId]
      );

      if (!formRows.length) return null;

      return {
        schema: formRows[0].schema,
        totalResponses: responses.length,
        responses: responses.map((r) => r.answers),
      };
    });
  },
};
