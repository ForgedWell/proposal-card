import { describe, it, expect } from "vitest";
import { generateCardPdf } from "@/lib/card/pdf";

describe("generateCardPdf", () => {
  it("returns a valid PDF buffer", async () => {
    const pdf = await generateCardPdf({
      displayName: "Test User",
      slug: "test-user",
      appUrl: "http://localhost:3000",
    });

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(100);
    // PDF magic bytes
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles long display names", async () => {
    const pdf = await generateCardPdf({
      displayName: "A Very Long Display Name That Should Still Work",
      slug: "long-name-user",
      appUrl: "https://proposalcard.com",
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles minimal input", async () => {
    const pdf = await generateCardPdf({
      displayName: "A",
      slug: "a",
      appUrl: "http://localhost:3000",
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(100);
  });
});
