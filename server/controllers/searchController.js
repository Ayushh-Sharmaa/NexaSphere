import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { activityEventsService } from '../services/activityEventsService.js';
import { usersRepository } from '../repositories/usersRepository.js';
import { forumRepository } from '../repositories/forumRepository.js';
import { resourcesRepository } from '../repositories/resourcesRepository.js';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { withDb } from '../repositories/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const searchController = {
  async search(req, res) {
    try {
      const q = (req.query.q || '').trim();
      const type = (req.query.type || 'all').trim();
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 50);
      const skip = (page - 1) * limit;

      if (!q || q.length < 2) {
        return sendSuccess(res, { results: [], total: 0, page, limit });
      }

      const { isTypesenseEnabled, typesenseClient } = await import('../config/typesense.js');

      if (isTypesenseEnabled) {
        try {
          const searches = [];
          if (type === 'all' || type === 'events') {
            searches.push({
              collection: 'events',
              q,
              query_by: 'name,description,shortName,tags',
              highlight_full_fields: 'name,description,shortName',
            });
          }
          if (type === 'all' || type === 'members') {
            searches.push({
              collection: 'members',
              q,
              query_by: 'name,role,bio,skills',
              highlight_full_fields: 'name,role,bio',
            });
          }
          if (type === 'all' || type === 'activities') {
            searches.push({
              collection: 'activities',
              q,
              query_by: 'title,description,subtitle,tags',
              highlight_full_fields: 'title,description,subtitle',
            });
          }

          const response = await typesenseClient.multiSearch.perform({ searches });
          let results = [];

          response.results.forEach((colRes, idx) => {
            const collectionName = searches[idx].collection;
            const hits = colRes.hits || [];
            hits.forEach((hit) => {
              const doc = hit.document;
              const highlights = hit.highlights || [];

              // Extract highlighted terms if available, else use raw text
              const getHighlight = (field, fallback) => {
                const h = highlights.find((hl) => hl.field === field);
                return h ? h.snippet : fallback;
              };

              if (collectionName === 'events') {
                results.push({
                  id: doc.id,
                  type: 'event',
                  title: getHighlight('name', doc.name || doc.shortName),
                  description: getHighlight('description', doc.description),
                  tags: doc.tags,
                  category: doc.category,
                  url: `/events/${doc.id}`,
                  score: hit.text_match || 0,
                });
              } else if (collectionName === 'members') {
                results.push({
                  id: doc.id,
                  type: 'member',
                  title: getHighlight('name', doc.name),
                  description: getHighlight('role', doc.role) || getHighlight('bio', doc.bio),
                  tags: doc.skills,
                  url: `/team`,
                  score: hit.text_match || 0,
                });
              } else if (collectionName === 'activities') {
                results.push({
                  id: doc.id,
                  type: 'activity',
                  title: getHighlight('title', doc.title),
                  description:
                    getHighlight('description', doc.description) ||
                    getHighlight('subtitle', doc.subtitle),
                  tags: doc.tags,
                  url: `/activities/${encodeURIComponent(doc.id)}`,
                  score: hit.text_match || 0,
                });
              }
            });
          });

          // Sort by match score
          results.sort((a, b) => b.score - a.score);

          const typesenseTotal = results.length;
          const paginated = results.slice(skip, skip + limit);

          return sendSuccess(res, {
            results: paginated,
            total: typesenseTotal,
            query: q,
            page,
            limit,
          });
        } catch (typesenseErr) {
          console.error('Typesense search failed, falling back to local search:', typesenseErr);
        }
      }

      // FALLBACK: Local search algorithm using local in-memory DB lists
      const query = q.toLowerCase();
      // 1. Log analytics
      await searchAnalyticsRepository.logSearch(q, 0, req.user?.id);

      // 2. Try Elasticsearch
      let results = await elasticsearchService.search(q, type, limit, skip);
      let trueTotal = results.length;

      // 3. Fallback to Fuse.js
      if (results.length === 0) {
        let allItems = [];
        if (type === 'all' || type === 'events') {
          const events = await eventsRepository.list({ page: 1, limit: 100 });
          const matched = (events?.rows || []).map((ev) => ({

      if (!q || q.length < 2) {
        return res.json({ results: [], total: 0 });
      }

      const query = q.toLowerCase();
      let results = [];

      if (type === 'all' || type === 'events') {
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
            type: 'event',
            title: ev.name || ev.shortName,
            description: ev.description,
            image: ev.image,
            date: ev.date,
            tags: ev.tags,
            category: ev.category,
            url: `/events/${ev.id}`,
          }));
          allItems = [...allItems, ...matched];
        }

        if (type === 'all' || type === 'members') {
          const members = await coreTeamService.listMembers();
          const matched = (members || []).map((m) => ({
        results = [...results, ...matched];
      }

      if (type === 'all' || type === 'members') {
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
            type: 'member',
            title: m.name,
            description: m.role || m.bio,
            image: m.avatar || m.image,
            tags: m.skills,
            url: `/team`,
          }));
          allItems = [...allItems, ...matched];
        }

        if (type === 'all' || type === 'activities') {
          const activities = await activityEventsService.listAllActivities();
          const matched = Object.entries(activities || {}).map(([key, a]) => ({
        results = [...results, ...matched];
      }

      if (type === 'all' || type === 'activities') {
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
            type: 'activity',
            title: a.title || key,
            description: a.description || a.subtitle,
            image: a.image,
            tags: a.tags,
            url: `/activities/${encodeURIComponent(key)}`,
          }));
          allItems = [...allItems, ...matched];
        }

        const fuse = new Fuse(allItems, {
          keys: ['title', 'description', 'tags'],
          includeScore: true,
          threshold: 0.4, // typo tolerance
        });

        results = fuse.search(q).map((r) => ({ ...r.item, score: r.score }));
        trueTotal = results.length;
        results = results.slice(skip, skip + limit);
      }

      const trueTotal = results.length;
      results = results.slice(skip, skip + limit);

        try {
          const portfolios = await portfolioRepository.listAll();
          let allPortfolios = portfolios;
          if (!allPortfolios || allPortfolios.length === 0) {
            const PORTFOLIOS_FILE = path.join(__dirname, '..', 'data', 'portfolios.json');
            try {
              const raw = await fs.readFile(PORTFOLIOS_FILE, 'utf8');
              const data = JSON.parse(raw);
              allPortfolios = Object.values(data);
            } catch {}
          }
          const portMatched = (allPortfolios || [])
            .filter(
              (p) =>
                p.username?.toLowerCase().includes(query) ||
                p.title?.toLowerCase().includes(query) ||
                p.bio?.toLowerCase().includes(query) ||
                p.skills?.some((s) => s.toLowerCase().includes(query))
            )
            .map((p) => ({
              id: p.username,
              type: 'portfolio',
              title: p.title || p.username,
              description: p.bio,
              image: p.avatarUrl || p.avatar_url,
              tags: p.skills,
              url: `/p/${p.username}`,
            }));
          matchedUsers = [...matchedUsers, ...portMatched];
        } catch (e) {
          console.error('Search portfolios error:', e);
        }

        // Deduplicate
        const seen = new Set();
        const uniqueUsers = [];
        for (const u of matchedUsers) {
          const key = u.url.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueUsers.push(u);
          }
        }
        results = [...results, ...uniqueUsers];
      }

      if (type === 'all' || type === 'communities' || type === 'groups') {
        try {
          const categories = await forumRepository.getCategories();
          let allCats = categories;
          if (!allCats || allCats.length === 0) {
            allCats = [
              {
                id: 1,
                name: 'General',
                slug: 'general',
                description: 'General discussions about the club and community',
                icon: '💬',
              },
              {
                id: 2,
                name: 'Events',
                slug: 'events',
                description: 'Questions and discussions about past and upcoming events',
                icon: '📅',
              },
              {
                id: 3,
                name: 'Technical Help',
                slug: 'technical-help',
                description: 'Get help with technical issues, code, and projects',
                icon: '💻',
              },
              {
                id: 4,
                name: 'Projects',
                slug: 'projects',
                description: 'Share and discuss community projects',
                icon: '🚀',
              },
              {
                id: 5,
                name: 'Career',
                slug: 'career',
                description: 'Career advice, internships, and professional development',
                icon: '🎯',
              },
            ];
          }
          const matched = (allCats || [])
            .filter(
              (c) =>
                c.name?.toLowerCase().includes(query) ||
                c.description?.toLowerCase().includes(query)
            )
            .map((c) => ({
              id: String(c.id),
              type: 'community',
              title: `${c.icon || '📌'} ${c.name}`,
              description: c.description,
              url: `/forum?category=${c.slug}`,
            }));
          results = [...results, ...matched];
        } catch (e) {
          console.error('Search communities error:', e);
        }
      }

      if (type === 'all' || type === 'posts' || type === 'discussions') {
        try {
          const threadsRes = await forumRepository.listThreads({ q: query, limit });
          const matched = (threadsRes?.rows || []).map((t) => ({
            id: String(t.id),
            type: 'post',
            title: t.title,
            description: t.content,
            tags: t.tags,
            date: t.createdAt,
            url: `/forum/${t.id}`,
          }));
          results = [...results, ...matched];
        } catch (e) {
          console.error('Search posts error:', e);
        }
      }

      if (type === 'all' || type === 'resources') {
        try {
          const resourcesRes = await resourcesRepository.list({ q: query, limit });
          const matched = (resourcesRes?.rows || []).map((r) => ({
            id: String(r.id),
            type: 'resource',
            title: r.title,
            description: r.description,
            tags: r.tags,
            category: r.category,
            url: `/resources`,
          }));
          results = [...results, ...matched];
        } catch (e) {
          console.error('Search resources error:', e);
        }
      }

      const allResultsCount = results.length;
      results = results.slice(0, limit);

      return sendSuccess(res, { results, total: allResultsCount, query: q });

    } catch (err) {
      console.error('Search error:', err);
      return sendError(req, res, 'Search failed', 500, 'INTERNAL_ERROR', { results: [], total: 0 });
        results = [...results, ...matched];
      }

      const trueTotal = results.length;
      results = results.slice(0, limit);

      return res.json({ results, total: trueTotal, query: q });
    } catch (err) {
      console.error('Search error:', err);
      return res.status(500).json({ error: 'Search failed', results: [], total: 0 });
    }
  },

  async trending(req, res) {
    try {
      const popularSearches = await searchAnalyticsRepository.getPopularSearches(5);
      const events = await eventsRepository.list({ page: 1, limit: 100 });
      const allEvents = events?.rows || [];

      const now = new Date();
      const sorted = allEvents
        .filter((ev) => ev.status !== 'completed' || new Date(ev.date) > now)
        .sort((a, b) => {
          const aRegs = a.registrationCount || a.registrations?.length || 0;
          const bRegs = b.registrationCount || b.registrations?.length || 0;
          if (aRegs !== bRegs) return bRegs - aRegs;
          return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        })
        .slice(0, 10)
        .map((ev) => ({
          id: ev.id,
          title: ev.name || ev.shortName,
          description: ev.description,
          date: ev.date,
          tags: ev.tags,
          registrationCount: ev.registrationCount || ev.registrations?.length || 0,
          image: ev.image,
          status: ev.status,
          url: `/events/${ev.id}`,
        }));

      return sendSuccess(res, { trending: sorted, popularSearches });
    } catch (err) {
      console.error('Trending error:', err);
      return sendError(req, res, 'Failed to fetch trending', 500, 'INTERNAL_ERROR', {
        trending: [],
        popularSearches: [],
      });
      return res.json({ trending: sorted });
    } catch (err) {
      console.error('Trending error:', err);
      return res.status(500).json({ error: 'Failed to fetch trending', trending: [] });
    }
  },

  async recommendations(req, res) {
    try {
      const { userId, eventId } = req.query;
      const events = await eventsRepository.list({ page: 1, limit: 100 });
      const allEvents = events?.rows || [];

      let recommended = [];

      if (eventId) {
        const target = allEvents.find((ev) => String(ev.id) === String(eventId));
        if (target) {
          const targetTags = new Set((target.tags || []).map((t) => t.toLowerCase()));
          const scored = allEvents
            .filter((ev) => String(ev.id) !== String(eventId))
            .map((ev) => {
              const evTags = new Set((ev.tags || []).map((t) => t.toLowerCase()));
              const intersection = [...targetTags].filter((t) => evTags.has(t)).length;
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
          .filter((ev) => ev.status !== 'completed')
          .sort((a, b) => {
            const aScore = (a.registrationCount || 0) * 0.4 + (new Date(a.date) > now ? 0.3 : 0);
            const bScore = (b.registrationCount || 0) * 0.4 + (new Date(b.date) > now ? 0.3 : 0);
            return bScore - aScore;
          })
          .slice(0, 10)
          .map((ev) => ({
            id: ev.id,
            title: ev.name || ev.shortName,
            description: ev.description,
            date: ev.date,
            tags: ev.tags,
            score: (ev.registrationCount || 0) * 0.4 + (new Date(ev.date) > now ? 0.3 : 0),
            url: `/events/${ev.id}`,
          }));
      }

      return sendSuccess(res, { recommendations: recommended });
    } catch (err) {
      console.error('Recommendations error:', err);
      return sendError(req, res, 'Failed to fetch recommendations', 500, 'INTERNAL_ERROR', {
        recommendations: [],
      });
      return res.json({ recommendations: recommended });
    } catch (err) {
      console.error('Recommendations error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch recommendations', recommendations: [] });
    }
  },
};
