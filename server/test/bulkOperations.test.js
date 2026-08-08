import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCSV, generateCSV } from '../utils/csvParser.js';
import { bulkOperationsService } from '../services/bulkOperationsService.js';
import { setWithDbOverride } from '../repositories/db.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';

// Clean up database overrides after tests
test.afterEach(() => {
  setWithDbOverride(null);
});

test('CSV Parser and Generator', () => {
  // Test basic parsing
  const csvText =
    'Name,Email,Role,Major,Year\n"John Doe",john@example.com,user,Computer Science,2026\n"Jane, Smith",jane@example.com,moderator,,2025';
  const records = parseCSV(csvText);

  assert.equal(records.length, 2);
  assert.equal(records[0].name, 'John Doe');
  assert.equal(records[0].email, 'john@example.com');
  assert.equal(records[0].role, 'user');
  assert.equal(records[0].major, 'Computer Science');
  assert.equal(records[0].year, '2026');

  assert.equal(records[1].name, 'Jane, Smith'); // Check comma handling in quotes
  assert.equal(records[1].email, 'jane@example.com');
  assert.equal(records[1].role, 'moderator');
  assert.equal(records[1].major, '');
  assert.equal(records[1].year, '2025');

  // Test CSV generation
  const generated = generateCSV(records, ['name', 'email', 'role']);
  assert.ok(generated.includes('name,email,role'));
  assert.ok(generated.includes('John Doe,john@example.com,user'));
  assert.ok(generated.includes('"Jane, Smith",jane@example.com,moderator'));
});

test('Bulk Operations Service: User Import Preview and Validation', () => {
  // Good rows & bad rows
  const csvText = `Name,Email,Role,Major,Year\nJohn Doe,john@example.com,user,CS,2026\nBad User,,moderator,,\nAnother Bad,invalid-email,user,,`;
  const { preview, errors } = bulkOperationsService.previewImportUsers(csvText);

  assert.equal(preview.length, 1);
  assert.equal(errors.length, 2);

  assert.equal(preview[0].display_name, 'John Doe');
  assert.equal(preview[0].email, 'john@example.com');

  assert.equal(errors[0].row, 3);
  assert.ok(errors[0].errors.includes('Email is required'));

  assert.equal(errors[1].row, 4);
  assert.ok(errors[1].errors.includes('Invalid email format'));
});

test('Bulk Operations Service: Event Import Preview and Validation', () => {
  // The second row starts with a comma to leave the Title empty
  const csvText = `Title,Date,Description,Location,Capacity\n"React Workshop",2026-07-01,"Learn React",Lab 1,50\n,,Empty Description,Lab 2,-10`;
  const { preview, errors } = bulkOperationsService.previewImportEvents(csvText);

  assert.equal(preview.length, 1);
  assert.equal(errors.length, 1);

  assert.equal(preview[0].name, 'React Workshop');
  assert.equal(preview[0].capacity, 50);

  assert.equal(errors[0].row, 3);
  assert.ok(errors[0].errors.includes('Event title/name is required'));
  assert.ok(errors[0].errors.includes('Event date is required'));
  assert.ok(errors[0].errors.includes('Capacity must be a positive number'));
});

test('Bulk User Import: Database Insertion and Audit Log', async () => {
  const csvText = 'Name,Email,Role,Major,Year\nBob Jones,bob@example.com,user,Math,2027';

  let userQueryCount = 0;
  let auditLogInserted = false;

  setWithDbOverride(async (fn) => {
    const mockClient = {
      query: async (sql, params) => {
        const sqlLower = sql.toLowerCase();
        if (sqlLower.includes('select * from users')) {
          userQueryCount++;
          return { rows: [] }; // Simulate user not found
        }
        if (sqlLower.includes('insert into users')) {
          return { rows: [{ id: 'user-mock-123', email: 'bob@example.com', username: 'bob' }] };
        }
        if (sqlLower.includes('insert into audit_logs')) {
          auditLogInserted = true;
          return { rows: [] };
        }
        return { rows: [] };
      },
      release: () => {},
    };
    return await fn(mockClient);
  });

  const job = await bulkOperationsService.importUsers(csvText, 'test-admin');
  assert.equal(job.type, 'import_users');

  // Poll for completion to avoid race conditions
  let completedJob = bulkOperationsService.getJob(job.id);
  let attempts = 0;
  while (completedJob.status !== 'completed' && attempts < 20) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    completedJob = bulkOperationsService.getJob(job.id);
    attempts++;
  }

  assert.equal(completedJob.status, 'completed');
  assert.equal(completedJob.processed, 1);
  assert.equal(completedJob.errors.length, 0);
  assert.equal(userQueryCount, 1);
  assert.ok(auditLogInserted);
});

test('Bulk Operations Service: Rollback operation within 24h', async () => {
  let queriesExecuted = [];

  setWithDbOverride(async (fn) => {
    const mockClient = {
      query: async (sql, params) => {
        queriesExecuted.push({ sql, params });
        const sqlLower = sql.toLowerCase();
        if (sqlLower.includes('select * from audit_logs')) {
          return {
            rows: [
              {
                id: 'log-123',
                timestamp: new Date().toISOString(), // 0 hours old
                action: 'BULK_USER_IMPORT',
                old_state: JSON.stringify({
                  operations: [
                    { type: 'insert', table: 'users', key: 'user-mock-123', data: null },
                    {
                      type: 'update',
                      table: 'users',
                      key: 'user-mock-456',
                      data: {
                        id: 'user-mock-456',
                        display_name: 'Original Name',
                        email: 'original@example.com',
                      },
                    },
                  ],
                }),
              },
            ],
          };
        }
        return { rows: [] };
      },
      release: () => {},
    };
    return await fn(mockClient);
  });

  const rollbackResult = await bulkOperationsService.rollback('log-123', 'test-admin');
  assert.equal(rollbackResult.successful, 2);

  // Reverts should delete the inserted row first, then update the updated row to its old state
  const deleteQuery = queriesExecuted.find((q) => q.sql.includes('DELETE FROM users'));
  assert.ok(deleteQuery);
  assert.equal(deleteQuery.params[0], 'user-mock-123');

  const updateQuery = queriesExecuted.find((q) => q.sql.includes('UPDATE users SET'));
  assert.ok(updateQuery);
  assert.equal(updateQuery.params[updateQuery.params.length - 1], 'user-mock-456'); // Key is last param
});

test('Bulk Operations Service: Rollback fails after 24h', async () => {
  setWithDbOverride(async (fn) => {
    const mockClient = {
      query: async (sql, params) => {
        return {
          rows: [
            {
              id: 'log-old',
              timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours old
              action: 'BULK_USER_IMPORT',
              old_state: JSON.stringify({ operations: [] }),
            },
          ],
        };
      },
      release: () => {},
    };
    return await fn(mockClient);
  });

  await assert.rejects(
    async () => bulkOperationsService.rollback('log-old', 'test-admin'),
    /only allowed within 24 hours/
  );
});
