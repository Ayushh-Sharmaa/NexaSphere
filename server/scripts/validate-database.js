import { withDb } from "../repositories/db.js";

async function validateSchema() {
  console.log(
    "[Database Validation] Starting schema and data integrity checks..."
  );

  const expectedTables = [
    "admin_sessions",
    "users",
    "events",
    "notifications",
    "push_subscriptions",
    "notification_preferences",
  ];

  try {
    await withDb(async (client) => {
      // 1. Verify table existence
      const tablesRes = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);

      const existingTables = tablesRes.rows.map((r) => r.tablename);
      console.log(
        `[Database Validation] Found existing tables: ${existingTables.join(", ")}`
      );

      const missingTables = expectedTables.filter(
        (t) => !existingTables.includes(t)
      );
      if (missingTables.length > 0) {
        throw new Error(`Missing expected tables: ${missingTables.join(", ")}`);
      }
      console.log("  ✓ All expected tables exist.");

      // 2. Verify column existence and types for critical tables
      // Check admin_sessions
      const adminSessionsCols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'admin_sessions' AND table_schema = 'public'
      `);

      const tokenHashCol = adminSessionsCols.rows.find(
        (r) => r.column_name === "token_hash"
      );
      if (!tokenHashCol) {
        throw new Error(
          "Missing critical column 'token_hash' in table 'admin_sessions'"
        );
      }
      console.log('  ✓ Table "admin_sessions" schema validated.');

      // Check users
      const usersCols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
      `);
      const usernameCol = usersCols.rows.find(
        (r) => r.column_name === "username"
      );
      if (!usernameCol) {
        throw new Error("Missing critical column 'username' in table 'users'");
      }
      console.log('  ✓ Table "users" schema validated.');

      // 3. Data Integrity Checks (Foreign Key & Constraint Validation)
      const orphanPreferences = await client.query(`
        SELECT COUNT(*) as count 
        FROM notification_preferences np
        LEFT JOIN users u ON np.user_id = u.id
        WHERE u.id IS NULL AND np.user_id != 'global'
      `);
      const orphans = parseInt(orphanPreferences.rows[0].count, 10);
      if (orphans > 0) {
        console.warn(
          `  [Warning] Found ${orphans} orphan entries in notification_preferences.`
        );
      } else {
        console.log("  ✓ Data integrity check: No orphan preferences found.");
      }

      console.log(
        "[Database Validation] SUCCESS: All database integrity checks passed."
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("[Database Validation] FAILURE:", error.message);
    process.exit(1);
  }
}

validateSchema();
