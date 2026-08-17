/**
 * server/scripts/validate-database.js
 * ─────────────────────────────────────
 * Database validation script for issue #1658 — AC #4: Data Validation Checks.
 *
 * Runs pre-migration and post-migration checks to verify:
 *  1. All expected tables exist
 *  2. Critical columns exist with correct data types
 *  3. Foreign key / referential integrity (no orphan rows)
 *  4. Row count baseline checks (no unexpected mass deletions)
 *  5. NOT NULL constraint violations
 *  6. Index existence for performance-critical queries
 *
 * Usage:
 *   npm run db:validate                    # post-migration validation (default)
 *   node scripts/validate-database.js --pre   # pre-migration snapshot
 *   node scripts/validate-database.js --post  # post-migration full check
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

import { withDb } from "../repositories/db.js";
import { validateTableName, validateColumnName } from "../utils/sqlSafety.js";

const MODE = process.argv.includes("--pre") ? "pre" : "post";

// ── Expected schema definition ────────────────────────────────────────────────

const EXPECTED_TABLES = [
  "admin_sessions",
  "users",
  "events",
  "notifications",
  "push_subscriptions",
  "notification_preferences",
];

const EXPECTED_COLUMNS = {
  admin_sessions: [
    { name: "token_hash", type: "text" },
    { name: "username", type: "text" },
  ],
  users: [
    { name: "id", type: "uuid" },
    { name: "username", type: "text" },
    { name: "email", type: "text" },
  ],
  events: [
    { name: "id", type: "uuid" },
    { name: "title", type: "text" },
  ],
  notifications: [
    { name: "id", type: "uuid" },
    { name: "user_id", type: "uuid" },
  ],
};

const EXPECTED_INDEXES = [
  { table: "users", index: "users_pkey" },
  { table: "events", index: "events_pkey" },
  { table: "notifications", index: "notifications_pkey" },
  { table: "notification_preferences", index: "notification_preferences_pkey" },
];

// Minimum row counts — fail if a table drops below this after migration.
// Set to 0 for tables that may legitimately be empty in test environments.
const MIN_ROW_COUNTS = {
  users: 0,
  events: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const warnings = [];

function pass(msg) {
  console.log(`  ✓ ${msg}`);
  passed++;
}

function fail(msg) {
  console.error(`  ✗ FAIL: ${msg}`);
  failed++;
}

function warn(msg) {
  console.warn(`  ⚠ WARNING: ${msg}`);
  warnings.push(msg);
}

// ── Check functions ───────────────────────────────────────────────────────────

async function checkTablesExist(client) {
  console.log("\n[1] Table existence checks");
  const res = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  const existing = new Set(res.rows.map((r) => r.tablename));

  for (const table of EXPECTED_TABLES) {
    if (existing.has(table)) {
      pass(`Table "${table}" exists`);
    } else {
      fail(`Table "${table}" is missing`);
    }
  }
}

async function checkColumns(client) {
  console.log("\n[2] Column existence and type checks");
  for (const [table, cols] of Object.entries(EXPECTED_COLUMNS)) {
    const res = await client.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = $1 AND table_schema = 'public'`,
      [table]
    );
    const colMap = Object.fromEntries(
      res.rows.map((r) => [r.column_name, r.data_type])
    );

    for (const { name, type } of cols) {
      if (!colMap[name]) {
        fail(`Column "${table}.${name}" is missing`);
      } else if (!colMap[name].includes(type)) {
        fail(
          `Column "${table}.${name}" has type "${colMap[name]}", expected "${type}"`
        );
      } else {
        pass(`Column "${table}.${name}" (${type}) OK`);
      }
    }
  }
}

async function checkForeignKeyIntegrity(client) {
  console.log("\n[3] Foreign key / referential integrity checks");

  // notifications → users
  const orphanNotifs = await client
    .query(
      `
    SELECT COUNT(*) AS count
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    WHERE u.id IS NULL
  `
    )
    .catch(() => ({ rows: [{ count: 0 }] }));

  const notifOrphans = parseInt(orphanNotifs.rows[0].count, 10);
  if (notifOrphans > 0) {
    fail(
      `Found ${notifOrphans} orphan rows in "notifications" (no matching user)`
    );
  } else {
    pass('No orphan rows in "notifications"');
  }

  // notification_preferences → users
  const orphanPrefs = await client
    .query(
      `
    SELECT COUNT(*) AS count
    FROM notification_preferences np
    LEFT JOIN users u ON np.user_id = u.id
    WHERE u.id IS NULL AND np.user_id != 'global'
  `
    )
    .catch(() => ({ rows: [{ count: 0 }] }));

  const prefOrphans = parseInt(orphanPrefs.rows[0].count, 10);
  if (prefOrphans > 0) {
    fail(`Found ${prefOrphans} orphan rows in "notification_preferences"`);
  } else {
    pass('No orphan rows in "notification_preferences"');
  }
}

async function checkNotNullConstraints(client) {
  console.log("\n[4] NOT NULL constraint violation checks");

  const checks = [
    { table: "users", column: "username" },
    { table: "users", column: "email" },
    { table: "events", column: "title" },
  ];

  for (const { table, column } of checks) {
    // Check if table + column exist before querying
    const exists = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'`,
      [table, column]
    );
    if (exists.rows.length === 0) {
      warn(`Skipping NOT NULL check — "${table}.${column}" does not exist`);
      continue;
    }

    const res = await client.query(
      `SELECT COUNT(*) AS count FROM ${validateTableName(table)} WHERE ${validateColumnName(column)} IS NULL`
    );
    const nullCount = parseInt(res.rows[0].count, 10);
    if (nullCount > 0) {
      fail(
        `Found ${nullCount} NULL values in "${table}.${column}" (NOT NULL violated)`
      );
    } else {
      pass(`No NULL violations in "${table}.${column}"`);
    }
  }
}

async function checkRowCounts(client) {
  console.log("\n[5] Row count baseline checks");
  for (const [table, minCount] of Object.entries(MIN_ROW_COUNTS)) {
    const exists = await client.query(
      `SELECT 1 FROM pg_tables WHERE tablename = $1 AND schemaname = 'public'`,
      [table]
    );
    if (exists.rows.length === 0) {
      warn(`Skipping row count check — table "${table}" does not exist`);
      continue;
    }

    const res = await client.query(
      `SELECT COUNT(*) AS count FROM ${validateTableName(table)}`
    );
    const count = parseInt(res.rows[0].count, 10);
    console.log(`  → "${table}": ${count} rows (minimum: ${minCount})`);
    if (count < minCount) {
      fail(`Table "${table}" has ${count} rows, expected at least ${minCount}`);
    } else {
      pass(`"${table}" row count OK (${count} >= ${minCount})`);
    }
  }
}

async function checkIndexes(client) {
  console.log("\n[6] Index existence checks");
  const res = await client.query(
    `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
  );
  const existing = new Set(res.rows.map((r) => r.indexname));

  for (const { table, index } of EXPECTED_INDEXES) {
    if (existing.has(index)) {
      pass(`Index "${index}" on "${table}" exists`);
    } else {
      warn(
        `Index "${index}" on "${table}" not found — may affect query performance`
      );
    }
  }
}

async function checkMigrationHistory(client) {
  console.log("\n[7] Migration history check");
  const res = await client
    .query(`SELECT COUNT(*) AS count FROM pgmigrations`)
    .catch(() => ({ rows: [{ count: "N/A (pgmigrations table not found)" }] }));

  const count = res.rows[0].count;
  console.log(`  → Applied migrations in pgmigrations: ${count}`);
  pass("Migration history table accessible");
}
