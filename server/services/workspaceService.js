/**
 * Workspace Service
 * Mock implementation for Smart Workspace for Club & Team Collaboration
 */

const workspaces = [
  {
    id: 1,
    name: 'Coding Club Workspace',
    description: 'Workspace for Coding Club members',
    createdAt: new Date().toISOString(),
  },
];

const documents = [];
const discussions = [];
const tasks = [];
const meetingNotes = [];
const polls = [];
const announcements = [];
const bookmarks = [];
const timeline = [];

// Get All Workspaces
const getAllWorkspaces = async () => workspaces;

// Get Workspace By ID
const getWorkspaceById = async (id) => workspaces.find((workspace) => workspace.id === Number(id));

// Create Workspace
const createWorkspace = async (data) => {
  const nextId = workspaces.length > 0 ? Math.max(...workspaces.map((w) => w.id)) + 1 : 1;
  const workspace = {
    id: nextId,
    createdAt: new Date().toISOString(),
    ...data,
  };

  workspaces.push(workspace);
  return workspace;
};

// Update Workspace
const updateWorkspace = async (id, data) => {
  const index = workspaces.findIndex((workspace) => workspace.id === Number(id));

  if (index === -1) return null;

  workspaces[index] = {
    ...workspaces[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return workspaces[index];
};

// Delete Workspace
const deleteWorkspace = async (id) => {
  const index = workspaces.findIndex((workspace) => workspace.id === Number(id));

  if (index === -1) return null;

  const filterOut = (arr) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].workspaceId === numId) {
        arr.splice(i, 1);
      }
    }
  };

  filterOut(documents);
  filterOut(discussions);
  filterOut(tasks);
  filterOut(meetingNotes);
  filterOut(polls);
  filterOut(announcements);

  return workspaces.splice(index, 1)[0];
};

// Documents
const getDocuments = async (workspaceId) =>
  workspaceId ? documents.filter((d) => d.workspaceId === Number(workspaceId)) : documents;

const uploadDocument = async (workspaceId, data) => {
  const nextId = documents.length > 0 ? Math.max(...documents.map((d) => d.id)) + 1 : 1;
  const document = {
    id: nextId,
    workspaceId: Number(workspaceId),
    uploadedAt: new Date().toISOString(),
    ...data,
  };

  documents.push(document);
  return document;
};

// Discussions
const getDiscussions = async (workspaceId) =>
  workspaceId ? discussions.filter((d) => d.workspaceId === Number(workspaceId)) : discussions;

const addDiscussion = async (workspaceId, data) => {
  const nextId = discussions.length > 0 ? Math.max(...discussions.map((d) => d.id)) + 1 : 1;
  const discussion = {
    id: nextId,
    workspaceId: Number(workspaceId),
    createdAt: new Date().toISOString(),
    ...data,
  };

  discussions.push(discussion);
  return discussion;
};

// Calendar
const getCalendar = async (workspaceId) => ({
  workspaceId: Number(workspaceId),
  events: [
    {
      title: 'Weekly Team Meeting',
      date: '2026-07-15',
    },
  ],
});

// Tasks
const createTask = async (workspaceId, data) => {
  const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
  const task = {
    id: nextId,
    workspaceId: Number(workspaceId),
    status: 'Pending',
    createdAt: new Date().toISOString(),
    ...data,
  };

  tasks.push(task);
  return task;
};

const getTasks = async (workspaceId) =>
  workspaceId ? tasks.filter((t) => t.workspaceId === Number(workspaceId)) : tasks;

// Meeting Notes
const addMeetingNotes = async (workspaceId, data) => {
  const nextId = meetingNotes.length > 0 ? Math.max(...meetingNotes.map((m) => m.id)) + 1 : 1;
  const notes = {
    id: nextId,
    workspaceId: Number(workspaceId),
    createdAt: new Date().toISOString(),
    ...data,
  };

  meetingNotes.push(notes);
  return notes;
};

// Polls
const createPoll = async (workspaceId, data) => {
  const nextId = polls.length > 0 ? Math.max(...polls.map((p) => p.id)) + 1 : 1;
  const poll = {
    id: nextId,
    workspaceId: Number(workspaceId),
    createdAt: new Date().toISOString(),
    ...data,
  };

  polls.push(poll);
  return poll;
};

// Announcements
const createAnnouncement = async (workspaceId, data) => {
  const nextId = announcements.length > 0 ? Math.max(...announcements.map((a) => a.id)) + 1 : 1;
  const announcement = {
    id: nextId,
    workspaceId: Number(workspaceId),
    createdAt: new Date().toISOString(),
    ...data,
  };

  announcements.push(announcement);
  return announcement;
};

// Timeline
const getTimeline = async () => timeline;

// Bookmarks
const getBookmarks = async () => bookmarks;

// Analytics
const getAnalytics = async (workspaceId) => {
  const numId = Number(workspaceId);
  return {
    workspaceId: numId,
    members: 25,
    documents: documents.filter((d) => d.workspaceId === numId).length,
    discussions: discussions.filter((d) => d.workspaceId === numId).length,
    tasks: tasks.filter((t) => t.workspaceId === numId).length,
    polls: polls.filter((p) => p.workspaceId === numId).length,
    announcements: announcements.filter((a) => a.workspaceId === numId).length,
  };
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getDocuments,
  uploadDocument,
  getDiscussions,
  addDiscussion,
  getCalendar,
  createTask,
  getTasks,
  addMeetingNotes,
  createPoll,
  createAnnouncement,
  getTimeline,
  getBookmarks,
  getAnalytics,
};
