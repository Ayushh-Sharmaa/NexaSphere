/**
 * reportController.js
 * server/controllers/reportController.js
 *
 * Handles report generation, archiving, schedule config, and manual triggers.
 */

import { PrismaClient } from '@prisma/client';
import { createObjectCsvStringifier } from 'csv-writer';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVE_DIR = path.join(__dirname, '../../reports');

// ─── Email transport ──────────────────────────────────────────────────────────

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY,
    },
  });
}

async function sendReportEmail({ to, subject, text, attachmentPath, filename }) {
  const transport = getTransport();
  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@nexasphere.dev',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    attachments: attachmentPath ? [{ filename, path: attachmentPath }] : [],
  });
}

// ─── Report generators ────────────────────────────────────────────────────────

async function generateAttendanceReport(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const rsvps = await prisma.rSVP.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      event: { select: { title: true, startDate: true } },
      user: { select: { name: true, email: true } },
    },
  });

  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'eventTitle', title: 'Event' },
      { id: 'eventDate', title: 'Event Date' },
      { id: 'userName', title: 'Attendee Name' },
      { id: 'userEmail', title: 'Attendee Email' },
      { id: 'rsvpDate', title: 'RSVP Date' },
    ],
  });

  const records = rsvps.map((r) => ({
    eventTitle: r.event?.title ?? 'N/A',
    eventDate: r.event?.startDate?.toISOString().split('T')[0] ?? 'N/A',
    userName: r.user?.name ?? 'N/A',
    userEmail: r.user?.email ?? 'N/A',
    rsvpDate: r.createdAt.toISOString().split('T')[0],
  }));

  const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  const summary = `Daily Attendance Report — ${start.toDateString()}\nTotal RSVPs: ${records.length}`;
  return { csv, summary, count: records.length };
}

async function generateAnalyticsReport(weekStart = new Date()) {
  // Roll back to Monday
  const start = new Date(weekStart);
  start.setDate(start.getDate() - start.getDay() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const [newUsers, newEvents, totalRsvps, topEvents] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.event.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.rSVP.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.event.findMany({
      where: { startDate: { gte: start, lte: end } },
      orderBy: { rsvps: { _count: 'desc' } },
      take: 10,
      select: { title: true, startDate: true, _count: { select: { rsvps: true } } },
    }),
  ]);

  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'eventTitle', title: 'Event' },
      { id: 'eventDate', title: 'Date' },
      { id: 'rsvpCount', title: 'RSVPs' },
    ],
  });

  const records = topEvents.map((e) => ({
    eventTitle: e.title,
    eventDate: e.startDate?.toISOString().split('T')[0] ?? 'N/A',
    rsvpCount: e._count.rsvps,
  }));

  const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  const summary =
    `Weekly Analytics Report — ${start.toDateString()} to ${end.toDateString()}\n` +
    `New Users: ${newUsers} | New Events: ${newEvents} | Total RSVPs: ${totalRsvps}`;

  return { csv, summary, newUsers, newEvents, totalRsvps };
}

// ─── Core: generate, archive, email ──────────────────────────────────────────

export async function runReport(type) {
  const config = await prisma.reportScheduleConfig.findUnique({ where: { reportType: type } });
  const recipients = config?.recipients ?? [process.env.ADMIN_EMAIL ?? 'admin@nexasphere.dev'];
  const format = config?.format ?? 'csv';

  let csv, summary;
  if (type === 'daily_attendance') {
    ({ csv, summary } = await generateAttendanceReport());
  } else if (type === 'weekly_analytics') {
    ({ csv, summary } = await generateAnalyticsReport());
  } else {
    throw new Error(`Unknown report type: ${type}`);
  }

  // Archive to disk
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const filename = `${type}_${Date.now()}.${format}`;
  const filePath = path.join(ARCHIVE_DIR, filename);
  await fs.writeFile(filePath, csv, 'utf8');

  // Save to DB
  const archived = await prisma.archivedReport.create({
    data: {
      reportType: type,
      filename,
      filePath,
      summary,
      recipients: JSON.stringify(recipients),
      generatedAt: new Date(),
    },
  });

  // Email
  try {
    await sendReportEmail({
      to: recipients,
      subject: `NexaSphere Report: ${type.replace(/_/g, ' ')} — ${new Date().toDateString()}`,
      text: summary,
      attachmentPath: filePath,
      filename,
    });
  } catch (err) {
    console.error(`[reportController] Email failed for ${type}:`, err.message);
  }

  return archived;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

/**
 * POST /api/admin/reports/generate
 * Body: { type }
 * Manually trigger a report.
 */
export async function triggerReport(req, res) {
  const { type } = req.body;
  if (!['daily_attendance', 'weekly_analytics'].includes(type)) {
    return sendError(req, res, 'Invalid report type', 400, 'VALIDATION_ERROR');
  }
  try {
    const report = await runReport(type);
    return sendSuccess(res, { report });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * GET /api/admin/reports/archive?page=1&type=daily_attendance
 */
export async function getArchive(req, res) {
  const { page = 1, type } = req.query;
  const take = 20;
  const skip = (Number(page) - 1) * take;
  const where = type ? { reportType: type } : {};

  const [reports, total] = await Promise.all([
    prisma.archivedReport.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.archivedReport.count({ where }),
  ]);

  return sendSuccess(res, { reports, total, page: Number(page), pages: Math.ceil(total / take) });
}

/**
 * GET /api/admin/reports/archive/:id/download
 */
export async function downloadReport(req, res) {
  const report = await prisma.archivedReport.findUnique({ where: { id: req.params.id } });
  if (!report) return sendError(req, res, 'Report not found', 404, 'NOT_FOUND');

  try {
    await fs.access(report.filePath);
  } catch {
    return sendError(req, res, 'File not found on disk', 404, 'NOT_FOUND');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  res.setHeader('Content-Type', 'text/csv');
  return res.sendFile(report.filePath);
}

/**
 * GET /api/admin/reports/schedule
 */
export async function getScheduleConfigs(req, res) {
  const configs = await prisma.reportScheduleConfig.findMany();
  return sendSuccess(res, { configs });
}

/**
 * POST /api/admin/reports/schedule
 * Body: { reportType, cronExpression, recipients, format, enabled }
 */
export async function upsertScheduleConfig(req, res) {
  const { reportType, cronExpression, recipients, format = 'csv', enabled = true } = req.body;

  if (!reportType || !cronExpression) {
    return sendError(req, res, 'reportType and cronExpression required', 400, 'VALIDATION_ERROR');
  }

  const config = await prisma.reportScheduleConfig.upsert({
    where: { reportType },
    create: {
      reportType,
      cronExpression,
      recipients: JSON.stringify(recipients ?? []),
      format,
      enabled,
    },
    update: {
      cronExpression,
      recipients: JSON.stringify(recipients ?? []),
      format,
      enabled,
    },
  });

  // Reload scheduler with new config
  const { reloadJob } = await import('../jobs/reportScheduler.js');
  reloadJob(reportType, config);

  return sendSuccess(res, { config });
}
