import { test, expect, type BrowserContextOptions } from "@playwright/test";
import { existsSync } from "node:fs";

/**
 * Authenticated V3 visual/runtime matrix. Configure a real staging/production
 * session and fixture routes; never commit credentials or private fixture IDs.
 */
const baseURL = process.env.ALLPHA_V3_E2E_BASE_URL;
const storageState = process.env.ALLPHA_V3_E2E_STORAGE_STATE;
const routeJson = process.env.ALLPHA_V3_E2E_ROUTES;
const surfaces = ["Galaxy", "World", "District", "Booth", "Live Stage", "AI Character"] as const;
const routes: Record<string, string> = routeJson ? JSON.parse(routeJson) : {};
const configured = Boolean(
  baseURL &&
  storageState &&
  existsSync(storageState) &&
  surfaces.every((surface) => typeof routes[surface] === "string" && routes[surface].length > 0),
);

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true },
]) {
  for (const surface of surfaces) {
    test(`V3 authenticated ${surface} renders signed GLB on ${viewport.name}`, async ({ browser }) => {
      test.skip(!configured, "Configure ALLPHA_V3_E2E_BASE_URL, ALLPHA_V3_E2E_STORAGE_STATE and all six ALLPHA_V3_E2E_ROUTES.");

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
      const glbResponses: Array<{ url: string; status: number }> = [];
      const manifestFailures: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("response", async (response) => {
        const url = response.url();
        if (/\.glb(?:\?|$)/i.test(url)) glbResponses.push({ url, status: response.status() });
        if (!url.includes("/asset-manifest")) return;
        if (!response.ok()) {
          manifestFailures.push(`manifest ${response.status()} ${url}`);
          return;
        }
        try {
          const payload = await response.json();
          const assets = payload?.data?.binary_3d_assets;
          if (!Array.isArray(assets)) {
            manifestFailures.push(`manifest missing binary_3d_assets ${url}`);
            return;
          }
          for (const asset of assets) {
            const path = String(asset?.storage_path ?? "").replace(/^\/+/, "");
            const signedUrl = String(asset?.signed_url ?? "");
            if (path.startsWith("theme-v3-tripo/") && signedUrl) manifestAssets.add(signedUrl);
          }
        } catch {
          manifestFailures.push(`invalid manifest JSON ${url}`);
        }
      });

      try {
        const route = routes[surface].startsWith("http")
          ? routes[surface]
          : new URL(routes[surface], baseURL!).toString();
        await page.goto(route, { waitUntil: "domcontentloaded" });

        const runtime = page.locator('[data-allpha-3d-runtime="true"]').first();
        await expect(runtime, `${surface} must mount AllphaWorldRenderer`).toBeVisible({ timeout: 30_000 });
        await expect(runtime).toHaveAttribute("data-allpha-3d-asset-state", "visible", { timeout: 60_000 });
        await expect.poll(async () => Number(await runtime.getAttribute("data-allpha-3d-mesh-count"))).toBeGreaterThan(0);
        await expect.poll(async () => Number(await runtime.getAttribute("data-allpha-3d-object-count"))).toBeGreaterThan(0);
        await expect(page.locator("canvas").first()).toBeVisible();

        expect([...manifestAssets].length, `${surface} must resolve signed assets from theme-v3-tripo`).toBeGreaterThan(0);
        expect(manifestFailures, "Asset manifests must be valid and successful").toEqual([]);
        expect(glbResponses.length, "At least one GLB must load").toBeGreaterThan(0);
        for (const response of glbResponses) {
          expect(response.status, `GLB request failed: ${response.url}`).toBe(200);
          expect(manifestAssets.has(response.url), `GLB bypassed signed V3 manifest: ${response.url}`).toBe(true);
        }
        expect(consoleErrors.filter((error) => /WebGL|GLTF|GLB|asset-manifest/i.test(error))).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}
