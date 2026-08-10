import { supabaseRequest } from '../storage/supabaseClient.js';

/**
 * Repository for Learning Path management.
 * Handles metadata and milestone definitions.
 */
export const learningPathsRepository = {
  async listAll() {
    return await supabaseRequest('learning_paths?is_active=eq.true&order=category.asc');
  },

  async getById(id) {
    const [path] = await supabaseRequest(`learning_paths?id=eq.${id}`);
    if (!path) return null;

    const milestones = await supabaseRequest(
      `learning_path_milestones?path_id=eq.${id}&order=order_index.asc`
    );

    return { ...path, milestones };
  },

  async getUserEnrollment(userId, pathId) {
    const [enrollment] = await supabaseRequest(
      `user_learning_paths?user_id=eq.${userId}&path_id=eq.${pathId}`
    );
    return enrollment;
  },

  async enrollUser(userId, pathId, targetDate, initialLevel = 1) {
    return await supabaseRequest('user_learning_paths', {
      method: 'POST',
      body: [
        {
          user_id: userId,
          path_id: pathId,
          target_completion_date: targetDate,
          status: 'enrolled',
          progress_percent: 0,
          current_level: initialLevel,
        },
      ],
    });
  },

  async updateProgress(enrollmentId, updates) {
    return await supabaseRequest(`user_learning_paths?id=eq.${enrollmentId}`, {
      method: 'PATCH',
      body: { ...updates, last_activity_at: new Date().toISOString() },
    });
  },

  async completeMilestone(userPathId, milestoneId) {
    return await supabaseRequest('user_milestone_completions', {
      method: 'POST',
      body: [{ user_path_id: userPathId, milestone_id: milestoneId }],

function mapLearningPath(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    estimatedWeeks: row.estimated_weeks,
    createdAt: row.created_at,
  };
}

function mapUserPath(row) {
  return {
    id: row.id,
    userId: row.user_id,
    learningPathId: row.learning_path_id,
    currentLevel: row.current_level,
    progressPercentage: row.progress_percentage,
    startedAt: row.started_at,
    estimatedCompletionDate: row.estimated_completion_date,
  };
}

