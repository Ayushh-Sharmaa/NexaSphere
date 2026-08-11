/**
 * Promise helpers for resilient async flows.
 *
 * The site's data layer already layers retries and caching (`syncManager.js`,
 * `offlineQueue.js`, `indexedDB.js`), but each does its own retry/timeout
 * bookkeeping. These small, dependency-free helpers standardise the common
 * patterns so callers get bounded latency and backoff without reimplementing
 * setTimeout plumbing.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Rejects a promise chain after `ms` milliseconds.
 *
 * @param {Promise} promise - The promise to race against.
 * @param {number} ms - Timeout in milliseconds.
 * @param {string} [message='Operation timed out'] - Rejection reason.
 * @returns {Promise} Settles with the input's result or rejects on timeout.
 *
 * @example
 * const data = await withTimeout(api.get('/events'), 5000);
 */
export function withTimeout(promise, ms, message = 'Operation timed out') {
  if (!promise || typeof promise.then !== 'function') {
    return Promise.reject(new TypeError('withTimeout expects a thenable'));
  }
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

/**
 * Re-runs an async function on failure using exponential backoff.
 *
 * @param {Function} fn - Async function to retry. Called with the attempt
 *   number (1-based) as its first argument.
 * @param {object} [options] - Retry options.
 * @param {number} [options.retries=3] - Max additional attempts after the
 *   first failure.
 * @param {number} [options.baseDelay=250] - Initial delay in ms.
 * @param {number} [options.maxDelay=5000] - Cap on the backoff delay.
 * @param {Function} [options.onRetry] - Called with the error and attempt.
 * @param {Function} [options.shouldRetry] - Predicate deciding whether to
 *   retry for a given error. Defaults to retrying everything.
 * @returns {Promise} Resolves with `fn`'s result or rejects with the last
 *   error after exhausting attempts.
 *
 * @example
 * const events = await retry(() => api.list('/events'), { retries: 2 });
 */
export async function retry(
  fn,
  { retries = 3, baseDelay = 250, maxDelay = 5000, onRetry, shouldRetry } = {}
) {
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    attempt += 1;
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt > retries) break;
      if (shouldRetry && !shouldRetry(error)) break;
      const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * Runs async tasks one at a time, awaiting each before starting the next.
 *
 * @param {Array} items - Input values for each task.
 * @param {Function} task - Async function receiving `(item, index)`.
 * @returns {Promise<Array>} Results in input order.
 */
export async function sequential(items, task) {
  const results = [];
  for (let i = 0; i < items.length; i += 1) {
    results.push(await task(items[i], i));
  }
  return results;
}

/**
 * Runs async tasks with a concurrency limit, preserving input order.
 *
 * @param {Array} items - Input values for each task.
 * @param {number} limit - Maximum concurrent tasks.
 * @param {Function} task - Async function receiving `(item, index)`.
 * @returns {Promise<Array>} Results in input order.
 */
export async function mapLimit(items, limit, task) {
  if (!(limit >= 1)) throw new RangeError('mapLimit requires limit >= 1');
  const results = new Array(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index], index);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Resolves with a value only after `ms` milliseconds (e.g. enforced minimum
 * loading time).
 *
 * @param {*} value - Value to resolve with.
 * @param {number} ms - Minimum delay.
 * @returns {Promise} Promise resolving with `value`.
 */
export function delayValue(value, ms) {
  return sleep(ms).then(() => value);
}

export default retry;
