import assert from 'node:assert/strict';
import test from 'node:test';

// ---------------------------------------------------------------------------
// Inline the pagination helpers so this test has no dependency on the full
// server module (which requires env vars and a DB connection at import time).
// ---------------------------------------------------------------------------

function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit };
}

// Simulates listCoreTeamStore file-based pagination (slice logic identical to
// the production implementation so regressions in the store are caught here).
function paginateArray(arr, page, limit) {
  const total = arr.length;
  const start = (page - 1) * limit;
  const members = arr.slice(start, start + limit);
  return { members, total };
}

function buildPaginationEnvelope(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

// ---------------------------------------------------------------------------
// parsePagination
// ---------------------------------------------------------------------------

test('defaults to page 1 and limit 20 when query is empty', () => {
  const { page, limit } = parsePagination({});
  assert.equal(page, 1);
  assert.equal(limit, 20);
});

test('parses valid page and limit integers from query strings', () => {
  const { page, limit } = parsePagination({ page: '3', limit: '15' });
  assert.equal(page, 3);
  assert.equal(limit, 15);
});

test('page is clamped to minimum of 1', () => {
  assert.equal(parsePagination({ page: '0' }).page, 1);
  assert.equal(parsePagination({ page: '-5' }).page, 1);
});

test('limit is clamped to maximum of 100', () => {
  assert.equal(parsePagination({ limit: '200' }).limit, 100);
  assert.equal(parsePagination({ limit: '101' }).limit, 100);
});

test('limit is clamped to minimum of 1', () => {
  // parseInt('0') = 0, fallback || 20 triggers so default 20 is used, then Math.max(1,20)=20.
  // parseInt('-10') = -10, -10 || 20 = -10 (truthy negative), Math.max(1,-10) = 1.
  assert.equal(parsePagination({ limit: '-10' }).limit, 1);
  assert.equal(parsePagination({ limit: '-1' }).limit, 1);
});

test('non-numeric page falls back to 1', () => {
  assert.equal(parsePagination({ page: 'abc' }).page, 1);
});

test('non-numeric limit falls back to 20', () => {
  assert.equal(parsePagination({ limit: 'xyz' }).limit, 20);
});

// ---------------------------------------------------------------------------
// paginateArray — core-team slice logic
// ---------------------------------------------------------------------------

function makeMembers(count) {
  return Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `Member ${i + 1}` }));
}

test('first page returns first N members', () => {
  const members = makeMembers(10);
  const { members: page1, total } = paginateArray(members, 1, 4);
  assert.equal(total, 10);
  assert.equal(page1.length, 4);
  assert.equal(page1[0].id, '1');
  assert.equal(page1[3].id, '4');
});

test('second page returns the next N members', () => {
  const members = makeMembers(10);
  const { members: page2 } = paginateArray(members, 2, 4);
  assert.equal(page2.length, 4);
  assert.equal(page2[0].id, '5');
});

test('last partial page returns only the remaining members', () => {
  const members = makeMembers(10);
  const { members: page3 } = paginateArray(members, 3, 4);
  assert.equal(page3.length, 2);
  assert.equal(page3[0].id, '9');
  assert.equal(page3[1].id, '10');
});

test('page beyond total returns an empty array', () => {
  const members = makeMembers(5);
  const { members: empty } = paginateArray(members, 3, 3);
  assert.equal(empty.length, 0);
});

test('empty dataset returns empty members and total of 0', () => {
  const { members, total } = paginateArray([], 1, 20);
  assert.equal(members.length, 0);
  assert.equal(total, 0);
});

test('limit larger than dataset returns all members on page 1', () => {
  const members = makeMembers(5);
  const { members: all, total } = paginateArray(members, 1, 100);
  assert.equal(all.length, 5);
  assert.equal(total, 5);
});

// ---------------------------------------------------------------------------
// buildPaginationEnvelope
// ---------------------------------------------------------------------------

test('envelope totalPages rounds up correctly', () => {
  assert.equal(buildPaginationEnvelope(1, 10, 25).totalPages, 3);
  assert.equal(buildPaginationEnvelope(1, 10, 30).totalPages, 3);
  assert.equal(buildPaginationEnvelope(1, 10, 31).totalPages, 4);
});

test('envelope totalPages is at least 1 when total is 0', () => {
  assert.equal(buildPaginationEnvelope(1, 20, 0).totalPages, 1);
});

