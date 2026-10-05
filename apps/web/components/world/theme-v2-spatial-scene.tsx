"use client";

import { ThemeV2Real3DAsset } from "./theme-v2-real-3d-asset";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";

export type ThemeV2SpatialLayer = "universe" | "galaxy" | "orbit" | "world" | "district" | "booth" | "content" | "live";
export type ThemeV2Category = AssetCategory;

export function resolveThemeV2Category(layer: ThemeV2SpatialLayer, explicit?: AssetCategory): AssetCategory {
  if (explicit) return explicit;
  return ({
    universe: "universe",
    galaxy: "galaxy",
    orbit: "orbit",
    world: "world",
    district: "district",
    booth: "booth",
    content: "content-feed",
    live: "live-stage",
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
  return <ThemeV2Real3DAsset {...props} />;
}

export const THEME_V2_MATRIX_SUMMARY = {
  themes: 25,
  categories: 14,
  templates: 350,
  schema: "theme-v2-real-3d/1.0",
  legacyPlaceholderPack: "retired-from-renderer",
} as const;
