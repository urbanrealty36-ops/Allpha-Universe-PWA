import {
  ALLPHA_3D_MASTER_LANGUAGE,
  ALLPHA_3D_THEME_PROFILES,
  type Allpha3DThemeProfile,
} from "./3d-visual-language";
import { ASSET_CATEGORIES, type AssetCategory } from "../../apps/web/lib/world-engine/asset-factory";

export const GOLDEN_THEME_FACTORY_SCHEMA = "allpha-3d-v2-13c-golden-theme-factory/1.0" as const;
export const GOLDEN_THEME_KEY = "crystal-ai-city" as const;
export const GOLDEN_THEME_COUNT = 25 as const;
export const GOLDEN_CATEGORY_COUNT = 14 as const;
export const GOLDEN_ASSET_MATRIX_SIZE = 350 as const;

export type GoldenThemeDimension =
  | "geometry"
  | "material"
  | "atmosphere"
  | "architecture"
  | "landmark"
  | "district"
  | "character"
  | "portal"
  | "lighting"
  | "camera"
  | "motion"
  | "fx";

export type GoldenThemeCategoryContract = {
  category: AssetCategory;
  spatialRole: "macro" | "navigation" | "world" | "social" | "identity" | "live" | "content" | "motion";
  geometryGrammar: readonly string[];
  materialRoles: readonly string[];
  lightingIntent: string;
  atmosphereIntent: string;
  cameraIntent: string;
  motionVocabulary: readonly string[];
  performanceTier: "hero" | "standard" | "compact";
};

export type GoldenThemeFactoryRecipe = {
  schema: typeof GOLDEN_THEME_FACTORY_SCHEMA;
  themeKey: string;
  family: string;
  category: AssetCategory;
  goldenReference: typeof GOLDEN_THEME_KEY;
  visualFingerprint: {
    geometry: string;
    material: string;
    atmosphere: string;
    architecture: string;
    landmark: string;
    district: string;
    character: string;
    portal: string;
  };
  categoryContract: GoldenThemeCategoryContract;
  semanticAccent: readonly [string, string, string];
  runtimeLanguage: { lighting: string; camera: string; motion: readonly string[]; fx: string };
  requiredDimensions: readonly GoldenThemeDimension[];
  presentationOnly: true;
  canonicalRenderer: "AllphaWorldRenderer";
  runtimeAuthority: "outside-blender";
};

