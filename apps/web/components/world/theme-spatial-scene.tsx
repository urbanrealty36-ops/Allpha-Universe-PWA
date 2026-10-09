"use client";

import { ThemeManifestAssetScene, type ThemeAssetRuntimeMetrics, type ThemeAssetRuntimeState } from "./theme-manifest-asset-scene";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";

export type ThemeSpatialLayer = "universe" | "galaxy" | "orbit" | "world" | "district" | "booth" | "content" | "live";
export type ThemeAssetCategory = AssetCategory;

export function resolveThemeAssetCategory(layer: ThemeSpatialLayer, explicit?: AssetCategory): AssetCategory {
  if (explicit) return explicit;
  return ({
    universe: "universe", galaxy: "galaxy", orbit: "orbit", world: "world",
    district: "district", booth: "booth", content: "content-feed", live: "live-stage",
  } as const)[layer];
}

export function ThemeSpatialScene(props: {
  themeKey?: string | null;
  architecture?: string | null;
  layer?: ThemeSpatialLayer;
  category?: AssetCategory;
  directAssetUrl?: string | null;
  lowPower?: boolean;
  reducedMotion?: boolean;
  onRuntimeState?: (state: ThemeAssetRuntimeState) => void;
  onRuntimeMetrics?: (metrics: ThemeAssetRuntimeMetrics) => void;
  allowProceduralFallback?: boolean;
}) {
  const category = resolveThemeAssetCategory(props.layer ?? "world", props.category);

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
      <ThemeManifestAssetScene
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

