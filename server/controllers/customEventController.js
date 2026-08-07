import { customEventRepository } from '../repositories/customEventRepository.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const VALID_PROPERTY_TYPES = ['string', 'number', 'boolean', 'date'];
const MAX_PROPERTIES = 20;

function wrapAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function validateProperties(properties) {
  if (!Array.isArray(properties)) return 'properties must be an array';
  if (properties.length > MAX_PROPERTIES) return `Maximum ${MAX_PROPERTIES} properties allowed`;
  for (const prop of properties) {
    if (!prop.name || typeof prop.name !== 'string') return 'Each property must have a string name';
  if (properties.length > MAX_PROPERTIES)
    return `Maximum ${MAX_PROPERTIES} properties allowed`;
  for (const prop of properties) {
    if (!prop.name || typeof prop.name !== 'string')
      return 'Each property must have a string name';
    if (!VALID_PROPERTY_TYPES.includes(prop.type))
      return `Invalid property type "${prop.type}". Must be one of: ${VALID_PROPERTY_TYPES.join(', ')}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Event Definitions CRUD
// ---------------------------------------------------------------------------

export const createEventDefinition = wrapAsync(async (req, res) => {
  const { name, description, properties = [] } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return sendError(req, res, 'Event name is required', 400, 'VALIDATION_ERROR');
  }
  const propError = validateProperties(properties);
  if (propError) return sendError(req, res, propError, 400, 'VALIDATION_ERROR');
    return res.status(400).json({ error: 'Event name is required' });
  }
  const propError = validateProperties(properties);
  if (propError) return res.status(400).json({ error: propError });

  const createdBy = req.adminSession?.username || 'unknown';
  const definition = await customEventRepository.createDefinition({
    name: name.trim(),
    description,
    properties,
    createdBy,
  });
  return sendSuccess(res, { definition }, 201);
  return res.status(201).json({ success: true, definition });
});

export const listEventDefinitions = wrapAsync(async (req, res) => {
  const activeOnly = req.query.active === 'true';
  const definitions = await customEventRepository.listDefinitions({ activeOnly });
  return sendSuccess(res, { definitions });
  return res.json({ success: true, definitions });
});

export const getEventDefinition = wrapAsync(async (req, res) => {
  const definition = await customEventRepository.getDefinition(req.params.id);
  if (!definition) return sendError(req, res, 'Event definition not found', 404, 'NOT_FOUND');
  return sendSuccess(res, { definition });
  if (!definition) return res.status(404).json({ error: 'Event definition not found' });
  return res.json({ success: true, definition });
});

export const updateEventDefinition = wrapAsync(async (req, res) => {
  const { name, description, properties, isActive } = req.body;
  if (properties !== undefined) {
    const propError = validateProperties(properties);
    if (propError) return sendError(req, res, propError, 400, 'VALIDATION_ERROR');
    if (propError) return res.status(400).json({ error: propError });
  }
  const definition = await customEventRepository.updateDefinition(req.params.id, {
    name,
    description,
    properties,
    isActive,
  });
  if (!definition) return sendError(req, res, 'Event definition not found', 404, 'NOT_FOUND');
  return sendSuccess(res, { definition });
  if (!definition) return res.status(404).json({ error: 'Event definition not found' });
  return res.json({ success: true, definition });
});

export const deleteEventDefinition = wrapAsync(async (req, res) => {
  const definition = await customEventRepository.deleteDefinition(req.params.id);
  if (!definition) return sendError(req, res, 'Event definition not found', 404, 'NOT_FOUND');
  return sendSuccess(res, { message: 'Event definition deleted' });
  if (!definition) return res.status(404).json({ error: 'Event definition not found' });
  return res.json({ success: true, message: 'Event definition deleted' });
});

// ---------------------------------------------------------------------------
// Event Logging
// ---------------------------------------------------------------------------

export const logCustomEvent = wrapAsync(async (req, res) => {
  const { eventDefinitionId, userId, properties } = req.body;
  if (!eventDefinitionId) {
    return sendError(req, res, 'eventDefinitionId is required', 400, 'VALIDATION_ERROR');
  }

  const definition = await customEventRepository.getDefinition(eventDefinitionId);
  if (!definition) return sendError(req, res, 'Event definition not found', 404, 'NOT_FOUND');
  if (!definition.is_active)
    return sendError(req, res, 'Event definition is inactive', 400, 'VALIDATION_ERROR');

  const sessionId = req.headers['x-session-id'] || req.ip;
  const log = await customEventRepository.logEvent({
    eventDefinitionId,
    userId: userId || req.user?.id || null,
    sessionId,
    properties: properties || {},
  });
  return sendSuccess(res, { log }, 201);
  return res.status(201).json({ success: true, log });
});

// ---------------------------------------------------------------------------
// Analytics & Export
// ---------------------------------------------------------------------------

export const getEventAnalytics = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const days = parseInt(req.query.days, 10) || 30;

  const definition = await customEventRepository.getDefinition(id);
  if (!definition) return sendError(req, res, 'Event definition not found', 404, 'NOT_FOUND');

  const analytics = await customEventRepository.getEventAnalytics(id, { days });
  return sendSuccess(res, { definition, analytics });
  if (!definition) return res.status(404).json({ error: 'Event definition not found' });

  const analytics = await customEventRepository.getEventAnalytics(id, { days });
  return res.json({ success: true, definition, analytics });
});

export const getRecentLogs = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

  const result = await customEventRepository.getRecentLogs(id, { page, limit });
  return sendSuccess(res, { ...result });
  return res.json({ success: true, ...result });
});

export const exportEventData = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { since, until } = req.query;

  const definition = await customEventRepository.getDefinition(id);
  if (!definition) return sendError(req, res, 'Event definition not found', 404, 'NOT_FOUND');
  if (!definition) return res.status(404).json({ error: 'Event definition not found' });

  const logs = await customEventRepository.exportEventLogs(id, { since, until });

  // Build CSV
  const propertyDefs = definition.properties || [];
  const propNames = propertyDefs.map((p) => p.name);
  const headerCols = ['id', 'user_id', 'session_id', 'occurred_at', ...propNames];

  const escapeCSV = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvRows = [
    headerCols.join(','),
    ...logs.map((log) => {
      const props =
        typeof log.properties === 'string' ? JSON.parse(log.properties) : log.properties || {};
      const props = typeof log.properties === 'string'
        ? JSON.parse(log.properties)
        : log.properties || {};
      let props = log.properties || {};
      if (typeof props === 'string') {
        try {
          props = JSON.parse(props);
        } catch (e) {
          props = {};
        }
      }
      return [
        log.id,
        log.user_id || '',
        log.session_id || '',
        log.occurred_at,
        ...propNames.map((p) => escapeCSV(props[p])),
      ].join(',');
    }),
  ];

  const csvContent = csvRows.join('\n');
  const safeName = definition.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${safeName}_events.csv`);
  return res.send(csvContent);
});
