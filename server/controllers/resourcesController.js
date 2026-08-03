import { resourcesService } from '../services/resourcesService.js';
import { paginationSchema, voteSchema } from '../schemas/resourceSchema.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error('[resourcesController]', e);
      return sendError(req, res, e.message || 'Internal server error', 500, 'INTERNAL_ERROR');
    });
}

export const listResources = wrapAsync(async (req, res) => {
  const { page, limit, category, difficulty, status, q } = paginationSchema.parse(req.query);
  const result = await resourcesService.listResources({
    page,
    limit,
    category,
    difficulty,
    status,
    q,
  });
  return sendSuccess(res, {
    resources: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit) || 1,
    },
  });
});

export const getResource = wrapAsync(async (req, res) => {
  const resource = await resourcesService.getResource(req.params.id);
  if (!resource) {
    return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, resource);
});

export const createResource = wrapAsync(async (req, res) => {
  const input = {
    title: req.body.title,
    description: req.body.description,
    file_url: req.body.file_url,
    file_type: req.body.file_type,
    file_size: req.body.file_size ? parseInt(req.body.file_size, 10) : undefined,
    category: req.body.category,
    tags: req.body.tags,
    difficulty_level: req.body.difficulty_level,
    uploaded_by: req.studentSession?.username || req.adminSession?.username || 'Anonymous',
    status: 'pending',
  };

  const created = await resourcesService.createResource(input);
  return sendSuccess(res, created, 201);
});

export const updateResource = wrapAsync(async (req, res) => {
  const updated = await resourcesService.updateResource(req.params.id, req.body);
  if (!updated) {
    return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, updated);
});

export const deleteResource = wrapAsync(async (req, res) => {
  const deleted = await resourcesService.deleteResource(req.params.id);
  if (!deleted) {
    return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { success: true });
});

export const voteResource = wrapAsync(async (req, res) => {
  const { voter_id } = voteSchema.parse(req.body);
  const result = await resourcesService.toggleVote(req.params.id, voter_id);
  if (!result) {
    return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, result);
});

export const downloadResource = wrapAsync(async (req, res) => {
  const resource = await resourcesService.incrementDownloads(req.params.id);
  if (!resource) {
    return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { download_url: resource.fileUrl });
});

export const moderateResource = wrapAsync(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return sendError(
      req,
      res,
      'Status must be pending, approved, or rejected',
      400,
      'VALIDATION_ERROR'
    );
  }
  const updated = await resourcesService.moderateResource(req.params.id, status);
  if (!updated) {
    return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, updated);
});

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
}

export const uploadFile = wrapAsync(async (req, res) => {
  if (!req.file) {
    return sendError(req, res, 'No file uploaded', 400, 'VALIDATION_ERROR');
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const displayName = sanitizeFilename(req.body.title || req.file.originalname);

  const input = {
    title: displayName,
    description: req.body.description || '',
    file_url: fileUrl,
    file_type: req.file.mimetype || 'application/octet-stream',
    file_size: req.file.size,
    category: req.body.category || 'other',
    tags: req.body.tags
      ? typeof req.body.tags === 'string'
        ? req.body.tags.split(',').map((t) => t.trim())
        : req.body.tags
      : [],
    difficulty_level: req.body.difficulty_level || null,
    uploaded_by: req.body.uploaded_by || 'Anonymous',
    status: 'pending',
  };

  const created = await resourcesService.createResource(input);
  return sendSuccess(res, created, 201);
});
