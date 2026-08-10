import * as Sentry from '@sentry/node';
import { getLogContext } from './logContext.js';

let nodeProfilingIntegration = null;

export async function initializeSentry(app) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const dsn = process.env.SENTRY_DSN;

  if ((!dsn || dsn.trim().length === 0) && !isDevelopment) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  if (!nodeProfilingIntegration) {
    try {
      const profiling = await import('@sentry/profiling-node');
      nodeProfilingIntegration = profiling.nodeProfilingIntegration;
    } catch (error) {
      nodeProfilingIntegration = null;
    }
  }

  Sentry.init({
    dsn: dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      ...(nodeProfilingIntegration ? [nodeProfilingIntegration()] : []),
    ],
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    profilesSampleRate: isDevelopment ? 1.0 : 0.1,
    attachStacktrace: true,
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error) {
        event.fingerprint = [
          '{{ default }}',
          error.name || 'Error',
          (error.message || '').split('\n')[0],
        ];
      }
      return event;
    },
  });

  try {
    const os = await import('os');
    Sentry.setContext('environment_metadata', {
      'Node version': process.version,
      OS: os.platform(),
      'OS Release': os.release(),
    });
  } catch (err) {
    // Graceful fallback if os import fails
  }

  Sentry.addEventProcessor((event) => {
    const ctx = getLogContext();
    event.tags = event.tags || {};
    if (ctx.reqId) event.tags.reqId = ctx.reqId;
    if (ctx.traceId) event.tags.traceId = ctx.traceId;
    if (ctx.service) event.tags.service = ctx.service;
    return event;
  });

  return Sentry;
}

export function addSentryErrorHandler(app) {
  if (typeof Sentry.setupExpressErrorHandler === 'function') {
    Sentry.setupExpressErrorHandler(app);
  } else if (Sentry.Handlers && typeof Sentry.Handlers.errorHandler === 'function') {
    app.use(Sentry.Handlers.errorHandler());
  }
}

export const captureMessage = (...args) => Sentry.captureMessage(...args);
export const addBreadcrumb = (...args) => Sentry.addBreadcrumb(...args);
export { Sentry };
