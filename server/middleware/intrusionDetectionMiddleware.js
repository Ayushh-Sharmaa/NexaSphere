import { intrusionDetectionService, EVENT_TYPES } from '../services/intrusionDetectionService.js';
import logger from '../utils/logger.js';

export const intrusionDetectionMiddleware = async (req, res, next) => {
  const ip = req.ip;

  try {
    if (await intrusionDetectionService.isBlocked(ip)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied due to suspicious activity.',
      });
    }
  } catch (error) {
    logger.error('Error in intrusion detection middleware:', error);
  }

  next();
};

export const abnormalRequestDetector = async (req, res, next) => {
  // We can attach to res.on('finish') to check status codes
  res.on('finish', () => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      // Exclude simple 401s if they are standard auth failures (handled elsewhere)
      if (res.statusCode === 404 || res.statusCode === 400 || res.statusCode === 405) {
        intrusionDetectionService
          .reportEvent(EVENT_TYPES.ABNORMAL_API_REQUEST, req.ip, req.user?.id || req.admin?.id, {
            path: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
          })
          .catch((err) => logger.error('Error reporting abnormal API request:', err));
      }
    }
  });

  next();
};
