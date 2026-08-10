import { eventsRepository } from '../repositories/eventsRepository.js';
import { eventSchema } from '../validators/eventSchemas.js';
import { recordEventCreated } from '../observability/metrics.js';
import { scheduleReminderJob } from './queueService.js';
import logger from '../utils/logger.js';
import { emitToRoom } from '../config/socket.js';

export const eventsService = {
  async listEvents({
    page = 1,
    limit = 20,
    status,
    studentGroups,
    startDate,
    endDate,
    category,
    location,
    search,
  } = {}) {
    return eventsRepository.list({
      page,
      limit,
      status,
      studentGroups,
      startDate,
      endDate,
      category,
      location,
      search,
    });

const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

}
}