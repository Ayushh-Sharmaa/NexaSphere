/**
 * Zod Validation Middleware
 *
 * Reusable Express middleware factory that validates `req.body` (or
 * `req.query` / `req.params`) against a Zod schema.  On success the
 * parsed (and potentially transformed/defaulted) data replaces the
 * original value so downstream handlers see clean values.  On failure
 * it responds with 400 and a structured `{ errors: [...] }` payload.
 *
 * @example
 * ```js
 * import { validate } from '../middleware/validate.js';
 * import { mySchema } from '../validators/routes/mySchema.js';
 *
 * router.post('/endpoint', validate(mySchema), handler);
 * ```
 */

import { z } from "zod";

/**
 * @param {z.ZodSchema} schema  — Zod schema to validate the request input.
 * @param {'body'|'query'|'params'} source — property of `req` to validate.
 * @returns {Function} Express middleware
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join(".") : undefined,
        message: issue.message,
      }));
      return res.status(400).json({
        error: errors[0]?.message || "Validation failed",
        errors,
      });
    }
    // Replace with parsed (and potentially transformed/defaulted) data
    // so that downstream handlers see clean, typed values.
    req[source] = result.data;
    next();
  };
}
