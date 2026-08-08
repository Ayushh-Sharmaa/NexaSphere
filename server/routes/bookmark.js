import express from 'express';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
const router = express.Router();

import * as bookmarkController from '../controllers/bookmarkController.js';

router.use(requireStudentAuth);

// Bookmarks
router.post('/', bookmarkController.createBookmark);
router.get('/', bookmarkController.getBookmarks);
router.delete('/:id', bookmarkController.deleteBookmark);

// Search & Recent
router.get('/search', bookmarkController.searchBookmarks);
router.get('/recent', bookmarkController.getRecentBookmarks);

// Folder Management
router.post('/folders', bookmarkController.createFolder);
router.get('/folders', bookmarkController.getFolders);
router.put('/folders/:id', bookmarkController.updateFolder);
router.delete('/folders/:id', bookmarkController.deleteFolder);

// Share
router.post('/share/:id', bookmarkController.shareCollection);

// Sync
router.get('/sync', bookmarkController.syncBookmarks);

// Export
router.get('/export', bookmarkController.exportBookmarks);

// Analytics
router.get('/analytics', bookmarkController.getBookmarkAnalytics);

export default router;
