import { bannersRepository } from '../repositories/bannersRepository.js';
import { bannerSchema } from '../validators/bannerSchemas.js';

export const bannersService = {
  async listAllBanners() {
    return bannersRepository.listAll();
  },

  async listActiveBanners() {
    return bannersRepository.listActive();
  },

  async getBannerById(id) {
    return bannersRepository.getById(id);
  },

  async createBanner(input) {
    const banner = bannerSchema.parse(input);
    return bannersRepository.create(banner);
  },

  async updateBanner(id, input) {
    const patch = bannerSchema.partial().parse({ ...input, id });
    return bannersRepository.update(id, patch);
  },

  async deleteBanner(id) {
    return bannersRepository.delete(id);
  },
};
