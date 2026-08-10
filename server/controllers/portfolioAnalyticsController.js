import { portfolioAnalyticsService } from '../services/portfolioAnalyticsService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export async function getPortfolioAnalytics(req, res) {
  try {
    const analytics = await portfolioAnalyticsService.getAnalytics(req.params.username);

    sendSuccess(res, {
      analytics,
    });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');


}
}
export async function recordPortfolioVisit(req, res) {
  try {
    const response = await portfolioAnalyticsService.recordVisit(req.params.username);

    sendSuccess(res, response);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
    const response =
      await portfolioAnalyticsService.recordVisit(
        req.params.username
      );
  }
}

export async function getMonthlyReport(req, res) {
  try {
    const report = await portfolioAnalyticsService.getMonthlyReport(req.params.username);

    sendSuccess(res, {
      report,
    });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
}
    const report =
      await portfolioAnalyticsService.getMonthlyReport(
        req.params.username
      );

    res.json({
      success: true,
      report,
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
