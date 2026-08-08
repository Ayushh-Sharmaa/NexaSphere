let twilio = null;
try {
  twilio = (await import('twilio')).default;
} catch (e) {
  // twilio not installed, fallback to mock
}

import twilio from 'twilio';
import { withDb } from '../repositories/db.js';
import logger from '../utils/logger.js';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

// Initialize client if credentials and package exist, otherwise mock
const client =
  twilio && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;
// Initialize client if credentials exist, otherwise mock
const client = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) 
  : null;

// Mock cost calculator (average cost per SMS segment)
const SMS_COST_USD = 0.0079;

export const smsService = {
  /**
   * Send an SMS notification
   * @param {string} userId - User ID to log against
   * @param {string} phoneNumber - Destination phone number
   * @param {string} message - Message body
   * @param {string} eventType - Type of event (reminder, postponed, last_call)
   */
  async sendSMS(userId, phoneNumber, message, eventType = 'reminder') {
    if (!phoneNumber) return false;

    let status = 'sent';
    let cost = 0;

    try {
      if (client) {
        const response = await client.messages.create({
          body: message,
          from: TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });

        // Twilio returns price in response if available, fallback to estimate
        cost = Math.abs(parseFloat(response.price || SMS_COST_USD));
        status = response.status === 'failed' ? 'failed' : 'sent';
      } else {
        // Mock sending for development/testing
        logger.info(`[SMS MOCK] To: ${phoneNumber} | Msg: ${message}`);
        cost = SMS_COST_USD;
        status = 'mock_sent';
      }

      // Track SMS analytics in DB
      await this.logSMS(userId, phoneNumber, message, eventType, cost, status);
      return status !== 'failed';
    } catch (e) {
      console.error('Failed to send SMS via Twilio:', e.message);
      await this.logSMS(userId, phoneNumber, message, eventType, 0, 'failed');
      return false;
    }
  },

  async logSMS(userId, phoneNumber, message, eventType, cost, status) {
    try {
      await withDb(async (dbClient) => {
        await dbClient.query(
          `INSERT INTO sms_logs (user_id, phone_number, message, event_type, cost, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, phoneNumber, message, eventType, cost, status]
        );
      });
    } catch (e) {
      console.error('Failed to log SMS analytics:', e.message);
    }
  },
  }
};
