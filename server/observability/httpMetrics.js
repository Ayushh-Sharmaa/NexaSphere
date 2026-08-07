/**
 * Express middleware for Prometheus HTTP metrics.
 */

import logger from "../utils/logger.js";
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
} from "./metrics.js";

const SLOW_REQUEST_THRESHOLD = parseInt(
  process.env.SLOW_REQUEST_THRESHOLD || "1000",
  10
);
const PERFORMANCE_ENABLED =
  process.env.ENABLE_PERFORMANCE_MONITORING !== "false";

function normalizeRoute(req) {
  if (req.route?.path) {
    const base = req.baseUrl || "";
    const path =
      typeof req.route.path === "string"
        ? req.route.path
        : req.route.path.join("|");
    return `${base}${path}`;
  }
  return req.path || "unknown";
}

export function httpMetricsMiddleware(req, res, next) {
  if (!PERFORMANCE_ENABLED) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const durationMs = durationSec * 1000;
    const method = req.method;
    const route = normalizeRoute(req);
    const status = String(res.statusCode);
    const labels = { method, route, status };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSec);

    if (res.statusCode >= 500) {
      httpErrorsTotal.inc(labels);
    }

    if (durationMs > SLOW_REQUEST_THRESHOLD) {
      logger.warn("Slow request detected", {
        method,
        route,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
        threshold: SLOW_REQUEST_THRESHOLD,
      });
    }

    if ((process.env.LOG_FORMAT || "").toLowerCase() === "json") {
      logger.http("HTTP request", {
        method,
        route,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
        userId: req.user?.id || req.adminSession?.username || null,
      });
    }
  });

  next();
}
