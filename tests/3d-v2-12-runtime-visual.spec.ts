import { test, expect } from "@playwright/test";

const baseURL = process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app";

test.describe("3D-V2.12 runtime visual evidence", () => {
  test("desktop runtime loads canonical spatial surface", async ({ page }) => {
    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(8_000);
    await page.screenshot({ path: "test-results/v2-12-desktop.png", fullPage: true });

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20_000 });
  });

  test("mobile runtime loads without a blank surface", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(8_000);
    await page.screenshot({ path: "test-results/v2-12-mobile.png", fullPage: true });

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20_000 });
    await context.close();
  });
});
