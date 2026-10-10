"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ThemeManifestAssetScene } from "./world/theme-manifest-asset-scene";
import { Cinematic3DScene, configureCinematicRenderer } from "./world/cinematic-3d-scene";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

type PublicTheme = { slug?: string | null; catalog_key?: string | null; is_public?: boolean; status?: string | null };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

function PublicScene({ variant }: { variant: PublicUniverse3DVariant }) {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = variant === "identity" ? "world" : "universe";
  const assetCategory = variant === "splash" ? "agent-character" : layer;
  const [themeKey, setThemeKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    // Public 3D must resolve a real theme from the canonical API catalog.
    // The manifest endpoint remains the authority for which signed GLBs may render.
    fetch(API_BASE + "/api/v1/themes/world-runtime/catalog", {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (cancelled) return;
        const themes: PublicTheme[] = Array.isArray(payload?.data) ? payload.data : [];
        const v3 = themes.find((theme) => String(theme.slug ?? theme.catalog_key ?? "").trim() === "allpha-universe-v3");
        const eligible = themes.filter((theme) => {
          const slug = String(theme.slug ?? theme.catalog_key ?? "").trim();
          const status = String(theme.status ?? "").toLowerCase();
          return Boolean(slug) && (!status || ["active", "published", "live"].includes(status));
        });
        const preferred = v3 ?? eligible.find((theme) =>
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
  }, []);

  return (
    <Cinematic3DScene layer={layer} lowPower={false} reducedMotion={reducedMotion}>
      {/* Only server-manifest-authorized signed assets may enter the canonical renderer. */}
      <ThemeManifestAssetScene
        themeKey={themeKey}
        category={assetCategory}
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
