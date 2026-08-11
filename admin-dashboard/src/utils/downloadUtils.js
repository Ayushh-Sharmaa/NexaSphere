/**
 * Browser download helpers for admin exports.
 *
 * `exportCSV.js`/`exportPDF.js` handle their own pipelines; these helpers
 * cover the general case: building Blobs, driving the hidden-anchor download
 * and producing safe filenames. `sanitizeFilename` also protects exports that
 * embed user content (event names, team names) from producing weird or unsafe
 * filenames.
 */

const FORBIDDEN_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

/**
 * Cleans a proposed filename: strips path separators, control characters and
 * illegal filename characters, collapses whitespace, and returns a safe name.
 *
 * @param {string} name - Proposed filename (with or without extension).
 * @param {string} [fallback='download'] - Name used when the result is empty.
 * @returns {string} Safe filename.
 *
 * @example
 * sanitizeFilename('Event: Hack-a-thon.csv') // 'Event_ Hack-a-thon.csv'
 */
export function sanitizeFilename(name, fallback = 'download') {
  const cleaned = String(name ?? '')
    .replace(FORBIDDEN_FILENAME_CHARS, '_')
    .replace(/\s+/g, ' ')
    .replace(/^[. ]+|\.$/, '')
    .trim();
  return cleaned || fallback;
}

/**
 * Triggers a browser download of a Blob using a hidden anchor element.
 * Cleans up the object URL immediately.
 *
 * @param {Blob} blob - Blob to download.
 * @param {string} filename - Download filename.
 */
export function triggerDownload(blob, filename) {
  const safeName = sanitizeFilename(filename);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Downloads `content` as a file of the given MIME type.
 *
 * @param {string} content - File content.
 * @param {string} filename - Download filename.
 * @param {string} [mimeType='text/plain;charset=utf-8'] - MIME type.
 */
export function downloadBlob(content, filename, mimeType = 'text/plain;charset=utf-8') {
  triggerDownload(new Blob([content], { type: mimeType }), filename);
}

/**
 * Downloads `content` as a UTF-8 text file.
 *
 * @param {string} content - Text content.
 * @param {string} filename - Download filename (`.txt` suggested).
 */
export function downloadText(content, filename) {
  downloadBlob(content, filename, 'text/plain;charset=utf-8');
}

/**
 * Serialises and downloads an object as JSON with a BOM for Excel-friendly
 * UTF-8 handling in downstream tooling.
 *
 * @param {*} data - Value to serialise.
 * @param {string} filename - Download filename (`.json` suggested).
 * @param {number} [indent=2] - Pretty-print indentation.
 */
export function downloadJSON(data, filename, indent = 2) {
  const content = `${JSON.stringify(data, null, indent)}\n`;
  downloadBlob(content, filename, 'application/json;charset=utf-8');
}

/**
 * Builds a compact timestamp (`20250803-1430`) for versioned export
 * filenames.
 *
 * @param {Date} [now=new Date()] - Reference time.
 * @returns {string} Compact timestamp.
 */
export function generateTimestamp(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const date = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('');
  const time = [pad(now.getHours()), pad(now.getMinutes())].join('');
  return `${date}-${time}`;
}

export default {
  sanitizeFilename,
  triggerDownload,
  downloadBlob,
  downloadText,
  downloadJSON,
  generateTimestamp,
};
