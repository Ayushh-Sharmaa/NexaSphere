/**
 * Admin table sorting, filtering and pagination helpers.
 *
 * The dashboard's registrations, feedback and user tables each reimplement
 * sort/paginate/filter inside their component. These helpers centralise that
 * logic: they are immutable (never mutate the rows array), handle nested
 * paths and date strings, and produce a stable sort order.
 */

/**
 * Reads a value from a row by dot-path (`'user.name'`) or plain key.
 *
 * @param {Object} row - Row object.
 * @param {string} key - Column key or dot-path.
 * @returns {*} Value at the path, or `undefined`.
 */
export function getNestedValue(row, key) {
  if (!row || typeof key !== "string") return undefined;
  return key
    .split(".")
    .reduce((acc, part) => (acc == null ? undefined : acc[part]), row);
}

/**
 * Compares two values for sorting. Dates (ISO strings / timestamps) compare
 * numerically; everything else compares naturally with nullish values last.
 *
 * @param {*} a - First value.
 * @param {*} b - Second value.
 * @returns {number} Comparison result.
 */
export function compareValues(a, b) {
  const aNull = a == null || a === "";
  const bNull = b == null || b === "";
  if (aNull || bNull) return aNull && bNull ? 0 : aNull ? 1 : -1;

  const aTime = typeof a === "string" ? Date.parse(a) : NaN;
  const bTime = typeof b === "string" ? Date.parse(b) : NaN;
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;

  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Returns a sorted copy of rows by column key.
 *
 * @param {Array} rows - Rows to sort (not mutated).
 * @param {string|null} sortKey - Column key or dot-path.
 * @param {'asc'|'desc'} [order='asc'] - Sort direction.
 * @returns {Array} Sorted copy.
 */
export function sortRows(rows, sortKey, order = "asc") {
  if (!sortKey || !Array.isArray(rows)) return [...rows];
  const direction = order === "desc" ? -1 : 1;
  return [...rows].sort(
    (a, b) =>
      compareValues(getNestedValue(a, sortKey), getNestedValue(b, sortKey)) *
      direction
  );
}

/**
 * Filters rows by a query across the given columns (case-insensitive,
 * substring match).
 *
 * @param {Array} rows - Rows to filter.
 * @param {string} query - Search text.
 * @param {string[]} columns - Column keys (dot-paths allowed) to search.
 * @returns {Array} Matching rows.
 */
export function filterRows(rows, query, columns) {
  const needle = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return [...rows];
  return rows.filter((row) =>
    columns.some((column) => {
      const value = getNestedValue(row, column);
      return value != null && String(value).toLowerCase().includes(needle);
    })
  );
}

/**
 * Returns one page of rows plus paging metadata.
 *
 * @param {Array} rows - Full row list.
 * @param {number} page - 1-based page number.
 * @param {number} pageSize - Rows per page.
 * @returns {{ items: Array, page: number, pageSize: number, total: number,
 *   totalPages: number, hasNext: boolean, hasPrev: boolean }} Paged view.
 */
export function paginate(rows, page, pageSize) {
  const total = rows.length;
  const safeSize = pageSize > 0 ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safeSize;
  return {
    items: rows.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

/**
 * Serialises an object into a URL query string, skipping empty values.
 *
 * @param {Object<string, *>} params - Query params.
 * @returns {string} E.g. `?page=2&search=react`.
 */
export function buildQueryString(params) {
  const entries = Object.entries(params).filter(
    ([, value]) => value != null && value !== ""
  );
  if (entries.length === 0) return "";
  return `?${entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&")}`;
}

export default {
  getNestedValue,
  compareValues,
  sortRows,
  filterRows,
  paginate,
  buildQueryString,
};
