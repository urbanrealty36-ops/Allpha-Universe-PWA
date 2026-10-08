import { test, expect } from "@playwright/test";

const BASE_URL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");

test.describe("Public 3D UI/UX", () => {
  test("public splash exposes the 3D Universe gateway", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator(".allpha-public-universe, .allpha-public-splash").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
  });

  test("public Worlds surface loads the canonical public Theme catalog", async ({ page }) => {
    await page.goto(`${BASE_URL}/worlds`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Explore the World layer." })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "World environments" })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
  });
});
