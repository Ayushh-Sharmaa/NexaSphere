import { withDb } from '../repositories/db.js';
import { usersRepository } from '../repositories/usersRepository.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { parseCSV, generateCSV } from '../utils/csvParser.js';
import { sendEmail } from './emailService.js';
import { bulkOperationsQueue as queueServiceQueue } from './queueService.js';
import { validateTableName } from '../utils/sqlSafety.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger.js';

let connection;
if (process.env.REDIS_URL) {
  connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

export const bulkOperationsQueueName = 'bulk-operations';

export const bulkOperationsQueue = connection
  ? new Queue(bulkOperationsQueueName, { connection })
  : null;

class BulkOperationsService {
  constructor() {
    this.jobs = new Map();
  }

  // ---------------------------------------------------------------------------
  // Job Management
  // ---------------------------------------------------------------------------
  createJob(type, total) {
    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      total,
      processed: 0,
      errors: [],
      result: null,
      createdAt: new Date(),
    };
    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  updateJobProgress(jobId, processed, errors = [], status = 'processing', result = null) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.processed = processed;
    job.status = status;
    job.progress = job.total > 0 ? Math.round((processed / job.total) * 100) : 100;
    if (errors.length > 0) {
      job.errors.push(...errors);
    }
    if (result) {
      job.result = result;
    }
    this.jobs.set(jobId, job);
  }

  // ---------------------------------------------------------------------------
  // User Operations
  // ---------------------------------------------------------------------------
  previewImportUsers(csvText) {
    const records = parseCSV(csvText);
    const preview = [];
    const errors = [];

    records.forEach((record, index) => {
      const rowNum = index + 2; // CSV 1-indexed plus header row
      const name = record.name || record.fullname || record.displayname || '';
      const email = record.email || '';
      const username = record.username || (email ? email.split('@')[0] : '');
      const role = record.role || 'user';
      const status = record.status || 'active';
      const major = record.major || '';
      const year = record.year || '';
      const tags = record.tags
        ? record.tags
            .split(';')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // Validations
      const rowErrors = [];
      if (!email) {
        rowErrors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push('Invalid email format');
      }
      if (!username) {
        rowErrors.push('Username or email is required');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, errors: rowErrors, data: record });
      } else {
        preview.push({
          row: rowNum,
          username,
          display_name: name,
          email,
          role,
          status,
          major,
          year,
          tags,
        });
      }
    });

    return { preview, errors };
  }

  async importUsers(csvText, adminId) {
    const { preview, errors } = this.previewImportUsers(csvText);
    const job = this.createJob('import_users', preview.length);

    if (bulkOperationsQueue) {
      await bulkOperationsQueue.add(
        'import_users',
        {
          jobId: job.id,
          csvText,
          adminId,
        },
        {
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      logger.info(`[bulkOperationsService] Queued import_users job ${job.id}`);
    } else {
      logger.warn(
        '[bulkOperationsService] Redis not configured, falling back to setTimeout processing'
      );
      // Fallback if Redis is not available
      setTimeout(() => this.processImportUsersJob(job.id, csvText, adminId), 0);
    }

    return job;
  }

  async processImportUsersJob(jobId, csvText, adminId) {
    const { preview, errors } = this.previewImportUsers(csvText);

    this.updateJobProgress(jobId, 0, [], 'processing');
    const oldState = [];
    const newState = [];
    let processed = 0;
    const jobErrors = [...errors.map((e) => `Row ${e.row}: ${e.errors.join(', ')}`)];

    for (const user of preview) {
      try {
        await withDb(async (client) => {
          // Check if user already exists
          const { rows } = await client.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [user.email, user.username]
          );

          if (rows.length > 0) {
            const existing = rows[0];
            oldState.push({ type: 'update', table: 'users', key: existing.id, data: existing });

            // Update existing user
            const updatedTags = JSON.stringify(user.tags);
            const { rows: updatedRows } = await client.query(
              `UPDATE users 
                 SET display_name = $1, username = $2, role = $3, admin_roles = $3, status = $4, major = $5, year = $6, tags = $7, updated_at = NOW()
                 WHERE id = $8 RETURNING *`,
                [
                  user.display_name || existing.display_name,
                  user.username,
                  user.role,
                  user.status,
                  user.major || null,
                  user.year || null,
                  updatedTags,
                  existing.id,
                ]
              );
              newState.push({
                type: 'update',
                table: 'users',
                key: existing.id,
                data: updatedRows[0],
              });
            } else {
              // Create new user with password
              const id = `user-${crypto.randomUUID()}`;
              const updatedTags = JSON.stringify(user.tags);
              const plainPassword = crypto.randomBytes(4).toString('hex'); // 8 char temp password
              const passwordHash = await bcrypt.hash(plainPassword, 10);
              
              const { rows: insertedRows } = await client.query(
                `INSERT INTO users (id, username, display_name, email, role, admin_roles, status, major, year, tags, password_hash, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
                [
                  id,
                  user.username,
                  user.display_name,
                  user.email,
                  user.role,
                  user.status,
                  user.major || null,
                  user.year || null,
                  updatedTags,
                  passwordHash,
                ]
              );
              
              // Email the user their temporary password
              emailsToSend.push({ email: user.email, displayName: user.display_name, plainPassword });
              
              oldState.push({ type: 'insert', table: 'users', key: id, data: null });
              newState.push({ type: 'insert', table: 'users', key: id, data: insertedRows[0] });
            }
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          jobErrors.push(`Database error - ${err.message}`);
        }
      });

      // Log to audit log
      if (oldState.length > 0 || newState.length > 0) {
        try {
          await auditLogRepository.insertAuditLog({
            adminId,
            action: 'BULK_USER_IMPORT',
            oldState: { operations: oldState },
            newState: { operations: newState },
          });
        } catch (auditErr) {
          logger.error('Failed to insert audit log for bulk operations', { err: auditErr.message });
        }
              [
                user.display_name || existing.display_name,
                user.username,
                user.role,
                user.status,
                user.major || null,
                user.year || null,
                updatedTags,
                existing.id,
              ]
            );
            newState.push({
              type: 'update',
              table: 'users',
              key: existing.id,
              data: updatedRows[0],
            });
          } else {
            // Create new user with password
            const id = `user-${crypto.randomUUID()}`;
            const updatedTags = JSON.stringify(user.tags);
            const plainPassword = crypto.randomBytes(4).toString('hex'); // 8 char temp password
            const passwordHash = await bcrypt.hash(plainPassword, 10);

              [
                user.display_name || existing.display_name,
                user.username,
                user.role,
                user.status,
                user.major || null,
                user.year || null,
                updatedTags,
                existing.id,
              ]
            );
            newState.push({
              type: 'update',
              table: 'users',
              key: existing.id,
              data: updatedRows[0],
            });
          } else {
            // Create new user with password
            const id = `user-${crypto.randomUUID()}`;
            const updatedTags = JSON.stringify(user.tags);
            const plainPassword = crypto.randomBytes(4).toString('hex'); // 8 char temp password
            const passwordHash = await bcrypt.hash(plainPassword, 10);

              [
                user.display_name || existing.display_name,
                user.username,
                user.role,
                user.status,
                user.major || null,
                user.year || null,
                updatedTags,
                existing.id,
              ]
            );
            newState.push({
              type: 'update',
              table: 'users',
              key: existing.id,
              data: updatedRows[0],
            });
          } else {
            // Create new user with password
            const id = `user-${crypto.randomUUID()}`;
            const updatedTags = JSON.stringify(user.tags);
            const plainPassword = crypto.randomBytes(4).toString('hex'); // 8 char temp password
            const passwordHash = await bcrypt.hash(plainPassword, 10);

            const { rows: insertedRows } = await client.query(
              `INSERT INTO users (id, username, display_name, email, role, admin_roles, status, major, year, tags, password_hash, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
              [
                id,
                user.username,
                user.display_name,
                user.email,
                user.role,
                user.status,
                user.major || null,
                user.year || null,
                updatedTags,
                passwordHash,
              ]
            );

            // Email the user their temporary password
            try {
              await sendEmail({
                to: user.email,
                subject: 'Welcome to NexaSphere!',
                templateName: 'generic',
                data: {
                  name: user.display_name || 'Student',
                  message: `Your account has been created. You can log in using your email and this temporary password: ${plainPassword} \nPlease change it after your first login.`,
                },
              });
            } catch (emailErr) {
              logger.error({ userEmail: user.email, err: emailErr.message }, 'Failed to send welcome email during bulk import');
            }

            oldState.push({ type: 'insert', table: 'users', key: id, data: null });
            newState.push({ type: 'insert', table: 'users', key: id, data: insertedRows[0] });
          }
        });
        processed++;
        this.updateJobProgress(job.id, processed, []);
      } catch (err) {
        jobErrors.push(`Row ${user.row}: Database error - ${err.message}`);
      }

    // Log to audit log
    if (oldState.length > 0 || newState.length > 0) {
      await auditLogRepository.insertAuditLog({
        adminId,
        action: 'BULK_USER_IMPORT',
        oldState: { operations: oldState },
        newState: { operations: newState },
      });
    }

    // Send email alert to admin
    try {
      await sendEmail({
        to: 'admin@nexasphere.com',
        subject: 'Bulk User Import Operation Completed',
        templateName: 'generic',
        data: {
          name: 'Administrator',
          message: `The bulk user import job (${jobId}) has finished. Successful: ${processed}/${preview.length}. Errors: ${jobErrors.length}.`,
        },
      });
    } catch (emailErr) {
      logger.error({ err: emailErr.message }, 'Failed to send bulk import status email');
    }

    this.updateJobProgress(
      jobId,
      processed,
      jobErrors.map((e) => ({ message: e })),
      'completed',
      {
        successful: processed,
        total: preview.length,
        errorsCount: jobErrors.length,
      }
    );

    return { successful: processed, total: preview.length, errorsCount: jobErrors.length };
  }

  async exportUsers(fields = null, filters = {}) {
    return withDb(async (client) => {
      let query = 'SELECT * FROM users';
      const values = [];
      const clauses = [];
      let i = 1;

      if (filters.role) {
        clauses.push(`(role = $${i} OR admin_roles = $${i})`);
        values.push(filters.role);
        i++;
      }
      if (filters.status) {
        clauses.push(`status = $${i}`);
        values.push(filters.status);
        i++;
      }
      if (filters.major) {
        clauses.push(`major = $${i}`);
        values.push(filters.major);
        i++;
      }
      if (filters.year) {
        clauses.push(`year = $${i}`);
        values.push(filters.year);
        i++;
      }

      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';
      const { rows } = await client.query(query, values);
      return generateCSV(rows, fields);
    });
  }

  async bulkRoleAssignment(userIds, role, adminId) {
    const job = this.createJob('bulk_role_assignment', userIds.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      const oldState = [];
      const newState = [];
      let processed = 0;
      const errors = [];

      for (const id of userIds) {
        try {
          await withDb(async (client) => {
            const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
            if (rows.length > 0) {
              const existing = rows[0];
              oldState.push({ type: 'update', table: 'users', key: id, data: existing });

              const { rows: updatedRows } = await client.query(
                'UPDATE users SET role = $1, admin_roles = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [role, id]
              );
              newState.push({ type: 'update', table: 'users', key: id, data: updatedRows[0] });
            } else {
              errors.push(`User ${id} not found`);
            }
          });
          processed++;
          this.updateJobProgress(job.id, processed);
        } catch (err) {
          errors.push(`User ${id}: ${err.message}`);
        }
      }

      if (oldState.length > 0) {
        await auditLogRepository.insertAuditLog({
          adminId,
          action: 'BULK_USER_ROLE_ASSIGN',
          oldState: { operations: oldState },
          newState: { operations: newState },
        });
      }

      this.updateJobProgress(
        job.id,
        processed,
        errors.map((e) => ({ message: e })),
        'completed',
        {
          successful: processed,
          total: userIds.length,
        }
      );
    }, 0);

    return job;
  }

  async bulkStatusChange(userIds, status, adminId) {
    const job = this.createJob('bulk_status_change', userIds.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      const oldState = [];
      const newState = [];
      let processed = 0;
      const errors = [];

      for (const id of userIds) {
        try {
          await withDb(async (client) => {
            const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
            if (rows.length > 0) {
              const existing = rows[0];
              oldState.push({ type: 'update', table: 'users', key: id, data: existing });

              const { rows: updatedRows } = await client.query(
                'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [status, id]
              );
              newState.push({ type: 'update', table: 'users', key: id, data: updatedRows[0] });
            } else {
              errors.push(`User ${id} not found`);
            }
          });
          processed++;
          this.updateJobProgress(job.id, processed);
        } catch (err) {
          errors.push(`User ${id}: ${err.message}`);
        }
      }

      if (oldState.length > 0) {
        await auditLogRepository.insertAuditLog({
          adminId,
          action: 'BULK_USER_STATUS_CHANGE',
          oldState: { operations: oldState },
          newState: { operations: newState },
        });
      }

      this.updateJobProgress(
        job.id,
        processed,
        errors.map((e) => ({ message: e })),
        'completed',
        {
          successful: processed,
          total: userIds.length,
        }
      );
    }, 0);

    return job;
  }

  async bulkTagAssignment(userIds, tags, adminId) {
    const job = this.createJob('bulk_tag_assignment', userIds.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      const oldState = [];
      const newState = [];
      let processed = 0;
      const errors = [];

      for (const id of userIds) {
        try {
          await withDb(async (client) => {
            const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
            if (rows.length > 0) {
              const existing = rows[0];
              oldState.push({ type: 'update', table: 'users', key: id, data: existing });

              // Merge existing tags with new tags
              const existingTags = Array.isArray(existing.tags)
                ? existing.tags
                : existing.tags
                  ? JSON.parse(existing.tags)
                  : [];
              const mergedTags = Array.from(new Set([...existingTags, ...tags]));

              const { rows: updatedRows } = await client.query(
                'UPDATE users SET tags = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [JSON.stringify(mergedTags), id]
              );
              newState.push({ type: 'update', table: 'users', key: id, data: updatedRows[0] });
            } else {
              errors.push(`User ${id} not found`);
            }
          });
          processed++;
          this.updateJobProgress(job.id, processed);
        } catch (err) {
          errors.push(`User ${id}: ${err.message}`);
        }
      }

      if (oldState.length > 0) {
        await auditLogRepository.insertAuditLog({
          adminId,
          action: 'BULK_USER_TAG_ASSIGN',
          oldState: { operations: oldState },
          newState: { operations: newState },
        });
      }

      this.updateJobProgress(
        job.id,
        processed,
        errors.map((e) => ({ message: e })),
        'completed',
        {
          successful: processed,
          total: userIds.length,
        }
      );
    }, 0);

    return job;
  }

  async bulkEmail(userIds, subject, message, adminId) {
    const job = this.createJob('bulk_email', userIds.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      let processed = 0;
      const errors = [];

      for (const id of userIds) {
        try {
          let userEmail = '';
          let displayName = '';
          await withDb(async (client) => {
            const { rows } = await client.query(
              'SELECT email, display_name FROM users WHERE id = $1',
              [id]
            );
            if (rows.length > 0) {
              userEmail = rows[0].email;
              displayName = rows[0].display_name || 'User';
            }
          });

          if (userEmail) {
            await sendEmail({
              to: userEmail,
              subject,
              templateName: 'generic',
              data: {
                name: displayName,
                message,
              },
            });
          } else {
            errors.push(`User ${id} has no email address`);
          }
          processed++;
          this.updateJobProgress(job.id, processed);
        } catch (err) {
          errors.push(`User ${id}: ${err.message}`);
        }
      }

      this.updateJobProgress(
        job.id,
        processed,
        errors.map((e) => ({ message: e })),
        'completed',
        {
          successful: processed,
          total: userIds.length,
        }
      );
    }, 0);

    return job;
  }

  // ---------------------------------------------------------------------------
  // Event Operations
  // ---------------------------------------------------------------------------
  previewImportEvents(csvText) {
    const records = parseCSV(csvText);
    const preview = [];
    const errors = [];

    records.forEach((record, index) => {
      const rowNum = index + 2;
      const name = record.title || record.name || '';
      const date = record.date || record.datetime || '';
      const description = record.description || '';
      const location = record.location || '';
      const capacityVal = record.capacity || '';

      const rowErrors = [];
      if (!name) {
        rowErrors.push('Event title/name is required');
      }
      if (!date) {
        rowErrors.push('Event date is required');
      }
      if (!description) {
        rowErrors.push('Event description is required');
      }

      let capacity = null;
      if (capacityVal) {
        capacity = parseInt(capacityVal, 10);
        if (isNaN(capacity) || capacity < 0) {
          rowErrors.push('Capacity must be a positive number');
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, errors: rowErrors, data: record });
      } else {
        preview.push({ row: rowNum, name, date, description, location, capacity });
      }
    });

    return { preview, errors };
  }

  async importEvents(csvText, adminId) {
    const { preview, errors } = this.previewImportEvents(csvText);
    const job = this.createJob('import_events', preview.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      const oldState = [];
      const newState = [];
      let processed = 0;
      const jobErrors = [...errors.map((e) => `Row ${e.row}: ${e.errors.join(', ')}`)];

      for (const event of preview) {
        try {
          // Generate a safe unique ID from name or random
          const baseId = event.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          const eventId = `${baseId}-${Date.now()}`;

          await withDb(async (client) => {
            const { rows } = await client.query(
              `INSERT INTO events (id, name, short_name, date_text, description, status, icon, tags, location, capacity, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
              [
                eventId,
                event.name,
                event.name.slice(0, 30),
                event.date,
                event.description,
                'upcoming',
                '📌',
                '[]',
                event.location || null,
                event.capacity,
              ]
            );
            oldState.push({ type: 'insert', table: 'events', key: eventId, data: null });
            newState.push({ type: 'insert', table: 'events', key: eventId, data: rows[0] });
          });
          processed++;
          this.updateJobProgress(job.id, processed);
        } catch (err) {
          jobErrors.push(`Row ${event.row}: Database error - ${err.message}`);
        }
      }

      if (oldState.length > 0) {
        await auditLogRepository.insertAuditLog({
          adminId,
          action: 'BULK_EVENT_IMPORT',
          oldState: { operations: oldState },
          newState: { operations: newState },
        });
      }

      this.updateJobProgress(
        job.id,
        processed,
        jobErrors.map((e) => ({ message: e })),
        'completed',
        {
          successful: processed,
          total: preview.length,
          errorsCount: jobErrors.length,
        }
      );
    }, 0);

    return job;
  }

  async bulkUpdateEventStatus(eventIds, status, adminId) {
    const job = this.createJob('bulk_event_status_update', eventIds.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      const oldState = [];
      const newState = [];
      let processed = 0;
      const errors = [];

      for (const id of eventIds) {
        try {
          await withDb(async (client) => {
            const { rows } = await client.query('SELECT * FROM events WHERE id = $1', [id]);
            if (rows.length > 0) {
              const existing = rows[0];
              oldState.push({ type: 'update', table: 'events', key: id, data: existing });

              const { rows: updatedRows } = await client.query(
                'UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [status, id]
              );
              newState.push({ type: 'update', table: 'events', key: id, data: updatedRows[0] });
            } else {
              errors.push(`Event ${id} not found`);
            }
          });
          processed++;
          this.updateJobProgress(job.id, processed);
        } catch (err) {
          errors.push(`Event ${id}: ${err.message}`);
        }
      }

      if (oldState.length > 0) {
        await auditLogRepository.insertAuditLog({
          adminId,
          action: 'BULK_EVENT_STATUS_UPDATE',
          oldState: { operations: oldState },
          newState: { operations: newState },
        });
      }

      this.updateJobProgress(
        job.id,
        processed,
        errors.map((e) => ({ message: e })),
        'completed',
        {
          successful: processed,
          total: eventIds.length,
        }
      );
    }, 0);

    return job;
  }

  async bulkEventCloning(eventIds, offsetDays, adminId) {
    const job = this.createJob('bulk_event_cloning', eventIds.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      const oldState = [];
      const newState = [];
      let processed = 0;
      const errors = [];

      for (const id of eventIds) {
        try {
          await withDb(async (client) => {
            const { rows } = await client.query('SELECT * FROM events WHERE id = $1', [id]);
            if (rows.length > 0) {
              const event = rows[0];

              // Clone by generating a new ID and shifting the date if parseable
              const baseId = event.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
              const newId = `${baseId}-cloned-${crypto.randomUUID().slice(0, 8)}`;

              // Shift date string simple helper (handles standard date parsing or keeps original string)
              let newDateText = event.date_text;
              try {
                const dateVal = new Date(event.date_text);
                if (!isNaN(dateVal.getTime())) {
                  dateVal.setDate(dateVal.getDate() + offsetDays);
                  newDateText = dateVal.toISOString().split('T')[0];
                }
              } catch (_) {}

              const { rows: insertedRows } = await client.query(
                `INSERT INTO events (id, name, short_name, date_text, description, status, icon, tags, location, capacity, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
                [
                  newId,
                  `${event.name} (Cloned)`,
                  event.short_name || event.name.slice(0, 30),
                  newDateText,
                  event.description,
                  'upcoming',
                  event.icon,
                  JSON.stringify(event.tags || []),
                  event.location,
                  event.capacity,
                ]
              );
              oldState.push({ type: 'insert', table: 'events', key: newId, data: null });
              newState.push({ type: 'insert', table: 'events', key: newId, data: insertedRows[0] });
            } else {
              errors.push(`Event ${id} not found`);
            }
          });
          processed++;
          this.updateJobProgress(job.id, processed);
        } catch (err) {
          errors.push(`Event ${id}: ${err.message}`);
        }
      }

      if (oldState.length > 0) {
        await auditLogRepository.insertAuditLog({
          adminId,
          action: 'BULK_EVENT_CLONING',
          oldState: { operations: oldState },
          newState: { operations: newState },
        });
      }

      this.updateJobProgress(
        job.id,
        processed,
        errors.map((e) => ({ message: e })),
        'completed',
        {
          successful: processed,
          total: eventIds.length,
        }
      );
    }, 0);

    return job;
  }

  async exportEventData(eventIds) {
    return withDb(async (client) => {
      const records = [];

      for (const eventId of eventIds) {
        const { rows: eventRows } = await client.query('SELECT * FROM events WHERE id = $1', [
          eventId,
        ]);
        if (eventRows.length === 0) continue;
        const event = eventRows[0];

        // Fetch attendees directly from database
        const { rows: regRows } = await client.query(
          'SELECT * FROM event_registrations WHERE event_id = $1',
          [eventId]
        );

        if (regRows.length === 0) {
          records.push({
            event_id: event.id,
            event_name: event.name,
            event_date: event.date_text,
            event_status: event.status,
            attendee_name: '',
            attendee_email: '',
            attendee_status: '',
            attendance: '',
          });
        } else {
          for (const reg of regRows) {
            records.push({
              event_id: event.id,
              event_name: event.name,
              event_date: event.date_text,
              event_status: event.status,
              attendee_name: reg.full_name,
              attendee_email: reg.email,
              attendee_status: reg.status,
              attendance: reg.attended ? 'Attended' : 'Absent',
            });
          }
        }
      }

      return generateCSV(records);
    });
  }

  async bulkSendReminders(eventIds, adminId) {
    const job = this.createJob('bulk_send_reminders', eventIds.length);

    setTimeout(async () => {
      this.updateJobProgress(job.id, 0, [], 'processing');
      let processedEvents = 0;
      let totalRemindersSent = 0;
      const errors = [];

      for (const eventId of eventIds) {
        try {
          let eventName = '';
          let eventDate = '';
          await withDb(async (client) => {
            const { rows } = await client.query(
              'SELECT name, date_text FROM events WHERE id = $1',
              [eventId]
            );
            if (rows.length > 0) {
              eventName = rows[0].name;
              eventDate = rows[0].date_text;
            }
          });

          if (!eventName) {
            errors.push(`Event ${eventId} not found`);
            continue;
          }

          // Fetch confirmed attendees
          let attendees = [];
          await withDb(async (client) => {
            const { rows } = await client.query(
              "SELECT full_name, email FROM event_registrations WHERE event_id = $1 AND status = 'confirmed'",
              [eventId]
            );
            attendees = rows;
          });

          for (const attendee of attendees) {
            try {
              await sendEmail({
                to: attendee.email,
                subject: `Reminder: ${eventName} is starting soon`,
                templateName: 'event-reminder',
                data: {
                  name: attendee.full_name,
                  eventName,
                  eventDate,
                },
              });
              totalRemindersSent++;
            } catch (emailErr) {
              errors.push(`Attendee ${attendee.email}: ${emailErr.message}`);
            }
          }

          processedEvents++;
          this.updateJobProgress(job.id, processedEvents);
        } catch (err) {
          errors.push(`Event ${eventId}: ${err.message}`);
        }
      }

      this.updateJobProgress(
        job.id,
        processedEvents,
        errors.map((e) => ({ message: e })),
        'completed',
        {
          successfulEvents: processedEvents,
          totalRemindersSent,
        }
      );
    }, 0);

    return job;
  }

  // ---------------------------------------------------------------------------
  // Rollback System
  // ---------------------------------------------------------------------------
  async rollback(auditLogId, adminId) {
    return withDb(async (client) => {
      // Fetch audit log
      const { rows } = await client.query('SELECT * FROM audit_logs WHERE id = $1', [auditLogId]);
      if (rows.length === 0) {
        throw new Error('Audit log entry not found');
      }

      const log = rows[0];
      const ageHours = (Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60);

      if (ageHours > 24) {
        throw new Error('Rollback is only allowed within 24 hours of the bulk operation');
      }

      const parsedOldState =
        typeof log.old_state === 'string' ? JSON.parse(log.old_state) : log.old_state;
      if (!parsedOldState || !parsedOldState.operations) {
        throw new Error('No state changes recorded in this audit log for rollback');
      }

      const operations = parsedOldState.operations;
      const rolledBackOps = [];

      // Revert in reverse order of the operation execution
      for (let j = operations.length - 1; j >= 0; j--) {
        const op = operations[j];

        if (!/^[a-zA-Z0-9_]+$/.test(op.table)) {
          throw new Error(`Invalid table name detected in rollback log: ${op.table}`);
        }

        if (op.type === 'insert') {
          // A insert rollback deletes the created row
          await client.query(`DELETE FROM ${validateTableName(op.table)} WHERE id = $1`, [op.key]);
          rolledBackOps.push({ type: 'delete', table: op.table, key: op.key });
        } else if (op.type === 'update') {
          // A update rollback restores previous values
          const oldData = op.data;
          const fields = [];
          const values = [];
          let index = 1;

          Object.keys(oldData).forEach((field) => {
            if (field === 'id' || field === 'created_at') return;
            if (!/^[a-zA-Z0-9_]+$/.test(field)) {
              throw new Error(`Invalid column name detected in rollback log: ${field}`);
            }
            fields.push(`${field} = $${index++}`);
            let val = oldData[field];
            if (val !== null && typeof val === 'object') {
              val = JSON.stringify(val);
            }
            values.push(val);
          });

          values.push(op.key);
          const sql = `UPDATE ${validateTableName(op.table)} SET ${fields.join(', ')} WHERE id = $${index}`;
          await client.query(sql, values);
          rolledBackOps.push({ type: 'update', table: op.table, key: op.key });
        }
      }

      // Record rollback operation
      await auditLogRepository.insertAuditLog({
        adminId,
        action: `ROLLBACK_${log.action}`,
        oldState: { rollbackOfId: auditLogId },
        newState: { rolledBackOperations: rolledBackOps },
      });

      return { successful: rolledBackOps.length };
    });
  }
}

export const bulkOperationsService = new BulkOperationsService();
