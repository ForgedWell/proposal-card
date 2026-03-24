import { chromium } from "@playwright/test";

/**
 * Pre-warm routes after the prod server starts.
 * Ensures Next.js has initialised all route handlers before tests run.
 */
export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    // best-effort
  } finally {
    await browser.close();
  }
}
