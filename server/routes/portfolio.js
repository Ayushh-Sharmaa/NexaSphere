/**
 * Portfolio Routes
 * Public portfolio lookup and authenticated create/update
 * with passkey-based auth and brute-force lockout protection.
 */

import { Router } from 'express';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { portfolioContentSchema, portfolioPutSchema } from '../validators/portfolioSchemas.js';
import { validate } from '../middleware/validate.js';
import { endorseSkillSchema } from '../validators/routes/portfolioExtrasSchemas.js';
import { protectedActionRateLimiter } from '../middleware/authRateLimiter.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import notificationsService from '../services/notificationsService.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';
import { getAuthorizationUrl, fetchLinkedInData } from '../utils/linkedinHelper.js';

const router = Router();

const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function getGitHubToken() {
  return String(process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN || '').trim();
}

// ── Passkey brute-force lockout ────────────────────────────────────────────
// Tracks failed attempts per IP and per username with exponential backoff.
// Hard cap on tracked entries prevents memory exhaustion under attack.

const MAX_PASSKEY_TRACKED_KEYS = 10_000;
const failedPasskeyAttemptsByIp = new Map();
const failedPasskeyAttemptsByUsername = new Map();

// Periodic sweep every 30 minutes: remove entries whose lockout period has
// expired and whose attempt count has already been reset to 0, so they do
// not accumulate for keys that are never visited again.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of failedPasskeyAttemptsByIp) {
      if (entry.count === 0 && now > entry.lockoutUntil) {
        failedPasskeyAttemptsByIp.delete(key);
      }
    }
    for (const [key, entry] of failedPasskeyAttemptsByUsername) {
      if (now > entry.lockoutUntil) {
        failedPasskeyAttemptsByUsername.delete(key);
      }
    }
  },
  30 * 60 * 1000
).unref();

function checkPasskeyLockout(username, ip) {
  const ipKey = String(ip || 'unknown');
  const userKey = String(username || '').toLowerCase();

  const ipEntry = failedPasskeyAttemptsByIp.get(ipKey);
  const userEntry = failedPasskeyAttemptsByUsername.get(userKey);

  const now = Date.now();

  if (ipEntry && ipEntry.lockoutUntil !== 0 && now <= ipEntry.lockoutUntil) {
    return true;
  }

  if (userEntry && userEntry.lockoutUntil !== 0 && now <= userEntry.lockoutUntil) {
    return true;
  }

  // Cleanup expired entries proactively
  if (ipEntry && ipEntry.lockoutUntil !== 0 && now > ipEntry.lockoutUntil) {
    failedPasskeyAttemptsByIp.delete(ipKey);
  }
  if (userEntry && userEntry.lockoutUntil !== 0 && now > userEntry.lockoutUntil) {
    failedPasskeyAttemptsByUsername.delete(userKey);
  }

  return false;
}

function recordFailedPasskeyAttempt(username, ip) {
  const ipKey = String(ip || 'unknown');
  const userKey = String(username || '').toLowerCase();

  // IP tracking
  if (
    !failedPasskeyAttemptsByIp.has(ipKey) &&
    failedPasskeyAttemptsByIp.size >= MAX_PASSKEY_TRACKED_KEYS
  ) {
    failedPasskeyAttemptsByIp.delete(failedPasskeyAttemptsByIp.keys().next().value);
  }
  const ipEntry = failedPasskeyAttemptsByIp.get(ipKey) || { count: 0, lockoutUntil: 0 };
  ipEntry.count += 1;
  if (ipEntry.count >= 5) {
    ipEntry.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins
    ipEntry.count = 0; // Reset count so they need 5 more AFTER lockout to be locked again
  }
  failedPasskeyAttemptsByIp.set(ipKey, ipEntry);

  // Username tracking (Exponential backoff)
  if (
    !failedPasskeyAttemptsByUsername.has(userKey) &&
    failedPasskeyAttemptsByUsername.size >= MAX_PASSKEY_TRACKED_KEYS
  ) {
    failedPasskeyAttemptsByUsername.delete(failedPasskeyAttemptsByUsername.keys().next().value);
  }
  const userEntry = failedPasskeyAttemptsByUsername.get(userKey) || { count: 0, lockoutUntil: 0 };
  userEntry.count += 1;
  if (userEntry.count >= 5) {
    // 5 attempts = 1 min, 6 = 2 mins, 7 = 4 mins, 8 = 8 mins, 9+ = 15 mins
    const factor = Math.pow(2, Math.max(0, userEntry.count - 5));
    const delayMinutes = Math.min(15, factor);
    userEntry.lockoutUntil = Date.now() + delayMinutes * 60 * 1000;
  }
  failedPasskeyAttemptsByUsername.set(userKey, userEntry);

  return { ipEntry, userEntry };
}

