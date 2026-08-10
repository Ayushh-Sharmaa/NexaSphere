import { wrapAsync } from '../middleware/asyncHandler.js';
import { bannersService } from '../services/bannersService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const listAllBanners = wrapAsync(async (req, res) => {
  const banners = await bannersService.listAllBanners();
  return sendSuccess(res, { banners });
import { wrapAsync } from '../utils/async.js';


export const listActiveBanners = wrapAsync(async (req, res) => {
  const banners = await bannersService.listActiveBanners();
  return sendSuccess(res, { banners });
});

export const createBanner = wrapAsync(async (req, res) => {
  const created = await bannersService.createBanner(req.body);
  return sendSuccess(res, { banner: created }, 201);
});

export const updateBanner = wrapAsync(async (req, res) => {
  const id = req.params.id;
  const updated = await bannersService.updateBanner(id, req.body);
  if (!updated) {
    return sendError(req, res, 'Banner not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { banner: updated });
  }
  return res.json({ ok: true, banner: updated });
});

export const deleteBanner = wrapAsync(async (req, res) => {
  const id = req.params.id;
  const deleted = await bannersService.deleteBanner(id);
  if (!deleted) {
    return sendError(req, res, 'Banner not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { ok: true });
  }
  return res.json({ ok: true });
});
