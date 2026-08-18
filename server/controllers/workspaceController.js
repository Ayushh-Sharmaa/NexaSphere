import * as workspaceService from "../services/workspaceService.js";

// Get All Workspaces
export const getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await workspaceService.getAllWorkspaces();

    res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch workspaces.",
      error: error.message,
    });
  }
};

// Get Workspace By ID
export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch workspace.",
      error: error.message,
    });
  }
};

// Create Workspace
export const createWorkspace = async (req, res) => {
  try {
    const workspace = await workspaceService.createWorkspace(req.body);

    res.status(201).json({
      success: true,
      message: "Workspace created successfully.",
      data: workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create workspace.",
      error: error.message,
    });
  }
};

// Update Workspace
export const updateWorkspace = async (req, res) => {
  try {
    const workspace = await workspaceService.updateWorkspace(
      req.params.id,
      req.body
    );

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workspace updated successfully.",
      data: workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update workspace.",
      error: error.message,
    });
  }
};

// Delete Workspace
export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await workspaceService.deleteWorkspace(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workspace deleted successfully.",
      data: workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete workspace.",
      error: error.message,
    });
  }
};

// Documents
export const getDocuments = async (req, res) => {
  try {
    const documents = await workspaceService.getDocuments(req.params.id);

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents.",
      error: error.message,
    });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const document = await workspaceService.uploadDocument(
      req.params.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload document.",
      error: error.message,
    });
  }
};

// Discussions
export const getDiscussions = async (req, res) => {
  try {
    const discussions = await workspaceService.getDiscussions(req.params.id);

    res.status(200).json({
      success: true,
      data: discussions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch discussions.",
      error: error.message,
    });
  }
};

export const addDiscussion = async (req, res) => {
  try {
    const discussion = await workspaceService.addDiscussion(
      req.params.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Discussion added successfully.",
      data: discussion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add discussion.",
      error: error.message,
    });
  }
};

// Calendar
export const getCalendar = async (req, res) => {
  try {
    const calendar = await workspaceService.getCalendar(req.params.id);

    res.status(200).json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch calendar.",
      error: error.message,
    });
  }
};

// Tasks
export const createTask = async (req, res) => {
  try {
    const task = await workspaceService.createTask(req.params.id, req.body);

    res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create task.",
      error: error.message,
    });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await workspaceService.getTasks(req.params.id);

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks.",
      error: error.message,
    });
  }
};

// Meeting Notes
export const addMeetingNotes = async (req, res) => {
  try {
    const notes = await workspaceService.addMeetingNotes(
      req.params.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Meeting notes added successfully.",
      data: notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add meeting notes.",
      error: error.message,
    });
  }
};

// Polls
export const createPoll = async (req, res) => {
  try {
    const poll = await workspaceService.createPoll(req.params.id, req.body);

    res.status(201).json({
      success: true,
      message: "Poll created successfully.",
      data: poll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create poll.",
      error: error.message,
    });
  }
};

// Announcements
export const createAnnouncement = async (req, res) => {
  try {
    const announcement = await workspaceService.createAnnouncement(
      req.params.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create announcement.",
      error: error.message,
    });
  }
};

// Timeline
export const getTimeline = async (req, res) => {
  try {
    const timeline = await workspaceService.getTimeline(req.params.id);

    res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch timeline.",
      error: error.message,
    });
  }
};

// Bookmarks
export const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await workspaceService.getBookmarks(req.params.id);

    res.status(200).json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookmarks.",
      error: error.message,
    });
  }
};

// Analytics
export const getAnalytics = async (req, res) => {
  try {
    const analytics = await workspaceService.getAnalytics(req.params.id);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch workspace analytics.",
      error: error.message,
    });
  }
};
