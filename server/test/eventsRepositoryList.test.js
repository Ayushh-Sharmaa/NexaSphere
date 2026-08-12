import assert from 'node:assert/strict';
import test, { after } from 'node:test';

import { eventsRepository } from '../repositories/eventsRepository.js';
import { setWithDbOverride } from '../repositories/db.js';

after(() => {
  setWithDbOverride(null);
});

function makeRow(overrides = {}) {
  return {
    id: 'evt-1',
    name: 'Test Event',
    short_name: 'TE',
    date_text: '2026-09-01',
    description: 'A test event',
    status: 'upcoming',
    icon: null,
    tags: [],
    restricted_groups: [],
    created_at: new Date(),
    updated_at: new Date(),
    total: 1,
    ...overrides,
  };
}

test('list() applies a WHERE clause built from the filters (no unfiltered query)', async () => {
  let capturedSql = null;
  let capturedParams = null;

  setWithDbOverride(async (fn) => {
    const client = {
      query: async (sql, params) => {
        capturedSql = sql.replace(/\s+/g, ' ').trim();
        capturedParams = params;
        return { rows: [] };
      },
    };
    return fn(client);
  });

  await eventsRepository.list({ status: 'upcoming', category: 'tech', search: 'hack' });

  assert.ok(capturedSql.includes('where'), 'query must include a WHERE clause');
  assert.ok(capturedSql.includes('status = $'), 'status filter must be applied');
  assert.ok(capturedSql.includes('array_to_string(tags'), 'category filter must be applied');
  assert.ok(capturedSql.includes('LIKE LOWER'), 'search filter must be applied');
  assert.ok(capturedParams.includes('upcoming'), 'status param must be bound');
});

test('list() hides restricted events from callers with no studentGroups (public-only)', async () => {
  const restrictedRow = makeRow({
    id: 'evt-restricted',
    restricted_groups: ['group-a'],
  });
  const publicRow = makeRow({ id: 'evt-public', restricted_groups: [] });

  setWithDbOverride(async (fn) => {
    const client = {
      query: async (sql) => {
        // Simulate the DB honoring the WHERE clause: only return rows whose
        // restricted_groups is empty when no studentGroups were supplied.
        if (sql.includes('restricted_groups')) {
          return { rows: [publicRow] };
        }
        return { rows: [] };
      },
    };
    return fn(client);
  });

  const { rows } = await eventsRepository.list({}); // no studentGroups -> public only

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'evt-public');
  assert.ok(
    !rows.some((r) => r.id === 'evt-restricted'),
    'restricted event must not be visible to an unauthenticated/public caller'
  );
});

test('list() includes restricted events only for callers whose studentGroups overlap', async () => {
  let capturedSql = null;
  let capturedParams = null;

  setWithDbOverride(async (fn) => {
    const client = {
      query: async (sql, params) => {
        capturedSql = sql.replace(/\s+/g, ' ').trim();
        capturedParams = params;
        return { rows: [] };
      },
    };
    return fn(client);
  });

  await eventsRepository.list({ studentGroups: ['group-a', 'group-b'] });

  assert.ok(
    capturedSql.includes('jsonb_array_elements_text(restricted_groups)'),
    'group-overlap condition must be present when studentGroups is provided'
  );
  assert.ok(
    capturedParams.some((p) => Array.isArray(p) && p.includes('group-a')),
    'studentGroups must be passed as a bound parameter, not interpolated into the SQL string'
  );
  assert.ok(
    !capturedSql.includes(`'group-a'`),
    'studentGroups must never be string-interpolated directly into the query'
  );
});

test('list() total reflects the filtered count, not the full table', async () => {
  setWithDbOverride(async (fn) => {
    const client = {
      query: async (sql) => {
        // Only one row matches the filter; count(*) over() reflects that.
        return { rows: [makeRow({ total: 1 })] };
      },
    };
    return fn(client);
  });

  const { total, rows } = await eventsRepository.list({ status: 'upcoming' });

  assert.equal(total, 1);
  assert.equal(rows.length, 1);
});

test('list() does not issue a 4-argument client.query call (no stray SQL/params)', async () => {
  let callArgCount = null;

  setWithDbOverride(async (fn) => {
    const client = {
      query: async (...args) => {
        callArgCount = args.length;
        return { rows: [] };
      },
    };
    return fn(client);
  });

  await eventsRepository.list({});

  assert.ok(callArgCount <= 2, 'client.query should be called with (sql, params) only');
});
