/**
 * Project Health Controller
 *
 * Aggregates the key numbers admins currently have to gather manually by
 * visiting Events, Core Team, and Forum pages one at a time. Reuses the
 * existing services/repositories for each domain and combines their totals
 * into a single response so the dashboard can render an overview in one
 * request instead of several.
 */
import { eventsService } from '../services/eventsService.js';
import { coreTeamRepository } from '../repositories/coreTeamRepository.js';
import { forumRepository } from '../repositories/forumRepository.js';

async function safe(promiseFactory, fallback) {
  try {
    return await promiseFactory();
  } catch (err) {
    console.error('projectHealthController: partial failure', err.message);
    return fallback;
  }
}

export const projectHealthController = {
  async getOverview(req, res) {
    const [events, upcomingEvents, team, pendingThreads] = await Promise.all([
      safe(() => eventsService.listEvents({ page: 1, limit: 1 }), { total: 0 }),
      safe(() => eventsService.listEvents({ page: 1, limit: 1, status: 'upcoming' }), {
        total: 0,
      }),
      safe(() => coreTeamRepository.listMembers(), []),
      safe(() => forumRepository.adminListThreads({ page: 1, limit: 1, status: 'pending' }), {
        total: 0,
      }),
    ]);

    const pendingModerationCount = pendingThreads?.total ?? 0;

    const alerts = [];
    if (pendingModerationCount > 10) {
      alerts.push({
        severity: 'warning',
        message: `${pendingModerationCount} forum threads are awaiting moderation`,
      });
    }
    if ((upcomingEvents?.total ?? 0) === 0) {
      alerts.push({
        severity: 'info',
        message: 'No upcoming events are currently scheduled',
      });
    }

    const overallStatus = alerts.some((a) => a.severity === 'warning') ? 'attention' : 'healthy';

    return res.status(200).json({
      success: true,
      data: {
        events: {
          total: events?.total ?? 0,
          upcoming: upcomingEvents?.total ?? 0,
        },
        coreTeam: {
          total: Array.isArray(team) ? team.length : 0,
        },
        moderation: {
          pending: pendingModerationCount,
        },
        overallStatus,
        alerts,
        generatedAt: new Date().toISOString(),
      },
    });
  },
};
