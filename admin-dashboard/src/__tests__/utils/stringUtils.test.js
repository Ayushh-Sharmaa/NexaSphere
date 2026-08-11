import { describe, it, expect } from 'vitest';
import {
  slugify,
  maskString,
  maskEmail,
  stripHtml,
  truncate,
  capitalize,
  escapeHtml,
  unescapeHtml,
} from '../../utils/stringUtils';

describe('stringUtils', () => {
  describe('slugify', () => {
    it('creates a slug from a normal string', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });
    it('handles special characters', () => {
      expect(slugify('Hello @World!')).toBe('hello-world');
    });
    it('handles null or empty string', () => {
      expect(slugify(null)).toBe('');
      expect(slugify('')).toBe('');
    });
  });

  describe('maskString', () => {
    it('masks the middle of a string', () => {
      expect(maskString('12345678', 2, 2)).toBe('12****78');
    });
    it('returns full mask if string is too short', () => {
      expect(maskString('123', 2, 2)).toBe('***');
    });
    it('handles null or empty string', () => {
      expect(maskString(null)).toBe('');
      expect(maskString('')).toBe('');
    });
  });

  describe('maskEmail', () => {
    it('masks an email address', () => {
      expect(maskEmail('johndoe@example.com')).toBe('jo*****@example.com');
    });
    it('handles short local parts', () => {
      expect(maskEmail('me@example.com')).toBe('**@example.com');
    });
    it('handles invalid email gracefully', () => {
      expect(maskEmail('invalid-email')).toBe('invalid-email');
      expect(maskEmail(null)).toBe(null);
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });
    it('handles null or empty string', () => {
      expect(stripHtml(null)).toBe('');
    });
  });

  describe('truncate', () => {
    it('truncates a long string', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });
    it('does not truncate a short string', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });
    it('handles null or empty string', () => {
      expect(truncate(null)).toBe('');
    });
  });

  describe('capitalize', () => {
    it('capitalizes the first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });
    it('handles null or empty string', () => {
      expect(capitalize(null)).toBe('');
    });
  });

  describe('escapeHtml / unescapeHtml', () => {
    it('escapes and unescapes HTML correctly', () => {
      const original = '<div>Hello & "Welcome"</div>';
      const escaped = escapeHtml(original);
      expect(escaped).toBe('&lt;div&gt;Hello &amp; &quot;Welcome&quot;&lt;/div&gt;');
      expect(unescapeHtml(escaped)).toBe(original);
    });
    it('handles null or empty string', () => {
      expect(escapeHtml(null)).toBe('');
      expect(unescapeHtml(null)).toBe('');
    });
  });
});
