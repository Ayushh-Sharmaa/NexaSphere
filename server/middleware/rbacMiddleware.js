const ROLE_PERMISSIONS = {
  student: new Set([
    "profile.read.self",
    "profile.update.self",
    "application.create.self",
    "application.read.self",
    "event.register",
    "team.create",
    "team.join",
    "fund_request.create",
    "notification.read.self",
  ]),
  mentor: new Set([
    "profile.read.self",
    "profile.update.self",
    "mentorship.manage",
    "team.view",
    "notification.read.self",
  ]),
  core_member: new Set([
    "profile.read.self",
    "profile.update.self",
    "application.create.self",
    "application.read.self",
    "event.register",
    "team.create",
    "team.join",
    "fund_request.create",
    "notification.read.self",
    "activity.manage",
  ]),
  admin: new Set([
    "profile.read.self",
    "profile.update.self",
    "application.review",
    "activity.manage",
    "event.manage",
    "student.manage",
    "analytics.read",
    "team.manage",
    "fund_request.review",
    "audit_log.read",
    "notification.broadcast",
  ]),
  super_admin: new Set(["*"]),
};

export function requireRole(allowedRoles = []) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
    }

    const userRole = req.auth.role || "student";
    if (userRole === "super_admin" || roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions to perform this operation.",
        requiredRoles: roles,
      },
    });
  };
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
    }

    const userRole = req.auth.role || "student";
    const userPermissions = ROLE_PERMISSIONS[userRole] || new Set();

    if (
      userRole === "super_admin" ||
      userPermissions.has("*") ||
      userPermissions.has(permission)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: `Forbidden: Missing required permission '${permission}'.`,
      },
    });
  };
}
