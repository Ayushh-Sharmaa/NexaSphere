import { withDb } from './db.js';
import logger from '../utils/logger.js';

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    date: row.date_text,
    tagline: row.tagline,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const activityEventsRepository = {
  // Returns { rows, total } — rows are the current page, total is the full
  // count for the given activityKey so callers can build pagination metadata.
  async listByActivityKey(activityKey, { page = 1, limit = 20 } = {}) {
    return withDb(async (client) => {
      await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ');

      try {
        const offset = (page - 1) * limit;

        const { rows } = await client.query(
          'select * from activity_events where activity_key=$1 order by created_at desc limit $2 offset $3',
          [activityKey, limit, offset]
        );

        const countResult = await client.query(
          'select count(*)::int as total from activity_events where activity_key=$1',
          [activityKey]
        );

        const total = countResult.rows[0]?.total ?? 0;

        await client.query('COMMIT');

        return {
          rows: rows.map(mapRow),
          total,
        };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
      const offset = (page - 1) * limit;
      const { rows } = await client.query(
        'select * from activity_events where activity_key=$1 order by created_at desc limit $2 offset $3',
        [activityKey, limit, offset]
      );
      const countResult = await client.query(
        'select count(*)::int as total from activity_events where activity_key=$1',
        [activityKey]
      );
      const total = countResult.rows[0]?.total ?? 0;
      return { rows: rows.map(mapRow), total };
    });
  },

  async listAll() {
    return withDb(async (client) => {
      const { rows } = await client.query('select * from activity_events order by created_at desc');
      const result = {};
      for (const row of rows) {
        const key = row.activity_key;
        if (!result[key]) result[key] = [];
        result[key].push(mapRow(row));
      }
      return result;
    });
  },

  async create(activityKey, event) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into activity_events (
           id, activity_key, name, date_text, tagline, description, status,
           created_by_name, created_by_email, created_by_phone
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         returning *`,
        [
          event.id,
          activityKey,
          event.name,
          event.date,
          event.tagline,
          event.description,
          event.status,
          event.createdBy?.name || '',
          event.createdBy?.email || '',
          event.createdBy?.phone || '',
        ]
      );
      const mapped = mapRow(rows[0]);
      import('../services/searchIndexer.js')
        .then(({ searchIndexer }) =>
          searchIndexer.indexActivity(mapped.id, {
            title: mapped.name,
            description: mapped.description,
            subtitle: mapped.tagline,
          })
        )
        .catch((err) =>
          logger.error('Failed to index activity in search', { err, activityId: mapped?.id })
        );
      return mapped;
    });
  },

  async delete(activityKey, eventId) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        'delete from activity_events where activity_key=$1 and id=$2',
        [activityKey, eventId]
      );
      if (rowCount > 0) {
        import('../services/searchIndexer.js')
          .then(({ searchIndexer }) => searchIndexer.deleteDocument('activities', eventId))
          .catch((err) =>
            logger.error('Failed to remove activity from search index', {
              err,
              activityId: eventId,
            })
          );
      }
      return rowCount > 0;
    });
  },
};
