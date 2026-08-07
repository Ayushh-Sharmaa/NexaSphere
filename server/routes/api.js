import { Router } from 'express';
import { throttleMiddleware } from '../middleware/throttleMiddleware.js';
import settingsRouter from './settingsRoutes.js';
import rateLimitAdminRoutes from './rateLimitAdminRoutes.js';
// Fixed duplicate import
import { auditLogController } from '../controllers/auditLogController.js';
import * as eventsController from '../controllers/eventsController.js';
import * as activityEventsController from '../controllers/activityEventsController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import * as coreTeamController from '../controllers/coreTeamController.js';
import * as eventRegistrationController from '../controllers/eventRegistrationController.js';
import * as usersController from '../controllers/usersController.js';
import { usersRepository } from '../repositories/usersRepository.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as eventAnalyticsController from '../controllers/eventAnalyticsController.js';
import * as bannersController from '../controllers/bannersController.js';
import { adminAuditMiddleware, attachOldState } from '../middleware/adminAuditMiddleware.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { authRateLimiter, protectedActionRateLimiter } from '../middleware/authRateLimiter.js';
import { eventRegistrationUserLimiter, eventRegistrationIpLimiter } from '../middleware/rateLimiter.js';
import { eventRegistrationIpLimiter, eventRegistrationUserLimiter } from '../middleware/rateLimiter.js';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { achievementsRepository } from '../repositories/achievementsRepository.js';
import { portfolioService } from '../services/portfolioService.js';
import { waitingRoomService } from '../services/waitingRoomService.js';
import { studentAuthService } from '../services/studentAuthService.js';
import * as sponsorshipsController from '../controllers/sponsorshipsController.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import * as subscriptionsController from '../controllers/subscriptionsController.js';
import * as followsController from '../controllers/followsController.js';
import * as portfolioAnalyticsController from '../controllers/portfolioAnalyticsController.js';
import { achievementSchema } from '../validators/portfolioSchemas.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import announcementPriorityRouter from "./announcementPriority.js";
import eventConflictRouter from "./eventConflict.js";
import waitlistRoutes from "./waitlist.js";
import * as localAuthController from '../controllers/localAuthController.js';
// Fixed duplicate import
import recommendationEngine from './recommendationEngine.js';
import platformAnalyticsRoutes from './platformAnalytics.js';
// Fixed duplicate import
import * as whiteboardController from '../controllers/whiteboardController.js';
import * as portfolioAnalyticsController from '../controllers/portfolioAnalyticsController.js';
import { achievementSchema } from '../validators/portfolioSchemas.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import announcementPriorityRouter from "./announcementPriority.js";
import eventConflictRouter from "./eventConflict.js";
import waitlistRoutes from "./waitlist.js";

import bookmarkRoutes from './bookmark.js';
import operationalInsightsRoutes from './operationalInsights.js';
import * as authRefreshController from '../controllers/authRefreshController.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';
import {
  awardXPSchema,
  exportPDFSchema,
  eventRegistrationSchema,
  emailSchema,
  addActivityEventSchema,
  accountRecoveryRequestSchema,
  accountRecoveryVerifySchema,
  markAttendanceSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUpdateUserRoleSchema,
  adminLoginSchema,
  localLoginSchema,
  verifyTwoFactorSchema,
  verifyTwoFactorSetupSchema,
  adminCreateEventSchema,
  adminUpdateEventSchema,
  createSubscriptionSchema,
  adminBannerBodySchema,
} from '../validators/routes/apiSchemas.js';
import * as recommendationsController from '../controllers/recommendationsController.js';
import * as gamificationController from '../controllers/gamificationController.js';
import { studentAuthService } from '../services/studentAuthService.js';
import * as recommendationsController from '../controllers/recommendationsController.js';
import * as gamificationController from '../controllers/gamificationController.js';
import * as recommendationsController from '../controllers/recommendationsController.js';
import * as gamificationController from '../controllers/gamificationController.js';
import multer from 'multer';
import settingsRouter from './settingsRoutes.js';
import { impersonationService } from '../services/impersonationService.js';

const router = Router();

const router = Router();
import multer from 'multer';

const router = Router();
import multer from 'multer';

