/**
 * Standardized API response helpers.
 *
 * Success shape:  res.json(data)                                      — data directly
 * Error shape:    { error: { code, message, details?, traceId? } }    — single envelope
 *
 * Every helper that touches `req` reads `req.reqId` (set by tracingMiddleware)
 * so error responses always carry a correlation id.
 */

import { getLogContext } from './logContext.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return the current request's traceId or null. */
function resolveTraceId(req) {
  if (req?.reqId) return req.reqId;
  // Fallback to AsyncLocalStorage store
  try {
    return getLogContext().reqId || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Success responses
// ---------------------------------------------------------------------------

/**
 * Send a 200 (or custom status) JSON response.
 *
 * @param {import('express').Response} res
 * @param {*}        data    – Payload (becomes the response body directly).
 * @param {number}  [status=200]
 */
export function sendSuccess(res, data, status = 200) {
  return res.status(status).json(data);
}

/**
 * Send a 201 Created response.
 *
 * @param {import('express').Response} res
 * @param {*}        data
 * @param {string}  [location] – Optional Location header value.
 */
export function sendCreated(res, data, location) {
  if (location) res.setHeader('Location', location);
  return res.status(201).json(data);
}

/**
 * Send a 204 No Content response (no body).
 *
 * @param {import('express').Response} res
 */
export function sendNoContent(res) {
  return res.status(204).end();
}

// ---------------------------------------------------------------------------
// Error responses
// ---------------------------------------------------------------------------

/**
 * Send a structured error response.
 *
 * @param {import('express').Request}  req  – Used to extract traceId.
 * @param {import('express').Response} res
 * @param {string}   message   – Human-readable description.
 * @param {number}  [status=500]       – HTTP status code.
 * @param {string}  [code='INTERNAL_ERROR'] – Machine-readable error code.
 * @param {*}       [details]          – Optional extra payload.
 */
export function sendError(req, res, message, status = 500, code = 'INTERNAL_ERROR', details) {
  const body = {
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      traceId: resolveTraceId(req),
    },
  };
  return res.status(status).json(body);
}

/**
 * Convenience: send a 400 validation error.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {string}   [message='Validation failed']
 * @param {Array}    [details] – Array of { path, message } items.
 */
export function sendValidationError(req, res, message = 'Validation failed', details) {
  return sendError(req, res, message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Convenience: send a 401 unauthorized error.
 */
export function sendUnauthorizedError(req, res, message = 'Unauthorized') {
  return sendError(req, res, message, 401, 'UNAUTHORIZED');
}

/**
 * Convenience: send a 403 forbidden error.
 */
export function sendForbiddenError(req, res, message = 'Forbidden') {
  return sendError(req, res, message, 403, 'FORBIDDEN');
}

/**
 * Convenience: send a 404 not-found error.
 */
export function sendNotFoundError(req, res, message = 'Resource not found') {
  return sendError(req, res, message, 404, 'NOT_FOUND');
}

/**
 * Convenience: send a 409 conflict error.
 */
export function sendConflictError(req, res, message = 'Conflict') {
  return sendError(req, res, message, 409, 'CONFLICT');
}

/**
 * Convenience: send a 429 rate-limit error.
 */
export function sendRateLimitError(req, res, message = 'Too many requests') {
  return sendError(req, res, message, 429, 'RATE_LIMITED');
}

// ---------------------------------------------------------------------------
// Legacy helpers (kept for backward compatibility — not used by new code)
// ---------------------------------------------------------------------------

/** @deprecated Use `sendSuccess` instead. */
export function sendList(res, data, listKey) {
  const response = { ok: true, data };
  if (listKey) response[listKey] = data;
  return res.json(response);
}

/** @deprecated Use `sendSuccess` instead. */
export function sendItem(res, data, itemKey) {
  const response = { ok: true, data };
  if (itemKey) response[itemKey] = data;
  return res.json(response);
}

/** @deprecated Use `sendCreated` instead. */
export function sendOldCreated(res, data, itemKey, spread) {
  const response = { ok: true, data };
  if (itemKey) response[itemKey] = data;
  if (spread && data && typeof data === 'object') Object.assign(response, data);
  return res.status(201).json(response);
}

/** @deprecated Use `sendNoContent` instead. */
export function sendDeleted(res) {
  return res.json({ ok: true });
}
