import { cacheService } from "../services/cacheService.js";
import logger from "../utils/logger.js";

const ALLOWED_PREFIXES = ["response:", "query:", "view:"];

export function cacheResponse(duration = 3600) {
  return async (req, res, next) => {
    const cacheKey = cacheService.buildKey(
      "response",
      req.originalUrl || req.url
    );
    let cached = null;
    try {
      cached = await cacheService.get(cacheKey);
    } catch (error) {
      logger.warn(
        { err: error.message, path: req && req.path },
        "Cache read failed, continuing without cached response"
      );
    }

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    res.setHeader("X-Cache", "MISS");

    const originalJson = res.json.bind(res);
    res.json = function (data) {
      cacheService.set(cacheKey, data, duration);
      originalJson(data);
    };

    next();
  };
}

export function invalidateCache(pattern) {
  return async (req, res, next) => {
    res.on("finish", async () => {
      if (res.statusCode < 400) {
        const sanitized = sanitizeCachePattern(pattern);
        if (sanitized) {
          await cacheService.delPattern(sanitized);
        }
      }
    });
    next();
  };
}
