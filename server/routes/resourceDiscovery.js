const express = require('express');
const router = express.Router();

const controller = require('../controllers/resourceDiscoveryController');

// Resource Catalog
router.get('/', controller.getAllResources);

router.get('/popular', controller.getPopularResources);

router.get('/recent', controller.getRecentResources);

router.get('/recommended/:userId', controller.getRecommendedResources);

router.get('/search', controller.searchResources);

router.get('/category/:category', controller.getResourcesByCategory);

router.get('/bookmarks/:userId', controller.getBookmarkedResources);

router.get('/analytics', controller.getResourceAnalytics);

router.get('/:id', controller.getResourceById);

// Resource Management
router.post('/', controller.createResource);

router.put('/:id', controller.updateResource);

router.delete('/:id', controller.deleteResource);

// Bookmarks
router.post('/:id/bookmark/:userId', controller.bookmarkResource);

router.delete('/:id/bookmark/:userId', controller.removeBookmark);

module.exports = router;
