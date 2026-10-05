import { ALLPHA_3D_THEME_PROFILES } from "../../../../packages/design-tokens/3d-visual-language";
import { ASSET_CATEGORIES, create3DAssetRecipe, type AssetCategory, type AssetRecipe } from "./asset-factory";

export const THEME_V2_SCHEMA = "theme-v2-spatial-visual/1.0" as const;

export type ThemeV2VisualTemplate = {
  schema: typeof THEME_V2_SCHEMA;
  templateKey: string;
  themeKey: string;
  category: AssetCategory;
  recipeKey: string;
  visualRole: "universe" | "galaxy" | "world" | "district" | "booth" | "content" | "live" | "character" | "navigation" | "social";
  spatialGrammar: readonly string[];
  camera: { depth: "cinematic"; orbit: boolean; parallax: boolean; mobileFov: number; desktopFov: number };
  animation: { vocabulary: readonly string[]; reducedMotion: "state-preserving-static" };
  responsive: { mobile: "compact-spatial"; lowPower: "reduced-particles-and-detail" };
  assetRecipe: AssetRecipe;
  presentationOnly: true;
};

const roleByCategory: Record<AssetCategory, ThemeV2VisualTemplate["visualRole"]> = {
  universe: "universe",
  galaxy: "galaxy",
  world: "world",
  orbit: "navigation",
  capsule: "content",
  district: "district",
  booth: "booth",
  "content-feed": "content",
  "agent-character": "character",
  "live-stage": "live",
  "human-live": "live",
  "sticker-social": "social",
  animation: "navigation",
  "navigation-fx": "navigation",
};

const grammarByCategory: Record<AssetCategory, readonly string[]> = {
  universe: ["cosmic-core", "galaxy-nodes", "orbital-rings", "deep-space-depth"],
  galaxy: ["galaxy-core", "world-orbits", "world-nodes", "spatial-links"],
  world: ["world-body", "district-landmarks", "atmosphere", "world-orbit"],
  orbit: ["orbit-center", "orbit-rings", "moving-nodes", "signal-links"],
  capsule: ["content-capsule", "relationship-orbit", "semantic-signal"],
  district: ["district-platform", "landmarks", "paths", "ambient-depth"],
  booth: ["booth-shell", "identity-sign", "entry-gateway", "tenant-space"],
  "content-feed": ["content-node", "relationship-field", "media-signal"],
  "agent-character": ["character-silhouette", "identity-aura", "animation-signal"],
  "live-stage": ["stage-platform", "backdrop", "audience-field", "live-signal"],
  "human-live": ["human-presenter", "presence-ring", "uniform-language"],
  "sticker-social": ["social-object", "signal-ring", "badge"],
  animation: ["motion-anchor", "orbit-motion", "state-signal"],
  "navigation-fx": ["portal", "beam", "breadcrumb", "transition"],
};

function createTemplate(themeKey: string, category: AssetCategory): ThemeV2VisualTemplate {
  const recipe = create3DAssetRecipe(themeKey, category);
  return {
    schema: THEME_V2_SCHEMA,
    templateKey: "theme-v2/" + themeKey + "/" + category,
    themeKey,
    category,
    recipeKey: recipe.assetKey,
    visualRole: roleByCategory[category],
    spatialGrammar: grammarByCategory[category],
    camera: { depth: "cinematic", orbit: recipe.motion.includes("orbit"), parallax: true, mobileFov: 48, desktopFov: 56 },
    animation: { vocabulary: recipe.motion, reducedMotion: "state-preserving-static" },
    responsive: { mobile: "compact-spatial", lowPower: "reduced-particles-and-detail" },
    assetRecipe: recipe,
    presentationOnly: true,
  };
}

export const THEME_V2_VISUAL_MATRIX = ALLPHA_3D_THEME_PROFILES.flatMap((theme) =>
  ASSET_CATEGORIES.map((category) => createTemplate(theme.key, category)),
);

export const THEME_V2_MATRIX_COUNTS = {
  themes: ALLPHA_3D_THEME_PROFILES.length,
  categories: ASSET_CATEGORIES.length,
  templates: THEME_V2_VISUAL_MATRIX.length,
  expected: 350,
} as const;

export function getThemeV2VisualTemplate(themeKey: string, category: AssetCategory) {
  return THEME_V2_VISUAL_MATRIX.find((template) => template.themeKey === themeKey && template.category === category) ?? null;
}

export function validateThemeV2VisualMatrix(): { ok: true; counts: typeof THEME_V2_MATRIX_COUNTS } | { ok: false; errors: string[]; counts: typeof THEME_V2_MATRIX_COUNTS } {
  const errors: string[] = [];
  if (THEME_V2_MATRIX_COUNTS.themes !== 25) errors.push("THEME_V2_THEME_COUNT_MUST_BE_25");
  if (THEME_V2_MATRIX_COUNTS.categories !== 14) errors.push("THEME_V2_CATEGORY_COUNT_MUST_BE_14");
  if (THEME_V2_MATRIX_COUNTS.templates !== 350) errors.push("THEME_V2_TEMPLATE_COUNT_MUST_BE_350");
  for (const template of THEME_V2_VISUAL_MATRIX) {
    if (!template.assetRecipe.geometry.length) errors.push("THEME_V2_GEOMETRY_MISSING:" + template.templateKey);
    if (!template.animation.vocabulary.length) errors.push("THEME_V2_ANIMATION_MISSING:" + template.templateKey);
    if (!template.spatialGrammar.length) errors.push("THEME_V2_SPATIAL_GRAMMAR_MISSING:" + template.templateKey);
  }
  return errors.length ? { ok: false, errors, counts: THEME_V2_MATRIX_COUNTS } : { ok: true, counts: THEME_V2_MATRIX_COUNTS };
}

export const THEME_V2_VISUAL_CONTRACT = {
  schema: THEME_V2_SCHEMA,
  matrix: THEME_V2_MATRIX_COUNTS,
  acceptance: [
    "real-3d-spatial-composition",
    "universe-galaxy-world-district-hierarchy",
    "orbit-and-depth",
    "theme-specific-geometry-material-atmosphere",
    "animation-vocabulary",
    "reference-aligned-mobile-ui",
    "reduced-motion",
    "low-power",
    "presentation-only-authority-boundary",
  ] as const,
};
