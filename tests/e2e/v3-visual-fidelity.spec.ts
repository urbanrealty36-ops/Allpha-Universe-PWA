import { test, expect, type BrowserContextOptions } from "@playwright/test";
import { existsSync } from "node:fs";

/**
 * Authenticated production V3 visual/runtime verification.
 *
 * Configure:
 *   ALLPHA_V3_E2E_BASE_URL=https://your-deployed-web-origin
 *   ALLPHA_V3_E2E_STORAGE_STATE=/secure/path/to/playwright-storage-state.json
 *   ALLPHA_V3_E2E_ROUTES='{"Galaxy":"/galaxy","World":"/world?world_id=...","District":"/districts/...","Booth":"/booths/...","Live Stage":"/live/...","AI Character":"/agents/..."}'
 *
 * Route values must point at real, authorized production/staging fixtures. No
 * credentials or fixture IDs are embedded in the repository.
 */
const baseURL = process.env.ALLPHA_V3_E2E_BASE_URL;
const storageState = process.env.ALLPHA_V3_E2E_STORAGE_STATE;
const routeJson = process.env.ALLPHA_V3_E2E_ROUTES;
const requiredSurfaces = ["Galaxy", "World", "District", "Booth", "Live Stage", "AI Character"] as const;
const routes: Record<string, string> = routeJson ? JSON.parse(routeJson) : {};

const configured = Boolean(
  baseURL &&
  storageState &&
  existsSync(storageState) &&
  requiredSurfaces.every((surface) => typeof routes[surface] === "string" && routes[surface].length > 0),
);

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true },
]) {
  for (const surface of requiredSurfaces) {
    test(`V3 authenticated ${surface} renders signed GLB on ${viewport.name}`, async ({ browser }) => {
      test.skip(!configured, "Set authenticated V3 E2E base URL, storage state, and six real route fixtures.");

      const contextOptions: BrowserContextOptions = {
        storageState: storageState!,
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        deviceScaleFactor: viewport.isMobile ? 2 : 1,
      };
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const manifestAssets = new Set<string>();
      const unexpectedGlbResponses: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("response", async (response) => {
        const url = response.url();
        if (url.includes("/asset-manifest")) {
          if (!response.ok()) {
            unexpectedGlbResponses.push(`manifest ${response.status()} ${url}`);
            return;
          }
          try {
            const payload = await response.json();
            const assets = payload?.data?.binary_3d_assets;
            if (Array.isArray(assets)) {
              for (const asset of assets) {
                const path = String(asset?.storage_path ?? "");
                const signedUrl = String(asset?.signed_url ?? "");
                if (path.startsWith("theme-v3-tripo/") && signedUrl) manifestAssets.add(signedUrl);
              }
            }
          } catch {
            unexpectedGlbResponses.push(`invalid manifest JSON ${url}`);
          }
        }
        if (/\.glb(?:\?|$)/i.test(url)) {
          if (!response.ok()) unexpectedGlbResponses.push(`GLB ${response.status()} ${url}`);
          if (!manifestAssets.has(url)) unexpectedGlbResponses.push(`GLB not sourced from V3 manifest ${url}`);
        }
      });

      try {
        const route = routes[surface].startsWith("http")
          ? routes[surface]
          : new URL(routes[surface], baseURL!).toString();
        await page.goto(route, { waitUntil: "domcontentloaded" });
        const runtime = page.locator('[data-allpha-3d-runtime="true"]').first();
        await expect(runtime, `${surface} must mount the canonical AllphaWorldRenderer`).toBeVisible({ timeout: 30_000 });
        await expect(runtime).toHaveAttribute("data-allpha-3d-asset-state", "visible", { timeout: 60_000 });
        await expect.poll(async () => Number(await runtime.getAttribute("data-allpha-3d-mesh-count"))).toBeGreaterThan(0);
        await expect.poll(async () => Number(await runtime.getAttribute("data-allpha-3d-object-count"))).toBeGreaterThan(0);
        await expect(page.locator("canvas").first()).toBeVisible();

        // Runtime success must be from a signed V3 manifest, not legacy URL or
        // procedural/golden fallback. Require a real V3 manifest and no GLB
        // request outside the signed URLs returned by that manifest.
        expect([...manifestAssets].length, `${surface} must resolve signed theme-v3-tripo assets`).toBeGreaterThan(0);
        expect(unexpectedGlbResponses, "Manifest/GLB responses must be successful and manifest-authorized").toEqual([]);
        expect(consoleErrors.filter((error) => /WebGL|GLTF|GLB|asset-manifest/i.test(error))).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}
