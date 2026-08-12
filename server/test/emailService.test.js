import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

// Exercise the real SMTP path (not the dev-mode simulation branch) via a
// mocked nodemailer transporter instead of a live SMTP connection.
process.env.SMTP_HOST = 'smtp.test.local';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASS = 'test-pass';

const sendMailCalls = [];

mock.module('nodemailer', {
  defaultExport: {
    createTransport: () => ({
      sendMail: async (mailOptions) => {
        sendMailCalls.push(mailOptions);
        return { messageId: 'mock-message-id' };
      },
    }),
  },
});

const { sendEmail } = await import('../services/emailService.js');

test('sendEmail resolves { success: true } and forwards attachments to the transporter', async () => {
  sendMailCalls.length = 0;

  const attachments = [{ filename: 'invoice.pdf', content: 'dummy-content' }];

  const result = await sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to NexaSphere',
    templateName: 'welcome',
    data: { name: 'Test User', verifyUrl: 'https://example.com/verify' },
    attachments,
  });

  assert.equal(result.success, true);
  assert.equal(sendMailCalls.length, 1);
  assert.deepEqual(sendMailCalls[0].attachments, attachments);
});

test('sendEmail defaults attachments to an empty array and does not throw when omitted', async () => {
  sendMailCalls.length = 0;

  const result = await sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to NexaSphere',
    templateName: 'welcome',
    data: { name: 'Test User', verifyUrl: 'https://example.com/verify' },
  });

  assert.equal(result.success, true);
  assert.equal(sendMailCalls.length, 1);
  assert.deepEqual(sendMailCalls[0].attachments, []);
});
