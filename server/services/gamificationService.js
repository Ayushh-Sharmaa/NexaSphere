import { achievementsRepository } from '../repositories/achievementsRepository.js';
import logger from '../utils/logger.js';

const ACHIEVEMENT_DEFS = {
  'profile-complete': {
    name: 'Profile Complete',
    description: 'Filled in all profile sections',
    tier: 'bronze',
    source: 'system',
  },
  'skills-master': {
    name: 'Skills Master',
    description: 'Added 5 skills to your portfolio',
    tier: 'silver',
    source: 'system',
  },
  'project-starter': {
    name: 'Project Starter',
    description: 'Added your first portfolio project',
    tier: 'bronze',
    source: 'system',
  },
  'project-five': {
    name: 'Portfolio Veteran',
    description: 'Showcased 5+ projects',
    tier: 'gold',
    source: 'system',
  },
  'social-butterfly': {
    name: 'Social Butterfly',
    description: 'Linked 3+ social accounts',
    tier: 'silver',
    source: 'system',
  },
  'first-feedback': {
    name: 'First Feedback',
    description: 'Provided constructive feedback',
    tier: 'bronze',
    source: 'system',
  },
  'roadmap-explorer': {
    name: 'Roadmap Explorer',
    description: 'Added a learning roadmap',
    tier: 'bronze',
    source: 'system',
  },
  'event-organizer-starter': {
    name: 'Initiator',
    description: 'Organized your first club event',
    tier: 'silver',
    source: 'system',
  },
};

class GamificationService {
  async evaluatePortfolio(username, portfolioData) {
    const badges = [];
    const skillsCount = (portfolioData.skills || []).length;
    const projectsCount = (portfolioData.projects || []).length;
    const hasBio = !!portfolioData.bio;
    const hasTitle = !!portfolioData.title;
    const hasGivenFeedback = portfolioData.hasGivenFeedback;
    const hasOrganizedEvent = portfolioData.hasOrganizedEvent;

    if (skillsCount >= 5) badges.push(ACHIEVEMENT_DEFS['skills-master']);
    if (projectsCount >= 1) badges.push(ACHIEVEMENT_DEFS['project-starter']);
    if (projectsCount >= 5) badges.push(ACHIEVEMENT_DEFS['project-five']);
    if (hasGivenFeedback) badges.push(ACHIEVEMENT_DEFS['first-feedback']);
    if (hasOrganizedEvent) badges.push(ACHIEVEMENT_DEFS['event-organizer-starter']);

    if (hasBio && hasTitle && skillsCount > 0 && projectsCount > 0) {
      badges.push(ACHIEVEMENT_DEFS['profile-complete']);
    }

    for (const badge of badges) {
      if (!badge) continue; // Safety check in case a badge def is missing
      try {
        await achievementsRepository.award(username, badge);
      } catch (e) {
        logger.error(`[GamificationService] Failed to award "${badge.name}" to ${username}:`, {
          error: e.message,
        });
      }
    }
  }
}

const gamificationService = new GamificationService();
export default gamificationService;
