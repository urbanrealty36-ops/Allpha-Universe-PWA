#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const API_BASE = (process.env.ALLPHA_RUNTIME_API_BASE_URL || "https://allpha-api-production.up.railway.app").replace(/\/$/, "");
const ROOT = "theme-v2-real-3d/v2.13";
const BUCKET = "allpha-world-assets";
const CATEGORIES = ["universe", "galaxy", "world", "district"];
const THEMES = [
  "aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city",
  "desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden",
  "galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier",
  "mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis",
  "pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"
];

function fail(message, details = {}) {
  console.error(JSON.stringify({ phase: "V2.13D.5", status: "RED", code: "V2.13D.5_RUNTIME_BLOCKED", message, ...details }, null, 2));
  process.exit(1);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const text = await response.text();
  if (!response.ok) fail("HTTP " + response.status + " from " + url, { body: text.slice(0, 500) });
  try { return JSON.parse(text); } catch { fail("Invalid JSON from " + url, { body: text.slice(0, 500) }); }
}

async function verifyBinary(url, expectedPath) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) fail("Signed asset fetch failed: " + expectedPath, { status: response.status });
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || String.fromCharCode(...bytes.slice(0, 4)) !== "glTF") {
    fail("Runtime asset is not a valid GLB: " + expectedPath, { bytes: bytes.length });
  }
  return bytes.length;
}

function readText(file) {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) fail("Missing runtime contract file: " + file);
  return fs.readFileSync(resolved, "utf8");
}

const renderer = readText("apps/web/components/world/theme-v2-production-asset-scene.tsx");
const rendererHost = readText("apps/web/components/world/allpha-world-renderer.tsx");
const resolver = readText("apps/web/lib/world-engine/production-3d-runtime-resolver.ts");
const api = readText("apps/api/app/api/world_runtime.py");
const contract = renderer + rendererHost + resolver + api;

for (const required of ["asset-manifest", "useGLTF", "signed_url", "theme-v2-real-3d/v2.13", "AllphaWorldRenderer"]) {
  if (!contract.includes(required)) fail("Runtime contract marker missing: " + required);
}

const report = {
  schema: "allpha-3d-v2-13d5-runtime-activation-verification/1.0",
  phase: "V2.13D.5",
  status: "PENDING",
  apiBase: API_BASE,
  bucket: BUCKET,
  root: ROOT,
  themes: 25,
  categories: 4,
  assets: 100,
  manifestsVerified: 0,
  signedAssetsVerified: 0,
  bytesVerified: 0,
  staticRendererContract: true,
  staticApiContract: true,
  mutationPerformed: false,
};

for (const theme of THEMES) {
  const endpoint = API_BASE + "/api/v1/themes/world-runtime/public/themes/" + encodeURIComponent(theme) + "/asset-manifest";
  const payload = await fetchJson(endpoint);
  const data = payload?.data;
  if (!data?.public || data?.presentation_only !== true) fail("Public runtime manifest contract failed: " + theme);
  if (data.storage_bucket !== BUCKET) fail("Runtime bucket mismatch: " + theme, { bucket: data.storage_bucket });

  const assets = Array.isArray(data.binary_3d_assets) ? data.binary_3d_assets : [];
  const expected = new Map(CATEGORIES.map((category) => [ROOT + "/" + theme + "/" + category + ".glb", category]));
  const selected = [];

  for (const asset of assets) {
    const storagePath = String(asset.storage_path || "");
    if (!expected.has(storagePath)) continue;
    if (asset.asset_type !== "3d_scene") fail("Runtime asset type mismatch: " + storagePath);
    if (asset.status !== "active" || asset.moderation_status !== "approved" || asset.safety_status !== "passed" || asset.performance_status !== "passed") {
      fail("Runtime lifecycle/moderation contract failed: " + storagePath);
    }
    if (asset.metadata?.phase !== "V2.13D.4" || asset.metadata?.sourcePhase !== "V2.13D.3C") {
      fail("Runtime provenance mismatch: " + storagePath, { metadata: asset.metadata });
    }
    if (!asset.signed_url) fail("Runtime signed URL missing: " + storagePath);
    selected.push({ ...asset, category: expected.get(storagePath) });
  }

  if (selected.length !== CATEGORIES.length) {
    fail("Expected exactly 4 V2.13D.4 macro assets for " + theme, {
      expected: CATEGORIES.length,
      actual: selected.length,
      returnedBinary3DCount: assets.length,
    });
  }

  if (new Set(selected.map((asset) => asset.storage_path)).size !== CATEGORIES.length) {
    fail("Duplicate runtime macro path: " + theme);
  }

  for (const asset of selected) {
    report.bytesVerified += await verifyBinary(asset.signed_url, asset.storage_path);
    report.signedAssetsVerified += 1;
  }
  report.manifestsVerified += 1;
}

report.status = "GREEN";
report.generatedAt = new Date().toISOString();
report.summary = {
  manifestCoverage: report.manifestsVerified + "/25",
  macroAssetCoverage: report.signedAssetsVerified + "/100",
  binaryIntegrity: "100/100 GLB headers verified through runtime signed URLs",
  renderer: "ThemeV2ProductionAssetScene -> useGLTF",
  authority: "FastAPI public runtime manifest -> Supabase Storage signed URL",
  mutationPerformed: false,
};

fs.mkdirSync("artifacts/v2-13d5", { recursive: true });
fs.writeFileSync("artifacts/v2-13d5/runtime-activation-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