// Fixed duplicate import
import { impersonationService } from '../services/impersonationService.js';
import * as followsController from '../controllers/followsController.js';
// Fixed duplicate import
// Fixed duplicate import
import multer from 'multer';
// Fixed duplicate upload declarations
// Fixed duplicate import
const workflowAutomationRoutes = require("./workflowAutomation"); 
const router = Router();
// Fixed duplicate import
const digitalAssetRoutes = require("./digitalAsset");
import googleFormsWebhookRoutes from './googleFormsWebhookRoutes.js';

router.use(rateLimitAdminRoutes);
router.use(throttleMiddleware);

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Public
router.get('/api/dashboard/leaderboard', gamificationController.getLeaderboard);
router.post('/api/dashboard/xp', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, gamificationController.awardXP);
const knowledgeAssistantRoutes = require("./knowledgeAssistant");
const reportingCenterRoutes = require("./reportingCenter");
const router = Router();
const budgetRoutes = require('./budget');
const resourceDiscoveryRoutes = require("./resourceDiscovery");
const notificationCampaignRoutes = require("./notificationCampaign");
const maintenanceRoutes = require("./maintenance");
const workspaceRoutes = require("./workspace");
// Fixed duplicate router declaration

// Public
router.get('/api/dashboard/leaderboard', gamificationController.getLeaderboard);
router.post('/api/dashboard/xp', gamificationController.awardXP);
router.use("/knowledge-assistant", knowledgeAssistantRoutes);
router.use("/reporting-center", reportingCenterRoutes);

// Public
router.get('/api/dashboard/leaderboard', gamificationController.getLeaderboard);
router.post(
  '/api/dashboard/xp',
  protectedActionRateLimiter,
  adminAuthMiddleware.requireAdmin,
  gamificationController.awardXP
);
router.post(
  '/api/assistant/recommend',
  upload.single('file'),
  recommendationsController.getProjectRecommendations
);
router.get('/api/users', usersController.getPublicUsers);
router.get('/api/content/events', eventsController.listEvents);
router.post('/api/content/events/:eventId/register', eventRegistrationController.registerForEvent);
router.post(
  '/api/content/events/:eventId/cancel',
  requireStudentAuth,
  eventRegistrationController.cancelRegistration
router.get('/api/content/banners', bannersController.listActiveBanners);
router.post(
  '/api/content/events/:eventId/register',
  eventRegistrationUserLimiter,
  eventRegistrationIpLimiter,
  eventRegistrationController.registerForEvent
);
router.get('/api/content/events/:eventId/calendar', eventRegistrationController.getEventCalendar);
  eventRegistrationIpLimiter,
  eventRegistrationUserLimiter,
  validate(eventRegistrationSchema),
  eventRegistrationController.registerForEvent
);
router.get('/api/content/events/:eventId/calendar', eventRegistrationController.getEventCalendar);

// QR Code Generation
router.get('/api/registrations/:id/qr', eventRegistrationController.getRegistrationQr);

router.post(
  '/api/content/events/:eventId/cancel',
  eventRegistrationIpLimiter,
  eventRegistrationUserLimiter,
  requireStudentAuth,
  validate(emailSchema),
  eventRegistrationController.cancelRegistration
);
router.get(
  '/api/content/events/:eventId/waitlist-position',
  eventRegistrationController.getWaitlistPosition
);
router.post(
  '/api/content/events/:eventId/waitlist/confirm',
  validate(emailSchema),
  eventRegistrationController.confirmWaitlistSpot
);
router.delete(
  '/api/content/events/:eventId/waitlist',
  eventRegistrationIpLimiter,
  eventRegistrationUserLimiter,
  validate(emailSchema),
  eventRegistrationController.leaveWaitlist
);
router.get(
  '/api/content/activity-events/:activityKey',
  activityEventsController.listActivityEvents
);
router.post(
  '/api/content/activity-events/:activityKey',
  protectedActionRateLimiter,
  adminAuthMiddleware.requireScope('events:write'),
  activityEventsController.addActivityEvent
);
router.delete(
  '/api/content/activity-events/:activityKey/:eventId',
  protectedActionRateLimiter,
  adminAuthMiddleware.requireScope('events:write'),
  activityEventsController.deleteActivityEvent
);
router.post('/account-recovery/request', async (req, res) => {
  const { email } = req.body;

  const recovery = await studentAuthService.createRecoveryRequest(email);

  return res.json({
    success: true,
    message: 'Recovery code generated',
    recovery,
  });
});
router.post('/account-recovery/verify', async (req, res) => {
  const { savedCode, enteredCode } = req.body;

  const valid = studentAuthService.verifyRecoveryCode(savedCode, enteredCode);

  return res.json({
    success: valid,
  });
});

