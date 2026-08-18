import pg from "pg";

const connectionString =
  "postgresql://postgres:C7ipl0YyTn8GvgiW@db.nmwxpyhfmszwvsoqoxyq.supabase.co:5432/postgres";

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Connected successfully! Existing public tables:");
    console.log(res.rows.map((r) => r.table_name));
    await pool.end();
  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
}

main();
