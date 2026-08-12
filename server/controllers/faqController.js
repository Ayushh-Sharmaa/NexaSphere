import { faqRepository } from '../repositories/faqRepository.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const faqController = {
  // Public endpoint
  async getFAQs(req, res) {
    try {
      const search = req.query.search || '';
      const category = req.query.category || null;
      const faqs = await faqRepository.getAll(search, category);
      return sendSuccess(res, { faqs });
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  // Track views
  async trackView(req, res) {
    try {
      const { id } = req.params;
      const success = await faqRepository.incrementViews(id);
      if (!success) {
        return sendError(req, res, 'FAQ not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, { success: true });
    } catch (err) {
      console.error('Error tracking FAQ view:', err);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },


  // Admin endpoint: list all
  async adminGetFAQs(req, res) {
    try {
      const faqs = await faqRepository.getAdminAll();
      return sendSuccess(res, { faqs });
    } catch (err) {
      console.error('Error fetching Admin FAQs:', err);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  // Admin endpoint: create
  async adminCreateFAQ(req, res) {
    try {
      const { question, answer, category, is_active } = req.body;
      if (!question || !answer) {
        return sendError(req, res, 'Question and answer are required', 400, 'VALIDATION_ERROR');
      }
      const faq = await faqRepository.create({ question, answer, category, is_active });
      return sendSuccess(res, { faq }, 201);
    } catch (err) {
      console.error('Error creating FAQ:', err);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  // Admin endpoint: update
  async adminUpdateFAQ(req, res) {
    try {
      const { id } = req.params;
      const { question, answer, category, is_active } = req.body;
      const updated = await faqRepository.update(id, { question, answer, category, is_active });
      if (!updated) return sendError(req, res, 'FAQ not found', 404, 'NOT_FOUND');
      return sendSuccess(res, { faq: updated });
    } catch (err) {
      console.error('Error updating FAQ:', err);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  // Admin endpoint: delete
  async adminDeleteFAQ(req, res) {
    try {
      const { id } = req.params;
      const deleted = await faqRepository.delete(id);
      if (!deleted) return sendError(req, res, 'FAQ not found', 404, 'NOT_FOUND');
      return sendSuccess(res, { success: true });
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },
};
