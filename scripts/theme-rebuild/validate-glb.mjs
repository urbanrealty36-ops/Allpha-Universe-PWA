#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createHash } from "node:crypto";

const MAX_BYTES = 100 * 1024 * 1024;
const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

function fail(message) {
  const error = new Error(message);
  error.name = "GlbValidationError";
  throw error;
}

export function inspectGlb(buffer, filename = "asset.glb") {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
  if (!filename.toLowerCase().endsWith(".glb")) fail("FILE_EXTENSION_INVALID");
  if (buffer.length < 20) fail("GLB_TRUNCATED");
  if (buffer.length > MAX_BYTES) fail("GLB_EXCEEDS_100_MB");
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) fail("GLB_MAGIC_INVALID");
  const version = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);
  if (version !== 2) fail("GLB_VERSION_UNSUPPORTED");
  if (declaredLength !== buffer.length) fail("GLB_LENGTH_MISMATCH");

  let offset = 12;
  let json = null;
  let sawBin = false;
  let chunkIndex = 0;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) fail("GLB_CHUNK_HEADER_TRUNCATED");
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (chunkLength % 4 !== 0) fail("GLB_CHUNK_ALIGNMENT_INVALID");
    if (chunkLength === 0 || offset + chunkLength > buffer.length) fail("GLB_CHUNK_LENGTH_INVALID");
    if (chunkIndex === 0 && chunkType !== JSON_CHUNK) fail("GLB_JSON_CHUNK_MISSING");
    if (chunkType === JSON_CHUNK) {
      if (json !== null || chunkIndex !== 0) fail("GLB_JSON_CHUNK_ORDER_INVALID");
      const text = buffer.subarray(offset, offset + chunkLength).toString("utf8").replace(/[ \\t\\r\\n]+$/u, "");
      try { json = JSON.parse(text); } catch { fail("GLB_JSON_INVALID"); }
    } else if (chunkType === BIN_CHUNK) {
      if (json === null || sawBin) fail("GLB_BIN_CHUNK_ORDER_INVALID");
      sawBin = true;
    } else {
      fail("GLB_CHUNK_TYPE_UNSUPPORTED");
    }
    offset += chunkLength;
    chunkIndex += 1;
  }
  if (offset !== buffer.length || json === null) fail("GLB_CHUNK_LAYOUT_INVALID");
  if (!json.asset || json.asset.version !== "2.0") fail("GLTF_ASSET_VERSION_INVALID");
  if (!Array.isArray(json.scenes) || json.scenes.length === 0) fail("GLTF_SCENES_MISSING");
  if (!Array.isArray(json.nodes)) fail("GLTF_NODES_MISSING");
  if (!Array.isArray(json.meshes)) fail("GLTF_MESHES_MISSING");
  const hasSceneContent = json.scenes.some((scene) => Array.isArray(scene.nodes) && scene.nodes.length > 0);
  if (!hasSceneContent || json.meshes.length === 0) fail("GLTF_SCENE_HAS_NO_MESHES");
  if (json.buffers && json.buffers.some((item) => !Number.isInteger(item.byteLength) || item.byteLength < 0)) fail("GLTF_BUFFER_LENGTH_INVALID");
  const digest = createHash("sha256").update(buffer).digest("hex");
  return {
    file: basename(filename),
    bytes: buffer.length,
    sha256: digest,
    glbVersion: version,
    declaredLength,
    sceneCount: json.scenes.length,
    nodeCount: json.nodes.length,
    meshCount: json.meshes.length,
    materialCount: Array.isArray(json.materials) ? json.materials.length : 0,
    textureCount: Array.isArray(json.textures) ? json.textures.length : 0,
    imageCount: Array.isArray(json.images) ? json.images.length : 0,
    animationCount: Array.isArray(json.animations) ? json.animations.length : 0,
    validation: "STRUCTURAL_PASS",
    note: "Structural GLB validation only; does not replace Blender visual, topology, PBR, texture, scale, animation, or mobile performance QA."
  };
}

async function main() {
  const args = process.argv.slice(2);
  const files = args.filter((arg) => !arg.startsWith("--"));
  if (files.length !== 1 || args.some((arg) => arg.startsWith("--"))) {
    console.error("Usage: node scripts/theme-rebuild/validate-glb.mjs <asset.glb>");
    process.exitCode = 2;
    return;
  }
  const path = resolve(files[0]);
  try {
    await stat(path);
    const result = inspectGlb(await readFile(path), path);
    console.log(JSON.stringify({ schema: "allpha-glb-validation/1.0", status: "PASS", ...result }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      schema: "allpha-glb-validation/1.0",
      status: "FAIL",
      file: basename(path),
      code: error.name === "GlbValidationError" ? error.message : "FILE_READ_FAILED",
      message: error.name === "GlbValidationError" ? "GLB failed structural validation." : "Could not read the supplied file."
    }, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) await main();
