import { withDb } from '../repositories/db.js';

export const parseHashtagsAndNotify = async (content, userId, link, type) => {
  if (!content) return;
  const matches = content.match(/#(\w+)/g);
  if (!matches || matches.length === 0) return;

  // Deduplicate tags in this piece of content
  const tags = [...new Set(matches.map((t) => t.substring(1).toLowerCase()))];
  if (tags.length === 0) return;

  try {
    await withDb(async (client) => {
      for (const tag of tags) {
        // Upsert hashtag
        await client.query(
          `INSERT INTO hashtags (tag, usage_count, last_used_at, created_at)
           VALUES ($1, 1, NOW(), NOW())
           ON CONFLICT (tag) DO UPDATE 
           SET usage_count = hashtags.usage_count + 1, last_used_at = NOW()`,
          [tag]
        );

        // Fetch followers of this hashtag (excluding the author themselves)
        const followers = await client.query(
          `SELECT user_id FROM hashtag_follows WHERE hashtag = $1 AND user_id != $2`,
          [tag, userId]
        );

        if (followers.rows.length > 0) {
          // Import here to avoid circular dependency if any
          const { default: notificationsService } = await import('../services/notificationsService.js');
          for (const row of followers.rows) {
            await notificationsService.addNotification(row.user_id, {
              type: 'hashtag_alert',
              title: `Trending: #${tag}`,
              message: `Someone just posted about #${tag}.`,
              link,
            });
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to parse hashtags and notify:', error);
  }
};
