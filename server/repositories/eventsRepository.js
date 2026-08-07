import { withDb } from "./db.js";

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    date: row.date_text,
    description: row.description,
    status: row.status,
    icon: row.icon,
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ?? []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export const eventsRepository = {
  async list({ page = 1, limit = 20 } = {}) {
    return withDb(async (client) => {
      await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");

      try {
        const offset = (page - 1) * limit;

        const { rows } = await client.query(
          "select * from events order by created_at desc limit $1 offset $2",
          [limit, offset]
        );

        const countResult = await client.query(
          "select count(*)::int as total from events"
        );

        const total = countResult.rows[0]?.total ?? 0;

        await client.query("COMMIT");

        return {
          rows: rows.map(mapRow),
          total,
        };
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    });
  },

  async getById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "select * from events where id = $1",
        [id]
      );
      if (!rows.length) return null;
      return mapRow(rows[0]);
    });
  },

  async create(event) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into events (id, name, short_name, date_text, description, status, icon, tags)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (id) do update set
           name=excluded.name,
           short_name=excluded.short_name,
           date_text=excluded.date_text,
           description=excluded.description,
           status=excluded.status,
           icon=excluded.icon,
           tags=excluded.tags,
           updated_at=now()
         returning *`,
        [
          event.id,
          event.name,
          event.shortName,
          event.date,
          event.description,
          event.status,
          event.icon,
          event.tags,
        ]
      );
      return mapRow(rows[0]);
    });
  },

  async update(id, patch) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update events set
           name = coalesce($2, name),
           short_name = coalesce($3, short_name),
           date_text = coalesce($4, date_text),
           description = coalesce($5, description),
           status = coalesce($6, status),
           icon = coalesce($7, icon),
           tags = coalesce($8, tags),
           updated_at = now()
         where id = $1
         returning *`,
        [
          id,
          patch.name ?? null,
          patch.shortName ?? null,
          patch.date ?? null,
          patch.description ?? null,
          patch.status ?? null,
          patch.icon ?? null,
          patch.tags ?? null,
        ]
      );
      if (!rows.length) return null;
      return mapRow(rows[0]);
    });
  },

  async delete(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "delete from events where id=$1",
        [id]
      );
      return rowCount > 0;
    });
  },
  async listAll({ page = 1, limit = 20 } = {}) {
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const { rows } = await client.query(
        "select * from events order by created_at desc limit $1 offset $2",
        [limit, offset]
      );
      const countResult = await client.query(
        "select count(*)::int as total from events"
      );
      const total = countResult.rows[0]?.total ?? 0;
      return { rows: rows.map(mapRow), total };
    });
  },
};
