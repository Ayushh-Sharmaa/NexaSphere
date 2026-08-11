import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { isIOS } from './deviceDetection';

/**
 * Generates a PDF from an HTML element and either opens it in a new tab (iOS Safari workaround)
 * or triggers a direct download.
 */
export const generatePDFBlob = async (
  element: HTMLElement,
  filename: string = 'export.pdf'
): Promise<void> => {
  if (!element) {
    throw new Error('Element not provided for PDF generation');
  }

  // 1. Capture the DOM element using html2canvas
  // We use scale: 2 for better resolution while avoiding massive memory usage
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // 2. Create jsPDF instance
  // Default A4 portrait
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate scaled height to fit the width of A4
  const ratio = canvasHeight / canvasWidth;
  let imgHeight = pdfWidth * ratio;
  let imgWidth = pdfWidth;

  // If the image is taller than the page, we scale it down to fit one page
  // (Assuming we want it to fit on a single page like a certificate)
  if (imgHeight > pdfHeight) {
    imgHeight = pdfHeight;
    imgWidth = pdfHeight / ratio;
  }

  // Center horizontally if scaled down by height
  const xOffset = (pdfWidth - imgWidth) / 2;
  const yOffset = (pdfHeight - imgHeight) / 2;

  pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);

  // 3. Output as Blob
  const pdfBlob = pdf.output('blob');

  // 4. Download / Open handling
  if (isIOS()) {
    // On iOS Safari, forcing a download often fails or opens an un-shareable preview.
    // Instead, we open the Blob URL in a new tab. Safari provides a native "Share -> Save to Files" UI there.
    const blobUrl = URL.createObjectURL(pdfBlob);

    // We try to open it in a new tab. Some browsers might block popups if not directly in click handler,
    // but this usually works on iOS Safari when triggered by a user action.
    const newTab = window.open(blobUrl, '_blank', 'noopener,noreferrer');

    if (!newTab) {
      // Fallback: just redirect current window
      window.location.href = blobUrl;
    } else {
      // Clean up after some time so Safari has time to load it
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }
  } else {
    // Standard desktop/Android download
    pdf.save(filename);
  }
};
