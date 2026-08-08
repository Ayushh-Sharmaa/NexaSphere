import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Recommendation Engine – uses content-based filtering.
 *
 * Strategy:
 *   1. Fetch the user's saved interests (tags).
 *   2. Fetch events the user has already interacted with (to exclude them).
 *   3. Score every candidate event by counting how many of its tags overlap
 *      with the user's interests, boosting recently-created events slightly.
 *   4. Return the top-N scored events.
 */

export const recommendationService = {
  // ── Preferences ──────────────────────────────────────────────────────────

  async getPreferences(userId) {
    return prisma.userPreference.findUnique({ where: { userId } });
  },

  async upsertPreferences(userId, { interests = [], preferredDays = [] }) {
    return prisma.userPreference.upsert({
      where: { userId },
      create: { userId, interests, preferredDays },
      update: { interests, preferredDays },
    });
  },

  // ── Interactions ──────────────────────────────────────────────────────────

  async trackInteraction(userId, eventId, type) {
    const validTypes = ['viewed', 'registered', 'attended', 'liked'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid interaction type: ${type}`);
    }
    return prisma.userEventInteraction.upsert({
      where: { userId_eventId_type: { userId, eventId, type } },
      create: { userId, eventId, type },
      update: { createdAt: new Date() },
    });
  },

  async getInteractions(userId) {
    return prisma.userEventInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ── Recommendations ───────────────────────────────────────────────────────

  /**
   * Returns up to `limit` recommended events for `userId`.
   *
   * Falls back to trending events (most interactions) when the user has no
   * preferences yet (cold-start problem).
   */
  async getRecommendations(userId, { limit = 10, page = 1 } = {}) {
    const [preferences, interactions] = await Promise.all([
      prisma.userPreference.findUnique({ where: { userId } }),
      prisma.userEventInteraction.findMany({ where: { userId }, select: { eventId: true } }),
    ]);

    const interactedEventIds = new Set(interactions.map((i) => String(i.eventId)));

    // Fetch all upcoming/active events (excluding already-interacted ones)
    // NOTE: events are stored via the Supabase / JSON store in this project,
    // so we call the eventsRepository adapter here to stay consistent.
    // For scoring we work with whatever the repository returns.
    const { eventsRepository } = await import('../repositories/eventsRepository.js');
    const { rows: allEvents } = await eventsRepository.list({ page: 1, limit: 200 });

    const candidates = allEvents.filter((e) => !interactedEventIds.has(String(e.id)));

    if (candidates.length === 0) {
      return { recommendations: [], total: 0, source: 'empty' };
    }

    // Content-based scoring
    const userInterests = preferences?.interests ?? [];

    if (userInterests.length === 0) {
      // Cold-start: return newest events
      const sorted = candidates
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const offset = (page - 1) * limit;
      return {
        recommendations: sorted.slice(offset, offset + limit),
        total: sorted.length,
        source: 'trending',
      };
    }

    const scored = candidates.map((event) => {
      const eventTags = Array.isArray(event.tags) ? event.tags.map((t) => t.toLowerCase()) : [];
      const tagOverlap = userInterests.filter((i) => eventTags.includes(i.toLowerCase())).length;

      // Recency boost: newer events get a small bonus (0–1 normalised to 0–0.5)
      const ageMs = new Date() - new Date(event.createdAt || 0);
      const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      const recencyBoost = Math.max(0, 1 - ageMs / maxAgeMs) * 0.5;

      return { event, score: tagOverlap + recencyBoost };
    });

    scored.sort((a, b) => b.score - a.score);

    const offset = (page - 1) * limit;
    const paginated = scored.slice(offset, offset + limit);

    return {
      recommendations: paginated.map((s) => ({
        ...s.event,
        _score: parseFloat(s.score.toFixed(3)),
      })),
      total: scored.length,
      source: 'content-based',
    };
  },

  // ── Similar Events ────────────────────────────────────────────────────────

  async getSimilarEvents(eventId, { limit = 6 } = {}) {
    const { eventsRepository } = await import('../repositories/eventsRepository.js');
    const { rows: allEvents } = await eventsRepository.list({ page: 1, limit: 200 });

    const targetStringId = String(eventId);
    const target = allEvents.find((e) => String(e.id) === targetStringId);
    if (!target) return [];

    const targetTags = Array.isArray(target.tags) ? target.tags.map((t) => t.toLowerCase()) : [];

    const similar = allEvents
      .filter((e) => String(e.id) !== targetStringId)
      .map((e) => {
        const eTags = Array.isArray(e.tags) ? e.tags.map((t) => t.toLowerCase()) : [];
        const overlap = targetTags.filter((t) => eTags.includes(t)).length;
        return { event: e, score: overlap };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.event);

    return similar;
  },

  // ── Trending Events ───────────────────────────────────────────────────────

  async getTrendingEvents({ limit = 10 } = {}) {
    // Count interactions per event in the last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const counts = await prisma.userEventInteraction.groupBy({
      by: ['eventId'],
      where: { createdAt: { gte: since } },
      _count: { eventId: true },
      orderBy: { _count: { eventId: 'desc' } },
      take: limit,
    });

    return counts.map((c) => ({ eventId: c.eventId, interactionCount: c._count.eventId }));
  },
};
