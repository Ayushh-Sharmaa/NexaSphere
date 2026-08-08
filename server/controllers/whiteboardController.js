import PDFDocument from 'pdfkit';
import { sendError } from '../utils/responseHelper.js';

export function exportPDF(req, res) {
  try {
    const { eventId, elements = [] } = req.body;

    const doc = new PDFDocument({ size: [1100, 680], margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="whiteboard-${eventId || 'export'}.pdf"`
    );

    doc.pipe(res);

    // Draw background (clean white canvas)
    doc.rect(0, 0, 1100, 680).fill('#ffffff');

    // Helper to get color fallback
    const getColor = (c) => c || '#000000';

    for (const el of elements) {
      const opacity = el.opacity ?? 1;
      const strokeWidth = el.strokeWidth ?? 2;
      const color = getColor(el.color);

      doc.save();
      doc.fillOpacity(opacity);
      doc.strokeOpacity(opacity);
      doc.lineWidth(strokeWidth);

      if (el.type === 'rect') {
        const fill = el.fill && el.fill !== 'transparent' ? el.fill : null;
        if (fill) {
          doc.rect(el.x, el.y, el.w, el.h).fillAndStroke(fill, color);
        } else {
          doc.rect(el.x, el.y, el.w, el.h).stroke(color);
        }
      } else if (el.type === 'circle') {
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        const r = Math.min(Math.abs(el.w), Math.abs(el.h)) / 2;
        const fill = el.fill && el.fill !== 'transparent' ? el.fill : null;
        if (fill) {
          doc.circle(cx, cy, r).fillAndStroke(fill, color);
        } else {
          doc.circle(cx, cy, r).stroke(color);
        }
      } else if (el.type === 'triangle') {
        const fill = el.fill && el.fill !== 'transparent' ? el.fill : null;
        doc
          .moveTo(el.x + el.w / 2, el.y)
          .lineTo(el.x + el.w, el.y + el.h)
          .lineTo(el.x, el.y + el.h)
          .closePath();
        if (fill) {
          doc.fillAndStroke(fill, color);
        } else {
          doc.stroke(color);
        }
      } else if (el.type === 'line') {
        doc
          .moveTo(el.x, el.y)
          .lineTo(el.x + el.w, el.y + el.h)
          .stroke(color);
      } else if (el.type === 'arrow') {
        // Draw main line
        const fromX = el.x;
        const fromY = el.y;
        const toX = el.x + el.w;
        const toY = el.y + el.h;
        doc.moveTo(fromX, fromY).lineTo(toX, toY).stroke(color);

        // Draw arrow head
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLength = 12;
        const h1X = toX - headLength * Math.cos(angle - Math.PI / 6);
        const h1Y = toY - headLength * Math.sin(angle - Math.PI / 6);
        const h2X = toX - headLength * Math.cos(angle + Math.PI / 6);
        const h2Y = toY - headLength * Math.sin(angle + Math.PI / 6);

        doc.moveTo(toX, toY).lineTo(h1X, h1Y).lineTo(h2X, h2Y).closePath().fill(color);
      } else if (el.type === 'text') {
        doc.fillColor(color);
        const size = el.fontSize || 16;
        doc.fontSize(size);
        doc.text(el.text || '', el.x, el.y, { lineBreak: false });
      } else if (el.type === 'sticky') {
        const fill = el.fill || color;
        doc.roundedRect(el.x, el.y, el.w, el.h, 10).fillAndStroke(fill, 'rgba(0,0,0,0.15)');

        // Draw sticky note text
        doc.fillColor('rgba(0,0,0,0.75)');
        doc.fontSize(el.fontSize || 14);
        const textLines = String(el.text || '').split('\n');
        let currentY = el.y + 18;
        textLines.slice(0, 6).forEach((line) => {
          doc.text(line.slice(0, 30), el.x + 12, currentY, { lineBreak: false });
          currentY += 18;
        });
      } else if (el.type === 'stroke') {
        if (el.points && el.points.length > 0) {
          const strokeColor = el.isEraser ? '#ffffff' : color;
          doc.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            doc.lineTo(el.points[i].x, el.points[i].y);
          }
          doc.stroke(strokeColor);
        }
      }

      doc.restore();
    }

    doc.end();
  } catch (err) {
    console.error('Failed to export whiteboard PDF:', err.message);
    sendError(req, res, 'Failed to export whiteboard PDF', 500, 'INTERNAL_ERROR');
  }
}
