import { withDb } from "../repositories/db.js";
import Fuse from "fuse.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

/**
 * Advanced Search Controller
 * Implements relevance ranking, faceted counts, and analytics.
 */
export const handleAdvancedSearch = async (req, res) => {
  const { q, type, ...filters } = req.query;

  try {
    // 1. Fetch data across scopes (Simulated multi-index search)
    // In a scaled prod env, this would hit Elasticsearch
    const [events, users, projects] = await Promise.all([
      prisma.event.findMany({ where: { published: true } }),
      prisma.user.findMany({
        select: { id: true, name: true, skills: true, major: true },
      }),
      prisma.project.findMany(),
    ]);

    // 2. Aggregate all searchable items
    const allItems = [
      ...events.map((e) => ({
        id: e.id,
        type: "Event",
        title: e.name,
        snippet: e.description,
        tags: e.tags,
        date: e.startDate,
      })),
      ...users.map((u) => ({
        id: u.id,
        type: "User",
        title: u.name,
        snippet: `${u.major} - ${(u.skills || []).join(", ")}`,
        tags: u.skills || [],
      })),
      ...projects.map((p) => ({
        id: p.id,
        type: "Project",
        title: p.title,
        snippet: p.description,
        tags: p.technologies,
      })),
    ];

    // 3. Fuzzy Search and Relevance Ranking using Fuse.js
    const fuse = new Fuse(allItems, {
      keys: ["title", "snippet", "tags"],
      includeScore: true,
      threshold: 0.3,
    });

    let results = fuse.search(q).map((r) => ({ ...r.item, score: r.score }));

    // 4. Apply Faceted Filters (AND Logic)
    if (type) {
      results = results.filter((r) => r.type === type);
    }

    // Dynamic Facet Calculation based on current results
    const facets = {
      Category: [
        {
          name: "Event",
          count: results.filter((r) => r.type === "Event").length,
        },
        {
          name: "User",
          count: results.filter((r) => r.type === "User").length,
        },
        {
          name: "Project",
          count: results.filter((r) => r.type === "Project").length,
        },
      ],
      Trending: [
        {
          name: "React",
          count: results.filter((r) => r.tags?.includes("React")).length,
        },
        {
          name: "AI",
          count: results.filter((r) => r.tags?.includes("AI")).length,
        },
      ],
    };

    // 5. Analytics: Log query
    await logSearchAnalytics(q, results.length, req.user?.id);

    return sendSuccess(res, {
      results: results.slice(0, 50), // Limit for performance
      facets,
      suggestions: results.length === 0 ? generateSuggestions(q) : [],
    });
  } catch (error) {
    console.error("Search failure:", error);
    return sendError(
      req,
      res,
      "Search engine unavailable",
      500,
      "INTERNAL_ERROR"
    );
  }
};

async function logSearchAnalytics(query, resultCount, userId) {
  // Store in DB for admin dashboard "Zero-result queries" analysis
  try {
    await prisma.searchAnalytics.create({
      data: { query, resultCount, userId, timestamp: new Date() },
    });
  } catch (e) {
    /* silent fail for analytics */
  }
}

function generateSuggestions(query) {
  const dictionary = ["hackathon", "react", "python", "workshop", "javascript"];
  const fuse = new Fuse(dictionary);
  return fuse
    .search(query)
    .map((r) => r.item)
    .slice(0, 2);
}
