import pg from 'pg';
import logger from '../utils/logger.js';

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function getPoolConfig() {
  return {
    max: parsePositiveInt(process.env.PG_POOL_MAX, 20),
    connectionTimeoutMillis: parsePositiveInt(process.env.PG_CONNECTION_TIMEOUT_MS, 5_000),
    idleTimeoutMillis: parsePositiveInt(process.env.PG_IDLE_TIMEOUT_MS, 30_000),
    options: `--statement_timeout=${parsePositiveInt(process.env.PG_STATEMENT_TIMEOUT_MS, 10_000)}`,
  };
}

let pool = null;
let replicaPool = null;
let circuitOpenUntil = 0;

function getPools() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ...getPoolConfig(),
    });
    pool.on('error', (err) => {
      console.error('[pg.Pool primary] Unexpected error on idle client:', err.message);
    });
  }

  if (!replicaPool && process.env.DATABASE_URL_REPLICA) {
    replicaPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL_REPLICA,
      ...getPoolConfig(),
    });
    replicaPool.on('error', (err) => {
      console.error('[pg.Pool replica] Unexpected error on idle client:', err.message);
    });
  }

  return { primaryPool: pool, replicaPool };
}

export let customPool = null;

export function setCustomPool(p) {
  customPool = p;
}

function getPool() {
  if (customPool) return customPool;
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  pool = new pg.Pool({ connectionString: databaseUrl, ...getPoolConfig() });
  return pool;
}

export let withDbOverride = null;

export async function withDb(fn) {
  if (withDbOverride) {
    return await withDbOverride(fn);
  }
  const { primaryPool, replicaPool } = getPools();
  if (!primaryPool) throw new Error('PostgreSQL not configured. Missing DATABASE_URL.');

  const cooldownMs = parsePositiveInt(process.env.PG_CIRCUIT_BREAKER_COOLDOWN_MS, 30_000);
  const now = Date.now();
  let client;

  if (now < circuitOpenUntil && replicaPool) {
    client = await replicaPool.connect();
  } else {
    try {
      client = await primaryPool.connect();
      if (circuitOpenUntil !== 0) {
        circuitOpenUntil = 0;
      }
    } catch (primaryErr) {
      console.error('[db] Primary connection failed:', primaryErr.message);
      if (replicaPool) {
        console.warn(`[db] Opening circuit for ${cooldownMs}ms. Falling back to read-replica...`);
        circuitOpenUntil = Date.now() + cooldownMs;
        try {
          client = await replicaPool.connect();
        } catch (replicaErr) {
          console.error('[db] Replica connection also failed:', replicaErr.message);
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }
  }

  const originalQuery = client.query;
  client.query = function (config, values, callback) {
    const start = Date.now();

    let cb = callback;
    if (typeof values === 'function') {
      cb = values;
    }

    const handleStats = (err) => {
      const duration = Date.now() - start;
      const sqlText = typeof config === 'string' ? config : config?.text || 'unknown';

      if (duration >= 100) {
        import('../utils/queryLogger.js')
          .then(({ recordSlowQuery }) =>
            recordSlowQuery(sqlText, duration, { error: err?.message })
          )
          .catch((importErr) => logger.error('Failed to record slow query', { importErr }));
      }

      import('../config/appContext.js')
        .then(({ appContext }) => {
          const store = appContext.getStore();
          if (store?.traceEntry) {
            store.traceEntry.queries.push({
              sql: sqlText.trim().replace(/\s+/g, ' ').slice(0, 100),
              durationMs: duration,
              success: !err,
            });
          }
        })
        .catch((importErr) => logger.error('Failed to record query trace', { importErr }));
    };

    if (typeof cb === 'function') {
      const wrappedCallback = (err, result) => {
        handleStats(err);
        cb(err, result);
      };
      if (typeof values === 'function') {
        return originalQuery.call(this, config, wrappedCallback);
      }
      return originalQuery.call(this, config, values, wrappedCallback);
    }

    return originalQuery
      .call(this, config, values, callback)
      .then((res) => {
        handleStats(null);
        return res;
      })
      .catch((err) => {
        handleStats(err);
        throw err;
      });
  };

  const startTime = Date.now();
  let completed = false;
  const WARN_THRESHOLD_MS = Number(process.env.DB_HOLD_WARN_MS) || 200;
  const TIMEOUT_MS = Number(process.env.DB_HOLD_TIMEOUT_MS) || 5000;

  const holdTimer = setTimeout(() => {
    if (!completed) {
      console.warn(
        `[DB WARNING] PostgreSQL connection checked out for > ${WARN_THRESHOLD_MS}ms! Possible connection pool starvation hazard detected.`
      );
    }
  }, WARN_THRESHOLD_MS);

  try {
    const executionPromise = fn(client);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        if (!completed) {
          reject(
            new Error(
              `Database transaction timed out. Connection held longer than ${TIMEOUT_MS}ms safety limit.`
            )
          );
        }
      }, TIMEOUT_MS);
    });

    const result = await Promise.race([executionPromise, timeoutPromise]);
    completed = true;
    return result;
  } finally {
    completed = true;
    clearTimeout(holdTimer);
    const duration = Date.now() - startTime;
    if (duration > WARN_THRESHOLD_MS) {
      console.warn(`[DB PERF] Connection held for ${duration}ms (Threshold: ${WARN_THRESHOLD_MS}ms)`);
    }
    if (client) client.release();
  }
}

export function getPoolStats() {
  if (!pool) return null;
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

export function _resetCircuitBreaker() {
  circuitOpenUntil = 0;
}

export function _resetPools() {
  pool = null;
  replicaPool = null;
}

export function setWithDbOverride(fn) {
  withDbOverride = fn;
}

export async function query(text, params) {
  return withDb(async (client) => {
    return client.query(text, params);
  });
}

export { pg };
