import mediaManagementService from '../services/mediaManagementService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getFiles = (req, res) => {
  sendSuccess(res, {
    data: mediaManagementService.getAllFiles(),
  });
};

export const getFile = (req, res) => {
  const file = mediaManagementService.getFileById(req.params.id);

  if (!file) {
    return sendError(req, res, 'File not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, {
    data: file,
  });
};

export const uploadFile = (req, res) => {
  const file = mediaManagementService.uploadFile(req.body);

  sendSuccess(
    res,
    {
      message: 'File uploaded successfully',
      data: file,
    },
    201
  );
};

export const deleteFile = (req, res) => {
  const deleted = mediaManagementService.deleteFile(req.params.id);

  if (!deleted) {
    return sendError(req, res, 'File not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, {
    message: 'File deleted successfully',
    data: deleted,
  });
};

export const searchFiles = (req, res) => {
  const files = mediaManagementService.searchFiles(req.query.q || '');

  sendSuccess(res, {
    data: files,
  });
};

export const updateTags = (req, res) => {
  const file = mediaManagementService.updateTags(req.params.id, req.body.tags);

  if (!file) {
    return sendError(req, res, 'File not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, {
    data: file,
  });
};

export const moveFile = (req, res) => {
  const file = mediaManagementService.moveFile(req.params.id, req.body.folder);

  if (!file) {
    return sendError(req, res, 'File not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, {
    data: file,
  });
};

export const optimizeImage = (req, res) => {
  const file = mediaManagementService.optimizeImage(req.params.id);

  if (!file) {
    return sendError(req, res, 'Image not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, {
    message: 'Image optimized',
    data: file,
  });
};

export const getStorageUsage = (req, res) => {
  sendSuccess(res, {
    data: mediaManagementService.getStorageUsage(),
  });
};

export const getStatistics = (req, res) => {
  sendSuccess(res, {
    data: mediaManagementService.getStatistics(),
  });
};
