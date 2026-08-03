import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { activityEventsRepository } from '../repositories/activityEventsRepository.js';
import { coreTeamService } from './coreTeamService.js';
import { activityEventSchema } from '../validators/activityEventSchemas.js';
import { sanitizeActivityEventRecord } from '../utils/sanitize.js';
import cacheService from './cacheService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');

export const activityEventsService = {
  async listAllActivities() {
    try {
      const raw = await fs.readFile(CONTENT_FILE, 'utf8');
      const data = JSON.parse(raw);
      return data.activityEvents || {};
    } catch {
      return {};
    }
  },

  async listActivityEvents(activityKey, { page = 1, limit = 20 } = {}) {
    const cacheKey = `activity_events:list:${activityKey}:${page}:${limit}`;
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      logger.info(`[Activity Events Service] Cache HIT for key "${cacheKey}"`);
      return cached;
    }

    logger.info(
      `[Activity Events Service] Cache MISS for key "${cacheKey}". Fetching from database.`
    );
    const { rows, total } = await activityEventsRepository.listByActivityKey(
      activityKey,
      { page, limit }
    );
    const result = {
      rows: rows.map(row => sanitizeActivityEventRecord(row)),
      total,
      page,
      limit,
    };
    cacheService.set(cacheKey, result);
    return result;
  },

  async addActivityEvent(activityKey, input) {
    await this.assertCanManage(input);
    await coreTeamService.assertCanManageActivityEvent(input);

    const payload = {
      id: input.id,
      name: input.name,
      date: input.date,
      tagline: input.tagline,
      description: input.description,
      status: input.status,
      createdBy: {
        name: input.coreTeamName || '',
        email: input.coreTeamEmail || '',
        phone: input.coreTeamPhone || '',
      },
    };

    const validated = activityEventSchema.parse(payload);
    const created = await activityEventsRepository.create(activityKey, validated);

    // Invalidate distributed cache after database mutation
    await cacheService.invalidateCache('activity_events');
    return sanitizeActivityEventRecord(created);
  },

  async deleteActivityEvent(activityKey, eventId, input) {
    if (input) {
      await coreTeamService.assertCanManageActivityEvent(input);
    }
    const deleted = await activityEventsRepository.delete(activityKey, eventId);

    // Invalidate distributed cache after database mutation
    if (deleted) {
      await cacheService.invalidateCache('activity_events');
    }
    return deleted;
  },

  async assertCanManage(body) {
    await coreTeamService.assertCanManageActivityEvent(body);
  },

  async listAll() {
    return activityEventsRepository.listAll();
  },
};
