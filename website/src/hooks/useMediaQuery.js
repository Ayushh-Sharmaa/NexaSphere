import { useEffect, useState } from 'react';

/**
 * Tracks the state of a CSS media query from React.
 *
 * Resolves a media query string through `window.matchMedia` and re-renders the
 * component whenever the query's matched state changes (e.g. viewport resize,
 * print mode, orientation change). Falls back to `defaultValue` in non-browser
 * environments (SSR) or when `matchMedia` is unavailable, so the hook is safe
 * to call during server rendering.
 *
 * @param {string} query - CSS media query, e.g. `'(max-width: 768px)'`.
 * @param {object} [options] - Hook options.
 * @param {boolean} [options.defaultValue=false] - Value returned when
 *   `matchMedia` cannot be evaluated (SSR, disabled browser).
 * @param {boolean} [options.initializeWithValue=true] - When `false`, the hook
 *   returns `defaultValue` for the first render and syncs to the real query
 *   result in an effect, which avoids a hydration mismatch in SSR apps.
 * @returns {boolean} Whether the media query currently matches.
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query, options = {}) {
  const { defaultValue = false, initializeWithValue = true } = options;

  const [matches, setMatches] = useState(() => {
    if (!initializeWithValue) return defaultValue;
    return getMatches(query, defaultValue);
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    let mediaQueryList;
    try {
      mediaQueryList = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const handleChange = (event) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query, defaultValue]);

  return matches;
}

/**
 * Evaluates a media query to a boolean.
 *
 * Extracted so both the lazy initializer and the effect share the same
 * SSR-safe guards and fallback semantics.
 *
 * @param {string} query - CSS media query to evaluate.
 * @param {boolean} fallback - Value to return when evaluation is impossible.
 * @returns {boolean} Match state of the query.
 */
function getMatches(query, fallback) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return fallback;
  }
  try {
    return window.matchMedia(query).matches;
  } catch {
    return fallback;
  }
}

export default useMediaQuery;
