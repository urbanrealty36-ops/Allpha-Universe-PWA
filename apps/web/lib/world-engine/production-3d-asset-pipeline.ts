import { ALLPHA_3D_THEME_PROFILES } from "../../../../packages/design-tokens/3d-visual-language";
import { ASSET_CATEGORIES, type AssetCategory } from "./asset-factory";

export const PRODUCTION_3D_PIPELINE_SCHEMA = "allpha-3d-production-pipeline/1.0" as const;
export const PRODUCTION_3D_STORAGE_ROOT = "theme-v2-real-3d" as const;

export type ProductionAssetLifecycle =
  | "generated"
  | "validated"
  | "moderated"
  | "stored"
  | "manifest-ready"
  | "staged"
  | "active"
  | "archived";

export type ProductionQualityTier = "mobile" | "standard" | "hero";

export type ProductionQualityBudget = {
  maxBytes: number;
  maxTriangles: number;
  maxNodes: number;
  maxMaterials: number;
  maxTransparentMaterials: number;
};

export const PRODUCTION_3D_QUALITY_BUDGETS: Record<ProductionQualityTier, ProductionQualityBudget> = {
  mobile: { maxBytes: 1_500_000, maxTriangles: 35_000, maxNodes: 96, maxMaterials: 8, maxTransparentMaterials: 3 },
  standard: { maxBytes: 6_000_000, maxTriangles: 120_000, maxNodes: 220, maxMaterials: 16, maxTransparentMaterials: 6 },
  hero: { maxBytes: 12_000_000, maxTriangles: 220_000, maxNodes: 420, maxMaterials: 24, maxTransparentMaterials: 8 },
};

const heroCategories = new Set<AssetCategory>(["universe", "galaxy", "world", "district", "live-stage"]);
const interactiveCategories = new Set<AssetCategory>(["booth", "content-feed", "navigation-fx", "capsule"]);

export function getProductionQualityTier(category: AssetCategory): ProductionQualityTier {
  if (heroCategories.has(category)) return "hero";
  if (interactiveCategories.has(category)) return "standard";
  return "mobile";
}

