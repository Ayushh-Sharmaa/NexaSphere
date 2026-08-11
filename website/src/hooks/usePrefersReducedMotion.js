import useMediaQuery from './useMediaQuery';

/**
 * True when the user has requested reduced motion via
 * `prefers-reduced-motion: reduce` (OS-level accessibility setting).
 *
 * Components that run continuous animations or auto-scrolling can gate that
 * behaviour with this hook instead of hard-coding it into CSS, which is
 * particularly useful for imperative JS animations (canvas loops, carousels,
 * marquees) that CSS media queries cannot reach.
 *
 * @returns {boolean} Whether the user prefers reduced motion.
 *
 * @example
 * const reduceMotion = usePrefersReducedMotion();
 * useEffect(() => {
 *   if (reduceMotion) return;
 *   const raf = requestAnimationFrame(animate);
 *   return () => cancelAnimationFrame(raf);
 * }, [reduceMotion]);
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Resolves the full `prefers-reduced-motion` preference into a stable value.
 *
 * Returns `'reduce'` when the user has opted out of motion, `'no-preference'`
 * when they explicitly opted in, and `'unset'` when the media query reports
 * neither value (older browsers may only support `reduce`).
 *
 * @returns {'reduce'|'no-preference'|'unset'} The resolved preference.
 *
 * @example
 * const motion = useMotionPreference();
 * const animationDuration = motion === 'reduce' ? 0 : 300;
 */
export function useMotionPreference() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const noPreference = useMediaQuery('(prefers-reduced-motion: no-preference)');

  if (reduced) return 'reduce';
  if (noPreference) return 'no-preference';
  return 'unset';
}

export default usePrefersReducedMotion;
