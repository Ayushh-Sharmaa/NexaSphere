import passport from 'passport';
import { studentUsersRepository } from '../repositories/studentUsersRepository.js';
import { studentAuthService } from '../services/studentAuthService.js';
import { withDb } from '../repositories/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const googleAuth = (req, res, next) => {
  const state = req.query.token || '';
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, data, info) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    if (err) return next(err);
    if (!data) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(info?.message || 'Authentication failed')}`
      );
    }
    res.cookie('ns_student_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Redirect to frontend without leaking the token in the URL. Frontend should
    // call /api/auth/me with credentials included to establish the user session.
    return res.redirect(`${frontendUrl}/dashboard`);
  })(req, res, next);
};

export const githubAuth = (req, res, next) => {
  const state = req.query.token || '';
  passport.authenticate('github', {
    session: false,
    scope: ['user:email'],
    state,
  })(req, res, next);
};

export const githubCallback = (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, data, info) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    if (err) return next(err);
    if (!data) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(info?.message || 'Authentication failed')}`
      );
    }
    res.cookie('ns_student_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Avoid including the token in the redirect URL to prevent accidental
    // exposure via referrers, browser history, or client-side storage.
    return res.redirect(`${frontendUrl}/dashboard`);
  })(req, res, next);
};

export const githubPortfolioAuth = passport.authenticate('github-portfolio', {
  session: false,
  scope: ['read:user'],
});

export const githubPortfolioCallback = (req, res, next) => {
  passport.authenticate('github-portfolio', { session: false }, (err, data) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    if (err || !data?.githubUsername) {
      return res.redirect(`${frontendUrl}/portfolio-builder?githubError=1`);
    }
    return res.redirect(
      `${frontendUrl}/portfolio-builder?github=${encodeURIComponent(data.githubUsername)}`
    );
  })(req, res, next);
};

export const getMe = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  let freshUser = null;
  try {
    freshUser = await studentUsersRepository.findByProvider(
      req.studentUser.provider,
      req.studentUser.provider_id || req.studentUser.sub
    );
    if (!freshUser) {
      freshUser = await studentUsersRepository.findByEmail(req.studentUser.email);
    }
  } catch (err) {
    console.error('Error fetching fresh user details in getMe:', err);
  }

  const userToSend = freshUser
    ? {
        id: freshUser.id,
        provider: freshUser.provider,
        email: freshUser.email,
        name: freshUser.full_name,
        role: freshUser.role,
        avatar_url: freshUser.avatar_url,
        theme: freshUser.theme,
      }
    : req.studentUser;

  return sendSuccess(res, { user: userToSend });
};

export const updateTheme = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  const { theme } = req.body;
  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    return sendError(req, res, 'Invalid theme', 400, 'VALIDATION_ERROR');
  }
  try {
    await studentUsersRepository.updateTheme(req.studentUser.sub || req.studentUser.id, theme);
    return sendSuccess(res, { ok: true, theme });
  } catch (err) {
    console.error('Error updating theme in database:', err);
    return sendError(req, res, 'Failed to update theme', 500, 'INTERNAL_ERROR');
  }
};

export const updateSlackSettings = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  const { slackUserId, slackDmReminders } = req.body;
  try {
    const updatedUser = await studentUsersRepository.updateSlackSettings(req.studentUser.email, {
      slackUserId,
      slackDmReminders,
    });
    return sendSuccess(res, { success: true, user: { ...req.studentUser, ...updatedUser } });
  } catch (err) {
    return sendError(
      req,
      res,
      'Failed to update Slack settings: ' + err.message,
      500,
      'INTERNAL_ERROR'
    );
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.ns_student_token || req.headers.authorization?.split(' ')[1];
    if (token) {
      await studentAuthService.logout(token);
    }
    res.clearCookie('ns_student_token');
    return sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    return sendError(req, res, 'Logout failed', 500, 'INTERNAL_ERROR');
  }
};

