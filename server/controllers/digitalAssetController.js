import * as digitalAssetService from "../services/digitalAssetService.js";

// Get All Assets
export const getAllAssets = async (req, res) => {
  try {
    const assets = await digitalAssetService.getAllAssets();

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assets.",
      error: error.message,
    });
  }
};

// Get Asset By ID
export const getAssetById = async (req, res) => {
  try {
    const asset = await digitalAssetService.getAssetById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch asset.",
      error: error.message,
    });
  }
};

// Upload Asset
export const uploadAsset = async (req, res) => {
  try {
    const asset = await digitalAssetService.uploadAsset(req.body);

    res.status(201).json({
      success: true,
      message: "Asset uploaded successfully.",
      data: asset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload asset.",
      error: error.message,
    });
  }
};

// Update Asset
export const updateAsset = async (req, res) => {
  try {
    const asset = await digitalAssetService.updateAsset(
      req.params.id,
      req.body
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset updated successfully.",
      data: asset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update asset.",
      error: error.message,
    });
  }
};

// Delete Asset
export const deleteAsset = async (req, res) => {
  try {
    const asset = await digitalAssetService.deleteAsset(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully.",
      data: asset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete asset.",
      error: error.message,
    });
  }
};

// Search Assets
export const searchAssets = async (req, res) => {
  try {
    const assets = await digitalAssetService.searchAssets(req.query.q);

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search assets.",
      error: error.message,
    });
  }
};

// Get Assets By Category
export const getAssetsByCategory = async (req, res) => {
  try {
    const assets = await digitalAssetService.getAssetsByCategory(
      req.params.category
    );

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assets by category.",
      error: error.message,
    });
  }
};

// Get Folders
export const getFolders = async (req, res) => {
  try {
    const folders = await digitalAssetService.getFolders();

    res.status(200).json({
      success: true,
      data: folders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch folders.",
      error: error.message,
    });
  }
};

// Create Folder
export const createFolder = async (req, res) => {
  try {
    const folder = await digitalAssetService.createFolder(req.body);

    res.status(201).json({
      success: true,
      message: "Folder created successfully.",
      data: folder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create folder.",
      error: error.message,
    });
  }
};

// Detect Duplicate Assets
export const detectDuplicates = async (req, res) => {
  try {
    const duplicates = await digitalAssetService.detectDuplicates();

    res.status(200).json({
      success: true,
      data: duplicates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to detect duplicate assets.",
      error: error.message,
    });
  }
};

// AI Image Tags
export const generateAITags = async (req, res) => {
  try {
    const tags = await digitalAssetService.generateAITags(req.params.id);

    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate AI tags.",
      error: error.message,
    });
  }
};

// Version History
export const getVersionHistory = async (req, res) => {
  try {
    const history = await digitalAssetService.getVersionHistory(req.params.id);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch version history.",
      error: error.message,
    });
  }
};

// Preview Asset
export const previewAsset = async (req, res) => {
  try {
    const preview = await digitalAssetService.previewAsset(req.params.id);

    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to preview asset.",
      error: error.message,
    });
  }
};

// Bulk Upload
export const bulkUpload = async (req, res) => {
  try {
    const result = await digitalAssetService.bulkUpload(req.body.files);

    res.status(201).json({
      success: true,
      message: "Assets uploaded successfully.",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bulk upload failed.",
      error: error.message,
    });
  }
};

// Bulk Download
export const bulkDownload = async (req, res) => {
  try {
    const result = await digitalAssetService.bulkDownload(req.body.ids);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bulk download failed.",
      error: error.message,
    });
  }
};

// Share Asset
export const shareAsset = async (req, res) => {
  try {
    const result = await digitalAssetService.shareAsset(req.body);

    res.status(200).json({
      success: true,
      message: "Asset shared successfully.",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to share asset.",
      error: error.message,
    });
  }
};

// Storage Analytics
export const getStorageAnalytics = async (req, res) => {
  try {
    const analytics = await digitalAssetService.getStorageAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch storage analytics.",
      error: error.message,
    });
  }
};

// Expiring Assets
export const getExpiringAssets = async (req, res) => {
  try {
    const assets = await digitalAssetService.getExpiringAssets();

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring assets.",
      error: error.message,
    });
  }
};
