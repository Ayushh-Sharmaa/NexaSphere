const mediaLibrary = [];

const mediaManagementService = {
  getAllFiles() {
    return mediaLibrary;
  },

  getFileById(id) {
    return mediaLibrary.find((file) => file.id === id);
  },

  uploadFile(file) {
    const newFile = {
      id: Date.now().toString(),
      name: file?.name || 'sample-image.png',
      type: file?.type || 'image/png',
      size: file?.size || '2 MB',
      folder: file?.folder || 'General',
      tags: file?.tags || [],
      uploadedBy: file?.uploadedBy || 'Admin',
      uploadedAt: new Date().toISOString(),
      version: 1,
      compressed: false,
      downloads: 0,
      previewUrl: `/media/${Date.now()}`,
    };

    mediaLibrary.push(newFile);

    return newFile;
  },

  deleteFile(id) {
    const index = mediaLibrary.findIndex((file) => file.id === id);

    if (index === -1) return null;

    return mediaLibrary.splice(index, 1)[0];
  },

  updateTags(id, tags) {
    const file = this.getFileById(id);

    if (!file) return null;

    file.tags = tags;

    return file;
  },

  moveFile(id, folder) {
    const file = this.getFileById(id);

    if (!file) return null;

    file.folder = folder;

    return file;
  },

  searchFiles(query) {
    return mediaLibrary.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));
  },

  getStorageUsage() {
    return {
      totalFiles: mediaLibrary.length,
      totalFolders: 5,
      usedStorage: '312 MB',
      availableStorage: '4.7 GB',
      storageLimit: '5 GB',
    };
  },

  detectDuplicate(name) {
    return mediaLibrary.filter((file) => file.name === name);
  },

  optimizeImage(id) {
    const file = this.getFileById(id);

    if (!file) return null;

    file.compressed = true;

    return file;
  },

  incrementDownload(id) {
    const file = this.getFileById(id);

    if (!file) return null;

    file.downloads++;

    return file;
  },

  getStatistics() {
    return {
      totalFiles: mediaLibrary.length,
      totalImages: mediaLibrary.filter((f) => f.type.includes('image')).length,
      totalDocuments: mediaLibrary.filter((f) => f.type.includes('pdf')).length,
      compressedFiles: mediaLibrary.filter((f) => f.compressed).length,
    };
  },
};

export default mediaManagementService;