export const getProfile = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  try {
    const userId = req.studentUser.sub || req.studentUser.id;

    const user =
      (await studentUsersRepository.findByProvider(req.studentUser.provider, userId)) ||
      (await studentUsersRepository.findByEmail(req.studentUser.email));

    if (!user) return sendError(req, res, 'User not found', 404, 'NOT_FOUND');

    // Safely count related data — tables may not exist yet in all envs
    let registrations = [];
    let forumPosts = 0;
    let mentorSessions = 0;

    try {
      const { default: db } = await import('../db/index.js');
      registrations = await db('registrations')
        .where({ user_id: user.id })
        .leftJoin('events', 'registrations.event_id', 'events.id')
        .select(
          'registrations.*',
          'events.title as event_title',
          'events.date  as event_date',
          'events.location as event_location'
        )
        .orderBy('registrations.created_at', 'desc');
    } catch (_) {
      /* table may not exist yet */
    }

    try {
      const { default: db } = await import('../db/index.js');
      const [{ count }] = await db('forum_threads')
        .where({ author_id: user.id })
        .count('id as count');
      forumPosts = Number(count);
    } catch (_) {
      /* table may not exist yet */
    }

    try {
      const { default: db } = await import('../db/index.js');
      const [{ count }] = await db('mentor_sessions')
        .where({ mentee_id: user.id })
        .count('id as count');
      mentorSessions = Number(count);
    } catch (_) {
      /* table may not exist yet */
    }

    const attendedEvents = registrations.filter(
      (r) => r.attended || r.status === 'attended'
    ).length;

    return sendSuccess(res, {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      avatar: user.avatar_url,
      bio: user.bio || '',
      phoneNumber: user.phone_number || '',
      socialLinks: user.social_links || {},
      role: user.role,
      createdAt: user.created_at,
      stats: {
        totalRegistrations: registrations.length,
        attendedEvents,
        forumPosts,
        mentorSessions,
      },
      registrations,
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return sendError(req, res, 'Server error', 500, 'INTERNAL_ERROR', err.message);
  }
};

export const updateProfile = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  try {
    const userId = req.studentUser.sub || req.studentUser.id;

    // SECURITY: explicitly delete immutable fields to prevent privilege escalation
    delete req.body.roleId;
    delete req.body.permissions;
    delete req.body.status;
    delete req.body.role;
    delete req.body.admin_roles;

    const allowed = ['fullName', 'bio', 'socialLinks', 'phoneNumber'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Map camelCase keys to snake_case DB columns
    const dbUpdates = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.socialLinks !== undefined)
      dbUpdates.social_links = JSON.stringify(updates.socialLinks);

    const updatedUser = await studentUsersRepository.updateProfile(userId, dbUpdates);
    if (!updatedUser) return sendError(req, res, 'User not found', 404, 'NOT_FOUND');

    return sendSuccess(res, {
      id: updatedUser.id,
      fullName: updatedUser.full_name,
      email: updatedUser.email,
      bio: updatedUser.bio || '',
      phoneNumber: updatedUser.phone_number || '',
      socialLinks: updatedUser.social_links || {},
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return sendError(req, res, 'Server error', 500, 'INTERNAL_ERROR', err.message);
  }
};

export const getRegistrations = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  try {
    const user = await studentUsersRepository.findByEmail(req.studentUser.email);
    if (!user) return sendError(req, res, 'User not found', 404, 'NOT_FOUND');

    let registrations = [];
    try {
      const { default: db } = await import('../db/index.js');
      registrations = await db('registrations')
        .where({ user_id: user.id })
        .leftJoin('events', 'registrations.event_id', 'events.id')
        .select(
          'registrations.*',
          'events.title    as event_title',
          'events.date     as event_date',
          'events.location as event_location'
        )
        .orderBy('registrations.created_at', 'desc');
    } catch (_) {
      /* table may not exist yet */
    }

    return sendSuccess(res, registrations);
  } catch (err) {
    console.error('getRegistrations error:', err);
    return sendError(req, res, 'Server error', 500, 'INTERNAL_ERROR', err.message);
  }
};

export const deleteAccount = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  try {
    const email = req.studentUser.email;
    const user = await studentUsersRepository.findByEmail(email);
    if (user && user.id) {
      await withDb(async (client) => {
        await client.query('DELETE FROM student_users WHERE id = $1', [user.id]);
      });
    }
    res.clearCookie('ns_student_token');
    return sendSuccess(res, { success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('deleteAccount error:', err);
    return sendError(req, res, 'Server error', 500, 'INTERNAL_ERROR', { detail: err.message });
  }
};

export const exportData = async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Not authenticated', 401, 'UNAUTHORIZED');
  }
  try {
    const email = req.studentUser.email;
    const user = await studentUsersRepository.findByEmail(email);
    return sendSuccess(res, {
      profile: user,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('exportData error:', err);
    return sendError(req, res, 'Server error', 500, 'INTERNAL_ERROR', { detail: err.message });
  }
};
