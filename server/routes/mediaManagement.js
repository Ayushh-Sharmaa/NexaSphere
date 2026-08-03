import express from 'express';

import {
  getFiles,
  getFile,
  uploadFile,
  deleteFile,
  searchFiles,
  updateTags,
  moveFile,
  optimizeImage,
  getStorageUsage,
  getStatistics,
} from '../controllers/mediaManagementController.js';

const router = express.Router();

router.get('/', getFiles);

router.get('/stats', getStatistics);

router.get('/storage', getStorageUsage);

router.get('/search', searchFiles);

router.get('/:id', getFile);

router.post('/upload', uploadFile);

router.put('/:id/tags', updateTags);

router.put('/:id/move', moveFile);

router.put('/:id/optimize', optimizeImage);

router.delete('/:id', deleteFile);

export default router;
