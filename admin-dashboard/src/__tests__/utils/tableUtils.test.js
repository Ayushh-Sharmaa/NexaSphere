import { describe, it, expect } from 'vitest';
import {
  getNestedValue,
  compareValues,
  sortRows,
  filterRows,
  paginate,
  buildQueryString,
} from '../../utils/tableUtils';

const rows = [
  { id: 3, user: { name: 'Alice' }, score: 90, joined: '2025-01-10' },
  { id: 1, user: { name: 'bob' }, score: 60, joined: '2025-02-05' },
  { id: 2, user: { name: 'Carol' }, score: 75, joined: '2025-01-20' },
];

describe('getNestedValue', () => {
  it('reads plain keys and dot-paths', () => {
    expect(getNestedValue(rows[0], 'id')).toBe(3);
    expect(getNestedValue(rows[0], 'user.name')).toBe('Alice');
  });

  it('returns undefined for missing paths', () => {
    expect(getNestedValue(rows[0], 'user.missing')).toBeUndefined();
    expect(getNestedValue(null, 'id')).toBeUndefined();
  });
});

describe('compareValues', () => {
  it('sorts nullish values last', () => {
    expect(compareValues(null, 5)).toBe(1);
    expect(compareValues(5, null)).toBe(-1);
    expect(compareValues(null, null)).toBe(0);
  });

  it('compares dates numerically', () => {
    expect(compareValues('2025-01-10', '2025-02-05')).toBeLessThan(0);
  });

  it('compares numbers and strings', () => {
    expect(compareValues(10, 2)).toBeGreaterThan(0);
    expect(compareValues('apple', 'banana')).toBeLessThan(0);
  });
});

describe('sortRows', () => {
  it('sorts ascending by key without mutating input', () => {
    const sorted = sortRows(rows, 'score');
    expect(sorted.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(rows[0].id).toBe(3);
  });

  it('sorts descending', () => {
    const sorted = sortRows(rows, 'score', 'desc');
    expect(sorted[0].id).toBe(3);
  });

  it('supports nested dot-paths', () => {
    const sorted = sortRows(rows, 'user.name');
    expect(sorted[0].user.name).toBe('Alice');
  });

  it('sorts date strings chronologically', () => {
    const sorted = sortRows(rows, 'joined');
    expect(sorted.map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it('returns a copy when no key is given', () => {
    expect(sortRows(rows, null)).toEqual(rows);
  });
});

describe('filterRows', () => {
  it('matches case-insensitively across columns', () => {
    expect(filterRows(rows, 'alice', ['user.name'])).toHaveLength(1);
    expect(filterRows(rows, '75', ['score'])).toHaveLength(1);
  });

  it('returns all rows for an empty query', () => {
    expect(filterRows(rows, '', ['user.name'])).toHaveLength(3);
  });
});

describe('paginate', () => {
  it('returns one page with metadata', () => {
    const result = paginate(rows, 1, 2);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it('clamps out-of-range pages', () => {
    expect(paginate(rows, 99, 2).page).toBe(2);
    expect(paginate(rows, -5, 2).page).toBe(1);
  });

  it('handles empty collections', () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
  });
});

describe('buildQueryString', () => {
  it('serialises params and skips empty values', () => {
    expect(buildQueryString({ page: 2, search: 'react', empty: '' })).toBe('?page=2&search=react');
  });

  it('encodes special characters', () => {
    expect(buildQueryString({ q: 'a b&c' })).toBe('?q=a%20b%26c');
  });

  it('returns an empty string for no params', () => {
    expect(buildQueryString({})).toBe('');
  });
});
