import { webhooksRepository } from '../repositories/webhooksRepository.js';
import { webhookDeliveryService } from './webhookDeliveryService.js';
import logger from '../utils/logger.js';

export const WEBHOOK_EVENTS = [
  'event.created',
  'event.updated',
  'event.cancelled',
  'user.registered',
  'user.attendance_marked',
  'certificate.issued',
  'user.joined',
  'announcement.posted',
];

export const webhookService = {
  async createWebhook(data, user) {
    if (!data.url || !data.url.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }
    if (!data.events || data.events.length === 0) {
      throw new Error('At least one event type must be selected');
    }
    const invalidEvents = data.events.filter((e) => !WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      throw new Error(`Invalid event types: ${invalidEvents.join(', ')}`);
    }
    const secret = data.secret || this.generateSecret();
    return webhooksRepository.create({
      name: data.name,
      url: data.url,
      secret,
      events: data.events,
      isActive: data.isActive !== false,
      createdBy: user?.username || 'unknown',
      createdBy: user.id,
    });
  },

  async getWebhookById(id) {
    const webhook = await webhooksRepository.getById(id);
    if (!webhook) throw new Error('Webhook not found');
    return webhook;
  },

  async listWebhooks() {
    return webhooksRepository.listAll();
  },

  async updateWebhook(id, patch, user) {
    const existing = await webhooksRepository.getById(id);
    if (!existing) throw new Error('Webhook not found');
    if (patch.url && !patch.url.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }
    if (patch.events) {
      const invalidEvents = patch.events.filter((e) => !WEBHOOK_EVENTS.includes(e));
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid event types: ${invalidEvents.join(', ')}`);
      }
    }
    return webhooksRepository.update(id, patch);
  },

  async deleteWebhook(id) {
    const existing = await webhooksRepository.getById(id);
    if (!existing) throw new Error('Webhook not found');
    return webhooksRepository.delete(id);
  },

  async testWebhook(id) {
    const webhook = await webhooksRepository.getById(id);
    if (!webhook) throw new Error('Webhook not found');
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
      },
    };
    return webhookDeliveryService.deliverPayload(webhook, 'webhook.test', testPayload);
  },

  async getWebhookDeliveries(webhookId, options) {
    const webhook = await webhooksRepository.getById(webhookId);
    if (!webhook) throw new Error('Webhook not found');
    return webhooksRepository.getDeliveriesByWebhookId(webhookId, options);
  },

  async replayDelivery(deliveryId) {
    return webhookDeliveryService.retryDelivery(deliveryId);
  },

  async getDeliveryStats(webhookId) {
    return webhooksRepository.getDeliveryStats(webhookId);
  },

  async triggerEvent(eventType, eventData) {
    try {
      const webhooks = await webhooksRepository.listActiveByEvent(eventType);
      if (webhooks.length === 0) return;

      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: eventData,
      };

      logger.info('Triggering webhook event', { eventType, webhookCount: webhooks.length });

      const deliveries = await Promise.allSettled(
        webhooks.map((webhook) =>
          webhookDeliveryService.deliverPayload(webhook, eventType, payload)
        )
      );

      const successful = deliveries.filter(
        (d) => d.status === 'fulfilled' && d.value.success
      ).length;
      const failed = deliveries.length - successful;

      logger.info('Webhook event deliveries completed', { eventType, successful, failed });

      return { total: webhooks.length, successful, failed };
    } catch (error) {
      logger.error('Error triggering webhook event', { eventType, error: error.message });
      return { total: 0, successful: 0, failed: 0, error: error.message };
    }
  },

  generateSecret() {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  },
};
