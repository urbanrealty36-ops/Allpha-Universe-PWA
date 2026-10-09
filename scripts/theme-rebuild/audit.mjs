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
  runtimeFilesWithHardcodedV213Prefix: fixedLegacyPrefix,
  legacyPublicManifestPrefix,
  missingTripoManifestPrefix,
  status: missing.length || legacyAutomation.length || legacyGenerators.length || fixedLegacyPrefix.length || legacyPublicManifestPrefix || missingTripoManifestPrefix ? "FAIL" : "PASS",
}, null, 2));
if (missing.length || legacyAutomation.length || legacyGenerators.length || fixedLegacyPrefix.length || legacyPublicManifestPrefix || missingTripoManifestPrefix) process.exitCode = 1;
