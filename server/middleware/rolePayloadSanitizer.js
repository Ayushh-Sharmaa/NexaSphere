/**
 * Middleware to sanitize user update payloads and prevent privilege escalation via JWT role claim tampering.
 * Non-master-admin users cannot alter role, permissions, or admin flags.
 */
export function stripPrivilegedRoleFields(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  // Check if caller is master admin
  const isMasterAdmin = Boolean(
    req.user && (req.user.role === 'master_admin' || req.user.isMasterAdmin === true)
  );

  if (!isMasterAdmin) {
    const restrictedKeys = ['role', 'roles', 'isAdmin', 'isMasterAdmin', 'permissions', 'claims', 'scope'];
    
    for (const key of restrictedKeys) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        delete req.body[key];
      }
    }
  }

  next();
}
