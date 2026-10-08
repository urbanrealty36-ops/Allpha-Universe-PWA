import { inflateSync } from "node:zlib";
import { test, expect } from "@playwright/test";

const baseURL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const worldId = process.env.ALLPHA_D6_WORLD_ID;

function worldUrl() {
  if (!worldId) throw new Error("ALLPHA_D6_WORLD_ID is required and must come from the canonical Continue Context document.");
  return `${baseURL}/world?world_id=${encodeURIComponent(worldId)}`;
}

async function readProductionMarker(page: any) {
  return page.waitForFunction(() => {
    const element = document.querySelector("[data-allpha-3d-runtime]") as HTMLElement | null;
    if (!element) return false;
    const state = element.dataset.allpha3dAssetState ?? "";
    const meshCount = Number(element.dataset.allpha3dMeshCount ?? 0);
    const objectCount = Number(element.dataset.allpha3dObjectCount ?? 0);
    const materialCount = Number(element.dataset.allpha3dMaterialCount ?? 0);
    const cameraDistance = Number(element.dataset.allpha3dCameraDistance ?? 0);
    const cameraFov = Number(element.dataset.allpha3dCameraFov ?? 0);
    const cameraAspect = Number(element.dataset.allpha3dCameraAspect ?? 0);
    const target = element.dataset.allpha3dCameraTarget ?? "";
    if (!["loaded", "visible"].includes(state) || meshCount <= 0 || objectCount <= 0 ||
        materialCount <= 0 || cameraDistance <= 0 || cameraFov <= 0 || cameraAspect <= 0 || !target) {
      return false;
    }
    return {
      state,
      meshCount,
      objectCount,
      materialCount,
      bounds: element.dataset.allpha3dBounds ?? "",
      cameraDistance,
      cameraFov,
      cameraAspect,
      cameraTarget: target,
      visualProfile: element.dataset.allpha3dVisualProfile ?? "",
      toneMapping: element.dataset.allpha3dToneMapping ?? "",
      outputColorSpace: element.dataset.allpha3dOutputColorSpace ?? "",
      exposure: Number(element.dataset.allpha3dExposure ?? 0),
    };
  }, { timeout: 180_000 }).then(async (handle: any) => {
    try { return await handle.jsonValue(); } finally { await handle.dispose(); }
  });
}

async function inspectCanvas(page: any) {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) return { visible: false, webgl: false, litRatio: 0, variance: 0, screenshotBytes: 0 };

  const webgl = await page.evaluate(() => {
    const node = Array.from(document.querySelectorAll("canvas")).find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) as HTMLCanvasElement | undefined;
    if (!node) return false;
    return Boolean(node.getContext("webgl2") || node.getContext("webgl") || node.getContext("experimental-webgl"));
  });
  if (!webgl) return { visible: true, webgl: false, litRatio: 0, variance: 0, screenshotBytes: 0 };

  const png = await page.screenshot({ clip: box, animations: "disabled" });
  const bytes = Buffer.from(png);
  if (bytes.toString("ascii", 1, 4) !== "PNG") return { visible: true, webgl: true, litRatio: 0, variance: 0, screenshotBytes: bytes.length };

  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const start = offset + 8, end = start + length;
    if (end + 4 > bytes.length) break;
    if (type === "IHDR") {
      width = bytes.readUInt32BE(start);
      height = bytes.readUInt32BE(start + 4);
      bitDepth = bytes[start + 8];
      colorType = bytes[start + 9];
      interlace = bytes[start + 12];
    } else if (type === "IDAT") idat.push(bytes.subarray(start, end));
    else if (type === "IEND") break;
    offset = end + 4;
  }
  if (!width || !height || bitDepth !== 8 || interlace !== 0 || !idat.length || ![2, 6].includes(colorType)) {
    return { visible: true, webgl: true, litRatio: 0, variance: 0, screenshotBytes: bytes.length };
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
  let sampled = 0, lit = 0, sum = 0, sumSq = 0;
  const step = Math.max(1, Math.floor(Math.max(width, height) / 220));
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
    const i = y * stride + x * channels;
    const lum = rows[i] * .2126 + rows[i + 1] * .7152 + rows[i + 2] * .0722;
    const alpha = channels === 4 ? rows[i + 3] : 255;
    sampled++; sum += lum; sumSq += lum * lum;
    if (lum > 18 && alpha > 0) lit++;
  }
  const mean = sampled ? sum / sampled : 0;
  return {
    visible: true,
    webgl: true,
    litRatio: sampled ? lit / sampled : 0,
    variance: sampled ? Math.max(0, sumSq / sampled - mean * mean) : 0,
    screenshotBytes: bytes.length,
    drawingBuffer: [width, height],
  };
}

