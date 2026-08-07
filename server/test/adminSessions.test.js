import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";

// Configure dummy environment variables before importing the repository
process.env.DATABASE_URL = "postgresql://localhost/dummy_test_db";
process.env.ADMIN_SESSION_TTL_MS = "3600000"; // 1 hour
process.env.ADMIN_SESSION_CLEANUP_INTERVAL_MS = "60000"; // 1 minute
process.env.ADMIN_SESSION_TOUCH_THROTTLE_MS = "1000"; // 1 second for easy testing

// Track executed database queries and mock responses
let executedQueries = [];
let mockQueriesResult = {
  select: [],
  rowCount: 0,
};

// Intercept PostgreSQL pool connection with a robust mock
pg.Pool = class MockPool {
  // Mock event listener attachment to avoid TypeError from pool.on
  on(event, handler) {}
  async connect() {
    return {
      query: async (sql, params) => {
        executedQueries.push({ sql: sql.trim().replace(/\s+/g, " "), params });

        const sqlLower = sql.toLowerCase();
        if (sqlLower.includes("select token_hash")) {
          return {
            rows: mockQueriesResult.select,
            rowCount: mockQueriesResult.select.length,
          };
        }
        if (sqlLower.includes("update admin_sessions")) {
          return { rows: [], rowCount: mockQueriesResult.rowCount };
        }
        if (sqlLower.includes("delete from admin_sessions")) {
          return { rows: [], rowCount: 1 };
        }
        if (sqlLower.includes("insert into admin_sessions")) {
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
      release: () => {},
    };
  }
};

// Now import the repository
import {
  createAdminSession,
  getAdminSession,
  revokeAdminSession,
  cleanupExpiredAdminSessions,
} from "../repositories/adminSessionsRepository.js";

test.beforeEach(() => {
  executedQueries = [];
  mockQueriesResult = {
    select: [],
    rowCount: 0,
  };
});

test("Session creation executes DB insertion and returns metadata", async () => {
  const session = await createAdminSession({
    username: "admin_test",
    metadata: { ip: "127.0.0.1" },
  });

  assert.ok(session.token);
  assert.equal(session.username, "admin_test");
  assert.ok(session.expiresAt);
  assert.equal(session.ttlMs, 3600000);

  const insertQuery = executedQueries.find((q) =>
    q.sql.includes("insert into admin_sessions")
  );
  assert.ok(insertQuery, "Should run insert query");
  assert.equal(insertQuery.params[1], "admin_test");
  assert.deepEqual(insertQuery.params[2], { ip: "127.0.0.1" });
});

test("First session lookup returns session data and triggers background async last_seen_at update", async () => {
  const mockSession = {
    token_hash: "mock_hash",
    username: "admin_user",
    metadata: { browser: "Chrome" },
    created_at: new Date(),
    last_seen_at: new Date(),
    expires_at: new Date(Date.now() + 100000),
  };
  mockQueriesResult.select = [mockSession];

  const session = await getAdminSession("mock_token");
  assert.ok(session);
  assert.equal(session.username, "admin_user");
  assert.deepEqual(session.metadata, { browser: "Chrome" });

  // Give a tiny timeout for the async background DB update to trigger
  await new Promise((resolve) => setTimeout(resolve, 50));

  const updateQuery = executedQueries.find((q) =>
    q.sql.includes("update admin_sessions set last_seen_at")
  );
  assert.ok(updateQuery, "Should have triggered async background UPDATE");
  assert.equal(updateQuery.params[0], insertQueryParamHash("mock_token"));
});

test("Subsequent retrievals within the throttle window skip the database UPDATE completely", async () => {
  const mockSession = {
    token_hash: "mock_hash",
    username: "admin_user",
    metadata: { browser: "Chrome" },
    created_at: new Date(),
    last_seen_at: new Date(),
    expires_at: new Date(Date.now() + 100000),
  };
  mockQueriesResult.select = [mockSession];

  // Retrieve once (triggers first update)
  await getAdminSession("mock_token");
  await new Promise((resolve) => setTimeout(resolve, 30));

  // Clear query log of the first update to count exactly subsequent queries
  executedQueries = [];

  // Retrieve 5 more times in rapid succession
  for (let i = 0; i < 5; i++) {
    await getAdminSession("mock_token");
  }
  await new Promise((resolve) => setTimeout(resolve, 30));

  // Check if any UPDATE queries were run during the throttled rapid sessions
  const updates = executedQueries.filter((q) =>
    q.sql.includes("update admin_sessions set last_seen_at")
  );
  assert.equal(
    updates.length,
    0,
    "Should skip UPDATE query under concurrent throttle"
  );
});

test("Retrievals outside the throttle window trigger a new database UPDATE", async () => {
  process.env.ADMIN_SESSION_TOUCH_THROTTLE_MS = "50"; // set extremely short throttle
  const mockSession = {
    token_hash: "mock_hash",
    username: "admin_user",
    metadata: { browser: "Chrome" },
    created_at: new Date(),
    last_seen_at: new Date(),
    expires_at: new Date(Date.now() + 100000),
  };
  mockQueriesResult.select = [mockSession];

  // Retrieve first time
  await getAdminSession("mock_token");
  await new Promise((resolve) => setTimeout(resolve, 20)); // wait slightly

  executedQueries = []; // clear query list

  // Wait for throttle (50ms) to expire
  await new Promise((resolve) => setTimeout(resolve, 60));

  // Retrieve second time
  await getAdminSession("mock_token");
  await new Promise((resolve) => setTimeout(resolve, 20));

  const updates = executedQueries.filter((q) =>
    q.sql.includes("update admin_sessions set last_seen_at")
  );
  assert.equal(
    updates.length,
    1,
    "Should trigger exactly one new UPDATE query after throttle expires"
  );
});

test("Revoking a session deletes the throttled entry and updates DB", async () => {
  const result = await revokeAdminSession("mock_token");
  assert.ok(result === false || result === true);

  const revokeQuery = executedQueries.find((q) =>
    q.sql.includes("update admin_sessions set revoked_at")
  );
  assert.ok(revokeQuery, "Should execute DB revocation query");
  assert.equal(revokeQuery.params[0], insertQueryParamHash("mock_token"));
});

test("Periodic cleanup clears the throttled sessions and purges database", async () => {
  const count = await cleanupExpiredAdminSessions();
  assert.equal(typeof count, "number");

  const deleteQuery = executedQueries.find((q) =>
    q.sql.includes("delete from admin_sessions")
  );
  assert.ok(
    deleteQuery,
    "Should run database delete query for expired/revoked sessions"
  );
});

test("Failed database updates during throttled touches are caught and do not block requests", async () => {
  const mockSession = {
    token_hash: "mock_hash",
    username: "admin_user",
    metadata: {},
    created_at: new Date(),
    last_seen_at: new Date(),
    expires_at: new Date(Date.now() + 100000),
  };
  mockQueriesResult.select = [mockSession];

  // Temporarily force MockPool to throw error on UPDATE
  const connectBackup = pg.Pool.prototype.connect;
  pg.Pool.prototype.connect = async () => ({
    query: async (sql) => {
      if (sql.includes("update admin_sessions set last_seen_at")) {
        throw new Error("Database connection failed catastrophically");
      }
      return { rows: [mockSession], rowCount: 1 };
    },
    release: () => {},
  });

  try {
    // Should complete successfully and NOT throw the db error to the caller
    const session = await getAdminSession("error_token");
    assert.ok(session);
    assert.equal(session.username, "admin_user");

    // Wait for the async task to attempt database write and handle the error
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    // Restore pool mock connect
    pg.Pool.prototype.connect = connectBackup;
  }
});

test("adminSessionsRepository recovers from database boot failure on subsequent requests", async () => {
  let dbOnline = false;
  let schemaQueriesRun = 0;

  // Intercept connect
  const connectBackup = pg.Pool.prototype.connect;
  pg.Pool.prototype.connect = async () => {
    if (!dbOnline) {
      throw new Error("Database is offline");
    }
    return {
      query: async (sql, params) => {
        const sqlLower = sql.toLowerCase();
        if (
          sqlLower.includes("create table") ||
          sqlLower.includes("create index")
        ) {
          schemaQueriesRun++;
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {},
    };
  };

  try {
    // Import a fresh copy of the repository to ensure schemaReady is null
    const freshRepositoryUrl =
      "../repositories/adminSessionsRepository.js?bust=" + Date.now();
    const { createAdminSession: freshCreateAdminSession } = await import(
      freshRepositoryUrl
    );

    // 1. Database is offline: session creation should fail
    await assert.rejects(async () => {
      await freshCreateAdminSession({ username: "admin" });
    }, /Database is offline/);

    // 2. Database comes online: session creation should succeed and run schema queries
    dbOnline = true;
    const session = await freshCreateAdminSession({ username: "admin" });
    assert.ok(session.token);
    assert.ok(
      schemaQueriesRun > 0,
      "Schema initialization should run upon database recovery"
    );
  } finally {
    pg.Pool.prototype.connect = connectBackup;
  }
});

// Helper: Calculate SHA-256 hash of mock token to match queries parameter
import crypto from "crypto";
function insertQueryParamHash(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}
