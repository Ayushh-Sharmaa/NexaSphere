export const PERMISSIONS = {
  // Users
  'users:read': 'View users',
  'users:write': 'Create/edit users',
  'users:delete': 'Delete users',
  'users:suspend': 'Suspend users',
  'users:promote': 'Promote users',

  // Events
  'events:read': 'View events',
  'events:write': 'Create/edit events',
  'events:delete': 'Delete events',
  'events:approve': 'Approve events',
  'events:manage-attendees': 'Manage event attendees',

  // Content
  'content:read': 'View content',
  'content:write': 'Create/edit content',
  'content:delete': 'Delete content',
  'content:moderate': 'Moderate content',
  'content:feature': 'Feature content',

  // Settings
  'settings:read': 'View settings',
  'settings:write': 'Edit system settings',
  'settings:admin': 'Full settings access',

  // Analytics
  'analytics:read': 'View dashboards',
  'analytics:export': 'Export data',
  'analytics:reports': 'Create reports',

  // Billing
  'billing:read': 'View invoices',
  'billing:manage': 'Manage payments',
  'billing:refund': 'Issue refunds',

  // RBAC
  'rbac:read': 'View roles and permissions',
  'rbac:write': 'Manage roles and permissions',
  'rbac:assign': 'Assign roles to users',

  // Audit
  'audit:read': 'View audit logs',
  'audit:export': 'Export audit logs',
};

export const DEFAULT_ROLES = {
  SuperAdmin: {
    name: 'Super Admin',
    description: 'Full access to everything, can create other admins',
    permissions: Object.keys(PERMISSIONS),
    isSystem: true,
    hierarchy: 0,
  },
  Admin: {
    name: 'Admin',
    description: 'Manage events, users, settings (but cannot modify other admins)',
    permissions: [
      'users:read',
      'users:write',
      'users:suspend',
      'events:read',
      'events:write',
      'events:delete',
      'events:approve',
      'events:manage-attendees',
      'content:read',
      'content:write',
      'content:delete',
      'content:moderate',
      'content:feature',
      'settings:read',
      'settings:write',
      'analytics:read',
      'analytics:export',
      'analytics:reports',
      'billing:read',
      'billing:manage',
      'rbac:read',
      'audit:read',
    ],
    isSystem: true,
    hierarchy: 1,
  },
  Moderator: {
    name: 'Moderator',
    description: 'Moderate content, manage user reports, approve posts',
    permissions: [
      'users:read',
      'events:read',
      'events:write',
      'events:manage-attendees',
      'content:read',
      'content:write',
      'content:moderate',
      'content:feature',
      'analytics:read',
    ],
    isSystem: true,
    hierarchy: 2,
  },
  ContentModerator: {
    name: 'Content Moderator',
    description: 'Moderate content, manage user reports, approve posts',
    permissions: [
      'users:read',
      'content:read',
      'content:write',
      'content:delete',
      'content:moderate',
      'content:feature',
      'events:read',
    ],
    isSystem: true,
    hierarchy: 2,
  },
  EventOrganizer: {
    name: 'Event Organizer',
    description: 'Create and manage own events, view attendees',
    permissions: [
      'users:read',
      'events:read',
      'events:write',
      'events:manage-attendees',
      'content:read',
      'content:write',
      'analytics:read',
    ],
    isSystem: true,
    hierarchy: 3,
  },
  EventManager: {
    name: 'Event Manager',
    description: 'Manage all events, attendees, and related analytics',
    permissions: [
      'users:read',
      'events:read',
      'events:write',
      'events:delete',
      'events:approve',
      'events:manage-attendees',
      'analytics:read',
    ],
    isSystem: true,
    hierarchy: 3,
  },
  Member: {
    name: 'Member',
    description: 'Register for events, participate in community, create content',
    permissions: ['users:read', 'events:read', 'content:read', 'content:write'],
    isSystem: true,
    hierarchy: 4,
  },
  Viewer: {
    name: 'Viewer',
    description: 'Read-only access (for public or guest users)',
    permissions: ['users:read', 'events:read', 'content:read'],
    isSystem: true,
    hierarchy: 5,
  },
  AnalyticsViewer: {
    name: 'Analytics Viewer',
    description: 'View and export analytics data',
    permissions: ['analytics:read', 'analytics:export', 'analytics:reports'],
    isSystem: true,
    hierarchy: 5,
  },
};

export function getScopesForRole(role) {
  const roleConfig = DEFAULT_ROLES[role];
  return roleConfig ? roleConfig.permissions : [];
}

export function getAllPermissions() {
  return Object.entries(PERMISSIONS).map(([key, description]) => ({
    key,
    description,
    category: key.split(':')[0],
  }));
}

export function getDefaultRoles() {
  return Object.entries(DEFAULT_ROLES).map(([key, value]) => ({
    key,
    ...value,
  }));
}

export function hasPermission(role, permission) {
  const roleConfig = DEFAULT_ROLES[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

export function hasHigherRole(role1, role2) {
  const config1 = DEFAULT_ROLES[role1];
  const config2 = DEFAULT_ROLES[role2];
  if (!config1 || !config2) return false;
  return config1.hierarchy < config2.hierarchy;
}

export function canManageRole(adminRole, targetRole) {
  const adminConfig = DEFAULT_ROLES[adminRole];
  const targetConfig = DEFAULT_ROLES[targetRole];
  if (!adminConfig || !targetConfig) return false;
  return adminConfig.hierarchy < targetConfig.hierarchy;
export const ROLES = {
  SuperAdmin: ['users:read', 'users:write', 'settings:admin', 'events:read', 'events:write'],
  Moderator: ['users:read', 'events:read', 'events:write'],
  Editor: ['events:read', 'events:write'],
  Viewer: ['users:read', 'events:read'],
};

export function getScopesForRole(role) {
  return ROLES[role] || [];
}
