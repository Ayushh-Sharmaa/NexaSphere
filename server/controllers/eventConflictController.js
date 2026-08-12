
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { eventConflictService } from '../services/eventConflictService.js';
import logger from '../utils/logger.js';

export const getConflicts = async (req, res) => {
  try {
    const conflicts = await eventConflictService.checkConflicts();
    return sendSuccess(res, {
      total: conflicts.length,
      conflicts,
    });
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });
    return sendError(req, res, 'Failed to check event conflicts.', 500, 'INTERNAL_ERROR');
  }
};

export const getVenueAvailability = async (req, res) => {
  try {
    const { venue, date } = req.query;
    if (!venue || !date) {
      return sendError(req, res, 'Venue and date are required.', 400, 'VALIDATION_ERROR');
    }
    const result = await eventConflictService.checkVenueAvailability(venue, date);
    return sendSuccess(res, result);
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });
    return sendError(req, res, 'Failed to check venue availability.', 500, 'INTERNAL_ERROR');
  }
};

export const getAttendanceImpact = async (req, res) => {
  try {
    const impact = await eventConflictService.attendanceImpact();
    return sendSuccess(res, impact);
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });
    return sendError(req, res, 'Failed to generate attendance analysis.', 500, 'INTERNAL_ERROR');
  }
};

export const getScheduleRecommendations = async (req, res) => {
  try {
    const recommendations = await eventConflictService.scheduleRecommendation();
    return sendSuccess(res, recommendations);
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });
    return sendError(req, res, 'Failed to generate recommendations.', 500, 'INTERNAL_ERROR');
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    const events = await eventConflictService.calendarEvents();
    return sendSuccess(res, events);
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });
    return sendError(req, res, 'Failed to load calendar events.', 500, 'INTERNAL_ERROR');
  }
};

export const getOrganizerAlerts = async (req, res) => {
  try {
    const alerts = await eventConflictService.getAlerts();
    return sendSuccess(res, {
      total: alerts.length,
      alerts,
    });
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });
    return sendError(req, res, 'Failed to load organizer alerts.', 500, 'INTERNAL_ERROR');
  }
};

