import { wrapAsync } from '../middleware/asyncHandler.js';
import { bannersService } from '../services/bannersService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const listAllBanners = wrapAsync(async (req, res) => {
  const banners = await bannersService.listAllBanners();
  return sendSuccess(res, { banners });


}
)