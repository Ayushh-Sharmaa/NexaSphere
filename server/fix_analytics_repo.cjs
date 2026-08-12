const fs = require('fs');
let content = fs.readFileSync('repositories/analyticsRepository.js', 'utf8');
let lines = content.split('\n');

// Find the line "      RETURNING *" after createSegment
const retIdx = lines.findIndex((l, i) => i > 380 && l.trim() === "RETURNING *");
if (retIdx === -1) {
  console.log('Could not find RETURNING * line');
  process.exit(1);
}
console.log('Found RETURNING * at line', retIdx + 1);

// Find "Get all events metrics for dashboard" 
const metricsIdx = lines.findIndex((l, i) => i > retIdx && l.includes('Get all events metrics for dashboard'));
if (metricsIdx === -1) {
  console.log('Could not find getAllEventsMetrics');
  process.exit(1);
}
console.log('Found getAllEventsMetrics comment at line', metricsIdx + 1);

// Replace everything from retIdx+1 (the ` `; line) to metricsIdx-1 (blank line before comment)
const replacement = `      \`;
      const { rows } = await client.query(q, [name, description, JSON.stringify(rules_json)]);
      return rows[0];
    });
  },

  async getUserSegments(userId) {
    return withDb(async (client) => {
      const q = \`
        SELECT s.*
        FROM analytics_segments s
        JOIN analytics_user_segments us ON s.id = us.segment_id
        WHERE us.user_id = $1
      \`;
      const { rows } = await client.query(q, [userId]);
      return rows;
    });
  },

  async getCohortData(signupMonth) {
    return withDb(async (client) => {
      const q = \`
        WITH cohort_users AS (
          SELECT id, created_at FROM users
          WHERE TO_CHAR(created_at, 'YYYY-MM') = $1
        )
        SELECT COUNT(*) as total_users FROM cohort_users
      \`;
      const { rows } = await client.query(q, [signupMonth]);
      return rows[0];
    });
  },

  async getEventMetrics(eventId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        \`SELECT
           e.id,
           e.name,
           e.date_text as date,
           COALESCE(COUNT(DISTINCT r.id), 0) as totalRegistrations,
           COALESCE(SUM(CASE WHEN r.status = 'checked_in' THEN 1 ELSE 0 END), 0) as checkedIn,
           COALESCE(SUM(CASE WHEN r.status = 'registered' THEN 1 ELSE 0 END), 0) as pendingCheckIn,
           e.max_attendees as maxAttendees,
           e.created_at as eventCreatedAt,
           e.updated_at as eventUpdatedAt
         FROM events e
         LEFT JOIN registrations r ON e.id = r.event_id
         WHERE e.id = $1
         GROUP BY e.id, e.name, e.date_text, e.max_attendees, e.created_at, e.updated_at\`,
        [eventId]
      );

      if (!rows.length) return null;

      const row = rows[0];
      return {
        eventId: row.id,
        eventName: row.name,
        eventDate: row.date,
        totalRegistrations: parseInt(row.totalRegistrations, 10),
        checkedIn: parseInt(row.checkedIn, 10),
        pendingCheckIn: parseInt(row.pendingCheckIn, 10),
        maxAttendees: row.maxAttendees,
        availableSeats: Math.max(
          0,
          (row.maxAttendees || 999) - parseInt(row.totalRegistrations, 10)
        ),
        occupancyRate: row.maxAttendees
          ? ((parseInt(row.totalRegistrations, 10) / row.maxAttendees) * 100).toFixed(2)
          : 0,
        eventCreatedAt: row.eventCreatedAt,
        eventUpdatedAt: row.eventUpdatedAt,
      };
    });
  },
`;

const replLines = replacement.split('\n');
// Replace from retIdx+1 to metricsIdx-1
lines.splice(retIdx + 1, metricsIdx - retIdx - 1, ...replLines);
fs.writeFileSync('repositories/analyticsRepository.js', lines.join('\n'));
console.log('Done! Replaced lines', retIdx + 2, 'to', metricsIdx);
