import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import {
  CircuitBreaker,
  circuitBreakerRegistry,
} from "../utils/circuitBreaker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const requiredEnvVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    console.warn(
      `[Email Service] Warning: Missing email environment variables in production: ${missingVars.join(", ")}`
    );
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const defaultFrom =
  process.env.EMAIL_FROM || '"NexaSphere Team" <noreply@nexasphere.com>';

async function _sendMail(mailOptions) {
  return transporter.sendMail(mailOptions);
}

const emailBreaker = circuitBreakerRegistry.register(
  "smtp",
  new CircuitBreaker(_sendMail, {
    name: "smtp",
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 15000,
    maxCoolDownPeriod: 120000,
  })
);

async function renderTemplate(templateName, data) {
  const templatePath = path.join(__dirname, "templates", `${templateName}.ejs`);
  const templateStr = await fs.readFile(templatePath, "utf-8");
  return ejs.render(templateStr, data);
}

export async function sendEmail({
  to,
  subject,
  templateName,
  data,
  from = defaultFrom,
}) {
  try {
    const html = await renderTemplate(templateName, data);

    const mailOptions = {
      from,
      to,
      subject,
      html,
    };

    if (!isProduction && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
      console.log(`[Email Service - DEV] Would send email to: ${to}`);
      console.log(`[Email Service - DEV] Subject: ${subject}`);
      console.log(`[Email Service - DEV] Template: ${templateName}`);
      return { success: true, simulated: true };
    }

    const info = await emailBreaker.execute(mailOptions);
    console.log(`[Email Service] Message sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    if (error.code === "CIRCUIT_OPEN") {
      console.warn(
        `[Email Service] SMTP circuit breaker is OPEN, skipping email to ${to}`
      );
    } else {
      console.error(`[Email Service] Error sending email:`, error);
    }
    return { success: false, error };
  }
}

export async function sendWelcomeVerificationEmail(to, name, verifyUrl) {
  return sendEmail({
    to,
    subject: "Welcome to NexaSphere! Please verify your email",
    templateName: "welcome",
    data: { name, verifyUrl },
  });
}

export async function sendPasswordResetEmail(to, name, resetUrl) {
  return sendEmail({
    to,
    subject: "Reset your NexaSphere Password",
    templateName: "reset-password",
    data: { name, resetUrl },
  });
}

export async function sendRSVPConfirmationEmail(to, name, eventDetails) {
  return sendEmail({
    to,
    subject: `RSVP Confirmed: ${eventDetails.eventName}`,
    templateName: "rsvp-confirmation",
    data: { name, ...eventDetails },
  });
}
