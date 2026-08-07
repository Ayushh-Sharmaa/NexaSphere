const nodemailer = require('nodemailer');
const User = require('../models/User');

const nodemailer = require('nodemailer');
const User = require('../models/User');

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendApprovalEmail = async (userId, role, feedback) => {
  const user = await User.findById(userId);
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: '🎉 Welcome to the NexaSphere Core Team!',
    html: `
      <h1>Welcome aboard, ${user.name}!</h1>
      <p>We're excited to inform you that your application to join the NexaSphere team as a <strong>${role}</strong> has been <strong>approved</strong>.</p>
      ${feedback ? `<p><strong>Admin Feedback:</strong> ${feedback}</p>` : ''}
    subject: '?? Welcome to the NexaSphere Core Team!',
    html: `
      <h1>Welcome aboard, ${escapeHtml(user.name)}!</h1>
      <p>We're excited to inform you that your application to join the NexaSphere team as a <strong>${escapeHtml(role)}</strong> has been <strong>approved</strong>.</p>
      ${feedback ? `<p><strong>Admin Feedback:</strong> ${escapeHtml(feedback)}</p>` : ''}
      <p>You now have access to the team dashboard and can start contributing!</p>
      <br>
      <p>Best regards,<br>NexaSphere Team</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

exports.sendRejectionEmail = async (userId, feedback) => {
  const user = await User.findById(userId);
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: '📋 Update on Your NexaSphere Team Application',
    html: `
      <h1>Thank you for your interest, ${user.name}!</h1>
      <p>We appreciate you taking the time to apply to join the NexaSphere team.</p>
      <p>After careful review, we've decided not to proceed with your application at this time.</p>
      ${feedback ? `<p><strong>Feedback from the admin team:</strong> ${feedback}</p>` : ''}
    subject: '?? Update on Your NexaSphere Team Application',
    html: `
      <h1>Thank you for your interest, ${escapeHtml(user.name)}!</h1>
      <p>We appreciate you taking the time to apply to join the NexaSphere team.</p>
      <p>After careful review, we've decided not to proceed with your application at this time.</p>
      ${feedback ? `<p><strong>Feedback from the admin team:</strong> ${escapeHtml(feedback)}</p>` : ''}
      <p>We encourage you to stay engaged with the community and reapply in the future.</p>
      <br>
      <p>Best regards,<br>NexaSphere Team</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};
