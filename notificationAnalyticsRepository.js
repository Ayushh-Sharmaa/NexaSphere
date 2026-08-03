import { HAS_SUPABASE, supabaseRequest } from "../storage/supabaseClient.js";

/**
 * Notification Analytics Repository
 * Tracks notification delivery, opens, and actions with proper error handling
 * and unified event schema.
 */

/**
 * Unified analytics event schema (CloudEvents compatible)
 */
const ANALYTICS_EVENT_SCHEMA = {
  notification_sent: {
    required: ["userId", "notificationId"],
    optional: ["channel", "templateId"],
  },
  notification_opened: {
    required: ["userId", "notificationId"],
    optional: ["deviceType"],
  },
  notification_action: {
    required: ["userId", "notificationId", "actionType"],
    optional: ["actionUrl"],
  },
};

/**
 * Validate analytics event against schema
 */
function validateEvent(eventType, data) {
  const schema = ANALYTICS_EVENT_SCHEMA[eventType];
  if (!schema) {
    throw new Error(`Unknown analytics event type: ${eventType}`);
  }

  const missing = schema.required.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required fields for ${eventType}: ${missing.join(", ")}`
    );
  }

  return true;
}

/**
 * Log analytics event with proper error handling
 */
export const notificationAnalyticsRepository = {
  async logEvent(userId, notificationId, eventType, action = null) {
    // Validate event data
    const eventData = {
      userId,
      notificationId,
      actionType: action,
    };

    try {
      validateEvent(eventType, eventData);
    } catch (error) {
      console.error(`[Analytics] Event validation failed: ${error.message}`);
      return false;
    }

    const event = {
      user_id: userId,
      notification_id: notificationId,
      event_type: eventType,
      action_taken: action,
      created_at: new Date().toISOString(),
      // Unified schema fields
      specversion: "1.0",
      type: `notification.${eventType}`,
      source: "server",
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (HAS_SUPABASE) {
      try {
        await supabaseRequest("notification_analytics", {
          method: "POST",
          body: [event],
        });
        return true;
      } catch (err) {
        console.error(
          "[Analytics] Failed to log notification event:",
          err.message
        );
        // Fallback: Log to structured logger for later retry
        this.logToQueue(event);
        return false;
      }
    }

    // Fallback: In-memory logging when Supabase is not available
    this.logToMemory(event);
    return true;
  },

  /**
   * Log event to retry queue for failed deliveries
   */
  logToQueue(event) {
    // Store in memory queue for retry (in production, use Redis or similar)
    if (!this._retryQueue) {
      this._retryQueue = [];
    }
    this._retryQueue.push({
      event,
      retries: 0,
      maxRetries: 3,
      nextRetryAt: Date.now() + 60000, // 1 minute
    });
  },

  /**
   * Log event to in-memory storage for non-Supabase environments
   */
  logToMemory(event) {
    if (!this._memoryStore) {
      this._memoryStore = [];
    }
    this._memoryStore.push(event);
    // Keep only last 1000 events in memory
    if (this._memoryStore.length > 1000) {
      this._memoryStore = this._memoryStore.slice(-1000);
    }
  },

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (!this._retryQueue || this._retryQueue.length === 0) return;

    const now = Date.now();
    const readyToRetry = this._retryQueue.filter(
      (item) => item.nextRetryAt <= now
    );

    for (const item of readyToRetry) {
      try {
        await supabaseRequest("notification_analytics", {
          method: "POST",
          body: [item.event],
        });
        // Remove from queue on success
        this._retryQueue = this._retryQueue.filter((i) => i !== item);
      } catch (err) {
        item.retries++;
        if (item.retries >= item.maxRetries) {
          console.error(
            "[Analytics] Event retry limit reached, dropping event:",
            item.event.id
          );
          this._retryQueue = this._retryQueue.filter((i) => i !== item);
        } else {
          item.nextRetryAt = now + Math.pow(2, item.retries) * 60000; // Exponential backoff
        }
      }
    }
  },

  async getUserStats(userId) {
    if (!HAS_SUPABASE)
      return { openRate: 0, actionRate: 0, fatigueIndex: "normal" };

    try {
      const data = await supabaseRequest(
        `notification_analytics?user_id=eq.${userId}`
      );
      const delivered = data.filter(
        (e) =>
          e.event_type === "delivered" || e.event_type === "notification_sent"
      ).length;
      const opened = data.filter(
        (e) =>
          e.event_type === "opened" || e.event_type === "notification_opened"
      ).length;
      const actions = data.filter(
        (e) =>
          e.event_type === "action_clicked" ||
          e.event_type === "notification_action"
      ).length;

      return {
        totalDelivered: delivered,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        actionRate: opened > 0 ? (actions / opened) * 100 : 0,
        fatigueIndex:
          delivered > 20 && opened / delivered < 0.1 ? "high" : "normal",
      };
    } catch (err) {
      console.error("[Analytics] Failed to fetch user stats:", err.message);
      return { openRate: 0, actionRate: 0, fatigueIndex: "normal" };
    }
  },

  async getUserActivityMetrics(userId) {
    if (!HAS_SUPABASE) return { daysSinceLastActive: 0, dailyActiveCount: 0 };
    try {
      const data = await supabaseRequest(
        `user_activity_metrics?user_id=eq.${userId}&order=last_active.desc&limit=1`
      );
      if (!data.length)
        return { daysSinceLastActive: 100, dailyActiveCount: 0 };

      const lastActive = new Date(data[0].last_active);
      const daysInactive = Math.floor(
        (new Date() - lastActive) / (1000 * 60 * 60 * 24)
      );

      return {
        daysSinceLastActive: daysInactive,
        dailyActiveCount: data[0].daily_count || 0,
      };
    } catch (err) {
      console.error(
        "[Analytics] Failed to fetch activity metrics:",
        err.message
      );
      return { daysSinceLastActive: 0, dailyActiveCount: 0 };
    }
  },

  async trackAppActivity(userId) {
    try {
      await supabaseRequest("user_activity_metrics", {
        method: "POST",
        body: [{ user_id: userId, last_active: new Date().toISOString() }],
      });
      return true;
    } catch (err) {
      console.error("[Analytics] Failed to track app activity:", err.message);
      return false;
    }
  },
};
