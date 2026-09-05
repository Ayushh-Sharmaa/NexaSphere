import { eventsRepository } from '../repositories/eventsRepository.js';
import { eventSchema } from '../validators/eventSchemas.js';

export const eventsService = {
  async listEvents() {
    return eventsRepository.list();
  },

  async createEvent(input) {
    const event = eventSchema.parse(input);
    return eventsRepository.create(event);
  },

  async updateEvent(id, input) {
    const patch = eventSchema.partial().parse({ ...input, id });
    return eventsRepository.update(id, patch);
  },

  async deleteEvent(id) {
    return eventsRepository.delete(id);
  },
};

