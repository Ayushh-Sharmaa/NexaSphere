/**
 * Event Emitter Service
 * Manages real-time events for registration, waitlist, reminders, attendance
 * Resolves cascading SMTP/network integration failures by isolating execution phases.
 */

import EventEmitter from 'events';
import logger from '../utils/logger.js';
import { emitToRoom, getRoom, emitToRole } from '../config/socket.js';
import notificationsService from './notificationsService.js';
import notificationPreferencesService from './notificationPreferencesService.js';
import {
  sendRegistrationConfirmationEmail,
  sendWaitlistPromotionEmail,
  sendEventReminderEmail,
  sendAttendanceConfirmationEmail,
  sendEmail,
} from './emailService.js';
import { usersRepository } from '../repositories/usersRepository.js';
import { sendPushNotification, sendToTopic } from './pushNotificationService.js';
import gamificationService from './gamificationService.js';
import {
  sendPushNotification,
  sendToTopic,
} from "./pushNotificationService.js";

class RealTimeEventManager extends EventEmitter {
  constructor() {
    super();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Registration confirmed event
    this.on(
      "registration-confirmed",
      this.handleRegistrationConfirmed.bind(this)
    );

    // Waitlist promotion event
    this.on("waitlist-promotion", this.handleWaitlistPromotion.bind(this));

    // Event reminder event
    this.on("event-reminder", this.handleEventReminder.bind(this));

    // Attendance marked event
    this.on('attendance-marked', this.handleAttendanceMarked.bind(this));

    // New event published
    this.on('new-event-published', this.handleNewEventPublished.bind(this));

    // Team invitation
    this.on('team-invitation', this.handleTeamInvitation.bind(this));

    // Club/activity update
    this.on('club-update', this.handleClubUpdate.bind(this));

    // Admin announcement
    this.on('admin-announcement', this.handleAdminAnnouncement.bind(this));

    // Deadline reminder
    this.on('deadline-reminder', this.handleDeadlineReminder.bind(this));

    // Portfolio updated
    this.on('portfolio-updated', this.handlePortfolioUpdated.bind(this));

    // User stage changed
    this.on('user-stage-changed', this.handleUserStageChanged.bind(this));
  }

  /**
   * Handle user stage changed event
   */
  async handleUserStageChanged(data) {
    try {
      logger.info('Event: User stage changed', { userId: data.userId, newStage: data.newStage });

      const user = await usersRepository.getUserById(data.userId);
      if (!user || !user.email) return;

      let subject = '';
      let templateName = '';

      switch (data.newStage) {
        case 'NEW_USER':
          subject = 'Welcome to NexaSphere!';
          templateName = 'welcome';
          break;
        case 'ACTIVE':
          subject = 'You are now an Active User!';
          templateName = 'active-user';
          break;
        case 'POWER_USER':
          subject = 'Congratulations! You are a Power User!';
          templateName = 'power-user';
          break;
        default:
          return; // No automated email for this stage
      }

      await sendEmail({
        to: user.email,
        subject,
        templateName,
        data: { name: user.display_name || user.username },
      });
    } catch (error) {
      logger.error('Error handling user stage changed event', { error: error.message });
    }
  }

  /**
   * Handle portfolio updated event
   */
  async handlePortfolioUpdated(data) {
    try {
      logger.info('Event: Portfolio updated', { username: data.username });
      await gamificationService.evaluatePortfolio(data.username, data.portfolioData);
    } catch (error) {
      logger.error('Error handling portfolio updated event', { error: error.message });
    }
    this.on("attendance-marked", this.handleAttendanceMarked.bind(this));
  }

