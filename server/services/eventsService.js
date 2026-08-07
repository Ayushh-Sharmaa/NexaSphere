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
import { eventsRepository } from "../repositories/eventsRepository.js";
import { eventSchema, eventPatchSchema } from "../validators/eventSchemas.js";
import { readContent, writeContent } from "../storage/contentFileStore.js";
import { sanitizeEventRecord } from "../utils/sanitize.js";

const isDbConfigured = () => Boolean(process.env.DATABASE_URL);
import { eventsRepository } from "../repositories/eventsRepository.js";
import { eventSchema, eventPatchSchema } from "../validators/eventSchemas.js";

export const eventsService = {
  async listEvents({ page = 1, limit = 20 } = {}) {
    if (isDbConfigured()) {
      const result = await eventsRepository.list({ page, limit });
      const arr = result.rows || [];
      arr.rows = result.rows || [];
      arr.total = result.total ?? 0;
      return arr;
    }
    const content = await readContent();
    const rows = (content.events || []).map((e) => sanitizeEventRecord(e));
    const offset = (page - 1) * limit;
    const paginatedRows = rows.slice(offset, offset + limit);

    const arr = paginatedRows;
    arr.rows = paginatedRows;
    arr.total = rows.length;
    return arr;
import { eventsRepository } from "../repositories/eventsRepository.js";
import { baseEventSchema, eventSchema } from "../validators/eventSchemas.js";
import cacheService from "./cacheService.js";

export const eventsService = {
  async listEvents({ page = 1, limit = 20 } = {}) {
    const cacheKey = `events:list:${page}:${limit}`;
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      console.log(`[Events Service] Cache HIT for key "${cacheKey}"`);
      return cached;
    }

    console.log(
      `[Events Service] Cache MISS for key "${cacheKey}". Fetching from database.`
    );
    const result = await eventsRepository.list({ page, limit });
    cacheService.set(cacheKey, result);
    return result;
  async listEvents({ page = 1, limit = 20, status, studentGroups } = {}) {
    return eventsRepository.list({ page, limit, studentGroups });
  },

  async createEvent(input) {
    const event = eventSchema.parse(input);
    let created;
    let createdEvents = [];

    if (event.recurrencePattern && event.recurrenceEndDate) {
      const { generatePrefixedId } = await import('../utils/uuid.js');
      const seriesId = generatePrefixedId('series');
      let currentDate = new Date(event.date);
      const endDate = new Date(event.recurrenceEndDate);
      let occurrenceIndex = 1;

      while (currentDate <= endDate && occurrenceIndex <= 365) {
        const occEvent = {
          ...event,
          id: `${event.id}-${occurrenceIndex}`,
          date: currentDate.toISOString(),
          seriesId,
          occurrenceIndex,
        };

        const createdOcc = await eventsRepository.create(occEvent);
        createdEvents.push(createdOcc);

        if (event.recurrencePattern === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (event.recurrencePattern === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (event.recurrencePattern === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          break; // custom not fully supported for auto-generation yet
        }
        occurrenceIndex++;
      }
      created = createdEvents[0]; // main event
    } else {
      created = await eventsRepository.create(event);
      createdEvents.push(created);
    }

    recordEventCreated();

    // Emit real-time notification to all connected clients
    try {
      emitToRoom('notifications-room', 'event-published', {
        eventId: created.id,
        eventName: created.name,
      });
    } catch (socketErr) {
      logger.warn(`Could not emit event-published notification: ${socketErr.message}`);
    }

    // Attempt to schedule a reminder if date is parseable
    try {
      const eventDate = new Date(created.date);
      if (!isNaN(eventDate.getTime())) {
        const now = Date.now();

        // Schedule reminder 24 hours before the event
        const delay24h = eventDate.getTime() - 24 * 60 * 60 * 1000 - now;
        if (delay24h > 0) {
          await scheduleReminderJob({
            eventId: created.id,
            type: 'event-reminder-24h',
            delayMs: delay24h,
          });
        }

        // Schedule reminder 1 hour before the event
        const delay1h = eventDate.getTime() - 60 * 60 * 1000 - now;
        if (delay1h > 0) {
          await scheduleReminderJob({
            eventId: created.id,
            type: 'event-reminder-1h',
            delayMs: delay1h,
          });
        }
      }
    } catch (err) {
      logger.warn(`Could not schedule reminders for event ${created.id}: ${err.message}`);
    }

    return created;
  },

  async updateEvent(id, input, updateSeries = false) {
    const patch = eventSchema.partial().parse({ ...input, id });
    const updated = await eventsRepository.update(id, patch);

    if (updated) {
      try {
        const eventDate = new Date(updated.date);
        if (!isNaN(eventDate.getTime())) {
          const now = Date.now();

          const delay24h = eventDate.getTime() - 24 * 60 * 60 * 1000 - now;
          if (delay24h > 0) {
            await scheduleReminderJob({
              eventId: updated.id,
              type: 'event-reminder-24h',
              delayMs: delay24h,
            });
          }

          const delay1h = eventDate.getTime() - 60 * 60 * 1000 - now;
          if (delay1h > 0) {
            await scheduleReminderJob({
              eventId: updated.id,
              type: 'event-reminder-1h',
              delayMs: delay1h,
            });
          }
        }
      } catch (err) {
        logger.warn(`Could not update reminders for event ${updated.id}: ${err.message}`);
      }
    }

    return updated;
  },

  async deleteEvent(id, deleteSeries = false) {
    let deleted;
    if (deleteSeries) {
      // Find event to get series_id
      const events = await eventsRepository.listAll({ search: id });
      const event = events.find((e) => e.id === id);
      if (event && event.seriesId) {
        deleted = await eventsRepository.deleteSeries(event.seriesId);
      } else {
        deleted = await eventsRepository.delete(id);
      }
    } else {
      deleted = await eventsRepository.delete(id);
    }

    import('../utils/redis.js').then((m) => m.clearCache('events:list:*'));
    return deleted;
  },

  async adminListEvents({
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    category,
    location,
    search,
  } = {}) {
    return eventsRepository.listAll({
      page,
      limit,
      status,
      startDate,
      endDate,
      category,
      location,
      search,
    });
    if (isDbConfigured()) {
      return eventsRepository.create(event);
    }
    const content = await readContent();
    content.events = content.events || [];
    const now = new Date().toISOString();
    const toInsert = {
      ...event,
      createdAt: now,
      updatedAt: now,
    };
    content.events.unshift(toInsert);
    await writeContent(content);
    return sanitizeEventRecord(toInsert);
    const created = await eventsRepository.create(event);
    recordEventCreated();
    return created;
  },

  async updateEvent(id, input) {
    const patch = eventPatchSchema.parse({ ...input, id });
    if (isDbConfigured()) {
      return eventsRepository.update(id, patch);
    }
    const content = await readContent();
    const idx = content.events.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const now = new Date().toISOString();
    content.events[idx] = {
      ...content.events[idx],
      ...patch,
      id,
      updatedAt: now,
    };
    await writeContent(content);
    return sanitizeEventRecord(content.events[idx]);
    return eventsRepository.update(id, patch);
  },

  async deleteEvent(id) {
    if (isDbConfigured()) {
      return eventsRepository.delete(id);
    }
    const content = await readContent();
    const before = (content.events || []).length;
    content.events = (content.events || []).filter((e) => e.id !== id);
    if (content.events.length === before) return false;
    await writeContent(content);
    return true;
    const created = await eventsRepository.create(event);

    // Invalidate distributed events cache after successful commit
    await cacheService.invalidateCache("events");
    return created;
  },

  async updateEvent(id, input) {
    const patch = baseEventSchema.partial().parse({ ...input, id });
    const updated = await eventsRepository.update(id, patch);

    // Invalidate distributed events cache after successful commit
    if (updated) {
      await cacheService.invalidateCache("events");
    }
    return updated;
  },

  async deleteEvent(id) {
    const deleted = await eventsRepository.delete(id);

    // Invalidate distributed events cache after successful commit
    if (deleted) {
      await cacheService.invalidateCache("events");
    }
    return deleted;
  },
};
