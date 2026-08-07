import { AsyncLocalStorage } from "node:async_hooks";
import pg from "pg";
import { propagation, context as otelContext } from "@opentelemetry/api";

export const appContext = new AsyncLocalStorage();

// Global patch for pg module to automatically append the Correlation ID to all queries
const originalClientQuery = pg.Client.prototype.query;
pg.Client.prototype.query = function (config, values, callback) {
  const store = appContext.getStore();
  if (store?.reqId) {
    if (typeof config === "string") {
      config = `/* reqId: ${store.reqId} */ ${config}`;
    } else if (config && typeof config.text === "string") {
      config.text = `/* reqId: ${store.reqId} */ ${config.text}`;
    }
  }
  return originalClientQuery.call(this, config, values, callback);
};

// Global patch for fetch to automatically append the Correlation ID header to downstream requests
const originalFetch = global.fetch;
global.fetch = function (url, options) {
  const store = appContext.getStore();
  options = options || {};

  const headers = {};
  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (store?.reqId) {
    headers["X-Request-ID"] = store.reqId;
  }

  propagation.inject(otelContext.active(), headers);

  return originalFetch.call(this, url, { ...options, headers });
};
