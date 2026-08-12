import { emailTemplateRepository } from '../repositories/emailTemplateRepository.js';
import { sendEmail, renderTemplateHtml } from '../services/emailService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getMockDataForTemplate(templateName) {
  // Common placeholders for previewing
  return {
    username: 'Jane Doe',
    name: 'Jane Doe',
    eventname: 'Annual Tech Symposium',
    title: 'Annual Tech Symposium',
    date: new Date().toLocaleDateString(),
    verifyUrl: 'https://nexasphere.example.com/verify?token=mock',
    resetUrl: 'https://nexasphere.example.com/reset?token=mock',
    dashboardUrl: 'https://nexasphere.example.com/dashboard',
  };
}

export const emailTemplateController = {
  async getTemplates(req, res) {
    try {
      const templates = await emailTemplateRepository.getAll();
      return sendSuccess(res, { templates });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  async getTemplate(req, res) {
    try {
      const { name } = req.params;
      const template = await emailTemplateRepository.getByName(name);
      if (!template) {
        // Return default if not in DB
        try {
          const templatePath = path.join(__dirname, '..', 'services', 'templates', `${name}.ejs`);
          const body = await fs.readFile(templatePath, 'utf-8');
          return sendSuccess(res, {
            template: { name, subject: 'Default Subject', body, is_default: true },
          });
        } catch (err) {
          return sendError(req, res, 'Template not found', 404, 'NOT_FOUND');
        }
      }
      return sendSuccess(res, { template });
    } catch (error) {
      console.error('Error fetching template:', error);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  async updateTemplate(req, res) {
    try {
      const { name } = req.params;
      const { subject, body } = req.body;

      if (!subject || !body) {
        return sendError(req, res, 'Subject and body are required', 400, 'VALIDATION_ERROR');
      }

      const updated = await emailTemplateRepository.upsertTemplate({ name, subject, body });
      return sendSuccess(res, { template: updated });
    } catch (error) {
      console.error('Error updating template:', error);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  async resetTemplate(req, res) {
    try {
      const { name } = req.params;
      await emailTemplateRepository.deleteTemplate(name);
      return sendSuccess(res, { message: 'Template reset to default' });
    } catch (error) {
      console.error('Error resetting template:', error);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },

  async previewTemplate(req, res) {
    try {
      const { name } = req.params;
      const { body } = req.body;
      const mockData = getMockDataForTemplate(name);

      let html = '';
      if (body) {
        html = await renderTemplateHtml(name, mockData, body);
      } else {
        html = await renderTemplateHtml(name, mockData);
      }

      return sendSuccess(res, { html });
    } catch (error) {
      console.error('Error previewing template:', error);
      return sendError(
        req,
        res,
        error.message || 'Error rendering template',
        500,
        'INTERNAL_ERROR'
      );
    }
  },

  async testTemplate(req, res) {
    try {
      const { name } = req.params;
      const { email, subject, body } = req.body;

      if (!email) return sendError(req, res, 'Email is required', 400, 'VALIDATION_ERROR');

      const mockData = getMockDataForTemplate(name);

      const result = await sendEmail({
        to: email,
        subject: subject || `Test: ${name} Template`,
        templateName: name,
        data: mockData,
        customTemplateContent: body || null,
      });

      if (!result.success) {
        return sendError(req, res, 'Failed to send test email', 500, 'INTERNAL_ERROR');
      }

      return sendSuccess(res, { messageId: result.messageId });
    } catch (error) {
      console.error('Error sending test email:', error);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  },
};
