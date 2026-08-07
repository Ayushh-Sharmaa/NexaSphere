/**
 * routes/compliance.js
 * REST API for Compliance & Legal Document Management (Issue #1757)
 *
 * Public endpoints (no auth):
 *   GET  /api/compliance/documents                - list active documents
 *   GET  /api/compliance/documents/:id            - get single document
 *   GET  /api/compliance/documents/type/:type     - get active doc by type
 *   POST /api/compliance/acceptances              - record user acceptance
 *   GET  /api/compliance/acceptances/user/:userId - user's acceptances
 *   GET  /api/compliance/acceptances/check        - check if user accepted type
 *   POST /api/compliance/gdpr                     - submit GDPR request
 *
 * Admin endpoints (require adminAuth):
 *   GET    /api/admin/compliance/documents           - all docs (incl. archived)
 *   POST   /api/admin/compliance/documents           - create new version
 *   PATCH  /api/admin/compliance/documents/:id       - update document
 *   DELETE /api/admin/compliance/documents/:id       - archive document
 *   GET    /api/admin/compliance/acceptances         - all acceptances
 *   GET    /api/admin/compliance/gdpr                - all GDPR requests
 *   PATCH  /api/admin/compliance/gdpr/:id            - process GDPR request
 *   GET    /api/admin/compliance/audit               - audit log
 *   GET    /api/admin/compliance/stats               - stats overview
 */

import { Router } from "express";
import complianceService from "../services/complianceService.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import { validate } from "../middleware/validate.js";
import { apiRateLimiter } from "../middleware/rateLimiter.js";
import {
  recordAcceptanceSchema,
  gdprRequestSchema,
  createDocumentSchema,
  updateDocumentSchema,
  processGdprRequestSchema,
} from "../validators/routes/complianceSchemas.js";
