import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../hooks/useMediaQuery';

const originalMatchMedia = window.matchMedia;

/**
 * Creates a `matchMedia` mock whose `.matches` value can be mutated after the
 * fact. The returned object exposes a `set` helper that flips the matches flag
 * and dispatches the listeners, mirroring a real `change` event.
 */
function createMatchMediaMock(initialMatches) {
  const listeners = new Set();
  const mql = {
    matches: initialMatches,
    media: '',
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
  mql.set = (value) => {
    mql.matches = value;
    const event = { matches: value };
    listeners.forEach((listener) => listener(event));
    if (typeof mql.onchange === 'function') mql.onchange(event);
  };
  return mql;
}

describe('useMediaQuery', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => {
      const mql = createMatchMediaMock(query === '(min-width: 768px)');
      mql.media = query;
      return mql;
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when the query matches', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 400px)'));
    expect(result.current).toBe(false);
  });

  it('re-evaluates the query when the query string changes', () => {
    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(min-width: 768px)' },
    });
    expect(result.current).toBe(true);

    rerender({ query: '(min-width: 9999px)' });
    expect(result.current).toBe(false);
  });

  it('updates the match state when the underlying media query changes', () => {
    const mql = createMatchMediaMock(false);
    window.matchMedia = vi.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      mql.set(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      mql.set(false);
    });
    expect(result.current).toBe(false);
  });

  it('removes the change listener on unmount', () => {
    const mql = createMatchMediaMock(true);
    window.matchMedia = vi.fn().mockReturnValue(mql);

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    const removeSpy = vi.spyOn(mql, 'removeEventListener');

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('returns defaultValue when matchMedia is unavailable', () => {
    window.matchMedia = undefined;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    const { result: withDefault } = renderHook(() =>
      useMediaQuery('(min-width: 768px)', { defaultValue: true })
    );
    expect(withDefault.current).toBe(true);
  });

  it('returns defaultValue on the first render when initializeWithValue is false', () => {
    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 768px)', {
        defaultValue: true,
        initializeWithValue: false,
      })
    );
    expect(result.current).toBe(true);
  });

  it('survives when matchMedia throws during evaluation', () => {
    window.matchMedia = () => {
      throw new Error('matchMedia not supported');
    };
    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 768px)', { defaultValue: true })
    );
    expect(result.current).toBe(true);
  });
});
