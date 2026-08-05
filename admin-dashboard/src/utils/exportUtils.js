import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Escape a single CSV cell value per RFC 4180.
 * Wraps in quotes if the value contains comma, newline, or quote,
 * and doubles embedded quotes.
 * @param {*} value
 * @returns {string}
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Export data to a CSV file with proper RFC 4180 escaping.
 * @param {Object[]} data - Array of row objects
 * @param {string} filename - Output filename
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...data.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to a PDF file.
 * @param {string} title - Document title
 * @param {string[]} headers - Column headers
 * @param {Object[]} data - Row data
 * @param {string} filename - Output filename
 */
export function exportToPDF(title, headers, data, filename = 'export.pdf') {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  doc.autoTable({
    startY: 30,
    head: [headers],
    body: data.map((row) => headers.map((header) => row[header] || '')),
  });

  doc.save(filename);
}

/**
 * Export data to an Excel-compatible file (CSV format).
 * @param {Object[]} data - Array of row objects
 * @param {string} filename - Output filename
 */
export function exportToExcel(data, filename = 'export.csv') {
  exportToCSV(data, filename);
}
