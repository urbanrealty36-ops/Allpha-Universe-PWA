import { inflateSync } from "node:zlib";
import { test, expect } from "@playwright/test";

const baseURL = (process.env.ALLPHA_QA_BASE_URL || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const worldId = process.env.ALLPHA_D6_WORLD_ID;

function worldUrl() {
  if (!worldId) throw new Error("ALLPHA_D6_WORLD_ID is required and must come from the canonical Continue Context document.");
  return `${baseURL}/world?world_id=${encodeURIComponent(worldId)}`;
}

async function waitForProductionVisualMarker(page: any) {
  return await page.waitForFunction(
    () => {
      const element = document.querySelector("[data-allpha-3d-runtime]") as HTMLElement | null;
      const state = element?.dataset.allpha3dAssetState;
      const meshCount = Number(element?.dataset.allpha3dMeshCount ?? 0);
      const objectCount = Number(element?.dataset.allpha3dObjectCount ?? 0);
      const materialCount = Number(element?.dataset.allpha3dMaterialCount ?? 0);
      const cameraDistance = Number(element?.dataset.allpha3dCameraDistance ?? 0);
      const cameraFov = Number(element?.dataset.allpha3dCameraFov ?? 0);
      const cameraAspect = Number(element?.dataset.allpha3dCameraAspect ?? 0);
      const cameraTarget = element?.dataset.allpha3dCameraTarget ?? "";
      if (
        !element ||
        !["loaded", "visible"].includes(state ?? "") ||
        meshCount <= 0 ||
        objectCount <= 0 ||
        materialCount <= 0 ||
        cameraDistance <= 0 ||
        cameraFov <= 0 ||
        cameraAspect <= 0 ||
        !cameraTarget
      ) return false;

      return {
        state: element.dataset.allpha3dAssetState,
        meshCount: Number(element.dataset.allpha3dMeshCount ?? 0),
        objectCount: Number(element.dataset.allpha3dObjectCount ?? 0),
        materialCount: Number(element.dataset.allpha3dMaterialCount ?? 0),
        bounds: element.dataset.allpha3dBounds ?? "",
        cameraDistance: Number(element.dataset.allpha3dCameraDistance ?? 0),
        cameraFov: Number(element.dataset.allpha3dCameraFov ?? 0),
        cameraAspect: Number(element.dataset.allpha3dCameraAspect ?? 0),
        cameraTarget: element.dataset.allpha3dCameraTarget ?? "",
        visualProfile: element.dataset.allpha3dVisualProfile ?? "",
        toneMapping: element.dataset.allpha3dToneMapping ?? "",
        outputColorSpace: element.dataset.allpha3dOutputColorSpace ?? "",
        exposure: Number(element.dataset.allpha3dExposure ?? 0),
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

async function inspectVisualCanvas(page: any) {
  const canvas = page.locator("canvas").filter({ visible: true }).first();
  const box = await canvas.boundingBox();
  if (!box) return { visible: false, webgl: false, sampledPixels: 0, litRatio: 0, variance: 0 };

  const webgl = await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll("canvas")).find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) as HTMLCanvasElement | undefined;
    if (!item) return { ok: false, preserveDrawingBuffer: false };
    const gl = item.getContext("webgl2") || item.getContext("webgl") || item.getContext("experimental-webgl");
    return {
      ok: Boolean(gl),
      preserveDrawingBuffer: Boolean(gl?.getContextAttributes()?.preserveDrawingBuffer),
    };
  });

  if (!webgl.ok) {
    return { visible: true, webgl: false, sampledPixels: 0, litRatio: 0, variance: 0 };
  }

  // The production canvas uses the default WebGL drawing buffer, where
  // preserveDrawingBuffer is false. readPixels() from that default buffer is
  // not a reliable post-compositor visual assertion and was returning zeroed
  // pixels in CI despite the trace proving a visible 3D canvas. Sample the
  // compositor output instead via a clipped PNG screenshot.
  const png = await page.screenshot({ clip: box, animations: "disabled" });
  const bytes = Buffer.from(png);
  if (bytes.toString("ascii", 1, 4) !== "PNG") {
    return { visible: true, webgl: true, sampledPixels: 0, litRatio: 0, variance: 0, preserveDrawingBuffer: webgl.preserveDrawingBuffer };
  }

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) break;
    if (type === "IHDR") {
      width = bytes.readUInt32BE(dataStart);
      height = bytes.readUInt32BE(dataStart + 4);
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      interlace = bytes[dataStart + 12];
    } else if (type === "IDAT") {
      idat.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  if (!width || !height || bitDepth !== 8 || interlace !== 0 || !idat.length || ![2, 6].includes(colorType)) {
    return { visible: true, webgl: true, sampledPixels: 0, litRatio: 0, variance: 0, preserveDrawingBuffer: webgl.preserveDrawingBuffer };
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const rows = Buffer.alloc(height * stride);
  let src = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[src++];
    const rowStart = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[src++];
      const left = x >= channels ? rows[rowStart + x - channels] : 0;
      const up = y > 0 ? rows[rowStart - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? rows[rowStart - stride + x - channels] : 0;
      let decoded = value;
      if (filter === 1) decoded = (value + left) & 0xff;
      else if (filter === 2) decoded = (value + up) & 0xff;
      else if (filter === 3) decoded = (value + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        decoded = (value + predictor) & 0xff;
      }
      rows[rowStart + x] = decoded;
    }
  }

  let sampledPixels = 0;
  let litPixels = 0;
  let sum = 0;
  let sumSq = 0;
  const step = Math.max(1, Math.floor(Math.max(width, height) / 220));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * stride) + (x * channels);
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
    visible: true,
    webgl: true,
    sampledPixels,
    litRatio: sampledPixels ? litPixels / sampledPixels : 0,
    variance,
    screenshotSize: bytes.length,
    preserveDrawingBuffer: webgl.preserveDrawingBuffer,
    drawingBuffer: [width, height],
  };
}
async function assertD64(page: any, glbResponses: string[]) {
  const marker = await waitForProductionVisualMarker(page);
  const canvas = await inspectVisualCanvas(page);

  expect(["loaded", "visible"]).toContain(marker.state);
  expect(marker.meshCount).toBeGreaterThan(0);
  expect(marker.objectCount).toBeGreaterThan(0);
  expect(marker.materialCount).toBeGreaterThan(0);
  expect(marker.bounds).not.toBe("");
  expect(marker.cameraDistance).toBeGreaterThan(7);
  expect(marker.cameraFov).toBeGreaterThan(35);
  expect(marker.cameraFov).toBeLessThan(65);
  expect(marker.cameraAspect).toBeGreaterThan(0);
  expect(marker.cameraTarget).not.toBe("");
  expect(marker.visualProfile).toBe("ALLPHA_UNIVERSE_V2");
  expect(marker.toneMapping).toBe("ACESFilmicToneMapping");
  expect(marker.outputColorSpace).toBe("SRGBColorSpace");
  expect(marker.exposure).toBeGreaterThanOrEqual(1);
  expect(marker.exposure).toBeLessThanOrEqual(1.2);
  expect(glbResponses.length).toBeGreaterThan(0);

  expect(canvas.visible).toBe(true);
  expect(canvas.webgl).toBe(true);
  expect(canvas.litRatio).toBeGreaterThan(0.01);
  expect(canvas.variance).toBeGreaterThan(12);
}

test.describe("V2.13D.6.4 Production Visual Fidelity / Brand QA", () => {
  test("desktop World uses Allpha Universe V2 camera, color management, materials and lighting", async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
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
    await assertD64(page, glbResponses);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    await page.screenshot({ path: "test-results/d6-4-production-world-desktop.png", fullPage: true });
  });

  test("mobile World preserves responsive production framing and Allpha visual language", async ({ browser }) => {
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
    await assertD64(page, glbResponses);

    expect(pageErrors).toEqual([]);

    await page.screenshot({ path: "test-results/d6-4-production-world-mobile.png", fullPage: true });
    await context.close();
  });
});
