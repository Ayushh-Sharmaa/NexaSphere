import pg from 'pg';

let pool = null;

function getPool() {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  pool = new pg.Pool({ connectionString: databaseUrl });
  return pool;
}

export async function withDb(fn) {
  const p = getPool();
  if (!p) throw new Error('PostgreSQL not configured. Missing DATABASE_URL.');
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export { pg };

