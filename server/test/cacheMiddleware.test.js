import assert from 'node:assert/strict';
import test from 'node:test';

import { cacheResponse } from '../middleware/cacheMiddleware.js';
import { cacheService } from '../services/cacheService.js';

test('cacheResponse continues when cache read fails', async () => {
  const originalGet = cacheService.get;
  cacheService.get = async () => {
    throw new Error('redis down');
  };

  try {
    let nextCalled = false;
    const middleware = cacheResponse(60);
    const req = { originalUrl: '/api/events' };
    const res = {
      statusCode: 200,
      setHeader() {},
      json() {},
    };

    await assert.doesNotReject(() =>
      middleware(req, res, () => {
        nextCalled = true;
      })
    );

    assert.equal(nextCalled, true);
  } finally {
    cacheService.get = originalGet;
  }
});
