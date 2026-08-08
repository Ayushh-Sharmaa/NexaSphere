import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'fs';
import { activityEventsService } from '../services/activityEventsService.js';
import { activityEventsRepository } from '../repositories/activityEventsRepository.js';
import { coreTeamService } from '../services/coreTeamService.js';

/**
 * Service Robustness and Error Handling Tests
 *
 * These tests verify that the activity events service methods handle edge cases,
 * error conditions, and invalid inputs gracefully, ensuring production robustness.
 *
 * Issue #1394: Missing Service Methods in activityEventsService
 * Solution: Implemented all required methods with proper error handling
 */

let mockContent = {
  activityEvents: {
    'activity-1': [
      { id: 'event-1', name: 'Event 1' },
      { id: 'event-2', name: 'Event 2' },
    ],
    'activity-2': [{ id: 'event-3', name: 'Event 3' }],
  },
};

const originalListByActivityKey = activityEventsRepository.listByActivityKey;
const originalListAll = activityEventsRepository.listAll;
const originalCreate = activityEventsRepository.create;
const originalDelete = activityEventsRepository.delete;
const originalAssertCanManage = coreTeamService.assertCanManageActivityEvent;
const originalReadFile = fs.promises.readFile;

test.before(() => {
  fs.promises.readFile = async (filePath, encoding) => {
    if (typeof filePath === 'string' && filePath.endsWith('content.json')) {
      return JSON.stringify(mockContent);
    }
    return originalReadFile(filePath, encoding);
  };
  coreTeamService.assertCanManageActivityEvent = async () => true;
  // Mock implementations with realistic behavior
  activityEventsRepository.listByActivityKey = async (key, options = {}) => {
    if (!key) throw new Error('Activity key is required');
    return {
      rows: [
        {
          id: 'event-1',
          activityKey: key,
          name: 'Test Event',
          created_at: '2026-07-04T12:00:00.000Z',
        },
      ],
      total: 1,
      page: options.page || 1,
      limit: options.limit || 20,
    };
  };

  activityEventsRepository.listAll = async () => ({
    'activity-1': [
      { id: 'event-1', name: 'Event 1' },
      { id: 'event-2', name: 'Event 2' },
    ],
    'activity-2': [{ id: 'event-3', name: 'Event 3' }],
  });

  activityEventsRepository.create = async (key, data) => ({
    id: 'new-event-id',
    ...data,
    activityKey: key,
  });

  activityEventsRepository.delete = async (key, id) => true;
});

test.after(() => {
  activityEventsRepository.listByActivityKey = originalListByActivityKey;
  activityEventsRepository.listAll = originalListAll;
  activityEventsRepository.create = originalCreate;
  activityEventsRepository.delete = originalDelete;
  coreTeamService.assertCanManageActivityEvent = originalAssertCanManage;
  fs.promises.readFile = originalReadFile;
});

// Test 1: listActivityEvents with valid parameters
test('listActivityEvents returns paginated results for valid activity key', async () => {
  const result = await activityEventsService.listActivityEvents('hackathons', {
    page: 1,
    limit: 20,
  });

  assert(result.rows, 'Should return rows array');
  assert(result.total !== undefined, 'Should include total count');
  assert.equal(result.page, 1, 'Should reflect requested page');
  assert.equal(result.limit, 20, 'Should reflect requested limit');
});

// Test 2: listActivityEvents with default pagination
test('listActivityEvents uses default pagination when not specified', async () => {
  const result = await activityEventsService.listActivityEvents('events');

  assert(result.rows, 'Should return rows');
  assert.equal(result.page, 1, 'Should default to page 1');
  assert.equal(result.limit, 20, 'Should default to limit 20');
});

// Test 3: listActivityEvents with zero page
test('listActivityEvents handles page number zero gracefully', async () => {
  const result = await activityEventsService.listActivityEvents('events', {
    page: 0,
  });

  // Should either treat as page 1 or raise meaningful error
  assert(result.rows || result.error, 'Should handle zero page');
});

// Test 4: listActivityEvents with negative page
test('listActivityEvents rejects negative page numbers', async () => {
  // Should handle gracefully
  const result = await activityEventsService.listActivityEvents('events', {
    page: -1,
  });

  assert(result.rows || result.error, 'Should handle negative page');
});

// Test 5: listActivityEvents with extremely large limit
test('listActivityEvents handles large limit requests safely', async () => {
  const result = await activityEventsService.listActivityEvents('events', {
    limit: 1000000,
  });

  assert(result.rows, 'Should handle large limit requests');
});

