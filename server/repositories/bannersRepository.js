import { withDb } from './db.js';

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const bannersRepository = {
  async listAll() {
    return withDb(async (client) => {
      const { rows } = await client.query(`
        select * from banners order by created_at desc
      `);
      return rows.map(mapRow);
    });
  },

  async listActive() {
    return withDb(async (client) => {
      const { rows } = await client.query(`
        select * from banners 
        where is_active = true 
          and (start_time is null or start_time <= now()) 
          and (end_time is null or end_time >= now())
        order by created_at desc
      `);
      return rows.map(mapRow);
    });
  },

  async getById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('select * from banners where id = $1', [id]);
      return rows.length ? mapRow(rows[0]) : null;
    });
  },

  async create(banner) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into banners (title, image_url, link_url, start_time, end_time, is_active)
         values ($1, $2, $3, $4, $5, $6)
         returning *`,
        [
          banner.title,
          banner.imageUrl,
          banner.linkUrl,
          banner.startTime,
          banner.endTime,
          banner.isActive ?? true,
        ]
      );
      return mapRow(rows[0]);
    });
  },

  async update(id, patch) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update banners set
           title = coalesce($2, title),
           image_url = coalesce($3, image_url),
           link_url = coalesce($4, link_url),
           start_time = coalesce($5, start_time),
           end_time = coalesce($6, end_time),
           is_active = coalesce($7, is_active),
           updated_at = now()
         where id = $1 returning *`,
        [
          id,
          patch.title,
          patch.imageUrl,
          patch.linkUrl,
          patch.startTime,
          patch.endTime,
          patch.isActive,
        ]
      );
      return rows.length ? mapRow(rows[0]) : null;
    });
  },

  async delete(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('delete from banners where id=$1', [id]);
      return rowCount > 0;
    });
  },
};
