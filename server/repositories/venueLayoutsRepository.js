import { withDb } from "./db.js";

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    gridData: row.grid_data || row.gridData || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const venueLayoutsRepository = {
  async list() {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM venue_layouts ORDER BY updated_at DESC"
      );
      return rows.map(mapRow);
    });
  },

  async getById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM venue_layouts WHERE id = $1 LIMIT 1",
        [id]
      );
      return rows[0] ? mapRow(rows[0]) : null;
    });
  },

  async create({ name, gridData }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO venue_layouts (name, grid_data)
         VALUES ($1, $2::jsonb)
         RETURNING *`,
        [name, JSON.stringify(gridData)]
      );
      return mapRow(rows[0]);
    });
  },
};
