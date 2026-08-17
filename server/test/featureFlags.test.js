import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import { setWithDbOverride } from '../repositories/db.js';
import { featureFlagsService } from '../services/featureFlagsService.js';

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.ADMIN_EVENT_PASSWORD = 'StrongEventPassword123!';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit';
process.env.PORT = '0';

let dbQueries = [];
let mockDbResult = {
  selectFlags: [],
  selectHistory: [],
  selectMetrics: [],
  selectStale: [],
  rowCount: 0,
};

// Intercept DB queries for feature flags
setWithDbOverride(async (fn) => {
  const mockClient = {
    query: async (sql, params) => {
      dbQueries.push({ sql: sql.trim().replace(/\s+/g, ' '), params });
      const sqlLower = sql.toLowerCase();

      if (sqlLower.includes('select * from feature_flags where key =')) {
        const key = params[0];
        const flag = mockDbResult.selectFlags.find((f) => f.key === key);
        return { rows: flag ? [flag] : [], rowCount: flag ? 1 : 0 };
      }
      if (sqlLower.includes('select * from feature_flags order by key asc')) {
        return { rows: mockDbResult.selectFlags, rowCount: mockDbResult.selectFlags.length };
      }
      if (sqlLower.includes('select * from feature_flag_history')) {
        return { rows: mockDbResult.selectHistory, rowCount: mockDbResult.selectHistory.length };
      }
      if (sqlLower.includes('select * from ab_test_metrics')) {
        return { rows: mockDbResult.selectMetrics, rowCount: mockDbResult.selectMetrics.length };
      }
      if (sqlLower.includes('select * from feature_flags where updated_at <')) {
        return { rows: mockDbResult.selectStale, rowCount: mockDbResult.selectStale.length };
      }
      if (sqlLower.includes('insert into feature_flags')) {
        const flag = {
          key: params[0],
          name: params[1],
          description: params[2],
          type: params[3],
          is_active: params[4],
          rollout_percentage: params[5],
          target_users: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6],
          target_roles: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7],
          environments: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
          start_time: params[9],
          end_time: params[10],
          fallback_value: params[11],
          created_at: new Date(),
          updated_at: new Date(),
        };
        mockDbResult.selectFlags.push(flag);
        return { rows: [flag], rowCount: 1 };
      }
      if (sqlLower.includes('update feature_flags set')) {
        const key = params[params.length - 1];
        const flag = mockDbResult.selectFlags.find((f) => f.key === key);
        if (flag) {
          // simple stub update
          if (sqlLower.includes('is_active =')) {
            flag.is_active = params[0];
          }
          flag.updated_at = new Date();
          return { rows: [flag], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      if (sqlLower.includes('delete from feature_flags')) {
        const key = params[0];
        const initialLen = mockDbResult.selectFlags.length;
        mockDbResult.selectFlags = mockDbResult.selectFlags.filter((f) => f.key !== key);
        return { rows: [], rowCount: initialLen - mockDbResult.selectFlags.length };
      }

      return { rows: [], rowCount: 0 };
    },
  };
  return fn(mockClient);
});

test.beforeEach(() => {
  dbQueries = [];
  mockDbResult = {
    selectFlags: [],
    selectHistory: [],
    selectMetrics: [],
    selectStale: [],
    rowCount: 0,
  };
  featureFlagsService.cache.clear();
  featureFlagsService.isInitialized = true; // prevent service from trying to fetch all flags on boot
});

test('createFlag applies defaults when defaulted fields are null', async () => {
  const flag = await featureFlagsService.createFlag({
    key: 'test_null_defaults',
    name: 'Test Null Defaults',
    type: 'boolean',
    is_active: null,
    rollout_percentage: null,
    fallback_value: null,
  });

  assert.equal(flag.is_active, true);
  assert.equal(flag.rollout_percentage, 100);
  assert.equal(flag.fallback_value, false);
});

test('Feature flag evaluation - Boolean flag', async () => {
  const flag = {
    key: 'test_boolean',
    name: 'Test Boolean',
    type: 'boolean',
    is_active: true,
    fallback_value: false,
  };

  const enabled = featureFlagsService.evaluateFlag(flag);
  assert.equal(enabled, true);

  const disabledFlag = { ...flag, is_active: false };
  const enabledDisabled = featureFlagsService.evaluateFlag(disabledFlag);
  assert.equal(enabledDisabled, false);
});

test('Feature flag evaluation - Fallback value', async () => {
  const flag = {
    key: 'test_fallback',
    name: 'Test Fallback',
    type: 'boolean',
    is_active: false,
    fallback_value: true,
  };

  const enabled = featureFlagsService.evaluateFlag(flag);
  assert.equal(enabled, true);
});

test('Feature flag evaluation - Environment restriction', async () => {
  const flag = {
    key: 'test_env',
    name: 'Test Env',
    type: 'boolean',
    is_active: true,
    environments: ['production'],
  };

  // Environment mismatch
  const enabledDev = featureFlagsService.evaluateFlag(flag, { environment: 'development' });
  assert.equal(enabledDev, false);

  // Environment match
  const enabledProd = featureFlagsService.evaluateFlag(flag, { environment: 'production' });
  assert.equal(enabledProd, true);
});

test('Feature flag evaluation - Time-based restriction', async () => {
  const future = new Date(Date.now() + 10000);
  const past = new Date(Date.now() - 10000);

  const flagFuture = {
    key: 'test_time_future',
    name: 'Test Time Future',
    type: 'boolean',
    is_active: true,
    start_time: future,
  };

  assert.equal(featureFlagsService.evaluateFlag(flagFuture), false);

  const flagPast = {
    key: 'test_time_past',
    name: 'Test Time Past',
    type: 'boolean',
    is_active: true,
    start_time: past,
    end_time: future,
  };

  assert.equal(featureFlagsService.evaluateFlag(flagPast), true);
});

test('Feature flag evaluation - User target whitelist', async () => {
  const flag = {
    key: 'test_user_target',
    name: 'Test User Target',
    type: 'boolean',
    is_active: true,
    target_users: ['usr_123', 'usr_456'],
  };

  assert.equal(featureFlagsService.evaluateFlag(flag, { userId: 'usr_123' }), true);
  assert.equal(featureFlagsService.evaluateFlag(flag, { userId: 'usr_789' }), true); // Defaults to true if user is not in whitelist since it is not percentage
});

test('Feature flag evaluation - Percentage rollout', async () => {
  const flag = {
    key: 'test_percentage',
    name: 'Test Percentage',
    type: 'percentage',
    is_active: true,
    rollout_percentage: 50,
  };

  // Deterministic checks
  const res1 = featureFlagsService.evaluateFlag(flag, { userId: 'user_a' });
  const res2 = featureFlagsService.evaluateFlag(flag, { userId: 'user_a' });
  assert.equal(res1, res2, 'Percentage evaluation must be deterministic for the same user');

  // Random fallback when no user is provided
  const resRandom = featureFlagsService.evaluateFlag(flag);
  assert.equal(typeof resRandom, 'boolean');
});

test('A/B Testing significance calculator works correctly', async () => {
  // Mock A/B test metrics in DB
  mockDbResult.selectMetrics = [
    {
      flag_key: 'ab_test_1',
      group_name: 'control',
      participants_count: 1000,
      conversions_count: 100,
    },
    {
      flag_key: 'ab_test_1',
      group_name: 'variant',
      participants_count: 1000,
      conversions_count: 150,
    },
  ];

  mockDbResult.selectFlags = [
    {
      key: 'ab_test_1',
      name: 'AB Test 1',
      type: 'ab_test',
      is_active: true,
    },
  ];

  const analytics = await featureFlagsService.getABTestAnalytics('ab_test_1');

  assert.equal(analytics.control.participants, 1000);
  assert.equal(analytics.variant.conversions, 150);
  assert.equal(analytics.control.conversionRate, 0.1);
  assert.equal(analytics.variant.conversionRate, 0.15);
  assert.ok(
    analytics.analytics.isSignificant,
    '15% vs 10% with n=1000 should be statistically significant'
  );
});

test('Feature flag API Endpoints integration', async (t) => {
  const { default: app } = await import('../index.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const sendRequest = (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data || '{}');
          } catch (err) {
            parsed = { raw: data };
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  await t.test('POST /api/feature-flags/evaluate returns flag evaluation results', async () => {
    const mockFlag = {
      key: 'api_boolean_flag',
      name: 'API Boolean Flag',
      type: 'boolean',
      is_active: true,
      environments: [],
      target_users: [],
      target_roles: [],
      fallback_value: false,
    };
    mockDbResult.selectFlags.push(mockFlag);
    featureFlagsService.cache.set('api_boolean_flag', mockFlag);

    const res = await sendRequest('POST', '/api/feature-flags/evaluate', {
      flags: ['api_boolean_flag', 'non_existent_flag'],
      context: { userId: 'user_1' },
    });

    console.log('EVALUATE RESPONSE BODY:', res.body);

    assert.equal(res.status, 200);
    assert.equal(res.body.api_boolean_flag, true);
    assert.equal(res.body.non_existent_flag, false);
  });

  await t.test('POST /api/feature-flags/ab-test/conversion records conversions', async () => {
    const abFlag = {
      key: 'ab_flag_1',
      name: 'AB Flag',
      type: 'ab_test',
      is_active: true,
      environments: [],
      target_users: [],
      target_roles: [],
      fallback_value: false,
    };
    mockDbResult.selectFlags.push(abFlag);
    featureFlagsService.cache.set('ab_flag_1', abFlag);

    const res = await sendRequest('POST', '/api/feature-flags/ab-test/conversion', {
      flagKey: 'ab_flag_1',
      userId: 'user_2',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  server.close();
});
