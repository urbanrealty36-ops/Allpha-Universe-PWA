"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

type ManifestAsset = { storage_path?: string | null; signed_url?: string | null; metadata?: Record<string, unknown> | null; };

function ProductionAssetModel({ url, category, lowPower, reducedMotion }: { url: string; category: AssetCategory; lowPower: boolean; reducedMotion: boolean; }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const scale = category === "universe" ? 1.08 : category === "galaxy" ? 1.02 : category === "world" ? 1 : 0.94;
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    scene.rotation.y = Math.sin(t * 0.16) * (lowPower ? 0.018 : 0.035);
    scene.position.y = Math.sin(t * 0.34) * (lowPower ? 0.006 : 0.014);
  });
  scene.traverse((node: any) => { if (node.isMesh) { node.castShadow = !lowPower; node.receiveShadow = !lowPower; } });
  return <primitive object={scene} scale={scale} />;
}

export function ThemeV2ProductionAssetScene({ themeKey, category, lowPower = false, reducedMotion = false, fallback = null }: {
  themeKey?: string | null; category: AssetCategory; lowPower?: boolean; reducedMotion?: boolean; fallback?: ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!themeKey) return;
    const controller = new AbortController();
    const endpoint = API_BASE + "/api/v1/themes/world-runtime/public/themes/" + encodeURIComponent(themeKey) + "/asset-manifest";
    fetch(endpoint, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (cancelled) return;
        const assets: ManifestAsset[] = payload?.data?.binary_3d_assets ?? [];
        const candidate = assets.find((asset) => {
          const path = String(asset.storage_path ?? "").toLowerCase();
          const expectedPath = "theme-v2-real-3d/v2.13/" + themeKey + "/" + category + ".glb";
          const metadataCategory = String(asset.metadata?.category ?? "").toLowerCase();
          const categoryMatches = !metadataCategory || metadataCategory === category;
          return Boolean(asset.signed_url) && path === expectedPath && categoryMatches && asset.metadata?.phase === "V2.13D.4";
        });
        setUrl(candidate?.signed_url ?? null);
      })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; controller.abort(); };
  }, [themeKey, category]);
  return url
    ? <ProductionAssetModel url={url} category={category} lowPower={lowPower} reducedMotion={reducedMotion} />
    : <>{fallback}</>;
}
