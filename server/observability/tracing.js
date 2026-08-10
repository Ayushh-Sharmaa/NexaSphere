/**
 * OpenTelemetry tracing initialization and helpers.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { trace, context, propagation } from '@opentelemetry/api';
import logger from '../utils/logger.js';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'nexasphere-api';
const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

let sdk = null;
let shutdownHookRegistered = false;

export function initTracing() {
  if (process.env.OTEL_ENABLED === 'false') {
    return null;
  }

  if (sdk) {
    return sdk;
  }

  const exporter = new OTLPTraceExporter({ url: OTLP_ENDPOINT });

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
    }),
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  logger.info('[Tracing] OpenTelemetry SDK initialized');

  if (!shutdownHookRegistered) {
    shutdownHookRegistered = true;
    process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .then(() => logger.info('[Tracing] Tracing terminated'))
        .catch((error) => logger.error('[Tracing] Error terminating tracing', error))
        .finally(() => process.exit(0));
    });
  }

  return sdk;
}

export function shutdownTracing() {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}

/**
 * Convenience helper to create a new span.
 */
export function startSpan(name, options = {}) {
  const tracer = trace.getTracer(SERVICE_NAME);
  return tracer.startSpan(name, options);
}

/**
 * Runs a function within the context of a given span.
 */
export function withSpanContext(span, fn) {
  return context.with(trace.setSpan(context.active(), span), fn);
}

export { trace, context, propagation };

export function getActiveTraceId() {
  const currentSpan = trace.getSpan(context.active());
  return currentSpan ? currentSpan.spanContext().traceId : null;
}

export function injectTraceHeaders(headers = {}) {
  propagation.inject(context.active(), headers);
  return headers;
}
