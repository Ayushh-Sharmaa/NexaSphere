import { describe, it, expect } from 'vitest';
import { sumBy, avgBy, countBy, percentChange, extent, topN } from '../../utils/aggregation';

const registrations = [
  { region: 'North', registrations: 120 },
  { region: 'South', registrations: 80 },
  { region: 'North', registrations: 60 },
  { region: 'East', registrations: 40 },
];

describe('sumBy', () => {
  it('sums numeric selector values', () => {
    expect(sumBy(registrations, (r) => r.registrations)).toBe(300);
  });

  it('ignores non-finite values', () => {
    expect(sumBy([{ n: 5 }, { n: 'x' }, { n: null }], (x) => x.n)).toBe(5);
  });
});

describe('avgBy', () => {
  it('returns the mean', () => {
    expect(avgBy([2, 4, 6])).toBe(4);
  });

  it('returns null for empty or all-invalid input', () => {
    expect(avgBy([])).toBeNull();
    expect(avgBy([null, 'x'])).toBeNull();
  });
});

describe('countBy', () => {
  it('counts per bucket', () => {
    expect(countBy(registrations, (r) => r.region)).toEqual({ North: 2, South: 1, East: 1 });
  });

  it('accumulates a metric per bucket when provided', () => {
    const byRegion = countBy(registrations, (r) => r.region, (r) => r.registrations);
    expect(byRegion.North).toBe(180);
    expect(byRegion.South).toBe(80);
  });
});

describe('percentChange', () => {
  it('computes signed percentage change', () => {
    expect(percentChange(100, 150)).toBe(50);
    expect(percentChange(100, 50)).toBe(-50);
  });

  it('returns null for zero or invalid baseline', () => {
    expect(percentChange(0, 10)).toBeNull();
    expect(percentChange(null, 10)).toBeNull();
    expect(percentChange(10, null)).toBeNull();
  });
});

describe('extent', () => {
  it('returns min and max, skipping invalid values', () => {
    expect(extent([3, 1, 4, 1, 'x'])).toEqual({ min: 1, max: 4 });
  });

  it('returns nulls for empty input', () => {
    expect(extent([])).toEqual({ min: null, max: null });
  });
});

describe('topN', () => {
  it('returns the top n by selector', () => {
    const top = topN(registrations, (r) => r.registrations, 2);
    expect(top.map((r) => r.region)).toEqual(['North', 'South']);
  });

  it('supports ascending order', () => {
    const bottom = topN(registrations, (r) => r.registrations, 1, { order: 'asc' });
    expect(bottom[0].region).toBe('East');
  });
});
