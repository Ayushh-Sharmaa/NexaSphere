import { notificationAnalyticsRepository } from "../repositories/notificationAnalyticsRepository.js";
import { pushSubscriptionsRepository } from "../repositories/pushSubscriptionsRepository.js";
import { notificationsRepository } from "../repositories/notificationsRepository.js";
import { HAS_SUPABASE, supabaseRequest } from "../storage/supabaseClient.js";
import webpush from "web-push";
import { shouldDeliver } from "./notificationPreferencesService.js";
import { smsService } from "./smsService.js";
import { usersRepository } from "../repositories/usersRepository.js";

/**
 * Orchestrates notification delivery based on user preferences and behavior.
 */
class NotificationsService {
  constructor() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        "mailto:admin@nexasphere.com",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  async addNotification(userId, data) {
    const {
      type = "info",
      priority = "normal",
      title,
      message,
      link = null,
    } = data;

    // 1. Smart Fatigue Adjustment
    const activity =
      await notificationAnalyticsRepository.getUserActivityMetrics(userId);

    // 2. Check delivery preferences (handles DND, quiet hours, channel prefs)
    const result = await shouldDeliver(
      userId,
      type,
      "push",
      priority === "high"
    );
    if (!result.deliver) return;
    let effectiveFrequency = result.frequency;

    // Feature: If user hasn't opened app in 5 days, increase frequency (bypass digest)
    if (
      activity.daysSinceLastActive >= 5 &&
      effectiveFrequency !== "disabled"
    ) {
      effectiveFrequency = "immediate";
    }
    // Feature: If user opens app 10+ times per day, reduce frequency for low-priority items
    if (activity.dailyActiveCount >= 10 && type === "recommendations") {
      effectiveFrequency = "daily_digest";
    }

    // Create the notification record in DB
    const id =
      data.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2));

    const note = await notificationsRepository.create({
      id,
      userId,
      type,
      title,
      message,
      link,
      isRead: data.isRead || false,
    });

    if (effectiveFrequency === "immediate") {
      await this.sendNow(userId, { ...data, id });
    } else if (effectiveFrequency !== "disabled") {
      await this.addToDigest(userId, effectiveFrequency, { ...data, id });
    }

    // SMS Notifications logic (Event reminder, Event postponed, Last call)
    const smsEligibleEvents = ["reminder", "postponed", "last_call"];
    const isSmsEligible =
      smsEligibleEvents.includes(type) ||
      smsEligibleEvents.some((key) => richData?.[key]);

    if (isSmsEligible) {
      const smsPref = await shouldDeliver(
        userId,
        category,
        "sms",
        priorityClass === "urgent"
      );
      if (smsPref.deliver) {
        let user = await usersRepository.getUserById(userId);
        if (!user) {
          // Fallback to student_users table
          const { studentUsersRepository } =
            await import("../repositories/studentUsersRepository.js");
          const students = await studentUsersRepository.listAll();
          user = students.find(
            (s) =>
              String(s.id) === String(userId) ||
              s.provider_id === String(userId)
          );
        }

        if (user && user.phone_number) {
          // Truncate message for SMS if needed
          const smsBody = `NexaSphere: ${title} - ${message}`.substring(0, 160);
          await smsService.sendSMS(userId, user.phone_number, smsBody, type);
        }
      }
    }

    return note;
  }

  async sendNow(userId, data) {
    const subs = await pushSubscriptionsRepository.listByUser(userId);
    const payload = JSON.stringify({
      notification: {
        title: data.title,
        body: data.message,
        icon: "/pwa-192x192.png",
        data: { link: data.link || "/", type: data.type, id: data.id },
        actions: data.actions || [{ action: "dismiss", title: "Dismiss" }],
      },
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
        await notificationAnalyticsRepository.logEvent(
          userId,
          data.id,
          "delivered"
        );
      } catch (err) {
        if (err.statusCode === 410)
          await pushSubscriptionsRepository.remove(sub.endpoint);
      }
    }
  }

  async addToDigest(userId, frequency, data) {
    if (!HAS_SUPABASE) return;
    await supabaseRequest("pending_digests", {
      method: "POST",
      body: [{ user_id: userId, frequency, notification_data: data }],
    });
  }

  async queueForLater(userId, data, reason) {
    if (!HAS_SUPABASE) return;
    await supabaseRequest("queued_notifications", {
      method: "POST",
      body: [{ user_id: userId, reason, notification_data: data }],
    });
  }

  /**
   * Smart Batching: Group multiple items into a single summary notification
   */
  async processDigests(frequency) {
    const digests = await supabaseRequest(
      `pending_digests?frequency=eq.${frequency}`
    );
    if (!digests || digests.length === 0) return;
    const digestIds = digests.map((digest) => digest.id).filter(Boolean);

    const userGroups = digests.reduce((acc, d) => {
      acc[d.user_id] = acc[d.user_id] || [];
      acc[d.user_id].push(d.notification_data);
      return acc;
    }, {});

    for (const [userId, items] of Object.entries(userGroups)) {
      const message =
        items.length === 1
          ? items[0].message
          : `You have ${items.length} new ${frequency.replace("_", " ")} updates including: ${items[0].title}`;

      await this.sendNow(userId, {
        title: `Your ${frequency.replace("_", " ")}`,
        message,
        type: "digest",
      });
    }
    // Cleanup processed digests
    if (digestIds.length > 0) {
      await supabaseRequest(`pending_digests?id=in.(${digestIds.join(",")})`, {
        method: "DELETE",
      });
    }
  }

  computePriority({ type, title, message, richData }) {
    // Maintainer rules (rules-based baseline)
    // urgent: cancelled, deadline approaching (<24h), security alert
    // high: reminder tomorrow, new message from mentor, assignment due
    // medium: matches interests, friend registered, achievement unlocked
    // low: weekly digest, recommendation, community update

    const text =
      `${type || ""} ${title || ""} ${message || ""} ${richData?.title || ""} ${richData?.message || ""}`.toLowerCase();

    // Attempt to read canonical hints from rich data if present
    const flags = {
      cancelled: Boolean(richData?.cancelled),
      security: Boolean(richData?.security),
      deadlineAt:
        richData?.deadlineAt || richData?.dueAt || richData?.startAt || null,
      isReminder: Boolean(richData?.reminder),
      mentorMessage: Boolean(richData?.mentorMessage),
      assignmentDue: Boolean(richData?.assignmentDue),
      friendRegistered: Boolean(richData?.friendRegistered),
      achievementUnlocked: Boolean(richData?.achievementUnlocked),
      weeklyDigest: Boolean(richData?.weeklyDigest),
      recommendation: Boolean(richData?.recommendation),
      communityUpdate: Boolean(richData?.communityUpdate),
    };

    let deadlineSoon = false;
    if (flags.deadlineAt) {
      const ms = new Date(flags.deadlineAt).getTime() - Date.now();
      deadlineSoon = Number.isFinite(ms) && ms >= 0 && ms < 24 * 60 * 60 * 1000;
    }
  }

  async flushQueuedNotifications() {
    // Logic to fetch notifications where Quiet Hours or DND has ended and send them
  }

  // CRUD Pass-throughs for Repository
  async getNotifications(userId, offset, limit) {
    return notificationsRepository.list({ userId, limit, offset });
  }
  async markAsRead(userId, id) {
    return notificationsRepository.markAsRead(userId, id);
  }
  async markAllAsRead(userId) {
    return notificationsRepository.markAllAsRead(userId);
  }
  async clearAll(userId) {
    return notificationsRepository.clearAll(userId);
  }
  async removeNotification(userId, id) {
    return notificationsRepository.remove(userId, id);
  }
  async addNotification(userId, data) {
    const { type, priority = "normal", title, message, link } = data;

    // 1. Smart Fatigue Adjustment
    const activity =
      await notificationAnalyticsRepository.getUserActivityMetrics(userId);
    const prefs = await notificationPreferencesRepository.get(userId);
    const config = prefs.types[type] || { push: true, frequency: "immediate" };

    // 2. Check delivery preferences (handles DND, quiet hours, channel prefs)
    const result = await shouldDeliver(
      userId,
      type,
      "push",
      priority === "high"
    );
    if (!result.deliver) return;

    let effectiveFrequency = result.frequency;

    // Feature: If user hasn't opened app in 5 days, increase frequency (bypass digest)
    if (
      activity.daysSinceLastActive >= 5 &&
      effectiveFrequency !== "disabled"
    ) {
      effectiveFrequency = "immediate";
    }
    // Feature: If user opens app 10+ times per day, reduce frequency for low-priority items
    if (activity.dailyActiveCount >= 10 && type === "recommendations") {
      effectiveFrequency = "daily_digest";
    }

    // 2. Check DND status (critical notifications bypass DND)
    const isDND = await notificationPreferencesRepository.isDNDActive(userId);
    if (isDND && priority !== "high") {
      return this.queueForLater(userId, data, "dnd");
    }

    if (effectiveFrequency === "immediate") {
      // 3. Check Quiet Hours
      const inQuietHours =
        await notificationPreferencesRepository.isInsideQuietHours(userId);
      if (inQuietHours && priority !== "high") {
        return this.queueForLater(userId, data, "quiet_hours");
      }
    }

    // Create the notification record in DB
    const id =
      data.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2));
    const note = await notificationsRepository.create({
      id,
      userId,
      type,
      title,
      message,
      link,
      isRead: data.isRead || false,
    });

    if (effectiveFrequency === "immediate") {
      await this.sendNow(userId, { ...data, id });
    } else if (effectiveFrequency !== "disabled") {
      return this.addToDigest(userId, effectiveFrequency, data);
    }
    return note;
  }

  async sendNow(userId, data) {
    const subs = await pushSubscriptionsRepository.listByUser(userId);
    const payload = JSON.stringify({
      notification: {
        title: data.title,
        body: data.message,
        icon: "/pwa-192x192.png",
        data: { link: data.link || "/", type: data.type, id: data.id },
        actions: data.actions || [{ action: "dismiss", title: "Dismiss" }],
      },
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
        await notificationAnalyticsRepository.logEvent(
          userId,
          data.id,
          "delivered"
        );
      } catch (err) {
        if (err.statusCode === 410)
          await pushSubscriptionsRepository.remove(sub.endpoint);
      }
    }
  }

  async addToDigest(userId, frequency, data) {
    if (!HAS_SUPABASE) return;
    await supabaseRequest("pending_digests", {
      method: "POST",
      body: [{ user_id: userId, frequency, notification_data: data }],
    });
  }

  async queueForLater(userId, data, reason) {
    if (!HAS_SUPABASE) return;
    await supabaseRequest("queued_notifications", {
      method: "POST",
      body: [{ user_id: userId, reason, notification_data: data }],
    });
  }

  /**
   * Smart Batching: Group multiple items into a single summary notification
   */
  async processDigests(frequency) {
    const digests = await supabaseRequest(
      `pending_digests?frequency=eq.${frequency}`
    );
    const userGroups = digests.reduce((acc, d) => {
      acc[d.user_id] = acc[d.user_id] || [];
      acc[d.user_id].push(d.notification_data);
      return acc;
    }, {});

    for (const [userId, items] of Object.entries(userGroups)) {
      const message =
        items.length === 1
          ? items[0].message
          : `You have ${items.length} new ${frequency.replace("_", " ")} updates including: ${items[0].title}`;

      await this.sendNow(userId, {
        title: `Your ${frequency.replace("_", " ")}`,
        message,
        type: "digest",
      });
    }
    // Cleanup processed digests
    await supabaseRequest(`pending_digests?frequency=eq.${frequency}`, {
      method: "DELETE",
    });
  }

  async flushQueuedNotifications() {
    // Logic to fetch notifications where Quiet Hours or DND has ended and send them
  }

  // CRUD Pass-throughs for Repository
  async getNotifications(userId, offset, limit) {
    return notificationsRepository.list({ userId, limit, offset });
  }
  async markAsRead(userId, id) {
    return notificationsRepository.markAsRead(userId, id);
  }
  async markAllAsRead(userId) {
    return notificationsRepository.markAllAsRead(userId);
  }
  async clearAll(userId) {
    return notificationsRepository.clearAll(userId);
  }
  async removeNotification(userId, id) {
    return notificationsRepository.remove(userId, id);
  }
}

export default new NotificationsService();
