import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToPDF(columns, data, filename) {
  if (!columns || !data || data.length === 0) return;
  const doc = new jsPDF();
  doc.text(String(filename || "export"), 14, 10);
  autoTable(doc, { head: [columns], body: data });
  doc.save(`${filename || "export"}.pdf`);
}
