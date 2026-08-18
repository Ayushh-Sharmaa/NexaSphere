import { Router } from "express";
import { requireStudentAuth } from "../middleware/studentAuthMiddleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import * as knowledgeAssistantController from "../controllers/knowledgeAssistantController.js";

const router = Router();
const requireAdmin =
  adminAuthMiddleware?.requireAdmin ?? ((req, res, next) => next());

router.use(requireStudentAuth);

// AI Assistant
router.post(
  "/query",
  requireStudentAuth,
  knowledgeAssistantController.askQuestion
);

// Natural Language Search
router.get(
  "/search",
  requireStudentAuth,
  knowledgeAssistantController.naturalSearch
);

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
router.post(
  "/translate",
  requireStudentAuth,
  knowledgeAssistantController.translateResponse
);

// Query History
router.get(
  "/history",
  requireStudentAuth,
  knowledgeAssistantController.getHistory
);

// Feedback
router.post(
  "/feedback",
  requireStudentAuth,
  knowledgeAssistantController.submitFeedback
);

// Analytics
router.get(
  "/analytics",
  requireStudentAuth,
  knowledgeAssistantController.getAnalytics
);

// Knowledge Base Update (admin only)
router.post(
  "/update",
  requireAdmin,
  knowledgeAssistantController.updateKnowledgeBase
);

export default router;
