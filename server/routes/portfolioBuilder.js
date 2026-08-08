import { Router } from 'express';
import { portfolioBuilderService } from '../services/portfolioBuilderService.js';
import { auth } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';
import {
  usernameParamsSchema,
  sectionParamsSchema,
  sectionWithDirectionParamsSchema,
  templateParamsSchema,
  addSectionBodySchema,
  updateSectionBodySchema,
  reorderSectionsBodySchema,
  sectionContentBodySchema,
} from '../validators/routes/portfolioBuilderSchemas.js';

const router = Router();

router.get('/:username/sections', validate(usernameParamsSchema, 'params'), async (req, res) => {
  try {
    const sections = await portfolioBuilderService.getSections(req.params.username);
    sendSuccess(res, { data: sections });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  }
});

router.post(
  '/:username/sections',
  validate(usernameParamsSchema, 'params'),
  validate(addSectionBodySchema),
  auth('student'),
  async (req, res) => {
    try {
      const section = await portfolioBuilderService.addSection(req.params.username, req.body);
      sendSuccess(res, { data: section }, 201);
    } catch (error) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already exists')
          ? 409
          : 400;
      sendError(
        req,
        res,
        error.message,
        status,
        status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : 'VALIDATION_ERROR'
      );
    }
  }
);

router.put(
  '/:username/sections/:sectionKey',
  validate(sectionParamsSchema, 'params'),
  validate(updateSectionBodySchema),
  auth('student'),
  async (req, res) => {
    try {
      const section = await portfolioBuilderService.updateSection(
        req.params.username,
        req.params.sectionKey,
        req.body
      );
      sendSuccess(res, { data: section });
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR');
    }
  }
);

router.delete(
  '/:username/sections/:sectionKey',
  validate(sectionParamsSchema, 'params'),
  auth('student'),
  async (req, res) => {
    try {
      await portfolioBuilderService.deleteSection(req.params.username, req.params.sectionKey);
      sendSuccess(res, { message: 'Section deleted successfully' });
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR');
    }
  }
);

router.put(
  '/:username/sections/reorder',
  validate(usernameParamsSchema, 'params'),
  validate(reorderSectionsBodySchema),
  auth('student'),
  async (req, res) => {
    try {
      const sections = await portfolioBuilderService.reorderSections(
        req.params.username,
        req.body.sections
      );
      sendSuccess(res, { data: sections });
    } catch (error) {
      sendError(req, res, error.message, 400, 'VALIDATION_ERROR');
    }
  }
);

router.put(
  '/:username/sections/:sectionKey/visibility',
  validate(sectionParamsSchema, 'params'),
  auth('student'),
  async (req, res) => {
    try {
      const section = await portfolioBuilderService.toggleSectionVisibility(
        req.params.username,
        req.params.sectionKey
      );
      sendSuccess(res, { data: section });
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR');
    }
  }
);

router.put(
  '/:username/sections/:sectionKey/move/:direction',
  validate(sectionWithDirectionParamsSchema, 'params'),
  auth('student'),
  async (req, res) => {
    try {
      const { direction } = req.params;
      if (!['up', 'down'].includes(direction)) {
        return sendError(req, res, 'Direction must be up or down', 400, 'VALIDATION_ERROR');
      }
      const sections = await portfolioBuilderService.moveSection(
        req.params.username,
        req.params.sectionKey,
        direction
      );
      sendSuccess(res, { data: sections });
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR');
    }
  }
);

router.put(
  '/:username/sections/:sectionKey/content',
  validate(sectionParamsSchema, 'params'),
  validate(sectionContentBodySchema),
  auth('student'),
  async (req, res) => {
    try {
      const section = await portfolioBuilderService.updateSectionContent(
        req.params.username,
        req.params.sectionKey,
        req.body
      );
      sendSuccess(res, { data: section });
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR');
    }
  }
);

router.get('/templates', async (req, res) => {
  try {
    const templates = await portfolioBuilderService.getTemplates();
    sendSuccess(res, { data: templates });
  } catch (error) {
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

router.post(
  '/:username/sections/template/:templateId',
  validate(templateParamsSchema, 'params'),
  auth('student'),
  async (req, res) => {
    try {
      const section = await portfolioBuilderService.addSectionFromTemplate(
        req.params.username,
        req.params.templateId,
        req.body
      );
      sendSuccess(res, { data: section }, 201);
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR');
    }
  }
);

export default router;
