import { withDb } from '../repositories/db.js';
import { sendError } from '../utils/responseHelper.js';

function computePrivacyView({ prefs, requester }) {
  // requester: { isSelf: boolean, isPublicRequest: boolean, isClubMember: boolean }
  // Minimal enforcement for thin slice.
  const canSee = (visibility) => {
    if (visibility === 'public') return true;
    if (visibility === 'club') return requester.isClubMember || requester.isSelf;
    if (visibility === 'private') return requester.isSelf;
    return false;
  };

  return {
    showSkills: canSee(prefs.visibility_skills),
    showContributions: canSee(prefs.visibility_contributions),
    showEndorsements: canSee(prefs.visibility_endorsements),
    anonymousMode: Boolean(prefs.anonymous_mode),
  };
}

export async function getAdvancedProfile(req, res) {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }

  const userId = req.studentUser.sub || req.studentUser.id;
  const requester = {
    isSelf: true,
    isPublicRequest: false,
    isClubMember: true,
  };

  try {
    const payload = await withDb(async (client) => {
      // student_users.id is SERIAL in existing repo; but studentUser.sub might be provider sub.
      // Existing getProfile uses studentUsersRepository which maps by provider/provider_id.
      // For this thin slice, we resolve to DB id via the repository's findByProvider/findByEmail.

      const { studentUsersRepository } = await import('../repositories/studentUsersRepository.js');
      const user =
        (await studentUsersRepository.findByProvider(req.studentUser.provider, userId)) ||
        (await studentUsersRepository.findByEmail(req.studentUser.email));

      if (!user) {
        return { error: 'User not found' };
      }

      const advPrefsRes = await client.query(
        'SELECT * FROM user_profile_privacy_prefs WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
      const prefsRow = advPrefsRes.rows[0] || {
        user_id: user.id,
        visibility_skills: 'public',
        visibility_contributions: 'public',
        visibility_endorsements: 'public',
        anonymous_mode: false,
      };

      const view = computePrivacyView({ prefs: prefsRow, requester });

      // Skills aggregate (thin slice: return computed levels + category grouping)
      const skillsRes = await client.query(
        `SELECT category, skill_key, computed_level, self_level, quiz_score,
                endorsement_score, event_attendance_score
         FROM user_skill_profiles
         WHERE user_id = $1`,
        [user.id]
      );

      const skillsByCategory = {};
      for (const r of skillsRes.rows) {
        if (!skillsByCategory[r.category]) skillsByCategory[r.category] = [];
        skillsByCategory[r.category].push({
          skillKey: r.skill_key,
          computedLevel: Number(r.computed_level),
          selfLevel: Number(r.self_level),
          quizScore: r.quiz_score != null && !isNaN(Number(r.quiz_score)) ? Number(r.quiz_score) : null,
          endorsementScore: Number(r.endorsement_score),
          eventAttendanceScore: Number(r.event_attendance_score),
        });
      }

      // Contributions: return last 30 days weights for heatmap stub
      const contribRes = await client.query(
        `SELECT event_type, occurred_at, SUM(weight)::int as total_weight
         FROM user_contribution_logs
         WHERE user_id = $1
           AND occurred_at >= (CURRENT_DATE - INTERVAL '30 days')
         GROUP BY event_type, occurred_at
         ORDER BY occurred_at ASC`,
        [user.id]
      );

      const contributions = contribRes.rows.map((r) => ({
        eventType: r.event_type,
        date: r.occurred_at,
        weight: Number(r.total_weight),
      }));

      // Endorsements: thin slice summary (no anonymized peer stats yet)
      const endorsementsRes = await client.query(
        `SELECT mentee_user_id, category, skill_key,
                COUNT(*)::int AS endorsements_count,
                SUM(CASE WHEN is_mentor_endorsement THEN weight ELSE weight END)::int AS endorsements_weight
         FROM skill_endorsements
         WHERE mentee_user_id = $1
         GROUP BY mentee_user_id, category, skill_key`,
        [user.id]
      );

      const endorsements = endorsementsRes.rows.map((r) => ({
        category: r.category,
        skillKey: r.skill_key,
        endorsementsCount: Number(r.endorsements_count),
        endorsementsWeight: Number(r.endorsements_weight),
      }));

      const summaryRes = await client.query(
        'SELECT generated_text, user_edited_text, last_generated_at FROM user_professional_summaries WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
      const summaryRow = summaryRes.rows[0] || {
        generated_text: '',
        user_edited_text: null,
        last_generated_at: null,
      };

      return {
        user: {
          id: user.id,
          fullName: user.full_name,
          avatar: user.avatar_url,
          bio: user.bio,
        },
        privacy: {
          showSkills: view.showSkills,
          showContributions: view.showContributions,
          showEndorsements: view.showEndorsements,
          anonymousMode: view.anonymousMode,
        },
        skills: view.showSkills ? skillsByCategory : null,
        contributions: view.showContributions ? contributions : null,
        endorsements: view.showEndorsements ? endorsements : null,
        professionalSummary: {
          generatedText: summaryRow.generated_text,
          editedText: summaryRow.user_edited_text,
          lastGeneratedAt: summaryRow.last_generated_at,
        },
      };
    });

    if (payload.error) return sendError(req, res, payload.error, 404, 'NOT_FOUND');
    return res.json(payload);
  } catch (err) {
    console.error('getAdvancedProfile error:', err);
    return sendError(req, res, 'Server error', 500, 'INTERNAL_ERROR', { detail: err.message });
  }
}
