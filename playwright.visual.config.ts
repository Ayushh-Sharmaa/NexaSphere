import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./visual-tests",
  // Keep screenshots stable across OS (repo baselines were captured on win32).
  snapshotPathTemplate: "{snapshotDir}/{arg}-{projectName}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["html", { outputFolder: "visual-tests/report", open: "never" }],
    ["list"],
    ["./visual-tests/slackReporter.ts"],
  ],
  outputDir: "visual-tests/output",
  use: {
    trace: "on-first-retry",
  },
  expect: {
    toHaveScreenshot: {
      // allows minor anti-aliasing/rendering diffs without failing the build
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  projects: [
    {
      name: "Desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "Tablet",
      use: { ...devices["iPad Pro 11"] },
    },
    {
      name: "Mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "./website",
      url: "http://localhost:5175",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: "npm run dev",
      cwd: "./admin-dashboard",
      url: "http://localhost:5001",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
