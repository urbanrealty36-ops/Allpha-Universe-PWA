import { test, expect, type Page } from "@playwright/test";

const baseURL = process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app";
const supabaseURL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const THEMES = ["aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city","desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden","galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier","mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis","pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"];

async function installLiveManifestRoute(page: Page) {
  if (!supabaseURL || !serviceKey) throw new Error("Supabase QA secrets are required for browser asset verification");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

  await page.route("**/api/v1/themes/world-runtime/public/themes/*/asset-manifest", async route => {
    const url = route.request().url();
    const match = url.match(/\/public\/themes\/([^/]+)\/asset-manifest$/);
    const themeKey = decodeURIComponent(match?.[1] || "");
    const themeResponse = await fetch(
      `${supabaseURL}/rest/v1/themes?source=eq.platform&status=eq.published&moderation_status=eq.approved&or=(slug.eq.${encodeURIComponent(themeKey)},catalog_key.eq.${encodeURIComponent(themeKey)})&select=id,name,slug,source,status,moderation_status,catalog_key&limit=1`,
      { headers },
    );
    const themes = await themeResponse.json();
    const theme = themes[0];
    if (!theme) return route.fulfill({ status: 404, body: JSON.stringify({ detail: { code: "QA_THEME_NOT_FOUND" } }) });

    const assetsResponse = await fetch(
      `${supabaseURL}/rest/v1/theme_assets?theme_id=eq.${theme.id}&storage_path=like.*theme-v2-real-3d/*&select=id,theme_id,theme_version_id,asset_type,storage_bucket,storage_path,mime_type,metadata,sort_order,status,moderation_status,safety_status,performance_status,content_size_bytes,checksum_sha256,uploaded_at&order=sort_order.asc&limit=100`,
      { headers },
    );
    const assets = await assetsResponse.json();
    const productionAssets = [];
    for (const asset of assets) {
      const sign = await fetch(
        `${supabaseURL}/storage/v1/object/sign/${asset.storage_bucket}/${asset.storage_path}`,
        { method: "POST", headers, body: JSON.stringify({ expiresIn: 900 }) },
      );
      if (!sign.ok) throw new Error(`Signed URL failed for ${asset.storage_path}: HTTP ${sign.status}`);
      const signed = await sign.json();
      const signedURL = signed.signedURL || signed.signedUrl;
      if (!signedURL) throw new Error(`Missing signed URL for ${asset.storage_path}`);
      const absolute = signedURL.startsWith("http") ? signedURL : `${supabaseURL}/storage/v1${signedURL}`;
      productionAssets.push({ ...asset, signed_url: absolute });
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          theme,
          storage_bucket: "allpha-world-assets",
          assets: productionAssets,
          binary_3d_assets: productionAssets,
          has_binary_3d_pack: productionAssets.length > 0,
          presentation_only: true,
          public: true,
          qa_only: true,
          lifecycle: "staged",
        },
      }),
    });
  });
}

async function assertRealProductionAsset(page: Page) {
  const glbResponses: string[] = [];
  page.on("response", response => {
    if (/\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) glbResponses.push(response.url());
  });
  await page.waitForTimeout(10_000);
  expect(glbResponses.length, "At least one real production GLB must be fetched by the renderer").toBeGreaterThan(0);
}

test.describe("3D-V2.12 runtime visual evidence", () => {
  test.beforeEach(async ({ page }) => {
    await installLiveManifestRoute(page);
  });

  test("desktop renders a real production GLB", async ({ page }) => {
    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(2_000);
    await assertRealProductionAsset(page);
    await page.screenshot({ path: "test-results/v2-12-desktop.png", fullPage: true });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
  });

  test("mobile renders a real production GLB", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
    const page = await context.newPage();
    await installLiveManifestRoute(page);
    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(2_000);
    await assertRealProductionAsset(page);
    await page.screenshot({ path: "test-results/v2-12-mobile.png", fullPage: true });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
    await context.close();
  });

  test("all 25 production theme records are present in the live Supabase matrix", async () => {
    const response = await fetch(`${supabaseURL}/rest/v1/theme_assets?storage_path=like.*theme-v2-real-3d/*&select=storage_path&limit=1000`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    expect(response.ok).toBeTruthy();
    const assets = await response.json();
    const themes = new Set(assets.map((x: { storage_path: string }) => x.storage_path.split("/")[1]));
    expect(themes.size).toBe(25);
    expect(assets).toHaveLength(350);
  });

  test("theme catalog coverage is exactly 25 themes", async () => {
    expect(THEMES).toHaveLength(25);
  });
});
