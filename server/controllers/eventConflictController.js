import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { eventConflictService } from '../services/eventConflictService.js';

import logger from '../utils/logger.js';
export const getConflicts = async (req, res) => {
  try {
    const conflicts = await eventConflictService.checkConflicts();

    return sendSuccess(res, {
    return res.json({
      success: true,
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

    return sendSuccess(res, {
      return res.status(400).json({
        success: false,
        message: "Venue and date are required.",
      });
    }

    const result = await eventConflictService.checkVenueAvailability(
      venue,
      date
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });

    return sendError(req, res, 'Failed to check venue availability.', 500, 'INTERNAL_ERROR');
  }
};

export const getAttendanceImpact = async (req, res) => {
  try {
    const impact = await eventConflictService.attendanceImpact();

    return sendSuccess(res, {
    return res.json({
      success: true,
      data: impact,
    });
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });

    return sendError(req, res, 'Failed to generate attendance analysis.', 500, 'INTERNAL_ERROR');
  }
};

export const getScheduleRecommendations = async (req, res) => {
  try {
    const recommendations = await eventConflictService.scheduleRecommendation();

    return sendSuccess(res, {
    const recommendations =
      await eventConflictService.scheduleRecommendation();

  } catch (err) {
    logger.error('Event conflict error: {err}', { err });

    return sendError(req, res, 'Failed to generate recommendations.', 500, 'INTERNAL_ERROR');
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    const events = await eventConflictService.calendarEvents();

    return sendSuccess(res, {
    return res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });

    return sendError(req, res, 'Failed to load calendar events.', 500, 'INTERNAL_ERROR');
  }
};

export const getOrganizerAlerts = async (req, res) => {
  try {
    const alerts = await eventConflictService.getAlerts();

    return sendSuccess(res, {
    return res.json({
      success: true,
      total: alerts.length,
      alerts,
    });
  } catch (err) {
    logger.error('Event conflict error: {err}', { err });

    return sendError(req, res, 'Failed to load organizer alerts.', 500, 'INTERNAL_ERROR');
  }
};
    return res.status(500).json({
      success: false,
      message: "Failed to load organizer alerts.",
    });
  }
};
