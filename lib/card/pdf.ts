import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface CardPdfInput {
  displayName: string;
  slug: string;
  appUrl: string;
  cardTemplate?: "CLASSIC" | "MINIMAL" | "ELEGANT";
  cardColor?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export async function generateCardPdf(input: CardPdfInput): Promise<Buffer> {
  const { displayName, slug, appUrl, cardTemplate = "CLASSIC", cardColor = "#0284c7" } = input;
  const cardUrl = `${appUrl}/c/${slug}`;
  const [r, g, b] = hexToRgb(cardColor);

  const width = 88.9;
  const height = 50.8;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [height, width] });

  const qrDataUrl = await QRCode.toDataURL(cardUrl, {
    margin: 1, width: 200,
    color: { dark: cardTemplate === "ELEGANT" ? "#fffbeb" : "#0f172a", light: cardTemplate === "ELEGANT" ? "#0f172a" : "#ffffff" },
    errorCorrectionLevel: "M",
  });

  const qrSize = 22;

  if (cardTemplate === "MINIMAL") {
    // Minimal: clean, no header, lots of whitespace
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(14);
    doc.text(displayName, 6, 12);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Proposal Card", 6, 16);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(cardUrl, 6, 28);

    doc.addImage(qrDataUrl, "PNG", width - qrSize - 6, 6, qrSize, qrSize);

    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("Scan to connect", width - qrSize - 6 + qrSize / 2, 30, { align: "center" });
  } else if (cardTemplate === "ELEGANT") {
    // Elegant: dark background, cream text
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, width, height, "F");

    // Accent line at top
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, width, 2, "F");

    doc.setTextColor(255, 251, 235); // amber-50
    doc.setFontSize(14);
    doc.text(displayName, 6, 14);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Proposal Card", 6, 18);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(cardUrl, 6, 28);

    doc.addImage(qrDataUrl, "PNG", width - qrSize - 6, 22, qrSize, qrSize);

    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("Scan to connect", width - qrSize - 6 + qrSize / 2, 46, { align: "center" });
  } else {
    // Classic: gradient header
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, width, 16, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(displayName, 6, 11);

    doc.setFontSize(7);
    doc.setTextColor(186, 230, 253);
    doc.text("Proposal Card", 6, 14.5);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(cardUrl, 6, 24);

    doc.addImage(qrDataUrl, "PNG", width - qrSize - 6, 20, qrSize, qrSize);

    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("Scan to connect", width - qrSize - 6 + qrSize / 2, 44, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(6, height - 4, width - 6, height - 4);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
