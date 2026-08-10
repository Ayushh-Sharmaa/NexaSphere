import { eventsRepository } from '../repositories/eventsRepository.js';

export const eventConflictService = {
  async checkConflicts() {
    const data = await eventsRepository.list({ page: 1, limit: 100 });
    const events = data?.rows || [];

    const conflicts = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const first = events[i];
        const second = events[j];

        if (
          first.date &&
          second.date &&
          new Date(first.date).getTime() === new Date(second.date).getTime()
        ) {
          conflicts.push({
            eventA: first.name || first.shortName,
            eventB: second.name || second.shortName,
            venueA: first.location,
            venueB: second.location,
            date: first.date,
            reason: 'Both events are scheduled at the same time.',
            reason: "Both events are scheduled at the same time.",
          });
        }
      }
    }

    return conflicts;
  },

  async checkVenueAvailability(venue, date) {
    const data = await eventsRepository.list({ page: 1, limit: 100 });
    const events = data?.rows || [];

    const booked = events.some(
      (event) =>
        event.location?.toLowerCase() === venue.toLowerCase() &&
        new Date(event.date).toDateString() ===
          new Date(date).toDateString()
    );

    return {
      venue,
      date,
      available: !booked,
    };
  },

  async attendanceImpact() {
    const data = await eventsRepository.list({ page: 1, limit: 100 });
    const events = data?.rows || [];

    return events.map((event) => ({
      event: event.name || event.shortName,
      registrations: event.registrationCount || event.registrations?.length || 0,
      impact: (event.registrationCount || event.registrations?.length || 0) > 100 ? 'High' : 'Low',
      registrations:
        event.registrationCount ||
        event.registrations?.length ||
        0,
      impact:
        (event.registrationCount ||
          event.registrations?.length ||
          0) > 100
          ? "High"
          : "Low",
    }));
  },

  async scheduleRecommendation() {
    const data = await eventsRepository.list({ page: 1, limit: 100 });
    const events = data?.rows || [];

    return events.map((event) => ({
      event: event.name || event.shortName,
      currentDate: event.date,
      recommendation: 'No scheduling conflict detected. Current schedule is suitable.',
      recommendation:
        "No scheduling conflict detected. Current schedule is suitable.",
    }));
  },

  async calendarEvents() {
    const data = await eventsRepository.list({ page: 1, limit: 100 });
    const events = data?.rows || [];

    return events.map((event) => ({
      title: event.name || event.shortName,
      start: event.date,
      end: event.endDate || event.date,
      venue: event.location,
    }));
  },

  async getAlerts() {
    const conflicts = await this.checkConflicts();

    return conflicts.map((conflict) => ({
      level: 'warning',
      level: "warning",
      message: `${conflict.eventA} conflicts with ${conflict.eventB}`,
      date: conflict.date,
    }));
  },
};
