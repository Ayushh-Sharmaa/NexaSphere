/**
 * Immutable helpers for grouping, sorting and reducing arrays.
 *
 * The website filters and buckets event lists, team members and activity
 * feeds in several components. These helpers keep that logic declarative and,
 * unlike mutating `Array.prototype.sort`, never modify the caller's input.
 */

/**
 * Groups array items into an object keyed by the value of `keyFn`.
 *
 * @param {Array} items - Items to group.
 * @param {Function} keyFn - Selector returning the group key for an item.
 * @returns {Object<string, Array>} Map of key -> items (insertion ordered).
 */
export function groupBy(items, keyFn) {
  const groups = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!Object.prototype.hasOwnProperty.call(groups, key)) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  return groups;
}

/**
 * Returns a new array sorted by the value of `selector`, ascending or
 * descending. Missing/nullish values sort last in both orders.
 *
 * @param {Array} items - Items to sort (not mutated).
 * @param {Function} selector - Selector returning a comparable value.
 * @param {object} [options] - Sort options.
 * @param {'asc'|'desc'} [options.order='asc'] - Sort direction.
 * @param {boolean} [options.nullsLast=true] - Whether nullish values sort last.
 * @returns {Array} Sorted copy of `items`.
 */
export function sortBy(items, selector, { order = 'asc', nullsLast = true } = {}) {
  const direction = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = selector(a);
    const bv = selector(b);
    const aNull = av == null;
    const bNull = bv == null;

    if (aNull || bNull) {
      if (aNull && bNull) return 0;
      // Empty values always end up at the tail.
      return nullsLast ? (aNull ? 1 : -1) : aNull ? -1 : 1;
    }
    if (av < bv) return -1 * direction;
    if (av > bv) return 1 * direction;
    return 0;
  });
}

/**
 * Returns a new array with duplicates removed based on `keyFn`.
 * The first occurrence of each key is kept.
 *
 * @param {Array} items - Items to dedupe.
 * @param {Function} keyFn - Selector returning the identity key.
 * @returns {Array} Deduplicated copy of `items`.
 */
export function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Splits an array into fixed-size chunks.
 *
 * @param {Array} items - Items to chunk.
 * @param {number} size - Max items per chunk (>= 1).
 * @returns {Array<Array>} Array of chunks.
 */
export function chunk(items, size) {
  if (!(size > 0)) return [];
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

/**
 * Splits items into two arrays based on a predicate.
 *
 * @param {Array} items - Items to partition.
 * @param {Function} predicate - Returns `true` for the first partition.
 * @returns {[Array, Array]} `[matches, rest]`.
 */
export function partition(items, predicate) {
  const matches = [];
  const rest = [];
  for (const item of items) {
    (predicate(item) ? matches : rest).push(item);
  }
  return [matches, rest];
}

/**
 * Sums `selector(item)` across all items.
 *
 * @param {Array} items - Items to sum over.
 * @param {Function} selector - Selector returning a numeric value.
 * @returns {number} The total, ignoring non-finite values.
 */
export function sumBy(items, selector) {
  let total = 0;
  for (const item of items) {
    const value = Number(selector(item));
    if (Number.isFinite(value)) total += value;
  }
  return total;
}

/**
 * Returns a count of items per distinct `keyFn` value.
 *
 * @param {Array} items - Items to count.
 * @param {Function} keyFn - Selector returning the bucket key.
 * @returns {Object<string, number>} Map of key -> count.
 */
export function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/**
 * Returns the top `n` items ranked by `selector`.
 *
 * @param {Array} items - Items to rank.
 * @param {Function} selector - Selector returning the rank value.
 * @param {number} n - How many items to return.
 * @param {object} [options] - Rank options.
 * @param {'asc'|'desc'} [options.order='desc'] - Rank direction.
 * @returns {Array} The top `n` items.
 */
export function topN(items, selector, n, { order = 'desc' } = {}) {
  return sortBy(items, selector, { order }).slice(0, n);
}

export default {
  groupBy,
  sortBy,
  uniqueBy,
  chunk,
  partition,
  sumBy,
  countBy,
  topN,
};
