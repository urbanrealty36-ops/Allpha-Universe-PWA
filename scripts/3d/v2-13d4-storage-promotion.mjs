#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const BUCKET = "allpha-world-assets";
const ROOT = "theme-v2-real-3d/v2.13";
const CATEGORIES = ["universe","galaxy","world","district"];
const THEMES = ["aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city","desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden","galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier","mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis","pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"];

function fail(message) { console.error("V2.13D.4_BLOCKED: " + message); process.exit(1); }
function readJson(file) { if (!fs.existsSync(file)) fail("Missing " + file); return JSON.parse(fs.readFileSync(file, "utf8")); }
function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) fail((options.method || "GET") + " " + response.status + ": " + text.slice(0, 400));
  return text ? JSON.parse(text) : null;
}

const evidenceRoot = path.resolve(process.env.ALLPHA_D3C_EVIDENCE_ROOT || "d3c-evidence");
const decision = readJson(path.resolve(process.env.ALLPHA_D3D_DECISION_JSON || "v2-13d-post-d3d-promotion-decision.json"));

if (decision.schema !== "allpha-3d-post-d3d-promotion-decision/1.0") fail("D3D decision schema mismatch");
if (decision.gates?.evidencePacketComplete !== true) fail("D3D evidence incomplete");
if (decision.gates?.humanReviewApproved !== true) fail("Human D3D review not approved");
if (process.env.ALLPHA_3D_HUMAN_VISUAL_FIDELITY_APPROVED !== "true") fail("Human approval flag required");
if (process.env.ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED !== "true") fail("Production promotion approval required");
if (process.env.ALLPHA_3D4_CONFIRMATION !== "V2.13D.4 APPROVE 100 MACRO ASSETS") fail("Exact confirmation required");

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY missing");
const supabaseUrl = process.env.SUPABASE_URL || "https://qltbacemtvnuzqkterly.supabase.co";
const headers = { apikey: serviceKey, Authorization: "Bearer " + serviceKey };

await request(supabaseUrl + "/storage/v1/bucket/" + BUCKET, { headers });

const packRoot = path.join(evidenceRoot, "allpha-theme-v2-13d3c-visual-remediation");
const manifest = readJson(path.join(packRoot, "manifest.json"));
if (manifest.phase !== "V2.13D.3C" || manifest.themes !== 25 || manifest.categories !== 4 || manifest.matrixSize !== 100 || manifest.generated !== 100) fail("D3C manifest contract mismatch");

const entries = [];
for (const theme of THEMES) {
  for (const category of CATEGORIES) {
    const localPath = path.join(packRoot, theme, category + ".glb");
    if (!fs.existsSync(localPath)) fail("Missing D3C GLB: " + theme + "/" + category);
    const body = fs.readFileSync(localPath);
    if (body.subarray(0, 4).toString("ascii") !== "glTF") fail("Invalid GLB: " + theme + "/" + category);
    entries.push({ theme, category, localPath, storagePath: ROOT + "/" + theme + "/" + category + ".glb", bytes: body.length, checksumSha256: sha256(body) });
  }
}
if (entries.length !== 100) fail("Expected exactly 100 macro assets");

const themeCache = new Map();
for (const slug of THEMES) {
  const themes = await request(supabaseUrl + "/rest/v1/themes?select=id,slug&catalog_key=eq." + encodeURIComponent(slug) + "&limit=1", { headers });
  if (!themes?.length) fail("Theme missing: " + slug);
  const versions = await request(supabaseUrl + "/rest/v1/theme_versions?select=id,version&theme_id=eq." + themes[0].id + "&status=eq.published&order=version.desc&limit=1", { headers });
  if (!versions?.length) fail("Published theme version missing: " + slug);
  themeCache.set(slug, { themeId: themes[0].id, themeVersionId: versions[0].id, version: versions[0].version });
}

console.log(JSON.stringify({ phase:"V2.13D.4", preflight:"PASS", themes:25, categories:4, assets:100, bucket:BUCKET, root:ROOT }, null, 2));

for (const entry of entries) {
  const body = fs.readFileSync(entry.localPath);
  const storageUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + entry.storagePath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(storageUrl, {
    method: "POST",
    headers: { ...headers, "Content-Type":"model/gltf-binary", "x-upsert":"true", "cache-control":"31536000" },
    body
  });
  if (!response.ok) fail("Storage upload failed: " + entry.theme + "/" + entry.category + " status=" + response.status);
}

for (const entry of entries) {
  const infoUrl = supabaseUrl + "/storage/v1/object/info/" + BUCKET + "/" + entry.storagePath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(infoUrl, { headers });
  if (!response.ok) fail("Storage verification failed: " + entry.theme + "/" + entry.category);
}

for (const entry of entries) {
  const ids = themeCache.get(entry.theme);
  const query = supabaseUrl + "/rest/v1/theme_assets?select=id&theme_id=eq." + ids.themeId + "&theme_version_id=eq." + ids.themeVersionId + "&asset_type=eq.3d_scene&storage_path=eq." + encodeURIComponent(entry.storagePath) + "&limit=1";
  const existing = await request(query, { headers });
  const metadata = {
    schema:"allpha-3d-v2-13d3c-cinematic-visual-fidelity/1.0",
    phase:"V2.13D.4",
    sourcePhase:"V2.13D.3C",
    goldenReference:"crystal-ai-city",
    presentationOnly:true,
    legacy:false,
    canonicalRenderer:"AllphaWorldRenderer",
    humanReview:"APPROVED",
    reviewer:"USER_CONFIRMED"
  };
  const row = {
    theme_id:ids.themeId,
    theme_version_id:ids.themeVersionId,
    asset_type:"3d_scene",
    storage_path:entry.storagePath,
    mime_type:"model/gltf-binary",
    metadata,
    sort_order:CATEGORIES.indexOf(entry.category),
    status:"active",
    moderation_status:"approved",
    safety_status:"passed",
    performance_status:"passed",
    storage_bucket:BUCKET,
    content_size_bytes:entry.bytes,
    checksum_sha256:entry.checksumSha256,
    uploaded_at:new Date().toISOString()
  };
  if (existing?.[0]?.id) {
    await request(supabaseUrl + "/rest/v1/theme_assets?id=eq." + existing[0].id, {
      method:"PATCH",
      headers:{...headers,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify(row)
    });
  } else {
    await request(supabaseUrl + "/rest/v1/theme_assets", {
      method:"POST",
      headers:{...headers,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify(row)
    });
  }
}

const report = {
  schema:"allpha-3d-v2-13d4-storage-promotion/1.0",
  phase:"V2.13D.4",
  decision:"PROMOTED_100_MACRO_ASSETS",
  humanReviewApproved:true,
  explicitProductionPromotionApproval:true,
  themes:25,
  assets:100,
  bucket:BUCKET,
  root:ROOT,
  storageMutationPerformed:true,
  supabaseMutationPerformed:true,
  uploaded:100,
  registeredThemeAssets:100,
  sourceD3C:{runId:37553533713,headSha:"eb6892492c4ba7188ecd6c9c8b7d00d633e2c154"},
  lockedOutsideScope:["D3A","D3C","250 non-macro assets","350-asset rebuild"]
};
fs.writeFileSync("v2-13d4-storage-promotion-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
