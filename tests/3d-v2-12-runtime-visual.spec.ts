import { test, expect } from "@playwright/test";

const baseURL = process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app";
const apiBaseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://allpha-api-production.up.railway.app").replace(/\/$/, "");
const supabaseURL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
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
  const glbResponses: string[] = [];
  page.on("response", (response: any) => {
    if (/\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) glbResponses.push(response.url());
  });
  await page.goto(`${baseURL}/qa/3d-v2?theme=${encodeURIComponent(themeKey)}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page.locator('[data-testid="v2-runtime-theme"]')).toHaveAttribute("data-theme", themeKey, { timeout: 20_000 });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(8_000);
  expect(glbResponses.length, `Browser renderer must fetch a real GLB for ${themeKey}`).toBeGreaterThan(0);
}

test.describe("3D-V2.12 Railway live delivery chain", () => {
  test("Railway live endpoint exposes all 25 themes and 350 signed V2 assets", async ({ request }) => {
    const counts: number[] = [];
    for (const themeKey of THEMES) {
      const assets = await assertLiveManifest(request, themeKey);
      counts.push(assets.length);
    }
    expect(counts.reduce((sum, value) => sum + value, 0)).toBe(350);
  });

  test("signed URLs fetch real GLB binaries for all 25 themes", async ({ request }) => {
    for (const themeKey of THEMES) {
      const assets = await assertLiveManifest(request, themeKey);
      const sample = assets[0];
      const response = await request.get(sample.signed_url);
      expect(response.status(), `Signed GLB GET for ${themeKey}`).toBe(200);
      expect(response.headers()["content-type"] || "").toMatch(/model\/gltf-binary|application\/octet-stream/i);
      expect((await response.body()).byteLength).toBeGreaterThan(1000);
    }
  });

  test("canonical browser renderer loads a real GLB for every theme", async ({ page }) => {
    for (const themeKey of THEMES) await assertRendererFetch(page, themeKey);
  });

  test("mobile canonical browser renderer loads a real GLB", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
    const page = await context.newPage();
    await assertRendererFetch(page, "crystal-ai-city");
    await page.screenshot({ path: "test-results/v2-12-mobile-live.png", fullPage: true });
    await context.close();
  });

  test("live Supabase matrix remains exactly 25 themes x 14 categories", async () => {
    expect(supabaseURL).toBeTruthy();
    expect(serviceKey).toBeTruthy();
    const response = await fetch(`${supabaseURL}/rest/v1/theme_assets?storage_path=like.*theme-v2-real-3d/*&select=storage_path,status,moderation_status,safety_status,performance_status&limit=1000`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    expect(response.ok).toBeTruthy();
    const assets = await response.json();
    expect(assets).toHaveLength(350);
    expect(new Set(assets.map((x: { storage_path: string }) => x.storage_path.split("/")[1])).size).toBe(25);
    expect(assets.every((x: { status: string; moderation_status: string; safety_status: string; performance_status: string }) => x.status === "active" && x.moderation_status === "approved" && x.safety_status === "passed" && x.performance_status === "passed")).toBe(true);
  });
});