const categoryContracts: Record<AssetCategory, GoldenThemeCategoryContract> = {
  universe: {
    category: "universe", spatialRole: "macro",
    geometryGrammar: ["core", "orbit", "gateway", "landmark", "particle-field"],
    materialRoles: ["deep-space", "luminous-core", "holographic-glass", "architectural-metal", "signal-fx"],
    lightingIntent: "cinematic-key-fill-rim-with-readable-silhouette",
    atmosphereIntent: "deep-space-volume-with-layered-depth",
    cameraIntent: "hero-wide-portrait-focal",
    motionVocabulary: ["float", "orbit", "reveal", "glow"],
    performanceTier: "hero",
  },
  galaxy: {
    category: "galaxy", spatialRole: "navigation",
    geometryGrammar: ["core", "orbital-ring", "world-node", "beacon"],
    materialRoles: ["deep-space", "luminous-core", "holographic-glass", "signal-fx"],
    lightingIntent: "navigation-node-contrast",
    atmosphereIntent: "cosmic-depth-with-readable-node-hierarchy",
    cameraIntent: "navigator-orbit",
    motionVocabulary: ["orbit", "pulse", "drift"],
    performanceTier: "hero",
  },
  world: {
    category: "world", spatialRole: "world",
    geometryGrammar: ["island", "landmark", "bridge", "portal"],
    materialRoles: ["world-organic", "architectural-metal", "holographic-glass", "signal-fx"],
    lightingIntent: "landmark-separation",
    atmosphereIntent: "world-specific-horizon-depth",
    cameraIntent: "world-establishing",
    motionVocabulary: ["float", "drift", "reveal", "portal-enter"],
    performanceTier: "hero",
  },
  orbit: {
    category: "orbit", spatialRole: "navigation",
    geometryGrammar: ["ring", "node", "beacon"],
    materialRoles: ["luminous-core", "holographic-glass", "signal-fx"],
    lightingIntent: "path-and-node-legibility",
    atmosphereIntent: "low-density-spatial-haze",
    cameraIntent: "orbital-navigation",
    motionVocabulary: ["orbit", "pulse", "drift"],
    performanceTier: "standard",
  },
  capsule: {
    category: "capsule", spatialRole: "content",
    geometryGrammar: ["capsule", "ring", "signal"],
    materialRoles: ["luminous-core", "holographic-glass", "signal-fx"],
    lightingIntent: "content-focus",
    atmosphereIntent: "minimal-local-depth",
    cameraIntent: "content-close",
    motionVocabulary: ["float", "pulse", "reveal"],
    performanceTier: "compact",
  },
  district: {
    category: "district", spatialRole: "world",
    geometryGrammar: ["platform", "tower", "crystal", "arc", "zone-marker"],
    materialRoles: ["world-organic", "architectural-metal", "holographic-glass", "signal-fx"],
    lightingIntent: "district-landmark-layering",
    atmosphereIntent: "midground-depth",
    cameraIntent: "district-street-level",
    motionVocabulary: ["drift", "glow", "reveal"],
    performanceTier: "standard",
  },
  booth: {
    category: "booth", spatialRole: "social",
    geometryGrammar: ["platform", "shell", "sign", "portal"],
    materialRoles: ["architectural-metal", "holographic-glass", "luminous-core", "signal-fx"],
    lightingIntent: "tenant-presence-and-signage",
    atmosphereIntent: "local-booth-volume",
    cameraIntent: "booth-approach",
    motionVocabulary: ["pulse", "greet", "portal-enter"],
    performanceTier: "standard",
  },
  "content-feed": {
    category: "content-feed", spatialRole: "content",
    geometryGrammar: ["capsule", "media-panel", "relationship-orbit"],
    materialRoles: ["luminous-core", "holographic-glass", "signal-fx"],
    lightingIntent: "content-hierarchy",
    atmosphereIntent: "clean-content-depth",
    cameraIntent: "feed-focus",
    motionVocabulary: ["float", "reveal", "pulse"],
    performanceTier: "compact",
  },
  "agent-character": {
    category: "agent-character", spatialRole: "identity",
    geometryGrammar: ["character", "aura", "identity-beacon"],
    materialRoles: ["character-surface", "luminous-core", "signal-fx"],
    lightingIntent: "face-and-silhouette-readable",
    atmosphereIntent: "identity-aura",
    cameraIntent: "portrait-character",
    motionVocabulary: ["greet", "think", "listen", "speak"],
    performanceTier: "hero",
  },
  "live-stage": {
    category: "live-stage", spatialRole: "live",
    geometryGrammar: ["stage", "backdrop", "stage-ring", "audience-field"],
    materialRoles: ["architectural-metal", "holographic-glass", "signal-fx"],
    lightingIntent: "broadcast-key-fill-rim",
    atmosphereIntent: "live-stage-volume",
    cameraIntent: "broadcast-and-audience",
    motionVocabulary: ["live-entrance", "live-exit", "pulse", "glow"],
    performanceTier: "hero",
  },
  "human-live": {
    category: "human-live", spatialRole: "live",
    geometryGrammar: ["character", "uniform", "identity-marker"],
    materialRoles: ["character-surface", "signal-fx", "architectural-metal"],
    lightingIntent: "human-face-body-verification",
    atmosphereIntent: "stage-compatible-depth",
    cameraIntent: "human-verification-portrait",
    motionVocabulary: ["greet", "speak", "listen", "live-entrance"],
    performanceTier: "hero",
  },
  "sticker-social": {
    category: "sticker-social", spatialRole: "social",
    geometryGrammar: ["badge", "signal", "glyph"],
    materialRoles: ["luminous-core", "signal-fx", "holographic-glass"],
    lightingIntent: "high-contrast-social-signal",
    atmosphereIntent: "minimal",
    cameraIntent: "close-social",
    motionVocabulary: ["pulse", "glow", "reveal"],
    performanceTier: "compact",
  },
  animation: {
    category: "animation", spatialRole: "motion",
    geometryGrammar: ["character", "orbit", "motion-path", "signal"],
    materialRoles: ["luminous-core", "signal-fx", "character-surface"],
    lightingIntent: "motion-readability",
    atmosphereIntent: "stable-background-depth",
    cameraIntent: "animation-demo",
    motionVocabulary: ["assemble", "reveal", "orbit", "speak", "think"],
    performanceTier: "standard",
  },
  "navigation-fx": {
    category: "navigation-fx", spatialRole: "navigation",
    geometryGrammar: ["arc", "ring", "beacon", "particle-field"],
    materialRoles: ["signal-fx", "holographic-glass", "luminous-core"],
    lightingIntent: "navigation-state",
    atmosphereIntent: "path-emphasis",
    cameraIntent: "transition-safe",
    motionVocabulary: ["portal-enter", "portal-exit", "reveal", "glow"],
    performanceTier: "compact",
  },
};

