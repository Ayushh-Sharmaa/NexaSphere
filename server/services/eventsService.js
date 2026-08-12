import { eventsRepository } from "../repositories/eventsRepository.js";

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
  },

  async createEvent(event) {
    return eventsRepository.create(event);
  },

  async updateEvent(id, patch) {
    return eventsRepository.update(id, patch);
  },

  async deleteEvent(id) {
    return eventsRepository.delete(id);
  },
};
