#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const THEME = "crystal-ai-city";
const CATEGORIES = [
  "universe","galaxy","world","orbit","capsule","district","booth","content-feed",
  "agent-character","live-stage","human-live","sticker-social","animation","navigation-fx",
];
const BUCKET = "allpha-world-assets";
const ROOT = "theme-v2-real-3d/v2.13";
const PROJECT_URL = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "";

function headers(extra = {}) {
  return { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, ...extra };
}
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: headers(options.headers ?? {}) });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error((options.method ?? "GET") + " " + url + " -> " + response.status + ": " + (typeof body === "string" ? body : JSON.stringify(body)));
  return body;
}
async function rest(pathname, options = {}) { return request(PROJECT_URL + "/rest/v1" + pathname, options); }
function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

const args = process.argv.slice(2);
const root = path.resolve(args.find((v) => v.startsWith("--root="))?.slice(7) ?? "allpha-theme-v2-13-golden-pack");
const activate = args.includes("--activate");

if (!PROJECT_URL || !SERVICE_KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
if (activate && process.env.ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED !== "true") {
  throw new Error("Activation blocked. Set ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED=true only after visual + runtime approval.");
}

const themeRows = await rest("/themes?slug=eq." + encodeURIComponent(THEME) + "&source=eq.platform&select=id,slug&limit=1");
if (!themeRows?.[0]) throw new Error("Platform theme not found: " + THEME);
const theme = themeRows[0];

const versionRows = await rest("/theme_versions?theme_id=eq." + theme.id + "&status=eq.published&select=id,version&order=version.desc&limit=1");
if (!versionRows?.[0]) throw new Error("Published theme version not found.");
const version = versionRows[0];

async function upload(storagePath, buffer) {
  await request(PROJECT_URL + "/storage/v1/object/" + BUCKET + "/" + storagePath, {
    method: "POST",
    headers: { "Content-Type": "model/gltf-binary", "x-upsert": "true", "cache-control": "31536000, immutable" },
    body: buffer,
  });
}
async function verifyObject(storagePath) {
  const response = await fetch(PROJECT_URL + "/storage/v1/object/" + BUCKET + "/" + storagePath, { method: "HEAD", headers: headers() });
  if (!response.ok) throw new Error("Storage verification failed: " + storagePath + " -> " + response.status);
}
async function findExistingAsset(storagePath) {
  const rows = await rest(
    "/theme_assets?theme_id=eq." + theme.id +
    "&theme_version_id=eq." + version.id +
    "&storage_path=eq." + encodeURIComponent(storagePath) +
    "&select=id&limit=1"
  );
  return rows?.[0] ?? null;
}
async function upsertAsset(category, storagePath, bytes, checksum) {
  const existing = await findExistingAsset(storagePath);
  const payload = {
    theme_id: theme.id,
    theme_version_id: version.id,
    asset_type: "model",
    storage_bucket: BUCKET,
    storage_path: storagePath,
    mime_type: "model/gltf-binary",
    metadata: {
      schema: "allpha-3d-v2-13-production-art/1.1",
      activationGate: "3D-V2.13B",
      theme_key: THEME,
      category,
      source: "blender-production-export",
      presentationOnly: true,
      legacy: false,
      artQuality: "production-realistic-golden",
      canonicalRenderer: "AllphaWorldRenderer",
      runtimeAuthority: "outside-blender",
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
    await rest("/theme_assets?id=eq." + existing.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });
  } else {
    await rest("/theme_assets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });
  }
}

const report = { schema: "allpha-3d-v2-13b-runtime-activation/1.0", phase: "3D-V2.13B", theme: THEME, themeId: theme.id, themeVersionId: version.id, bucket: BUCKET, root: ROOT, mode: activate ? "active" : "staged", assets: [] };

for (const category of CATEGORIES) {
  const file = path.join(root, THEME, category + ".glb");
  if (!fs.existsSync(file)) throw new Error("Missing validated golden GLB: " + file);
  const buffer = fs.readFileSync(file);
  const checksum = sha256(buffer);
  const storagePath = ROOT + "/" + THEME + "/" + category + ".glb";
  await upload(storagePath, buffer);
  await verifyObject(storagePath);
  await upsertAsset(category, storagePath, buffer.length, checksum);
  report.assets.push({ category, storagePath, bytes: buffer.length, checksum });
}

report.ok = report.assets.length === CATEGORIES.length;
fs.writeFileSync(path.resolve("3d-v2-13b-runtime-activation-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ok: report.ok, phase: report.phase, theme: THEME, assets: report.assets.length, mode: report.mode }, null, 2));
