import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { CircuitBreaker, circuitBreakerRegistry } from '../utils/circuitBreaker.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    logger.warn(
      `[Email Service] Warning: Missing email environment variables in production: ${missingVars.join(', ')}`
    );
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const defaultFrom = process.env.EMAIL_FROM || '"NexaSphere Team" <noreply@nexasphere.com>';

async function _sendMail(mailOptions) {
  return transporter.sendMail(mailOptions);
}

const emailBreaker = circuitBreakerRegistry.register(
  'smtp',
  new CircuitBreaker(_sendMail, {
    name: 'smtp',
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 15000,
    maxCoolDownPeriod: 120000,
  })
);

async function renderTemplate(templateName, data) {
  if (typeof templateName !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(templateName)) {
    throw new Error('Invalid email template name');
  }

  try {
    const { emailTemplateRepository } = await import('../repositories/emailTemplateRepository.js');
    const dbTemplate = await emailTemplateRepository.getByName(templateName);
    if (dbTemplate && dbTemplate.body) {
      return ejs.render(dbTemplate.body, data);
    }
  } catch (err) {
    logger.warn(
      `[Email Service] Failed to load DB template ${templateName}, falling back to file`,
      err.message
    );
  }

  const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`);
  const templateStr = await fs.readFile(templatePath, 'utf-8');
  return ejs.render(templateStr, data);
}

export async function renderTemplateHtml(templateName, data, customTemplateContent = null) {
  return renderTemplate(templateName, data, customTemplateContent);
}

export async function sendEmail({
  to,
  subject,
  templateName,
  data,
  from = defaultFrom,
  customTemplateContent = null,
}) {
  try {
    const html = await renderTemplate(templateName, data, customTemplateContent);

    const mailOptions = {
      from,
      to,
      subject,
      html,
      attachments,
    };

    if (!isProduction && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
      logger.info(`[Email Service - DEV] Would send email to: ${to}`);
      logger.info(`[Email Service - DEV] Subject: ${subject}`);
      logger.info(`[Email Service - DEV] Template: ${templateName}`);
      if (attachments.length > 0) {
        logger.info(
          `[Email Service - DEV] Attachments: ${attachments.map((attachment) => attachment.filename || 'attachment').join(', ')}`
        );
      }
      return { success: true, simulated: true };
    }

    const info = await emailBreaker.execute(mailOptions);
    logger.info(`[Email Service] Message sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      logger.warn(`[Email Service] SMTP circuit breaker is OPEN, skipping email to ${to}`);
    } else {
      logger.error(`[Email Service] Error sending email:`, error);
    }
    return { success: false, error };
  }
}

export async function sendWelcomeVerificationEmail(to, name, verifyUrl) {
  return sendEmail({
    to,
    subject: 'Welcome to NexaSphere! Please verify your email',
    templateName: 'welcome',
    data: { name, verifyUrl },
  });
}

export async function sendPasswordResetEmail(to, name, resetUrl) {
  return sendEmail({
    to,
    subject: 'Reset your NexaSphere Password',
    templateName: 'reset-password',
    data: { name, resetUrl },
  });
}

export async function sendRSVPConfirmationEmail(to, name, eventDetails) {
  return sendEmail({
    to,
    subject: `RSVP Confirmed: ${eventDetails.eventName}`,
    templateName: 'rsvp-confirmation',
    data: { name, ...eventDetails },
  });
}

export async function sendAttendanceConfirmationEmail(to, data) {
  return sendEmail({
    to,
    subject: `Attendance Confirmed: ${data.eventName}`,
    templateName: 'attendance-confirmation',
    data: { name: data.name, ...data },
  });
}

export async function sendRegistrationConfirmationEmail(to, data) {
  return sendEmail({
    to,
    subject: `Registration Confirmed: ${data.eventName}`,
    templateName: 'registration-confirmation',
    data: { name: data.name, ...data },
  });
}

export async function sendWaitlistPromotionEmail(to, data) {
  return sendEmail({
    to,
    subject: `You've been promoted: ${data.eventName}`,
    templateName: 'waitlist-promotion',
    data: { name: data.name, ...data },
  });
}

export async function sendEventReminderEmail(to, data) {
  const timeText =
    data.timeUntilEvent && data.timeUntilEvent !== 'soon' ? `in ${data.timeUntilEvent}` : 'soon';
  return sendEmail({
    to,
    subject: `Reminder: ${data.eventName} is starting ${timeText}`,
    templateName: 'event-reminder',
    data: { name: data.name, ...data },
  });
}
/**
 * Send a Registration Confirmation Email
 */
export async function sendRegistrationConfirmationEmail(to, eventDetails) {
  return sendEmail({
    to,
    subject: `Registration Confirmed: ${eventDetails.eventName}`,
    templateName: 'rsvp-confirmation',
    data: { 
      name: eventDetails.name, 
      eventName: eventDetails.eventName,
      eventDate: eventDetails.eventDate,
      eventLocation: eventDetails.eventLocation || 'NexaSphere HQ',
      eventTime: eventDetails.eventTime,
      eventUrl: eventDetails.eventUrl
    },
  });
}

/**
 * Send a Waitlist Promotion Email
 */
export async function sendWaitlistPromotionEmail(to, eventDetails) {
  return sendEmail({
    to,
    subject: `🎉 Promoted from Waitlist: ${eventDetails.eventName}`,
    templateName: 'rsvp-confirmation',
    data: { 
      name: eventDetails.name, 
      eventName: eventDetails.eventName,
      eventDate: eventDetails.eventDate,
      eventLocation: 'Promoted - Access Granted',
      eventTime: eventDetails.eventTime,
      eventUrl: eventDetails.eventLink
    },
  });
}

/**
 * Send an Event Reminder Email
 */
export async function sendEventReminderEmail(to, eventDetails) {
  return sendEmail({
    to,
    subject: `⏰ Reminder: ${eventDetails.eventName} is coming up!`,
    templateName: 'rsvp-confirmation',
    data: { 
      name: eventDetails.name, 
      eventName: eventDetails.eventName,
      eventDate: eventDetails.eventDate,
      eventLocation: eventDetails.eventLocation || 'NexaSphere HQ',
      eventTime: eventDetails.eventTime,
      eventUrl: eventDetails.eventLink
    },
  });
}

/**
 * Send an Attendance Confirmation Email
 */
export async function sendAttendanceConfirmationEmail(to, eventDetails) {
  return sendEmail({
    to,
    subject: `Attendance Marked: ${eventDetails.eventName}`,
    templateName: 'rsvp-confirmation',
    data: { 
      name: eventDetails.name, 
      eventName: eventDetails.eventName,
      eventDate: eventDetails.eventDate,
      eventLocation: `Earned ${eventDetails.points || 0} Points`,
      eventTime: 'Completed',
      eventUrl: '/'
    },
  });
}

export function setSendEmailOverride(fn) {
  sendEmailOverride = fn;
}
