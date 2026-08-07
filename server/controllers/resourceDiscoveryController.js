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
  res.status(200).json(resourceDiscoveryService.getRecommendedResources(req.params.userId));
};

exports.bookmarkResource = (req, res) => {
  res.status(200).json(resourceDiscoveryService.bookmarkResource(req.params.userId, req.params.id));
};

exports.removeBookmark = (req, res) => {
  res.status(200).json(resourceDiscoveryService.removeBookmark(req.params.userId, req.params.id));
};

exports.getBookmarkedResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getBookmarkedResources(req.params.userId));
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
