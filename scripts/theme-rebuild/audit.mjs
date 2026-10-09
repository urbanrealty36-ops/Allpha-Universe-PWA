import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", "node_modules", ".next", "dist", "build", "coverage"]);
const files = [];

async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push(relative(root, full).replaceAll("\\", "/"));
  }
}

await walk(root);
const legacyAutomation = files.filter((path) =>
  path.startsWith(".github/workflows/") &&
  /(?:3d-v2-12|3d-v2-13|v2-13d|d6-2-production-browser-runtime)/i.test(path)
);
const legacyGenerators = files.filter((path) =>
  /^(?:scripts\/3d\/|tools\/theme_assets\/generate_allpha_25_theme_3d_pack\.py$)/.test(path)
);
const required = [
  "apps/web/components/world/allpha-world-renderer.tsx",
  "apps/web/components/world/theme-manifest-asset-scene.tsx",
  "apps/web/components/world/theme-spatial-scene.tsx",
  "docs/implementation/REBUILD_FULL_THEME_3D_UIUX_PHASES.md",
];
const missing = required.filter((path) => !files.includes(path));

const retiredModuleReferences = [];
const retiredModulePatterns = [
  /theme-v2-production-asset-scene/,
  /theme-v2-spatial-scene/,
  /production-3d-runtime-resolver/,
  /production-3d-activation/,
  /production-realistic-art-v2-13/,
  /theme-v2-visual-matrix/,
  /3d-golden-theme-factory/,
];
for (const path of files.filter((item) => item !== "scripts/theme-rebuild/audit.mjs" && /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(item))) {
  const body = await readFile(join(root, path), "utf8").catch(() => "");
  if (retiredModulePatterns.some((pattern) => pattern.test(body))) retiredModuleReferences.push(path);
}

const visualSystemFiles = {
  tokens: "packages/design-tokens/tokens.css",
  primitives: "apps/web/components/ui/allpha-primitives.tsx",
  styles: "apps/web/styles/ui-visual-foundation.css",
};
const visualSystem = {};
for (const [key, path] of Object.entries(visualSystemFiles)) {
  visualSystem[key] = await readFile(join(root, path), "utf8").catch(() => "");
}
const visualSystemContract = {
  missingFiles: Object.entries(visualSystemFiles).filter(([key]) => !visualSystem[key]).map(([, path]) => path),
  missingPrimitives: ["GlassSurface", "UniverseButton", "SpatialNode", "ContentCapsule", "ContextSheet", "StatusOrb", "GlassChip", "SectionHeading", "IconButton", "StatusBadge"]
    .filter((name) => !visualSystem.primitives.includes(`export function ${name}`)),
  missingAccessibilityContracts: [
    ["visible focus", /focus-visible/.test(visualSystem.styles)],
    ["disabled controls", /:disabled/.test(visualSystem.styles)],
    ["reduced motion", /prefers-reduced-motion:\s*reduce/.test(visualSystem.styles)],
    ["responsive breakpoint", /max-width:\s*520px/.test(visualSystem.styles)],
    ["touch target token", /--allpha-touch-min:44px/.test(visualSystem.tokens)],
  ].filter(([, passed]) => !passed).map(([name]) => name),
};

