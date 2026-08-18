import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import logger from "../utils/logger.js";

export const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://nmwxpyhfmszwvsoqoxyq.supabase.co";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

const fallbackKey =
  SUPABASE_SERVICE_ROLE_KEY ||
  SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_key_for_testing";

export const supabaseAdmin = createClient(SUPABASE_URL, fallbackKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const connectionString = process.env.DATABASE_URL || "";

export const dbPool = connectionString
  ? new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

if (dbPool) {
  dbPool.on("error", (err) => {
    logger.error("Unexpected error on idle PostgreSQL client:", err);
  });
}
