const express = require("express");
const router = express.Router();
const { requireStudentAuth } = require("../middleware/studentAuthMiddleware");
const { searchRateLimiter } = require("../middleware/rateLimiter");

const knowledgeAssistantController = require("../controllers/knowledgeAssistantController");

router.use(requireStudentAuth);

// AI Assistant
router.post("/query", searchRateLimiter, knowledgeAssistantController.askQuestion);

// Natural Language Search
router.get("/search", searchRateLimiter, knowledgeAssistantController.naturalSearch);

// Documentation
router.get("/documentation", knowledgeAssistantController.getDocumentation);

// Event Recommendations
router.get("/events", knowledgeAssistantController.getEventRecommendations);

// Club Information
router.get("/clubs", knowledgeAssistantController.getClubInformation);

// FAQ Generation
router.get("/faqs", knowledgeAssistantController.generateFAQs);

// Step-by-Step Guides
router.get("/guides", knowledgeAssistantController.getGuides);

// Smart Search Suggestions
router.get("/suggestions", knowledgeAssistantController.getSuggestions);

// Multilingual Translation
router.post("/translate", searchRateLimiter, knowledgeAssistantController.translateResponse);

// Query History
router.get("/history", knowledgeAssistantController.getHistory);

// Feedback
router.post("/feedback", knowledgeAssistantController.submitFeedback);

// Analytics
router.get("/analytics", knowledgeAssistantController.getAnalytics);

// Knowledge Base Update
router.post("/update", knowledgeAssistantController.updateKnowledgeBase);

module.exports = router;