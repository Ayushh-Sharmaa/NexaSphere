import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all dynamic forms
router.get('/', async (req, res) => {
  try {
    const forms = await prisma.form.findMany({
      include: { fields: true },
    });
    sendSuccess(res, forms);
  } catch (error) {
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

// Create a new dynamic form
router.post('/', async (req, res) => {
  try {
    const { title, description, eventId, fields, logic } = req.body;
    const form = await prisma.form.create({
      data: {
        title,
        description,
        eventId,
        fields: {
          create: fields,
        },
        logic: logic
          ? {
              create: logic,
            }
          : undefined,
      },
      include: { fields: true, logic: true },
    });
    sendSuccess(res, form, 201);
  } catch (error) {
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

// Submit a form response
router.post('/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, userId } = req.body;

    const response = await prisma.formResponse.create({
      data: {
        formId: id,
        userId,
        answers: {
          create: answers.map((ans) => ({
            fieldId: ans.fieldId,
            value: ans.value,
          })),
        },
      },
      include: { answers: true },
    });
    sendSuccess(res, response, 201);
  } catch (error) {
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

// Get form analytics/responses
router.get('/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const responses = await prisma.formResponse.findMany({
      where: { formId: id },
      include: { answers: { include: { field: true } } },
    });
    sendSuccess(res, responses);
  } catch (error) {
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

export default router;