function clearPasskeyAttempts(username, ip) {
  const ipKey = String(ip || 'unknown');
  const userKey = String(username || '').toLowerCase();

  failedPasskeyAttemptsByIp.delete(ipKey);
  failedPasskeyAttemptsByUsername.delete(userKey);
}

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/portfolio/linkedin/auth
 * Initiates the LinkedIn OAuth flow.
 */
router.get('/portfolio/linkedin/auth', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  // Ideally, store the state in session or a cookie to verify it later to prevent CSRF
  const authUrl = getAuthorizationUrl(state);
  res.redirect(authUrl);
});

/**
 * GET /api/portfolio/linkedin/callback
 * Handles the callback from LinkedIn OAuth.
 */
router.get('/portfolio/linkedin/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`
      <script>
        window.opener.postMessage({ type: 'LINKEDIN_ERROR', payload: '${error_description || error}' }, '*');
        window.close();
      </script>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <script>
        window.opener.postMessage({ type: 'LINKEDIN_ERROR', payload: 'Authorization code missing.' }, '*');
        window.close();
      </script>
    `);
  }

  try {
    const data = await fetchLinkedInData(code);

    // Send data back to the popup opener (PortfolioBuilder)
    res.send(`
      <script>
        window.opener.postMessage({ type: 'LINKEDIN_SUCCESS', payload: ${JSON.stringify(data)} }, '*');
        window.close();
      </script>
    `);
  } catch (err) {
    console.error('LinkedIn OAuth Error:', err);
    res.status(500).send(`
      <script>
        window.opener.postMessage({ type: 'LINKEDIN_ERROR', payload: 'Failed to fetch LinkedIn data' }, '*');
        window.close();
      </script>
    `);
  }
});

/**
 * GET /api/portfolio/github-repos/:username — Server-side GitHub repository import.
 * Keeps GitHub API credentials off the browser and avoids unauthenticated client calls.
 */
router.get('/portfolio/github-repos/:username', async (req, res) => {
  const username = String(req.params.username || '').trim();
  if (!GITHUB_USERNAME_PATTERN.test(username)) {
    return sendError(req, res, 'Invalid GitHub username format.', 400, 'VALIDATION_ERROR');
    return res.status(400).json({
      error: 'Invalid GitHub username format.',
    });
  }

  const token = getGitHubToken();
  if (!token) {
    return sendError(
      req,
      res,
      'GitHub repository import is unavailable because the server token is not configured.',
      503,
      'DEPENDENCY_ERROR'
    );
  }

  const sort =
    req.query.sort === 'created' || req.query.sort === 'pushed' ? req.query.sort : 'updated';
  const perPage = Math.min(Math.max(Number.parseInt(req.query.per_page, 10) || 30, 1), 30);
  const githubUrl = new URL(`https://api.github.com/users/${encodeURIComponent(username)}/repos`);
  githubUrl.searchParams.set('sort', sort);
  githubUrl.searchParams.set('per_page', String(perPage));

  try {
    const response = await fetch(githubUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'NexaSphere-PortfolioBuilder',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 403 || response.status === 429) {
      const resetHeader = response.headers.get('X-RateLimit-Reset');
      const resetDate = resetHeader
        ? new Date(Number.parseInt(resetHeader, 10) * 1000).toISOString()
        : null;
      return sendError(
        req,
        res,
        'GitHub rate limit reached. Please try again later.',
        response.status,
        'RATE_LIMITED',
        { rateLimitReset: resetDate }
      );
    }

    if (response.status === 404) {
      return sendError(
        req,
        res,
        `GitHub user "${username}" not found. Please check the username and try again.`,
        404,
        'NOT_FOUND'
      );
    }

    if (!response.ok) {
      return sendError(
        req,
        res,
        `GitHub API error: ${response.status} ${response.statusText}`,
        response.status,
        'DEPENDENCY_ERROR'
      );
    }

    const repos = await response.json();
    res.set('Cache-Control', 'private, max-age=60');
    return sendSuccess(res, repos);
  } catch (err) {
    console.error('Error fetching GitHub repositories:', err);
    return sendError(
      req,
      res,
      'Failed to fetch repositories from GitHub.',
      502,
      'DEPENDENCY_ERROR'
    );
  }
});

