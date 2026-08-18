import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString =
  "postgresql://postgres:C7ipl0YyTn8GvgiW@db.nmwxpyhfmszwvsoqoxyq.supabase.co:5432/postgres";

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/20260818_initial_supabase_production.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log("Running production migration on Supabase PostgreSQL...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Production migration completed successfully on Supabase!");

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Active public tables in Supabase:");
    console.log(res.rows.map((r) => r.table_name));
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
