import { requireRole, requireAdmin } from "./adminAuthMiddleware.js";
import { requireStudentAuth } from "./studentAuthMiddleware.js";

export const auth = (role) => {
  if (role === "student") {
    return requireStudentAuth;
  }
  if (role === "admin") {
    return requireAdmin;
  }
  return requireRole(role);
};

export { requireStudentAuth, requireAdmin, requireRole };
