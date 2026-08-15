import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  toDate,
  addDays,
  startOfDay,
  endOfDay,
  isToday,
  isPast,
  isFuture,
  isWithinDays,
  daysBetween,
  formatDateRange,
  toISODate,
} from '../utils/dateUtils';

const DAY = 24 * 60 * 60 * 1000;

describe('toDate', () => {
  it('parses Date, ISO string and timestamp', () => {
    const d = new Date('2025-06-10T10:00:00Z');
    expect(toDate(d).getTime()).toBe(d.getTime());
    expect(toDate('2025-06-10T10:00:00Z').getTime()).toBe(d.getTime());
    expect(toDate(d.getTime()).getTime()).toBe(d.getTime());
  });

  it('returns null for invalid input', () => {
    expect(toDate(null)).toBeNull();
    expect(toDate('not-a-date')).toBeNull();
    expect(toDate(new Date('invalid'))).toBeNull();
  });
});

describe('addDays', () => {
  it('adds and subtracts days', () => {
    const base = new Date(2025, 0, 10);
    expect(addDays(base, 5).getDate()).toBe(15);
    expect(addDays(base, -3).getDate()).toBe(7);
  });

  it('does not mutate the input', () => {
    const base = new Date(2025, 0, 10);
    addDays(base, 5);
    expect(base.getDate()).toBe(10);
  });
});

describe('startOfDay / endOfDay', () => {
  it('zeroes and maxes the time components', () => {
    const d = new Date(2025, 5, 15, 14, 30, 45, 123);
    const start = startOfDay(d);
    const end = endOfDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });
});

describe('isToday', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns true for now and false for other days', () => {
    expect(isToday(new Date())).toBe(true);
    expect(isToday(new Date(Date.now() - DAY))).toBe(false);
  });

  it('returns false for invalid input', () => {
    expect(isToday(null)).toBe(false);
  });
});

describe('isPast / isFuture', () => {
  it('classifies relative to now', () => {
    expect(isPast(Date.now() - DAY)).toBe(true);
    expect(isPast(Date.now() + DAY)).toBe(false);
    expect(isFuture(Date.now() + DAY)).toBe(true);
    expect(isFuture(Date.now() - DAY)).toBe(false);
  });

  it('returns false for invalid input', () => {
    expect(isPast(null)).toBe(false);
    expect(isFuture(null)).toBe(false);
  });
});

describe('isWithinDays', () => {
  it('includes the inclusive window edges', () => {
    expect(isWithinDays(Date.now(), 1)).toBe(true);
    expect(isWithinDays(Date.now() + DAY, 1)).toBe(true);
    expect(isWithinDays(Date.now() + 2 * DAY, 1)).toBe(false);
  });
});

describe('daysBetween', () => {
  it('computes whole-day differences', () => {
    expect(daysBetween('2025-01-01', '2025-01-04')).toBe(3);
    expect(daysBetween('2025-01-04', '2025-01-01')).toBe(-3);
  });

  it('returns null for invalid input', () => {
    expect(daysBetween('bad', '2025-01-01')).toBeNull();
  });
});

describe('formatDateRange', () => {
  it('collapses same-day ranges', () => {
    const out = formatDateRange('2025-06-10', '2025-06-10');
    expect(out).not.toContain('–');
  });

  it('renders multi-day ranges with a separator', () => {
    const out = formatDateRange('2025-06-10', '2025-06-14');
    expect(out).toContain('–');
    expect(out).toContain('Jun');
  });

  it('returns null for invalid input', () => {
    expect(formatDateRange(null)).toBeNull();
  });
});

describe('toISODate', () => {
  it('formats YYYY-MM-DD with padding', () => {
    expect(toISODate(new Date(2025, 5, 9))).toBe('2025-06-09');
    expect(toISODate('2025-12-31T12:00:00Z').slice(0, 10)).toBe('2025-12-31');
  });

  it('returns null for invalid input', () => {
    expect(toISODate(null)).toBeNull();
  });
});
