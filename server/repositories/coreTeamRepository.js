import { withDb } from './db.js';

function normalizePhone(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

export const coreTeamRepository = {
  async listMembers() {
    return withDb(async (client) => {
      const { rows } = await client.query('select id, name, email, phone, created_at from core_team_members order by created_at desc');
      return rows;
    });
  },

  async addMember(member) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into core_team_members (name, email, phone)
         values ($1,$2,$3)
         returning id, name, email, phone, created_at`,
        [member.name, member.email, normalizePhone(member.phone)]
      );
      return rows[0];
    });
  },

  async deleteMember(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('delete from core_team_members where id=$1', [id]);
      return rowCount > 0;
    });
  },

  async isMember({ name, email, phone }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select 1 from core_team_members
         where lower(name)=lower($1) and lower(email)=lower($2)
           and regexp_replace(phone, '\\D', '', 'g') = $3
         limit 1`,
        [name, email, phone]
      );
      return rows.length > 0;
    });
  },
};