const assetPipelineFiles = {
  validator: "scripts/theme-rebuild/validate-glb.mjs",
  tests: "scripts/theme-rebuild/validate-glb.test.mjs",
  ingestion: "apps/api/app/core/theme_asset_ingestion.py",
  contract: "docs/audits/REBUILD_03_ASSET_PIPELINE_CONTRACT_20261009.md",
  blender: "scripts/theme-rebuild/blender_process_glb.py",
  apiDockerfile: "railway/api.Dockerfile",
};
const assetPipeline = {};
for (const [key, path] of Object.entries(assetPipelineFiles)) {
  assetPipeline[key] = await readFile(join(root, path), "utf8").catch(() => "");
}
const assetPipelineContract = {
  missingFiles: Object.entries(assetPipelineFiles).filter(([key]) => !assetPipeline[key]).map(([, path]) => path),
  missingValidatorChecks: [
    ["GLB v2 header", /GLB_VERSION_UNSUPPORTED/.test(assetPipeline.validator)],
    ["declared file length", /GLB_LENGTH_MISMATCH/.test(assetPipeline.validator)],
    ["glTF scene mesh content", /GLTF_SCENE_HAS_NO_MESHES/.test(assetPipeline.validator)],
    ["SHA-256 digest", /createHash\("sha256"\)/.test(assetPipeline.validator)],
    ["validator test suite", /node:test/.test(assetPipeline.tests)],
    ["Blender headless process", /bpy\.ops\.import_scene\.gltf/.test(assetPipeline.blender)],
    ["Blender GLB export", /export_format="GLB"/.test(assetPipeline.blender)],
    ["Blender report hashes", /output_sha256/.test(assetPipeline.blender)],
    ["Railway API image installs Blender", /apt-get install -y --no-install-recommends blender/.test(assetPipeline.apiDockerfile)],
    ["Railway API image includes canonical Blender script", /COPY scripts\/theme-rebuild\/blender_process_glb.py/.test(assetPipeline.apiDockerfile)],
  ].filter(([, passed]) => !passed).map(([name]) => name),
  missingIngestionGuards: [
    ["HTTPS provider URL", /model_url\.startswith\("https:\/\/"/.test(assetPipeline.ingestion)],
    ["100 MiB ceiling", /100 \* 1024 \* 1024/.test(assetPipeline.ingestion)],
    ["GLB structural validation before upload", /_validate_glb\(content\)/.test(assetPipeline.ingestion)],
    ["SHA-256 asset checksum", /hashlib\.sha256\(content\)/.test(assetPipeline.ingestion)],
    ["canonical asset registry", /service_insert\("theme_assets"/.test(assetPipeline.ingestion)],
    ["server-side Storage auth", /supabase_service_role_key/.test(assetPipeline.ingestion)],
    ["headless Blender invoked before upload", /await asyncio\.to_thread\(_process_with_blender, content\)/.test(assetPipeline.ingestion)],
    ["canonical production manifest prefix", /storage_path = f"theme-v3-tripo\//.test(assetPipeline.ingestion)],
    ["signed URL fetch verification", /_verify_signed_url\(signed_url\)/.test(assetPipeline.ingestion)],
    ["Blender report persisted", /"blender_report": blender_report/.test(assetPipeline.ingestion)],
  ].filter(([, passed]) => !passed).map(([name]) => name),
};

const publicManifestPath = "apps/api/app/api/world_runtime.py";
const publicManifest = await readFile(join(root, publicManifestPath), "utf8").catch(() => "");
const legacyPublicManifestPrefix = publicManifest.includes('"storage_path": "like.theme-v2-real-3d/*"');
const missingTripoManifestPrefix = !publicManifest.includes('"storage_path": "like.theme-v3-tripo/*"');
const sourceFiles = files.filter((path) =>
  /^(?:apps\/web\/(?:components\/world|lib\/world-engine)|apps\/api\/app\/api)\/.*\.(?:ts|tsx|py)$/.test(path)
);
const fixedLegacyPrefix = [];
for (const path of sourceFiles) {
  const body = await readFile(join(root, path), "utf8").catch(() => "");
  if (body.includes("theme-v2-real-3d/v2.13/")) fixedLegacyPrefix.push(path);
}
console.log(JSON.stringify({
  schema: "allpha-theme-rebuild-audit/1.0",
  checkedFiles: files.length,
  requiredCoreFiles: required.length,
  missingCoreFiles: missing,
  legacyV2AutomationFiles: legacyAutomation,
  legacyV2GeneratorFiles: legacyGenerators,
  referencesToRetiredModules: retiredModuleReferences,
  runtimeFilesWithHardcodedV213Prefix: fixedLegacyPrefix,
  legacyPublicManifestPrefix,
  missingTripoManifestPrefix,
  visualSystemContract,
  assetPipelineContract,
  status: missing.length || legacyAutomation.length || legacyGenerators.length || retiredModuleReferences.length || fixedLegacyPrefix.length || legacyPublicManifestPrefix || missingTripoManifestPrefix || visualSystemContract.missingFiles.length || visualSystemContract.missingPrimitives.length || visualSystemContract.missingAccessibilityContracts.length || assetPipelineContract.missingFiles.length || assetPipelineContract.missingValidatorChecks.length || assetPipelineContract.missingIngestionGuards.length ? "FAIL" : "PASS",
}, null, 2));
if (missing.length || legacyAutomation.length || legacyGenerators.length || retiredModuleReferences.length || fixedLegacyPrefix.length || legacyPublicManifestPrefix || missingTripoManifestPrefix || visualSystemContract.missingFiles.length || visualSystemContract.missingPrimitives.length || visualSystemContract.missingAccessibilityContracts.length || assetPipelineContract.missingFiles.length || assetPipelineContract.missingValidatorChecks.length || assetPipelineContract.missingIngestionGuards.length) process.exitCode = 1;
