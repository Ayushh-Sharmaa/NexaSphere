import { userSegmentsRepository } from '../repositories/userSegmentsRepository.js';
import { emailCampaignRepository } from '../repositories/emailCampaignRepository.js';

export const segmentationService = {
  async createSegment(data) {
    return userSegmentsRepository.createSegment(data);
  },

  async getSegments() {
    return userSegmentsRepository.getSegments();
  },

  async getSegmentById(id) {
    return userSegmentsRepository.getSegmentById(id);
  },

  async updateSegment(id, data) {
    return userSegmentsRepository.updateSegment(id, data);
  },

  async deleteSegment(id) {
    return userSegmentsRepository.deleteSegment(id);
  },

  async getSegmentUsers(segmentId) {
    const segment = await userSegmentsRepository.getSegmentById(segmentId);
    if (!segment) throw new Error('Segment not found');

    const criteria = segment.criteria;
    if (!criteria || typeof criteria !== 'object' || Object.keys(criteria).length === 0) {
      return [];
    }

    // We reuse the email campaign repo's user fetching logic for segments
    return emailCampaignRepository.getSegmentUsers(criteria);
  },

  async runAutoSegmentation() {
    // Defines auto-segmentation thresholds
    // Example: No login for 30 days = inactive
    console.log('[SegmentationService] Running daily auto-segmentation job...');
    await userSegmentsRepository.batchUpdateActivityLevels({ inactiveDays: 30 });
    console.log('[SegmentationService] Auto-segmentation completed.');
  },
};
