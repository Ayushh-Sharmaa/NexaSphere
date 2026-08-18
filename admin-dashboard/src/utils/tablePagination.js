/**
 * Sort an array of objects by a given key.
 *
 * @param {Array} data
 * @param {string} key
 * @param {'asc'|'desc'} direction
 * @returns {Array}
 */
export function sortData(data, key, direction = "asc") {
  if (!Array.isArray(data) || data.length === 0 || !key) {
    return Array.isArray(data) ? [...data] : [];
  }

  const multiplier = direction === "desc" ? -1 : 1;

  return [...data].sort((a, b) => {
    const aValue = a?.[key];
    const bValue = b?.[key];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * multiplier;
    }

    return (
      String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * multiplier
    );
  });
}

/**
 * Filter an array of objects by searching across specified columns.
 *
 * @param {Array} data
 * @param {string} searchTerm
 * @param {Array<string>} columns
 * @returns {Array}
 */
export function filterData(data, searchTerm = "", columns = []) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const term = String(searchTerm ?? "")
    .trim()
    .toLowerCase();

  if (!term) {
    return [...data];
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    return [];
  }

  return data.filter((item) =>
    columns.some((column) =>
      String(item?.[column] ?? "")
        .toLowerCase()
        .includes(term)
    )
  );
}

/**
 * Paginate an array of data.
 *
 * @param {Array} data
 * @param {number} page - 1-based page number
 * @param {number} pageSize
 * @returns {{items: Array, totalPages: number, hasNext: boolean, hasPrev: boolean}}
 */
export function paginateData(data, page = 1, pageSize = 10) {
  const safeData = Array.isArray(data) ? data : [];

  const safePageSize =
    Number.isFinite(Number(pageSize)) && Number(pageSize) > 0
      ? Math.floor(Number(pageSize))
      : 10;

  const totalPages =
    safeData.length === 0 ? 0 : Math.ceil(safeData.length / safePageSize);

  const safePage =
    Number.isFinite(Number(page)) && Number(page) > 0
      ? Math.floor(Number(page))
      : 1;

  if (totalPages === 0) {
    return {
      items: [],
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    items: safeData.slice(startIndex, startIndex + safePageSize),
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * Apply filtering, sorting, and pagination to table data.
 *
 * @param {Array} data
 * @param {Object} state
 * @returns {{
 *   items: Array,
 *   totalPages: number,
 *   hasNext: boolean,
 *   hasPrev: boolean
 * }}
 */
export function applyTableState(
  data,
  {
    sortKey = "",
    sortDir = "asc",
    search = "",
    columns = [],
    page = 1,
    pageSize = 10,
  } = {}
) {
  const filtered = filterData(data, search, columns);
  const sorted = sortKey ? sortData(filtered, sortKey, sortDir) : filtered;

  return paginateData(sorted, page, pageSize);
}

export default {
  sortData,
  filterData,
  paginateData,
  applyTableState,
};
