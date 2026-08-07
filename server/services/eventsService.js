import { eventsRepository } from "../repositories/eventsRepository.js";
import { eventSchema } from "../validators/eventSchemas.js";
import { recordEventCreated } from "../observability/metrics.js";

export const eventsService = {
  async listEvents({ page = 1, limit = 20 } = {}) {
    return eventsRepository.list({ page, limit });
  },

  async createEvent(input) {
    const event = eventSchema.parse(input);
    const created = await eventsRepository.create(event);
    recordEventCreated();
    return created;
  },

  async updateEvent(id, input) {
    const patch = eventSchema.partial().parse({ ...input, id });
    return eventsRepository.update(id, patch);
  },

  async deleteEvent(id) {
    return eventsRepository.delete(id);
  },
  async adminListEvents({ page = 1, limit = 20 } = {}) {
    return eventsRepository.listAll({ page, limit });
  },
};
