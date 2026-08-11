const express = require('express');
const router = express.Router();
const { requireStudentAuth } = require('../middleware/studentAuthMiddleware');

const workspaceController = require('../controllers/workspaceController');

router.use(requireStudentAuth);

// Workspace CRUD
router.get('/', workspaceController.getAllWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);
router.post('/', workspaceController.createWorkspace);
router.put('/:id', workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

// Shared Documents
router.get('/:id/documents', workspaceController.getDocuments);
router.post('/:id/documents', workspaceController.uploadDocument);

// Team Discussions
router.get('/:id/discussions', workspaceController.getDiscussions);
router.post('/:id/discussions', workspaceController.addDiscussion);

// Shared Calendar
router.get('/:id/calendar', workspaceController.getCalendar);

// Tasks
router.get('/:id/tasks', workspaceController.getTasks);
router.post('/:id/tasks', workspaceController.createTask);

// Meeting Notes
router.post('/:id/notes', workspaceController.addMeetingNotes);

// Quick Polls
router.post('/:id/polls', workspaceController.createPoll);

// Team Announcements
router.post('/:id/announcements', workspaceController.createAnnouncement);

// Activity Timeline
router.get('/:id/timeline', workspaceController.getTimeline);

// Shared Bookmarks
router.get('/:id/bookmarks', workspaceController.getBookmarks);

// Workspace Analytics
router.get('/:id/analytics', workspaceController.getAnalytics);

module.exports = router;
