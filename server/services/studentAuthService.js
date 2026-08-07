import jwt from "jsonwebtoken";
import { studentUsersRepository } from "../repositories/studentUsersRepository.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "nexasphere-jwt-dev-secret-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

const STUDENT_ROLES = {
  student: {
    scopes: ["profile:read", "profile:write", "events:read", "events:register"],
  },
  club_lead: {
    scopes: [
      "profile:read",
      "profile:write",
      "events:read",
      "events:register",
      "events:write",
      "team:read",
    ],
  },
  admin: {
    scopes: [
      "profile:read",
      "profile:write",
      "events:read",
      "events:register",
      "events:write",
      "team:read",
      "settings:admin",
    ],
  },
};

function getScopesForRole(role) {
  return STUDENT_ROLES[role]?.scopes || STUDENT_ROLES.student.scopes;
}

export const studentAuthService = {
  async findOrCreateFromOAuth(profile) {
    const user = await studentUsersRepository.upsertFromOAuth({
      provider: profile.provider,
      providerId: profile.id,
      email: profile.emails?.[0]?.value || "",
      fullName: profile.displayName || profile.username || "",
      avatarUrl: profile.photos?.[0]?.value || "",
    });
    return user;
  },

  generateToken(user) {
    const payload = {
      sub: user.id,
      provider: user.provider,
      email: user.email,
      name: user.full_name,
      role: user.role,
      scopes: user.scopes?.length ? user.scopes : getScopesForRole(user.role),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  },

  getScopesForRole,
};
