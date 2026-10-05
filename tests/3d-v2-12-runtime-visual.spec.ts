import { test, expect } from "@playwright/test";

const baseURL = process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app";
const apiBaseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://allpha-api-production.up.railway.app").replace(/\/$/, "");
const THEMES = ["aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city","desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden","galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier","mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis","pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"];

async function assertLiveManifest(request: any, themeKey: string) {
  const response = await request.get(`${apiBaseURL}/api/v1/themes/world-runtime/public/themes/${encodeURIComponent(themeKey)}/asset-manifest`);
  expect(response.status(), `Live manifest HTTP for ${themeKey}`).toBe(200);
  const payload = await response.json();
  const assets = payload?.data?.binary_3d_assets ?? [];
  expect(assets, `${themeKey} must expose the 14 V2 categories`).toHaveLength(14);
  expect(payload?.data?.storage_bucket).toBe("allpha-world-assets");
  expect(payload?.data?.has_binary_3d_pack).toBe(true);
  for (const asset of assets) {
    expect(String(asset.storage_path)).toMatch(/^theme-v2-real-3d\/[^/]+\/[^/]+\.glb$/);
    expect(asset.signed_url, `${themeKey} asset must have signed_url`).toBeTruthy();
    expect(String(asset.storage_path)).not.toBe(`${themeKey}.glb`);
  }
  return assets;
}

async function assertRendererFetch(page: any, themeKey: string) {
  const glbPromise = new Promise<string>((resolve) => {
    const listener = (response: any) => {
      if (/\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) {
        page.off("response", listener);
        resolve(response.url());
      }
    };
    page.on("response", listener);
  });
  await page.goto(`${baseURL}/qa/3d-v2?theme=${encodeURIComponent(themeKey)}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page.locator('[data-testid="v2-runtime-theme"]')).toHaveAttribute("data-theme", themeKey, { timeout: 20_000 });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
  await Promise.race([
    glbPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out waiting for GLB fetch: ${themeKey}`)), 25_000)),
  ]);
}

test.describe("3D-V2.12 Railway live delivery chain", () => {
  test("Railway live endpoint exposes all 25 themes and 350 signed V2 assets", async ({ request }) => {
    test.setTimeout(120_000);
    const results = await Promise.all(THEMES.map((themeKey) => assertLiveManifest(request, themeKey)));
    expect(results).toHaveLength(25);
    expect(results.reduce((sum, assets) => sum + assets.length, 0)).toBe(350);
  });

  test("signed URLs fetch real GLB binaries for all 25 themes", async ({ request }) => {
    test.setTimeout(120_000);
    const checks = await Promise.all(THEMES.map(async (themeKey) => {
      const assets = await assertLiveManifest(request, themeKey);
      const sample = assets[0];
      const response = await request.get(sample.signed_url);
      expect(response.status(), `Signed GLB GET for ${themeKey}`).toBe(200);
      expect(response.headers()["content-type"] || "").toMatch(/model\/gltf-binary|application\/octet-stream/i);
      expect((await response.body()).byteLength).toBeGreaterThan(1000);
      return true;
    }));
    expect(checks).toHaveLength(25);
  });

  test("canonical browser renderer loads a real GLB for every theme", async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);
    for (const themeKey of THEMES) await assertRendererFetch(page, themeKey);
  });

  test("mobile canonical browser renderer loads a real GLB", async ({ browser }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
    const page = await context.newPage();
    await assertRendererFetch(page, "crystal-ai-city");
    await page.screenshot({ path: "test-results/v2-12-mobile-live.png", fullPage: true });
    await context.close();
  });

});
