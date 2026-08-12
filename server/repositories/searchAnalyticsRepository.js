import { withDb } from './db.js';

export const searchAnalyticsRepository = {
  async logSearch(query, resultCount, userId = null) {
    if (!query || query.length < 2) return;
    return withDb(async (client) => {
      await client.query(
        `insert into search_analytics (query, result_count, user_id, timestamp)
         values ($1, $2, $3, now())`,
        [query, resultCount, userId]
      );
    }).catch((e) => {
      // Non-blocking failure
      console.warn('Failed to log search analytics:', e.message);
    });
  },

  async getPopularSearches(limit = 10) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select query, count(*) as count 
         from search_analytics 
         where timestamp > now() - interval '30 days'
         group by query 
         order by count desc 
         limit $1`,
        [limit]
      );
      return rows;
    }).catch(() => []);
  },
};
