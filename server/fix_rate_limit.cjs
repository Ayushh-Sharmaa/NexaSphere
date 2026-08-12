const fs = require('fs');
const code = fs.readFileSync('routes/rateLimitAdminRoutes.js', 'utf8');
const lines = code.split('\n');
const newCode = lines.slice(0, 211).join('\n') + '\n' + `router.post(
  '/api/admin/rate-limits/override',
  validate(overrideBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { identifier, limitPerMinute } = req.body;

      const r = await redis();
      if (r) await r.set(\`ratelimit:override:\${identifier}\`, String(limitPerMinute), 'EX', 86400);

      logger.info('Rate limit override set', {
        identifier,
        limitPerMinute,
        by: req.adminSession?.adminId,
      });
      sendSuccess(res, { success: true, identifier, limitPerMinute });
    } catch (err) {
      logger.error('rateLimitAdminRoutes /override error', { err: err.message });
      sendError(req, res, 'Failed to set override', 500, 'INTERNAL_ERROR');
    }
  }
);

router.delete(
  '/api/admin/rate-limits/override/:identifier',
  validate(overrideParamsSchema, 'params'),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const r = await redis();
      if (r) await r.del(\`ratelimit:override:\${req.params.identifier}\`);
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, 'Failed to remove override', 500, 'INTERNAL_ERROR');
    }
  }
);

router.get(
  '/api/admin/rate-limits/whitelist',
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      sendSuccess(res, { whitelist: await getWhitelist() });
    } catch (err) {
      sendError(req, res, 'Failed to fetch whitelist', 500, 'INTERNAL_ERROR');
    }
  }
);

router.post(
  '/api/admin/rate-limits/whitelist',
  validate(whitelistBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { ip } = req.body;
      await addToWhitelist(ip);
      logger.info('IP whitelisted', { ip, by: req.adminSession?.adminId });
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, 'Failed to add to whitelist', 500, 'INTERNAL_ERROR');
    }
  }
);

router.delete(
  '/api/admin/rate-limits/whitelist/:ip',
  validate(whitelistParamsSchema, 'params'),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      await removeFromWhitelist(req.params.ip);
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, 'Failed to remove from whitelist', 500, 'INTERNAL_ERROR');
    }
  }
);

router.get(
  '/api/admin/rate-limits/blacklist',
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      sendSuccess(res, { blacklist: await getBlacklist() });
    } catch (err) {
      sendError(req, res, 'Failed to fetch blacklist', 500, 'INTERNAL_ERROR');
    }
  }
);

router.post(
  '/api/admin/rate-limits/blacklist',
  validate(blacklistBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { ip } = req.body;
      await addToBlacklist(ip);
      logger.info('IP blacklisted', { ip, by: req.adminSession?.adminId });
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, 'Failed to add to blacklist', 500, 'INTERNAL_ERROR');
    }
  }
);

router.delete(
  '/api/admin/rate-limits/blacklist/:ip',
  validate(blacklistParamsSchema, 'params'),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      await removeFromBlacklist(req.params.ip);
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, 'Failed to remove from blacklist', 500, 'INTERNAL_ERROR');
    }
  }
);

router.post(
  '/api/admin/rate-limits/unblock',
  validate(unblockBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { ip } = req.body;
      await unblockIp(ip);
      logger.info('IP auto-block lifted', { ip, by: req.adminSession?.adminId });
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, 'Failed to unblock IP', 500, 'INTERNAL_ERROR');
    }
  }
);

export default router;
`;
fs.writeFileSync('routes/rateLimitAdminRoutes.js', newCode);
