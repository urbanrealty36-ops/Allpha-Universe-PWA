import { test, expect } from "@playwright/test";

const baseURL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const apiBaseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://allpha-api-production.up.railway.app").replace(/\/$/, "");
const worldId = process.env.ALLPHA_D6_WORLD_ID;

function worldUrl() {
  if (!worldId) throw new Error("ALLPHA_D6_WORLD_ID is required and must come from the canonical Continue Context document.");
  return `${baseURL}/world?world_id=${encodeURIComponent(worldId)}`;
}

test.describe("V2.13D.6.2 Production Browser Runtime Verification", () => {
  test("canonical World mounts AllphaWorldRenderer and requests the V2.13 world GLB", async ({ page }) => {
    test.setTimeout(4 * 60 * 1000);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const glbResponses: string[] = [];
    let worldApiStatus: number | null = null;
    let manifestStatus: number | null = null;

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/v1/themes/world-runtime/public/worlds/")) worldApiStatus = response.status();
      if (url.includes("/api/v1/themes/world-runtime/public/themes/crystal-ai-city/asset-manifest")) manifestStatus = response.status();
      if (/theme-v2-real-3d\/v2\.13\/crystal-ai-city\/world\.glb(?:\?|$)/i.test(url) && response.status() === 200) {
        glbResponses.push(url);
      }
    });

    let lastCanvas = 0;
    let lastWebGL = false;

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      await page.goto(worldUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(4_000);

      const runtime = await page.evaluate(() => {
        const canvases = Array.from(document.querySelectorAll("canvas")) as HTMLCanvasElement[];
        for (const canvas of canvases) {
          const rect = canvas.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          const context = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (context) return { canvas: rect.width * rect.height, webgl: true };
        }
        return { canvas: 0, webgl: false };
      });

      lastCanvas = runtime.canvas;
      lastWebGL = runtime.webgl;

      if (runtime.canvas > 0 && runtime.webgl && glbResponses.length > 0) break;
      await page.waitForTimeout(10_000);
    }

    expect(worldApiStatus, "World runtime API must respond").toBe(200);
    expect(manifestStatus, "V2.13 Crystal AI City asset manifest must respond").toBe(200);
    expect(lastCanvas, "Production World must mount a visible canvas").toBeGreaterThan(0);
    expect(lastWebGL, "Production World canvas must expose a WebGL context").toBe(true);
    expect(glbResponses.length, "Production World must request the V2.13 world GLB").toBeGreaterThan(0);
    expect(glbResponses[0]).toContain("theme-v2-real-3d/v2.13/crystal-ai-city/world.glb");
    expect(consoleErrors, "Production World must have no console errors").toEqual([]);
    expect(pageErrors, "Production World must have no page errors").toEqual([]);

    await page.screenshot({ path: "test-results/d6-2-production-world.png", fullPage: true });
  });

  test("mobile canonical World runtime mounts WebGL and loads the V2.13 world GLB", async ({ browser }) => {
    test.setTimeout(3 * 60 * 1000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
    });
    const page = await context.newPage();
    const glbResponses: string[] = [];
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (/theme-v2-real-3d\/v2\.13\/crystal-ai-city\/world\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) {
        glbResponses.push(response.url());
      }
    });

    let runtime = { canvas: 0, webgl: false };
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      await page.goto(worldUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(4_000);
      runtime = await page.evaluate(() => {
        const canvases = Array.from(document.querySelectorAll("canvas")) as HTMLCanvasElement[];
        for (const canvas of canvases) {
          const rect = canvas.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          const context = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (context) return { canvas: rect.width * rect.height, webgl: true };
        }
        return { canvas: 0, webgl: false };
      });
      if (runtime.canvas > 0 && runtime.webgl && glbResponses.length > 0) break;
      await page.waitForTimeout(10_000);
    }

    expect(runtime.canvas).toBeGreaterThan(0);
    expect(runtime.webgl).toBe(true);
    expect(glbResponses.length).toBeGreaterThan(0);
    expect(glbResponses[0]).toContain("theme-v2-real-3d/v2.13/crystal-ai-city/world.glb");
    expect(pageErrors).toEqual([]);

    await page.screenshot({ path: "test-results/d6-2-production-world-mobile.png", fullPage: true });
    await context.close();
  });
});
