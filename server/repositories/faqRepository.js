import { withDb } from './db.js';

export const faqRepository = {
  async getAll(search = '', category = null) {
    return withDb(async (client) => {
      let query = 'SELECT * FROM faqs WHERE is_active = true';
      const params = [];
      let idx = 1;

      if (search) {
        // Escape SQL LIKE meta-characters so a literal % or _ in the search
        // term does not act as a wildcard.
        const escaped = String(search)
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_');
        query += ` AND (question ILIKE $${idx} OR answer ILIKE $${idx})`;
        params.push(`%${escaped}%`);
        idx++;
      }

      if (category) {
        query += ` AND category = $${idx}`;
        params.push(category);
        idx++;
      }

      query += ' ORDER BY views DESC, created_at DESC';

      const { rows } = await client.query(query, params);
      return rows;
    });
  },

  async getAdminAll() {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM faqs ORDER BY created_at DESC');
      return rows;
    });
  },

  async incrementViews(id) {
    // Guard: reject invalid id types before hitting the database
    const parsedId = parseInt(id, 10);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return false;
    }
    return withDb(async (client) => {
      try {
        const { rowCount } = await client.query(
          'UPDATE faqs SET views = views + 1 WHERE id = $1',
          [parsedId]
        );
        return rowCount > 0;
      } catch {
        return false;
      }
    });
  },

  async create({ question, answer, category, is_active = true }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO faqs (question, answer, category, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [question, answer, category || 'General', is_active]
      );
      return rows[0];
    });
  },

  async update(id, updates) {
    return withDb(async (client) => {
      const fields = [];
      const values = [];
      let idx = 1;

      if (updates.question !== undefined) {
        fields.push(`question = $${idx++}`);
        values.push(updates.question);
      }
      if (updates.answer !== undefined) {
        fields.push(`answer = $${idx++}`);
        values.push(updates.answer);
      }
      if (updates.category !== undefined) {
        fields.push(`category = $${idx++}`);
        values.push(updates.category);
      }
      if (updates.is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(updates.is_active);
      }

      if (fields.length === 0) return null;

      fields.push(`updated_at = NOW()`);
      idx += 1;
      values.push(id);

      const { rows } = await client.query(
        `UPDATE faqs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows[0] || null;
    });
  },

  async delete(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('DELETE FROM faqs WHERE id = $1 RETURNING *', [id]);
      return rows[0] || null;
    });
  },
};