async function assertProductionVisual(page: any, expected: "desktop" | "mobile") {
  const marker = await readProductionMarker(page);
  const canvas = await inspectCanvas(page);
  const viewportWidth = page.viewportSize()?.width ?? 0;

  expect(marker.state).toBe("visible");
  expect(marker.meshCount).toBeGreaterThan(0);
  expect(marker.objectCount).toBeGreaterThan(0);
  expect(marker.materialCount).toBeGreaterThan(0);
  expect(marker.bounds).not.toBe("");
  expect(marker.cameraDistance).toBeGreaterThan(7);
  expect(marker.cameraFov).toBeGreaterThan(35);
  expect(marker.cameraFov).toBeLessThan(65);
  expect(marker.cameraTarget).not.toBe("");
  expect(marker.visualProfile).toBe("ALLPHA_UNIVERSE_V2");
  expect(marker.toneMapping).toBe("ACESFilmicToneMapping");
  expect(marker.outputColorSpace).toBe("SRGBColorSpace");
  expect(marker.exposure).toBeGreaterThanOrEqual(1);
  expect(marker.exposure).toBeLessThanOrEqual(1.2);
  expect(canvas.visible).toBe(true);
  expect(canvas.webgl).toBe(true);
  expect(canvas.litRatio).toBeGreaterThan(viewportWidth < 600 ? 0.003 : 0.01);
  expect(canvas.variance).toBeGreaterThan(12);

  if (expected === "desktop") {
    expect(viewportWidth).toBeGreaterThanOrEqual(1000);
    expect(marker.cameraAspect).toBeGreaterThan(1);
  } else {
    expect(viewportWidth).toBeLessThan(600);
    expect(marker.cameraAspect).toBeGreaterThan(0);
    expect(marker.cameraAspect).toBeLessThan(1);
  }
  return { marker, canvas };
}

test.describe("V2.13D.6.5 Desktop + Mobile Production Visual QA", () => {
  test("desktop canonical World production visual", async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const glbResponses: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (/theme-v2-real-3d\/v2\.13\/crystal-ai-city\/world\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) glbResponses.push(response.url());
    });

    await page.goto(worldUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
    const evidence = await assertProductionVisual(page, "desktop");
    expect(glbResponses.length).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(evidence.canvas.screenshotBytes).toBeGreaterThan(1000);
    await page.screenshot({ path: "test-results/d6-5-production-world-desktop.png", fullPage: true });
  });

  test("mobile canonical World production visual", async ({ browser }) => {
    test.setTimeout(5 * 60 * 1000);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    const glbResponses: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (/theme-v2-real-3d\/v2\.13\/crystal-ai-city\/world\.glb(?:\?|$)/i.test(response.url()) && response.status() === 200) glbResponses.push(response.url());
    });

    await page.goto(worldUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
    const evidence = await assertProductionVisual(page, "mobile");
    expect(glbResponses.length).toBeGreaterThan(0);
    expect(pageErrors).toEqual([]);
    expect(evidence.canvas.screenshotBytes).toBeGreaterThan(1000);
    await page.screenshot({ path: "test-results/d6-5-production-world-mobile.png", fullPage: true });
    await context.close();
  });
});
