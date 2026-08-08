import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  updateTemplateBodySchema,
  updateTemplateParamsSchema,
  resetTemplateParamsSchema,
  previewTemplateBodySchema,
  previewTemplateParamsSchema,
  testTemplateBodySchema,
  testTemplateParamsSchema,
} from '../validators/routes/emailTemplateRoutesSchemas.js';
import { emailTemplateController } from '../controllers/emailTemplateController.js';
import * as adminAuthMiddleware from '../middleware/adminAuthMiddleware.js';

const router = Router();

// All routes here are admin only
router.use(adminAuthMiddleware.requireAdmin);

router.get('/', emailTemplateController.getTemplates);
router.get('/:name', emailTemplateController.getTemplate);
router.put(
  '/:name',
  validate(updateTemplateParamsSchema, 'params'),
  validate(updateTemplateBodySchema),
  emailTemplateController.updateTemplate
);
router.post(
  '/:name/reset',
  validate(resetTemplateParamsSchema, 'params'),
  emailTemplateController.resetTemplate
);
router.post(
  '/:name/preview',
  validate(previewTemplateParamsSchema, 'params'),
  validate(previewTemplateBodySchema),
  emailTemplateController.previewTemplate
);
router.post(
  '/:name/test',
  validate(testTemplateParamsSchema, 'params'),
  validate(testTemplateBodySchema),
  emailTemplateController.testTemplate
);

export default router;
