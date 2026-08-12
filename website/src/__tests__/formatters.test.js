import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  pluralize,
  truncate,
  ordinal,
  formatCompact,
} from '../utils/formatters';

describe('formatNumber', () => {
  it('formats integers with thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('keeps the requested number of decimals', () => {
    expect(formatNumber(3.14159, 2)).toBe('3.14');
  });

  it('falls back to the raw value for unparseable input', () => {
    expect(formatNumber('nope')).toBe('nope');
    expect(formatNumber(undefined)).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats using the given currency', () => {
    expect(formatCurrency(1500, { currency: 'INR' })).toContain('₹');
    expect(formatCurrency(1500, { currency: 'USD' })).toContain('$');
  });

  it('respects decimal precision', () => {
    expect(formatCurrency(9.5, { currency: 'USD', decimals: 2 })).toContain('9.50');
  });

  it('handles invalid input gracefully', () => {
    expect(formatCurrency(null)).toBe('');
  });
});

describe('formatPercent', () => {
  it('scales a 0-1 ratio to a percentage', () => {
    expect(formatPercent(0.423)).toBe('42%');
  });

  it('supports decimals and pre-scaled values', () => {
    expect(formatPercent(0.423, { decimals: 1 })).toBe('42.3%');
    expect(formatPercent(42.3, { isScaled: true })).toBe('42%');
  });

  it('handles invalid input gracefully', () => {
    expect(formatPercent('x')).toBe('x');
  });
});

describe('formatBytes', () => {
  it('formats bytes, KB, MB and GB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 ** 2)).toBe('5 MB');
  });

  it('respects decimal precision and trims trailing zeros', () => {
    expect(formatBytes(1.5 * 1024 ** 2, 1)).toBe('1.5 MB');
    expect(formatBytes(2 * 1024 ** 2, 1)).toBe('2 MB');
  });

  it('rejects negative or invalid sizes', () => {
    expect(formatBytes(-5)).toBe('0 B');
    expect(formatBytes('nope')).toBe('0 B');
  });
});

describe('pluralize', () => {
  it('returns singular for 1 and plural otherwise', () => {
    expect(pluralize(1, 'attendee')).toBe('attendee');
    expect(pluralize(0, 'attendee')).toBe('attendees');
    expect(pluralize(5, 'attendee')).toBe('attendees');
  });

  it('honours an explicit plural form', () => {
    expect(pluralize(3, 'person', 'people')).toBe('people');
  });
});

describe('truncate', () => {
  it('leaves short strings untouched', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates with an ellipsis', () => {
    expect(truncate('a very long title here', 12)).toBe('a very lo...');
    expect(truncate('hello', 4)).toBe('h...');
  });

  it('handles non-strings', () => {
    expect(truncate(null, 5)).toBe('');
  });
});

describe('ordinal', () => {
  it('handles the 11-13 special case', () => {
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
    expect(ordinal(13)).toBe('13th');
  });

  it('handles regular ordinals', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(21)).toBe('21st');
    expect(ordinal(22)).toBe('22nd');
    expect(ordinal(100)).toBe('100th');
  });
});

describe('formatCompact', () => {
  it('leaves small numbers as integers', () => {
    expect(formatCompact(999)).toBe('999');
  });

  it('abbreviates thousands and millions', () => {
    expect(formatCompact(1200)).toMatch(/1\.2K|1,200|1.2/);
    expect(formatCompact(3400000)).toMatch(/3\.4M|3,400,000/);
  });
});
