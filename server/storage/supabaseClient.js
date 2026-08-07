import {
  CircuitBreaker,
  circuitBreakerRegistry,
} from "../utils/circuitBreaker.js";

export const SUPABASE_URL = process.env.SUPABASE_URL || "";
export const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

export function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export function normalizePrivateKey(k) {
  return k.includes("\\n") ? k.replace(/\\n/g, "\n") : k;
}

export async function supabaseRequest(pathname, { method = "GET", body } = {}) {
  if (!HAS_SUPABASE) throw new Error("Supabase is not configured");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "GET" ? "count=exact" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const _rawSupabaseRequest = supabaseRequest;

export const supabaseBreaker = circuitBreakerRegistry.register(
  "storage-supabase",
  new CircuitBreaker(_rawSupabaseRequest, {
    name: "storage-supabase",
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 10000,
    maxCoolDownPeriod: 60000,
  })
);
