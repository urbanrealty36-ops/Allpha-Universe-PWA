import { test, expect } from "@playwright/test";

const baseURL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const worldId = process.env.ALLPHA_D6_WORLD_ID;

function worldUrl() {
  if (!worldId) throw new Error("ALLPHA_D6_WORLD_ID is required and must come from the canonical Continue Context document.");
  return `${baseURL}/world?world_id=${encodeURIComponent(worldId)}`;
}

async function waitForVisibleProductionAsset(page: any) {
  let marker: {
    state: string;
    meshCount: number;
    objectCount: number;
    bounds: string;
  } | null = null;

  await expect.poll(
    async () => {
      marker = await page.locator("[data-allpha-3d-runtime]").evaluate((element: HTMLElement) => ({
        state: element.dataset.allpha3dAssetState ?? "unknown",
        meshCount: Number(element.dataset.allpha3dMeshCount ?? 0),
        objectCount: Number(element.dataset.allpha3dObjectCount ?? 0),
        bounds: element.dataset.allpha3dBounds ?? "",
      }));
      return marker.state;
    },
    { timeout: 180_000, intervals: [500, 1000, 2000, 5000] },
  ).toBe("visible");

  return marker!;
}

async function inspectRenderedCanvas(page: any) {
  return page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll("canvas")) as HTMLCanvasElement[];
    const canvas = canvases.find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!canvas) return { canvas: 0, webgl: false, sampledPixels: 0, litPixels: 0, depthPixels: 0 };

    const rect = canvas.getBoundingClientRect();
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { canvas: rect.width * rect.height, webgl: false, sampledPixels: 0, litPixels: 0, depthPixels: 0 };

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let sampledPixels = 0;
    let litPixels = 0;
    const step = Math.max(1, Math.floor(Math.max(width, height) / 240));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const luminance = pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
        sampledPixels += 1;
        if (luminance > 18 && pixels[i + 3] > 0) litPixels += 1;
      }
    }

    return {
      canvas: rect.width * rect.height,
      webgl: true,
      sampledPixels,
      litPixels,
      litRatio: sampledPixels ? litPixels / sampledPixels : 0,
      drawingBuffer: [width, height],
    };
  });
}

test.describe("V2.13D.6.3 Production 3D Visual Render Verification", () => {
  test("desktop World renders the real V2.13 GLB visibly in the production camera", async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const glbResponses: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (/theme-v2-real-3d\/v2\.13\/crystal-ai-city\/world\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) {
        glbResponses.push(response.url());
      }
    });

    await page.goto(worldUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
    const asset = await waitForVisibleProductionAsset(page);
    const canvas = await inspectRenderedCanvas(page);

    expect(asset.state).toBe("visible");
    expect(asset.meshCount, "Production GLB must contain real meshes").toBeGreaterThan(0);
    expect(asset.objectCount, "Production GLB must contain a parsed scene graph").toBeGreaterThan(0);
    expect(asset.bounds, "Production GLB must expose non-zero geometry bounds").not.toBe("");
    expect(glbResponses.length, "Production World must download the V2.13 world GLB").toBeGreaterThan(0);
    expect(canvas.canvas, "Production World canvas must be visible").toBeGreaterThan(0);
    expect(canvas.webgl, "Production World canvas must expose WebGL").toBe(true);
    expect(canvas.litRatio, "Production World must render non-background pixels").toBeGreaterThan(0.01);
    expect(consoleErrors, "Production World must have no console errors").toEqual([]);
    expect(pageErrors, "Production World must have no page errors").toEqual([]);

    await page.screenshot({ path: "test-results/d6-3-production-world-desktop.png", fullPage: true });
  });

  test("mobile World renders the real V2.13 GLB visibly", async ({ browser }) => {
    test.setTimeout(5 * 60 * 1000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
    });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    const glbResponses: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (/theme-v2-real-3d\/v2\.13\/crystal-ai-city\/world\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) {
        glbResponses.push(response.url());
      }
    });

    await page.goto(worldUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
    const asset = await waitForVisibleProductionAsset(page);
    const canvas = await inspectRenderedCanvas(page);

    expect(asset.state).toBe("visible");
    expect(asset.meshCount).toBeGreaterThan(0);
    expect(glbResponses.length).toBeGreaterThan(0);
    expect(canvas.canvas).toBeGreaterThan(0);
    expect(canvas.webgl).toBe(true);
    expect(canvas.litRatio).toBeGreaterThan(0.01);
    expect(pageErrors).toEqual([]);

    await page.screenshot({ path: "test-results/d6-3-production-world-mobile.png", fullPage: true });
    await context.close();
  });
});
