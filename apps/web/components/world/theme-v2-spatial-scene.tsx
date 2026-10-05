"use client";

import { ThemeV2Real3DAsset } from "./theme-v2-real-3d-asset";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";
import { resolveProduction3DAsset } from "../../lib/world-engine/production-3d-runtime-resolver";

export type ThemeV2SpatialLayer = "universe" | "galaxy" | "orbit" | "world" | "district" | "booth" | "content" | "live";
export type ThemeV2Category = AssetCategory;

export function resolveThemeV2Category(layer: ThemeV2SpatialLayer, explicit?: AssetCategory): AssetCategory {
  if (explicit) return explicit;
  return ({
    universe: "universe", galaxy: "galaxy", orbit: "orbit", world: "world",
    district: "district", booth: "booth", content: "content-feed", live: "live-stage",
  } as const)[layer];
}

export function resolveThemeV2Profile(themeKey?: string | null, architecture?: string | null) {
  return { themeKey, architecture };
}

export function ThemeV2SpatialScene(props: {
  themeKey?: string | null;
  architecture?: string | null;
  layer?: ThemeV2SpatialLayer;
  category?: AssetCategory;
  lowPower?: boolean;
  reducedMotion?: boolean;
}) {
  const category = resolveThemeV2Category(props.layer ?? "world", props.category);
  const production = resolveProduction3DAsset(props.themeKey, category);

  return (
    <group
      userData={{
        allpha3d: {
          activationSchema: "allpha-3d-production-activation/1.0",
          assetKey: production?.descriptor.assetKey ?? null,
          storagePath: production?.descriptor.storagePath ?? null,
          rendererSource: production?.source ?? "real-3d-runtime",
          presentationOnly: true,
          legacy: false,
        },
      }}
    >
      <ThemeV2Real3DAsset {...props} />
    </group>
  );
}

export const THEME_V2_MATRIX_SUMMARY = {
  themes: 25,
  categories: 14,
  templates: 350,
  schema: "theme-v2-real-3d/1.0",
  activationSchema: "allpha-3d-production-activation/1.0",
  canonicalRenderer: "AllphaWorldRenderer",
  legacyPlaceholderPack: "retired-from-renderer",
} as const;
