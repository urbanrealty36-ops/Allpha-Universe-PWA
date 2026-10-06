#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const visualLanguage = fs.readFileSync(path.join(root, "packages/design-tokens/3d-visual-language.ts"), "utf8");
const assetFactory = fs.readFileSync(path.join(root, "apps/web/lib/world-engine/asset-factory.ts"), "utf8");

const profileBlock = visualLanguage.match(/ALLPHA_3D_THEME_PROFILES:[^=]*= \[(.*?)\] as const;/s)?.[1] ?? "";
const profileMatches = [...profileBlock.matchAll(
  /\{\s*key:\s*"([^"]+)",\s*family:\s*"([^"]+)",\s*geometry:\s*"([^"]+)",\s*material:\s*"([^"]+)",\s*atmosphere:\s*"([^"]+)",\s*landmark:\s*"([^"]+)",\s*district:\s*"([^"]+)",\s*character:\s*"([^"]+)",\s*portal:\s*"([^"]+)",\s*accent:\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]\s*\}/g
)];

const categoryBlock = assetFactory.match(/ASSET_CATEGORIES\s*=\s*\[(.*?)\] as const;/s)?.[1] ?? "";
const categories = [...categoryBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

const requiredDimensions = [
  "geometry","material","atmosphere","architecture","landmark","district",
  "character","portal","lighting","camera","motion","fx",
];

const categoryRoles = {
  universe:"macro", galaxy:"navigation", world:"world", orbit:"navigation",
  capsule:"content", district:"world", booth:"social", "content-feed":"content",
  "agent-character":"identity", "live-stage":"live", "human-live":"live",
  "sticker-social":"social", animation:"motion", "navigation-fx":"navigation",
};

const profiles = profileMatches.map((m) => ({
  key:m[1], family:m[2], geometry:m[3], material:m[4], atmosphere:m[5],
  landmark:m[6], district:m[7], character:m[8], portal:m[9],
  accent:[m[10],m[11],m[12]],
}));

const errors = [];
if (profiles.length !== 25) errors.push("THEME_COUNT_EXPECTED_25:" + profiles.length);
if (categories.length !== 14) errors.push("CATEGORY_COUNT_EXPECTED_14:" + categories.length);
if (!profiles.some((p) => p.key === "crystal-ai-city")) errors.push("GOLDEN_THEME_MISSING");
if (new Set(profiles.map((p) => p.key)).size !== profiles.length) errors.push("DUPLICATE_THEME_KEY");
if (new Set(categories).size !== categories.length) errors.push("DUPLICATE_CATEGORY");

const matrix = [];
for (const theme of profiles) {
  for (const category of categories) {
    matrix.push({
      schema:"allpha-3d-v2-13c-golden-theme-factory/1.0",
      themeKey:theme.key,
      family:theme.family,
      category,
      goldenReference:"crystal-ai-city",
      visualFingerprint:{
        geometry:theme.geometry,
        material:theme.material,
        atmosphere:theme.atmosphere,
        architecture:theme.geometry,
        landmark:theme.landmark,
        district:theme.district,
        character:theme.character,
        portal:theme.portal,
      },
      categoryContract:{
        spatialRole:categoryRoles[category] ?? "world",
        performanceTier:["universe","galaxy","world","agent-character","live-stage","human-live"].includes(category) ? "hero" : "standard",
      },
      semanticAccent:theme.accent,
      requiredDimensions,
      presentationOnly:true,
      canonicalRenderer:"AllphaWorldRenderer",
      runtimeAuthority:"outside-blender",
    });
  }
}

if (matrix.length !== 350) errors.push("MATRIX_SIZE_EXPECTED_350:" + matrix.length);
for (const item of matrix) {
  const values = Object.values(item.visualFingerprint);
  if (new Set(values).size < 6) errors.push("WEAK_VISUAL_FINGERPRINT:" + item.themeKey);
  if (item.goldenReference !== "crystal-ai-city") errors.push("INVALID_GOLDEN_REFERENCE:" + item.themeKey);
  if (item.requiredDimensions.length !== 12) errors.push("INVALID_DIMENSION_CONTRACT:" + item.themeKey);
  if (item.presentationOnly !== true) errors.push("INVALID_PRESENTATION_BOUNDARY:" + item.themeKey);
  if (item.canonicalRenderer !== "AllphaWorldRenderer") errors.push("INVALID_RENDERER:" + item.themeKey);
}

const report = {
  schema:"allpha-3d-v2-13c-golden-theme-factory/1.0",
  phase:"3D-V2.13C",
  goldenTheme:"crystal-ai-city",
  themes:profiles.length,
  categories:categories.length,
  matrixSize:matrix.length,
  dimensions:requiredDimensions,
  ok:errors.length === 0,
  errors,
  generatedAt:new Date().toISOString(),
  profiles,
  matrix,
};

const output = path.resolve("allpha-v2-13c-theme-factory-manifest.json");
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ok:report.ok, themes:profiles.length, categories:categories.length, matrix:matrix.length, output}, null, 2));
process.exit(errors.length ? 1 : 0);
