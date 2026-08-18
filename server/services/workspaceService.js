import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get All Workspaces
export const getAllWorkspaces = async () => {
  return await prisma.workspace.findMany();
};

// Get Workspace By ID
export const getWorkspaceById = async (id) => {
  return await prisma.workspace.findUnique({
    where: { id: id },
  });
};

// Create Workspace
export const createWorkspace = async (data) => {
  return await prisma.workspace.create({
    data: {
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\\s+/g, "-"),
    },
  });
};

// Update Workspace
export const updateWorkspace = async (id, data) => {
  return await prisma.workspace.update({
    where: { id: id },
    data: data,
  });
};

// Delete Workspace
export const deleteWorkspace = async (id) => {
  return await prisma.workspace.delete({
    where: { id: id },
  });
};

// Documents (Files)
export const getDocuments = async (workspaceId) => {
  return await prisma.workspaceFile.findMany({
    where: { workspaceId: workspaceId },
  });
};

export const uploadDocument = async (workspaceId, data) => {
  // In a real app this would upload to S3 or Google Drive.
  // Here we just save the file reference.
  return await prisma.workspaceFile.create({
    data: {
      workspaceId: workspaceId,
      name: data.name,
      url: data.url || "https://mock-storage.com/file",
      size: data.size || 0,
      type: data.type || "application/octet-stream",
      uploaderId: data.uploaderId || "mock-user-id",
    },
  });
};

// Discussions (Messages)
export const getDiscussions = async (workspaceId) => {
  return await prisma.workspaceMessage.findMany({
    where: { workspaceId: workspaceId },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });
};

export const addDiscussion = async (workspaceId, data) => {
  return await prisma.workspaceMessage.create({
    data: {
      workspaceId: workspaceId,
      content: data.content,
      senderId: data.senderId || "mock-user-id",
    },
  });
};

// Tasks
export const getTasks = async (workspaceId) => {
  return await prisma.workspaceTask.findMany({
    where: { workspaceId: workspaceId },
  });
};

export const createTask = async (workspaceId, data) => {
  return await prisma.workspaceTask.create({
    data: {
      workspaceId: workspaceId,
      title: data.title,
      description: data.description || "",
      status: data.status || "TODO",
      priority: data.priority || "MEDIUM",
      assigneeId: data.assigneeId,
    },
  });
};

// Stubs for missing parts
export const getCalendar = async (workspaceId) => ({ workspaceId, events: [] });
export const addMeetingNotes = async (workspaceId, data) => ({
  id: "mock",
  workspaceId,
});
export const createPoll = async (workspaceId, data) => ({
  id: "mock",
  workspaceId,
});
export const createAnnouncement = async (workspaceId, data) => ({
  id: "mock",
  workspaceId,
});
export const getTimeline = async (workspaceId) => [];
export const getBookmarks = async (workspaceId) => [];
export const getAnalytics = async (workspaceId) => ({
  workspaceId,
  members: 1,
  documents: 0,
  discussions: 0,
  tasks: 0,
});
