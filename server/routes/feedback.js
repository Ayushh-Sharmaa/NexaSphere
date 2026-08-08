const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { analyzeThemes } = require('../services/feedbackAnalytics');
const { awardXP, awardBadge } = require('../services/gamification');
const { generateCSV, generatePDF } = require('../services/exportService');
const { sendSuccess, sendError, sendNoContent } = require('../utils/responseHelper.js');

// POST /api/feedback — submit feedback
router.post('/', authenticate, async (req, res) => {
  const { eventId, ratings, nps, openEnded, anonymous } = req.body;
  const userId = req.user.id;

  if (!eventId || !ratings?.overall) {
    return sendError(req, res, 'eventId and overall rating required', 400, 'VALIDATION_ERROR');
  }
  if (nps !== undefined && nps !== null && (nps < 0 || nps > 10)) {
    return sendError(req, res, 'NPS must be 0-10', 400, 'VALIDATION_ERROR');
  }

  // Prevent duplicate submissions
  const existing = await db('feedback').where({ event_id: eventId, user_id: userId }).first();
  if (existing)
    return sendError(req, res, 'Already submitted feedback for this event', 409, 'CONFLICT');

  // NPS classification
  let npsCategory = null;
  if (nps !== null && nps !== undefined) {
    npsCategory = nps <= 6 ? 'detractor' : nps <= 8 ? 'passive' : 'promoter';
  }

  const [feedbackId] = await db('feedback').insert({
    event_id: eventId,
    user_id: userId,
    anonymous,
    rating_overall: ratings.overall,
    rating_content: ratings.content,
    rating_speaker: ratings.speaker,
    rating_venue: ratings.venue,
    rating_logistics: ratings.logistics,
    rating_networking: ratings.networking,
    rating_value: ratings.value,
    nps_score: nps,
    nps_category: npsCategory,
    open_enjoyed: openEnded?.enjoyed?.trim() || null,
    open_improve: openEnded?.improve?.trim() || null,
    open_comments: openEnded?.comments?.trim() || null,
    created_at: new Date(),
  });

  // Incentives
  await awardXP(userId, 25, 'feedback_submitted');
  const feedbackCount = await db('feedback').where({ user_id: userId }).count('id as cnt').first();
  if (feedbackCount.cnt >= 5) await awardBadge(userId, 'feedback_champion');

  sendSuccess(res, { id: feedbackId, xpAwarded: 25 }, 201);
});

// GET /api/feedback/analytics/:eventId — organizer analytics
router.get('/analytics/:eventId', authenticate, async (req, res) => {
  const { eventId } = req.params;

  // Verify organizer owns event
  const event = await db('events').where({ id: eventId }).first();
  if (!event) return sendError(req, res, 'Event not found', 404, 'NOT_FOUND');
  if (event.organizer_id !== req.user.id && !req.user.isAdmin) {
    return sendError(req, res, 'Forbidden', 403, 'FORBIDDEN');
  }

  const feedbacks = await db('feedback')
    .where({ event_id: eventId })
    .leftJoin('users', 'feedback.user_id', 'users.id')
    .select('feedback.*', 'users.name as userName');

  if (!feedbacks.length) return sendSuccess(res, null);

  const totalResponses = feedbacks.length;
  const attendeeCount = await db('event_attendees')
    .where({ event_id: eventId })
    .count('id as cnt')
    .first();
  const responseRate = attendeeCount.cnt > 0 ? (totalResponses / attendeeCount.cnt) * 100 : 0;

  // Average ratings
  const dims = ['overall', 'content', 'speaker', 'venue', 'logistics', 'networking', 'value'];
  const averageRatings = {};
  dims.forEach((d) => {
    const vals = feedbacks.map((f) => f[`rating_${d}`]).filter(Boolean);
    averageRatings[d] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });

  // Overall distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach((f) => {
    if (f.rating_overall) distribution[f.rating_overall]++;
  });

  // NPS
  const withNps = feedbacks.filter((f) => f.nps_score !== null);
  const promoters = withNps.filter((f) => f.nps_category === 'promoter').length;
  const detractors = withNps.filter((f) => f.nps_category === 'detractor').length;
  const passives = withNps.filter((f) => f.nps_category === 'passive').length;
  const npsScore = withNps.length
    ? Math.round(((promoters - detractors) / withNps.length) * 100)
    : null;

  // Themes
  const openTexts = feedbacks.flatMap((f) => [f.open_enjoyed, f.open_improve].filter(Boolean));
  const themes = await analyzeThemes(openTexts);

  // Recent responses (last 10)
  const recentResponses = feedbacks
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map((f) => ({
      id: f.id,
      userName: f.anonymous ? null : f.userName,
      anonymous: f.anonymous,
      ratings: { overall: f.rating_overall },
      nps: f.nps_score,
      openEnded: { enjoyed: f.open_enjoyed, improve: f.open_improve },
      createdAt: f.created_at,
    }));

  sendSuccess(res, {
    totalResponses,
    responseRate,
    averageRatings,
    distribution,
    nps: {
      score: npsScore,
      promoters: Math.round((promoters / (withNps.length || 1)) * 100),
      passives: Math.round((passives / (withNps.length || 1)) * 100),
      detractors: Math.round((detractors / (withNps.length || 1)) * 100),
    },
    themes,
    recentResponses,
  });
});

// GET /api/feedback/export/:eventId — CSV or PDF export
router.get('/export/:eventId', authenticate, async (req, res) => {
  const { eventId } = req.params;
  const { format = 'csv' } = req.query;

  const event = await db('events').where({ id: eventId }).first();
  if (!event) return sendError(req, res, 'Event not found', 404, 'NOT_FOUND');
  if (event.organizer_id !== req.user.id && !req.user.isAdmin) {
    return sendError(req, res, 'Forbidden', 403, 'FORBIDDEN');
  }

  const feedbacks = await db('feedback')
    .where({ event_id: eventId })
    .leftJoin('users', 'feedback.user_id', 'users.id')
    .select('feedback.*', 'users.name as userName');

  if (format === 'pdf') {
    const pdfBuffer = await generatePDF(event, feedbacks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-${eventId}.pdf"`);
    return res.send(pdfBuffer);
  }

  const csv = generateCSV(feedbacks);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="feedback-${eventId}.csv"`);
  res.send(csv);
});

// GET /api/feedback/check/:eventId — has current user submitted?
router.get('/check/:eventId', authenticate, async (req, res) => {
  const existing = await db('feedback')
    .where({ event_id: req.params.eventId, user_id: req.user.id })
    .first();
  sendSuccess(res, { submitted: !!existing });
});

module.exports = router;
