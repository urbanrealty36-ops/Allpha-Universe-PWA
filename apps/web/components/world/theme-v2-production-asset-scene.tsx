"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

type ManifestAsset = { storage_path?: string | null; signed_url?: string | null; metadata?: Record<string, unknown> | null; };

export type ProductionAssetRuntimeState = "idle" | "loading-manifest" | "manifest-resolved" | "loading-gltf" | "loaded" | "visible" | "error";

export type ProductionAssetRuntimeMetrics = {
  meshCount: number;
  objectCount: number;
  bounds: { size: [number, number, number]; center: [number, number, number] };
};


function setRuntimeMarker(state: ProductionAssetRuntimeState, metrics?: ProductionAssetRuntimeMetrics) {
  if (typeof document === "undefined") return;
  const marker = document.querySelector<HTMLElement>("[data-allpha-3d-runtime]");
  if (!marker) return;
  marker.dataset.allpha3dAssetState = state;
  if (metrics) {
    marker.dataset.allpha3dMeshCount = String(metrics.meshCount);
    marker.dataset.allpha3dObjectCount = String(metrics.objectCount);
    marker.dataset.allpha3dBounds = metrics.bounds.size.map((value) => value.toFixed(3)).join(",");
  }
}

function ProductionAssetModel({
  url,
  category,
  lowPower,
  reducedMotion,
  onLoaded,
}: {
  url: string;
  category: AssetCategory;
  lowPower: boolean;
  reducedMotion: boolean;
  onLoaded?: (metrics: ProductionAssetRuntimeMetrics) => void;
}) {
  const gltf = useGLTF(url);
  const camera = useThree((state) => state.camera);
  const visibleRef = useMemo(() => ({ value: false }), []);
  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    let meshCount = 0;
    let objectCount = 0;
    scene.traverse((node: any) => {
      objectCount += 1;
      if (node.isMesh) {
        meshCount += 1;
        node.castShadow = !lowPower;
        node.receiveShadow = !lowPower;
      }
    });

    const maxDimension = Math.max(size.x, size.y, size.z);
    const fitScale = Number.isFinite(maxDimension) && maxDimension > 0
      ? Math.min(4, Math.max(0.08, 7 / maxDimension))
      : 1;

    // Production GLBs may use authoring-space origins/scales that are not
    // guaranteed to match the runtime camera. Normalize only the presentation
    // transform: preserve geometry/materials while centering the asset and
    // placing its lowest point on the World floor.
    scene.scale.setScalar(fitScale);
    const basePosition: [number, number, number] = [-center.x * fitScale, -bounds.min.y * fitScale, -center.z * fitScale];
    scene.position.set(...basePosition);

    return {
      scene,
      basePosition,
      metrics: {
        meshCount,
        objectCount,
        bounds: {
          size: [size.x, size.y, size.z] as [number, number, number],
          center: [center.x, center.y, center.z] as [number, number, number],
        },
      },
    };
  }, [gltf.scene, lowPower]);

  useEffect(() => {
    setRuntimeMarker("loaded", prepared.metrics);
    onLoaded?.(prepared.metrics);
  }, [onLoaded, prepared.metrics]);

  useFrame(({ clock }) => {
    const box = new THREE.Box3().setFromObject(prepared.scene);
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z), new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z), new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z), new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z), new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];
    const visibleInCamera = corners.some((corner) => {
      const projected = corner.clone().project(camera);
      return projected.z >= -1 && projected.z <= 1 && projected.x >= -1.05 && projected.x <= 1.05 && projected.y >= -1.05 && projected.y <= 1.05;
    });
    if (prepared.metrics.meshCount > 0 && visibleInCamera && !visibleRef.value) {
      visibleRef.value = true;
      setRuntimeMarker("visible", prepared.metrics);
    }
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    prepared.scene.rotation.y = Math.sin(t * 0.16) * (lowPower ? 0.018 : 0.035);
    prepared.scene.position.y = prepared.basePosition[1] + Math.sin(t * 0.34) * (lowPower ? 0.006 : 0.014);
  });

  const scale = category === "universe" ? 1.08 : category === "galaxy" ? 1.02 : category === "world" ? 1 : 0.94;
  return <primitive object={prepared.scene} scale={scale} />;
}

export function ThemeV2ProductionAssetScene({ themeKey, category, lowPower = false, reducedMotion = false, fallback = null, onRuntimeState, onRuntimeMetrics }: {
  themeKey?: string | null;
  category: AssetCategory;
  lowPower?: boolean;
  reducedMotion?: boolean;
  fallback?: ReactNode;
  onRuntimeState?: (state: ProductionAssetRuntimeState) => void;
  onRuntimeMetrics?: (metrics: ProductionAssetRuntimeMetrics) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!themeKey) {
      onRuntimeState?.("idle");
      setRuntimeMarker("idle");
      return;
    }
    onRuntimeState?.("loading-manifest");
    setRuntimeMarker("loading-manifest");
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
        if (!candidate?.signed_url) {
          onRuntimeState?.("error");
          setRuntimeMarker("error");
          setUrl(null);
          return;
        }
        onRuntimeState?.("manifest-resolved");
        setRuntimeMarker("manifest-resolved");
        setUrl(candidate.signed_url);
      })
      .catch(() => {
        if (!cancelled) {
          onRuntimeState?.("error");
          setRuntimeMarker("error");
          setUrl(null);
        }
      });
    return () => { cancelled = true; controller.abort(); };
  }, [themeKey, category, onRuntimeState]);

  useEffect(() => {
    if (url) {
      onRuntimeState?.("loading-gltf");
      setRuntimeMarker("loading-gltf");
    }
  }, [url, onRuntimeState]);

  return url
    ? <ProductionAssetModel url={url} category={category} lowPower={lowPower} reducedMotion={reducedMotion} onLoaded={(metrics) => { onRuntimeMetrics?.(metrics); onRuntimeState?.("loaded"); }} />
    : <>{fallback}</>;
}
