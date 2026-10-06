import { test, expect } from "@playwright/test";

const baseUrl = process.env.ALLPHA_QA_BASE_URL ?? "https://allphaweb-production.up.railway.app";
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");
const expectedCategories = [
  "universe","galaxy","world","orbit","capsule","district","booth","content-feed",
  "agent-character","live-stage","human-live","sticker-social","animation","navigation-fx",
];

test("V2.13B Crystal AI City golden manifest is runtime-ready", async ({ request }) => {
  const response = await request.get(
    apiBase + "/api/v1/themes/world-runtime/public/themes/crystal-ai-city/asset-manifest",
    { timeout: 30000 },
  );
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  const assets = payload?.data?.binary_3d_assets ?? [];
  expect(assets.length).toBeGreaterThanOrEqual(expectedCategories.length);

  const categories = new Set(
    assets
      .filter((asset: any) => asset?.signed_url)
      .map((asset: any) => String(asset?.metadata?.category ?? ""))
      .filter(Boolean),
  );

  for (const category of expectedCategories) {
    expect(categories.has(category), "missing signed runtime asset: " + category).toBeTruthy();
  }

  const goldenAssets = assets.filter((asset: any) =>
    asset?.metadata?.art_quality === "production-realistic-golden" &&
    asset?.metadata?.schema === "allpha-3d-v2-13-production-art/1.1",
  );
  expect(goldenAssets.length).toBeGreaterThanOrEqual(expectedCategories.length);
});

test("V2.13B public Universe runtime renders WebGL", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30000 });

  const webgl = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return false;
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  });
  expect(webgl).toBeTruthy();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "test-results/v2-13b-crystal-ai-city-runtime.png",
    fullPage: true,
  });
});
