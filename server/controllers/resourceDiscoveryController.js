const resourceDiscoveryService = require('../services/resourceDiscoveryService');

exports.getAllResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getAllResources());
};

exports.getResourceById = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getResourceById(req.params.id));
};

exports.searchResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.searchResources(req.query.q || ''));
};

exports.getResourcesByCategory = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getResourcesByCategory(req.params.category));
};

exports.getPopularResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getPopularResources());
};

exports.getRecentResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getRecentResources());
};

exports.getRecommendedResources = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res.status(403).json({ error: 'Access denied: can only view your own recommendations' });
  }

  res.status(200).json(resourceDiscoveryService.getRecommendedResources(userId));
};

exports.bookmarkResource = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res.status(403).json({ error: 'Access denied: can only bookmark resources for yourself' });
  }

  res.status(200).json(resourceDiscoveryService.bookmarkResource(userId, req.params.id));
};

exports.removeBookmark = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res.status(403).json({ error: 'Access denied: can only remove bookmarks for yourself' });
  }

  res.status(200).json(resourceDiscoveryService.removeBookmark(userId, req.params.id));
};

exports.getBookmarkedResources = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res.status(403).json({ error: 'Access denied: can only view your own bookmarks' });
  }

  res.status(200).json(resourceDiscoveryService.getBookmarkedResources(userId));
};

exports.createResource = (req, res) => {
  res.status(201).json(resourceDiscoveryService.createResource(req.body));
};

exports.updateResource = (req, res) => {
  res.status(200).json(resourceDiscoveryService.updateResource(req.params.id, req.body));
};

exports.deleteResource = (req, res) => {
  res.status(200).json(resourceDiscoveryService.deleteResource(req.params.id));
};

exports.getResourceAnalytics = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getResourceAnalytics());
};
