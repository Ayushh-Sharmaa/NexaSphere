import { subscriptionService } from '../services/subscriptionService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export async function listSubscriptions(req, res) {
  try {
    const subscriptions = subscriptionService.listAllSubscriptions();
    sendSuccess(res, { subscriptions });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
}

export async function getStats(req, res) {
  try {
    const subs = subscriptionService.listAllSubscriptions();
    sendSuccess(res, {
      total: subs.length,
      premium: subs.filter((s) => s.tier === 'premium').length,
      pro: subs.filter((s) => s.tier === 'pro').length,
      revenue: subs.reduce((sum, s) => sum + (s.price || 0), 0),
    });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
}

export async function createSubscription(req, res) {
  try {
    const { userId, tierId } = req.body;
    if (!userId || !tierId)
      return sendError(req, res, 'userId and tierId required', 400, 'VALIDATION_ERROR');
    const result = subscriptionService.createSubscription(userId, tierId);
    subscriptionService.processPayment(userId, result.price);
    sendSuccess(res, result, 201);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
}

export async function cancelSubscription(req, res) {
  try {
    const { userId } = req.params;
    const result = subscriptionService.cancelSubscription(userId);
    sendSuccess(res, result);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
}

export async function getBillingHistory(req, res) {
  try {
    const { userId } = req.params;
    const history = subscriptionService.getBillingHistory(userId);
    sendSuccess(res, { invoices: history });
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
}
