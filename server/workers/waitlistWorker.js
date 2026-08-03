import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger.js';
import { waitlistExpiryQueueName, scheduleWaitlistExpiryJob } from '../services/queueService.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { registrationsRepository } from '../repositories/registrationsRepository.js';
import { emitToRole } from '../config/socket.js';
import { broadcastSSEEvent } from '../services/sseService.js';

let connection;
if (process.env.REDIS_URL) {
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

/**
 * Worker for processing waitlist expiry jobs via BullMQ.
 */
export const waitlistWorker = connection
  ? new Worker(
      waitlistExpiryQueueName,
      async (job) => {
        const { eventId, email, type } = job.data;
        logger.info(`[waitlistWorker] Processing ${type} job ${job.id} for event ${eventId}`);

        const event = await eventsRepository.getById(eventId);
        if (!event) {
          throw new Error(`Event ${eventId} not found`);
        }

        if (type === 'waitlist-expiry') {
          const reg = await registrationsRepository.findByEmailAndEvent(email, eventId);
          if (!reg) {
            logger.info(`[waitlistWorker] Registration not found for ${email} on event ${eventId}`);
            return { processed: false, reason: 'not_found' };
          }

          if (reg.waitlist_status === 'pending') {
            // Expire the spot
            await registrationsRepository.expireWaitlistSpot(eventId, email);
            logger.info(`[waitlistWorker] Spot expired for ${email} on event ${eventId}`);

            // Promote next person
            const promoted = await registrationsRepository.promoteFromWaitlist(eventId);
            if (promoted) {
              try {
                await scheduleWaitlistExpiryJob({
                  eventId,
                  email: promoted.email,
                  delayMs: 24 * 60 * 60 * 1000,
                });
                emitToRole('events_admin', 'admin:waitlist-promoted', {
                  eventId,
                  userName: promoted.full_name,
                  email: promoted.email,
                  timestamp: new Date(),
                });
                broadcastSSEEvent('waitlist_promotion', {
                  eventId,
                  email: promoted.email,
                  timestamp: new Date().toISOString(),
                });
              } catch (realtimeErr) {
                logger.error(
                  `[waitlistWorker] Failed to broadcast promotion: ${realtimeErr.message}`
                );
              }
            }
            return { processed: true, expired: true, promotedNext: !!promoted };
          } else {
            logger.info(
              `[waitlistWorker] Spot already confirmed or cancelled for ${email} on event ${eventId}`
            );
            return { processed: true, expired: false, reason: 'not_pending' };
          }
        } else {
          throw new Error(`Unknown job type: ${type}`);
        }
      },
      { connection }
    )
  : null;

if (waitlistWorker) {
  waitlistWorker.on('completed', (job, returnvalue) => {
    logger.info(`[waitlistWorker] Job ${job.id} completed. Expired: ${returnvalue?.expired}`);
  });

  waitlistWorker.on('failed', (job, err) => {
    logger.error(`[waitlistWorker] Job ${job.id} failed: ${err.message}`);
  });
}
