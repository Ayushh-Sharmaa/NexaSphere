import express from 'express';
import {
  getDashboardOverview,
  getUserAnalytics,
  getEventAnalytics,
  getClubAnalytics,
  getPortfolioAnalytics,
  getGrowthAnalytics,
  exportReport,
} from '../controllers/platformAnalyticsController.js';

const router = express.Router();

router.get('/overview', getDashboardOverview);

router.get('/users', getUserAnalytics);

router.get('/events', getEventAnalytics);

router.get('/clubs', getClubAnalytics);

router.get('/portfolios', getPortfolioAnalytics);

router.get('/growth', getGrowthAnalytics);

router.get('/export', exportReport);

export default router;
