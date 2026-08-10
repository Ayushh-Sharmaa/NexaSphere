const fs = require('fs');
let lines = fs.readFileSync('routes/analytics.js', 'utf8').split('\n');

const newCode = `/**
 * GET /
 * Returns a high-level summary of events, activity events, and core team members.
 */
router.get('/', (req, res) => {
  sendSuccess(res, { ok: true, message: 'Analytics endpoint is available.' });
});

router.get('/stats', async (req, res) => {
  try {
    let totalUsers = null;
    let activeRegistrations = null;
    let upcomingEvents = null;
    const conversionRate = null;

    if (HAS_SUPABASE) {
      const [events, submissions] = await Promise.all([
        supabaseRequest('events?select=status'),
        supabaseRequest('form_submissions?select=id,college_email'),
      ]);

      upcomingEvents = events.filter(e => e.status === 'upcoming').length;
      activeRegistrations = submissions.length;

      const uniqueEmails = new Set(submissions.map((s) => s.college_email).filter(Boolean));
      totalUsers = uniqueEmails.size > 0 ? uniqueEmails.size : submissions.length;
    } else {
      const content = await getCachedContent();
      upcomingEvents = (content.events || []).filter((e) => e.status === 'upcoming').length;
    }

    sendSuccess(res, { totalUsers, activeRegistrations, upcomingEvents, conversionRate });
  } catch (error) {
    sendError(req, res, error.message || 'Failed to generate stats', 500, 'INTERNAL_ERROR');
  }
});`;

lines.splice(95, 55, ...newCode.split('\n'));
fs.writeFileSync('routes/analytics.js', lines.join('\n'));
