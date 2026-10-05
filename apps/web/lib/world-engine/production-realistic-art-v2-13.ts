import { ALLPHA_3D_THEME_PROFILES } from "../../../../packages/design-tokens/3d-visual-language";
import { ASSET_CATEGORIES, type AssetCategory } from "./asset-factory";

export const PRODUCTION_REALISTIC_ART_SCHEMA = "allpha-3d-v2-13-production-art/1.0" as const;
export const PRODUCTION_REALISTIC_ART_ROOT = "theme-v2-real-3d/v2.13" as const;

export type ProductionRealisticArtSource = "blender-production-export" | "external-production-import";

export type ProductionRealisticArtContract = {
  schema: typeof PRODUCTION_REALISTIC_ART_SCHEMA;
  themeKey: string;
  category: AssetCategory;
  source: ProductionRealisticArtSource;
  presentationOnly: true;
  legacy: false;
  stagedOnlyUntilRuntimeQa: true;
  requirements: readonly string[];
};

export const PRODUCTION_REALISTIC_ART_REQUIREMENTS = [
  "real-geometry",
  "foreground-midground-background-depth",
  "theme-specific-silhouette",
  "pbr-material-identity",
  "embedded-or-linked-production-textures",
  "cinematic-lighting",
  "atmospheric-depth",
  "lod-readiness",
  "mobile-quality-tier",
  "animation-when-category-requires-it",
  "blender-source-of-truth",
  "runtime-qa-before-activation",
] as const;

export function createProductionRealisticArtContract(
  themeKey: string,
  category: AssetCategory,
  source: ProductionRealisticArtSource = "blender-production-export",
): ProductionRealisticArtContract {
  if (!ALLPHA_3D_THEME_PROFILES.some((theme) => theme.key === themeKey)) {
    throw new Error(`Unknown Allpha theme: ${themeKey}`);
  }
  if (!ASSET_CATEGORIES.includes(category)) {
    throw new Error(`Unknown Allpha 3D category: ${category}`);
  }
  return {
    schema: PRODUCTION_REALISTIC_ART_SCHEMA,
    themeKey,
    category,
    source,
    presentationOnly: true,
    legacy: false,
    stagedOnlyUntilRuntimeQa: true,
    requirements: PRODUCTION_REALISTIC_ART_REQUIREMENTS,
  };
}

export const PRODUCTION_REALISTIC_ART_GOLDEN_MATRIX = {
  goldenTheme: "crystal-ai-city",
  themes: 25,
  categories: 14,
  fullMatrix: 350,
  firstActivationGate: "golden-theme-14-category-runtime-visual-qa",
  activationPath: PRODUCTION_REALISTIC_ART_ROOT,
  canonicalRenderer: "AllphaWorldRenderer",
} as const;
