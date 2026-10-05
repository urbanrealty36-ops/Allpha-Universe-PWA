#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const THEMES = [
  "aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city",
  "desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden",
  "galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier",
  "mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis",
  "pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord",
];
const CATEGORIES = [
  "universe","galaxy","world","orbit","capsule","district","booth","content-feed",
  "agent-character","live-stage","human-live","sticker-social","animation","navigation-fx",
];
const BUCKET = "allpha-world-assets";
const ROOT = "theme-v2-real-3d";
const PROJECT_URL = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "";
const API = PROJECT_URL + "/rest/v1";
const STORAGE = PROJECT_URL + "/storage/v1/object";

function requiredEnv() {
  if (!PROJECT_URL || !SERVICE_KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}
function headers(extra = {}) {
  return { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, ...extra };
}
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: headers(options.headers ?? {}) });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${url} -> ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}
async function rest(pathname, options = {}) { return request(API + pathname, options); }

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    root: path.resolve(args.find((v) => v.startsWith("--root="))?.slice(7) ?? "allpha-theme-v2-production-3d-350-pack"),
    activate: args.includes("--activate"),
  };
}
function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

async function getTheme(slug) {
  const rows = await rest("/themes?slug=eq." + encodeURIComponent(slug) + "&source=eq.platform&select=id,slug&limit=1");
  if (!rows?.[0]) throw new Error("Platform theme not found: " + slug);
  return rows[0];
}
async function getPublishedVersion(themeId) {
  const rows = await rest("/theme_versions?theme_id=eq." + themeId + "&status=eq.published&select=id,version&order=version.desc&limit=1");
  if (!rows?.[0]) throw new Error("Published theme version not found: " + themeId);
  return rows[0];
}
async function upload(storagePath, buffer) {
  await request(STORAGE + "/" + BUCKET + "/" + storagePath, {
    method: "POST",
    headers: { "Content-Type": "model/gltf-binary", "x-upsert": "true", "cache-control": "31536000, immutable" },
    body: buffer,
  });
}
async function verifyObject(storagePath) {
  const response = await fetch(STORAGE + "/" + BUCKET + "/" + storagePath, { method: "HEAD", headers: headers() });
  if (!response.ok) throw new Error("Storage verification failed: " + storagePath + " -> " + response.status);
}
async function findExistingAsset(themeId, versionId, storagePath) {
  const rows = await rest(
    "/theme_assets?theme_id=eq." + themeId +
    "&theme_version_id=eq." + versionId +
    "&storage_path=eq." + encodeURIComponent(storagePath) +
    "&select=id,status,moderation_status,safety_status,performance_status&limit=1"
  );
  return rows?.[0] ?? null;
}
async function upsertAsset(theme, version, category, storagePath, bytes, checksum, activate) {
  const existing = await findExistingAsset(theme.id, version.id, storagePath);
  const payload = {
    theme_id: theme.id,
    theme_version_id: version.id,
    asset_type: "model",
    storage_bucket: BUCKET,
    storage_path: storagePath,
    mime_type: "model/gltf-binary",
    metadata: {
      schema: "allpha-3d-production-activation/1.0",
      pipeline: "3D-V2.11",
      theme_key: theme.slug,
      category,
      source: "procedural-realization-export",
      presentation_only: true,
      legacy: false,
      lifecycle: activate ? "active" : "staged",
    },
    sort_order: CATEGORIES.indexOf(category),
    status: activate ? "active" : "pending",
    moderation_status: activate ? "approved" : "pending",
    safety_status: activate ? "passed" : "pending",
    performance_status: activate ? "passed" : "pending",
    content_size_bytes: bytes,
    checksum_sha256: checksum,
    uploaded_at: new Date().toISOString(),
  };
  if (existing) {
    await rest("/theme_assets?id=eq." + existing.id, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(payload) });
  } else {
    await rest("/theme_assets", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(payload) });
  }
}

async function main() {
  requiredEnv();
  const { root, activate } = parseArgs();
  if (!fs.existsSync(root)) throw new Error("Asset root not found: " + root);
  if (activate && process.env.ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED !== "true") {
    throw new Error("Refusing activation: set ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED=true only after production QA/approval.");
  }

  let uploaded = 0;
  const staged = [];
  for (const themeKey of THEMES) {
    const theme = await getTheme(themeKey);
    const version = await getPublishedVersion(theme.id);
    for (const category of CATEGORIES) {
      const file = path.join(root, themeKey, category + ".glb");
      if (!fs.existsSync(file)) throw new Error("Missing asset: " + file);
      const buffer = fs.readFileSync(file);
      const checksum = sha256(buffer);
      const storagePath = ROOT + "/" + themeKey + "/" + category + ".glb";
      await upload(storagePath, buffer);
      await verifyObject(storagePath);
      await upsertAsset(theme, version, category, storagePath, buffer.length, checksum, activate);
      uploaded += 1;
      staged.push({ themeKey, category, storagePath, bytes: buffer.length, checksum });
      process.stdout.write(`[${uploaded}/350] ${themeKey}/${category}\n`);
    }
  }

  const report = {
    schema: "allpha-3d-production-activation/1.0",
    phase: "3D-V2.11",
    bucket: BUCKET,
    root: ROOT,
    themes: 25,
    categories: 14,
    assets: uploaded,
    mode: activate ? "active" : "staged",
    legacyDelete: "blocked-until-runtime-qa-and-rollback-window",
    assets: staged,
  };
  fs.writeFileSync(path.resolve("production-3d-activation-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ok: uploaded === 350, assets: uploaded, mode: report.mode }, null, 2));
}

main().catch((error) => { console.error(error.stack ?? error.message); process.exit(1); });
