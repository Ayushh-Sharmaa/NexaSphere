import { withDb } from '../repositories/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

function wrapAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export const getTrending = wrapAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  
  const result = await withDb(async (client) => {
    return client.query(
      `SELECT tag, usage_count 
       FROM hashtags 
       ORDER BY usage_count DESC, last_used_at DESC 
       LIMIT $1`,
      [limit]
    );
  });
  
  return sendSuccess(res, { hashtags: result.rows });
});

export const followHashtag = wrapAsync(async (req, res) => {
  const { tag } = req.params;
  const user = req.studentUser;
  
  if (!user) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  
  await withDb(async (client) => {
    await client.query(
      `INSERT INTO hashtag_follows (user_id, hashtag) 
       VALUES ($1, $2) 
       ON CONFLICT DO NOTHING`,
      [user.id, tag.toLowerCase()]
    );
  });
  
  return sendSuccess(res, { success: true });
});

export const unfollowHashtag = wrapAsync(async (req, res) => {
  const { tag } = req.params;
  const user = req.studentUser;
  
  if (!user) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  
  await withDb(async (client) => {
    await client.query(
      `DELETE FROM hashtag_follows WHERE user_id = $1 AND hashtag = $2`,
      [user.id, tag.toLowerCase()]
    );
  });
  
  return sendSuccess(res, { success: true });
});

export const getFollowing = wrapAsync(async (req, res) => {
  const user = req.studentUser;
  
  if (!user) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  
  const result = await withDb(async (client) => {
    return client.query(
      `SELECT hashtag FROM hashtag_follows WHERE user_id = $1`,
      [user.id]
    );
  });
  
  const tags = result.rows.map(r => r.hashtag);
  return sendSuccess(res, { tags });
});
