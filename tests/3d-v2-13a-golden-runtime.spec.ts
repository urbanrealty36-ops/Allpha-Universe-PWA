import { test, expect } from "@playwright/test";

const baseUrl = process.env.ALLPHA_QA_BASE_URL ?? "https://allphaweb-production.up.railway.app";

test.describe("3D-V2.13A Crystal AI City runtime gate", () => {
  test("public Universe exposes the canonical 3D focal renderer", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    const webgl = await canvas.evaluate((node) => {
      const element = node as HTMLCanvasElement;
      return Boolean(element.getContext("webgl2") || element.getContext("webgl"));
    });
    expect(webgl).toBeTruthy();

    await page.screenshot({
      path: "test-results/v2-13a-crystal-ai-city-runtime.png",
      fullPage: true,
    });

    expect(
      consoleErrors.filter((message) => !/favicon|ResizeObserver/i.test(message)),
      "unexpected browser console errors",
    ).toEqual([]);
  });
});
