"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ThemeManifestAssetScene, type ThemeAssetRuntimeState } from "./world/theme-manifest-asset-scene";
import { Cinematic3DScene, configureCinematicRenderer } from "./world/cinematic-3d-scene";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

type PublicTheme = { slug?: string | null; catalog_key?: string | null; is_public?: boolean; status?: string | null; categories?: string[]; assets?: Array<{ category?: string }>; };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

function PublicScene({ variant, onAssetState }: { variant: PublicUniverse3DVariant; onAssetState: (state: ThemeAssetRuntimeState) => void }) {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = variant === "universe" ? "universe" : "world";
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
        // Splash and Human Identity resolve the canonical AI Character category.
        // The API publication gate, not this client, decides whether signed GLBs are eligible.
        if (variant === "splash" || variant === "identity") {
          const v3 = themes.find((theme) => String(theme.slug ?? theme.catalog_key ?? "").trim() === "allpha-universe-v3");
          setThemeKey(v3 ? "allpha-universe-v3" : null);
          return;
        }
        const eligible = themes.filter((theme) => {
          const slug = String(theme.slug ?? theme.catalog_key ?? "").trim();
          const status = String(theme.status ?? "").toLowerCase();
          // V3 remains draft/review; catalog exposure is not a safety certification.
          return Boolean(slug) && (!status || ["active", "published", "live", "draft", "review"].includes(status));
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
        category={variant === "splash" || variant === "identity" ? "agent-character" : "universe"}
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
  const handleAssetState = useCallback((state: ThemeAssetRuntimeState) => setAssetState(state), []);
  const characterMode = variant === "splash" || variant === "identity";
  const visibleState = assetState === "loaded" || assetState === "visible";
  return (
    <div className={`allpha-public-3d allpha-public-3d-${variant}`} aria-label={characterMode ? "Allpha AI character scene" : "Allpha 3D universe scene"} data-public-3d-state={assetState}>
      <Canvas
        dpr={[1, 1.5]}
        shadows
        camera={{ position: characterMode ? [0, 2.6, 8.8] : [0, 6.2, 15.2], fov: characterMode ? 35 : 43 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => configureCinematicRenderer(gl, false)}
      >
        <PublicScene variant={variant} onAssetState={handleAssetState} />
      </Canvas>
      {characterMode && assetState === "error" && (
        <div className="pointer-events-none absolute inset-x-0 top-[24%] z-[1] flex justify-center" aria-label="AI Character fallback preview">
          <div className="relative h-56 w-44 opacity-70" aria-hidden="true">
            <div className="absolute left-1/2 top-2 h-24 w-20 -translate-x-1/2 rounded-[48%_48%_42%_42%] border border-cyan-100/40 bg-gradient-to-br from-cyan-200/25 via-indigo-400/20 to-violet-500/30 shadow-[0_0_70px_rgba(99,102,241,.38)]" />
            <div className="absolute left-1/2 top-[5.7rem] h-28 w-36 -translate-x-1/2 rounded-t-[55%] rounded-b-3xl border border-violet-200/25 bg-gradient-to-b from-indigo-300/20 via-slate-900/75 to-slate-950/90" />
            <div className="absolute inset-x-3 top-0 h-40 rounded-full border border-cyan-200/15 blur-sm" />
          </div>
        </div>
      )}
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
