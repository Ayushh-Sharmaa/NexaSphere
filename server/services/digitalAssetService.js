/**
 * Digital Asset Management Service
 * Mock implementation for Organization-Wide Digital Asset Management (DAM)
 */

const assets = [
  {
    id: 1,
    name: "Tech Fest Banner",
    type: "image",
    category: "Events",
    folder: "Event Banners",
    url: "/uploads/banner.png",
    size: "2.3 MB",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Certificate Template",
    type: "pdf",
    category: "Certificates",
    folder: "Templates",
    url: "/uploads/certificate.pdf",
    size: "850 KB",
    createdAt: new Date().toISOString(),
  },
];

const folders = [
  {
    id: 1,
    name: "Event Banners",
  },
  {
    id: 2,
    name: "Certificates",
  },
];

const versionHistory = [
  {
    version: "v1",
    updatedAt: new Date().toISOString(),
  },
];

const storageAnalytics = {
  totalAssets: assets.length,
  totalStorage: "3.15 GB",
  images: 120,
  pdfs: 45,
  videos: 18,
  documents: 32,
};

// Get All Assets
export const getAllAssets = async () => assets;

// Get Asset By ID
export const getAssetById = async (id) =>
  assets.find((asset) => asset.id === Number(id));

// Upload Asset
export const uploadAsset = async (data) => {
  const nextId =
    assets.length > 0 ? Math.max(...assets.map((a) => a.id)) + 1 : 1;
  const asset = {
    id: nextId,
    createdAt: new Date().toISOString(),
    ...data,
  };

  assets.push(asset);
  return asset;
};

// Update Asset
export const updateAsset = async (id, data) => {
  const index = assets.findIndex((asset) => asset.id === Number(id));

  if (index === -1) return null;

  assets[index] = {
    ...assets[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return assets[index];
};

// Delete Asset
export const deleteAsset = async (id) => {
  const index = assets.findIndex((asset) => asset.id === Number(id));

  if (index === -1) return null;

  return assets.splice(index, 1)[0];
};

// Search Assets
export const searchAssets = async (query) => {
  if (!query) return assets;

  return assets.filter((asset) =>
    asset.name.toLowerCase().includes(query.toLowerCase())
  );
};

// Assets By Category
export const getAssetsByCategory = async (category) =>
  assets.filter(
    (asset) => asset.category.toLowerCase() === category.toLowerCase()
  );

// Folder Management
export const getFolders = async () => folders;

export const createFolder = async (data) => {
  const nextId =
    folders.length > 0 ? Math.max(...folders.map((f) => f.id)) + 1 : 1;
  const folder = {
    id: nextId,
    ...data,
  };

  folders.push(folder);
  return folder;
};

export const deleteFolder = async (id) => {
  const numId = Number(id);
  const index = folders.findIndex((f) => f.id === numId);
  if (index === -1) return null;

  const folderName = folders[index].name;

  // Cascade reset folder tag of assets referencing the deleted folder
  assets.forEach((asset) => {
    if (asset.folder === folderName) {
      asset.folder = "Uncategorized";
    }
  });

  return folders.splice(index, 1)[0];
};

// Duplicate Detection
export const detectDuplicates = async () => [
  {
    assetId: 1,
    duplicateOf: 2,
  },
];

// AI Tags
export const generateAITags = async () => [
  "event",
  "banner",
  "technology",
  "campus",
];

// Version History
export const getVersionHistory = async () => versionHistory;

// Preview Asset
export const previewAsset = async (id) => ({
  assetId: id,
  previewUrl: `/preview/${id}`,
});

// Bulk Upload
export const bulkUpload = async (files) => ({
  uploaded: files?.length || 0,
  status: "Completed",
});

// Bulk Download
export const bulkDownload = async (ids) => ({
  downloaded: ids?.length || 0,
  downloadUrl: "/downloads/assets.zip",
});

// Share Asset
export const shareAsset = async (data) => ({
  assetId: data.assetId,
  sharedWith: data.user,
  permission: data.permission,
  status: "Shared",
});

// Storage Analytics
export const getStorageAnalytics = async () => storageAnalytics;

// Expiring Assets
export const getExpiringAssets = async () => [
  {
    id: 3,
    name: "Old Event Poster",
    expiresOn: "2026-08-01",
  },
];