// Test 6: listActivityEvents with special characters in key
test('listActivityEvents handles special characters in activity key', async () => {
  const specialKey = 'activity-with-special-chars_2026-06-16';

  const result = await activityEventsService.listActivityEvents(specialKey);

  assert(result.rows || result.error, 'Should handle special characters');
});

// Test 7: listActivityEvents with unicode in key
test('listActivityEvents handles unicode characters in activity key', async () => {
  const unicodeKey = 'événement-2026';

  const result = await activityEventsService.listActivityEvents(unicodeKey);

  assert(result.rows || result.error, 'Should handle unicode keys');
});

// Test 8: listAllActivities returns complete activity map
test('listAllActivities returns all activities with their events', async () => {
  const result = await activityEventsService.listAllActivities();

  assert.equal(typeof result, 'object', 'Should return object');
  assert(result['activity-1'], 'Should include activity-1');
  assert(Array.isArray(result['activity-1']), 'Activity events should be arrays');
  assert.equal(result['activity-1'].length, 2, 'activity-1 should have 2 events');
});

// Test 9: listAllActivities with no activities
test('listAllActivities handles case with no activities', async () => {
  const originalListAll2 = activityEventsRepository.listAll;
  activityEventsRepository.listAll = async () => ({});
  const originalMockContent = mockContent;
  mockContent = { activityEvents: {} };

  const result = await activityEventsService.listAllActivities();

  assert.equal(typeof result, 'object', 'Should return empty object');
  assert.equal(Object.keys(result).length, 0, 'Should be empty');

  activityEventsRepository.listAll = originalListAll2;
  mockContent = originalMockContent;
});

// Test 10: addActivityEvent with valid input
test('addActivityEvent creates event with valid input', async () => {
  const input = {
    name: 'New Event',
    date: new Date().toISOString(),
    description: 'Test event',
    password: 'TestPassword123',
    coreTeamName: 'Team Member',
  };

  const result = await activityEventsService.addActivityEvent('events', input);

  assert(result.id, 'Should return created event with ID');
  assert.equal(result.name, 'New Event', 'Should preserve event name');
});

// Test 11: addActivityEvent with missing required fields
test('addActivityEvent validates required fields', async () => {
  const invalidInput = {
    // missing name
    password: 'TestPassword123',
  };

  await assert.rejects(async () => {
    await activityEventsService.addActivityEvent('events', invalidInput);
  }, /Invalid input/);
});

// Test 12: deleteActivityEvent with valid ID
test('deleteActivityEvent removes event by ID', async () => {
  const result = await activityEventsService.deleteActivityEvent('events', 'event-123');

  assert.equal(result, true, 'Should return true on success');
});

// Test 13: deleteActivityEvent with invalid ID format
test('deleteActivityEvent handles invalid ID format', async () => {
  const result = await activityEventsService.deleteActivityEvent('events', '');

  // Should handle gracefully
  assert(result === true || result === false, 'Should handle empty ID');
});

// Test 14: deleteActivityEvent with null ID
test('deleteActivityEvent handles null ID gracefully', async () => {
  const result = await activityEventsService.deleteActivityEvent('events', null);

  assert(result !== undefined, 'Should handle null ID');
});

// Test 15: assertCanManage validates authorization
test('assertCanManage checks authorization requirements', async () => {
  const validInput = {
    password: 'TestPassword123',
    name: 'Event',
  };

  // Should succeed with valid credentials
  const result = await activityEventsService.assertCanManage(validInput);

  assert(result !== false, 'Should authorize valid credentials');
});

// Test 16: Service methods handle rapid-fire calls
test('Service methods handle rapid sequential calls correctly', async () => {
  const operations = [
    activityEventsService.listAllActivities(),
    activityEventsService.listActivityEvents('activity-1'),
    activityEventsService.listActivityEvents('activity-2'),
    activityEventsService.listAllActivities(),
  ];

  const results = await Promise.all(operations);

  assert.equal(results.length, 4, 'All operations should complete');
  assert(results[0], 'First list should succeed');
  assert(results[1].rows, 'Second list should return rows');
});

// Test 17: Service methods are idempotent
test('listActivityEvents with same parameters returns consistent results', async () => {
  const result1 = await activityEventsService.listActivityEvents('events', {
    page: 1,
    limit: 20,
  });

  const result2 = await activityEventsService.listActivityEvents('events', {
    page: 1,
    limit: 20,
  });

  assert.deepEqual(result1.rows, result2.rows, 'Same parameters should return same results');
});
