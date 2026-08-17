import { describe, it, expect } from 'vitest';
import {
  isRequired,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidUsername,
  isValidHexColor,
  isValidPin,
  getPasswordStrength,
  isLengthInRange,
  isSafeLink,
} from '../utils/validators';

describe('isRequired', () => {
  it('rejects empty and whitespace-only strings', () => {
    expect(isRequired('')).toBe(false);
    expect(isRequired('   ')).toBe(false);
  });

  it('accepts non-empty strings, numbers and non-null values', () => {
    expect(isRequired('hello')).toBe(true);
    expect(isRequired(0)).toBe(true);
    expect(isRequired(42)).toBe(true);
    expect(isRequired({})).toBe(true);
  });

  it('rejects null and undefined', () => {
    expect(isRequired(null)).toBe(false);
    expect(isRequired(undefined)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts common email shapes', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('first.last@glbajajgroup.org')).toBe(true);
    expect(isValidEmail('user+tag@sub.domain.co')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('accepts http, https and scheme-less URLs', () => {
    expect(isValidUrl('https://nexasphere.com')).toBe(true);
    expect(isValidUrl('http://localhost:8787/api/events')).toBe(true);
    expect(isValidUrl('nexasphere.com/events')).toBe(true);
  });

  it('rejects non-URLs', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('hello world')).toBe(false);
    expect(isValidUrl(123)).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts formatted phone numbers', () => {
    expect(isValidPhone('+91 98765 43210')).toBe(true);
    expect(isValidPhone('(555) 123-4567')).toBe(true);
    expect(isValidPhone('1234567890')).toBe(true);
  });

  it('rejects strings that are not phone numbers', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('abc')).toBe(false);
    expect(isValidPhone('12')).toBe(false);
  });
});

describe('isValidUsername', () => {
  it('accepts valid usernames', () => {
    expect(isValidUsername('ayush_sharma')).toBe(true);
    expect(isValidUsername('NexaSphere')).toBe(true);
    expect(isValidUsername('abc123')).toBe(true);
  });

  it('rejects too short, too long or illegal usernames', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(31))).toBe(false);
    expect(isValidUsername('has space')).toBe(false);
    expect(isValidUsername('with-dash')).toBe(false);
  });
});

describe('isValidHexColor', () => {
  it('accepts 3 and 6 digit hex colours', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#FF5733')).toBe(true);
    expect(isValidHexColor('#0a0a0a')).toBe(true);
  });

  it('rejects invalid colours', () => {
    expect(isValidHexColor('red')).toBe(false);
    expect(isValidHexColor('#gggggg')).toBe(false);
    expect(isValidHexColor('#12345')).toBe(false);
  });
});

describe('isValidPin', () => {
  it('accepts 4-6 digit pins', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
  });

  it('rejects non-numeric or wrong-length pins', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12ab')).toBe(false);
  });
});

describe('getPasswordStrength', () => {
  it('returns 0 for empty input', () => {
    expect(getPasswordStrength('')).toBe(0);
    expect(getPasswordStrength(null)).toBe(0);
  });

  it('adds a point for each criterion', () => {
    expect(getPasswordStrength('short1!')).toBe(2); // length<8, no mixed case
    expect(getPasswordStrength('Longerpass1!')).toBe(4);
    expect(getPasswordStrength('lower')).toBe(0);
    expect(getPasswordStrength('MixedCase123')).toBe(3);
  });
});

describe('isLengthInRange', () => {
  it('checks trimmed length against inclusive bounds', () => {
    expect(isLengthInRange('hello', 3, 10)).toBe(true);
    expect(isLengthInRange('  hi  ', 2, 2)).toBe(true);
    expect(isLengthInRange('hello', 6, 10)).toBe(false);
    expect(isLengthInRange('hello world', 3, 5)).toBe(false);
    expect(isLengthInRange(5, 1, 10)).toBe(false);
  });
});

describe('isSafeLink', () => {
  it('allows http(s) and same-origin relative links', () => {
    expect(isSafeLink('https://example.com')).toBe(true);
    expect(isSafeLink('/events/3')).toBe(true);
  });

  it('rejects dangerous schemes', () => {
    expect(isSafeLink('javascript:alert(1)')).toBe(false);
    expect(isSafeLink('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeLink('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeLink('file:///etc/passwd')).toBe(false);
  });

  it('rejects non-URL garbage', () => {
    expect(isSafeLink('not a link')).toBe(false);
    expect(isSafeLink('')).toBe(false);
  });
});
