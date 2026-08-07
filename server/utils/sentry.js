/**
 * Sentry Configuration for Backend
 * Enterprise error tracking and monitoring
 */

import * as Sentry from "@sentry/node";

let nodeProfilingIntegration = null;

/**
 * Initialize Sentry for backend monitoring
 * @param {Object} app - Express app instance
 */
async function initializeSentry(app) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const dsn = process.env.SENTRY_DSN;

  if (!dsn && !isDevelopment) {
    console.warn("Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  // Safely lazy-load profiling runtime inside async scope to prevent startup syntax failure
  if (!nodeProfilingIntegration) {
    try {
      const profiling = await import("@sentry/profiling-node");
      nodeProfilingIntegration = profiling.nodeProfilingIntegration;
    } catch (error) {
      nodeProfilingIntegration = null;
    }
  }

  Sentry.init({
    dsn: dsn,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      ...(nodeProfilingIntegration ? [nodeProfilingIntegration()] : []),
    ],
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    profilesSampleRate: isDevelopment ? 1.0 : 0.1,
    attachStacktrace: true,
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error) {
        // Group by error name and first line of error message
        event.fingerprint = [
          "{{ default }}",
          error.name || "Error",
          (error.message || "").split("\n")[0],
        ];
      }
      return event;
    },
  });

  try {
    const os = await import("os");
    Sentry.setContext("environment_metadata", {
      "Node version": process.version,
      OS: os.platform(),
      "OS Release": os.release(),
    });
  } catch (err) {
    // Graceful fallback if os import fails
  }

  return Sentry;
}

/**
 * Add Sentry error handler middleware
 * @param {Object} app - Express app instance
 */
function addSentryErrorHandler(app) {
  // The error handler must be the last middleware on the app
  if (typeof Sentry.setupExpressErrorHandler === "function") {
    Sentry.setupExpressErrorHandler(app);
  } else if (
    Sentry.Handlers &&
    typeof Sentry.Handlers.errorHandler === "function"
  ) {
    app.use(Sentry.Handlers.errorHandler());
  }
}

/**
 * Capture custom exception to Sentry
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 * @param {string} level - Error level (fatal, error, warning, info)
 */
function captureException(error, context = {}, level = "error") {
  Sentry.captureException(error, {
    level,
    tags: context.tags || {},
    extra: {
      userId: context.userId,
      requestPath: context.requestPath,
      method: context.method,
      ...context.extra,
    },
  });
}

/**
 * Capture message to Sentry
 * @param {string} message - Message to capture
 * @param {string} level - Message level
 * @param {Object} context - Additional context
 */
function captureMessage(message, level = "info", context = {}) {
  Sentry.captureMessage(message, {
    level,
    tags: context.tags || {},
    extra: context.extra || {},
  });
}

/**
 * Add breadcrumb for tracking
 * @param {Object} data - Breadcrumb data
 */
function addBreadcrumb(data) {
  Sentry.addBreadcrumb({
    category: data.category || "custom",
    message: data.message || "",
    level: data.level || "info",
    data: data.data || {},
    timestamp: Date.now() / 1000,
  });
}

/**
 * Register system lifecycle event hooks to gracefully close and flush Sentry
 * @param {number} timeout - Maximum time in ms to wait for pending events to flush
 */
function registerSentryShutdown(timeout = 2000) {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`[Sentry] Received ${signal}. Flushing pending events...`);

      try {
        // close() flushes queued events and disables the SDK from accepting new events
        const cleanClose = await Sentry.close(timeout);
        if (cleanClose) {
          console.log(
            "[Sentry] Successfully flushed buffered telemetry and closed."
          );
        } else {
          console.warn(
            "[Sentry] Flush timeout reached; some events may have been dropped."
          );
        }
      } catch (err) {
        console.error("[Sentry] Error occurred during graceful shutdown:", err);
      } finally {
        process.exit(0);
      }
    });
  });
}

export {
  Sentry,
  initializeSentry,
  addSentryErrorHandler,
  captureException,
  captureMessage,
  addBreadcrumb,
  registerSentryShutdown,
};
