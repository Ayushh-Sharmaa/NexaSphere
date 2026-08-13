import { PrismaClient } from "@prisma/client";
import { DEFAULT_ROLES } from "../config/rbac.js";

const prisma = new PrismaClient();

async function query(sql, params = []) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return { rows };
}
const CUSTOM_ROLES_TABLE = "custom_roles";
const USER_ROLES_TABLE = "user_roles";
const AUDIT_LOGS_TABLE = "audit_logs";

/**
 * Initialize RBAC tables
 */
export async function initializeRBACTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ${CUSTOM_ROLES_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB NOT NULL DEFAULT '[]',
        is_system BOOLEAN DEFAULT FALSE,
        hierarchy INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${USER_ROLES_TABLE} (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        role_name VARCHAR(100) NOT NULL,
        assigned_by VARCHAR(100),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        UNIQUE(user_id, role_name)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${AUDIT_LOGS_TABLE} (
        id SERIAL PRIMARY KEY,
        admin_id VARCHAR(100) NOT NULL,
        action VARCHAR(255) NOT NULL,
        target_user_id INT,
        old_value JSONB,
        new_value JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("[RBAC] Tables initialized successfully");
  } catch (error) {
    console.error("[RBAC] Failed to initialize tables:", error);
    throw error;
  }
}

/**
 * Get all custom roles
 */
export async function getAllRoles() {
  try {
    const result = await query(
      `SELECT * FROM ${CUSTOM_ROLES_TABLE} ORDER BY hierarchy ASC`
    );
    return result.rows;
  } catch (error) {
    console.error("[RBAC] Failed to get roles:", error);
    throw error;
  }
}

/**
 * Get role by name
 */
export async function getRoleByName(name) {
  try {
    const result = await query(
      `SELECT * FROM ${CUSTOM_ROLES_TABLE} WHERE name = $1`,
      [name]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("[RBAC] Failed to get role:", error);
    throw error;
  }
}

/**
 * Create a new custom role
 */
export async function createRole({
  name,
  description,
  permissions,
  hierarchy = 10,
}) {
  try {
    const result = await query(
      `INSERT INTO ${CUSTOM_ROLES_TABLE} (name, description, permissions, hierarchy)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, JSON.stringify(permissions), hierarchy]
    );
    return result.rows[0];
  } catch (error) {
    console.error("[RBAC] Failed to create role:", error);
    throw error;
  }
}

/**
 * Update a custom role
 */
export async function updateRole(
  name,
  { description, permissions, hierarchy }
) {
  try {
    const result = await query(
      `UPDATE ${CUSTOM_ROLES_TABLE}
       SET description = COALESCE($1, description),
           permissions = COALESCE($2, permissions),
           hierarchy = COALESCE($3, hierarchy),
           updated_at = CURRENT_TIMESTAMP
       WHERE name = $4 AND is_system = FALSE
       RETURNING *`,
      [
        description,
        permissions ? JSON.stringify(permissions) : null,
        hierarchy,
        name,
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("[RBAC] Failed to update role:", error);
    throw error;
  }
}

/**
 * Delete a custom role
 */
export async function deleteRole(name) {
  try {
    const result = await query(
      `DELETE FROM ${CUSTOM_ROLES_TABLE} WHERE name = $1 AND is_system = FALSE RETURNING *`,
      [name]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("[RBAC] Failed to delete role:", error);
    throw error;
  }
}

/**
 * Assign role to user
 */
export async function assignRole(
  userId,
  roleName,
  assignedBy,
  expiresAt = null
) {
  try {
    const result = await query(
      `INSERT INTO ${USER_ROLES_TABLE} (user_id, role_name, assigned_by, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, role_name) DO UPDATE
       SET assigned_by = $3, assigned_at = CURRENT_TIMESTAMP, expires_at = $4
       RETURNING *`,
      [userId, roleName, assignedBy, expiresAt]
    );
    return result.rows[0];
  } catch (error) {
    console.error("[RBAC] Failed to assign role:", error);
    throw error;
  }
}

/**
 * Revoke role from user
 */
export async function revokeRole(userId, roleName) {
  try {
    const result = await query(
      `DELETE FROM ${USER_ROLES_TABLE} WHERE user_id = $1 AND role_name = $2 RETURNING *`,
      [userId, roleName]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("[RBAC] Failed to revoke role:", error);
    throw error;
  }
}

/**
 * Get user roles
 */
export async function getUserRoles(userId) {
  try {
    const result = await query(
      `SELECT * FROM ${USER_ROLES_TABLE} WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error("[RBAC] Failed to get user roles:", error);
    throw error;
  }
}

/**
 * Get all users with their roles
 */
export async function getAllUsersWithRoles() {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.display_name,
             COALESCE(json_agg(ur.role_name) FILTER (WHERE ur.role_name IS NOT NULL), '[]') as roles
      FROM users u
      LEFT JOIN ${USER_ROLES_TABLE} ur ON u.id = ur.user_id
      GROUP BY u.id
      ORDER BY u.username
    `);
    return result.rows;
  } catch (error) {
    console.error("[RBAC] Failed to get users with roles:", error);
    throw error;
  }
}

/**
 * Log audit event
 */
export async function logAuditEvent({
  adminId,
  action,
  targetUserId,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
}) {
  try {
    const result = await query(
      `INSERT INTO ${AUDIT_LOGS_TABLE} (admin_id, action, target_user_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        adminId,
        action,
        targetUserId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("[RBAC] Failed to log audit event:", error);
    throw error;
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs({
  adminId,
  action,
  startDate,
  endDate,
  limit = 100,
  offset = 0,
}) {
  try {
    let queryStr = `SELECT * FROM ${AUDIT_LOGS_TABLE} WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (adminId) {
      queryStr += ` AND admin_id = $${paramIndex++}`;
      params.push(adminId);
    }
    if (action) {
      queryStr += ` AND action = $${paramIndex++}`;
      params.push(action);
    }
    if (startDate) {
      queryStr += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      queryStr += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);
    return result.rows;
  } catch (error) {
    console.error("[RBAC] Failed to get audit logs:", error);
    throw error;
  }
}

/**
 * Bulk assign roles to users
 */
export async function bulkAssignRoles(assignments, assignedBy) {
  const results = [];
  for (const { userId, roleName } of assignments) {
    const assignment = await assignRole(userId, roleName, assignedBy);
    results.push(assignment);
  }
  return results;
}
