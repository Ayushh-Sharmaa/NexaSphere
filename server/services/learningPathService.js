import { learningPathsRepository } from '../repositories/learningPathsRepository.js';
import { supabaseRequest } from '../storage/supabaseClient.js';
import notificationsService from './notificationsService.js';
import gamificationService from './gamificationService.js';

/**
 * Service for Learning Path logic, progress tracking, and nudges.
 */
export const learningPathService = {
  async getPathDetails(userId, pathId) {
    const path = await learningPathsRepository.getById(pathId);
    if (!path) throw new Error('Path not found');

    const enrollment = await learningPathsRepository.getUserEnrollment(userId, pathId);
    let completedIds = [];

    if (enrollment) {
      const completions = await supabaseRequest(
        `user_milestone_completions?user_path_id=eq.${enrollment.id}`
      );
      completedIds = completions.map((c) => c.milestone_id);
    }

    return {
      ...path,
      enrollment,
      milestones: path.milestones.map((m) => ({
        ...m,
        isCompleted: completedIds.includes(m.id),
      })),
    };
  },

  async calculateProgress(userPathId) {
    const [enrollment] = await supabaseRequest(`user_learning_paths?id=eq.${userPathId}`);
    const path = await learningPathsRepository.getById(enrollment.path_id);
    const completions = await supabaseRequest(
      `user_milestone_completions?user_path_id=eq.${userPathId}`
    );

    const total = path.milestones.length;
    if (total === 0) return { progress_percent: 0, status: 'enrolled' };

    const completed = completions.length;
    const percent = Math.round((completed / total) * 100);

    const updates = { progress_percent: percent };

    if (percent === 50) {
      const [studentUser] = await supabaseRequest(`student_users?id=eq.${enrollment.user_id}`);
      const completedCount = studentUser ? (studentUser.paths_completed_count || 0) : 0;
      await gamificationService.evaluateLearningProgress(enrollment.user_id, percent, completedCount);
    }

    if (percent === 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();

      // Issue completion notification
      await notificationsService.addNotification(enrollment.user_id, {
        title: '🎓 Path Completed!',
        message: `Congratulations! You've finished the ${path.title} learning path.`,
        type: 'achievement',
      });

      // Fetch current user stats to avoid overwriting and ensure uniqueness for path names
      const [studentUser] = await supabaseRequest(`student_users?id=eq.${enrollment.user_id}`);
      let newCount = studentUser ? (studentUser.paths_completed_count || 0) : 0;
      
      if (studentUser) {
        const currentCompletedPaths = new Set(studentUser.completed_path_names || []);
        if (!currentCompletedPaths.has(path.title)) {
          currentCompletedPaths.add(path.title);
          newCount += 1;
          await supabaseRequest(`student_users?id=eq.${enrollment.user_id}`, {
            method: 'PATCH',
            body: {
              paths_completed_count: newCount,
              completed_path_names: Array.from(currentCompletedPaths),
            },
          });
        }
      }
    }

    const [updated] = await learningPathsRepository.updateProgress(userPathId, updates);
    return updated;
  },

  async getLeaderboard(pathId) {
    // Fetches top users for a specific path based on progress and completion time
    // Completed paths are ranked by completion date, others by progress percentage
    return await supabaseRequest(
      `user_learning_paths?path_id=eq.${pathId}&order=progress_percent.desc,completed_at.asc&limit=10`
    );
  },

  /**
   * Logic to nudge users who haven't progressed in a while.
   * This would be called by the schedulerService.
   */
  async runNudgeJob() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveUsers = await supabaseRequest(
      `user_learning_paths?status=eq.enrolled&last_activity_at=lt.${sevenDaysAgo.toISOString()}`
    );

    for (const enrollment of inactiveUsers) {
      const [path] = await supabaseRequest(`learning_paths?id=eq.${enrollment.path_id}`);
      await notificationsService.addNotification(enrollment.user_id, {
        title: '🚀 Keep Learning!',
        message: `You're ${enrollment.progress_percent}% through ${path.title}. Don't stop now!`,
        type: 'nudge',
        link: `/learning-paths/${enrollment.path_id}`,
      });
    }

    return inactiveUsers.length;
  },
};
