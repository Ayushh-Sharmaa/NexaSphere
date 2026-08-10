import { withDb } from './db.js';

function mapGroupRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: Array.isArray(row.permissions) ? row.permissions : (row.permissions ?? []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    memberCount: row.member_count ? parseInt(row.member_count, 10) : 0,
  };
}

export const userGroupsRepository = {
  async listGroups() {
    return withDb(async (client) => {
      const { rows } = await client.query(`
        SELECT g.*, COUNT(m.student_id) as member_count
        FROM user_groups g
        LEFT JOIN user_group_members m ON g.id = m.group_id
        GROUP BY g.id
        ORDER BY g.name ASC
      `);
      return rows.map(mapGroupRow);
    });
  },

  async getGroupById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM user_groups WHERE id = $1', [id]);
      return mapGroupRow(rows[0]);
    });
  },

  async createGroup({ name, description, permissions }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO user_groups (name, description, permissions)
         VALUES ($1, $2, $3) RETURNING *`,
        [name, description, JSON.stringify(permissions || [])]
      );
      return mapGroupRow(rows[0]);
    });
  },

  async updateGroup(id, { name, description, permissions }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE user_groups SET
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           permissions = COALESCE($4, permissions),
           updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, name ?? null, description ?? null, permissions ? JSON.stringify(permissions) : null]
      );
      return mapGroupRow(rows[0]);
    });
  },

  async deleteGroup(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('DELETE FROM user_groups WHERE id = $1', [id]);
      return rowCount > 0;
    });
  },

  async getGroupMembers(groupId) {
    return withDb(async (client) => {
      const { rows } = await client.query(`
        SELECT s.id, s.email, s.full_name, m.joined_at
        FROM student_users s
        JOIN user_group_members m ON s.id = m.student_id
        WHERE m.group_id = $1
        ORDER BY s.full_name ASC
      `,
        [groupId]
      );
      `, [groupId]);
      return rows;
    });
  },

  async addMembersToGroup(groupId, studentIds) {
    if (!studentIds || studentIds.length === 0) return 0;
    return withDb(async (client) => {
      let count = 0;
      for (const studentId of studentIds) {
        const { rowCount } = await client.query(
      }
      return count;
    });
  },

  async removeMemberFromGroup(groupId, studentId) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        'DELETE FROM user_group_members WHERE group_id = $1 AND student_id = $2',
        [groupId, studentId]
      );
      return rowCount > 0;
    });
  },

  async getUserGroupIds(studentId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT group_id FROM user_group_members WHERE student_id = $1',
        [studentId]
      );
      return rows.map((r) => r.group_id);
    });
  },
      return rows.map(r => r.group_id);
    });
  }
};
