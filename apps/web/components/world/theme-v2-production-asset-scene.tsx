"use client";

import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

type ManifestAsset = {
  storage_path?: string | null;
  signed_url?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
  moderation_status?: string | null;
  safety_status?: string | null;
  performance_status?: string | null;
};

function ProductionAssetModel({ url, category, lowPower, reducedMotion }: {
  url: string;
  category: AssetCategory;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const scale = category === "universe" ? 1.08 : category === "galaxy" ? 1.02 : category === "world" ? 1 : 0.94;

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    scene.rotation.y = Math.sin(t * 0.16) * (lowPower ? 0.018 : 0.035);
    scene.position.y = Math.sin(t * 0.34) * (lowPower ? 0.006 : 0.014);
  });

  scene.traverse((node: any) => {
    if (node.isMesh) {
      node.castShadow = !lowPower;
      node.receiveShadow = !lowPower;
    }
  });

  return <primitive object={scene} scale={scale} />;
}

export function ThemeV2ProductionAssetScene({
  themeKey,
  category,
  lowPower = false,
  reducedMotion = false,
}: {
  themeKey?: string | null;
  category: AssetCategory;
  lowPower?: boolean;
  reducedMotion?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!themeKey) {
      setUrl(null);
      return;
    }

    const controller = new AbortController();
    fetch(
      `${API_BASE}/api/v1/themes/world-runtime/public/themes/${encodeURIComponent(themeKey)}/asset-manifest`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const assets: ManifestAsset[] = payload?.data?.binary_3d_assets ?? payload?.data?.assets ?? [];
        const candidate = assets.find((asset) => {
          const path = String(asset.storage_path ?? "").toLowerCase();
          const metadataCategory = String(asset.metadata?.category ?? "").toLowerCase();
          return Boolean(asset.signed_url) &&
            (metadataCategory === category || path.endsWith(`/${category}.glb`));
        });
        setUrl(candidate?.signed_url ?? null);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [themeKey, category]);

  if (!url) return null;
  return <ProductionAssetModel url={url} category={category} lowPower={lowPower} reducedMotion={reducedMotion} />;
}
