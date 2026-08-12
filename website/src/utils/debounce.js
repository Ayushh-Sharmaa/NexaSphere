/**
 * Timing utilities for rate-limiting frequent events.
 *
 * The website fires input, scroll and resize handlers in several places, each
 * reimplementing a setTimeout guard slightly differently. These helpers give
 * the app a single, tested implementation with leading/trailing edges and
 * cancel/flush support.
 */

/**
 * Returns a function whose invocation is delayed until `wait` ms have elapsed
 * since the last call. Useful for search-as-you-type inputs and autosave.
 *
 * @param {Function} fn - The function to debounce.
 * @param {number} [wait=250] - Delay in milliseconds.
 * @param {object} [options] - Debounce options.
 * @param {boolean} [options.leading=false] - Invoke `fn` immediately on the
 *   first call in a burst (leading edge) and debounce subsequent calls.
 * @param {number} [options.maxWait] - Maximum time `fn` can be postponed;
 *   guarantees at-least-once invocation for continuous input streams.
 * @returns {Function} Debounced wrapper with `.cancel()` and `.flush()`.
 *
 * @example
 * const search = debounce((q) => api.search(q), 300);
 * input.addEventListener('input', (e) => search(e.target.value));
 */
export function debounce(fn, wait = 250, { leading = false, maxWait } = {}) {
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastInvokeTime = Date.now();

  const invoke = () => {
    lastInvokeTime = Date.now();
    if (lastArgs !== null) {
      fn.apply(lastThis, lastArgs);
    }
    lastArgs = null;
    lastThis = null;
  };

  const startTrailingTimer = () => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      if (lastArgs !== null) invoke();
    }, wait);
  };

  const debounced = function (...args) {
    lastArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this;
    const time = Date.now();

    const maxWaitExceeded = maxWait !== undefined && time - lastInvokeTime >= maxWait;
    const leadingEdge = leading && timerId === null;

    if (leadingEdge || maxWaitExceeded) {
      const hadArgs = lastArgs !== null;
      clearTimeout(timerId);
      timerId = null;
      invoke();
      // Re-arm the trailing timer so the final call in a burst still fires,
      // and so `leading` stays a one-shot-per-burst behaviour.
      if (hadArgs) {
        startTrailingTimer();
      }
      return debounced;
    }

    startTrailingTimer();
    return debounced;
  };

  debounced.cancel = () => {
    clearTimeout(timerId);
    timerId = null;
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (lastArgs !== null) {
      clearTimeout(timerId);
      timerId = null;
      invoke();
    }
  };

  return debounced;
}

/**
 * Returns a function that invokes `fn` at most once every `wait` ms.
 * Suitable for scroll handlers and window-resize throttling.
 *
 * @param {Function} fn - The function to throttle.
 * @param {number} [wait=250] - Minimum interval between invocations.
 * @param {object} [options] - Throttle options.
 * @param {boolean} [options.leading=true] - Invoke on the leading edge.
 * @param {boolean} [options.trailing=true] - Schedule one trailing invocation
 *   at the end of the interval when calls arrived during it.
 * @returns {Function} Throttled wrapper with `.cancel()` and `.flush()`.
 *
 * @example
 * const onScroll = throttle(() => updateProgressBar(), 150);
 * window.addEventListener('scroll', onScroll);
 */
export function throttle(fn, wait = 250, { leading = true, trailing = true } = {}) {
  let inCooldown = false;
  let trailingArgs = null;
  let trailingThis = null;
  let timerId = null;

  const runTrailing = () => {
    if (trailingArgs !== null) {
      const args = trailingArgs;
      const ctx = trailingThis;
      trailingArgs = null;
      trailingThis = null;
      fn.apply(ctx, args);
    }
    timerId = null;
    inCooldown = false;
  };

  const throttled = function (...args) {
    if (inCooldown) {
      if (trailing) {
        trailingArgs = args;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        trailingThis = this;
      }
      return throttled;
    }

    if (leading) {
      fn.apply(this, args);
    } else {
      trailingArgs = args;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      trailingThis = this;
    }

    inCooldown = true;
    if (trailing) {
      clearTimeout(timerId);
      timerId = setTimeout(runTrailing, wait);
    } else {
      timerId = setTimeout(() => {
        inCooldown = false;
      }, wait);
    }

    return throttled;
  };

  throttled.cancel = () => {
    clearTimeout(timerId);
    timerId = null;
    inCooldown = false;
    trailingArgs = null;
    trailingThis = null;
  };

  throttled.flush = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      runTrailing();
    }
  };

  return throttled;
}

export default debounce;