  /**
   * Handle registration confirmed event
   */
  async handleRegistrationConfirmed(data) {
    logger.info('Event: Registration confirmed processing started', { userId: data.userId, eventId: data.eventId });
    try {
      logger.info("Event: Registration confirmed", {
        userId: data.userId,
        eventId: data.eventId,
      });

      // 1. Durable persistence first. If this fails, we do NOT emit realtime updates.
      const note = await notificationsService.addNotification(
        data.userId || "global",
        {
          type: "connection",
          title: "Registration Confirmed",
          message: `You're registered for ${data.eventName}`,
          link: `/events/${data.eventId}`,
        }
      );

      // Send email (respect preferences)
      try {
        const pref = await notificationPreferencesService.shouldDeliver(
          data.userId || 'global',
          'registration_confirmations',
          'email'
        );
        if (pref.deliver) {
          await sendRegistrationConfirmationEmail(data.userEmail, {
            name: data.userName,
            eventName: data.eventName,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            eventLocation: data.eventLocation,
          });
        }
      } catch (e) {
        await sendRegistrationConfirmationEmail(data.userEmail, {
          name: data.userName,
          eventName: data.eventName,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          eventLocation: data.eventLocation,
    // 1. Send Email (Isolated)
    try {
      await sendRegistrationConfirmationEmail(data.userEmail, {
        name: data.userName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        eventLocation: data.eventLocation,
      });
      logger.info('Registration confirmed event: Email delivery triggered successfully');
    } catch (error) {
      logger.error('Registration confirmed event: Email delivery failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 2. Send Push Notification (Isolated)
    try {
      if (data.pushToken) {
        await sendPushNotification(data.pushToken, {
          title: "Registration Confirmed",
          body: `You're registered for ${data.eventName}`,
          data: {
            eventId: data.eventId,
            type: "registration",
          },
          link: `/events/${data.eventId}`,
        });
        logger.info('Registration confirmed event: Push notification triggered successfully');
      }
    } catch (error) {
      logger.error('Registration confirmed event: Push notification failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

      // Send push notification (respect preferences)
      if (data.pushToken) {
        try {
          const prefPush = await notificationPreferencesService.shouldDeliver(
            data.userId || 'global',
            'registration_confirmations',
            'push'
          );
          if (prefPush.deliver) {
            await sendPushNotification(data.pushToken, {
              title: 'Registration Confirmed',
              body: `You're registered for ${data.eventName}`,
              data: { eventId: data.eventId, type: 'registration' },
              link: `/events/${data.eventId}`,
            });
          }
        } catch (e) {
          await sendPushNotification(data.pushToken, {
            title: 'Registration Confirmed',
            body: `You're registered for ${data.eventName}`,
            data: { eventId: data.eventId, type: 'registration' },
            link: `/events/${data.eventId}`,
          });
        }
      }

      // Broadcast to notifications room
    // 3. Broadcast to notifications room (WebSocket - Isolated)
    try {
      emitToRoom(getRoom('notifications'), 'registration-confirmed', {
      // Broadcast to notifications room ONLY after successful persistence
      emitToRoom(getRoom("notifications"), "registration-confirmed", {
        userId: data.userId,
        eventId: data.eventId,
        eventName: data.eventName,
        notificationId: note.id,
        timestamp: new Date(),
      });
      logger.info('Registration confirmed event: WebSocket user broadcast sent');
    } catch (error) {
      logger.error('Registration confirmed event: WebSocket user broadcast failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

      // Persist notification (store per-user if userId provided)
      try {
        notificationsService.addNotification(data.userId || 'global', {
          type: 'connection',
          title: 'Registration Confirmed',
          message: `You're registered for ${data.eventName}`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist notification', { err: err.message });
      }

      // Notify admin
      emitToRole('membership_admin', 'admin:new-registration', {
    // 4. Persist notification (Isolated)
    try {
      notificationsService.addNotification(data.userId || 'global', {
        type: 'connection',
        title: 'Registration Confirmed',
        message: `You're registered for ${data.eventName}`,
        link: `/events/${data.eventId}`,
      });
      logger.info('Registration confirmed event: Notification persisted');
    } catch (error) {
      logger.warn('Registration confirmed event: Failed to persist notification', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 5. Notify admin dashboard (WebSocket - Isolated)
    try {
      emitToRoom(getRoom('admin'), 'admin:new-registration', {
      // Notify admin
      emitToRoom(getRoom("admin"), "admin:new-registration", {
        userId: data.userId,
        userName: data.userName,
        eventName: data.eventName,
        timestamp: new Date(),
      });
      logger.info('Registration confirmed event: WebSocket admin broadcast sent');
    } catch (error) {
      logger.error('Registration confirmed event: WebSocket admin broadcast failed', { 
        userId: data.userId, 
        error: error.message 
      logger.error("Error handling registration event", {
        error: error.message,
      });
    }
  }

  /**
   * Handle waitlist promotion event
   */
  async handleWaitlistPromotion(data) {
    logger.info('Event: Waitlist promotion processing started', { userId: data.userId, eventId: data.eventId });
    try {
      logger.info("Event: Waitlist promotion", {
        userId: data.userId,
        eventId: data.eventId,
      });

      // 1. Durable persistence first. If this fails, we do NOT emit realtime updates.
      const note = await notificationsService.addNotification(
        data.userId || "global",
        {
          type: "mention",
          title: "Waitlist Promotion",
          message: `You've been promoted for ${data.eventName}`,
          link: `/events/${data.eventId}`,
        }
      );

      // Send email (respect preferences)
      try {
        const pref = await notificationPreferencesService.shouldDeliver(
          data.userId || 'global',
          'announcements',
          'email'
        );
        if (pref.deliver) {
          await sendWaitlistPromotionEmail(data.userEmail, {
            name: data.userName,
            eventName: data.eventName,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            confirmationId: data.confirmationId,
            eventLink: `/events/${data.eventId}`,
          });
        }
      } catch (e) {
        await sendWaitlistPromotionEmail(data.userEmail, {
          name: data.userName,
          eventName: data.eventName,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          confirmationId: data.confirmationId,
          eventLink: `/events/${data.eventId}`,
    // 1. Send Email (Isolated)
    try {
      await sendWaitlistPromotionEmail(data.userEmail, {
        name: data.userName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        confirmationId: data.confirmationId,
        eventLink: `/events/${data.eventId}`,
      });
      logger.info('Waitlist promotion event: Email delivery triggered successfully');
    } catch (error) {
      logger.error('Waitlist promotion event: Email delivery failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 2. Send Push Notification (Isolated)
    try {
      if (data.pushToken) {
        await sendPushNotification(data.pushToken, {
          title: "🎉 Waitlist Promotion",
          body: `You've been promoted for ${data.eventName}!`,
          data: {
            eventId: data.eventId,
            type: "promotion",
          },
          link: `/events/${data.eventId}`,
          tag: "promotion",
        });
        logger.info('Waitlist promotion event: Push notification triggered successfully');
      }
    } catch (error) {
      logger.error('Waitlist promotion event: Push notification failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

      // Send push notification (respect preferences)
      if (data.pushToken) {
        try {
          const prefPush = await notificationPreferencesService.shouldDeliver(
            data.userId || 'global',
            'announcements',
            'push'
          );
          if (prefPush.deliver) {
            await sendPushNotification(data.pushToken, {
              title: '🎉 Waitlist Promotion',
              body: `You've been promoted for ${data.eventName}!`,
              data: { eventId: data.eventId, type: 'promotion' },
              link: `/events/${data.eventId}`,
              tag: 'promotion',
            });
          }
        } catch (e) {
          await sendPushNotification(data.pushToken, {
            title: '🎉 Waitlist Promotion',
            body: `You've been promoted for ${data.eventName}!`,
            data: { eventId: data.eventId, type: 'promotion' },
            link: `/events/${data.eventId}`,
            tag: 'promotion',
          });
        }
      }

      // Broadcast event
    // 3. Broadcast event (WebSocket - Isolated)
    try {
      emitToRoom(getRoom('notifications'), 'waitlist-promotion', {
      // Broadcast event ONLY after successful persistence
      emitToRoom(getRoom("notifications"), "waitlist-promotion", {
        userId: data.userId,
        eventId: data.eventId,
        notificationId: note.id,
        timestamp: new Date(),
      });
      logger.info('Waitlist promotion event: WebSocket user broadcast sent');
    } catch (error) {
      logger.error('Waitlist promotion event: WebSocket user broadcast failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

      // Persist notification
      try {
        notificationsService.addNotification(data.userId || 'global', {
          type: 'mention',
          title: 'Waitlist Promotion',
          message: `You've been promoted for ${data.eventName}`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist notification', { err: err.message });
      }

      // Notify admin
      emitToRole('events_admin', 'admin:waitlist-promotion', {
    // 4. Persist notification (Isolated)
    try {
      notificationsService.addNotification(data.userId || 'global', {
        type: 'mention',
        title: 'Waitlist Promotion',
        message: `You've been promoted for ${data.eventName}`,
        link: `/events/${data.eventId}`,
      });
      logger.info('Waitlist promotion event: Notification persisted');
    } catch (error) {
      logger.warn('Waitlist promotion event: Failed to persist notification', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 5. Notify admin dashboard (WebSocket - Isolated)
    try {
      emitToRoom(getRoom('admin'), 'admin:waitlist-promotion', {
      // Notify admin
      emitToRoom(getRoom("admin"), "admin:waitlist-promotion", {
        userId: data.userId,
        userName: data.userName,
        eventName: data.eventName,
        timestamp: new Date(),
      });
      logger.info('Waitlist promotion event: WebSocket admin broadcast sent');
    } catch (error) {
      logger.error('Error handling waitlist promotion event', { error: error.message });
      logger.error('Waitlist promotion event: WebSocket admin broadcast failed', { 
        userId: data.userId, 
        error: error.message 
      logger.error("Error handling waitlist promotion", {
        error: error.message,
      });
    }
  }

  /**
   * Handle event reminder event
   */
  async handleEventReminder(data) {
    logger.info('Event: Reminder sent processing started', { userId: data.userId, eventId: data.eventId });
    try {
      logger.info("Event: Reminder sent", {
        userId: data.userId,
        eventId: data.eventId,
      });

      // 1. Durable persistence first. If this fails, we do NOT emit realtime updates.
      const note = await notificationsService.addNotification(
        data.userId || "global",
        {
          type: "system",
          title: `Reminder: ${data.eventName}`,
          message: `${data.eventName} is starting soon`,
          link: `/events/${data.eventId}`,
        }
      );

      // Send email (respect preferences)
      try {
        const pref = await notificationPreferencesService.shouldDeliver(
          data.userId || 'global',
          'event_reminders',
          'email'
        );
        if (pref.deliver) {
          await sendEventReminderEmail(data.userEmail, {
            name: data.userName,
            eventName: data.eventName,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            eventLocation: data.eventLocation,
            timeUntilEvent: data.timeUntilEvent || 'soon',
            eventLink: `/events/${data.eventId}`,
          });
        }
      } catch (e) {
        await sendEventReminderEmail(data.userEmail, {
          name: data.userName,
          eventName: data.eventName,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          eventLocation: data.eventLocation,
          timeUntilEvent: data.timeUntilEvent || 'soon',
          eventLink: `/events/${data.eventId}`,
    // 1. Send Email (Isolated)
    try {
      await sendEventReminderEmail(data.userEmail, {
        name: data.userName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        eventLocation: data.eventLocation,
        timeUntilEvent: data.timeUntilEvent || "soon",
        eventLink: `/events/${data.eventId}`,
      });
      logger.info('Event reminder event: Email delivery triggered successfully');
    } catch (error) {
      logger.error('Event reminder event: Email delivery failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 2. Send Push Notification (Isolated)
    try {
      if (data.pushToken) {
        await sendPushNotification(data.pushToken, {
          title: `⏰ ${data.eventName} is coming up!`,
          body: `Don't forget: ${data.eventName} on ${data.eventDate}`,
          data: {
            eventId: data.eventId,
            type: "reminder",
          },
          link: `/events/${data.eventId}`,
          tag: "reminder",
        });
        logger.info('Event reminder event: Push notification triggered successfully');
      }
    } catch (error) {
      logger.error('Event reminder event: Push notification failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

      // Send push notification (respect preferences)
      if (data.pushToken) {
        try {
          const prefPush = await notificationPreferencesService.shouldDeliver(
            data.userId || 'global',
            'event_reminders',
            'push'
          );
          if (prefPush.deliver) {
            await sendPushNotification(data.pushToken, {
              title: `⏰ ${data.eventName} is coming up!`,
              body: `Don't forget: ${data.eventName} is starting in ${data.timeUntilEvent || 'soon'}`,
              data: { eventId: data.eventId, type: 'reminder' },
              link: `/events/${data.eventId}`,
              tag: 'reminder',
            });
          }
        } catch (e) {
          await sendPushNotification(data.pushToken, {
            title: `⏰ ${data.eventName} is coming up!`,
            body: `Don't forget: ${data.eventName} is starting in ${data.timeUntilEvent || 'soon'}`,
            data: { eventId: data.eventId, type: 'reminder' },
            link: `/events/${data.eventId}`,
            tag: 'reminder',
          });
        }
      }

      // Notify user via WebSocket
    // 3. Notify user via WebSocket (WebSocket - Isolated)
    try {
      emitToRoom(getRoom('notifications'), 'event-reminder', {
      // Notify user via WebSocket ONLY after successful persistence
      emitToRoom(getRoom("notifications"), "event-reminder", {
        userId: data.userId,
        eventId: data.eventId,
        eventName: data.eventName,
        notificationId: note.id,
        timestamp: new Date(),
      });

      // Persist notification
      try {
        notificationsService.addNotification(data.userId || 'global', {
          type: 'system',
          title: `Reminder: ${data.eventName}`,
          message: `${data.eventName} is starting in ${data.timeUntilEvent || 'soon'}`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist notification', { err: err.message });
      }
      logger.info('Event reminder event: WebSocket user broadcast sent');
    } catch (error) {
      logger.error('Event reminder event: WebSocket user broadcast failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 4. Persist notification (Isolated)
    try {
      notificationsService.addNotification(data.userId || 'global', {
        type: 'system',
        title: `Reminder: ${data.eventName}`,
        message: `${data.eventName} is starting soon`,
        link: `/events/${data.eventId}`,
      });
      logger.info('Event reminder event: Notification persisted');
    } catch (error) {
      logger.warn('Event reminder event: Failed to persist notification', { 
        userId: data.userId, 
        error: error.message 
      });
    } catch (error) {
      logger.error("Error handling event reminder", { error: error.message });
    }
  }

  /**
   * Handle attendance marked event
   */
  async handleAttendanceMarked(data) {
    logger.info('Event: Attendance marked processing started', { userId: data.userId, eventId: data.eventId });
    try {
      logger.info("Event: Attendance marked", {
        userId: data.userId,
        eventId: data.eventId,
      });

      // 1. Durable persistence first. If this fails, we do NOT emit realtime updates.
      const note = await notificationsService.addNotification(
        data.userId || "global",
        {
          type: "system",
          title: "Attendance Marked",
          message: `Attendance for ${data.eventName} recorded. You earned ${data.points || 0} points.`,
          link: `/events/${data.eventId}`,
        }
      );

      // Send email (respect preferences)
      try {
        const pref = await notificationPreferencesService.shouldDeliver(
          data.userId || 'global',
          'messages',
          'email'
        );
        if (pref.deliver) {
          await sendAttendanceConfirmationEmail(data.userEmail, {
            name: data.userName,
            eventName: data.eventName,
            eventDate: data.eventDate,
    // 1. Send Email (Isolated)
    try {
      await sendAttendanceConfirmationEmail(data.userEmail, {
        name: data.userName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        points: data.points,
      });
      logger.info('Attendance marked event: Email delivery triggered successfully');
    } catch (error) {
      logger.error('Attendance marked event: Email delivery failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 2. Send Push Notification (Isolated)
    try {
      if (data.pushToken) {
        await sendPushNotification(data.pushToken, {
          title: "Attendance Marked",
          body: `Your attendance for ${data.eventName} has been recorded`,
          data: {
            eventId: data.eventId,
            points: data.points,
          });
        }
      } catch (e) {
        await sendAttendanceConfirmationEmail(data.userEmail, {
          name: data.userName,
          eventName: data.eventName,
          eventDate: data.eventDate,
          points: data.points,
            type: "attendance",
          },
        });
        logger.info('Attendance marked event: Push notification triggered successfully');
      }
    } catch (error) {
      logger.error('Attendance marked event: Push notification failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

      // Send push notification (respect preferences)
      if (data.pushToken) {
        try {
          const prefPush = await notificationPreferencesService.shouldDeliver(
            data.userId || 'global',
            'messages',
            'push'
          );
          if (prefPush.deliver) {
            await sendPushNotification(data.pushToken, {
              title: 'Attendance Marked',
              body: `Your attendance for ${data.eventName} has been recorded`,
              data: { eventId: data.eventId, points: data.points, type: 'attendance' },
            });
          }
        } catch (e) {
          await sendPushNotification(data.pushToken, {
            title: 'Attendance Marked',
            body: `Your attendance for ${data.eventName} has been recorded`,
            data: { eventId: data.eventId, points: data.points, type: 'attendance' },
          });
        }
      }

      // Broadcast event
    // 3. Broadcast event (WebSocket - Isolated)
    try {
      emitToRoom(getRoom('notifications'), 'attendance-marked', {
      // Broadcast event ONLY after successful persistence
      emitToRoom(getRoom("notifications"), "attendance-marked", {
        userId: data.userId,
        eventId: data.eventId,
        points: data.points,
        notificationId: note.id,
        timestamp: new Date(),
      });
      logger.info('Attendance marked event: WebSocket user broadcast sent');
    } catch (error) {
      logger.error('Attendance marked event: WebSocket user broadcast failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }

      // Persist notification
      try {
        notificationsService.addNotification(data.userId || 'global', {
          type: 'system',
          title: 'Attendance Marked',
          message: `Attendance for ${data.eventName} recorded. You earned ${data.points || 0} points.`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist notification', { err: err.message });
      }

      // Notify admin
      emitToRole('events_admin', 'admin:attendance-marked', {
    // 4. Persist notification (Isolated)
    try {
      notificationsService.addNotification(data.userId || 'global', {
        type: 'system',
        title: 'Attendance Marked',
        message: `Attendance for ${data.eventName} recorded. You earned ${data.points || 0} points.`,
        link: `/events/${data.eventId}`,
      });
      logger.info('Attendance marked event: Notification persisted');
    } catch (error) {
      logger.warn('Attendance marked event: Failed to persist notification', { 
        userId: data.userId, 
        error: error.message 
      });
    }

    // 5. Notify admin dashboard (WebSocket - Isolated)
    try {
      emitToRoom(getRoom('admin'), 'admin:attendance-marked', {
      // Notify admin
      emitToRoom(getRoom("admin"), "admin:attendance-marked", {
        userId: data.userId,
        userName: data.userName,
        eventName: data.eventName,
        points: data.points,
        timestamp: new Date(),
      });
      logger.info('Attendance marked event: WebSocket admin broadcast sent');
    } catch (error) {
      logger.error('Attendance marked event: WebSocket admin broadcast failed', { 
        userId: data.userId, 
        error: error.message 
      });
    }
  }

  /**
   * Handle new event published
   */
  async handleNewEventPublished(data) {
    try {
      logger.info('Event: New event published', {
        eventId: data.eventId,
        eventName: data.eventName,
      });
      emitToRoom(getRoom('notifications'), 'new-event', {
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: data.eventDate,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification('global', {
          type: 'system',
          title: `New Event: ${data.eventName}`,
          message: `Registration is now open for ${data.eventName}`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist new-event notification', { err: err.message });
      }
      emitToRole('events_admin', 'admin:event-published', {
        eventId: data.eventId,
        eventName: data.eventName,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error handling new event published', { error: error.message });
    }
  }

  /**
   * Handle team invitation
   */
  async handleTeamInvitation(data) {
    try {
      logger.info('Event: Team invitation', { userId: data.userId, teamName: data.teamName });
      if (data.userId) {
        emitToRoom(`user-${data.userId}`, 'team-invitation', {
          teamName: data.teamName,
          inviterName: data.inviterName,
          timestamp: new Date(),
        });
        try {
          notificationsService.addNotification(data.userId, {
            type: 'message',
            title: `Team Invitation: ${data.teamName}`,
            message: `${data.inviterName || 'Someone'} invited you to join ${data.teamName}`,
            link: `/team/${data.teamId}`,
          });
        } catch (err) {
          logger.warn('Failed to persist team-invite notification', { err: err.message });
        }
      }
    } catch (error) {
      logger.error('Error handling team invitation', { error: error.message });
    }
  }

  /**
   * Handle club/activity update
   */
  async handleClubUpdate(data) {
    try {
      logger.info('Event: Club update', { clubName: data.clubName });
      emitToRoom(getRoom('notifications'), 'club-update', {
        clubName: data.clubName,
        message: data.message,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification('global', {
          type: 'system',
          title: `${data.clubName} Update`,
          message: data.message || 'New update from your club',
          link: data.link || null,
        });
      } catch (err) {
        logger.warn('Failed to persist club-update notification', { err: err.message });
      }
    } catch (error) {
      logger.error('Error handling club update', { error: error.message });
    }
  }

  /**
   * Handle admin announcement
   */
  async handleAdminAnnouncement(data) {
    try {
      logger.info('Event: Admin announcement', { title: data.title });
      emitToRoom(getRoom('notifications'), 'admin-announcement', {
        title: data.title,
        message: data.message,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification('global', {
          type: 'system',
          title: data.title || 'Announcement',
          message: data.message || '',
          link: data.link || null,
        });
      } catch (err) {
        logger.warn('Failed to persist announcement notification', { err: err.message });
      }
    } catch (error) {
      logger.error('Error handling admin announcement', { error: error.message });
    }
  }

  /**
   * Handle deadline reminder
   */
  async handleDeadlineReminder(data) {
    try {
      logger.info('Event: Deadline reminder', { eventName: data.eventName });
      emitToRoom(getRoom('notifications'), 'deadline-reminder', {
        eventName: data.eventName,
        deadline: data.deadline,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification(data.userId || 'global', {
          type: 'system',
          title: `Deadline Reminder: ${data.eventName}`,
          message: `Registration for ${data.eventName} closes ${data.deadline || 'soon'}`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist deadline-reminder notification', { err: err.message });
      }
    } catch (error) {
      logger.error('Error handling deadline reminder', { error: error.message });
      logger.error("Error handling attendance event", { error: error.message });
    }
  }

  /**
   * Handle new event published
   */
  async handleNewEventPublished(data) {
    try {
      logger.info('Event: New event published', {
        eventId: data.eventId,
        eventName: data.eventName,
      });
      emitToRoom(getRoom('notifications'), 'new-event', {
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: data.eventDate,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification('global', {
          type: 'system',
          title: `New Event: ${data.eventName}`,
          message: `Registration is now open for ${data.eventName}`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist new-event notification', { err: err.message });
      }
      emitToRole('events_admin', 'admin:event-published', {
        eventId: data.eventId,
        eventName: data.eventName,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error handling new event published', { error: error.message });
    }
  }

  /**
   * Handle team invitation
   */
  async handleTeamInvitation(data) {
    try {
      logger.info('Event: Team invitation', { userId: data.userId, teamName: data.teamName });
      if (data.userId) {
        emitToRoom(`user-${data.userId}`, 'team-invitation', {
          teamName: data.teamName,
          inviterName: data.inviterName,
          timestamp: new Date(),
        });
        try {
          notificationsService.addNotification(data.userId, {
            type: 'message',
            title: `Team Invitation: ${data.teamName}`,
            message: `${data.inviterName || 'Someone'} invited you to join ${data.teamName}`,
            link: `/team/${data.teamId}`,
          });
        } catch (err) {
          logger.warn('Failed to persist team-invite notification', { err: err.message });
        }
      }
    } catch (error) {
      logger.error('Error handling team invitation', { error: error.message });
    }
  }

  /**
   * Handle club/activity update
   */
  async handleClubUpdate(data) {
    try {
      logger.info('Event: Club update', { clubName: data.clubName });
      emitToRoom(getRoom('notifications'), 'club-update', {
        clubName: data.clubName,
        message: data.message,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification('global', {
          type: 'system',
          title: `${data.clubName} Update`,
          message: data.message || 'New update from your club',
          link: data.link || null,
        });
      } catch (err) {
        logger.warn('Failed to persist club-update notification', { err: err.message });
      }
    } catch (error) {
      logger.error('Error handling club update', { error: error.message });
    }
  }

  /**
   * Handle admin announcement
   */
  async handleAdminAnnouncement(data) {
    try {
      logger.info('Event: Admin announcement', { title: data.title });
      emitToRoom(getRoom('notifications'), 'admin-announcement', {
        title: data.title,
        message: data.message,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification('global', {
          type: 'system',
          title: data.title || 'Announcement',
          message: data.message || '',
          link: data.link || null,
        });
      } catch (err) {
        logger.warn('Failed to persist announcement notification', { err: err.message });
      }
    } catch (error) {
      logger.error('Error handling admin announcement', { error: error.message });
    }
  }

  /**
   * Handle deadline reminder
   */
  async handleDeadlineReminder(data) {
    try {
      logger.info('Event: Deadline reminder', { eventName: data.eventName });
      emitToRoom(getRoom('notifications'), 'deadline-reminder', {
        eventName: data.eventName,
        deadline: data.deadline,
        timestamp: new Date(),
      });
      try {
        notificationsService.addNotification(data.userId || 'global', {
          type: 'system',
          title: `Deadline Reminder: ${data.eventName}`,
          message: `Registration for ${data.eventName} closes ${data.deadline || 'soon'}`,
          link: `/events/${data.eventId}`,
        });
      } catch (err) {
        logger.warn('Failed to persist deadline-reminder notification', { err: err.message });
      }
    } catch (error) {
      logger.error('Error handling deadline reminder', { error: error.message });
    }
  }

  /**
   * Emit custom event
   */
  emitEvent(eventName, data) {
    this.emit(eventName, data);
    logger.debug("Custom event emitted", { event: eventName });
  }
}

// Create singleton instance
const eventManager = new RealTimeEventManager();

export default eventManager;
