import platformAnalyticsService from '../services/platformAnalyticsService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const getDashboardOverview = (req, res) => {
  sendSuccess(res, platformAnalyticsService.getDashboardOverview());
};

export const getUserAnalytics = (req, res) => {
  sendSuccess(res, platformAnalyticsService.getUserAnalytics());
};

export const getEventAnalytics = (req, res) => {
  sendSuccess(res, platformAnalyticsService.getEventAnalytics());
};

export const getClubAnalytics = (req, res) => {
  sendSuccess(res, platformAnalyticsService.getClubAnalytics());
};

export const getPortfolioAnalytics = (req, res) => {
  sendSuccess(res, platformAnalyticsService.getPortfolioAnalytics());
};

export const getGrowthAnalytics = (req, res) => {
  sendSuccess(res, platformAnalyticsService.getGrowthAnalytics());
};

export const exportReport = (req, res) => {
  sendSuccess(res, platformAnalyticsService.exportReport());
};
