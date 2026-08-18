import { wrapAsync } from "../middleware/asyncHandler.js";
import { bannersService } from "../services/bannersService.js";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";

export const listAllBanners = wrapAsync(async (req, res) => {
  const banners = await bannersService.listAllBanners();
  return sendSuccess(res, { banners });
});

export const getBannerById = wrapAsync(async (req, res) => {
  const banner = await bannersService.getBannerById(req.params.id);
  if (!banner) {
    return sendError(res, "Banner not found", 404);
  }
  return sendSuccess(res, { banner });
});

export const createBanner = wrapAsync(async (req, res) => {
  const banner = await bannersService.createBanner(req.body);
  return sendSuccess(res, { banner }, 201);
});

export const updateBanner = wrapAsync(async (req, res) => {
  const banner = await bannersService.updateBanner(req.params.id, req.body);
  if (!banner) {
    return sendError(res, "Banner not found", 404);
  }
  return sendSuccess(res, { banner });
});

export const deleteBanner = wrapAsync(async (req, res) => {
  const deleted = await bannersService.deleteBanner(req.params.id);
  if (!deleted) {
    return sendError(res, "Banner not found", 404);
  }
  return sendNoContent(res);
});
