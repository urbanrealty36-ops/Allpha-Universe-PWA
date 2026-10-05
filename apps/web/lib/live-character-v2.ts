import {
  ALLPHA_3D_THEME_PROFILES,
  type Allpha3DThemeProfile,
} from "../../../../packages/design-tokens/3d-visual-language";
import {
  DEFAULT_CHARACTER_PRIORITY,
  normalizeAnimationSignal,
  type CharacterAnimationSignal,
} from "./live-character-animation";

export const CHARACTER_V2_SCHEMA = "allpha-live-character-v2/1.0" as const;

export type CharacterV2Profile = {
  schema: typeof CHARACTER_V2_SCHEMA;
  themeKey: string;
  characterKey: string;
  archetype: string;
  silhouette: {
    height: number;
    shoulderWidth: number;
    headScale: number;
    legLength: number;
  };
  wardrobe: {
    primary: string;
    secondary: string;
    accent: string;
    material: "couture" | "techwear" | "armor" | "organic" | "ceremonial";
  };
  face: {
    eyes: string;
    hair: string;
    expressionCapable: boolean;
    gazeCapable: boolean;
    visemeCapable: boolean;
  };
  animation: {
    states: CharacterAnimationSignal["state"][];
    intents: string[];
    priority: Record<CharacterAnimationSignal["state"], number>;
    reducedMotion: "static-pose-preserve-state";
  };
  performance: {
    mobileParts: number;
    lowPower: boolean;
    shadows: boolean;
    morphTargetsOptional: boolean;
  };
  presentationOnly: true;
};

const archetypes: Record<string, { material: CharacterV2Profile["wardrobe"]["material"]; silhouette: CharacterV2Profile["silhouette"] }> = {
  "ai-couture": { material: "couture", silhouette: { height: 3.15, shoulderWidth: 0.98, headScale: 0.62, legLength: 1.05 } },
  "samurai-tech-accents": { material: "armor", silhouette: { height: 3.25, shoulderWidth: 1.08, headScale: 0.6, legLength: 1.08 } },
  "dragon-guardian": { material: "armor", silhouette: { height: 3.3, shoulderWidth: 1.12, headScale: 0.63, legLength: 1.02 } },
  "forest-explorer": { material: "organic", silhouette: { height: 3.05, shoulderWidth: 0.94, headScale: 0.64, legLength: 1.02 } },
  "garden-architect": { material: "organic", silhouette: { height: 3.05, shoulderWidth: 0.96, headScale: 0.64, legLength: 1.04 } },
  "future-nusantara-techwear": { material: "techwear", silhouette: { height: 3.2, shoulderWidth: 1.0, headScale: 0.62, legLength: 1.08 } },
  "neo-streetwear": { material: "techwear", silhouette: { height: 3.18, shoulderWidth: 0.98, headScale: 0.62, legLength: 1.08 } },
  "solar-pharaoh-tech": { material: "ceremonial", silhouette: { height: 3.3, shoulderWidth: 1.06, headScale: 0.64, legLength: 1.03 } },
};

const fallbackArchetype = { material: "techwear" as const, silhouette: { height: 3.15, shoulderWidth: 1, headScale: 0.62, legLength: 1.05 } };

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function resolveCharacterTheme(themeKey?: string | null, architecture?: string | null): Allpha3DThemeProfile {
  const key = slug(themeKey || architecture || "crystal-ai-city");
  return (
    ALLPHA_3D_THEME_PROFILES.find((profile) => profile.key === key) ||
    ALLPHA_3D_THEME_PROFILES.find((profile) => profile.key === slug(architecture || "")) ||
    ALLPHA_3D_THEME_PROFILES.find((profile) => profile.key === "crystal-ai-city")!
  );
}

export function createCharacterV2Profile(themeKey?: string | null, characterKey?: string | null, architecture?: string | null): CharacterV2Profile {
  const theme = resolveCharacterTheme(themeKey, architecture);
  const archetype = theme.character || "ai-couture";
  const config = archetypes[archetype] || fallbackArchetype;
  const [primary, secondary, accent] = theme.accent;

  return {
    schema: CHARACTER_V2_SCHEMA,
    themeKey: theme.key,
    characterKey: characterKey || archetype,
    archetype,
    silhouette: config.silhouette,
    wardrobe: { primary, secondary, accent, material: config.material },
    face: {
      eyes: secondary,
      hair: primary,
      expressionCapable: true,
      gazeCapable: true,
      visemeCapable: true,
    },
    animation: {
      states: Object.keys(DEFAULT_CHARACTER_PRIORITY) as CharacterAnimationSignal["state"][],
      intents: ["greet", "acknowledge", "explain", "emphasize", "ask", "answer", "think", "agree", "disagree", "apologize", "celebrate", "caution", "wait", "listen", "invite"],
      priority: DEFAULT_CHARACTER_PRIORITY,
      reducedMotion: "static-pose-preserve-state",
    },
    performance: {
      mobileParts: 34,
      lowPower: true,
      shadows: true,
      morphTargetsOptional: true,
    },
    presentationOnly: true,
  };
}

export function normalizeCharacterV2Signal(signal?: Partial<CharacterAnimationSignal>): CharacterAnimationSignal {
  return normalizeAnimationSignal(signal || { state: "idle", level: 0, speaking: false, userSpeaking: false });
}

export function validateCharacterV2Profile(profile: CharacterV2Profile): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (profile.schema !== CHARACTER_V2_SCHEMA) errors.push("CHARACTER_V2_SCHEMA_UNSUPPORTED");
  if (profile.presentationOnly !== true) errors.push("CHARACTER_V2_AUTHORITY_BOUNDARY_INVALID");
  if (profile.silhouette.height < 2.4 || profile.silhouette.height > 4) errors.push("CHARACTER_V2_HEIGHT_OUT_OF_RANGE");
  if (profile.performance.mobileParts > 40) errors.push("CHARACTER_V2_MOBILE_PART_BUDGET_EXCEEDED");
  if (!profile.face.expressionCapable || !profile.face.gazeCapable) errors.push("CHARACTER_V2_FACE_CAPABILITY_MISSING");
  if (!profile.animation.states.includes("speaking") || !profile.animation.states.includes("listening")) errors.push("CHARACTER_V2_LIVE_STATES_MISSING");
  return errors.length ? { ok: false, errors } : { ok: true };
}
