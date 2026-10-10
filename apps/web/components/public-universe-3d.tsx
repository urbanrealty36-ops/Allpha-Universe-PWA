"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ThemeManifestAssetScene, type ThemeAssetRuntimeState } from "./world/theme-manifest-asset-scene";
import { Cinematic3DScene, configureCinematicRenderer } from "./world/cinematic-3d-scene";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

type PublicTheme = { slug?: string | null; catalog_key?: string | null; is_public?: boolean; status?: string | null };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

function PublicScene({ variant, onAssetState }: { variant: PublicUniverse3DVariant; onAssetState: (state: ThemeAssetRuntimeState) => void }) {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = variant === "identity" ? "world" : "universe";
  const [themeKey, setThemeKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetch(API_BASE + "/api/v1/themes/world-runtime/catalog", {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (cancelled) return;
        const themes: PublicTheme[] = Array.isArray(payload?.data) ? payload.data : [];
        // Public splash is explicitly bound to the new V3 asset pack. Its draft/review
        // lifecycle is not treated as safety approval; publication governance stays separate.
        if (variant === "splash") {
          const v3 = themes.find((theme) => String(theme.slug ?? theme.catalog_key ?? "").trim() === "allpha-universe-v3");
          setThemeKey(v3 ? "allpha-universe-v3" : null);
          return;
        }
        const eligible = themes.filter((theme) => {
          const slug = String(theme.slug ?? theme.catalog_key ?? "").trim();
          const status = String(theme.status ?? "").toLowerCase();
          return Boolean(slug) && (!status || ["active", "published", "live"].includes(status));
        });
        const preferred = eligible.find((theme) =>
          /crystal|universe|galaxy/i.test(String(theme.slug ?? theme.catalog_key ?? "")),
        ) ?? eligible[0];
        setThemeKey(preferred ? String(preferred.slug ?? preferred.catalog_key) : null);
      })
      .catch(() => {
        if (!cancelled) setThemeKey(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [variant]);

  return (
    <Cinematic3DScene layer={layer} lowPower={false} reducedMotion={reducedMotion}>
      <ThemeManifestAssetScene
        themeKey={themeKey}
        category={variant === "splash" ? "agent-character" : layer === "world" ? "world" : "universe"}
        lowPower={false}
        reducedMotion={reducedMotion}
        onRuntimeState={onAssetState}
        fallback={null}
      />
    </Cinematic3DScene>
  );
}

export default function PublicUniverse3D({ variant }: { variant: PublicUniverse3DVariant }) {
  const [assetState, setAssetState] = useState<ThemeAssetRuntimeState>("idle");
  const characterMode = variant === "splash";
  const visibleState = assetState === "loaded" || assetState === "visible";
  return (
    <div className={`allpha-public-3d allpha-public-3d-${variant}`} aria-label={characterMode ? "Allpha AI character scene" : "Allpha 3D universe scene"} data-public-3d-state={assetState}>
      <Canvas
        dpr={[1, 1.5]}
        shadows
        camera={{ position: characterMode ? [0, 2.6, 8.8] : variant === "identity" ? [0, 5.6, 13.8] : [0, 6.2, 15.2], fov: characterMode ? 35 : variant === "universe" ? 43 : 42 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => configureCinematicRenderer(gl, false)}
      >
        <PublicScene variant={variant} onAssetState={setAssetState} />
      </Canvas>
      {characterMode && !visibleState && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[18%] z-[2] flex justify-center px-4">
          <div className="rounded-full border border-cyan-200/20 bg-slate-950/75 px-3 py-1.5 text-[10px] tracking-wide text-cyan-100/80 backdrop-blur-md" role="status" aria-live="polite">
            {assetState === "error"
              ? "AI Character preview unavailable — Universe remains accessible"
              : assetState === "loading-gltf" || assetState === "manifest-resolved"
                ? "Preparing AI Character…"
                : "Connecting AI Character…"}
          </div>
        </div>
      )}
    </div>
  );
}
