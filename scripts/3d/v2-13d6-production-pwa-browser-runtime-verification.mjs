import { chromium } from "@playwright/test";
import fs from "node:fs";

const WEB_BASE = (process.env.ALLPHA_RUNTIME_WEB_BASE ?? "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const API_BASE = (process.env.ALLPHA_RUNTIME_API_BASE ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");
const WORLD_ID = process.env.ALLPHA_PRODUCTION_WORLD_ID ?? "";
const WORLD_URL = process.env.ALLPHA_PRODUCTION_WORLD_URL || (WORLD_ID ? `/world?world_id=${encodeURIComponent(WORLD_ID)}` : "");
const requireWorld = process.env.ALLPHA_REQUIRE_WORLD_RUNTIME !== "false";

const themes = [
  "aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city",
  "desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden",
  "galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier",
  "mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis",
  "pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"
];

const report = {
  schema: "allpha-3d-v2-13d6-production-pwa-browser-runtime/1.0",
  phase: "V2.13D.6",
  objective: "Production PWA/browser runtime verification after V2.13D.5 runtime asset consumption",
  productionWebBase: WEB_BASE,
  productionApiBase: API_BASE,
  worldUrl: WORLD_URL || null,
  gates: { productionPwaReachable: false, mobileUniverseSurface: false, desktopUniverseSurface: false, worldRuntimeRendered: false, glbFetchedByBrowser: false, noRuntimeConsoleErrors: false },
  observations: [],
  errors: [],
  timestamp: new Date().toISOString()
};

function addError(scope, message) {
  report.errors.push({ scope, message: String(message) });
}

async function checkSurface(browser, name, url, viewport, options = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: "block" });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const glbResponses = [];

  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", err => pageErrors.push(err.message));
  page.on("requestfailed", req => failedRequests.push({ url: req.url(), error: req.failure()?.errorText ?? "requestfailed" }));
  page.on("response", response => {
    const u = response.url();
    if (/\.glb(?:[?#]|$)/i.test(u)) glbResponses.push({ url: u, status: response.status() });
  });

  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!response || !response.ok()) throw new Error(`${name}: HTTP ${response?.status() ?? "NO_RESPONSE"}`);

  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(options.settleMs ?? 2500);

  const bodyText = await page.locator("body").innerText().catch(() => "");
  const canvasCount = await page.locator("canvas").count();
  const webgl = await page.evaluate(() => Array.from(document.querySelectorAll("canvas")).some((canvas) => {
    try { return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")); } catch { return false; }
  }));
  const title = await page.title();

  report.observations.push({
    name, url, finalUrl: page.url(), viewport, httpStatus: response.status(), title,
    canvasCount, webgl, glbResponses,
    consoleErrors, pageErrors, failedRequests: failedRequests.slice(0, 20),
    bodyMarkers: {
      universe: /universe/i.test(bodyText),
      spatialWorld: /spatial world/i.test(bodyText),
      enterUniverse: /enter the universe/i.test(bodyText)
    }
  });

  if (consoleErrors.length || pageErrors.length) {
    addError(name, `browser errors: console=${consoleErrors.length}, pageerror=${pageErrors.length}`);
  }
  await context.close();
  return { bodyText, canvasCount, webgl, glbResponses, consoleErrors, pageErrors };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  try {
    const mobile = await checkSurface(browser, "mobile-universe", `${WEB_BASE}/universe`, { width: 390, height: 844 });
    report.gates.productionPwaReachable = true;
    report.gates.mobileUniverseSurface = mobile.canvasCount > 0 && mobile.webgl;

    const desktop = await checkSurface(browser, "desktop-universe", `${WEB_BASE}/universe`, { width: 1440, height: 900 });
    report.gates.desktopUniverseSurface = desktop.canvasCount > 0 && desktop.webgl;

    if (WORLD_URL) {
      const absoluteWorldUrl = WORLD_URL.startsWith("http") ? WORLD_URL : WEB_BASE + WORLD_URL;
      const world = await checkSurface(browser, "production-world", absoluteWorldUrl, { width: 390, height: 844 }, { settleMs: 5000 });
      report.gates.worldRuntimeRendered =
        world.canvasCount > 0 &&
        world.webgl &&
        /spatial world/i.test(world.bodyText);
      report.gates.glbFetchedByBrowser = world.glbResponses.some((item) => [200, 206].includes(item.status));
    } else if (requireWorld) {
      addError("configuration", "ALLPHA_PRODUCTION_WORLD_ID or ALLPHA_PRODUCTION_WORLD_URL is required for the production World/GLB browser gate.");
    }

    report.gates.noRuntimeConsoleErrors = report.errors.length === 0 &&
      report.observations.every((o) => o.consoleErrors.length === 0 && o.pageErrors.length === 0);

    if (!report.gates.productionPwaReachable ||
        !report.gates.mobileUniverseSurface ||
        !report.gates.desktopUniverseSurface ||
        (requireWorld && (!report.gates.worldRuntimeRendered || !report.gates.glbFetchedByBrowser)) ||
        !report.gates.noRuntimeConsoleErrors) {
      throw new Error("V2.13D.6 browser runtime gate FAILED");
    }

    report.decision = "GREEN";
  } catch (error) {
    report.decision = "FAILED";
    addError("gate", error instanceof Error ? error.message : String(error));
    console.error("V2.13D.6 diagnostic report:", JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } finally {
    fs.writeFileSync("v2-13d6-production-pwa-browser-runtime-report.json", JSON.stringify(report, null, 2) + "\n");
    await browser.close();
  }
}

await main();
