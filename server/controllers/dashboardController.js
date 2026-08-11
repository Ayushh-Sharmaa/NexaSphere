import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { registrationsRepository } from '../repositories/registrationsRepository.js';
import { forumRepository } from '../repositories/forumRepository.js';
import { mentorshipRepository } from '../repositories/mentorshipRepository.js';

export const dashboardController = {
  async getStats(req, res) {
    try {
      const email = req.studentUser.email;

      const registrations = await registrationsRepository.countByEmail(email);

      const threads = await forumRepository.countThreadsByEmail(email);

      const replies = await forumRepository.countRepliesByEmail(email);

      const mentorships = await mentorshipRepository.countMentorshipsByEmail(email);

      return sendSuccess(res, {
      });
    } catch (err) {
      console.error(err);
      return sendError(req, res, 'Failed to load dashboard stats', 500, 'INTERNAL_ERROR');
      return res.status(500).json({
        error: 'Failed to load dashboard stats',
      });
    }
  },

  async getQuests(req, res) {
    try {
      const email = req.studentUser.email;

      const registrations = await registrationsRepository.countByEmail(email);

      const threads = await forumRepository.countThreadsByEmail(email);

      const mentorships = await mentorshipRepository.countMentorshipsByEmail(email);

      const quests = [
        {
          id: 'events_3',
          title: 'Attend 3 Events',
          description: 'Participate in campus events',
          progress: Math.min(registrations, 3),
          max: 3,
          completed: registrations >= 3,
        },
        {
          id: 'forum_5',
          title: 'Create 5 Forum Posts',
          description: 'Engage with community',
          progress: Math.min(threads, 5),
          max: 5,
          completed: threads >= 5,
        },
        {
          id: 'mentor_1',
          title: 'Join Mentorship',
          description: 'Request mentorship',
          progress: Math.min(mentorships, 1),
          max: 1,
          completed: mentorships >= 1,
        },
      ];

      return sendSuccess(res, quests);
    } catch (err) {
      console.error(err);

      return sendError(req, res, 'Failed to load quests', 500, 'INTERNAL_ERROR');
      return res.json(quests);
      console.error(err);

      return res.status(500).json({
        error: 'Failed to load quests',
      });
    }
  },

  async getLeaderboard(req, res) {
    try {
      const users = await forumRepository.getLeaderboardUsers();

      const leaderboard = users
        .map((user) => ({
          userId: user.author_email,
          name: user.author_name,
          score: user.thread_count * 15,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((user, index) => ({
          rank: index + 1,
          ...user,
        }));

      return sendSuccess(res, leaderboard);
    } catch (err) {
      console.error(err);

      return sendError(req, res, 'Failed to load leaderboard', 500, 'INTERNAL_ERROR');
      return res.json(leaderboard);
      console.error(err);

      return res.status(500).json({
        error: 'Failed to load leaderboard',
      });
    }
  },
};
