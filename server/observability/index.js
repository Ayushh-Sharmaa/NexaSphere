/**
 * Observability bootstrap: tracing, metrics, and /metrics endpoint.
 */

import { initTracing } from "./tracing.js";
import { httpMetricsMiddleware } from "./httpMetrics.js";
import { getMetricsText, getMetricsContentType } from "./metrics.js";
import { startBusinessMetricsCollectors } from "./businessMetrics.js";
import { sendError } from "../utils/responseHelper.js";

export function initObservability(app) {
  if (process.env.OTEL_ENABLED !== "false") {
    initTracing();
  }

  const metricsEnabled = process.env.METRICS_ENABLED !== "false";

  if (metricsEnabled) {
    app.use(httpMetricsMiddleware);

    app.get("/metrics", async (req, res) => {
      const authToken = process.env.METRICS_AUTH_TOKEN;
      if (authToken) {
        const provided = req.headers.authorization?.replace(/^Bearer\s+/i, "");
        if (provided !== authToken) {
          return sendError(req, res, "Forbidden", 403, "FORBIDDEN");
        }
      }

      try {
        res.set("Content-Type", getMetricsContentType());
        res.end(await getMetricsText());
      } catch (err) {
        res.status(500).end(`# metrics error: ${err.message}`);
      }
    });

    if (process.env.NODE_ENV !== "test") {
      startBusinessMetricsCollectors();
    }
  }

  return app;
}

export { recordCacheHit, recordCacheMiss } from "./metrics.js";
export {
  recordEventRegistration,
  recordEventCreated,
  recordPageLoad,
} from "./metrics.js";
export { getActiveTraceId, injectTraceHeaders } from "./tracing.js";
