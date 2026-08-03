/**
 * CSRF Token Validation & SameSite Cookie Enforcement Middleware.
 * Provides CSRF token generation, header verification (X-CSRF-Token), and SameSite=Strict cookie security (#4151).
 */

import crypto from "crypto";

export const CSRF_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a cryptographically secure CSRF token string.
 */
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Express middleware to enforce CSRF token validation and set SameSite=Strict cookies.
 */
export function csrfProtection(req, res, next) {
  // Generate CSRF token if not present in cookies
  let csrfToken = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;

  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Accessible by frontend JS for X-CSRF-Token header inclusion
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
    });
  }

  // Safe HTTP methods do not require CSRF token validation
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  // Validate X-CSRF-Token header against cookie token for state-changing requests (POST, PUT, DELETE, PATCH)
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers["x-xsrf-token"];

  const headerBuf = Buffer.from(String(headerToken));
  const csrfBuf = Buffer.from(String(csrfToken));

  if (headerBuf.length !== csrfBuf.length || !crypto.timingSafeEqual(headerBuf, csrfBuf)) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid or missing CSRF token.",
    });
  }

  next();
}
