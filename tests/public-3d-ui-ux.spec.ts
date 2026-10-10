import { test, expect } from "@playwright/test";

const BASE_URL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const PRODUCTION_DEPLOYMENT_WAIT_MS = 180_000;

test.describe("Public 3D UI/UX", () => {
  test("public splash exposes the 3D Universe gateway and a terminal character state", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });

    // This workflow runs on source pushes while Railway deploys asynchronously.
    // Keep the same product assertions, but allow the production deployment window.
    await expect(page.locator(".allpha-public-universe, .allpha-public-splash").first()).toBeVisible({
      timeout: PRODUCTION_DEPLOYMENT_WAIT_MS,
    });
    await expect(page.locator("canvas").first()).toBeVisible({
      timeout: PRODUCTION_DEPLOYMENT_WAIT_MS,
    });

    const characterScene = page.locator('[data-public-3d-state]').first();
    await expect(characterScene).toHaveAttribute("data-public-3d-state", /^(loaded|visible|error)$/, {
      timeout: PRODUCTION_DEPLOYMENT_WAIT_MS,
    });

    if (await characterScene.getAttribute("data-public-3d-state") === "error") {
      await expect(page.locator('[aria-label="AI Character fallback preview"]')).toBeVisible();
      await expect(page.locator(".allpha-public-3d-splash [role='status']")).toContainText("AI Character preview unavailable");
    }
  });

  test("public Worlds surface loads the canonical public Theme catalog", async ({ page }) => {
    await page.goto(`${BASE_URL}/worlds`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Explore the World layer." })).toBeVisible({ timeout: PRODUCTION_DEPLOYMENT_WAIT_MS });
    await expect(page.getByRole("heading", { name: "World environments" })).toBeVisible({ timeout: PRODUCTION_DEPLOYMENT_WAIT_MS });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: PRODUCTION_DEPLOYMENT_WAIT_MS });
  });
});
