import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { dynamicPricingService } from '../services/dynamicPricingService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((err) => {
      console.error('[DynamicPricingController]', err);
      sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
}

function requireAdmin(req, res) {
  const user = req.studentUser || req.user;
  if (!user || (user.role !== 'admin' && !user.isAdmin)) {
    sendError(req, res, 'Admin access required', 403, 'FORBIDDEN');
    return false;
  }
  return true;
}

// POST /api/pricing/config/:eventId
export const upsertPricing = wrapAsync(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { eventId } = req.params;
  const { basePrice, minPrice, maxPrice, capacity, eventDate } = req.body;

  if (basePrice == null || minPrice == null || maxPrice == null || !capacity || !eventDate) {
    return sendError(req, res, 'Missing required fields', 400, 'VALIDATION_ERROR');
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const result = await dynamicPricingService.upsertPricing(eventId, {
    basePrice: Number(basePrice),
    minPrice: Number(minPrice),
    maxPrice: Number(maxPrice),
    capacity: Number(capacity),
    eventDate,
  });

  sendSuccess(res, { data: result });
  res.json({ success: true, data: result });
});

// GET /api/pricing/:eventId
export const getPricing = wrapAsync(async (req, res) => {
  const { eventId } = req.params;
  const pricing = await dynamicPricingService.getPricing(eventId);

  if (!pricing) return sendError(req, res, 'Pricing not found', 404, 'NOT_FOUND');

  sendSuccess(res, { pricing });
  if (!pricing) return res.status(404).json({ success: false, error: 'Pricing not found' });

  res.json({ success: true, pricing });
});

// GET /api/pricing/transparency/:eventId
export const getPriceTransparency = wrapAsync(async (req, res) => {
  const { eventId } = req.params;
  const email = req.user?.email || req.query.email || null;
  const transparency = await dynamicPricingService.getPriceTransparency(eventId, email);

  if (!transparency) return sendError(req, res, 'Pricing not found', 404, 'NOT_FOUND');

  sendSuccess(res, { transparency });
  if (!transparency) return res.status(404).json({ success: false, error: 'Pricing not found' });

  res.json({ success: true, transparency });
});

// POST /api/pricing/recalculate/:eventId
export const recalculatePrice = wrapAsync(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { eventId } = req.params;
  const result = await dynamicPricingService.recalculatePrice(eventId);
  sendSuccess(res, { result });
  res.json({ success: true, result });
});

// POST /api/pricing/override/:eventId
export const setAdminOverride = wrapAsync(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { eventId } = req.params;
  const { overridePrice } = req.body; // pass null to clear

  const result = await dynamicPricingService.setAdminOverride(eventId, overridePrice);
  sendSuccess(res, { pricing: result });
  res.json({ success: true, pricing: result });
});

// GET /api/pricing/analytics/all
export const getAnalytics = wrapAsync(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const analytics = await dynamicPricingService.getPricingAnalytics();
  sendSuccess(res, { analytics });
  res.json({ success: true, analytics });
});
