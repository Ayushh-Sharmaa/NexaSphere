import assert from 'node:assert/strict';
import test from 'node:test';

process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const fetchCalls = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  fetchCalls.push({ url: String(url), method });

  if (
    String(url) === 'https://supabase.test/rest/v1/pending_digests?frequency=eq.daily_digest' &&
    method === 'GET'
  ) {
    return new Response(
      JSON.stringify([
        {
          id: 'digest-1',
          user_id: 'user-a',
          notification_data: { title: 'One' },
        },
        {
          id: 'digest-2',
          user_id: 'user-a',
          notification_data: { title: 'Two' },
        },
        {
          id: 'digest-3',
          user_id: 'user-b',
          notification_data: { title: 'Three' },
        },
      ]),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (
    String(url) ===
      'https://supabase.test/rest/v1/pending_digests?id=in.(digest-1,digest-2,digest-3)' &&
    method === 'DELETE'
  ) {
    return new Response('', { status: 200 });
  }

  throw new Error(`Unexpected fetch call: ${method} ${String(url)}`);
};

const { default: notificationsService } = await import('../services/notificationsService.js');

test.after(() => {
  globalThis.fetch = originalFetch;
});

test('processDigests deletes only the digests it fetched', async () => {
  const sent = [];
  const originalSendNow = notificationsService.sendNow;
  notificationsService.sendNow = async (userId, payload) => {
    sent.push({ userId, payload });
  };

  try {
    await notificationsService.processDigests('daily_digest');
  } finally {
    notificationsService.sendNow = originalSendNow;
  }

  assert.deepEqual(
    sent.map((entry) => entry.userId),
    ['user-a', 'user-b']
  );
  assert.equal(fetchCalls.length, 2);
  assert.equal(
    fetchCalls[1].url,
    'https://supabase.test/rest/v1/pending_digests?id=in.(digest-1,digest-2,digest-3)'
  );
  assert.equal(fetchCalls[1].method, 'DELETE');
  assert.equal(
    fetchCalls.some(
      (call) => call.method === 'DELETE' && call.url.includes('frequency=eq.daily_digest')
    ),
    false
  );
});