/**
 * GET /api/portfolio/:username — Public portfolio lookup.
 * Returns 404 if the username does not exist.
 * Returns 403 if the portfolio is not public and no valid passkey is provided.
 */
router.get('/portfolio/:username', async (req, res) => {
  try {
    const username = String(req.params.username || '').trim();
    const passkey = req.query.passkey;

    if (!username) {
      return sendError(req, res, 'Username is required', 400, 'VALIDATION_ERROR');
    }
    const portfolio = await portfolioRepository.getByUsername(username);
    if (!portfolio) {
      return sendError(req, res, 'Portfolio not found', 404, 'NOT_FOUND');
    }

    // Check if portfolio is private
    if (portfolio.isPublic === false) {
      if (!passkey) {
        return sendError(req, res, 'This portfolio is private', 403, 'FORBIDDEN');
      }

      const isAuthorized = await portfolioRepository.verifyPasskey(username, passkey);
      if (!isAuthorized) {
        // To avoid brute-force via GET, we could apply rate limit,
        // but for now just return 403.
        return sendError(req, res, 'Incorrect passkey for private portfolio', 403, 'FORBIDDEN');
      }
    }

    return sendSuccess(res, portfolio);
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    return sendError(req, res, err.message || 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

/**
 * POST /api/portfolio/:username/endorse — Endorse a skill.
 */
router.post(
  '/portfolio/:username/endorse',
  validate(endorseSkillSchema),
  requireStudentAuth,
  protectedActionRateLimiter,
  async (req, res) => {
    try {
      const username = String(req.params.username || '').trim();
      const { skillName } = req.body;
      const endorserId = req.studentUser.id;

      if (!username || !skillName) {
        return sendError(req, res, 'Username and skillName are required', 400, 'VALIDATION_ERROR');
        return res.status(400).json({ error: 'Username and skillName are required' });
      }

      // Prevent self-endorsements (comparing lowercased usernames/ids, but usually endorserId is ID, portfolio is username. Wait!
      // The portfolio is identified by username, the endorser is identified by ID or username from studentUser.
      // If studentUser has username, check against it.
      if (
        req.studentUser.username &&
        req.studentUser.username.toLowerCase() === username.toLowerCase()
      ) {
        return sendError(req, res, 'You cannot endorse your own skills', 400, 'VALIDATION_ERROR');
        return res.status(400).json({ error: 'You cannot endorse your own skills' });
      }

      await portfolioRepository.endorseSkill(username, skillName, endorserId);

      // Trigger a notification to the portfolio owner
      try {
        await notificationsService.addNotification(username, {
          type: 'endorsement',
          priority: 'normal',
          title: 'New Skill Endorsement!',
          message: `Someone just endorsed your skill: ${skillName}.`,
          link: `/portfolio/${username}`,
        });
      } catch (notifErr) {
        console.warn('Failed to send endorsement notification:', notifErr.message);
      }

      return sendSuccess(res, { success: true, message: 'Skill endorsed successfully' });
    } catch (err) {
      if (
        err.message === 'You have already endorsed this skill' ||
        err.message === 'You have reached the limit of 3 endorsements per day' ||
        err.message === 'Portfolio not found'
      ) {
        return sendError(req, res, err.message, 400, 'VALIDATION_ERROR');
      }
      console.error('Error endorsing skill:', err);
      return sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }
);

/**
 * PUT /api/portfolio — Create or update a portfolio.
 * Requires a valid passkey. Enforces rate limiting and
 * brute-force lockout on repeated failed passkey attempts.
 */
router.put('/portfolio', protectedActionRateLimiter, async (req, res) => {
    const body = req.body || {};
    const ip = String(req.ip || 'unknown').trim();

    // 1. Validate credentials up front. Anything below this point
    //    trusts the username + passkey pair.
    const credentials = portfolioPutSchema.safeParse({
      username: body.username,
      passkey: body.passkey,
    });
    if (!credentials.success) {
      const firstIssue = credentials.error.issues[0];
      return sendError(
        req,
        res,
        firstIssue?.message || 'Invalid request body',
        400,
        'VALIDATION_ERROR'
      );
    }
    const { username, passkey } = credentials.data;

    // 2. Validate the content body. This rejects XSS payloads such
    //    as javascript: URLs and unknown protocol schemes before
    //    the data ever reaches the repository. The repository
    //    re-sanitizes as defense-in-depth.
    const content = portfolioContentSchema.safeParse(body);
    if (!content.success) {
      const firstIssue = content.error.issues[0];
      return sendError(
        req,
        res,
        `Invalid portfolio content: ${firstIssue?.path?.join('.') || ''} ${firstIssue?.message || ''}`.trim(),
        400,
        'VALIDATION_ERROR'
      );
    }

    const existingPortfolio = await portfolioRepository.getByUsername(username);
    const isNewRegistration = !existingPortfolio;

    const lockout = checkPasskeyLockout(username, ip);
    if (lockout) {
      return sendError(
        req,
        res,
        'Too many failed passkey attempts. Please try again later.',
        429,
        'RATE_LIMITED'
      );
    }

    const isAuthorized = await portfolioRepository.verifyPasskey(username, passkey, {
      allowNew: isNewRegistration,
    });
    if (!isAuthorized) {
      recordFailedPasskeyAttempt(username, ip);
      return sendError(req, res, 'Incorrect passkey for this username', 401, 'UNAUTHORIZED');
    }

    clearPasskeyAttempts(username, ip);

    const saved = await portfolioRepository.createOrUpdate({
      ...content.data,
      username,
      passkey,
    });

    // If projects are saved, push real-time project approval notification
    if (saved && Array.isArray(saved.projects) && saved.projects.length > 0) {
      try {
        const { emitToRoom } = await import('../config/socket.js');
        const lastProject = saved.projects[saved.projects.length - 1];
        emitToRoom(`user-${String(username).toLowerCase()}`, 'project-approved', {
          projectName: lastProject.name,
        });
      } catch (socketErr) {
        console.warn(
          '[Portfolio] Could not emit project-approved notification:',
          socketErr.message
        );
      }
    }

    return sendSuccess(res, { ok: true, portfolio: saved });
        console.warn('[Portfolio] Could not emit project-approved notification:', socketErr.message);

    return res.json({ ok: true, portfolio: saved });
    if (err.code === '23505') {
      return sendError(
        req,
        res,
        'Username already exists. Another request may have just created it.',
        409,
        'CONFLICT'
      );
    }
    console.error('Error saving portfolio:', err);
    return sendError(req, res, err.message || 'Internal server error', 500, 'INTERNAL_ERROR');
});

export default router;
