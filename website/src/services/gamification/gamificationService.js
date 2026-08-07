// src/services/gamification/gamificationService.js
import { getApiBase } from '../../utils/runtimeConfig';

// XP Values for different actions
export const XP_VALUES = {
  ATTEND_EVENT: 50,
  ORGANIZE_EVENT: 200,
  COMPLETE_MENTORSHIP: 500,
  ADD_PORTFOLIO_PROJECT: 100,
  HELP_SOMEONE: 30,
  DAILY_STREAK: 20,
  LEARNING_PATH_COMPLETE: 1000,
  SKILL_VERIFIED: 200,
  FIRST_BLOG_POST: 50,
  LEARN_NEW_TECH: 40,
  SKILL_ASSESSMENT: 100,
  VOLUNTEER: 150,
  HACKATHON_WIN: 1000,
  SPEAKER: 500,
  BETA_TESTER: 100,
  SHARE_EVENT: 15,
  EVENT_ATTENDANCE: 50,
  EVENT_REGISTRATION: 20,
  COMMENT_POSTED: 5,
  REFERRAL: 100,
  CONTENT_CREATION: 75,
  FEEDBACK_GIVEN: 15,
  GIVE_FEEDBACK: 25,
};

// Achievement tiers and requirements
export const ACHIEVEMENTS = {
  // Event based achievements
  FIRST_EVENT: {
    id: 'first_event',
    title: 'First Step',
    description: 'Attend your first event',
    icon: '🎯',
    tier: 'bronze',
    xpReward: 50,
    requirement: { type: 'events_attended', count: 1 },
  },
  EVENT_STALWART: {
    id: 'event_stalwart',
    title: 'Stalwart',
    description: 'Attend 5 events',
    icon: '🎖️',
    tier: 'silver',
    xpReward: 250,
    requirement: { type: 'events_attended', count: 5 },
  },
  EVENT_MASTER: {
    id: 'event_master',
    title: 'Event Master',
    description: 'Attend 10 events',
    icon: '🏆',
    tier: 'gold',
    xpReward: 500,
    requirement: { type: 'events_attended', count: 10 },
  },
  EVENT_VETERAN: {
    id: 'event_veteran',
    title: 'Event Veteran',
    description: 'Attend 25 events',
    icon: '🎖️',
    tier: 'platinum',
    xpReward: 1000,
    requirement: { type: 'events_attended', count: 25 },
  },
  EVENT_LEGEND: {
    id: 'event_legend',
    title: 'Event Legend',
    description: 'Attend 50 events',
    icon: '👑',
    tier: 'platinum',
    xpReward: 2500,
    requirement: { type: 'events_attended', count: 50 },
  },
  EVENT_CENTURION: {
    id: 'event_centurion',
    title: 'Centurion',
    description: 'Attend 100 events',
    icon: '🏛️',
    tier: 'platinum',
    xpReward: 5000,
    requirement: { type: 'events_attended', count: 100 },
  },

  // Streak achievements
  STREAK_3: {
    id: 'streak_3',
    title: 'On Fire',
    description: '3 day login streak',
    icon: '🔥',
    tier: 'bronze',
    xpReward: 30,
    requirement: { type: 'streak', count: 3 },
  },
  STREAK_7: {
    id: 'streak_7',
    title: 'Unstoppable',
    description: '7 day login streak',
    icon: '⚡',
    tier: 'silver',
    xpReward: 100,
    requirement: { type: 'streak', count: 7 },
  },
  STREAK_30: {
    id: 'streak_30',
    title: 'Committed',
    description: '30 day login streak',
    icon: '🗓️',
    tier: 'gold',
    xpReward: 500,
    requirement: { type: 'streak', count: 30 },
  },

  // Social
  FIRST_COMMENT: {
    id: 'first_comment',
    title: 'Voice Your Thoughts',
    description: 'Post your first comment',
    icon: '💬',
    tier: 'bronze',
    xpReward: 25,
    requirement: { type: 'comments', count: 1 },
  },
  FIRST_CONNECTION: {
    id: 'first_connection',
    title: 'Networker',
    description: 'Make your first connection',
    icon: '🤝',
    tier: 'bronze',
    xpReward: 25,
    requirement: { type: 'connections', count: 1 },
  },
  MENTOR: {
    id: 'mentor',
    title: 'Guide',
    description: 'Become a mentor',
    icon: '🎓',
    tier: 'silver',
    xpReward: 500,
    requirement: { type: 'mentorships_given', count: 1 },
  },

  // Content
  FIRST_PROJECT: {
    id: 'first_project',
    title: 'Innovator',
    description: 'Add your first portfolio project',
    icon: '🚀',
    tier: 'bronze',
    xpReward: 100,
    requirement: { type: 'content_created', count: 1 },
  },
  PORTFOLIO_MASTER: {
    id: 'portfolio_master',
    title: 'Portfolio Master',
    description: 'Showcase 5 portfolio projects',
    icon: '📁',
    tier: 'silver',
    xpReward: 500,
    requirement: { type: 'content_created', count: 5 },
  },

  // Skills
  TECH_LEARNER: {
    id: 'tech_learner',
    title: 'Always Learning',
    description: 'Learn a new technology',
    icon: '🧠',
    tier: 'bronze',
    xpReward: 50,
    requirement: { type: 'tech_learned', count: 1 },
  },

  // Community
  ORGANIZER: {
    id: 'organizer',
    title: 'Initiator',
    description: 'Organize your first event',
    icon: '📣',
    tier: 'gold',
    xpReward: 1000,
    requirement: { type: 'events_organized', count: 1 },
  },
  FEEDBACK_GIVER: {
    id: 'feedback_giver',
    title: 'Helpful Voice',
    description: 'Give your first event feedback',
    icon: '💬',
    tier: 'bronze',
    xpReward: 25,
    requirement: { type: 'feedback', count: 1 },
  },

  // Special
  HACKATHON_CHAMP: {
    id: 'hackathon_champ',
    title: 'Hackathon Winner',
    description: 'Win a NexaSphere Hackathon',
    icon: '🥇',
    tier: 'platinum',
    xpReward: 2000,
    requirement: { type: 'hackathon_wins', count: 1 },
  },
  FOUNDING_MEMBER: {
    id: 'founding_member',
    title: 'Founding Member',
    description: 'Part of the early community',
    icon: '💎',
    tier: 'silver',
    xpReward: 1000,
    requirement: { type: 'special', tag: 'founder' },
  },
  PATH_CONQUEROR: {
    id: 'path_conqueror',
    title: 'Path Conqueror',
    description: 'Complete your first learning path',
    icon: '🛤️',
    tier: 'gold',
    xpReward: 1000,
    requirement: { type: 'paths_completed', count: 1 },
  },
  FULL_STACK_MASTER: {
    id: 'full_stack_master',
    title: 'Full Stack Mastery',
    description: 'Complete the Full Stack Development path',
    icon: '💻',
    tier: 'platinum',
    xpReward: 2000,
    requirement: { type: 'specific_path_complete', path: 'Full Stack Development' },
  },
  DATA_SCIENCE_PRO: {
    id: 'data_science_pro',
    title: 'Data Science Pro',
    description: 'Complete the Data Science path',
    icon: '📊',
    tier: 'platinum',
    xpReward: 2000,
    requirement: { type: 'specific_path_complete', path: 'Data Science' },
  },
  DESIGN_VISIONARY: {
    id: 'design_visionary',
    title: 'Design Visionary',
    description: 'Complete the UI/UX Design path',
    icon: '🎨',
    tier: 'platinum',
    xpReward: 2000,
    requirement: { type: 'specific_path_complete', path: 'UI/UX Design' },
  },
  CLOUD_ARCHITECT: {
    id: 'cloud_architect',
    title: 'Cloud Architect',
    description: 'Complete the DevOps path',
    icon: '☁️',
    tier: 'platinum',
    xpReward: 2000,
    requirement: { type: 'specific_path_complete', path: 'DevOps' },
  },
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Newcomer' },
  { level: 2, xpRequired: 500, title: 'Explorer' },
  { level: 3, xpRequired: 1500, title: 'Expert' },
  { level: 4, xpRequired: 3000, title: 'Master' },
  { level: 5, xpRequired: 5000, title: 'Legend' },
];

