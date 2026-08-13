import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefersReducedMotion, useMotionPreference } from '../hooks/usePrefersReducedMotion';

const originalMatchMedia = window.matchMedia;

/**
 * Builds a matchMedia mock whose matches state is derived from the query.
 */
function mockMatchMedia(resolution) {
  const cache = {};
  window.matchMedia = vi.fn().mockImplementation((query) => {
    if (cache[query]) return cache[query];
    const queries = {
      '(prefers-reduced-motion: reduce)': resolution === 'reduce',
      '(prefers-reduced-motion: no-preference)': resolution === 'no-preference',
    };
    const listeners = new Set();
    const mql = {
      matches: Boolean(queries[query]),
      media: query,
      onchange: null,
      addEventListener: (type, listener) => {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener: (type, listener) => {
        if (type === 'change') listeners.delete(listener);
      },
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      dispatchEvent: vi.fn(),
    };
    mql._set = (value) => {
      mql.matches = value;
      const event = { matches: value };
      listeners.forEach((listener) => listener(event));
    };
    cache[query] = mql;
    return mql;
  });
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => mockMatchMedia('reduce'));
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when reduce is preferred', () => {
    mockMatchMedia('reduce');
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when the user has no motion preference', () => {
    mockMatchMedia('no-preference');
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns false when the media query is unsupported', () => {
    window.matchMedia = undefined;
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('flips to true when the OS preference changes at runtime', () => {
    mockMatchMedia('no-preference');
    const { result } = renderHook(() => usePrefersReducedMotion());

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    expect(result.current).toBe(false);

    act(() => {
      mql._set(true);
    });
    expect(result.current).toBe(true);
  });
});

describe('useMotionPreference', () => {
  beforeEach(() => mockMatchMedia('reduce'));
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns "reduce" when reduced motion is requested', () => {
    mockMatchMedia('reduce');
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current).toBe('reduce');
  });

  it('returns "no-preference" when the user opts in', () => {
    mockMatchMedia('no-preference');
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current).toBe('no-preference');
  });

  it('returns "unset" when neither value matches', () => {
    mockMatchMedia('unset');
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current).toBe('unset');
  });
});
