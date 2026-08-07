import { eventsRepository } from "../repositories/eventsRepository.js";
import { coreTeamService } from "../services/coreTeamService.js";
import { activityEventsService } from "../services/activityEventsService.js";

export const searchController = {
  async search(req, res) {
    try {
      const q = (req.query.q || "").trim();
      const type = (req.query.type || "all").trim();
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);

      if (!q || q.length < 2) {
        return res.json({ results: [], total: 0 });
      }

      const query = q.toLowerCase();
      let results = [];

      if (type === "all" || type === "events") {
        const events = await eventsRepository.list({ page: 1, limit: 100 });
        const matched = (events?.rows || [])
          .filter(
            (ev) =>
              ev.name?.toLowerCase().includes(query) ||
              ev.description?.toLowerCase().includes(query) ||
              ev.shortName?.toLowerCase().includes(query) ||
              ev.location?.toLowerCase().includes(query) ||
              ev.tags?.some((t) => t.toLowerCase().includes(query))
          )
          .map((ev) => ({
            id: ev.id,
            type: "event",
            title: ev.name || ev.shortName,
            description: ev.description,
            image: ev.image,
            date: ev.date,
            tags: ev.tags,
            category: ev.category,
            url: `/events/${ev.id}`,
          }));
        results = [...results, ...matched];
      }

      if (type === "all" || type === "members") {
        const members = await coreTeamService.listMembers();
        const matched = (members || [])
          .filter(
            (m) =>
              m.name?.toLowerCase().includes(query) ||
              m.role?.toLowerCase().includes(query) ||
              m.bio?.toLowerCase().includes(query) ||
              m.skills?.some((s) => s.toLowerCase().includes(query))
          )
          .map((m) => ({
            id: m.id,
            type: "member",
            title: m.name,
            description: m.role || m.bio,
            image: m.avatar || m.image,
            tags: m.skills,
            url: `/team`,
          }));
        results = [...results, ...matched];
      }

      if (type === "all" || type === "activities") {
        const activities = await activityEventsService.listAllActivities();
        const matched = Object.entries(activities || {})
          .filter(
            ([key, a]) =>
              key.toLowerCase().includes(query) ||
              a.title?.toLowerCase().includes(query) ||
              a.description?.toLowerCase().includes(query) ||
              a.subtitle?.toLowerCase().includes(query)
          )
          .map(([key, a]) => ({
            id: key,
            type: "activity",
            title: a.title || key,
            description: a.description || a.subtitle,
            image: a.image,
            tags: a.tags,
            url: `/activities/${encodeURIComponent(key)}`,
          }));
        results = [...results, ...matched];
      }

      const trueTotal = results.length;
      results = results.slice(0, limit);

      return res.json({ results, total: trueTotal, query: q });
    } catch (err) {
      console.error("Search error:", err);
      return res
        .status(500)
        .json({ error: "Search failed", results: [], total: 0 });
    }
  },

  async trending(req, res) {
    try {
      const events = await eventsRepository.list({ page: 1, limit: 100 });
      const allEvents = events?.rows || [];

      const now = new Date();
      const sorted = allEvents
        .filter((ev) => ev.status !== "completed" || new Date(ev.date) > now)
        .sort((a, b) => {
          const aRegs = a.registrationCount || a.registrations?.length || 0;
          const bRegs = b.registrationCount || b.registrations?.length || 0;
          if (aRegs !== bRegs) return bRegs - aRegs;
          return (
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          );
        })
        .slice(0, 10)
        .map((ev) => ({
          id: ev.id,
          title: ev.name || ev.shortName,
          description: ev.description,
          date: ev.date,
          tags: ev.tags,
          registrationCount:
            ev.registrationCount || ev.registrations?.length || 0,
          image: ev.image,
          status: ev.status,
          url: `/events/${ev.id}`,
        }));

      return res.json({ trending: sorted });
    } catch (err) {
      console.error("Trending error:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch trending", trending: [] });
    }
  },

  async recommendations(req, res) {
    try {
      const { userId, eventId } = req.query;
      const events = await eventsRepository.list({ page: 1, limit: 100 });
      const allEvents = events?.rows || [];

      let recommended = [];

      if (eventId) {
        const target = allEvents.find(
          (ev) => String(ev.id) === String(eventId)
        );
        if (target) {
          const targetTags = new Set(
            (target.tags || []).map((t) => t.toLowerCase())
          );
          const scored = allEvents
            .filter((ev) => String(ev.id) !== String(eventId))
            .map((ev) => {
              const evTags = new Set(
                (ev.tags || []).map((t) => t.toLowerCase())
              );
              const intersection = [...targetTags].filter((t) =>
                evTags.has(t)
              ).length;
              const union = new Set([...targetTags, ...evTags]).size;
              const similarity = union > 0 ? intersection / union : 0;
              return { ...ev, score: similarity };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
          recommended = scored.map((ev) => ({
            id: ev.id,
            title: ev.name || ev.shortName,
            description: ev.description,
            date: ev.date,
            tags: ev.tags,
            score: ev.score,
            url: `/events/${ev.id}`,
          }));
        }
      } else {
        const now = new Date();
        recommended = allEvents
          .filter((ev) => ev.status !== "completed")
          .sort((a, b) => {
            const aScore =
              (a.registrationCount || 0) * 0.4 +
              (new Date(a.date) > now ? 0.3 : 0);
            const bScore =
              (b.registrationCount || 0) * 0.4 +
              (new Date(b.date) > now ? 0.3 : 0);
            return bScore - aScore;
          })
          .slice(0, 10)
          .map((ev) => ({
            id: ev.id,
            title: ev.name || ev.shortName,
            description: ev.description,
            date: ev.date,
            tags: ev.tags,
            score:
              (ev.registrationCount || 0) * 0.4 +
              (new Date(ev.date) > now ? 0.3 : 0),
            url: `/events/${ev.id}`,
          }));
      }

      return res.json({ recommendations: recommended });
    } catch (err) {
      console.error("Recommendations error:", err);
      return res.status(500).json({
        error: "Failed to fetch recommendations",
        recommendations: [],
      });
    }
  },
};