const ANTI_GAMING_COOLDOWN =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 1000 * 60; // 1 minute per action type

class GamificationService {
  constructor() {
    this.userData = this.loadUserData();
    this.updateStreak();
  }

  loadUserData() {
    const defaults = {
      userId: null,
      xp: 0,
      level: 1,
      title: 'Newcomer',
      achievements: [],
      stats: {
        events_attended: 0,
        events_registered: 0,
        comments: 0,
        referrals: 0,
        content_created: 0,
        feedback: 0,
        shares: 0,
        current_streak: 0,
        connections: 0,
        mentorships_given: 0,
        tech_learned: 0,
        paths_completed: 0,
        events_organized: 0,
        hackathon_wins: 0,
        blogs: 0,
        special_tags: [],
        longest_streak: 0,
        last_active: null,
        verified_skills: [], // Array of verified skill names
      },
      badges: [],
      streak_freeze_count: 1,
      last_actions: {}, // For anti-gaming
      notifications: [],
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('gamification_user_data');
        if (stored) {
          const parsed = JSON.parse(stored) || {};
          return {
            ...defaults,
            ...parsed,
            stats: { ...defaults.stats, ...(parsed.stats || {}) },
            last_actions: { ...defaults.last_actions, ...(parsed.last_actions || {}) },
          };
        }
      }
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
    return defaults;
  }

