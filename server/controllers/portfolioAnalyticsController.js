import { portfolioAnalyticsService } from "../services/portfolioAnalyticsService.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export async function getPortfolioAnalytics(req, res) {
  try {
    const analytics = await portfolioAnalyticsService.getAnalytics(
      req.params.username
    );
    return sendSuccess(res, { analytics });
  } catch (err) {
    return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
  }
}

export async function recordPortfolioVisit(req, res) {
  try {
    const response = await portfolioAnalyticsService.recordVisit(
      req.params.username
    );
    return sendSuccess(res, response);
  } catch (err) {
    return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
  }
}

export async function getMonthlyReport(req, res) {
  try {
    const report = await portfolioAnalyticsService.getMonthlyReport(
      req.params.username
    );
    return sendSuccess(res, { report });
  } catch (err) {
    return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
  }
}
