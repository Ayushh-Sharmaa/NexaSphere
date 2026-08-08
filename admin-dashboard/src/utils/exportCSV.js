/**
 * exportCSV.js — RFC 4180-compliant CSV export utility.
 * Properly escapes commas, double quotes, and newlines in cell values.
 */

/**
 * Escape a single CSV cell value per RFC 4180.
 * @param {*} value
 * @returns {string}
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // Guard against CSV formula injection
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = "'" + str;
  }
  // Wrap in quotes if the value contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convert an array of objects to a CSV string.
 * @param {Object[]} data - Array of row objects
 * @param {string[]} headers - Column header names
 * @param {string[]} [keys] - Object property keys (defaults to headers)
 * @returns {string} CSV content with BOM for Excel compatibility
 */
export function exportToCSV(data, headers, keys) {
  if (!data || data.length === 0) return '';
  const cols = keys || headers;

  const headerRow = headers.map(escapeCsvCell).join(',');
  const rows = data.map(row =>
    cols.map(col => escapeCsvCell(row[col])).join(',')
  );

  // BOM + header + rows
  return '\uFEFF' + [headerRow, ...rows].join('\n');
}

/**
 * Trigger a CSV file download in the browser.
 * @param {string} csvContent
 * @param {string} filename
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
