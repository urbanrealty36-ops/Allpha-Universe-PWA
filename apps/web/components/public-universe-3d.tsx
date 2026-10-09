"use client";

import { Canvas } from "@react-three/fiber";
import { ThemeManifestAssetScene } from "./world/theme-manifest-asset-scene";
import { Cinematic3DScene, configureCinematicRenderer } from "./world/cinematic-3d-scene";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

function PublicScene({ variant }: { variant: PublicUniverse3DVariant }) {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = variant === "identity" ? "world" : "universe";

  return (
    <Cinematic3DScene layer={layer} lowPower={false} reducedMotion={reducedMotion}>
      {/* No legacy theme or primitive character is used as a substitute for a published asset. */}
      <ThemeManifestAssetScene
        category={layer === "world" ? "world" : "universe"}
        lowPower={false}
        reducedMotion={reducedMotion}
        fallback={null}
      />
    </Cinematic3DScene>
  );
}

export default function PublicUniverse3D({ variant }: { variant: PublicUniverse3DVariant }) {
  return (
    <div className={`allpha-public-3d allpha-public-3d-${variant}`} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        shadows
        camera={{ position: variant === "identity" ? [0, 5.6, 13.8] : [0, 6.2, 15.2], fov: variant === "universe" ? 43 : 42 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => configureCinematicRenderer(gl, false)}
      >
        <PublicScene variant={variant} />
      </Canvas>
    </div>
  );
}
