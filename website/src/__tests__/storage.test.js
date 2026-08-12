import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStorage, storage } from '../utils/storage';

const PREFIX = 'test-ns';

function freshAdapter(backing) {
  return createStorage(PREFIX, backing);
}

describe('createStorage', () => {
  let backing;

  beforeEach(() => {
    backing = createMemoryStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores and reads raw string values', () => {
    const s = freshAdapter(backing);
    s.set('theme', 'dark');
    expect(s.get('theme')).toBe('dark');
  });

  it('namespaces keys to avoid collisions', () => {
    const a = freshAdapter(backing);
    const b = createStorage('other-ns', backing);
    a.set('shared', 'A');
    b.set('shared', 'B');
    expect(a.get('shared')).toBe('A');
    expect(b.get('shared')).toBe('B');
  });

  it('serialises and parses JSON', () => {
    const s = freshAdapter(backing);
    const payload = { name: 'nexa', tags: [1, 2, 3] };
    s.setJSON('profile', payload);
    expect(s.getJSON('profile')).toEqual(payload);
  });

  it('returns the fallback for missing or invalid JSON', () => {
    const s = freshAdapter(backing);
    expect(s.getJSON('missing', 'fb')).toBe('fb');
    s.set('broken', '{oops');
    expect(s.getJSON('broken', 'fb')).toBe('fb');
  });

  it('expires values past their TTL', () => {
    const s = freshAdapter(backing);
    vi.useFakeTimers();
    s.setJSONWithTTL('session', { user: 1 }, 1000);

    expect(s.getJSONWithTTL('session')).toEqual({ user: 1 });

    vi.advanceTimersByTime(1001);
    expect(s.getJSONWithTTL('session')).toBeNull();
    expect(s.get('session')).toBeNull();
    vi.useRealTimers();
  });

  it('returns the fallback for expired values', () => {
    const s = freshAdapter(backing);
    vi.useFakeTimers();
    s.setJSONWithTTL('token', 'abc', 500);
    vi.advanceTimersByTime(501);
    expect(s.getJSONWithTTL('token', 'expired')).toBe('expired');
    vi.useRealTimers();
  });

  it('removes single keys', () => {
    const s = freshAdapter(backing);
    s.set('a', '1');
    s.remove('a');
    expect(s.get('a')).toBeNull();
  });

  it('clears only its own namespace', () => {
    const s = freshAdapter(backing);
    const other = createStorage('other-ns', backing);
    s.set('x', '1');
    other.set('y', '2');

    s.clear();
    expect(s.get('x')).toBeNull();
    expect(other.get('y')).toBe('2');
  });

  it('falls back to memory when the engine throws on access', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
      key: () => null,
      length: 0,
      clear: () => {},
    };
    const s = createStorage(PREFIX, broken);
    expect(s.isPersistent()).toBe(false);

    s.set('k', 'v');
    expect(s.get('k')).toBe('v');
  });
});

describe('default storage export', () => {
  it('is an adapter instance', () => {
    expect(typeof storage.get).toBe('function');
    expect(typeof storage.setJSON).toBe('function');
  });
});

/**
 * Minimal in-memory Storage implementation with a stable API surface.
 */
function createMemoryStorage() {
  const map = new Map();
  let keyIndex = 0;
  return {
    get length() {
      return map.size;
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
    _keys() {
      keyIndex;
      return Array.from(map.keys());
    },
  };
}
