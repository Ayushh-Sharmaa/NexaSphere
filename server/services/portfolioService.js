import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { achievementsRepository } from '../repositories/achievementsRepository.js';

import eventManager from './eventEmitterService.js';
// These definitions should ideally be moved to a shared gamification service or a central achievement registry.
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
    description: 'Added 5+ skills to your portfolio',
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
    description: 'Added your first project',
    tier: 'bronze',
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

export const portfolioService = {
  async getByUsername(username) {
    const portfolio = await portfolioRepository.getByUsername(username);
    if (!portfolio) return null;
    const achievements = await achievementsRepository.getByUsername(username);
    return { ...portfolio, achievements };
  },

  async createOrUpdate(data, isNewRegistration) {
    const saved = await portfolioRepository.createOrUpdate(data, isNewRegistration);

    const username = saved.username;
    eventManager.emitEvent('portfolio-updated', {
      username,
      portfolioData: { ...saved, ...data },
    });
    const badges = [];
    const skillsCount = (data.skills || saved.skills || []).length;
    const projectsCount = (data.projects || saved.projects || []).length;
    const socialCount = Object.keys(data.socialLinks || saved.socialLinks || {}).filter(
      (k) => data.socialLinks?.[k] || saved.socialLinks?.[k]
    ).length;
    const roadmapsCount = (data.roadmaps || saved.roadmaps || []).length;
    const hasBio = !!(data.bio || saved.bio);
    const hasTitle = !!(data.title || saved.title);
    const hasGivenFeedback = data.hasGivenFeedback || saved.hasGivenFeedback; // Assuming this comes from user data
    const hasOrganizedEvent = data.hasOrganizedEvent || saved.hasOrganizedEvent; // Assuming this comes from user data

    if (skillsCount >= 5) badges.push(ACHIEVEMENT_DEFS['tech_learner']);
    if (projectsCount >= 1) badges.push(ACHIEVEMENT_DEFS['first_project']);
    if (projectsCount >= 5) badges.push(ACHIEVEMENT_DEFS['portfolio_master']);
    if (hasGivenFeedback) badges.push(ACHIEVEMENT_DEFS['feedback_giver']);
    if (hasOrganizedEvent) badges.push(ACHIEVEMENT_DEFS['organizer']);

    if (hasBio && hasTitle && skillsCount > 0 && projectsCount > 0) {
      badges.push(ACHIEVEMENT_DEFS['profile-complete']);
    }
    // TODO: Instead of directly awarding badges here, trigger a gamification service action

    if (skillsCount >= 5) badges.push(ACHIEVEMENT_DEFS['skills-master']);
    if (projectsCount >= 1) badges.push(ACHIEVEMENT_DEFS['project-starter']);
    if (socialCount >= 3) badges.push(ACHIEVEMENT_DEFS['social-butterfly']);
    if (roadmapsCount >= 1) badges.push(ACHIEVEMENT_DEFS['roadmap-explorer']);
    if (hasBio && hasTitle && skillsCount > 0 && projectsCount > 0) {
      badges.push(ACHIEVEMENT_DEFS['profile-complete']);
    }

    for (const badge of badges) {
      try {
        await achievementsRepository.award(username, badge);
      } catch (e) {
        console.error(
          `[PortfolioService] Failed to award "${badge.name}" to ${username}:`,
          e.message
        );
      }
    }
      portfolioData: { ...saved, ...data }
    });

    const achievements = await achievementsRepository.getByUsername(username);
    return { ...saved, achievements };
  },

  async awardAchievement(username, achievement) {
    return achievementsRepository.award(username, achievement);
  },

  async removeAchievement(username, achievementName) {
    return achievementsRepository.remove(username, achievementName);
  },
};
