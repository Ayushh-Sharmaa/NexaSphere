import * as resourceDiscoveryService from "../services/resourceDiscoveryService.js";

export const getAllResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getAllResources());
};

export const getResourceById = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getResourceById(req.params.id));
};

export const searchResources = (req, res) => {
  res
    .status(200)
    .json(resourceDiscoveryService.searchResources(req.query.q || ""));
};

export const getResourcesByCategory = (req, res) => {
  res
    .status(200)
    .json(resourceDiscoveryService.getResourcesByCategory(req.params.category));
};

export const getPopularResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getPopularResources());
};

export const getRecentResources = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getRecentResources());
};

export const getRecommendedResources = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res
      .status(403)
      .json({ error: "Access denied: can only view your own recommendations" });
  }

  res
    .status(200)
    .json(resourceDiscoveryService.getRecommendedResources(userId));
};

export const bookmarkResource = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res
      .status(403)
      .json({
        error: "Access denied: can only bookmark resources for yourself",
      });
  }

  res
    .status(200)
    .json(resourceDiscoveryService.bookmarkResource(userId, req.params.id));
};

export const removeBookmark = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res
      .status(403)
      .json({ error: "Access denied: can only remove bookmarks for yourself" });
  }

  res
    .status(200)
    .json(resourceDiscoveryService.removeBookmark(userId, req.params.id));
};

export const getBookmarkedResources = (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.studentUser?.sub || req.user?.id;

  if (userId !== authUserId) {
    return res
      .status(403)
      .json({ error: "Access denied: can only view your own bookmarks" });
  }

  res.status(200).json(resourceDiscoveryService.getBookmarkedResources(userId));
};

export const createResource = (req, res) => {
  res.status(201).json(resourceDiscoveryService.createResource(req.body));
};

export const updateResource = (req, res) => {
  res
    .status(200)
    .json(resourceDiscoveryService.updateResource(req.params.id, req.body));
};

export const deleteResource = (req, res) => {
  res.status(200).json(resourceDiscoveryService.deleteResource(req.params.id));
};

export const getResourceAnalytics = (req, res) => {
  res.status(200).json(resourceDiscoveryService.getResourceAnalytics());
};
