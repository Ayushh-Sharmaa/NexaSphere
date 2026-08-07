import jsPDF from "jspdf";
import "jspdf-autotable";

export function exportToCSV(data, filename = "export.csv") {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => `"${row[header] || ""}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(title, headers, data, filename = "export.pdf") {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  doc.autoTable({
    startY: 30,
    head: [headers],
    body: data.map((row) => headers.map((header) => row[header] || "")),
  });

  doc.save(filename);
}

export function exportToExcel(data, filename = "export.csv") {
  // Simple fallback to CSV format for Excel to open
  exportToCSV(data, filename);
}
