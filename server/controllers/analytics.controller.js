// Assuming you have a database utility or Supabase client setup at server/config/db
const supabase = require('../config/supabaseClient');
const { sendSuccess, sendError } = require('../utils/responseHelper.js');

exports.trackEvents = async (req, res) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return sendError(
        req,
        res,
        'Invalid payload: "events" array is required.',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Validate and sanitize data items inside the batch
    const sanitizedEvents = events.map((event) => ({
      event_type: event.eventType || 'unknown',
      element_clicked: event.elementClicked || null,
      page_url: event.pageUrl || 'unknown',
      timestamp: event.timestamp || new Date().toISOString(),
      session_id: event.sessionId || 'anonymous', // Anonymized session identifier from frontend
    }));

    // Insert array of objects directly into your Supabase/Postgre table named 'user_analytics'
    const { data, error } = await supabase.from('user_analytics').insert(sanitizedEvents);

    if (error) throw error;

    return sendSuccess(res, { message: 'Batch events recorded successfully.' }, 201);
  } catch (error) {
    console.error('Analytics Backend Error:', error.message);
    return sendError(req, res, 'Internal server error tracking analytics.', 500, 'INTERNAL_ERROR');
  }
};
