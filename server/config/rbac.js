export const ROLES = {
  SuperAdmin: [
    "users:read",
    "users:write",
    "settings:admin",
    "events:read",
    "events:write",
  ],
  Moderator: ["users:read", "events:read", "events:write"],
  Editor: ["events:read", "events:write"],
  Viewer: ["users:read", "events:read"],
};

export function getScopesForRole(role) {
  return ROLES[role] || [];
}
