"use client";

import { ThemeV2ProductionAssetScene } from "./theme-v2-production-asset-scene";

type Props = {
  themeKey?: string | null;
  lowPower?: boolean;
  reducedMotion?: boolean;
};

/**
 * Production hero is asset-only: it never fabricates a character or a theme
 * from primitive geometry. The authorized Theme asset manifest supplies the
 * scene; an absent or unpublished asset intentionally renders no substitute.
 */
export function CinematicProductionHero({
  themeKey,
  lowPower = false,
  reducedMotion = false,
}: Props) {
  return (
    <group>
      <ThemeV2ProductionAssetScene
        themeKey={themeKey}
        category="universe"
        lowPower={lowPower}
        reducedMotion={reducedMotion}
        fallback={null}
      />
    </group>
  );
}
