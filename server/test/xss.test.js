import assert from 'node:assert/strict';
import test from 'node:test';
import { xssSanitizer } from '../middleware/xssSanitizer.js';

test('XSS Sanitizer Middleware', async (t) => {
  await t.test('strips HTML tags and script elements from req.body', () => {
    const req = {
      body: {
        title: '<script>alert("XSS")</script>Hello World',
        nested: {
          bio: '<iframe src="javascript:alert(1)"></iframe>Safe Text',
          count: 42,
        },
        tags: ['<a href="javascript:alert(1)">Link</a>', 'safe'],
      },
    };
    const res = {};
    xssSanitizer(req, res, () => {});

    assert.equal(req.body.title, 'Hello World');
    assert.equal(req.body.nested.bio, 'Safe Text');
    assert.equal(req.body.nested.count, 42);
    assert.deepEqual(req.body.tags, ['Link', 'safe']);
  });

  await t.test('strips tags from req.query and req.params', () => {
    const req = {
      query: { search: '<img src=x onerror=alert(1)>Query' },
      params: { id: '<script></script>123' },
    };
    const res = {};
    xssSanitizer(req, res, () => {});

    assert.equal(req.query.search, 'Query');
    assert.equal(req.params.id, '123');
  });
});