  saveUserData() {
    // Cap notifications to last 50 to prevent unbounded localStorage growth
    if (this.userData.notifications.length > 50) {
      this.userData.notifications = this.userData.notifications.slice(-50);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gamification_user_data', JSON.stringify(this.userData));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        console.warn(
          '[GamificationService] localStorage quota exceeded — trimming notifications ' +
            'and retrying. Consider migrating to IndexedDB for long-term storage.'
        );
        // Aggressively trim notifications and retry once
        this.userData.notifications = [];
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('gamification_user_data', JSON.stringify(this.userData));
          }
        } catch (_) {
          // If it still fails, data loss is preferable to a thrown error
          console.warn('[GamificationService] Retry after trim also failed — skipping save.');
        }
      } else {
        console.warn('LocalStorage write failed:', err);
      }
    }
  }

  // Update user ID
  setUserId(userId) {
    this.userData.userId = userId;
    this.saveUserData();
  }

  // Track user action and award XP
  trackAction(action, metadata = {}) {
    // Anti-gaming: Prevent rapid spamming of same action
    const now = Date.now();
    this.userData.last_actions = this.userData.last_actions || {};
    const lastActionTime = this.userData.last_actions[action] || 0;
    if (now - lastActionTime < ANTI_GAMING_COOLDOWN) {
      console.warn(`[Gamification] Action "${action}" ignored due to anti-gaming cooldown.`);
      return { xpEarned: 0, cooldown: true };
    }

    let xpEarned = XP_VALUES[action] || 0;

    // Streak multiplier: 2x for 7+ day streaks
    if (this.userData.stats.current_streak >= 7) {
      xpEarned *= 2;
    }

    // Update streak first, so streak-based achievements are accurate for today!
    this.updateStreak();

    // Update stats based on action
    this.updateStats(action, metadata, now);

    // Add XP
    this.addXP(xpEarned);

    // Check and unlock achievements
    const newAchievements = this.checkAchievements();

    // Save data
    this.saveUserData();

    return {
      xpEarned,
      newAchievements,
      totalXP: this.userData.xp,
      level: this.userData.level,
    };
  }

  updateStats(action, metadata, timestamp) {
    const stats = this.userData.stats;
    this.userData.last_actions = this.userData.last_actions || {};
    this.userData.last_actions[action] = timestamp;

    switch (action) {
      case 'ATTEND_EVENT':
      case 'EVENT_ATTENDANCE':
        stats.events_attended++;
        break;
      case 'EVENT_REGISTRATION':
        stats.events_registered++;
        break;
      case 'SHARE_EVENT':
        stats.shares++;
        break;
      case 'ORGANIZE_EVENT':
        stats.events_organized = (stats.events_organized || 0) + 1;
        break;
      case 'COMMENT_POSTED':
        stats.comments++;
        break;
      case 'ADD_PORTFOLIO_PROJECT':
      case 'CONTENT_CREATION':
        stats.content_created++;
        break;
      case 'GIVE_FEEDBACK':
      case 'FEEDBACK_GIVEN':
        stats.content_created++;
        stats.feedback = (stats.feedback || 0) + 1;
        break;
      case 'MAKE_CONNECTION':
        stats.connections++;
        break;
      case 'COMPLETE_MENTORSHIP':
        stats.mentorships_given++;
        break;
      case 'SKILL_ASSESSMENT':
        stats.tech_learned++;
        break;
      case 'HACKATHON_WIN':
        stats.hackathon_wins++;
        break;
      case 'REFERRAL':
        stats.referrals++;
        break;
    }
  }

  // Level-gate check
  isFeatureAllowed(feature) {
    const level = this.userData.level;
    if (feature === 'ORGANIZE_EVENT') return level >= 3;
    return true;
  }

  addXP(amount) {
    this.userData.xp += amount;
    this.updateLevel();
  }

  updateLevel() {
    let newLevel = 1;
    let newTitle = 'Newcomer';

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.userData.xp >= LEVEL_THRESHOLDS[i].xpRequired) {
        newLevel = LEVEL_THRESHOLDS[i].level;
        newTitle = LEVEL_THRESHOLDS[i].title;
        break;
      }
    }

    if (newLevel > this.userData.level) {
      this.userData.notifications.push({
        type: 'level_up',
        message: `Congratulations! You reached Level ${newLevel} - ${newTitle}!`,
        timestamp: new Date().toISOString(),
      });
    }

    this.userData.level = newLevel;
    this.userData.title = newTitle;
  }

  /**
   * Handles daily streaks and "Streak Freeze" logic.
   * If last active was yesterday, increment.
   * If missed one day, use streak freeze if available.
   * Otherwise, reset.
   */
  updateStreak() {
    const today = new Date().toDateString();
    const lastActive = this.userData.stats.last_active;

    if (lastActive === today) {
      return; // Already updated today
    }

    const yesterday = this.getRelativeDate(-1);
    const dayBeforeYesterday = this.getRelativeDate(-2);

    if (lastActive === yesterday) {
      this.incrementStreak();
    } else if (lastActive === dayBeforeYesterday && this.userData.streak_freeze_count > 0) {
      // Streak Freeze triggered!
      this.userData.streak_freeze_count--;
      this.incrementStreak('🧊 Streak Freeze Used! Streak saved.');
    } else {
      this.userData.stats.current_streak = 1;
    }

    this.userData.stats.last_active = today;
  }

  getRelativeDate(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toDateString();
  }

  incrementStreak(specialMessage = null) {
    this.userData.stats.current_streak++;
    if (this.userData.stats.current_streak > this.userData.stats.longest_streak) {
      this.userData.stats.longest_streak = this.userData.stats.current_streak;
    }
    this.addXP(XP_VALUES.DAILY_STREAK);
    this.userData.notifications.push({
      type: 'streak',
      message:
        specialMessage ||
        `🔥 ${this.userData.stats.current_streak} day streak! +${XP_VALUES.DAILY_STREAK} XP`,
      timestamp: new Date().toISOString(),
    });
  }

  checkAchievements() {
    const unlockedAchievements = [];
    const stats = this.userData.stats;
    const existingIds = new Set(this.userData.achievements.map((a) => a.id));

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (existingIds.has(achievement.id)) continue;

      let progress = 0;
      switch (achievement.requirement.type) {
        case 'events_attended':
          progress = stats.events_attended;
          break;
        case 'streak':
          progress = stats.current_streak;
          break;
        case 'comments':
          progress = stats.comments;
          break;
        case 'referrals':
          progress = stats.referrals;
          break;
        case 'content_created':
          progress = stats.content_created;
          break;
        case 'feedback':
          progress = stats.feedback;
          break;
        case 'paths_completed':
          progress = stats.paths_completed;
          break;
        case 'specific_path_complete':
          progress = stats.completed_path_names?.includes(achievement.requirement.path) ? 1 : 0;
          achievement.requirement.count = 1; // Ensure count is 1 for this type
          break;
      }

      if (progress >= achievement.requirement.count) {
        this.userData.achievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
        });
        this.userData.badges.push({
          id: achievement.id,
          title: achievement.title,
          icon: achievement.icon,
          tier: achievement.tier,
          unlockedAt: new Date().toISOString(),
        });
        this.addXP(achievement.xpReward);
        unlockedAchievements.push(achievement);

        this.userData.notifications.push({
          type: 'achievement',
          message: `🏆 Achievement Unlocked: ${achievement.title}! +${achievement.xpReward} XP`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return unlockedAchievements;
  }

  getCurrentLevelXP() {
    const currentLevel = this.userData.level;
    const levelObj = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel);
    return levelObj ? levelObj.xpRequired : 0;
  }

  // Handle skill verification
  verifySkill(skill) {
    if (this.userData.stats.verified_skills?.includes(skill)) {
      return { success: false, message: 'Skill already verified' };
    }

    // Add skill to verified list
    if (!this.userData.stats.verified_skills) {
      this.userData.stats.verified_skills = [];
    }
    this.userData.stats.verified_skills.push(skill);

    // Track action
    this.addXP(XP_VALUES.SKILL_VERIFIED);
    this.updateStreak();

    // Create a special verified badge
    const badge = {
      id: `verified_${skill.toLowerCase().replace(/\s+/g, '_')}`,
      title: `Verified: ${skill}`,
      description: `Passed the ${skill} Skill Verification Quest`,
      icon: '✅',
      tier: 'gold',
      unlockedAt: new Date().toISOString(),
    };
    this.userData.badges.push(badge);

    this.userData.notifications.push({
      type: 'achievement',
      message: `🎉 Skill Verified: ${skill}! +${XP_VALUES.SKILL_VERIFIED} XP`,
      timestamp: new Date().toISOString(),
    });

    this.saveUserData();
    return { success: true, xpEarned: XP_VALUES.SKILL_VERIFIED, badge };
  }

  getUserStats() {
    return {
      xp: this.userData.xp,
      level: this.userData.level,
      title: this.userData.title,
      currentLevelXP: this.getCurrentLevelXP(),
      nextLevelXP: this.getNextLevelXP(),
      achievements: this.userData.achievements,
      badges: this.userData.badges,
      stats: this.userData.stats,
      notifications: this.userData.notifications,
    };
  }

  getNextLevelXP() {
    const currentLevel = this.userData.level;
    const nextLevelData = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
    return nextLevelData ? nextLevelData.xpRequired : this.userData.xp;
  }

  getXPProgress() {
    const currentLevel = this.userData.level;
    const currentThreshold =
      LEVEL_THRESHOLDS.find((l) => l.level === currentLevel)?.xpRequired || 0;
    const nextThreshold = this.getNextLevelXP();

    if (nextThreshold === this.userData.xp) return 100; // Max level
    const progress =
      ((this.userData.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  async getLeaderboard(filter = 'all') {
    const MOCK_LEADERBOARD = [
      { rank: 1, name: 'Alex Johnson', xp: 2850, level: 8, avatar: '👨‍💻', streak: 12 },
      { rank: 2, name: 'Sarah Chen', xp: 2420, level: 7, avatar: '👩‍💻', streak: 7 },
      { rank: 3, name: 'Mike Ross', xp: 2100, level: 7, avatar: '👨‍💼', streak: 4 },
      { rank: 4, name: 'Emma Watson', xp: 1850, level: 6, avatar: '👩‍🎓', streak: 2 },
      { rank: 5, name: 'David Kim', xp: 1520, level: 6, avatar: '👨‍🔬', streak: 0 },
    ];

    const base = getApiBase();
    if (!base) return MOCK_LEADERBOARD;

    try {
      const res = await fetch(
        `${base}/api/dashboard/leaderboard?filter=${encodeURIComponent(filter)}`
      );
      if (!res.ok) return MOCK_LEADERBOARD;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return MOCK_LEADERBOARD;
      // Map backend UserProfileEntity shape to leaderboard display shape
      return data.map((user, i) => ({
        id: user.id || user.user_id || user.email || `leaderboard-${i + 1}`,
        rank: i + 1,
        name: user.username || user.name || 'Anonymous',
        username: user.username || user.name || 'Anonymous',
        xp: user.xp ?? 0,
        level: user.level ?? 1,
        avatar: user.avatar || '👤',
        streak: user.current_streak ?? user.streak ?? 0,
        badges: user.badges || [],
      }));
    } catch {
      return MOCK_LEADERBOARD;
    }
  }

  async getXPHistory(userId) {
    const MOCK_HISTORY = [
      {
        id: 1,
        amount: 50,
        action: 'ATTEND_EVENT',
        description: 'Attended Web Development Workshop',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        amount: 100,
        action: 'ADD_PORTFOLIO_PROJECT',
        description: 'Added first project',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    const base = getApiBase();
    if (!base) return MOCK_HISTORY;

    try {
      const res = await fetch(`${base}/api/dashboard/xp-history?userId=${userId}`);
      if (!res.ok) return MOCK_HISTORY;
      return await res.json();
    } catch {
      return MOCK_HISTORY;
    }
  }

  getTierColor(tier) {
    switch (tier) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return '#CC1111';
    }
  }

  clearNotifications() {
    this.userData.notifications = [];
    this.saveUserData();
  }
}

export const gamificationService = new GamificationService();
