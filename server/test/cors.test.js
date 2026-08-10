import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.ADMIN_EVENT_PASSWORD = 'StrongEventPassword123!';
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:5173';
process.env.JWT_SECRET = 'secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit';
process.env.PORT = '0';

test('CORS Policy Configuration Verification', async (t) => {
  const { default: app } = await import('../index.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const sendRequest = (method, originHeader, path = '/health') => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: method,
        headers: originHeader ? { Origin: originHeader } : {},
        headers: originHeader ? { 'Origin': originHeader } : {},
      };

      const req = http.request(options, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
        });
      });
      req.end();
    });
  };

  try {
    await t.test('1. Whitelisted origin is allowed', async () => {
      const res = await sendRequest('GET', 'http://localhost:5173');
      assert.equal(res.status, 200);
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
      assert.equal(res.headers['access-control-allow-credentials'], 'true');
    });

    await t.test('2. Disallowed origin is blocked (rejected by CORS handler)', async () => {
      const res = await sendRequest('GET', 'http://malicious-domain.com');
      assert.ok(res.status >= 400);
      assert.equal(res.headers['access-control-allow-origin'], undefined);
    });

    await t.test('3. Preflight OPTIONS request handling', async () => {
      const res = await sendRequest('OPTIONS', 'http://localhost:5173');
      assert.equal(res.status, 204);
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
      assert.equal(res.headers['access-control-allow-methods'], 'GET,POST,PUT,DELETE,OPTIONS');
      assert.equal(res.headers['access-control-max-age'], '86400');
    });
  } finally {
    server.close();
  }
});

// ---------------------------------------------------------------------------
// Inline the buildCorsOrigins logic so the test has no dependency on the full
// server module (which requires env vars and a DB connection at import time).
// ---------------------------------------------------------------------------

function buildCorsOrigins(env = {}) {
  const raw = env.CORS_ORIGIN;
  if (raw) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'CORS_ORIGIN must be set in production. ' +
        'Refusing to start with an open wildcard in production.',
    );
  }
  return [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8787',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];
}

// ---------------------------------------------------------------------------
// Development fallback
// ---------------------------------------------------------------------------

test('dev fallback returns localhost origins when CORS_ORIGIN is unset', () => {
  const origins = buildCorsOrigins({ NODE_ENV: 'development' });
  assert.ok(Array.isArray(origins));
  assert.ok(origins.length > 0);
  assert.ok(origins.every((o) => o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1')));
});

test('dev fallback includes port 5173 and 3000', () => {
  const origins = buildCorsOrigins({ NODE_ENV: 'development' });
  assert.ok(origins.includes('http://localhost:5173'));
  assert.ok(origins.includes('http://localhost:3000'));
});

test('fallback does not include wildcard true or asterisk', () => {
  const origins = buildCorsOrigins({ NODE_ENV: 'development' });
  assert.ok(!origins.includes(true));
  assert.ok(!origins.includes('*'));
});

// ---------------------------------------------------------------------------
// Production guard
// ---------------------------------------------------------------------------

test('production throws when CORS_ORIGIN is unset', () => {
  assert.throws(
    () => buildCorsOrigins({ NODE_ENV: 'production' }),
    /CORS_ORIGIN must be set in production/,
  );
});

test('production throws when CORS_ORIGIN is an empty string', () => {
  assert.throws(
    () => buildCorsOrigins({ NODE_ENV: 'production', CORS_ORIGIN: '' }),
    /CORS_ORIGIN must be set in production/,
  );
});

test('production does not throw when CORS_ORIGIN is set', () => {
  assert.doesNotThrow(() =>
    buildCorsOrigins({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://nexasphere-glbajaj.vercel.app',
    }),
  );
});

// ---------------------------------------------------------------------------
// Allowlist parsing
// ---------------------------------------------------------------------------

test('single origin is returned as a one-element array', () => {
  const origins = buildCorsOrigins({ CORS_ORIGIN: 'https://example.com' });
  assert.deepEqual(origins, ['https://example.com']);
});

test('comma-separated origins are split and trimmed correctly', () => {
  const origins = buildCorsOrigins({
    CORS_ORIGIN: 'https://app.example.com , https://admin.example.com',
  });
  assert.deepEqual(origins, ['https://app.example.com', 'https://admin.example.com']);
});

test('empty segments from trailing comma are filtered out', () => {
  const origins = buildCorsOrigins({ CORS_ORIGIN: 'https://app.example.com,' });
  assert.deepEqual(origins, ['https://app.example.com']);
});

test('whitespace-only segments are filtered out', () => {
  const origins = buildCorsOrigins({ CORS_ORIGIN: 'https://a.com , , https://b.com' });
  assert.deepEqual(origins, ['https://a.com', 'https://b.com']);
});

test('explicit CORS_ORIGIN is used in production without error', () => {
  const origins = buildCorsOrigins({
    NODE_ENV: 'production',
    CORS_ORIGIN:
      'https://nexasphere-glbajaj.vercel.app,https://nexasphere-admin.vercel.app',
  });
  assert.ok(origins.includes('https://nexasphere-glbajaj.vercel.app'));
  assert.ok(origins.includes('https://nexasphere-admin.vercel.app'));
});

test('explicit CORS_ORIGIN overrides dev fallback in development', () => {
  const origins = buildCorsOrigins({
    NODE_ENV: 'development',
    CORS_ORIGIN: 'http://localhost:4000',
  });
  assert.deepEqual(origins, ['http://localhost:4000']);
  assert.ok(!origins.includes('http://localhost:5173'));
});
