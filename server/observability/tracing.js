/**
 * OpenTelemetry tracing initialization and helpers.
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, context, propagation } from "@opentelemetry/api";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "nexasphere-api";
const OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces";

let sdk = null;

export function initTracing() {
  if (process.env.OTEL_ENABLED === "false") {
    return null;
  }

  const exporter = new OTLPTraceExporter({ url: OTLP_ENDPOINT });

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
    }),
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk?.shutdown().catch(() => {});
  });

  return sdk;
}

export function getActiveTraceId() {
  const span = trace.getSpan(context.active());
  if (!span) return null;
  const ctx = span.spanContext();
  return ctx.traceId && ctx.traceId !== "00000000000000000000000000000000"
    ? ctx.traceId
    : null;
}

export function injectTraceHeaders(headers = {}) {
  const carrier = { ...headers };
  propagation.inject(context.active(), carrier);
  return carrier;
}

export { trace, context, propagation };