const requiredDimensions: readonly GoldenThemeDimension[] = [
  "geometry", "material", "atmosphere", "architecture", "landmark",
  "district", "character", "portal", "lighting", "camera", "motion", "fx",
];

export function getGoldenThemeCategoryContract(category: AssetCategory): GoldenThemeCategoryContract {
  return categoryContracts[category];
}

export function createGoldenThemeRecipe(theme: Allpha3DThemeProfile, category: AssetCategory): GoldenThemeFactoryRecipe {
  const contract = categoryContracts[category];
  if (!contract) throw new Error("Unknown V2.13C category: " + category);

  return {
    schema: GOLDEN_THEME_FACTORY_SCHEMA,
    themeKey: theme.key,
    family: theme.family,
    category,
    goldenReference: GOLDEN_THEME_KEY,
    visualFingerprint: {
      geometry: theme.geometry,
      material: theme.material,
      atmosphere: theme.atmosphere,
      architecture: `${theme.family} architectural grammar: ${theme.geometry}`,
      landmark: theme.landmark,
      district: theme.district,
      character: theme.character,
      portal: theme.portal,
    },
    categoryContract: contract,
    semanticAccent: theme.accent,
    runtimeLanguage: {
      lighting: `${theme.family}:${contract.lightingIntent}`,
      camera: `${theme.family}:${contract.cameraIntent}`,
      motion: contract.motionVocabulary,
      fx: `${theme.portal}:${contract.category}-fx`,
    },
    requiredDimensions,
    presentationOnly: true,
    canonicalRenderer: "AllphaWorldRenderer",
    runtimeAuthority: "outside-blender",
  };
}

export function createGoldenThemeFactoryMatrix(themeKey?: string): GoldenThemeFactoryRecipe[] {
  const themes = themeKey
    ? ALLPHA_3D_THEME_PROFILES.filter((theme) => theme.key === themeKey)
    : ALLPHA_3D_THEME_PROFILES;

  if (themeKey && themes.length !== 1) {
    throw new Error("Unknown V2.13C theme: " + themeKey);
  }

  return themes.flatMap((theme) =>
    ASSET_CATEGORIES.map((category) => createGoldenThemeRecipe(theme, category)),
  );
}

export function validateGoldenThemeFactoryMatrix(matrix: readonly GoldenThemeFactoryRecipe[]) {
  const errors: string[] = [];
  const themeKeys = new Set(matrix.map((item) => item.themeKey));
  const categoryKeys = new Set(matrix.map((item) => item.category));

  if (matrix.length !== GOLDEN_ASSET_MATRIX_SIZE) errors.push("MATRIX_SIZE_EXPECTED_350");
  if (themeKeys.size !== GOLDEN_THEME_COUNT) errors.push("THEME_COUNT_EXPECTED_25");
  if (categoryKeys.size !== GOLDEN_CATEGORY_COUNT) errors.push("CATEGORY_COUNT_EXPECTED_14");

  for (const item of matrix) {
    if (item.goldenReference !== GOLDEN_THEME_KEY) errors.push("GOLDEN_REFERENCE_INVALID:" + item.themeKey);
    if (item.presentationOnly !== true) errors.push("PRESENTATION_BOUNDARY_INVALID:" + item.themeKey + ":" + item.category);
    if (item.canonicalRenderer !== "AllphaWorldRenderer") errors.push("RENDERER_INVALID:" + item.themeKey + ":" + item.category);
    if (item.requiredDimensions.length !== 12) errors.push("DIMENSION_CONTRACT_INVALID:" + item.themeKey + ":" + item.category);
    if (item.visualFingerprint.geometry === item.visualFingerprint.material) errors.push("FINGERPRINT_COLLISION:" + item.themeKey);
  }

  return errors.length ? { ok: false as const, errors } : { ok: true as const };
}

export const ALLPHA_GOLDEN_THEME_FACTORY = {
  schema: GOLDEN_THEME_FACTORY_SCHEMA,
  goldenTheme: GOLDEN_THEME_KEY,
  themes: GOLDEN_THEME_COUNT,
  categories: GOLDEN_CATEGORY_COUNT,
  assets: GOLDEN_ASSET_MATRIX_SIZE,
  masterLanguage: ALLPHA_3D_MASTER_LANGUAGE,
  create: createGoldenThemeRecipe,
  matrix: createGoldenThemeFactoryMatrix,
  validate: validateGoldenThemeFactoryMatrix,
} as const;
