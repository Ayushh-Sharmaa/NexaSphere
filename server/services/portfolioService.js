import { portfolioRepository } from "../repositories/portfolioRepository.js";
import { achievementsRepository } from "../repositories/achievementsRepository.js";

const ACHIEVEMENT_DEFS = {
  "profile-complete": {
    name: "Profile Complete",
    description: "Filled in all profile sections",
    tier: "bronze",
    source: "system",
  },
  "skills-master": {
    name: "Skills Master",
    description: "Added 5+ skills to your portfolio",
    tier: "silver",
    source: "system",
  },
  "project-starter": {
    name: "Project Starter",
    description: "Added your first project",
    tier: "bronze",
    source: "system",
  },
  "social-butterfly": {
    name: "Social Butterfly",
    description: "Linked 3+ social accounts",
    tier: "silver",
    source: "system",
  },
  "roadmap-explorer": {
    name: "Roadmap Explorer",
    description: "Added a learning roadmap",
    tier: "bronze",
    source: "system",
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
    const saved = await portfolioRepository.createOrUpdate(
      data,
      isNewRegistration
    );

    const username = saved.username;
    const badges = [];
    const skillsCount = (data.skills || saved.skills || []).length;
    const projectsCount = (data.projects || saved.projects || []).length;
    const socialCount = Object.keys(
      data.socialLinks || saved.socialLinks || {}
    ).filter((k) => data.socialLinks?.[k] || saved.socialLinks?.[k]).length;
    const roadmapsCount = (data.roadmaps || saved.roadmaps || []).length;
    const hasBio = !!(data.bio || saved.bio);
    const hasTitle = !!(data.title || saved.title);

    if (skillsCount >= 5) badges.push(ACHIEVEMENT_DEFS["skills-master"]);
    if (projectsCount >= 1) badges.push(ACHIEVEMENT_DEFS["project-starter"]);
    if (socialCount >= 3) badges.push(ACHIEVEMENT_DEFS["social-butterfly"]);
    if (roadmapsCount >= 1) badges.push(ACHIEVEMENT_DEFS["roadmap-explorer"]);
    if (hasBio && hasTitle && skillsCount > 0 && projectsCount > 0) {
      badges.push(ACHIEVEMENT_DEFS["profile-complete"]);
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