// Admin auth
router.post(
  '/api/attendance/mark',
  adminAuthMiddleware.requireAdmin,
  attendanceController.markAttendance
);
router.get(
  '/api/attendance',
  adminAuthMiddleware.requireAdmin,
  attendanceController.getAttendanceList
);
router.get('/api/admin/users', adminAuthMiddleware.requireAdmin, usersController.getAdminUsers);
router.post(
  '/api/admin/users',
  adminAuthMiddleware.requireAdmin,
  adminAuditMiddleware,
  usersController.adminCreateUser
);
router.put(
  '/api/admin/users/:id',
  adminAuthMiddleware.requireAdmin,
  attachOldState((req) => usersRepository.getUserById(req.params.id)),
  adminAuditMiddleware,
  usersController.adminUpdateUser
);
router.put(
  '/api/admin/users/:id/role',
  adminAuthMiddleware.requireAdmin,
  adminAuthMiddleware.requireScope('users:write'),
  attachOldState((req) => usersRepository.getUserById(req.params.id)),
  adminAuditMiddleware,
  validate(adminUpdateUserRoleSchema),
  usersController.adminUpdateUserRole
);
router.delete(
  '/api/admin/users/:id',
  adminAuthMiddleware.requireAdmin,
  adminAuditMiddleware,
  usersController.adminDeactivateUser
);
router.post('/api/admin/login', authRateLimiter, adminAuthMiddleware.login);
router.post(
  '/api/admin/login',
  authRateLimiter,
  validate(adminLoginSchema),
  adminAuthMiddleware.login
);

// Local User Auth (legacy — no refresh token rotation)
router.post('/api/auth/local/login', authRateLimiter, localAuthController.localLogin);
// ── Secure JWT Refresh Token Rotation (issue #3292) ───────────────────────────
// Enhanced local login that issues both access and refresh tokens
router.post('/api/auth/login', authRateLimiter, authRefreshController.localLogin);
// Rotate a refresh token → new access token + new refresh token
router.post('/api/auth/refresh', authRateLimiter, authRefreshController.refreshTokens);
// Revoke the current device's refresh token (single logout)
router.post('/api/auth/logout', authRefreshController.logout);
// Revoke ALL refresh tokens for the authenticated user (logout everywhere)
router.post('/api/auth/logout-all', requireStudentAuth, authRefreshController.logoutAll);
// List active sessions for device management UI
router.get('/api/auth/sessions', requireStudentAuth, authRefreshController.listSessions);
router.post('/api/admin/2fa/verify', authRateLimiter, adminAuthMiddleware.verifyTwoFactor);
// Local User Auth
router.post(
  '/api/auth/local/login',
  authRateLimiter,
  validate(localLoginSchema),
  localAuthController.localLogin
);
  '/api/admin/2fa/verify',
  validate(verifyTwoFactorSchema),
  adminAuthMiddleware.verifyTwoFactor
router.post(
  '/api/admin/2fa/setup/verify',
  authRateLimiter,
  validate(verifyTwoFactorSetupSchema),
  adminAuthMiddleware.verifyTwoFactorSetup
);

router.get('/api/admin/2fa/settings/status', adminAuthMiddleware.requireAdmin, adminAuthMiddleware.getTwoFactorStatus);
router.post('/api/admin/2fa/settings/setup/init', adminAuthMiddleware.requireAdmin, adminAuthMiddleware.initTwoFactorSetup);
router.post('/api/admin/2fa/settings/setup/verify', adminAuthMiddleware.requireAdmin, adminAuthMiddleware.verifySettingsTwoFactorSetup);
router.post('/api/admin/2fa/settings/disable', adminAuthMiddleware.requireAdmin, adminAuthMiddleware.disableTwoFactor);

router.post('/api/admin/logout', adminAuthMiddleware.requireAdmin, adminAuthMiddleware.logout);

