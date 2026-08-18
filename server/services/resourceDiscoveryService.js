const resources = [
  {
    id: 1,
    title: "AI Laboratory",
    category: "Laboratory",
    description: "Advanced AI and Machine Learning Lab",
    location: "Block A - 201",
    availability: "Available",
    popularity: 95,
    createdAt: "2026-07-01",
    tags: ["AI", "ML", "Research"],
  },
  {
    id: 2,
    title: "Robotics Club",
    category: "Club",
    description: "Student robotics community",
    location: "Innovation Center",
    availability: "Open",
    popularity: 88,
    createdAt: "2026-07-03",
    tags: ["Robotics", "Hardware"],
  },
  {
    id: 3,
    title: "Cloud Computing Notes",
    category: "Study Material",
    description: "Semester study resources",
    location: "Digital Library",
    availability: "Available",
    popularity: 82,
    createdAt: "2026-07-05",
    tags: ["Cloud", "Notes"],
  },
];

const bookmarks = [];

export function getAllResources() {
  return {
    success: true,
    total: resources.length,
    resources,
  };
}

export function getResourceById(id) {
  const resource = resources.find((item) => item.id == id);

  if (!resource) {
    return {
      success: false,
      message: "Resource not found",
    };
  }

  return {
    success: true,
    resource,
  };
}

export function searchResources(query = "") {
  const keyword = query.toLowerCase();

  const result = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(keyword) ||
      resource.category.toLowerCase().includes(keyword) ||
      resource.description.toLowerCase().includes(keyword) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(keyword))
  );

  return {
    success: true,
    total: result.length,
    resources: result,
  };
}

export function getResourcesByCategory(category) {
  const result = resources.filter(
    (resource) => resource.category.toLowerCase() === category.toLowerCase()
  );

  return {
    success: true,
    category,
    total: result.length,
    resources: result,
  };
}

export function getPopularResources() {
  const popular = [...resources]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10);

  return {
    success: true,
    resources: popular,
  };
}

export function getRecentResources() {
  const recent = [...resources]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return {
    success: true,
    total: recent.length,
    resources: recent,
  };
}

export function getRecommendedResources(userId) {
  const recommended = [...resources]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5)
    .map((resource) => ({
      ...resource,
      recommendationReason: "Based on your recent interests and activity",
    }));

  return {
    success: true,
    userId,
    total: recommended.length,
    resources: recommended,
  };
}

export function bookmarkResource(userId, resourceId) {
  const resource = resources.find((item) => item.id == resourceId);

  if (!resource) {
    return {
      success: false,
      message: "Resource not found",
    };
  }

  const exists = bookmarks.find(
    (bookmark) => bookmark.userId == userId && bookmark.resourceId == resourceId
  );

  if (exists) {
    return {
      success: false,
      message: "Resource already bookmarked",
    };
  }

  const nextId =
    bookmarks.length > 0 ? Math.max(...bookmarks.map((b) => b.id)) + 1 : 1;
  const bookmark = {
    id: nextId,
    userId,
    resourceId,
    bookmarkedAt: new Date().toISOString(),
  };

  bookmarks.push(bookmark);

  return {
    success: true,
    message: "Resource bookmarked successfully",
    bookmark,
  };
}

export function removeBookmark(userId, resourceId) {
  const index = bookmarks.findIndex(
    (bookmark) => bookmark.userId == userId && bookmark.resourceId == resourceId
  );

  if (index === -1) {
    return {
      success: false,
      message: "Bookmark not found",
    };
  }

  bookmarks.splice(index, 1);

  return {
    success: true,
    message: "Bookmark removed successfully",
  };
}

export function getBookmarkedResources(userId) {
  const bookmarkedResources = bookmarks
    .filter((bookmark) => bookmark.userId == userId)
    .map((bookmark) =>
      resources.find((resource) => resource.id == bookmark.resourceId)
    )
    .filter(Boolean);

  return {
    success: true,
    userId,
    total: bookmarkedResources.length,
    resources: bookmarkedResources,
  };
}

export function createResource(data) {
  const nextId =
    resources.length > 0 ? Math.max(...resources.map((r) => r.id)) + 1 : 1;
  const resource = {
    id: nextId,
    title: data.title,
    category: data.category,
    description: data.description,
    location: data.location,
    availability: data.availability || "Available",
    popularity: data.popularity || 0,
    createdAt: new Date().toISOString().split("T")[0],
    tags: data.tags || [],
  };

  resources.push(resource);

  return {
    success: true,
    message: "Resource created successfully",
    resource,
  };
}

export function updateResource(id, data) {
  const resource = resources.find((item) => item.id == id);

  if (!resource) {
    return {
      success: false,
      message: "Resource not found",
    };
  }

  Object.assign(resource, data);

  return {
    success: true,
    message: "Resource updated successfully",
    resource,
  };
}

export function deleteResource(id) {
  const index = resources.findIndex((item) => item.id == id);

  if (index === -1) {
    return {
      success: false,
      message: "Resource not found",
    };
  }

  const deleted = resources.splice(index, 1)[0];

  // Cascade clean bookmarks associated with deleted resource
  for (let i = bookmarks.length - 1; i >= 0; i--) {
    if (bookmarks[i].resourceId == id) {
      bookmarks.splice(i, 1);
    }
  }

  return {
    success: true,
    message: "Resource deleted successfully",
    resource: deleted,
  };
}

export function getResourceAnalytics() {
  const categories = {};

  resources.forEach((resource) => {
    categories[resource.category] = (categories[resource.category] || 0) + 1;
  });

  return {
    success: true,
    analytics: {
      totalResources: resources.length,
      totalBookmarks: bookmarks.length,
      availableResources: resources.filter(
        (r) => r.availability === "Available"
      ).length,
      unavailableResources: resources.filter(
        (r) => r.availability !== "Available"
      ).length,
      averagePopularity: Number(
        (
          resources.reduce((sum, r) => sum + r.popularity, 0) /
          (resources.length || 1)
        ).toFixed(2)
      ),
      categories,
    },
  };
}
