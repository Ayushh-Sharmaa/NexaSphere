import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { registrationsRepository } from '../repositories/registrationsRepository.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { getAdminEventRecommendations } from '../services/eventRecommendationService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      sendError(req, res, e?.message || 'Internal server error', status, 'INTERNAL_ERROR');
      res.status(status).json({ error: e?.message || 'Internal server error' });
    });
}

export const getEventStats = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || '').trim();
  if (!eventId) {
    return sendError(req, res, 'Event ID required', 400, 'VALIDATION_ERROR');
  }
  const event = await eventsRepository.getById(eventId);
  if (!event) {
    return sendError(req, res, 'Event not found', 404, 'NOT_FOUND');
    return res.status(400).json({ error: 'Event ID required' });
  }
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  const stats = await registrationsRepository.getRegistrationStats(eventId);
  const departmentBreakdown = await registrationsRepository.getDepartmentBreakdown(eventId);
  const yearBreakdown = await registrationsRepository.getYearBreakdown(eventId);
  const waitlist = await registrationsRepository.getWaitlist(eventId);

  const attendanceRate =
    stats.confirmed > 0 ? Math.round((stats.attended / stats.confirmed) * 100) : 0;

  const predictedAttendance = Math.round(stats.confirmed * 1.15);

  const popularityScore =
    stats.confirmed > 0
      ? Math.min(
          100,
          Math.round(
            ((stats.confirmed + waitlist.length) /
              (event.capacity || stats.confirmed + waitlist.length)) *
              100
          )
        )
      ? Math.min(100, Math.round((stats.confirmed / (stats.confirmed + waitlist.length)) * 100))
      : 0;

  const resourceRecommendation =
    predictedAttendance > 100
      ? 'High Resources Required'
      : predictedAttendance > 50
        ? 'Medium Resources Required'
        : 'Low Resources Required';

  return sendSuccess(res, {
const popularityScore =
  stats.confirmed > 0
    ? Math.min(100, Math.round((stats.confirmed / (stats.confirmed + waitlist.length)) * 100))
    : 0;

const resourceRecommendation =
  predictedAttendance > 100
    ? 'High Resources Required'
    : predictedAttendance > 50
      ? 'Medium Resources Required'
      : 'Low Resources Required';

  return res.json({
    eventId,
    eventName: event.name,
    stats,
    attendanceRate,
    predictedAttendance,
    popularityScore,
    resourceRecommendation,
    departmentBreakdown,
    yearBreakdown,
    waitlist,
  });
});

export const getEventRecommendations = wrapAsync(async (req, res) => {
  const recommendations = await getAdminEventRecommendations();
  return sendSuccess(res, recommendations);
});
