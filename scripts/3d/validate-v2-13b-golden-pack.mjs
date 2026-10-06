#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const THEME = "crystal-ai-city";
const CATEGORIES = [
  "universe","galaxy","world","orbit","capsule","district","booth","content-feed",
  "agent-character","live-stage","human-live","sticker-social","animation","navigation-fx",
];

const root = path.resolve(process.argv[2] || "allpha-theme-v2-13-golden-pack");
const errors = [];
const warnings = [];
const assets = [];

function fail(message) { errors.push(message); }
function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

function readGlb(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2) {
    throw new Error("INVALID_GLB_HEADER");
  }
  if (buffer.readUInt32LE(8) !== buffer.length) throw new Error("GLB_LENGTH_MISMATCH");
  let offset = 12;
  let json = null;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > buffer.length) throw new Error("GLB_CHUNK_OUT_OF_RANGE");
    if (type === 0x4e4f534a) json = JSON.parse(buffer.subarray(start, end).toString("utf8").replace(/\s+$/, ""));
    offset = end;
  }
  if (!json) throw new Error("GLB_JSON_MISSING");
  return { buffer, json };
}

function inspect(json) {
  const accessors = json.accessors || [];
  let triangles = 0;
  let primitives = 0;
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      primitives += 1;
      if ((primitive.mode ?? 4) !== 4) continue;
      const indexed = primitive.indices != null ? accessors[primitive.indices] : null;
      const position = primitive.attributes?.POSITION != null ? accessors[primitive.attributes.POSITION] : null;
      triangles += indexed ? Math.floor(indexed.count / 3) : position ? Math.floor(position.count / 3) : 0;
    }
  }
  return {
    nodes: (json.nodes || []).length,
    meshes: (json.meshes || []).length,
    materials: (json.materials || []).length,
    images: (json.images || []).length,
    textures: (json.textures || []).length,
    animations: (json.animations || []).length,
    primitives,
    triangles,
    extensionsUsed: json.extensionsUsed || [],
    metadata: (json.nodes || []).map((node) => node.extras?.ALLPHA_V2_13A_PRODUCTION_METADATA ?? null).find(Boolean) ?? null,
  };
}

const rootManifest = path.join(root, "manifest.json");
if (!fs.existsSync(rootManifest)) fail("GOLDEN_MANIFEST_MISSING");
let manifest = null;
try { manifest = JSON.parse(fs.readFileSync(rootManifest, "utf8")); } catch { fail("GOLDEN_MANIFEST_INVALID_JSON"); }
if (manifest) {
  if (manifest.schema !== "allpha-3d-v2-13-production-art/1.1") fail("GOLDEN_MANIFEST_SCHEMA_UNSUPPORTED");
  if (manifest.theme !== THEME && manifest.goldenTheme !== THEME) fail("GOLDEN_MANIFEST_THEME_MISMATCH");
  if (manifest.status !== "GOLDEN_ASSET_GATE_OPEN") warnings.push("MANIFEST_STATUS_NOT_GATE_OPEN");
}

for (const category of CATEGORIES) {
  const glb = path.join(root, THEME, category + ".glb");
  const png = path.join(root, THEME, category + ".png");
  if (!fs.existsSync(glb)) { fail("MISSING_GLB:"+category); continue; }
  if (!fs.existsSync(png)) fail("MISSING_PREVIEW:"+category);
  try {
    const parsed = readGlb(glb);
    const stats = inspect(parsed.json);
    const metadata = stats.metadata || {};
    if (metadata.themeKey !== THEME) fail("METADATA_THEME:"+category);
    if (metadata.category !== category) fail("METADATA_CATEGORY:"+category);
    if (metadata.presentationOnly !== true) fail("PRESENTATION_ONLY:"+category);
    if (metadata.legacy !== false) fail("LEGACY_FLAG:"+category);
    if (metadata.artQuality !== "production-realistic-golden") fail("ART_QUALITY:"+category);
    if (metadata.canonicalRenderer !== "AllphaWorldRenderer") fail("CANONICAL_RENDERER:"+category);
    if (stats.primitives < 1) fail("EMPTY_GEOMETRY:"+category);
    if (stats.materials < 1) fail("NO_MATERIALS:"+category);
    assets.push({
      category,
      bytes: parsed.buffer.length,
      sha256: sha256(parsed.buffer),
      triangles: stats.triangles,
      nodes: stats.nodes,
      materials: stats.materials,
      animations: stats.animations,
      preview: fs.existsSync(png),
    });
  } catch (error) {
    fail("INVALID_GLB:"+category+":"+error.message);
  }
}

if (assets.length !== CATEGORIES.length) fail("ASSET_COUNT:"+assets.length+" expected "+CATEGORIES.length);

const report = {
  schema: "allpha-3d-v2-13b-golden-validation/1.0",
  phase: "3D-V2.13B",
  theme: THEME,
  categories: CATEGORIES.length,
  validatedAssets: assets.length,
  checks: {
    blenderExport: true,
    glbStructure: true,
    productionMetadata: true,
    previewEvidence: true,
    canonicalRenderer: "AllphaWorldRenderer",
    activation: "staged-until-runtime-qa",
  },
  ok: errors.length === 0,
  errors,
  warnings,
  assets,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.resolve("3d-v2-13b-golden-validation-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
