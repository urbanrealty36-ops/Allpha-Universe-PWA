"use client";

import { ThemeV2ProductionAssetScene, type ProductionAssetRuntimeMetrics, type ProductionAssetRuntimeState } from "./theme-v2-production-asset-scene";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";

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
  directAssetUrl?: string | null;
  lowPower?: boolean;
  reducedMotion?: boolean;
  onRuntimeState?: (state: ProductionAssetRuntimeState) => void;
  onRuntimeMetrics?: (metrics: ProductionAssetRuntimeMetrics) => void;
  allowProceduralFallback?: boolean;
}) {
  const category = resolveThemeV2Category(props.layer ?? "world", props.category);

  return (
    <group
      userData={{
        allpha3d: {
          activationSchema: "allpha-3d-production-activation/1.0",
          assetKey: props.themeKey ? `${props.themeKey}/${category}` : null,
          storageBucket: "allpha-world-assets",
          storagePath: null,
          rendererSource: "AllphaWorldRenderer",
          presentationOnly: true,
          legacy: false,
          cutover: "authorized-public-manifest-only",
        },
      }}
    >
      <ThemeV2ProductionAssetScene
        themeKey={props.themeKey}
        category={category}
        directAssetUrl={props.directAssetUrl}
        lowPower={props.lowPower}
        reducedMotion={props.reducedMotion}
        onRuntimeState={props.onRuntimeState}
        onRuntimeMetrics={props.onRuntimeMetrics}
        fallback={null}
      />
    </group>
  );
}

export const THEME_V2_MATRIX_SUMMARY = {
  themes: 25,
  categories: 14,
  templates: 350,
  schema: "allpha-theme-manifest-runtime/1.0",
  activationSchema: "allpha-3d-production-activation/1.0",
  canonicalRenderer: "AllphaWorldRenderer",
  cutover: "authorized-manifest-only",
  legacyPlaceholderPack: "retired-from-renderer",
} as const;
