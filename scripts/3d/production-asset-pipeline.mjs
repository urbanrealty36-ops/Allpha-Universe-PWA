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

const HERO = new Set(["universe","galaxy","world","district","live-stage"]);
const INTERACTIVE = new Set(["booth","content-feed","navigation-fx","capsule"]);

const BUDGETS = {
  mobile: { maxBytes: 1_500_000, maxTriangles: 35_000, maxNodes: 96, maxMaterials: 8 },
  standard: { maxBytes: 6_000_000, maxTriangles: 120_000, maxNodes: 220, maxMaterials: 16 },
  hero: { maxBytes: 12_000_000, maxTriangles: 220_000, maxNodes: 420, maxMaterials: 24 },
};

function tier(category) {
  return HERO.has(category) ? "hero" : INTERACTIVE.has(category) ? "standard" : "mobile";
}

function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.length < 20 || b.readUInt32LE(0) !== 0x46546c67 || b.readUInt32LE(4) !== 2) {
    throw new Error("Invalid GLB header/version");
  }
  const declared = b.readUInt32LE(8);
  if (declared !== b.length) throw new Error(\`GLB length mismatch declared=\${declared} actual=\${b.length}\`);

  let offset = 12;
  let json = null;
  while (offset + 8 <= b.length) {
    const length = b.readUInt32LE(offset);
    const type = b.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > b.length) throw new Error("GLB chunk exceeds file length");
    if (type === 0x4e4f534a) {
      json = JSON.parse(b.subarray(start, end).toString("utf8").replace(/\\s+$/, ""));
    }
    offset = end;
  }
  if (!json) throw new Error("GLB JSON chunk missing");
  return { json, bytes: b.length, sha256: crypto.createHash("sha256").update(b).digest("hex") };
}

function stats(glb) {
  const accessors = glb.json.accessors || [];
  const meshes = glb.json.meshes || [];
  const nodes = glb.json.nodes || [];
  const materials = glb.json.materials || [];
  const images = glb.json.images || [];
  const textures = glb.json.textures || [];
  const animations = glb.json.animations || [];

  let triangles = 0;
  let primitives = 0;
  for (const mesh of meshes) {
    for (const primitive of mesh.primitives || []) {
      primitives += 1;
      if ((primitive.mode ?? 4) !== 4) continue;
      const indexed = primitive.indices != null ? accessors[primitive.indices] : null;
      const position = primitive.attributes?.POSITION != null ? accessors[primitive.attributes.POSITION] : null;
      triangles += indexed ? Math.floor(indexed.count / 3) : position ? Math.floor(position.count / 3) : 0;
    }
  }

  const transparentMaterials = materials.filter(
    (material) => material.alphaMode === "BLEND" || material.extensions?.KHR_materials_transmission,
  ).length;

  const texturesKtx2 = images.filter((image) => image.mimeType === "image/ktx2").length;
  const lodReady =
    Boolean(glb.json.extensionsUsed?.includes("MSFT_lod")) ||
    (glb.json.nodes || []).some((node) => node.extensions?.MSFT_lod);

  return {
    nodes: nodes.length,
    meshes: meshes.length,
    materials: materials.length,
    images: images.length,
    textures: textures.length,
    animations: animations.length,
    primitives,
    triangles,
    transparentMaterials,
    texturesKtx2,
    lodReady,
  };
}

function expectedFiles(root) {
  return THEMES.flatMap((theme) =>
    CATEGORIES.map((category) => ({ theme, category, file: path.join(root, theme, \`\${category}.glb\`) })),
  );
}

function validate(root) {
  const errors = [];
  const warnings = [];
  const assets = [];

  for (const item of expectedFiles(root)) {
    if (!fs.existsSync(item.file)) {
      errors.push(\`MISSING:\${item.theme}/\${item.category}.glb\`);
      continue;
    }

    try {
      const parsed = readGlb(item.file);
      const assetStats = stats(parsed);
      const qualityTier = tier(item.category);
      const budget = BUDGETS[qualityTier];
      const file = path.relative(root, item.file).replaceAll(path.sep, "/");

      assets.push({
        templateKey: \`theme-v2-real/\${item.theme}/\${item.category}\`,
        themeKey: item.theme,
        category: item.category,
        file,
        bytes: parsed.bytes,
        sha256: parsed.sha256,
        qualityTier,
        presentationOnly: true,
        schema: "theme-v2-real-3d/1.0",
        stats: assetStats,
      });

      if (parsed.bytes > budget.maxBytes) errors.push(\`BYTES_BUDGET:\${file}:\${parsed.bytes}>\${budget.maxBytes}\`);
      if (assetStats.triangles > budget.maxTriangles) errors.push(\`TRIANGLE_BUDGET:\${file}:\${assetStats.triangles}>\${budget.maxTriangles}\`);
      if (assetStats.nodes > budget.maxNodes) errors.push(\`NODE_BUDGET:\${file}:\${assetStats.nodes}>\${budget.maxNodes}\`);
      if (assetStats.materials > budget.maxMaterials) errors.push(\`MATERIAL_BUDGET:\${file}:\${assetStats.materials}>\${budget.maxMaterials}\`);
      if (assetStats.meshes < 1 || assetStats.primitives < 1) errors.push(\`GEOMETRY_EMPTY:\${file}\`);
      if (assetStats.materials < 3) errors.push(\`MATERIAL_DIVERSITY:\${file}\`);

      if (qualityTier === "hero" && !assetStats.lodReady) warnings.push(\`LOD_NOT_EMBEDDED:\${file}\`);
      if (qualityTier === "hero" && assetStats.images === 0) warnings.push(\`HERO_NO_TEXTURES:\${file}\`);
      if (qualityTier === "hero" && assetStats.texturesKtx2 === 0 && assetStats.images > 0) {
        warnings.push(\`HERO_TEXTURES_NOT_KTX2:\${file}\`);
      }
    } catch (error) {
      errors.push(\`INVALID_GLB:\${item.theme}/\${item.category}:\${error.message}\`);
    }
  }

  const keys = new Set(assets.map((asset) => asset.templateKey));
  if (assets.length !== 350) errors.push(\`COUNT:\${assets.length} expected 350\`);
  if (keys.size !== assets.length) errors.push("DUPLICATE_TEMPLATE_KEYS");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    assets,
    counts: { themes: THEMES.length, categories: CATEGORIES.length, assets: assets.length, expected: 350 },
  };
}

function main() {
  const command = process.argv[2] || "validate";
  const root = path.resolve(process.argv[3] || "allpha-theme-v2-real-3d-pack");

  if (command === "inspect") {
    const parsed = readGlb(root);
    console.log(JSON.stringify({ file: root, bytes: parsed.bytes, sha256: parsed.sha256, stats: stats(parsed) }, null, 2));
    return;
  }

  if (!fs.existsSync(root)) {
    console.error(\`Asset root not found: \${root}\`);
    process.exit(2);
  }

  const result = validate(root);

  if (command === "manifest") {
    const output = path.resolve(process.argv[4] || path.join(root, "production-manifest.json"));
    const manifest = {
      schema: "allpha-3d-production-asset-manifest/1.0",
      pipeline: "3D-V2.09-A",
      storageBucket: "allpha-world-assets",
      storageRoot: "theme-v2-real-3d",
      themes: 25,
      categories: 14,
      templates: 350,
      source: "production-pipeline-validation",
      legacyPackStatus: "retained-as-reference-only",
      promotionStatus: result.ok ? "validation-pass-with-promotion-warnings" : "blocked",
      errors: result.errors,
      warnings: result.warnings,
      assets: result.assets,
    };
    fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + "\\n");
    console.log(\`manifest=\${output}\`);
  }

  console.log(JSON.stringify({
    ok: result.ok,
    counts: result.counts,
    errors: result.errors,
    warnings: result.warnings.slice(0, 40),
  }, null, 2));

  process.exit(result.ok ? 0 : 1);
}

main();
