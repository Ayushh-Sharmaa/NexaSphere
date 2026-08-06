import assert from 'node:assert/strict';
import test from 'node:test';
import { setWithDbOverride } from '../repositories/db.js';

// Configure dummy environment variables before dynamic imports
process.env.DATABASE_URL = 'postgresql://localhost/dummy_test_db';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'mock_key';

// Track executed database queries
let executedQueries = [];

setWithDbOverride(async (fn) => {
  const mockClient = {
    query: async (sql, params) => {
      executedQueries.push({ sql: sql.trim().replace(/\s+/g, ' '), params });
      return { rows: [], rowCount: 0 };
    },
  };
  return fn(mockClient);
});

test.beforeEach(() => {
  executedQueries = [];
});

test('SQL Injection Prevention - Parameterization checks', async (t) => {
  const { studentUsersRepository } = await import('../repositories/studentUsersRepository.js');

  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT username, password_hash FROM users --",
    "admin' --",
  ];

  for (const payload of sqlInjectionPayloads) {
    await t.test(`findByEmail with payload: ${payload}`, async () => {
      await studentUsersRepository.findByEmail(payload);

      assert.equal(executedQueries.length, 1);
      const query = executedQueries[0];

      // Assert that the malicious payload is NOT directly inside the query string
      assert.ok(
        !query.sql.includes(payload),
        'Payload should not be concatenated into SQL query string'
      );
      // Assert that the payload is safely bound inside parameters
      assert.equal(
        query.params[0],
        payload,
        'Payload must be passed as parameterized query parameter'
      );
      assert.ok(!query.sql.includes(payload), 'Payload should not be concatenated into SQL query string');
      // Assert that the payload is safely bound inside parameters
      assert.equal(query.params[0], payload, 'Payload must be passed as parameterized query parameter');
    });
  }
});
