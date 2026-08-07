import { z } from 'zod';

/** Shared userId field: can be string or number */
const userIdField = z.union([
  z.string().trim().min(1, 'userId is required'),
  z.number().int().positive(),
]);

/**
 * Schema for POST /api/admin/rbac/roles — Create a new custom role.
 */
export const createRoleSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required'),
    description: z.string().trim().optional(),
    permissions: z.array(z.string().trim().min(1)).min(1, 'permissions array is required'),
    hierarchy: z.number().int().positive().optional(),
  })
  .strict();

/**
 * Schema for PUT /api/admin/rbac/roles/:name — Update a custom role.
 */
export const updateRoleSchema = z
  .object({
    description: z.string().trim().optional(),
    permissions: z.array(z.string().trim().min(1)).optional(),
    hierarchy: z.number().int().positive().optional(),
  })
  .strict();

/**
 * Schema for POST /api/admin/rbac/assign — Assign a role to a user.
 */
export const assignRoleSchema = z
  .object({
    userId: userIdField,
    roleName: z.string().trim().min(1, 'roleName is required'),
    expiresAt: z.string().trim().optional(),
  })
  .strict();

/**
 * Schema for POST /api/admin/rbac/bulk-assign — Bulk assign roles.
 */
export const bulkAssignRolesSchema = z
  .object({
    assignments: z
      .array(
        z.object({
          userId: userIdField,
          roleName: z.string().trim().min(1, 'roleName is required'),
          expiresAt: z.string().trim().optional(),
        })
      )
      .min(1, 'assignments array is required'),
  })
  .strict();
