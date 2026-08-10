import { CircuitBreaker, circuitBreakerRegistry } from '../utils/circuitBreaker.js';
import { tracedFetch } from '../config/appContext.js';
import { isIP } from 'net';

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

export function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export function normalizePrivateKey(k) {
  return k.includes('\\n') ? k.replace(/\\n/g, '\n') : k;
}

export function isInternalUrl(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    // Check if hostname is an IP
    if (isIP(hostname)) {
      const parts = hostname.split('.').map(Number);
      // 127.0.0.0/8
      if (parts[0] === 127) return true;
      // 10.0.0.0/8
      if (parts[0] === 10) return true;
      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return true;
      // 169.254.0.0/16
      if (parts[0] === 169 && parts[1] === 254) return true;
    }

    // Common local hostnames
    const localHostnames = ['localhost', '127.0.0.1', '::1'];
    if (localHostnames.includes(hostname.toLowerCase())) return true;

    return false;
  } catch (e) {
    return true; // If invalid URL, treat as malicious
  }
}

export async function supabaseRequest(pathname, { method = 'GET', body } = {}) {
  if (!HAS_SUPABASE) throw new Error('Supabase is not configured');
  const fullUrl = `${SUPABASE_URL}/rest/v1/${pathname}`;
  if (isInternalUrl(fullUrl) && !fullUrl.startsWith(SUPABASE_URL)) {
    throw new Error('Access to internal URL is prohibited');
  }

  const res = await fetch(fullUrl, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'GET' ? 'count=exact' : 'return=representation',
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
  'storage-supabase',
  new CircuitBreaker(_rawSupabaseRequest, {
    name: 'storage-supabase',
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 10000,
    maxCoolDownPeriod: 60000,
  })
);