router.get(
  '/api/admin/events',
  adminAuthMiddleware.requireScope('events:read'),
  eventsController.adminListEvents
);
router.post(
  '/api/admin/events',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  eventsController.adminCreateEvent
);
router.put(
  '/api/admin/events/:id',
  adminAuthMiddleware.requireScope('events:write'),
  attachOldState((req) => eventsRepository.getById(req.params.id)),
  adminAuditMiddleware,
  eventsController.adminUpdateEvent
);
router.delete(
  '/api/admin/events/:id',
  adminAuthMiddleware.requireScope('events:write'),
  attachOldState((req) => eventsRepository.getById(req.params.id)),
  adminAuditMiddleware,
  eventsController.adminDeleteEvent
);

// Core team management APIs
router.get(
  '/api/admin/core-team/members',
  adminAuthMiddleware.requireScope('settings:admin'),
  coreTeamController.adminListCoreTeamMembers
);
router.post(
  '/api/admin/core-team/members',
  adminAuthMiddleware.requireScope('settings:admin'),
  adminAuditMiddleware,
  coreTeamController.adminAddCoreTeamMember
);
router.delete(
  '/api/admin/core-team/members/:id',
  adminAuthMiddleware.requireScope('settings:admin'),
  attachOldState(async (req) => {
    const members = await coreTeamService.listMembers();
    return members.find((m) => String(m.id) === String(req.params.id));
  }),
  adminAuditMiddleware,
  coreTeamController.adminDeleteCoreTeamMember
);

// Subscription management APIs
router.get(
  '/api/admin/subscriptions',
  adminAuthMiddleware.requireScope('events:read'),
  subscriptionsController.listSubscriptions
);
router.get(
  '/api/admin/subscriptions/stats',
  adminAuthMiddleware.requireScope('events:read'),
  subscriptionsController.getStats
);
router.post(
  '/api/admin/subscriptions',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  subscriptionsController.createSubscription
);

// Banners Admin
router.get('/api/admin/banners', adminAuthMiddleware.requireAdmin, bannersController.listAllBanners);
router.post('/api/admin/banners', adminAuthMiddleware.requireAdmin, bannersController.createBanner);
router.put('/api/admin/banners/:id', adminAuthMiddleware.requireAdmin, bannersController.updateBanner);
router.delete('/api/admin/banners/:id', adminAuthMiddleware.requireAdmin, bannersController.deleteBanner);

router.post(
  '/api/admin/subscriptions/:userId/cancel',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  subscriptionsController.cancelSubscription
);
router.get(
  '/api/admin/subscriptions/:userId/billing',
  adminAuthMiddleware.requireScope('events:read'),
  subscriptionsController.getBillingHistory
);

