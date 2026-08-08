import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger.js';

// BullMQ needs its own Redis connection to avoid blocking operations
// interfering with the standard application cache operations.
let connection;
if (process.env.REDIS_URL) {
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });
}

export const eventRemindersQueueName = 'event-reminders';

// Initialize the queue if Redis is configured
export const eventRemindersQueue = connection
  ? new Queue(eventRemindersQueueName, { connection })
  : null;

/**
 * Schedule an event reminder job.
 * @param {string} eventId
 * @param {string} userId (optional) target specific user or leave null for all participants
 * @param {string} type 'event-reminder' or 'deadline-reminder'
 * @param {number} delayMs time in ms to delay the job execution
 */
export async function scheduleReminderJob({
  eventId,
  userId = null,
  type = 'event-reminder',
  delayMs = 0,
}) {
  if (!eventRemindersQueue) {
    logger.warn('[queueService] Cannot schedule reminder, Redis is not configured.');
    return null;
  }

  try {
    const job = await eventRemindersQueue.add(
      type,
      { eventId, userId, type },
      {
        delay: delayMs,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 25s, 125s
        },
        removeOnComplete: {
          age: 3600 * 24, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 3600 * 24 * 7, // Keep failed jobs for 7 days
        },
      }
    );
    logger.info(
      `[queueService] Scheduled ${type} for event ${eventId} (Job ID: ${job.id}) in ${delayMs}ms`
    );
    return job;
  } catch (error) {
    logger.error(`[queueService] Failed to schedule reminder job: ${error.message}`);
    throw error;
  }
}
