import { Router } from "express";
import { requireStudentAuth } from "../middleware/studentAuthMiddleware.js";
import * as controller from "../controllers/resourceDiscoveryController.js";

const router = Router();

// Resource Catalog
router.get("/", controller.getAllResources);
router.get("/popular", controller.getPopularResources);
router.get("/recent", controller.getRecentResources);
router.get(
  "/recommended/:userId",
  requireStudentAuth,
  controller.getRecommendedResources
);
router.get("/search", controller.searchResources);
router.get("/category/:category", controller.getResourcesByCategory);
router.get(
  "/bookmarks/:userId",
  requireStudentAuth,
  controller.getBookmarkedResources
);
router.get("/analytics", controller.getResourceAnalytics);
router.get("/:id", controller.getResourceById);

// Resource Management
router.post("/", requireStudentAuth, controller.createResource);
router.put("/:id", requireStudentAuth, controller.updateResource);
router.delete("/:id", requireStudentAuth, controller.deleteResource);

// Bookmarks
router.post(
  "/:id/bookmark/:userId",
  requireStudentAuth,
  controller.bookmarkResource
);
router.delete(
  "/:id/bookmark/:userId",
  requireStudentAuth,
  controller.removeBookmark
);

export default router;
