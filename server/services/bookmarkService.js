const bookmarks = [];
const folders = [];

class BookmarkService {
  createBookmark(data) {
    const bookmark = {
      id: Date.now().toString(),
      title: data.title,
      module: data.module,
      itemId: data.itemId,
      folder: data.folder || 'General',
      tags: data.tags || [],
      createdAt: new Date(),
      favorite: true,
    };

    bookmarks.push(bookmark);

    return {
      success: true,
      message: 'Bookmark created successfully.',
      data: bookmark,
    };
  }

  getBookmarks() {
    return {
      success: true,
      total: bookmarks.length,
      data: bookmarks,
    };
  }

  deleteBookmark(id) {
    const index = bookmarks.findIndex((b) => b.id === id);

    if (index === -1) {
      return {
        success: false,
        message: 'Bookmark not found.',
      };
    }

    bookmarks.splice(index, 1);

    return {
      success: true,
      message: 'Bookmark removed.',
    };
  }

  searchBookmarks(query) {
    const results = bookmarks.filter((bookmark) =>
      bookmark.title.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      total: results.length,
      data: results,
    };
  }

  getRecentBookmarks() {
    return {
      success: true,
      data: [...bookmarks].reverse().slice(0, 10),
    };
  }

  createFolder(name) {
    const folder = {
      id: Date.now().toString(),
      name,
      createdAt: new Date(),
    };

    folders.push(folder);

    return {
      success: true,
      data: folder,
    };
  }

  getFolders() {
    return {
      success: true,
      data: folders,
    };
  }

  updateFolder(id, name) {
    const folder = folders.find((f) => f.id === id);

    if (!folder)
      return {
        success: false,
        message: 'Folder not found.',
      };

    const oldName = folder.name;
    folder.name = name;

    // Update matching bookmarks
    bookmarks.forEach((b) => {
      if (b.folder === oldName) {
        b.folder = name;
      }
    });

    return {
      success: true,
      data: folder,
    };
  }

  deleteFolder(id) {
    const index = folders.findIndex((f) => f.id === id);

    if (index === -1)
      return {
        success: false,
        message: 'Folder not found.',
      };

    const folderName = folders[index].name;
    folders.splice(index, 1);

    // Reset matching bookmarks to General
    bookmarks.forEach((b) => {
      if (b.folder === folderName) {
        b.folder = 'General';
      }
    });

    return {
      success: true,
      message: 'Folder deleted.',
    };
  }

  shareCollection(id) {
    return {
      success: true,
      shareLink: `https://nexasphere.app/share/${id}`,
    };
  }

  syncBookmarks() {
    return {
      success: true,
      synced: bookmarks.length,
      lastSync: new Date(),
    };
  }

  exportBookmarks() {
    return {
      success: true,
      data: bookmarks,
    };
  }

  getBookmarkAnalytics() {
    return {
      success: true,
      data: {
        totalBookmarks: bookmarks.length,
        totalFolders: folders.length,
        mostUsedFolder: folders.length > 0 ? folders[0].name : 'General',
      },
    };
  }
}

export default new BookmarkService();
