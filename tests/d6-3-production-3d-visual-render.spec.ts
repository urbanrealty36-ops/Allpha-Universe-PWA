import { test, expect } from "@playwright/test";

const baseURL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const worldId = process.env.ALLPHA_D6_WORLD_ID;

function worldUrl() {
  if (!worldId) throw new Error("ALLPHA_D6_WORLD_ID is required and must come from the canonical Continue Context document.");
  return `${baseURL}/world?world_id=${encodeURIComponent(worldId)}`;
}

async function waitForVisibleProductionAsset(page: any) {
  return await page.waitForFunction(
    () => {
      const element = document.querySelector("[data-allpha-3d-runtime]") as HTMLElement | null;
      if (!element || element.dataset.allpha3dAssetState !== "visible") return false;

      return {
        state: element.dataset.allpha3dAssetState,
        meshCount: Number(element.dataset.allpha3dMeshCount ?? 0),
        objectCount: Number(element.dataset.allpha3dObjectCount ?? 0),
        bounds: element.dataset.allpha3dBounds ?? "",
      };
    },
    { timeout: 180_000 },
  ).then(async (handle: any) => {
    try {
      return await handle.jsonValue();
    } finally {
      await handle.dispose();
    }
  });
}

async function inspectRenderedCanvas(page: any) {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) return { canvas: 0, webgl: false, sampledPixels: 0, litPixels: 0, depthPixels: 0, litRatio: 0 };

  const webgl = await page.evaluate(() => {
    const node = Array.from(document.querySelectorAll("canvas")).find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) as HTMLCanvasElement | undefined;
    if (!node) return false;
    return Boolean(node.getContext("webgl2") || node.getContext("webgl") || node.getContext("experimental-webgl"));
  });
  if (!webgl) return { canvas: box.width * box.height, webgl: false, sampledPixels: 0, litPixels: 0, depthPixels: 0, litRatio: 0 };

  const png = await page.screenshot({ clip: box, animations: "disabled" });
  const bytes = Buffer.from(png);
  if (bytes.toString("ascii", 1, 4) !== "PNG") {
    return { canvas: box.width * box.height, webgl: true, sampledPixels: 0, litPixels: 0, depthPixels: 0, litRatio: 0 };
  }

  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const startOffset = offset + 8, endOffset = startOffset + length;
    if (endOffset + 4 > bytes.length) break;
    if (type === "IHDR") {
      width = bytes.readUInt32BE(startOffset);
      height = bytes.readUInt32BE(startOffset + 4);
      bitDepth = bytes[startOffset + 8];
      colorType = bytes[startOffset + 9];
      interlace = bytes[startOffset + 12];
    } else if (type === "IDAT") {
      idat.push(bytes.subarray(startOffset, endOffset));
    } else if (type === "IEND") {
      break;
    }
    offset = endOffset + 4;
  }

  if (!width || !height || bitDepth !== 8 || interlace !== 0 || !idat.length || ![2, 6].includes(colorType)) {
    return { canvas: box.width * box.height, webgl: true, sampledPixels: 0, litPixels: 0, depthPixels: 0, litRatio: 0 };
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const rows = Buffer.alloc(height * stride);
  let src = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[src++];
      const left = x >= channels ? rows[row + x - channels] : 0;
      const up = y ? rows[row - stride + x] : 0;
      const upLeft = y && x >= channels ? rows[row - stride + x - channels] : 0;
      let decoded = value;
      if (filter === 1) decoded = (value + left) & 255;
      else if (filter === 2) decoded = (value + up) & 255;
      else if (filter === 3) decoded = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        decoded = (value + predictor) & 255;
      }
      rows[row + x] = decoded;
    }
  }

  let sampledPixels = 0;
  let litPixels = 0;
  let sum = 0;
  let sumSq = 0;
  const step = Math.max(1, Math.floor(Math.max(width, height) / 220));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = y * stride + x * channels;
      const luminance = rows[i] * 0.2126 + rows[i + 1] * 0.7152 + rows[i + 2] * 0.0722;
      const alpha = channels === 4 ? rows[i + 3] : 255;
      sampledPixels += 1;
      sum += luminance;
      sumSq += luminance * luminance;
      if (luminance > 18 && alpha > 0) litPixels += 1;
    }
  }

  const mean = sampledPixels ? sum / sampledPixels : 0;
  const variance = sampledPixels ? Math.max(0, sumSq / sampledPixels - mean * mean) : 0;
  return {
    canvas: box.width * box.height,
    webgl: true,
    sampledPixels,
    litPixels,
    depthPixels: 0,
    litRatio: sampledPixels ? litPixels / sampledPixels : 0,
    variance,
    drawingBuffer: [width, height],
  };
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
