import { Router } from "express";
import { requireStudentAuth } from "../middleware/studentAuthMiddleware.js";
import * as digitalAssetController from "../controllers/digitalAssetController.js";

const router = Router();

router.use(requireStudentAuth);

// Asset CRUD
router.get("/", digitalAssetController.getAllAssets);
router.get("/:id", digitalAssetController.getAssetById);
router.post("/", digitalAssetController.uploadAsset);
router.put("/:id", digitalAssetController.updateAsset);
router.delete("/:id", digitalAssetController.deleteAsset);

// Search & Category
router.get("/search", digitalAssetController.searchAssets);
router.get("/category/:category", digitalAssetController.getAssetsByCategory);

// Folder Management
router.get("/folders", digitalAssetController.getFolders);
router.post("/folders", digitalAssetController.createFolder);

// Duplicate Detection
router.get("/duplicates", digitalAssetController.detectDuplicates);

// AI Image Tagging
router.get("/tags/:id", digitalAssetController.generateAITags);

// Version History
router.get("/history/:id", digitalAssetController.getVersionHistory);

// Asset Preview
router.get("/preview/:id", digitalAssetController.previewAsset);

// Bulk Upload & Download
router.post("/bulk-upload", digitalAssetController.bulkUpload);
router.post("/bulk-download", digitalAssetController.bulkDownload);

// Asset Sharing
router.post("/share", digitalAssetController.shareAsset);

// Storage Analytics
router.get("/storage", digitalAssetController.getStorageAnalytics);

// Expiring Assets
router.get("/expiring", digitalAssetController.getExpiringAssets);

export default router;
