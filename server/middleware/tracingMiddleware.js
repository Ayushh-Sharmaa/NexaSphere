import crypto from 'crypto';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { appContext } from '../config/appContext.js';

export const activeTraces = new Map();
const tracer = trace.getTracer('nexasphere-api');

export function tracingMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || crypto.randomUUID();

  req.reqId = reqId;
  res.setHeader('X-Correlation-ID', reqId);

  const traceEntry = {
    reqId,
    method: req.method,
    url: req.originalUrl || req.url,
    startTime: Date.now(),
    queries: [],
    duration: 0,
  };

  activeTraces.set(reqId, traceEntry);

  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.originalUrl || req.url,
      'http.route': req.path,
      'nexasphere.request_id': reqId,
    },
  });

  const spanContext = trace.setSpan(context.active(), span);

  context.with(spanContext, () => {
    const store = { reqId, traceEntry };
    const activeSpan = trace.getSpan(context.active());
    if (activeSpan) {
      const sc = activeSpan.spanContext();
      store.traceId = sc.traceId;
    }

    appContext.run(store, () => {
      res.on('finish', () => {
        traceEntry.duration = Date.now() - traceEntry.startTime;
        if (activeTraces.size > 500) {
          const oldestKey = activeTraces.keys().next().value;
          activeTraces.delete(oldestKey);
        }

        span.setAttribute('http.status_code', res.statusCode);
        if (res.statusCode >= 500) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        span.end();
      });

      next();
    });
  });
}
