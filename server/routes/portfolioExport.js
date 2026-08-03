import { Router } from 'express';
import { portfolioExportService } from '../services/portfolioExportService.js';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import logger from '../utils/logger.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import {
  usernameParamsSchema,
  pdfQuerySchema,
  websiteQuerySchema,
} from '../validators/routes/portfolioExportSchemas.js';

const router = Router();

router.get(
  '/:username/pdf',
  validate(usernameParamsSchema, 'params'),
  validate(pdfQuerySchema, 'query'),
  async (req, res) => {
    try {
      const { username } = req.params;
      const { pageSize = 'A4', includeContact = 'true', watermark = 'true' } = req.query;

      const result = await portfolioExportService.generatePDF(username, {
        pageSize,
        includeContact: includeContact === 'true',
        watermark: watermark === 'true',
      });

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="${username}-portfolio.html"`);
      res.send(result.html);
    } catch (error) {
      logger.error('Error generating PDF', { error: error.message, username: req.params.username });
      const status = error.message.includes('not found') ? 404 : 500;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
    }
  }
);

router.get(
  '/:username/website',
  validate(usernameParamsSchema, 'params'),
  validate(websiteQuerySchema, 'query'),
  async (req, res) => {
    try {
      const { username } = req.params;
      const { includeSEO = 'true', includeAnalytics = 'false', analyticsId = '' } = req.query;

      const result = await portfolioExportService.generateWebsite(username, {
        includeSEO: includeSEO === 'true',
        includeAnalytics: includeAnalytics === 'true',
        analyticsId,
      });

      res.setHeader('Content-Type', 'application/json');
      sendSuccess(res, {
        data: {
          html: result.html,
          css: result.css,
          assets: result.assets,
          portfolioUrl: result.portfolioUrl,
        },
      });
    } catch (error) {
      logger.error('Error generating website', {
        error: error.message,
        username: req.params.username,
      });
      const status = error.message.includes('not found') ? 404 : 500;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
    }
  }
);

router.get('/:username/qr-code', validate(usernameParamsSchema, 'params'), async (req, res) => {
  try {
    const { username } = req.params;
    const portfolioUrl = `${process.env.FRONTEND_URL || 'https://nexasphere.com'}/portfolio/${username}`;
    const qrCode = await portfolioExportService.generateQRCode(portfolioUrl);

    if (!qrCode) {
      return sendError(req, res, 'Failed to generate QR code', 500, 'INTERNAL_ERROR');
    }

    sendSuccess(res, { data: { qrCode, url: portfolioUrl } });
  } catch (error) {
    logger.error('Error generating QR code', {
      error: error.message,
      username: req.params.username,
    });
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

router.get(
  '/:username/website/html',
  validate(usernameParamsSchema, 'params'),
  validate(websiteQuerySchema, 'query'),
  async (req, res) => {
    try {
      const { username } = req.params;
      const { includeSEO = 'true', includeAnalytics = 'false', analyticsId = '' } = req.query;

      const result = await portfolioExportService.generateWebsite(username, {
        includeSEO: includeSEO === 'true',
        includeAnalytics: includeAnalytics === 'true',
        analyticsId,
      });

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="${username}-portfolio.html"`);
      res.send(result.html);
    } catch (error) {
      logger.error('Error generating website HTML', {
        error: error.message,
        username: req.params.username,
      });
      const status = error.message.includes('not found') ? 404 : 500;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
    }
  }
);

router.get('/:username/website/css', validate(usernameParamsSchema, 'params'), async (req, res) => {
  try {
    const { username } = req.params;
    const result = await portfolioExportService.generateWebsite(username);

    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Content-Disposition', `inline; filename="${username}-portfolio.css"`);
    res.send(result.css);
  } catch (error) {
    logger.error('Error generating website CSS', {
      error: error.message,
      username: req.params.username,
    });
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

export default router;