// Portfolio management APIs
router.get(
  '/api/admin/portfolios',
  adminAuthMiddleware.requireScope('events:read'),
  async (req, res) => {
    try {
      const username = String(req.query.username || '').trim();
      if (username) {
        const portfolio = await portfolioService.getByUsername(username);
        return res.json(portfolio ? { portfolios: [portfolio] } : { portfolios: [] });
      }
      const portfolios = (await portfolioRepository.listAll)
        ? await portfolioRepository.listAll()
        : [];
      return res.json({ portfolios });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
router.delete(
  '/api/admin/portfolios/:username',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      if (!username) return res.status(400).json({ error: 'Username required' });
      await portfolioRepository.delete(username);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// Portfolio Analytics APIs

router.get(
  '/api/portfolio/:username/analytics',
  portfolioAnalyticsController.getPortfolioAnalytics
);

router.post(
  '/api/portfolio/:username/visit',
  portfolioAnalyticsController.recordPortfolioVisit
);
router.post('/api/portfolio/:username/visit', portfolioAnalyticsController.recordPortfolioVisit);

router.get(
  '/api/portfolio/:username/monthly-report',
  portfolioAnalyticsController.getMonthlyReport
);

// Achievement management APIs
router.get(
  '/api/admin/portfolios/:username/achievements',
  adminAuthMiddleware.requireScope('events:read'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      const achievements = await achievementsRepository.getByUsername(username);
      return res.json({ achievements });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
router.post(
  '/api/admin/portfolios/:username/achievements',
  adminAuthMiddleware.requireScope('events:write'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      const { name, description, tier, iconUrl, source } = req.body;
      if (!name) return res.status(400).json({ error: 'Achievement name is required' });
      const achievement = await portfolioService.awardAchievement(username, {
        name: String(name).trim().slice(0, 120),
        description: description ? String(description).trim().slice(0, 1000) : null,
        tier: tier ? String(tier).trim().slice(0, 40) : 'bronze',
        iconUrl: iconUrl ? String(iconUrl).trim().slice(0, 500) : null,
        source: source ? String(source).trim().slice(0, 60) : 'admin',
      });
      return res.status(201).json({ achievement });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
router.delete(
  '/api/admin/portfolios/:username/achievements/:name',
  adminAuthMiddleware.requireScope('events:write'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      const name = String(req.params.name || '').trim();
      await portfolioService.removeAchievement(username, name);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// Sponsorship management APIs
router.get('/api/content/sponsors', sponsorshipsController.listSponsors);
router.get(
  '/api/admin/sponsors',
  adminAuthMiddleware.requireScope('events:read'),
  sponsorshipsController.adminListSponsors
);
router.post(
  '/api/admin/sponsors',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  sponsorshipsController.adminCreateSponsor
);
router.put(
  '/api/admin/sponsors/:id',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  sponsorshipsController.adminUpdateSponsor
);
router.delete(
  '/api/admin/sponsors/:id',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  sponsorshipsController.adminDeleteSponsor
router.post('/api/admin/impersonate/stop', adminAuthMiddleware.requireAdmin, (req, res) => {
  impersonationService.stop(req.adminSession.token);
  return res.json({ impersonating: false });
});
router.get('/api/admin/impersonate/status', adminAuthMiddleware.requireAdmin, (req, res) => {
  const active = impersonationService.getActive(req.adminSession.token);
  return res.json({ impersonating: !!active, user: active?.targetUser || null });
});
router.use(
"/api/announcements",
announcementPriorityRouter
);

router.use("/api/events", eventConflictRouter);

router.use(
  "/api/admin/waitlist",
  waitlistRoutes
);

// Audit Log Viewer APIs
}); // Audit Log Viewer APIs
router.get('/api/admin/audit-logs', adminAuthMiddleware.requireAdmin, auditLogController.listLogs);

router.get(
  '/api/admin/audit-logs/stats',
  adminAuthMiddleware.requireAdmin,
  auditLogController.getStats
);

router.use("/recommendations", recommendationEngine);
router.use(
  "/recommendations",
  recommendationEngine
);
router.use(
  "/recommendations",
  recommendationEngine
);
router.use(
  "/recommendations",
  recommendationEngine
);
router.use('/recommendations', recommendationEngine);

// Follows/User Following System APIs
// Follow/Unfollow operations
router.post(
  '/api/student/follows/:followingId',
  requireStudentAuth,
  protectedActionRateLimiter,
  followsController.followUser
);
router.delete(
  '/api/student/follows/:followingId',
  requireStudentAuth,
  protectedActionRateLimiter,
  followsController.unfollowUser
);

// Check follow status
router.get(
  '/api/student/follows/status/:followingId',
  requireStudentAuth,
  followsController.checkFollowStatus
);

// Get followers and following lists
router.get('/api/student/users/:userId/followers', followsController.getUserFollowers);
router.get('/api/student/users/:userId/following', followsController.getUserFollowing);

// Get follow counts
router.get('/api/student/users/:userId/follow-counts', followsController.getFollowCounts);

// Current user endpoints
router.get(
  '/api/student/me/followers',
  requireStudentAuth,
  followsController.getCurrentUserFollowers
);
router.get(
  '/api/student/me/following',
  requireStudentAuth,
  followsController.getCurrentUserFollowing
);
router.get(
  '/api/student/me/follow-counts',
  requireStudentAuth,
  followsController.getCurrentUserFollowCounts
);

// Activity feed from followed users
router.get(
  '/api/student/activity-feed/followed',
  requireStudentAuth,
  followsController.getFollowedUsersActivityFeed
);

// Platform Analytics APIs
router.use('/api/analytics', platformAnalyticsRoutes);

router.use("/api-analytics", apiAnalyticsRoutes);

router.use("/api/analytics", platformAnalyticsRoutes);
router.use("/digital-assets", digitalAssetRoutes);
router.use('/api/analytics', requireStudentAuth, platformAnalyticsRoutes);
router.use('/api/budget', adminAuthMiddleware.requireAdmin, budgetRoutes);
router.use('/api/webhooks', googleFormsWebhookRoutes);
router.use("/notification-campaigns", notificationCampaignRoutes);
import hashtagsRouter from './hashtags.js';
router.use('/api/hashtags', hashtagsRouter);

export default router;
