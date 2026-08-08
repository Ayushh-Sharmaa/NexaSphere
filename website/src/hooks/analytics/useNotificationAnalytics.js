/**
 * Notification Analytics Hooks
 * Tracks notification delivery, opens, and actions with proper error handling.
 */

import { captureHandledException } from '../../utils/errorTracking';

/**
 * Unified analytics event schema (CloudEvents compatible)
 * @typedef {Object} AnalyticsEvent
 * @property {string} specversion - CloudEvents spec version
 * @property {string} type - Event type (e.g., 'notification.sent')
 * @property {string} source - Event source
 * @property {string} id - Unique event ID
 * @property {string} time - ISO 8601 timestamp
 * @property {Object} data - Event payload
 */

/**
 * Generate a unique event ID
 */
function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a unified analytics event
 */
function createAnalyticsEvent(type, data, source = 'website') {
  return {
    specversion: '1.0',
    type,
    source,
    id: generateEventId(),
    time: new Date().toISOString(),
    data,
  };
}

/**
 * Send analytics event with retry logic
 */
async function sendAnalyticsEvent(event, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      if (attempt === retries) {
        // Final attempt failed - track the error
        captureHandledException(error, 'Analytics event delivery failed:', {
          eventType: event.type,
          eventId: event.id,
          attempts: retries + 1,
        });
        return false;
      }
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  return false;
}

/**
 * Track notification sent event
 */
export async function trackNotificationSent(payload = {}) {
  const event = createAnalyticsEvent('notification.sent', {
    notificationId: payload.notificationId,
    userId: payload.userId,
    channel: payload.channel || 'push',
    templateId: payload.templateId,
    metadata: payload.metadata,
  });

  return sendAnalyticsEvent(event);
}

/**
 * Track notification opened event
 */
export async function trackNotificationOpened(payload = {}) {
  const event = createAnalyticsEvent('notification.opened', {
    notificationId: payload.notificationId,
    userId: payload.userId,
    openedAt: new Date().toISOString(),
    deviceType: payload.deviceType,
    metadata: payload.metadata,
  });

  return sendAnalyticsEvent(event);
}

/**
 * Track notification action event
 */
export async function trackNotificationAction(payload = {}) {
  const event = createAnalyticsEvent('notification.action', {
    notificationId: payload.notificationId,
    userId: payload.userId,
    actionType: payload.actionType,
    actionUrl: payload.actionUrl,
    clickedAt: new Date().toISOString(),
    metadata: payload.metadata,
  });

  return sendAnalyticsEvent(event);
}

export default { trackNotificationSent, trackNotificationOpened, trackNotificationAction };
