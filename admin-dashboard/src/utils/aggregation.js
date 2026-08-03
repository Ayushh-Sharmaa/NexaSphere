/**
 * Numeric aggregation helpers for admin reports and charts.
 *
 * The dashboard computes totals, averages and growth percentages across
 * registrations, check-ins, feedback and revenue. These helpers keep the
 * arithmetic consistent and safe against zero-length and malformed inputs
 * (no NaN leaking into widget UI).
 */

/**
 * Sums a selector across items, ignoring non-finite values.
 *
 * @param {Array} items - Items to sum.
 * @param {Function} [selector=x=>x] - Numeric selector.
 * @returns {number} Total.
 */
export function sumBy(items, selector = (x) => x) {
  let total = 0;
  for (const item of items) {
    const value = Number(selector(item));
    if (Number.isFinite(value)) total += value;
  }
  return total;
}

/**
 * Average of a selector across items. Returns `null` for empty input.
 *
 * @param {Array} items - Items to average.
 * @param {Function} [selector=x=>x] - Numeric selector.
 * @returns {number|null} Mean or `null`.
 */
export function avgBy(items, selector = (x) => x) {
  if (!items || items.length === 0) return null;
  const values = items.map(selector).filter((v) => Number.isFinite(Number(v)));
  if (values.length === 0) return null;
  return sumBy(values) / values.length;
}

/**
 * Counts items per `keyFn` bucket, optionally accumulating a metric instead
 * of a plain count.
 *
 * @param {Array} items - Items to group.
 * @param {Function} keyFn - Bucket selector.
 * @param {Function} [accumulator] - When provided, returns the sum of
 *   `accumulator(item)` per bucket instead of the count.
 * @returns {Object<string, number>} Bucket -> count (or accumulated value).
 */
export function countBy(items, keyFn, accumulator) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    if (accumulator) {
      const value = Number(accumulator(item));
      if (Number.isFinite(value)) counts[key] = (counts[key] || 0) + value;
    } else {
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Percentage change between two values. Returns `null` when the baseline is
 * missing/zero (a division would be meaningless or infinite).
 *
 * @param {number|string|null|undefined} previous - Baseline value.
 * @param {number|string|null|undefined} current - Current value.
 * @returns {number|null} Signed percent change.
 */
export function percentChange(previous, current) {
  const from = Number(previous);
  const to = Number(current);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

/**
 * Returns the min and max of a selector across items.
 *
 * @param {Array} items - Items to scan.
 * @param {Function} [selector=x=>x] - Numeric selector.
 * @returns {{min: number|null, max: number|null}} Extent.
 */
export function extent(items, selector = (x) => x) {
  let min = null;
  let max = null;
  for (const item of items) {
    const value = Number(selector(item));
    if (!Number.isFinite(value)) continue;
    if (min === null || value < min) min = value;
    if (max === null || value > max) max = value;
  }
  return { min, max };
}

/**
 * Returns the top `n` items ranked by a numeric selector (defaults desc).
 *
 * @param {Array} items - Items to rank.
 * @param {Function} selector - Numeric rank selector.
 * @param {number} n - How many to return.
 * @param {object} [options] - Options.
 * @param {'asc'|'desc'} [options.order='desc'] - Rank direction.
 * @returns {Array} Top items.
 */
export function topN(items, selector, n, { order = 'desc' } = {}) {
  const direction = order === 'asc' ? 1 : -1;
  return [...items]
    .sort((a, b) => {
      const av = Number(selector(a));
      const bv = Number(selector(b));
      const aNaN = !Number.isFinite(av);
      const bNaN = !Number.isFinite(bv);
      if (aNaN || bNaN) return aNaN ? 1 : -1;
      return (av - bv) * direction;
    })
    .slice(0, n);
}

export default {
  sumBy,
  avgBy,
  countBy,
  percentChange,
  extent,
  topN,
};
