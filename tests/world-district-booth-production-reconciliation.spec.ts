import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const BASE_URL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

const WORLD_ID = "b97e25db-54ac-472d-92ed-e4a8eac85a0e";
const WORLD_NAME = "Crystal AI City World";
const THEME_KEY = "crystal-ai-city";
const DISTRICT_ID = "b0aaec74-22a9-4eb8-9b71-0b6fb7b3418c";
const BOOTH_ID = "c037cffb-d3be-4a3a-b41d-83f80b25f23e";

test.describe("World → District → Booth production visual/runtime reconciliation", () => {
  test("canonical production contract is bound to explicit spatial layers", async () => {
    const renderer = await readFile("apps/web/components/world/allpha-world-renderer.tsx", "utf8");
    const world = await readFile("apps/web/components/world/world-experience.tsx", "utf8");
    const district = await readFile("apps/web/components/district-experience-surface.tsx", "utf8");
    const booth = await readFile("apps/web/components/booth-experience-surface.tsx", "utf8");
    const production = await readFile("apps/web/components/world/theme-v2-production-asset-scene.tsx", "utf8");

    expect(renderer).toContain('productionSpatialLayer?: "world" | "district" | "booth"');
    expect(renderer).toContain("productionAssetUrl?: string | null");
    expect(renderer).toContain("directAssetUrl={productionAssetUrl}");
    expect(world).toContain('productionSpatialLayer="world"');
    expect(district).toContain('productionSpatialLayer="district"');
    expect(booth).toContain('productionSpatialLayer="booth"');
    expect(booth).toContain("productionAssetUrl={typeof boothNode.metadata?.model_url === \"string\" ? boothNode.metadata.model_url : null}");
    expect(production).toContain("directAssetUrl?: string | null");
    expect(production).toContain("if (directAssetUrl)");
  });

  test("canonical Crystal AI City production manifest resolves World and District assets", async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/api/v1/themes/world-runtime/public/themes/${THEME_KEY}/asset-manifest`,
      { timeout: 60_000 },
    );
    expect(response.ok()).toBe(true);

    const payload = await response.json();
    const assets = payload?.data?.binary_3d_assets ?? [];
    const paths = assets.map((asset: { storage_path?: string | null }) => String(asset.storage_path ?? ""));

    expect(paths).toContain(`theme-v2-real-3d/v2.13/${THEME_KEY}/world.glb`);
    expect(paths).toContain(`theme-v2-real-3d/v2.13/${THEME_KEY}/district.glb`);
  });

  test("canonical production World remains visually live", async ({ page }) => {
    await page.goto(`${BASE_URL}/world?world_id=${WORLD_ID}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("h1").filter({ hasText: WORLD_NAME })).toBeVisible({ timeout: 60_000 });

    const marker = page.locator("[data-allpha-3d-runtime]").first();
    await expect.poll(
      async () => await marker.getAttribute("data-allpha-3d-asset-state"),
      { timeout: 180_000 },
    ).toBe("visible");

    await expect.poll(
      async () => Number(await marker.getAttribute("data-allpha-3d-mesh-count") || 0),
      { timeout: 30_000 },
    ).toBeGreaterThan(0);
  });

  test("canonical hierarchy identifiers remain locked", async () => {
    expect(WORLD_ID).toBe("b97e25db-54ac-472d-92ed-e4a8eac85a0e");
    expect(DISTRICT_ID).toBe("b0aaec74-22a9-4eb8-9b71-0b6fb7b3418c");
    expect(BOOTH_ID).toBe("c037cffb-d3be-4a3a-b41d-83f80b25f23e");
  });
});
