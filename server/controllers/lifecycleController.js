import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import eventManager from '../services/eventEmitterService.js';

const prisma = new PrismaClient();

// Calculate lifecycle stage based on rules
const determineStage = (eventsAttended = 0, lastActiveAt, createdAt) => {
  const now = new Date();
  const createdDate = createdAt ? new Date(createdAt) : now;
  const activeDate = lastActiveAt ? new Date(lastActiveAt) : createdDate;

  const daysSinceActive = (now - activeDate) / (1000 * 60 * 60 * 24);
  const daysSinceSignup = (now - createdDate) / (1000 * 60 * 60 * 24);

  // High engagement users
  if (eventsAttended >= 10) return 'POWER_USER';
  if (eventsAttended >= 3) return 'ACTIVE';

  // Inactivity checks for low/medium engagement
  if (daysSinceActive > 180) return 'CHURNED';
  if (daysSinceActive > 60) return 'INACTIVE';

  // Early stage users
  if (eventsAttended === 0 && daysSinceSignup <= 7) return 'NEW_USER';
  if (eventsAttended === 0 && daysSinceSignup > 7) return 'PROSPECT';

  return 'ACTIVE';
};

export const getUserLifecycle = async (req, res) => {
  try {
    const { userId } = req.params;
    const lifecycle = await prisma.userLifecycle.findUnique({
      where: { userId },
    });

    if (!lifecycle) {
      return sendError(req, res, 'User lifecycle not found', 404, 'NOT_FOUND');
    }

    sendSuccess(res, { lifecycle });
  } catch (error) {
    console.error('Error fetching lifecycle:', error);
    sendError(req, res, 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
};

export const updateEventAttended = async (req, res) => {
  try {
    const { userId } = req.body;
    const lifecycle = await prisma.userLifecycle.findUnique({
      where: { userId },
    });

    if (!lifecycle) {
      return sendError(req, res, 'User lifecycle not found', 404, 'NOT_FOUND');
    }

    const newEventsAttended = lifecycle.eventsAttended + 1;
    const newStage = determineStage(newEventsAttended, new Date(), lifecycle.createdAt);

    const updated = await prisma.userLifecycle.update({
      where: { userId },
      data: {
        eventsAttended: newEventsAttended,
        lastActiveAt: new Date(),
        stage: newStage,
      },
    });

    if (lifecycle.stage !== newStage) {
      eventManager.emitEvent('user-stage-changed', {
        userId,
        oldStage: lifecycle.stage,
        newStage,
      });
    }
    sendSuccess(res, { lifecycle: updated });
  } catch (error) {
    console.error('Error updating event attended:', error);
    sendError(req, res, 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
};

export const getLifecycleAnalytics = async (req, res) => {
  try {
    const stats = await prisma.userLifecycle.groupBy({
      by: ['stage'],
      _count: { stage: true },
    });

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr.stage] = curr._count.stage;
      return acc;
    }, {});

    sendSuccess(res, { stats: formattedStats });
  } catch (error) {
    console.error('Error fetching lifecycle analytics:', error);
    sendError(req, res, 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
};
