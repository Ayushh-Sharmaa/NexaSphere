import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';
import { propagation, context as otelContext } from '@opentelemetry/api';

export const appContext = new AsyncLocalStorage();

// Idempotency guard — prevent double-patching if this module is re-imported
const PG_PATCH_APPLIED = Symbol.for('appContext.pg.patched');

// Strip */ and newlines from reqId before embedding in a SQL comment
// to prevent comment-injection attacks
function sanitizeReqId(reqId) {
  return String(reqId)
    .replace(/\*\//g, '')
    .replace(/[\r\n]/g, '');
}

function isInternalUrl(url) {
  try {
    const { hostname } = new URL(url, 'http://localhost');
    if (['localhost', '127.0.0.1', '::1'].includes(hostname)) return true;
    const dev_domain = process.env.DEV_DOMAIN;
    const prod = process.env.PROD_DOMAINS?.split(',').map((d) => d.trim()) ?? [];
    if (dev_domain && hostname.endsWith(dev_domain)) return true;
    if (prod.some((d) => hostname === d || hostname.endsWith('.' + d))) return true;
    return false;
  } catch {
    return true; // treat unparseable / relative URLs as internal
  }
}

function getUrlString(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return String(input);
}

// Patch pg.Client.prototype.query to prepend /* reqId */ to every SQL query.
if (!pg.Client.prototype.query[PG_PATCH_APPLIED]) {
  const originalClientQuery = pg.Client.prototype.query;

  pg.Client.prototype.query = function (...args) {
    const store = appContext.getStore();

    if (store?.reqId) {
      const safeId = sanitizeReqId(store.reqId);
      const firstArg = args[0];
      const secondArgIsCallback = typeof args[1] === 'function';

      if (typeof firstArg === 'string') {
        args[0] = `/* reqId: ${safeId} */ ${firstArg}`;
      } else if (firstArg?.text && !secondArgIsCallback) {
        args[0] = { ...firstArg, text: `/* reqId: ${safeId} */ ${firstArg.text}` };
      }
    }

    return originalClientQuery.apply(this, args);
  };

  pg.Client.prototype.query[PG_PATCH_APPLIED] = true;
}

export async function tracedFetch(url, options = {}) {
  const store = appContext.getStore();
  const headers = new Headers();

  if (options.headers instanceof Headers) {
    options.headers.forEach((v, k) => headers.set(k, v));
  } else if (options.headers) {
    Object.entries(options.headers).forEach(([k, v]) => headers.set(k, v));
  }

  if (store?.reqId) headers.set('X-Correlation-ID', store.reqId);

  const urlString = getUrlString(url);
  if (isInternalUrl(urlString)) {
    propagation.inject(otelContext.active(), headers, {
      set(carrier, key, value) {
        carrier.set(key, value);
      },
    });
  }

  return globalThis.fetch(url, { ...options, headers });
}
