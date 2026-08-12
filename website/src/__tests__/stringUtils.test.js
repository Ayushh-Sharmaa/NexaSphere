import { describe, it, expect } from 'vitest';
import {
  slugify,
  capitalize,
  titleCase,
  truncateMiddle,
  maskEmail,
  maskPhone,
  stripHtml,
  countWords,
  camelToKebab,
} from '../utils/stringUtils';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Event 3: Hack-a-thon!')).toBe('event-3-hack-a-thon');
  });

  it('strips accents', () => {
    expect(slugify('Café résumé')).toBe('cafe-resume');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  --Hello World--  ')).toBe('hello-world');
  });

  it('returns the fallback for empty input', () => {
    expect(slugify('')).toBe('untitled');
    expect(slugify('!!!')).toBe('untitled');
    expect(slugify(null)).toBe('untitled');
  });
});

describe('capitalize', () => {
  it('capitalises the first letter', () => {
    expect(capitalize('nexasphere')).toBe('Nexasphere');
    expect(capitalize('already')).toBe('Already');
  });

  it('handles empty and non-string input', () => {
    expect(capitalize('')).toBe('');
    expect(capitalize(null)).toBe('');
  });
});

describe('titleCase', () => {
  it('capitalises every word', () => {
    expect(titleCase('hACK-a-THON event')).toBe('Hack-a-thon Event');
  });

  it('collapses extra whitespace', () => {
    expect(titleCase('  open   source   day  ')).toBe('Open Source Day');
  });

  it('handles non-strings', () => {
    expect(titleCase(42)).toBe('');
  });
});

describe('truncateMiddle', () => {
  it('keeps head and tail with an ellipsis', () => {
    expect(truncateMiddle('0xabcdef1234567890', 6, 4)).toBe('0xabcd...7890');
  });

  it('leaves short strings untouched', () => {
    expect(truncateMiddle('short', 2, 2)).toBe('short');
  });
});

describe('maskEmail', () => {
  it('masks the local part and keeps the domain', () => {
    expect(maskEmail('jane@example.com')).toBe('j***@example.com');
  });

  it('returns empty for invalid input', () => {
    expect(maskEmail('not-an-email')).toBe('');
    expect(maskEmail(null)).toBe('');
  });
});

describe('maskPhone', () => {
  it('keeps the last four digits', () => {
    expect(maskPhone('+91 98765 43210')).toBe('******** 3210');
  });

  it('returns a generic mask when too short', () => {
    expect(maskPhone('12')).toBe('****');
    expect(maskPhone('')).toBe('****');
  });
});

describe('stripHtml', () => {
  it('removes tags but keeps text', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('drops script and style blocks entirely', () => {
    const html = '<p>Safe</p><script>alert(1)</script><style>.x{}</style>';
    expect(stripHtml(html)).toBe('Safe');
  });

  it('handles non-strings', () => {
    expect(stripHtml(null)).toBe('');
  });
});

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('hello world')).toBe(2);
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });
});

describe('camelToKebab', () => {
  it('converts camelCase and PascalCase', () => {
    expect(camelToKebab('eventBudgetPage')).toBe('event-budget-page');
    expect(camelToKebab('EventBudgetPage')).toBe('event-budget-page');
    expect(camelToKebab('HTTPServer')).toBe('http-server');
  });
});
