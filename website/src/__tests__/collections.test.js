import { describe, it, expect } from 'vitest';
import {
  groupBy,
  sortBy,
  uniqueBy,
  chunk,
  partition,
  sumBy,
  countBy,
  topN,
} from '../utils/collections';

const people = [
  { name: 'Alice', team: 'core', score: 90 },
  { name: 'Bob', team: 'core', score: 60 },
  { name: 'Carol', team: 'design', score: 75 },
  { name: 'Dave', team: 'design', score: 40 },
];

describe('groupBy', () => {
  it('groups items by the selected key', () => {
    const groups = groupBy(people, (p) => p.team);
    expect(groups.core.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(groups.design.map((p) => p.name)).toEqual(['Carol', 'Dave']);
  });

  it('handles an empty array', () => {
    expect(groupBy([], (x) => x)).toEqual({});
  });
});

describe('sortBy', () => {
  it('sorts ascending by default without mutating input', () => {
    const sorted = sortBy(people, (p) => p.score);
    expect(sorted.map((p) => p.name)).toEqual(['Dave', 'Bob', 'Carol', 'Alice']);
    expect(people[0].name).toBe('Alice');
  });

  it('sorts descending', () => {
    const sorted = sortBy(people, (p) => p.score, { order: 'desc' });
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[3].name).toBe('Dave');
  });

  it('pushes nullish values to the end', () => {
    const rows = [{ v: 2 }, { v: null }, { v: 1 }, { v: undefined }];
    expect(sortBy(rows, (r) => r.v).map((r) => r.v)).toEqual([1, 2, null, undefined]);
  });
});

describe('uniqueBy', () => {
  it('keeps the first occurrence per key', () => {
    const dupes = [
      { id: 1, tag: 'a' },
      { id: 2, tag: 'a' },
      { id: 3, tag: 'b' },
    ];
    expect(uniqueBy(dupes, (d) => d.tag).map((d) => d.id)).toEqual([1, 3]);
  });
});

describe('chunk', () => {
  it('splits arrays into fixed-size chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when size exceeds length', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('rejects invalid sizes', () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
  });
});

describe('partition', () => {
  it('splits items by predicate', () => {
    const [pass, rest] = partition(people, (p) => p.score >= 70);
    expect(pass.map((p) => p.name)).toEqual(['Alice', 'Carol']);
    expect(rest.map((p) => p.name)).toEqual(['Bob', 'Dave']);
  });
});

describe('sumBy', () => {
  it('sums numeric selector values', () => {
    expect(sumBy(people, (p) => p.score)).toBe(265);
  });

  it('ignores non-finite values', () => {
    expect(sumBy([{ n: 5 }, { n: 'x' }, { n: null }], (x) => x.n)).toBe(5);
  });
});

describe('countBy', () => {
  it('counts occurrences per key', () => {
    expect(countBy(people, (p) => p.team)).toEqual({ core: 2, design: 2 });
  });
});

describe('topN', () => {
  it('returns the top n ranked items', () => {
    const top = topN(people, (p) => p.score, 2);
    expect(top.map((p) => p.name)).toEqual(['Alice', 'Carol']);
  });

  it('supports ascending ranking', () => {
    const bottom = topN(people, (p) => p.score, 2, { order: 'asc' });
    expect(bottom.map((p) => p.name)).toEqual(['Dave', 'Bob']);
  });
});
