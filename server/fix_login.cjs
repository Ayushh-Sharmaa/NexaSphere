const fs = require('fs');
let lines = fs.readFileSync('middleware/adminAuthMiddleware.js', 'utf8').split('\n');

const correctLogin = `async function login(req, res) {
  try {
    prunePendingTokens(pendingTwoFactorSetups);
    prunePendingTokens(pendingTwoFactorChallenges);

    const u = getLoginUsername(req.body);
    const p = String(req.body?.password || '');
    const ip = getClientIp(req);
    const userAgent = req.get('user-agent') || '';

    if (u.length > 128 || p.length > 128) {
      return res.status(400).json({ error: 'Username or password too long' });
    }

    const state = await getLoginAttemptState(ip);
    if (state && state.attempts > LOGIN_MAX_ATTEMPTS) {
      return res.status(429).json({ error: "Too many login attempts. Please wait and try again." });
    }

    const matchedUser = adminUsers.find((user) => safeEqual(u, user.username) && safeEqual(p, user.password));
    if (!matchedUser && u !== ADMIN_USERNAME) {
      recordLoginAttempt(ip);
      await recordAdminLoginAttempt({
        username: u || 'unknown',
        ipAddress: ip,
        userAgent,
        success: false,
        suspicious: false,
        reason: 'invalid_credentials',
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    let isPasswordValid = false;
    if (ADMIN_PASSWORD_HASH) {
      const hash = crypto.createHash('sha256').update(p).digest('hex');
      isPasswordValid = (hash === ADMIN_PASSWORD_HASH);
    } else {
      isPasswordValid = (p === ADMIN_PASSWORD);
    }
    
    if (!matchedUser && (!safeEqual(u, ADMIN_USERNAME) || !isPasswordValid)) {
      recordLoginAttempt(ip);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await clearLoginAttempts(ip);

    const userRecord = matchedUser || adminUsers[0];
    const role = userRecord.role || 'SuperAdmin';
    const scopes = getScopesForRole(role);
    const securityAccount = await getOrCreateAdminSecurityAccount(u, userRecord.email || u);
    const suspicious = await assessSuspiciousLogin({ username: u, ipAddress: ip, userAgent }).catch(
      () => ({ suspicious: false, reason: null })
    );

    if (!securityAccount?.two_factor_enabled) {
      if (role !== 'SuperAdmin') {
        return completeAdminLogin({ req, res, username: u, role, scopes, ip, userAgent, suspicious });
      }
      
      const secret = generateTotpSecret();
      const backupCodes = generateBackupCodes(8);
      const otpAuthUrl = buildOtpAuthUrl({ username: u, secret });
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
      const setupToken = createPendingToken(pendingTwoFactorSetups, {
        username: u,
        role,
        scopes,
        secret,
        backupCodes,
        ip,
        userAgent,
        suspicious,
      });

      return res.status(202).json({
        requiresTwoFactorSetup: true,
        setupToken,
        qrCodeDataUrl,
        otpAuthUrl,
        secret,
        backupCodes,
        graceEndsAt: securityAccount?.grace_ends_at,
      });
    }

    const challengeToken = createPendingToken(pendingTwoFactorChallenges, {
      username: u,
      role,
      scopes,
      secret: securityAccount.totp_secret,
      ip,
      userAgent,
      suspicious,
    });

    return res.status(202).json({
      requiresTwoFactor: true,
      challengeToken,
      suspicious: suspicious.suspicious,
      reason: suspicious.reason,
    });
  } catch (error) {
    console.error('[Admin Login] Failed before 2FA challenge:', error);
    return res.status(500).json({ error: 'Unable to create admin session' });
  }
}`.split('\n');

lines.splice(426, 629 - 427 + 1, ...correctLogin);
fs.writeFileSync('middleware/adminAuthMiddleware.js', lines.join('\n'));
