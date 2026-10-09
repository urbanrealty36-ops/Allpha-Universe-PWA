import test from "node:test";
import assert from "node:assert/strict";
import { inspectGlb } from "./validate-glb.mjs";

function fixture({ magic = 0x46546c67, version = 2, declaredLength } = {}) {
  const json = Buffer.from(JSON.stringify({
    asset: { version: "2.0", generator: "validator-test-fixture" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: {} }] }]
  }));
  const paddedLength = Math.ceil(json.length / 4) * 4;
  const chunk = Buffer.alloc(paddedLength, 0x20);
  json.copy(chunk);
  const total = 12 + 8 + chunk.length;
  const buffer = Buffer.alloc(total);
  buffer.writeUInt32LE(magic, 0);
  buffer.writeUInt32LE(version, 4);
  buffer.writeUInt32LE(declaredLength ?? total, 8);
  buffer.writeUInt32LE(chunk.length, 12);
  buffer.writeUInt32LE(0x4e4f534a, 16);
  chunk.copy(buffer, 20);
  return buffer;
}

test("accepts structurally valid GLB 2.0 with a mesh scene", () => {
  const result = inspectGlb(fixture(), "golden-fixture.glb");
  assert.equal(result.validation, "STRUCTURAL_PASS");
  assert.equal(result.meshCount, 1);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
});

test("rejects non-GLB payloads", () => {
  assert.throws(() => inspectGlb(Buffer.from("<html>error</html>"), "fake.glb"), /GLB_TRUNCATED|GLB_MAGIC_INVALID/);
});

test("rejects mismatched declared file length", () => {
  assert.throws(() => inspectGlb(fixture({ declaredLength: 999 }), "bad.glb"), /GLB_LENGTH_MISMATCH/);
});

test("rejects unsupported GLB version", () => {
  assert.throws(() => inspectGlb(fixture({ version: 1 }), "old.glb"), /GLB_VERSION_UNSUPPORTED/);
});

test("rejects a non-GLB extension", () => {
  assert.throws(() => inspectGlb(fixture(), "asset.gltf"), /FILE_EXTENSION_INVALID/);
});

test("rejects a scene with no mesh content", () => {
  const buffer = fixture();
  const json = JSON.parse(buffer.subarray(20).toString("utf8").trim());
  json.scenes = [{ nodes: [] }];
  const text = Buffer.from(JSON.stringify(json));
  const chunkLength = Math.ceil(text.length / 4) * 4;
  const chunk = Buffer.alloc(chunkLength, 0x20);
  text.copy(chunk);
  const output = Buffer.alloc(20 + chunkLength);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(chunkLength, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  chunk.copy(output, 20);
  assert.throws(() => inspectGlb(output, "empty-scene.glb"), /GLTF_SCENE_HAS_NO_MESHES/);
});
