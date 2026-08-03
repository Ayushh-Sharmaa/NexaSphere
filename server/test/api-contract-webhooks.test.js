/**
 * API Contract Tests — Webhook Service & Controller Contracts
 * Validates response shapes and business logic contracts for the webhook system.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { webhookService, WEBHOOK_EVENTS } from '../services/webhookService.js';

// ── Shared mock factory ─────────────────────────────────────────────────────

function makeMockRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };
  return res;
}

// ── Snapshot validation helpers ──────────────────────────────────────────────

/**
 * Validates a webhook object conforms to the expected public contract shape.
 * @param {object} webhook
 */
function assertWebhookShape(webhook) {
  assert.ok(
    typeof webhook.id === 'string' || typeof webhook.id === 'number',
    'id must be a string or number'
  );
  assert.ok(typeof webhook.name === 'string', 'name must be a string');
  assert.ok(typeof webhook.url === 'string', 'url must be a string');
  assert.ok(Array.isArray(webhook.events), 'events must be an array');
  assert.ok(typeof webhook.isActive === 'boolean', 'isActive must be a boolean');
  // Secret must NEVER be exposed in list responses
  assert.equal(webhook.secret, undefined, 'secret must not be in public shape');
}

/**
 * Validates a delivery object conforms to the expected contract shape.
 * @param {object} delivery
 */
function assertDeliveryShape(delivery) {
  assert.ok(
    ['success', 'failed', 'pending'].includes(delivery.status),
    `status must be success/failed/pending, got: ${delivery.status}`
  );
  assert.ok(typeof delivery.eventType === 'string', 'eventType must be a string');
  assert.ok(typeof delivery.attemptCount === 'number', 'attemptCount must be a number');
}

// ── Webhook Service contract ─────────────────────────────────────────────────

describe('Webhook Service Contract Tests', () => {
  const fakeUser = { id: 'usr_contract_test' };

  test('WEBHOOK_EVENTS array is non-empty and contains string values', () => {
    assert.ok(WEBHOOK_EVENTS.length > 0, 'WEBHOOK_EVENTS must not be empty');
    for (const event of WEBHOOK_EVENTS) {
      assert.ok(typeof event === 'string', `event "${event}" must be a string`);
      assert.ok(event.includes('.'), `event "${event}" should follow namespace.action format`);
    }
  });

  test('createWebhook rejects HTTP (non-HTTPS) URLs', async () => {
    await assert.rejects(
      () =>
        webhookService.createWebhook(
          { name: 'Test', url: 'http://insecure.com', events: ['event.created'] },
          fakeUser
        ),
      /HTTPS/
    );
  });

  test('createWebhook rejects missing events array', async () => {
    await assert.rejects(
      () =>
        webhookService.createWebhook(
          { name: 'Test', url: 'https://example.com', events: [] },
          fakeUser
        ),
      /event/i
    );
  });

  test('createWebhook rejects invalid event types', async () => {
    await assert.rejects(
      () =>
        webhookService.createWebhook(
          {
            name: 'Test',
            url: 'https://example.com',
            events: ['user.deleted', 'unknown.event'],
          },
          fakeUser
        ),
      /invalid event types/i
    );
  });

  test('generateSecret produces unique values on each call', () => {
    const s1 = webhookService.generateSecret();
    const s2 = webhookService.generateSecret();
    assert.notEqual(s1, s2, 'generateSecret must produce unique secrets');
  });

  test('generateSecret output starts with whsec_ and has sufficient entropy', () => {
    const secret = webhookService.generateSecret();
    assert.ok(secret.startsWith('whsec_'), `secret must start with 'whsec_', got: ${secret}`);
    // 32 random bytes = 64 hex chars
    assert.ok(secret.length >= 70, `secret too short (${secret.length} chars); expected >= 70`);
  });
});

// ── Snapshot validation against known WEBHOOK_EVENTS set ────────────────────

describe('Webhook API Snapshot Validation', () => {
  test('WEBHOOK_EVENTS snapshot matches expected domain events', () => {
    const expectedEvents = [
      'event.created',
      'event.updated',
      'event.cancelled',
      'user.registered',
      'user.attendance_marked',
      'certificate.issued',
      'user.joined',
      'announcement.posted',
    ];
    // Every expected event must be present
    for (const expected of expectedEvents) {
      assert.ok(WEBHOOK_EVENTS.includes(expected), `Missing expected event: ${expected}`);
    }
    // No undocumented events should be silently added
    for (const actual of WEBHOOK_EVENTS) {
      assert.ok(expectedEvents.includes(actual), `Unexpected event in WEBHOOK_EVENTS: ${actual}`);
    }
  });
});
