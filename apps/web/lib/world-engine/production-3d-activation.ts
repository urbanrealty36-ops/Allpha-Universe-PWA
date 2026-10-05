import { ALLPHA_3D_THEME_PROFILES } from "../../../../packages/design-tokens/3d-visual-language";
import { ASSET_CATEGORIES, type AssetCategory } from "./asset-factory";

export const PRODUCTION_3D_ACTIVATION_SCHEMA = "allpha-3d-production-activation/1.0" as const;
export const PRODUCTION_3D_STORAGE_BUCKET = "allpha-world-assets" as const;
export const PRODUCTION_3D_STORAGE_ROOT = "theme-v2-real-3d" as const;

export type Production3DActivationDescriptor = {
  themeKey: string; category: AssetCategory; assetKey: string;
  storageBucket: typeof PRODUCTION_3D_STORAGE_BUCKET; storagePath: string;
  lifecycle: "active"; presentationOnly: true; legacy: false;
  renderer: "AllphaWorldRenderer"; source: "theme-v2-real-3d";
};

export function buildProduction3DActivationDescriptor(themeKey: string, category: AssetCategory): Production3DActivationDescriptor {
  return { themeKey, category, assetKey: `v2/${themeKey}/${category}`,
    storageBucket: PRODUCTION_3D_STORAGE_BUCKET,
    storagePath: `${PRODUCTION_3D_STORAGE_ROOT}/${themeKey}/${category}.glb`,
    lifecycle: "active", presentationOnly: true, legacy: false,
    renderer: "AllphaWorldRenderer", source: "theme-v2-real-3d" };
}

export const PRODUCTION_3D_ACTIVATION_MATRIX = ALLPHA_3D_THEME_PROFILES.flatMap((theme) =>
  ASSET_CATEGORIES.map((category) => buildProduction3DActivationDescriptor(theme.key, category)),
);

export const PRODUCTION_3D_ACTIVATION_COUNTS = {
  themes: ALLPHA_3D_THEME_PROFILES.length, categories: ASSET_CATEGORIES.length,
  assets: PRODUCTION_3D_ACTIVATION_MATRIX.length, expected: 350,
} as const;

export function validateProduction3DActivationMatrix() {
  const errors: string[] = []; const keys = new Set<string>();
  if (PRODUCTION_3D_ACTIVATION_COUNTS.themes !== 25) errors.push("THEME_COUNT_MUST_BE_25");
  if (PRODUCTION_3D_ACTIVATION_COUNTS.categories !== 14) errors.push("CATEGORY_COUNT_MUST_BE_14");
  if (PRODUCTION_3D_ACTIVATION_COUNTS.assets !== 350) errors.push("ASSET_COUNT_MUST_BE_350");
  for (const asset of PRODUCTION_3D_ACTIVATION_MATRIX) {
    if (keys.has(asset.assetKey)) errors.push(`DUPLICATE_ASSET:${asset.assetKey}`);
    keys.add(asset.assetKey);
    if (!asset.presentationOnly || asset.legacy) errors.push(`AUTHORITY_BOUNDARY_INVALID:${asset.assetKey}`);
  }
  return { ok: errors.length === 0, errors, counts: PRODUCTION_3D_ACTIVATION_COUNTS };
}