export function buildProductionAssetKey(themeKey: string, category: AssetCategory) {
  return \`v2/\${themeKey}/\${category}\`;
}

export function buildProductionStoragePath(themeKey: string, category: AssetCategory) {
  return \`\${PRODUCTION_3D_STORAGE_ROOT}/\${themeKey}/\${category}.glb\`;
}

export type ProductionAssetDescriptor = {
  schema: typeof PRODUCTION_3D_PIPELINE_SCHEMA;
  assetKey: string;
  templateKey: string;
  themeKey: string;
  category: AssetCategory;
  qualityTier: ProductionQualityTier;
  storageBucket: "allpha-world-assets";
  storagePath: string;
  mimeType: "model/gltf-binary";
  lifecycle: ProductionAssetLifecycle;
  source: "procedural-realization-export" | "blender-production-export" | "external-production-import";
  presentationOnly: true;
  legacy: false;
  rollback: {
    legacyPath: string | null;
    cutover: "staged-first";
    deleteLegacyAfterRuntimeQa: true;
  };
  optimization: {
    textureFormat: "ktx2" | "embedded-materials";
    geometryCompression: "meshopt" | "draco" | "none";
    lod: "required" | "recommended" | "not-required";
    instancing: "required" | "recommended" | "not-required";
  };
};

function optimizationFor(category: AssetCategory): ProductionAssetDescriptor["optimization"] {
  if (heroCategories.has(category)) {
    return { textureFormat: "ktx2", geometryCompression: "meshopt", lod: "required", instancing: "recommended" };
  }
  if (interactiveCategories.has(category)) {
    return { textureFormat: "ktx2", geometryCompression: "meshopt", lod: "recommended", instancing: "recommended" };
  }
  return { textureFormat: "embedded-materials", geometryCompression: "meshopt", lod: "recommended", instancing: "not-required" };
}

export function createProductionAssetDescriptor(
  themeKey: string,
  category: AssetCategory,
  source: ProductionAssetDescriptor["source"] = "procedural-realization-export",
): ProductionAssetDescriptor {
  if (!ALLPHA_3D_THEME_PROFILES.some((profile) => profile.key === themeKey)) {
    throw new Error(\`Unknown Allpha 3D theme: \${themeKey}\`);
  }

  return {
    schema: PRODUCTION_3D_PIPELINE_SCHEMA,
    assetKey: buildProductionAssetKey(themeKey, category),
    templateKey: \`theme-v2-real/\${themeKey}/\${category}\`,
    themeKey,
    category,
    qualityTier: getProductionQualityTier(category),
    storageBucket: "allpha-world-assets",
    storagePath: buildProductionStoragePath(themeKey, category),
    mimeType: "model/gltf-binary",
    lifecycle: "generated",
    source,
    presentationOnly: true,
    legacy: false,
    rollback: {
      legacyPath: \`\${themeKey}.glb\`,
      cutover: "staged-first",
      deleteLegacyAfterRuntimeQa: true,
    },
    optimization: optimizationFor(category),
  };
}

export function createProductionAssetMatrix() {
  return ALLPHA_3D_THEME_PROFILES.flatMap((theme) =>
    ASSET_CATEGORIES.map((category) => createProductionAssetDescriptor(theme.key, category)),
  );
}

export const PRODUCTION_3D_ASSET_MATRIX = createProductionAssetMatrix();

export const PRODUCTION_3D_MATRIX_COUNTS = {
  themes: ALLPHA_3D_THEME_PROFILES.length,
  categories: ASSET_CATEGORIES.length,
  assets: PRODUCTION_3D_ASSET_MATRIX.length,
  expected: 350,
} as const;

export function validateProductionAssetMatrix() {
  const errors: string[] = [];
  if (PRODUCTION_3D_MATRIX_COUNTS.themes !== 25) errors.push("PRODUCTION_3D_THEME_COUNT_MUST_BE_25");
  if (PRODUCTION_3D_MATRIX_COUNTS.categories !== 14) errors.push("PRODUCTION_3D_CATEGORY_COUNT_MUST_BE_14");
  if (PRODUCTION_3D_MATRIX_COUNTS.assets !== 350) errors.push("PRODUCTION_3D_ASSET_COUNT_MUST_BE_350");

  const keys = new Set<string>();
  for (const asset of PRODUCTION_3D_ASSET_MATRIX) {
    if (keys.has(asset.assetKey)) errors.push(\`PRODUCTION_3D_DUPLICATE_ASSET:\${asset.assetKey}\`);
    keys.add(asset.assetKey);
    if (!asset.storagePath.startsWith(\`\${PRODUCTION_3D_STORAGE_ROOT}/\`)) {
      errors.push(\`PRODUCTION_3D_STORAGE_PATH_INVALID:\${asset.assetKey}\`);
    }
    if (!asset.presentationOnly || asset.legacy) {
      errors.push(\`PRODUCTION_3D_AUTHORITY_BOUNDARY_INVALID:\${asset.assetKey}\`);
    }
  }

  return errors.length
    ? { ok: false as const, errors, counts: PRODUCTION_3D_MATRIX_COUNTS }
    : { ok: true as const, counts: PRODUCTION_3D_MATRIX_COUNTS };
}

export const PRODUCTION_3D_PIPELINE_CONTRACT = {
  schema: PRODUCTION_3D_PIPELINE_SCHEMA,
  storageBucket: "allpha-world-assets",
  storageRoot: PRODUCTION_3D_STORAGE_ROOT,
  matrix: PRODUCTION_3D_MATRIX_COUNTS,
  lifecycle: ["generated", "validated", "moderated", "stored", "manifest-ready", "staged", "active", "archived"] as const,
  gates: [
    "binary-integrity",
    "theme-category-identity",
    "geometry-budget",
    "material-budget",
    "texture-compression",
    "geometry-compression",
    "lod-readiness",
    "mobile-readiness",
    "moderation-before-activation",
    "runtime-qa-before-legacy-delete",
  ] as const,
} as const;
