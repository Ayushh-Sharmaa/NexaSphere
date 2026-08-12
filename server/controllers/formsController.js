import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { formsService } from '../services/formsService.js';

const ALLOWED_FORM_TYPES = new Set(['membership', 'recruitment', 'core_team']);

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      if (e && e.message === 'Invalid form submission' && e.details) {
        return sendError(req, res, e.message, 400, 'VALIDATION_ERROR', e.details);
      }

      console.error('[wrapAsync error]', e);

      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    });
  return (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
    // 400 validation errors are client-facing and safe to return as-is.
    if (e && e.message === 'Invalid form submission' && e.details) {
      return res.status(400).json({ error: e.message, issues: e.details });
    }
    // Log internal errors server-side but return only a generic message to
    // the client. Leaking e.message on 500s can expose database error
    // strings, file paths, or library internals to callers.
    console.error('[formsController]', e);
    return res.status(500).json({ error: 'Internal server error' });
  });
}

export function makeHandleForm(formType) {
  return wrapAsync(async (req, res) => {
    const result = await formsService.handleForm(formType, req.body || {});
    return sendSuccess(res, result);
  });
}

// Allowlist of form types accepted by the parameterised route.
// These must match the keys recognised by formsService.handleForm and the
// tabMap in formsService.appendFormToSheet. Any other value is rejected
// with 400 before reaching the service layer or being written to Supabase
// or Google Sheets.

export const handleFormByParam = wrapAsync(async (req, res) => {
  const formType = req.params?.formType;

  if (!ALLOWED_FORM_TYPES.has(formType)) {
    return sendError(req, res, 'Invalid form type', 400, 'VALIDATION_ERROR');
  }

  if (!ALLOWED_FORM_TYPES.has(formType)) {
    return res.status(400).json({ error: `Unknown form type: '${formType}'. Allowed values: ${[...ALLOWED_FORM_TYPES].join(', ')}.` });
  }
  const result = await formsService.handleForm(formType, req.body || {});
  return sendSuccess(res, result);
});
