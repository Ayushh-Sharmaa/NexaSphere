import PDFDocument from 'pdfkit';

export async function renderCertificatePdf({ variables } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 50,
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Background and Border
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
      doc
        .lineWidth(5)
        .strokeColor('#2563eb')
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .stroke();
      doc
        .lineWidth(1)
        .strokeColor('#e5e7eb')
        .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .stroke();

      doc.y = 120; // Set starting Y position for text

      // Title
      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(42)
        .text('CERTIFICATE OF COMPLETION', { align: 'center' });
      doc.moveDown(1.5);

      // Subtitle
      doc
        .fillColor('#4b5563')
        .font('Helvetica')
        .fontSize(18)
        .text('This is to certify that', { align: 'center' });
      doc.moveDown(1);

      // Name
      doc
        .fillColor('#2563eb')
        .font('Helvetica-Bold')
        .fontSize(36)
        .text(variables?.attendeeName || 'Valued Attendee', { align: 'center' });
      doc.moveDown(1);

      // Description
      doc
        .fillColor('#4b5563')
        .font('Helvetica')
        .fontSize(18)
        .text('has successfully participated in and completed:', { align: 'center' });
      doc.moveDown(0.5);

      // Event Name
      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(variables?.eventName || 'NexaSphere Event', { align: 'center' });

      // Footer
      const footerY = doc.page.height - 120;
      doc.fillColor('#6b7280').font('Helvetica').fontSize(12);
      doc.text(
        `Date Issued: ${variables?.date || new Date().toISOString().slice(0, 10)}`,
        100,
        footerY
      );
      doc.text(`Certificate Code: ${variables?.code || 'UNVERIFIED'}`, 100, footerY + 20);

      if (variables?.verifyUrl) {
        doc
          .fillColor('#2563eb')
          .text(`Verify at: ${variables.verifyUrl}`, doc.page.width - 400, footerY, {
            align: 'right',
          });
      } else {
        doc
          .fillColor('#6b7280')
          .text(`NexaSphere Certification`, doc.page.width - 300, footerY, { align: 'right' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
// Code-first PDF generator placeholder.
// TODO: replace with real renderer (HTML->PDF or canvas->PDF).

function safeText(value, fallback = '') {
  const text = String(value ?? fallback).trim();
  return text || fallback;
}

function addLabeledLine(doc, label, value, y) {
  doc.fontSize(10).fillColor('#6b7280').text(label, 56, y, { width: 120 });
  doc
    .fontSize(16)
    .fillColor('#111827')
    .text(value, 56, y + 14, { width: 480 });
}


}