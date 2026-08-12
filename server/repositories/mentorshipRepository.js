import { withDb } from './db.js';

function mapMentorRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    domains: typeof row.domains === 'string' ? JSON.parse(row.domains) : row.domains,
    bio: row.bio,
    experience: row.experience,
    availability: row.availability,
    isAvailable: row.is_available,
    menteeCount: row.mentee_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMentorshipRow(row) {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    mentorName: row.mentor_name,
    mentorDomains: row.mentor_domains
      ? typeof row.mentor_domains === 'string'
        ? JSON.parse(row.mentor_domains)
        : row.mentor_domains
      : [],
    mentorDomains: row.mentor_domains ? (typeof row.mentor_domains === 'string' ? JSON.parse(row.mentor_domains) : row.mentor_domains) : [],
    menteeName: row.mentee_name,
    menteeEmail: row.mentee_email,
    menteeDomain: row.mentee_domain,
    menteeGoals: row.mentee_goals,
    status: row.status,
    message: row.message,
    sessionCount: row.session_count || 0,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSessionRow(row) {
  return {
    id: row.id,
    mentorshipId: row.mentorship_id,
    title: row.title,
    notes: row.notes,
    durationMinutes: row.duration_minutes,
    sessionDate: row.session_date,
    createdAt: row.created_at,
  };
}

function mapBuddyRow(row) {
  return {
    id: row.id,
    buddy1Name: row.buddy1_name,
    buddy1Email: row.buddy1_email,
    buddy2Name: row.buddy2_name,
    buddy2Email: row.buddy2_email,
    domain: row.domain,
    pairedAt: row.paired_at,
    isActive: row.is_active,
  };
}

export const mentorshipRepository = {
  async listMentors({ page = 1, limit = 20, domain, q } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const conditions = ['m.is_available = true'];
      const params = [];
      let paramIdx = 1;

      if (domain) {
        conditions.push(`m.domains @> $${paramIdx}::jsonb`);
        params.push(JSON.stringify([domain]));
        paramIdx++;
      }
      if (q && q.trim().length >= 2) {
        conditions.push(
          `(m.name ilike $${paramIdx} or m.bio ilike $${paramIdx} or m.domains::text ilike $${paramIdx})`
        );
        conditions.push(`(m.name ilike $${paramIdx} or m.bio ilike $${paramIdx} or m.domains::text ilike $${paramIdx})`);
        params.push(`%${q.trim()}%`);
        paramIdx++;
      }

      const where = conditions.join(' AND ');
      const offset = (page - 1) * limit;

      const listSql = `select m.*, count(mp.id)::int as mentee_count
        from mentors m
        left join mentorships mp on mp.mentor_id = m.id and mp.status = 'active'
        where ${where}
        group by m.id
        order by m.created_at desc
        limit $${paramIdx} offset $${paramIdx + 1}`;

      const countSql = `select count(*)::int as total
        from mentors m where ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapMentorRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async getMentorById(id) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select m.*, count(mp.id)::int as mentee_count
         from mentors m
         left join mentorships mp on mp.mentor_id = m.id and mp.status = 'active'
         where m.id = $1
         group by m.id`,
        [id]
      );
      return rows.length ? mapMentorRow(rows[0]) : null;
    });
  },

  async getMentorByEmail(email) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('select * from mentors where email = $1', [email]);
      return rows.length ? mapMentorRow(rows[0]) : null;
    });
  },

  async registerMentor(input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const existing = await client.query('select id from mentors where email = $1', [input.email]);
      if (existing.rows.length > 0) {
        const error = new Error('Email already registered');
        error.status = 409;
        throw error;
      }
      const { rows } = await client.query(
        `insert into mentors (name, email, domains, bio, experience, availability) values ($1, $2, $3, $4, $5, $6) returning *`,
        [input.name, input.email, JSON.stringify(input.domains), input.bio || '', input.experience || '', input.availability || '']
      );
      return rows.length ? mapMentorRow(rows[0]) : null;
    });
  },

  async updateMentor(id, input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const sets = [];
      const params = [];
      let paramIdx = 1;

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          const column = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          if (key === 'domains') {
            sets.push(`${column} = $${paramIdx++}`);
            params.push(JSON.stringify(value));
          } else {
            sets.push(`${column} = $${paramIdx++}`);
            params.push(value);
          }
        }
      }
      if (sets.length === 0) return null;
      sets.push('updated_at = now()');

      params.push(id);
      const updateSql = `update mentors set ${sets.join(', ')} where id = $${paramIdx} returning *`;
      const { rows } = await client.query(updateSql, params);
      return rows.length ? mapMentorRow(rows[0]) : null;
    });
  },

  async requestMentorship(input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into mentorships (mentor_id, mentee_name, mentee_email, mentee_domain, mentee_goals, message) values ($1, $2, $3, $4, $5, $6) returning *`,
        [
          input.mentor_id,
          input.mentee_name,
          input.mentee_email,
          input.mentee_domain || '',
          input.mentee_goals || '',
          input.message || '',
        ]
        [input.mentor_id, input.mentee_name, input.mentee_email, input.mentee_domain || '', input.mentee_goals || '', input.message || '']
      );
      return rows.length ? mapMentorshipRow(rows[0]) : null;
    });
  },

  async listMentorships({ page = 1, limit = 20, status, email } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`m.status = $${paramIdx++}`);
        params.push(status);
      }
      if (email) {
        conditions.push(
          `(m.mentee_email = $${paramIdx} or $${paramIdx} = any(select email from mentors where id = m.mentor_id))`
        );
        conditions.push(`(m.mentee_email = $${paramIdx} or $${paramIdx} = any(select email from mentors where id = m.mentor_id))`);
        params.push(email);
        paramIdx++;
      }

      const where = conditions.length ? `where ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      const listSql = `select m.*, mt.name as mentor_name, mt.domains as mentor_domains,
        (select count(*)::int from mentorship_sessions ms where ms.mentorship_id = m.id) as session_count
        from mentorships m
        join mentors mt on mt.id = m.mentor_id
        ${where}
        order by m.created_at desc
        limit $${paramIdx} offset $${paramIdx + 1}`;

      const countSql = `select count(*)::int as total from mentorships m ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapMentorshipRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async getMentorshipById(id) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select m.*, mt.name as mentor_name, mt.domains as mentor_domains
         from mentorships m
         join mentors mt on mt.id = m.mentor_id
         where m.id = $1`,
        [id]
      );
      return rows.length ? mapMentorshipRow(rows[0]) : null;
    });
  },

  async updateMentorshipStatus(id, status) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const extraClause =
        status === 'active'
          ? ', started_at = now()'
          : status === 'rejected' || status === 'completed'
            ? ', ended_at = now()'
            : '';
      const updateSql = `update mentorships set status = $1, updated_at = now()${extraClause} where id = $2 returning *`;
      const { rows } = await client.query(updateSql, [status, id]);
      return rows.length ? mapMentorshipRow(rows[0]) : null;
    });
  },

  async logSession(mentorshipId, input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into mentorship_sessions (mentorship_id, title, notes, duration_minutes, session_date) values ($1, $2, $3, $4, $5) returning *`,
        [
          mentorshipId,
          input.title,
          input.notes || '',
          input.duration_minutes || null,
          input.session_date ? new Date(input.session_date) : new Date(),
        ]
        [mentorshipId, input.title, input.notes || '', input.duration_minutes || null, input.session_date ? new Date(input.session_date) : new Date()]
      );
      return rows.length ? mapSessionRow(rows[0]) : null;
    });
  },

  async listSessions(mentorshipId, { page = 1, limit = 50 } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const listSql = `select * from mentorship_sessions where mentorship_id = $1 order by session_date desc limit $2 offset $3`;
      const countSql = `select count(*)::int as total from mentorship_sessions where mentorship_id = $1`;

      const { rows } = await client.query(listSql, [mentorshipId, limit, offset]);
      const countResult = await client.query(countSql, [mentorshipId]);

      return { rows: rows.map(mapSessionRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async createBuddyPair(input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into buddy_pairs (buddy1_name, buddy1_email, buddy2_name, buddy2_email, domain) values ($1, $2, $3, $4, $5) returning *`,
        [
          input.buddy1_name,
          input.buddy1_email,
          input.buddy2_name,
          input.buddy2_email,
          input.domain || 'general',
        ]
        [input.buddy1_name, input.buddy1_email, input.buddy2_name, input.buddy2_email, input.domain || 'general']
      );
      return rows.length ? mapBuddyRow(rows[0]) : null;
    });
  },

  async listBuddyPairs({ page = 1, limit = 50, email } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (email) {
        conditions.push(`(buddy1_email = $${paramIdx} or buddy2_email = $${paramIdx})`);
        params.push(email);
        paramIdx++;
      }

      const where = conditions.length ? `where ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      const listSql = `select * from buddy_pairs ${where} order by paired_at desc limit $${paramIdx} offset $${paramIdx + 1}`;
      const countSql = `select count(*)::int as total from buddy_pairs ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapBuddyRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async adminListAll({ page = 1, limit = 50, status } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`m.status = $${paramIdx++}`);
        params.push(status);
      }

      const where = conditions.length ? `where ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      const listSql = `select m.*, mt.name as mentor_name, mt.email as mentor_email, mt.domains as mentor_domains
        from mentorships m
        join mentors mt on mt.id = m.mentor_id
        ${where}
        order by m.created_at desc
        limit $${paramIdx} offset $${paramIdx + 1}`;

      const countSql = `select count(*)::int as total from mentorships m ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapMentorshipRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async adminListMentors({ page = 1, limit = 50 } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const listSql = `select m.*, count(mp.id)::int as mentee_count
        from mentors m
        left join mentorships mp on mp.mentor_id = m.id and mp.status = 'active'
        group by m.id
        order by m.created_at desc
        limit $1 offset $2`;
      const countSql = 'select count(*)::int as total from mentors';

      const { rows } = await client.query(listSql, [limit, offset]);
      const countResult = await client.query(countSql);

      return { rows: rows.map(mapMentorRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },
  async countMentorshipsByEmail(email) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS count
       FROM mentorships
       WHERE mentee_email = $1`,
        [email]
      );

      return rows[0]?.count || 0;
      await writeData(data);
      return req;
    });
  },
};
