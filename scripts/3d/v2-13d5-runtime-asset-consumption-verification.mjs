#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const API_BASE = (process.env.ALLPHA_RUNTIME_API_BASE || "https://allpha-api-production.up.railway.app").replace(/\/$/, "");
const WEB_BASE = (process.env.ALLPHA_RUNTIME_WEB_BASE || "https://allphaweb-production.up.railway.app").replace(/\/$/, "");
const CATEGORIES = ["universe", "galaxy", "world", "district"];
const THEMES = [
  "aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city",
  "desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden",
  "galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier",
  "mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis",
  "pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord",
];

const expectedPrefix = (theme, category) =>
  "theme-v2-real-3d/v2.13/" + theme + "/" + category + ".glb";

function fail(message) {
  console.error("V2.13D.5_BLOCKED: " + message);
  process.exit(1);
}

async function json(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const text = await response.text();
  if (!response.ok) fail(`GET ${response.status} ${url}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { fail("Invalid JSON from " + url); }
}

async function verifyBinary(url, theme, category) {
  const response = await fetch(url, { headers: { Range: "bytes=0-3" } });
  if (!response.ok) fail(`signed asset fetch failed ${theme}/${category}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const magic = new TextDecoder().decode(bytes.slice(0, 4));
  if (magic !== "glTF") fail(`signed asset is not GLB ${theme}/${category}: magic=${JSON.stringify(magic)}`);
  return { status: response.status, magic, bytesRead: bytes.length };
}

function verifyRendererConsumerSource() {
  const file = path.resolve("apps/web/components/world/theme-v2-production-asset-scene.tsx");
  if (!fs.existsSync(file)) fail("Renderer consumer source missing: " + file);
  const source = fs.readFileSync(file, "utf8");
  const required = [
    "/api/v1/themes/world-runtime/public/themes/",
    "binary_3d_assets",
    "asset.signed_url",
    'path === "theme-v2-real-3d/v2.13/" + themeKey + "/" + category + ".glb"',
    'asset.metadata?.phase === "V2.13D.4"',
    "setUrl(candidate?.signed_url ?? null)",
    "useGLTF(url)",
  ];
  for (const token of required) {
    if (!source.includes(token)) fail("Renderer consumption contract missing: " + token);
  }
  return { file, contract: "PASS", exactProductionPath: true, phaseGuard: "V2.13D.4" };
}

async function main() {
  const source = verifyRendererConsumerSource();
  const themeResults = [];
  let verifiedAssets = 0;

  for (const theme of THEMES) {
    const endpoint = API_BASE + "/api/v1/themes/world-runtime/public/themes/" + encodeURIComponent(theme) + "/asset-manifest";
    const payload = await json(endpoint);
    const data = payload?.data;
    if (!data?.public || data.presentation_only !== true) fail(`runtime manifest authority invalid for ${theme}`);
    if (data.storage_bucket !== "allpha-world-assets") fail(`bucket mismatch for ${theme}`);

    const phaseAssets = (data.binary_3d_assets ?? []).filter(
      (asset) =>
        asset?.metadata?.phase === "V2.13D.4" &&
        asset?.storage_bucket === "allpha-world-assets" &&
        asset?.status === "active" &&
        asset?.moderation_status === "approved" &&
        asset?.safety_status === "passed" &&
        asset?.performance_status === "passed" &&
        typeof asset?.signed_url === "string" &&
        asset.signed_url.length > 0,
    );

    if (phaseAssets.length !== 4) fail(`${theme}: expected exactly 4 active V2.13D.4 signed assets, got ${phaseAssets.length}`);

    const seen = new Set();
    const assets = [];
    for (const category of CATEGORIES) {
      const expected = expectedPrefix(theme, category);
      const asset = phaseAssets.find((item) => item.storage_path === expected);
      if (!asset) fail(`${theme}: missing runtime asset ${category} at ${expected}`);
      if (seen.has(asset.storage_path)) fail(`${theme}: duplicate runtime storage path ${asset.storage_path}`);
      seen.add(asset.storage_path);
      const binary = await verifyBinary(asset.signed_url, theme, category);
      assets.push({ category, storagePath: asset.storage_path, binary });
      verifiedAssets += 1;
    }

    themeResults.push({
      theme,
      manifestEndpoint: endpoint,
      phaseAssets: phaseAssets.length,
      verifiedSignedGlbAssets: assets.length,
      assets,
    });
  }

  const result = {
    schema: "allpha-3d-v2-13d5-runtime-asset-consumption-verification/1.0",
    phase: "V2.13D.5",
    status: "GREEN",
    runtimeApi: API_BASE,
    runtimeWeb: WEB_BASE,
    renderer: source,
    productionStorage: {
      bucket: "allpha-world-assets",
      root: "theme-v2-real-3d/v2.13",
      themes: THEMES.length,
      categories: CATEGORIES.length,
      assets: verifiedAssets,
    },
    checks: {
      publicRuntimeManifest: true,
      signedUrlResolution: true,
      glbBinaryConsumption: true,
      exactThemeCategoryPath: true,
      v213d4PhaseGuard: true,
      rendererUsesUseGLTF: true,
      presentationOnlyBoundary: true,
      noStorageMutation: true,
      noSupabaseMutation: true,
    },
    themeResults,
  };

  fs.mkdirSync("artifacts/v2-13d5", { recursive: true });
  fs.writeFileSync("artifacts/v2-13d5/runtime-asset-consumption-report.json", JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
}

await main();
