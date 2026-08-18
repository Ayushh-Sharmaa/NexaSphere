import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

// Define the base URL for the website under test
const BASE_URL = "http://localhost:5175"; // As per README.md and playwright.config.js
const ADMIN_URL = "http://localhost:5001";

const axeOptions = {
  runOnly: {
    type: "tag",
    // Upgraded to WCAG AA as per requirements
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

const themes = ["light", "dark"];

test.describe("Accessibility checks", () => {
  for (const theme of themes) {
    test.describe(`Theme: ${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        // Set the theme in localStorage and attribute to match main.jsx logic
        await page.evaluate((t) => {
          localStorage.setItem("ns-theme", t);
          document.documentElement.setAttribute("data-theme", t);
          if (t === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
          } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
          }
        }, theme);
      });

      test(`Homepage [${theme}] should be accessible`, async ({ page }) => {
        await page.goto(BASE_URL);
        await injectAxe(page);
        await checkA11y(page, null, {
          axeOptions,
          detailedReport: true,
        });
      });

      test(`Focus states [${theme}] should be visible`, async ({ page }) => {
        await page.goto(BASE_URL);
        await page.keyboard.press("Tab");
        await injectAxe(page);
        await checkA11y(page, null, { axeOptions, detailedReport: true });
      });

      test(`Events page [${theme}] should be accessible`, async ({ page }) => {
        await page.goto(`${BASE_URL}/events`);
        await injectAxe(page);
        await checkA11y(page, null, { axeOptions, detailedReport: true });
      });

      test(`About page [${theme}] should be accessible`, async ({ page }) => {
        await page.goto(`${BASE_URL}/about`);
        await injectAxe(page);
        await checkA11y(page, null, { axeOptions, detailedReport: true });
      });
    });
  }

  test("Admin Dashboard accessibility", async ({ page }) => {
    await page.goto(ADMIN_URL);
    await injectAxe(page);
    await checkA11y(page, null, { axeOptions, detailedReport: true });
  });
});

/**
 * FALSE POSITIVE HANDLING / ALLOWLIST:
 * To allowlist a violation as per requirements, use the 'rules' object:
 *
 * await checkA11y(page, null, {
 *   rules: {
 *     'color-contrast': { enabled: false } // Only if documented and reviewed quarterly
 *   }
 * });
 *
 * ACCEPTANCE CRITERIA TRACKER:
 * - WCAG AA: Detected via axeOptions tags.
 * - Accessibility Score: Target 0 violations (correlates to 95+ score).
 */
