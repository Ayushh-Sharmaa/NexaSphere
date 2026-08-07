import pg from "pg";

// ---------------------------------------------------------------------------
// Pool configuration
//
// All values are environment-variable-backed so operators can tune them for
// their specific deployment without changing code. Sensible, documented
// defaults are used when the variable is absent.
//
// PG_POOL_MAX            — max simultaneous client checkouts (default 20).
//                          Raise for high-concurrency deployments; lower for
//                          hosting plans with a tight connection limit.
// PG_CONNECTION_TIMEOUT_MS — ms to wait for a free client before throwing
//                          (default 5000). Prevents withDb callers from
//                          hanging forever when every slot is occupied.
// PG_IDLE_TIMEOUT_MS     — ms an idle client stays open before being closed
//                          (default 30000). Keeps Supabase / managed-PG
//                          connection limits from being exhausted by dormant
//                          slots between request bursts.
// PG_STATEMENT_TIMEOUT_MS — per-query execution ceiling sent to the server
//                          (default 10000). Stops long-running queries from
//                          holding a client indefinitely and causing cascading
//                          stalls on other requests.
// ---------------------------------------------------------------------------

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function getPoolConfig() {
  return {
    max: parsePositiveInt(process.env.PG_POOL_MAX, 20),
    connectionTimeoutMillis: parsePositiveInt(
      process.env.PG_CONNECTION_TIMEOUT_MS,
      5_000
    ),
    idleTimeoutMillis: parsePositiveInt(process.env.PG_IDLE_TIMEOUT_MS, 30_000),
    // statement_timeout is a Postgres session-level parameter. Passing it via
    // the connection string's options query parameter means every client
    // checked out of this pool enforces it automatically.
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

    pool.on("error", (err) => {
      console.error(
        "[pg.Pool primary] Unexpected error on idle client:",
        err.message
      );
    });
  }

  if (!replicaPool && process.env.DATABASE_URL_REPLICA) {
    replicaPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL_REPLICA,
      ...getPoolConfig(),
    });

    replicaPool.on("error", (err) => {
      console.error(
        "[pg.Pool replica] Unexpected error on idle client:",
        err.message
      );
    });
  }

  return { primaryPool: pool, replicaPool };
}

export let withDbOverride = null;

export async function withDb(fn) {
  if (withDbOverride) {
    return await withDbOverride(fn);
  }
  const { primaryPool, replicaPool } = getPools();
  if (!primaryPool)
    throw new Error("PostgreSQL not configured. Missing DATABASE_URL.");

  const cooldownMs = parsePositiveInt(
    process.env.PG_CIRCUIT_BREAKER_COOLDOWN_MS,
    30_000
  );
  const now = Date.now();
  let client;

  if (now < circuitOpenUntil && replicaPool) {
    // Circuit is open, use replica
    client = await replicaPool.connect();
  } else {
    // Circuit is closed (or half-open), try primary
    try {
      client = await primaryPool.connect();
      if (circuitOpenUntil !== 0) {
        // We successfully connected, close the circuit
        circuitOpenUntil = 0;
      }
    } catch (primaryErr) {
      console.error("[db] Primary connection failed:", primaryErr.message);
      if (replicaPool) {
        console.warn(
          `[db] Opening circuit for ${cooldownMs}ms. Falling back to read-replica...`
        );
        circuitOpenUntil = Date.now() + cooldownMs;
        try {
          client = await replicaPool.connect();
        } catch (replicaErr) {
          console.error(
            "[db] Replica connection also failed:",
            replicaErr.message
          );
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
    if (typeof values === "function") {
      cb = values;
    }

    const handleStats = (err) => {
      const duration = Date.now() - start;
      const sqlText =
        typeof config === "string" ? config : config?.text || "unknown";
      Promise.all([
        import("../middleware/performanceMonitor.js"),
        import("../config/appContext.js"),
      ])
        .then(([{ recordDbQueryMetric }, { appContext }]) => {
          recordDbQueryMetric(config, duration, err);
          const store = appContext.getStore();
          if (store?.traceEntry) {
            store.traceEntry.queries.push({
              sql: sqlText.trim().replace(/\s+/g, " ").slice(0, 100),
              durationMs: duration,
              success: !err,
            });
          }
        })
        .catch(() => {});
    };

    if (typeof cb === "function") {
      const wrappedCallback = (err, result) => {
        handleStats(err);
        cb(err, result);
      };
      if (typeof values === "function") {
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

  try {
    return await fn(client);
  } finally {
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

// For testing purposes
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

export { pg };
