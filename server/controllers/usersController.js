import { usersRepository } from "../repositories/usersRepository.js";
import { toPublicUserDTO, toAdminUserDTO } from "../utils/userSerializer.js";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";
import { auditLogRepository } from "../repositories/auditLogRepository.js";

const MAX_LIMIT = 100;
const ALLOWED_ROLES = ["admin", "user", "moderator", "member"];

function parsePaginationAndFilters(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || 20)
  );
  const role =
    query.role && ALLOWED_ROLES.includes(query.role) ? query.role : undefined;
  const search = query.search ? String(query.search).trim() : undefined;
  return { page, limit, role, search };
}

export async function getPublicUsers(req, res) {
  try {
    const { page, limit, role, search } = parsePaginationAndFilters(req.query);

    const { getOrSet, hashKeyParts } =
      await import("../utils/endpointCache.js");
    const cacheKey = `cache:endpoint:users:public:${hashKeyParts(role || "", search || "", page, limit)}`;

    const { data, hit } = await getOrSet({
      key: cacheKey,
      ttlSeconds: 60 * 30,
      getValue: async () => {
        // Repository currently ignores page/limit/role, but we still scope the cache key
        // to prevent future behavior changes from serving incorrect payloads.
        const rawUsers = await usersRepository.getAllPublicUsers({
          page,
          limit,
          role,
          search,
        });
        const safeUsers = rawUsers.map(toPublicUserDTO);
        return { users: safeUsers, page, limit, search };
      },
    });

    res.setHeader("X-Cache", hit ? "HIT" : "MISS");
    return sendSuccess(res, data);
  } catch (error) {
    console.error(
      "[Security] Error in public users endpoint serialization:",
      error.message
    );
    return sendError(req, res, "Internal server error", 500, "INTERNAL_ERROR");
  }
}

export async function getAdminUsers(req, res) {
  try {
    const { page, limit, role, search } = parsePaginationAndFilters(req.query);
    const rawUsers = await usersRepository.getAllUsersAdmin({
      page,
      limit,
      role,
      search,
    });
    const safeUsers = rawUsers.map(toAdminUserDTO);
    return sendSuccess(res, { users: safeUsers, page, limit, search });
  } catch (error) {
    console.error(
      "[Security] Error in admin users endpoint serialization:",
      error.message
    );
    return sendError(req, res, "Internal server error", 500, "INTERNAL_ERROR");
  }
}

export async function adminCreateUser(req, res) {
  try {
    const { username, display_name, email, role } = req.body;
    if (!username || !email) {
      return sendError(
        req,
        res,
        "username and email are required",
        400,
        "VALIDATION_ERROR"
      );
    }
    const user = await usersRepository.createUser({
      username,
      display_name,
      email,
      role,
    });
    return sendSuccess(res, { user }, 201);
  } catch (error) {
    console.error("[Admin] Error creating user:", error.message);
    return sendError(req, res, "Internal server error", 500, "INTERNAL_ERROR");
  }
}

export async function adminUpdateUser(req, res) {
  try {
    const { id } = req.params;
    const { display_name, email, phone_number } = req.body;
    const user = await usersRepository.updateUser(id, {
      display_name,
      email,
      phone_number,
    });
    if (!user) return sendError(req, res, "User not found", 404, "NOT_FOUND");
    return sendSuccess(res, { user });
  } catch (error) {
    console.error("[Admin] Error updating user:", error.message);
    return sendError(req, res, "Internal server error", 500, "INTERNAL_ERROR");
  }
}

export async function adminDeactivateUser(req, res) {
  try {
    const { id } = req.params;
    const user = await usersRepository.deactivateUser(id);
    if (!user) return sendError(req, res, "User not found", 404, "NOT_FOUND");
    return sendSuccess(res, { message: "User deactivated", user });
  } catch (error) {
    console.error("[Admin] Error deactivating user:", error.message);
    return sendError(req, res, "Internal server error", 500, "INTERNAL_ERROR");
  }
}

export async function adminUpdateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { admin_roles } = req.body;

    const user = await usersRepository.updateUser(id, { admin_roles });
    if (!user) return sendError(req, res, "User not found", 404, "NOT_FOUND");

    // Log audit event for role mutation
    await auditLogRepository.insertAuditLog({
      adminId: req.adminSession ? req.adminSession.username : "system",
      action: "ROLE_UPDATED",
      oldState: {},
      newState: { admin_roles: user.admin_roles },
      resourceType: "user",
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return sendSuccess(res, { user });
  } catch (error) {
    console.error("[Admin] Error updating user role:", error.message);
    return sendError(req, res, "Internal server error", 500, "INTERNAL_ERROR");
  }
}
