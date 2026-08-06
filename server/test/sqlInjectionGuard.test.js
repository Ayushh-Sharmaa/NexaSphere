import assert from 'node:assert/strict';
import test from 'node:test';
import { sqlInjectionGuard } from '../middleware/sqlInjectionGuard.js';

function runGuard(body) {
  const req = { query: {}, body, params: {} };
  let statusCode = null;
  let jsonPayload = null;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return this;
    },
  };
  const next = () => {
    nextCalled = true;
  };
  sqlInjectionGuard(req, res, next);
  return { statusCode, jsonPayload, nextCalled };
}

test('sqlInjectionGuard allows legitimate free-text content', async (t) => {
  const legitimateInputs = [
    "I'd love to select from the workshop tracks",
    'We will create a table tennis tournament this year',
    'Please update the event details into the new format',
    'Drop into our open house anytime!',
    'insert your team name into the field below',
    'The theme color is 0xFF5733 for our banner',
  ];

  for (const input of legitimateInputs) {
    await t.test(`allows: ${input}`, () => {
      const { nextCalled, statusCode } = runGuard({ description: input });
      assert.equal(nextCalled, true, 'next() should be called for legitimate input');
      assert.equal(statusCode, null, 'no error status should be set');
    });
  }
});

test('sqlInjectionGuard allows boolean words inside quoted SQL string literals', async (t) => {
  const quotedLiteralInputs = [
    "status = 'draft OR published'",
    "department = 'research AND development'",
    "title = 'AI OR 1=1 workshop'",
  ];

  for (const input of quotedLiteralInputs) {
    await t.test(`allows quoted literal: ${input}`, () => {
      const { nextCalled, statusCode } = runGuard({ filter: input });
      assert.equal(
        nextCalled,
        true,
        'next() should be called when boolean words are inside quoted literals'
      );
      assert.equal(statusCode, null, 'no error status should be set');
    });
  }
});

test('sqlInjectionGuard still blocks real injection payloads', async (t) => {
  const maliciousInputs = [
    '1 OR 1=1',
    "status = 'draft' OR 1=1",
    "'; DROP TABLE users; --",
    "SELECT * FROM users WHERE 1=1; WAITFOR DELAY '0:0:5'",
    'UNION SELECT * FROM INFORMATION_SCHEMA.TABLES',
  ];

  for (const input of maliciousInputs) {
    await t.test(`blocks: ${input}`, () => {
      const { nextCalled, statusCode } = runGuard({ field: input });
      assert.equal(nextCalled, false, 'next() should not be called for malicious input');
      assert.equal(statusCode, 400, 'should respond with 400');
    });
  }
});
