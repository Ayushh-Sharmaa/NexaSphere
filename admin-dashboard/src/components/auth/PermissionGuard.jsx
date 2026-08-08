import React from 'react';

/**
 * Granular Role-Based Access Control (RBAC) Permission Matrix
 * Maps admin roles to sub-route permission levels.
 */
export const PERMISSION_MATRIX = {
  SUPER_ADMIN: [
    'system_metrics',
    'rate_limit_monitor',
    'user_management',
    'audit_logs',
    'settings',
  ],
  ADMIN: [
    'system_metrics',
    'rate_limit_monitor',
    'user_management',
  ],
  AUDITOR: [
    'system_metrics',
    'audit_logs',
  ],
  VIEWER: [
    'system_metrics',
  ],
};

/**
 * Check if a user role has permission to access a specific sub-route key.
 */
export function hasPermission(role, routeKey) {
  if (!role || !routeKey) return false;
  const allowedRoutes = PERMISSION_MATRIX[role.toUpperCase()] || [];
  return allowedRoutes.includes(routeKey.toLowerCase());
}

/**
 * PermissionGuard component wrapping sub-route components.
 */
export default function PermissionGuard({ role, routeKey, children, fallback = null }) {
  if (!hasPermission(role, routeKey)) {
    return fallback || (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
        <h3 className="font-bold text-lg">Access Denied</h3>
        <p className="text-sm mt-1">Your role ({role || 'Guest'}) does not have permission to view this section.</p>
      </div>
    );
  }

  return <>{children}</>;
}
