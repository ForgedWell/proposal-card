import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: "list",
  timeout: 45000,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "on",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-dev-shm-usage", "--no-sandbox"],
        },
      },
    },
  ],

  // Start the prod server before running tests (pre-compiles all routes)
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
