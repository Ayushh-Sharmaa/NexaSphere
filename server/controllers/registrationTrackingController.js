/**
 * Registration Tracking Controller
 * Handles real-time registration and check-in events
 */

import { analyticsService } from '../services/analyticsService.js';
import { wrapAsync } from '../middleware/asyncHandler.js';
import logger from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Register a user for an event
 */
export const registerForEvent = wrapAsync(async (req, res) => {
  const { eventId } = req.params;
  const { userId, email, name } = req.body;

  if (!email) {
    return sendError(req, res, 'Email is required', 400, 'VALIDATION_ERROR');
  }

  try {
    const registration = await analyticsService.registerForEvent(eventId, {
      userId,
      email,
      name,
    });

    logger.info('User registered for event', {
      eventId,
      email,
      registrationId: registration.id,
    });

    return sendSuccess(res, { data: registration }, 201);
  } catch (error) {
    logger.error('Registration failed', { eventId, email, error: error.message });
    return sendError(req, res, 'Registration failed', 500, 'INTERNAL_ERROR');
  }
});

/**
 * Check in a user to an event
 */
export const checkInUser = wrapAsync(async (req, res) => {
  const { eventId } = req.params;
  const { registrationId, email } = req.body;

  if (!registrationId || !email) {
    return sendError(req, res, 'registrationId and email are required', 400, 'VALIDATION_ERROR');
  }

  try {
    const updated = await analyticsService.checkInRegistration(eventId, registrationId, email);

    if (!updated) {
      return sendError(req, res, 'Registration not found', 404, 'NOT_FOUND');
    }

    logger.info('User checked in', {
      eventId,
      email,
      registrationId,
    });

    return sendSuccess(res, { data: updated });
  } catch (error) {
    logger.error('Check-in failed', { eventId, email, error: error.message });
    return sendError(req, res, 'Check-in failed', 500, 'INTERNAL_ERROR');
  }
});

/**
 * Get event metrics
 */
export const getEventMetrics = wrapAsync(async (req, res) => {
  const { eventId } = req.params;

  try {
    const metrics = await analyticsService.getEventMetrics(eventId);

    if (!metrics) {
      return sendError(req, res, 'Event not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { data: metrics });
  } catch (error) {
    logger.error('Failed to fetch metrics', { eventId, error: error.message });
    return sendError(req, res, 'Failed to fetch metrics', 500, 'INTERNAL_ERROR');
  }
});

/**
 * Get registration trends
 */
export const getRegistrationTrends = wrapAsync(async (req, res) => {
  const { eventId } = req.params;
  const { timeWindow = '7 days' } = req.query;

  try {
    const trends = await analyticsService.getRegistrationTrends(eventId, timeWindow);

    return sendSuccess(res, {
      data: trends,
      timeWindow,
    });
  } catch (error) {
    logger.error('Failed to fetch trends', { eventId, error: error.message });
    return sendError(req, res, 'Failed to fetch trends', 500, 'INTERNAL_ERROR');
  }
});

/**
 * Bulk registration (for demo/testing)
 */
export const bulkRegister = wrapAsync(async (req, res) => {
  const { eventId } = req.params;
  const { registrations } = req.body;

  if (!Array.isArray(registrations) || registrations.length === 0) {
    return sendError(
      req,
      res,
      'registrations array is required and must not be empty',
      400,
      'VALIDATION_ERROR'
    );
  }

  const results = [];
  const errors = [];

  for (const reg of registrations) {
    try {
      if (!reg.email) {
        errors.push({ email: reg.email, error: 'Email is required' });
        continue;
      }

      const registration = await analyticsService.registerForEvent(eventId, {
        userId: reg.userId,
        email: reg.email,
        name: reg.name,
      });

      results.push(registration);
    } catch (error) {
      errors.push({ email: reg.email, error: error.message });
    }
  }

  logger.info('Bulk registration completed', {
    eventId,
    successful: results.length,
    failed: errors.length,
  });

  return sendSuccess(
    res,
    {
      data: {
        successful: results.length,
        failed: errors.length,
        registrations: results,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    201
  );
});