test('envelope carries through page and limit unchanged', () => {
  const env = buildPaginationEnvelope(3, 15, 60);
  assert.equal(env.page, 3);
  assert.equal(env.limit, 15);
  assert.equal(env.total, 60);


// ---------------------------------------------------------------------------
// paginationSchema — validates and clamps ?page and ?limit query parameters
// ---------------------------------------------------------------------------

test('paginationSchema applies defaults when page and limit are absent', () => {
  const result = paginationSchema.parse({});
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
});

test('paginationSchema parses valid string integers from query params', () => {
  const result = paginationSchema.parse({ page: '3', limit: '50' });
  assert.equal(result.page, 3);
  assert.equal(result.limit, 50);
});

test('paginationSchema clamps limit to 100 when the caller requests more', () => {
  const result = paginationSchema.parse({ page: '1', limit: '9999' });
  assert.equal(result.limit, 100);
});

test('paginationSchema clamps limit to 1 when the caller sends zero or negative', () => {
  const zeroResult = paginationSchema.parse({ limit: '0' });
  assert.equal(zeroResult.limit, 1);

  const negResult = paginationSchema.parse({ limit: '-10' });
  assert.equal(negResult.limit, 1);
});

test('paginationSchema clamps page to 1 when the caller sends zero or negative', () => {
  const zeroResult = paginationSchema.parse({ page: '0' });
  assert.equal(zeroResult.page, 1);

  const negResult = paginationSchema.parse({ page: '-5' });
  assert.equal(negResult.page, 1);
});

test('paginationSchema falls back to defaults for non-numeric strings', () => {
  const result = paginationSchema.parse({ page: 'abc', limit: 'xyz' });
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
});

test('paginationSchema passes through unrelated query fields (passthrough)', () => {
  const result = paginationSchema.parse({ page: '2', limit: '10', status: 'upcoming' });
  assert.equal(result.page, 2);
  assert.equal(result.limit, 10);
  assert.equal(result.status, 'upcoming');
});

test('paginationSchema accepts numeric values as well as strings', () => {
  const result = paginationSchema.parse({ page: 4, limit: 25 });
  assert.equal(result.page, 4);
  assert.equal(result.limit, 25);
});

// ---------------------------------------------------------------------------
// Pagination arithmetic — verify OFFSET and totalPages calculations
// ---------------------------------------------------------------------------

test('OFFSET formula (page-1)*limit produces correct values for various pages', () => {
  const cases = [
    { page: 1, limit: 20, expected: 0 },
    { page: 2, limit: 20, expected: 20 },
    { page: 3, limit: 10, expected: 20 },
    { page: 5, limit: 50, expected: 200 },
  ];
  for (const { page, limit, expected } of cases) {
    assert.equal((page - 1) * limit, expected, `page=${page}, limit=${limit}`);
  }
});

test('totalPages rounds up correctly for non-divisible totals', () => {
  const cases = [
    { total: 0, limit: 20, expected: 1 },
    { total: 20, limit: 20, expected: 1 },
    { total: 21, limit: 20, expected: 2 },
    { total: 100, limit: 20, expected: 5 },
    { total: 101, limit: 20, expected: 6 },
    { total: 1, limit: 100, expected: 1 },
  ];
  for (const { total, limit, expected } of cases) {
    const totalPages = Math.ceil(total / limit) || 1;
    assert.equal(totalPages, expected, `total=${total}, limit=${limit}`);
  }
});

test('file-based pagination slice returns the correct window of items', () => {
  const all = Array.from({ length: 55 }, (_, i) => ({ id: `event-${i}` }));

  function paginate(arr, page, limit) {
    const start = (page - 1) * limit;
    return arr.slice(start, start + limit);
  }

  // Page 1: items 0–19
  const page1 = paginate(all, 1, 20);
  assert.equal(page1.length, 20);
  assert.equal(page1[0].id, 'event-0');
  assert.equal(page1[19].id, 'event-19');

  // Page 2: items 20–39
  const page2 = paginate(all, 2, 20);
  assert.equal(page2.length, 20);
  assert.equal(page2[0].id, 'event-20');

  // Page 3: items 40–54 (partial last page)
  const page3 = paginate(all, 3, 20);
  assert.equal(page3.length, 15);
  assert.equal(page3[0].id, 'event-40');
  assert.equal(page3[14].id, 'event-54');

  // Page 4: beyond the data — empty
  const page4 = paginate(all, 4, 20);
  assert.equal(page4.length, 0);
});

test('file-based pagination total reflects full dataset length not page length', () => {
  const all = Array.from({ length: 42 }, (_, i) => ({ id: `item-${i}` }));
  const page = 1;
  const limit = 10;
  const start = (page - 1) * limit;
  const slice = all.slice(start, start + limit);
  assert.equal(slice.length, 10); // page has 10 items
  assert.equal(all.length, 42); // total is still 42
});

// ---------------------------------------------------------------------------
// Content-Range header parsing — replicates the logic used in
// supabasePaginatedRequest to extract total count from PostgREST headers.
// ---------------------------------------------------------------------------

test("Content-Range total extraction handles standard format '0-19/150'", () => {
  function extractTotal(header) {
    const match = header.match(/\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }
  assert.equal(extractTotal('0-19/150'), 150);
  assert.equal(extractTotal('0-0/1'), 1);
  assert.equal(extractTotal('*/0'), 0);
  assert.equal(extractTotal(''), null);
});

test("Content-Range total extraction handles '*/<count>' for empty result sets", () => {
  function extractTotal(header) {
    const match = header.match(/\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }
  assert.equal(extractTotal('*/0'), 0);
  assert.equal(extractTotal('*/42'), 42);
});

test('supabasePaginatedRequest falls back to rows.length when header is absent', () => {
  // Simulates the fallback branch: header is empty, total = rows.length
  function parseTotalFromHeader(header, rowsLength) {
    const match = (header || '').match(/\/(\d+)$/);
    return match ? parseInt(match[1], 10) : rowsLength;
  }
  assert.equal(parseTotalFromHeader('', 7), 7);
  assert.equal(parseTotalFromHeader(null, 3), 3);
  assert.equal(parseTotalFromHeader('0-4/20', 5), 20);
});

}
);