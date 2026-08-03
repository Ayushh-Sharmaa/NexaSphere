import * as rbacRepository from '../repositories/rbacRepository.js';
import {
  DEFAULT_ROLES,
  getAllPermissions as getAllPermissionsFromConfig,
  PERMISSIONS,
} from '../config/rbac.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

/**
 * Get all roles (default + custom)
 */
export async function getAllRoles(req, res) {
  try {
    const customRoles = await rbacRepository.getAllRoles();
    const defaultRoles = Object.entries(DEFAULT_ROLES).map(([key, value]) => ({
      name: key,
      ...value,
    }));

    return sendSuccess(res, {
      defaultRoles,
      customRoles,
    });
  } catch (error) {
    console.error('[RBAC] Failed to get roles:', error);
    return sendError(req, res, 'Failed to retrieve roles', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions(req, res) {
  try {
    const permissions = getAllPermissionsFromConfig();
    return sendSuccess(res, { permissions });
  } catch (error) {
    console.error('[RBAC] Failed to get permissions:', error);
    return sendError(req, res, 'Failed to retrieve permissions', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Create a new custom role
 */
export async function createRole(req, res) {
  try {
    const { name, description, permissions, hierarchy } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return sendError(
        req,
        res,
        'Name and permissions array are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Validate permissions exist
    const validPermissions = Object.keys(PERMISSIONS);
    const invalidPermissions = permissions.filter((p) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return sendError(req, res, 'Invalid permissions', 400, 'VALIDATION_ERROR', {
        invalid: invalidPermissions,
      });
    }

    // Check if role already exists
    const existingRole = await rbacRepository.getRoleByName(name);
    if (existingRole) {
      return sendError(req, res, 'Role already exists', 409, 'CONFLICT');
    }

    const role = await rbacRepository.createRole({
      name,
      description,
      permissions,
      hierarchy: hierarchy || 10,
    });

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_CREATED',
      newValue: role,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { role }, 201);
  } catch (error) {
    console.error('[RBAC] Failed to create role:', error);
    return sendError(req, res, 'Failed to create role', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Update a custom role
 */
export async function updateRole(req, res) {
  try {
    const { name } = req.params;
    const { description, permissions, hierarchy } = req.body;

    // Check if role is a system role
    if (DEFAULT_ROLES[name]) {
      return sendError(req, res, 'Cannot modify system roles', 400, 'VALIDATION_ERROR');
    }

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = Object.keys(PERMISSIONS);
      const invalidPermissions = permissions.filter((p) => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return sendError(req, res, 'Invalid permissions', 400, 'VALIDATION_ERROR', {
          invalid: invalidPermissions,
        });
      }
    }

    const oldRole = await rbacRepository.getRoleByName(name);

    const updatedRole = await rbacRepository.updateRole(name, {
      description,
      permissions,
      hierarchy,
    });

    if (!updatedRole) {
      return sendError(req, res, 'Role not found or is a system role', 404, 'NOT_FOUND');
    }

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_UPDATED',
      oldValue: oldRole,
      newValue: updatedRole,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { role: updatedRole });
  } catch (error) {
    console.error('[RBAC] Failed to update role:', error);
    return sendError(req, res, 'Failed to update role', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Delete a custom role
 */
export async function deleteRole(req, res) {
  try {
    const { name } = req.params;

    // Check if role is a system role
    if (DEFAULT_ROLES[name]) {
      return sendError(req, res, 'Cannot delete system roles', 400, 'VALIDATION_ERROR');
    }

    const deletedRole = await rbacRepository.deleteRole(name);

    if (!deletedRole) {
      return sendError(req, res, 'Role not found or is a system role', 404, 'NOT_FOUND');
    }

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_DELETED',
      oldValue: deletedRole,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { ok: true });
  } catch (error) {
    console.error('[RBAC] Failed to delete role:', error);
    return sendError(req, res, 'Failed to delete role', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Get all users with their roles
 */
export async function getUsersWithRoles(req, res) {
  try {
    const users = await rbacRepository.getAllUsersWithRoles();
    return sendSuccess(res, { users });
  } catch (error) {
    console.error('[RBAC] Failed to get users:', error);
    return sendError(req, res, 'Failed to retrieve users', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Assign role to user
 */
export async function assignRole(req, res) {
  try {
    const { userId, roleName, expiresAt } = req.body;

    if (!userId || !roleName) {
      return sendError(req, res, 'userId and roleName are required', 400, 'VALIDATION_ERROR');
    }

    // Check if role exists
    const role = DEFAULT_ROLES[roleName] || (await rbacRepository.getRoleByName(roleName));
    if (!role) {
      return sendError(req, res, 'Role not found', 404, 'NOT_FOUND');
    }

    const assignment = await rbacRepository.assignRole(
      userId,
      roleName,
      req.adminSession.username,
      expiresAt
    );

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_ASSIGNED',
      targetUserId: userId,
      newValue: { roleName, expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { assignment });
  } catch (error) {
    console.error('[RBAC] Failed to assign role:', error);
    return sendError(req, res, 'Failed to assign role', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Revoke role from user
 */
export async function revokeRole(req, res) {
  try {
    const { userId, roleName } = req.params;

    if (!userId || !roleName) {
      return sendError(req, res, 'userId and roleName are required', 400, 'VALIDATION_ERROR');
    }

    const revoked = await rbacRepository.revokeRole(parseInt(userId), roleName);

    if (!revoked) {
      return sendError(req, res, 'Role assignment not found', 404, 'NOT_FOUND');
    }

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_REVOKED',
      targetUserId: parseInt(userId),
      oldValue: { roleName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { ok: true });
  } catch (error) {
    console.error('[RBAC] Failed to revoke role:', error);
    return sendError(req, res, 'Failed to revoke role', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Bulk assign roles
 */
export async function bulkAssignRoles(req, res) {
  try {
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return sendError(req, res, 'assignments array is required', 400, 'VALIDATION_ERROR');
    }

    const results = await rbacRepository.bulkAssignRoles(assignments, req.adminSession.username);

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'BULK_ROLE_ASSIGNED',
      newValue: { count: results.length, assignments },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { results });
  } catch (error) {
    console.error('[RBAC] Failed to bulk assign roles:', error);
    return sendError(req, res, 'Failed to bulk assign roles', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(req, res) {
  try {
    const { adminId, action, startDate, endDate, limit, offset } = req.query;

    const logs = await rbacRepository.getAuditLogs({
      adminId,
      action,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    return sendSuccess(res, { logs });
  } catch (error) {
    console.error('[RBAC] Failed to get audit logs:', error);
    return sendError(req, res, 'Failed to retrieve audit logs', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Get permission matrix (roles vs permissions)
 */
export async function getPermissionMatrix(req, res) {
  try {
    const allPermissions = Object.keys(PERMISSIONS);
    const matrix = {};

    // Add default roles
    for (const [roleName, roleConfig] of Object.entries(DEFAULT_ROLES)) {
      matrix[roleName] = {
        name: roleConfig.name,
        permissions: allPermissions.map((p) => ({
          permission: p,
          granted: roleConfig.permissions.includes(p),
        })),
      };
    }

    // Add custom roles
    const customRoles = await rbacRepository.getAllRoles();
    for (const role of customRoles) {
      matrix[role.name] = {
        name: role.name,
        permissions: allPermissions.map((p) => ({
          permission: p,
          granted: role.permissions.includes(p),
        })),
      };
    }

    return sendSuccess(res, { matrix });
  } catch (error) {
    console.error('[RBAC] Failed to get permission matrix:', error);
    return sendError(req, res, 'Failed to retrieve permission matrix', 500, 'INTERNAL_ERROR');
  }
}
