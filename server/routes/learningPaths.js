import express from 'express';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { learningPathService } from '../services/learningPathService.js';
import { learningPathsRepository } from '../repositories/learningPathsRepository.js';
import { validate } from '../middleware/validate.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import {
  enrollSchema,
  completeMilestoneSchema,
  assessSchema,
} from '../validators/routes/learningPathsSchemas.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

const router = express.Router();

router.get('/learning-paths', async (req, res) => {
  try {
    const paths = await learningPathsRepository.listAll();
    sendSuccess(res, paths);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

router.get('/learning-paths/:id', requireStudentAuth, async (req, res) => {
  try {
    const userId = req.studentUser.sub || req.studentUser.id;
    const details = await learningPathService.getPathDetails(userId, req.params.id);
    sendSuccess(res, details);
  } catch (err) {
    sendError(req, res, err.message, 404, 'NOT_FOUND');
  }
});

router.post(
  '/learning-paths/:id/enroll',
  apiRateLimiter,
  validate(enrollSchema),
  requireStudentAuth,
  async (req, res) => {
    try {
      const userId = req.studentUser.sub || req.studentUser.id;
      const { targetWeeks, initialLevel } = req.body;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + (targetWeeks || 12) * 7);

      await learningPathsRepository.enrollUser(
        userId,
        req.params.id,
        targetDate,
        initialLevel || 1
      );
      sendSuccess(res, { success: true }, 201);
    } catch (err) {
      sendError(req, res, err.message, 400, 'VALIDATION_ERROR');
    }
  }
);

router.get('/learning-paths/:id/leaderboard', async (req, res) => {
  try {
    const leaderboard = await learningPathService.getLeaderboard(req.params.id);
    sendSuccess(res, leaderboard);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

router.post(
  '/learning-paths/milestones/:milestoneId/complete',
  validate(completeMilestoneSchema),
  requireStudentAuth,
  async (req, res) => {
    try {
      const userId = req.studentUser.sub || req.studentUser.id;
      const { pathId } = req.body;

      const enrollment = await learningPathsRepository.getUserEnrollment(userId, pathId);
      if (!enrollment) return sendError(req, res, 'Not enrolled in this path', 404, 'NOT_FOUND');

      await learningPathsRepository.completeMilestone(enrollment.id, req.params.milestoneId);
      const updated = await learningPathService.calculateProgress(enrollment.id);

      sendSuccess(res, { progress: updated.progress_percent });
    } catch (err) {
      sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
    }
  }
);

router.post(
  '/learning-paths/:id/assess',
  apiRateLimiter,
  validate(assessSchema),
  requireStudentAuth,
  async (req, res) => {
    try {
      // Simple logic to set starting level based on quiz score
      const { score } = req.body; // Score from 0-10
      const level = score > 8 ? 3 : score > 4 ? 2 : 1;
      sendSuccess(res, { recommendedLevel: level });
    } catch (err) {
      sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
    }
  }
);

export default router;
