import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface CardPdfInput {
  displayName: string;
  slug: string;
  appUrl: string;
}

/**
 * Generates a business-card-sized PDF (3.5" x 2") with the user's name,
 * card URL, and a QR code.
 */
export async function generateCardPdf(input: CardPdfInput): Promise<Buffer> {
  const { displayName, slug, appUrl } = input;
  const cardUrl = `${appUrl}/c/${slug}`;

  // Business card dimensions in mm (3.5" x 2")
  const width = 88.9;
  const height = 50.8;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [height, width],
  });

  // Brand gradient header (solid brand-600 color: #0284c7)
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, width, 16, "F");

  // Display name (white on brand header)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(displayName, 6, 11);

  // "Proposal Card" tagline
  doc.setFontSize(7);
  doc.setTextColor(186, 230, 253); // brand-200
  doc.text("Proposal Card", 6, 14.5);

  // Card URL below header
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(8);
  doc.text(cardUrl, 6, 24);

  // QR code (right side)
  const qrDataUrl = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 200,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  const qrSize = 24;
  doc.addImage(qrDataUrl, "PNG", width - qrSize - 6, 20, qrSize, qrSize);

  // "Scan to connect" label under QR
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Scan to connect", width - qrSize - 6 + qrSize / 2, 46, { align: "center" });

  // Bottom border line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(6, height - 4, width - 6, height - 4);

  return Buffer.from(doc.output("arraybuffer"));
}
