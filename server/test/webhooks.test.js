import { test, describe } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { webhookService, WEBHOOK_EVENTS } from '../services/webhookService.js';
import { webhookDeliveryService } from '../services/webhookDeliveryService.js';

describe('Webhook System Integration Tests', () => {
  const dummyUser = { id: 'usr_test_123' };

  test('WEBHOOK_EVENTS exports valid events list', () => {
    assert.ok(Array.isArray(WEBHOOK_EVENTS));
    assert.ok(WEBHOOK_EVENTS.includes('event.created'));
    assert.ok(WEBHOOK_EVENTS.includes('announcement.posted'));
  });

  test('generateSecret returns a valid webhook secret token format', () => {
    const secret = webhookService.generateSecret();
    assert.ok(typeof secret === 'string');
    assert.ok(secret.startsWith('whsec_'));
  });

  test('createWebhook validates HTTPS requirement', async () => {
    await assert.rejects(
      webhookService.createWebhook(
        {
          name: 'Insecure Webhook',
          url: 'http://example.com/webhook',
          events: ['event.created'],
        },
        dummyUser
      ),
      /Webhook URL must use HTTPS/
    );
  });

  test('createWebhook validates that at least one event type is selected', async () => {
    await assert.rejects(
      webhookService.createWebhook(
        {
          name: 'Empty Events Webhook',
          url: 'https://example.com/webhook',
          events: [],
        },
        dummyUser
      ),
      /At least one event type must be selected/
    );
  });

  test('createWebhook validates event types', async () => {
    await assert.rejects(
      webhookService.createWebhook(
        {
          name: 'Invalid Event Webhook',
          url: 'https://example.com/webhook',
          events: ['invalid.event.name'],
        },
        dummyUser
      ),
      /Invalid event types/
    );
  });

  test('verifySignature correctly matches HMAC-SHA256 signature', () => {
    const secret = 'super-secret-key';
    const payload = { event: 'test', data: { ok: true } };
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const isValid = webhookDeliveryService.verifySignature(secret, payload, signature);
    assert.strictEqual(isValid, true);
  });
});
