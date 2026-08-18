import { clerkClient, authorizedParties } from "../../config/clerk.js";
import logger from "../../utils/logger.js";

/**
 * Clerk Authentication Middleware using Clerk's backend SDK.
 * Verifies bearer token and attaches req.auth = { userId, sessionId, claims }.
 */
export async function requireClerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message:
            "Authentication required. Please provide a valid Bearer token.",
        },
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Malformed authorization header.",
        },
      });
    }

    const requestState = await clerkClient.authenticateRequest(req, {
      authorizedParties: authorizedParties.length
        ? authorizedParties
        : undefined,
    });

    if (!requestState.isSignedIn) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired session token.",
          reason: requestState.reason,
        },
      });
    }

    const auth = requestState.toAuth();
    req.auth = {
      userId: auth.userId,
      sessionId: auth.sessionId,
      claims: auth.sessionClaims,
      role:
        auth.sessionClaims?.metadata?.role ||
        auth.sessionClaims?.role ||
        "student",
    };

    return next();
  } catch (err) {
    logger.error("Clerk authentication error:", err);
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Authentication verification failed.",
      },
    });
  }
}

/**
 * Optional Clerk auth middleware — populates req.auth if valid token present,
 * but allows unauthenticated requests to proceed.
 */
export async function optionalClerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const requestState = await clerkClient.authenticateRequest(req, {
        authorizedParties: authorizedParties.length
          ? authorizedParties
          : undefined,
      });

      if (requestState.isSignedIn) {
        const auth = requestState.toAuth();
        req.auth = {
          userId: auth.userId,
          sessionId: auth.sessionId,
          claims: auth.sessionClaims,
          role:
            auth.sessionClaims?.metadata?.role ||
            auth.sessionClaims?.role ||
            "student",
        };
      }
    }
  } catch {
    // Optional auth, proceed without req.auth
  }
  return next();
}
