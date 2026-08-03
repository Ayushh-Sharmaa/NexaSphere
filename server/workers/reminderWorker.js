import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger.js';
import { eventRemindersQueueName } from '../services/queueService.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { withDb } from '../repositories/db.js';
import eventManager from '../services/eventEmitterService.js';

let connection;
if (process.env.REDIS_URL) {
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

/**
 * Worker for processing scheduled event reminders via BullMQ.
 */
export const reminderWorker = connection
  ? new Worker(
      eventRemindersQueueName,
      async (job) => {
        const { eventId, userId, type } = job.data;
        logger.info(`[reminderWorker] Processing ${type} job ${job.id} for event ${eventId}`);

        const event = await eventsRepository.getById(eventId);
        if (!event) {
          throw new Error(`Event ${eventId} not found`);
        }

        if (
          type === 'event-reminder' ||
          type === 'event-reminder-24h' ||
          type === 'event-reminder-1h' ||
          type === 'deadline-reminder'
        ) {
          // Fetch confirmed attendees
          let attendees = [];
          await withDb(async (client) => {
            let query = `
          SELECT r.full_name, r.email, u.id as user_id, p.push_token 
          FROM event_registrations r
          LEFT JOIN student_users u ON r.email = u.email
          LEFT JOIN push_subscriptions p ON u.id = p.user_id
          WHERE r.event_id = $1 AND r.status = 'confirmed'
        `;
            const params = [eventId];

            if (userId) {
              query += ` AND u.id = $2`;
              params.push(userId);
            }

            const { rows } = await client.query(query, params);
            attendees = rows;
          });

          if (attendees.length === 0) {
            logger.info(`[reminderWorker] No confirmed attendees to notify for event ${eventId}`);
            return { sent: 0 };
          }

          let sentCount = 0;
          for (const attendee of attendees) {
            try {
              // Emit internal event so eventEmitterService handles preferences, emails, and push notifications
              // Use 'event-reminder' as the base event name so listeners don't have to change
              const emitType = type.startsWith('event-reminder') ? 'event-reminder' : type;
              eventManager.emit(emitType, {
                userId: attendee.user_id,
                userEmail: attendee.email,
                userName: attendee.full_name,
                eventName: event.name,
                eventDate: event.date,
                eventTime: event.time || '',
                eventLocation: event.location || 'TBA',
                eventId: event.id,
                pushToken: attendee.push_token,
                timeUntilEvent,
              });
              sentCount++;
            } catch (err) {
              logger.error(
                `[reminderWorker] Failed to emit ${type} for user ${attendee.email}: ${err.message}`
              );
            }
          }

          return { sent: sentCount, total: attendees.length };
        } else {
          throw new Error(`Unknown job type: ${type}`);
        }
      },
      { connection }
    )
  : null;

if (reminderWorker) {
  reminderWorker.on('completed', (job, returnvalue) => {
    logger.info(`[reminderWorker] Job ${job.id} completed. Sent ${returnvalue?.sent} reminders.`);
  });

  reminderWorker.on('failed', (job, err) => {
    logger.error(`[reminderWorker] Job ${job.id} failed: ${err.message}`);
  });
}
