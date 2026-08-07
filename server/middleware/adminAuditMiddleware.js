import { auditLogRepository } from "../repositories/auditLogRepository.js";

/**
 * Middleware that logs administrative actions.
 * It intercepts the response to capture the new state.
 * Requires `req.adminSession` to be set by `adminAuthMiddleware`.
 */
export function adminAuditMiddleware(req, res, next) {
  // Only log modifying requests
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return next();
  }

  const originalJson = res.json;
  const originalSend = res.send;

  // We'll capture the new state from the response body
  let newStateStr = null;

  res.json = function (body) {
    newStateStr = JSON.stringify(body);
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    if (!newStateStr) {
      // If it wasn't already caught by json()
      try {
        if (typeof body === "object") {
          newStateStr = JSON.stringify(body);
        } else {
          newStateStr = body;
        }
      } catch (e) {
        // ignore stringify errors
      }
    }
    return originalSend.call(this, body);
  };

  res.on("finish", async () => {
    // Determine if it was a successful request (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const adminId = req.adminSession?.username || "unknown";
      const action = `${req.method} ${req.originalUrl}`;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("user-agent");
      const timestamp = new Date().toISOString();

      const riskLevel =
        req.method === "DELETE"
          ? "HIGH"
          : req.method === "PATCH"
            ? "MEDIUM"
            : "LOW";

      // req.oldState is optionally populated by pre-handlers
      const oldState = req.oldState || null;

      let newState = null;
      if (newStateStr) {
        try {
          newState = JSON.parse(newStateStr);
        } catch (e) {
          newState = { raw: newStateStr };
        }
      } else if (req.method === "POST") {
        // Fallback for creation if response didn't return body
        newState = req.body;
      }

      await auditLogRepository.insertAuditLog({
        adminId,
        action,
        ipAddress,
        userAgent,
        oldState,
        newState,
        timestamp,
        riskLevel,
      });
    }
  });

  next();
}

/**
 * Helper to attach old state to the request before the controller modifies it.
 * @param {Function} fetcher Async function that takes req and returns the old state object.
 */
export const attachOldState = (fetcher) => async (req, res, next) => {
  try {
    req.oldState = await fetcher(req);
  } catch (err) {
    // If fetching old state fails, we just proceed without it, or we could log an error
    console.warn("[Audit] Failed to fetch old state:", err.message);
  }
  next();
};
