"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { AssetCategory } from "../../lib/world-engine/asset-factory";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://allpha-api-production.up.railway.app").replace(/\/$/, "");

type ManifestAsset = { storage_path?: string | null; signed_url?: string | null; metadata?: Record<string, unknown> | null; };

export type ThemeAssetRuntimeState = "idle" | "loading-manifest" | "manifest-resolved" | "loading-gltf" | "loaded" | "visible" | "error";

export type ThemeAssetRuntimeMetrics = {
  meshCount: number;
  objectCount: number;
  materialCount: number;
  bounds: { size: [number, number, number]; center: [number, number, number] };
  camera: { distance: number; fov: number; aspect: number; target: [number, number, number] };
  visual: {
    brandProfile: "ALLPHA_UNIVERSE_V2";
    toneMapping: "ACESFilmicToneMapping";
    outputColorSpace: "SRGBColorSpace";
    exposure: number;
  };
};


function ProductionAssetModel({
  url,
  category,
  lowPower,
  reducedMotion,
  onLoaded,
  onRuntimeState,
}: {
  url: string;
  category: AssetCategory;
  lowPower: boolean;
  reducedMotion: boolean;
  onLoaded?: (metrics: ThemeAssetRuntimeMetrics) => void;
  onRuntimeState?: (state: ThemeAssetRuntimeState) => void;
}) {
  const gltf = useGLTF(url);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const viewport = useThree((state) => state.size);
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
    let materialCount = 0;
    scene.traverse((node: any) => {
      objectCount += 1;
      if (node.isMesh) {
        meshCount += 1;
        node.castShadow = !lowPower;
        node.receiveShadow = !lowPower;

        const normalizeMaterial = (source: THREE.Material) => {
          const material = source.clone() as THREE.Material & {
            roughness?: number;
            metalness?: number;
            envMapIntensity?: number;
            emissiveIntensity?: number;
          };
          if (typeof material.roughness === "number") {
            material.roughness = THREE.MathUtils.clamp(material.roughness, 0.16, 0.92);
          }
          if (typeof material.metalness === "number") {
            material.metalness = THREE.MathUtils.clamp(material.metalness, 0, 0.9);
          }
          if ("envMapIntensity" in material) {
            material.envMapIntensity = lowPower ? 0.72 : 1.05;
          }
          if (typeof material.emissiveIntensity === "number") {
            material.emissiveIntensity = Math.min(material.emissiveIntensity, lowPower ? 1.15 : 2.4);
          }
          if ("transparent" in material && (material as THREE.Material & { transparent?: boolean }).transparent) {
            material.depthWrite = false;
          }
          material.needsUpdate = true;
          return material;
        };

        if (Array.isArray(node.material)) {
          node.material = node.material.map((material: THREE.Material) => {
            materialCount += 1;
            return normalizeMaterial(material);
          });
        } else if (node.material) {
          materialCount += 1;
          node.material = normalizeMaterial(node.material);
        }
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
    const basePosition: [number, number, number] = [-center.x * fitScale, -bounds.min.y * fitScale, -center.z * fitScale];
    scene.position.set(...basePosition);

    return {
      scene,
      basePosition,
      fitScale,
      metrics: {
        meshCount,
        objectCount,
        materialCount,
        bounds: {
          size: [size.x, size.y, size.z] as [number, number, number],
          center: [center.x, center.y, center.z] as [number, number, number],
        },
        camera: { distance: 0, fov: 0, aspect: 0, target: [0, 0, 0] as [number, number, number] },
        visual: {
          brandProfile: "ALLPHA_UNIVERSE_V2" as const,
          toneMapping: "ACESFilmicToneMapping" as const,
          outputColorSpace: "SRGBColorSpace" as const,
          exposure: lowPower ? 1.0 : 1.16,
        },
      },
    };
  }, [gltf.scene, lowPower]);

  const runtimeMetricsRef = useMemo(() => ({ value: prepared.metrics }), [prepared]);

  // D6.4 evidence is owned by the production DOM marker. The R3F child can
  // outlive/re-render independently of the parent callback path, so write the
  // authoritative runtime evidence directly to the mounted marker as well.
  const writeRuntimeState = (state: ThemeAssetRuntimeState) => {
    if (typeof document === "undefined") return;
    const marker = document.querySelector<HTMLElement>("[data-allpha-3d-runtime]");
    if (marker) marker.dataset.allpha3dAssetState = state;
    onRuntimeState?.(state);
  };

  const writeRuntimeMetrics = (metrics: ThemeAssetRuntimeMetrics) => {
    if (typeof document !== "undefined") {
      const marker = document.querySelector<HTMLElement>("[data-allpha-3d-runtime]");
      if (marker) {
        marker.dataset.allpha3dMeshCount = String(metrics.meshCount);
        marker.dataset.allpha3dObjectCount = String(metrics.objectCount);
        marker.dataset.allpha3dMaterialCount = String(metrics.materialCount);
        marker.dataset.allpha3dBounds = metrics.bounds.size.map((value) => value.toFixed(3)).join(",");
        marker.dataset.allpha3dCameraDistance = metrics.camera.distance.toFixed(3);
        marker.dataset.allpha3dCameraFov = metrics.camera.fov.toFixed(2);
        marker.dataset.allpha3dCameraAspect = metrics.camera.aspect.toFixed(3);
        marker.dataset.allpha3dCameraTarget = metrics.camera.target.map((value) => value.toFixed(3)).join(",");
        marker.dataset.allpha3dVisualProfile = metrics.visual.brandProfile;
        marker.dataset.allpha3dToneMapping = metrics.visual.toneMapping;
        marker.dataset.allpha3dOutputColorSpace = metrics.visual.outputColorSpace;
        marker.dataset.allpha3dExposure = metrics.visual.exposure.toFixed(2);
      }
    }
    onLoaded?.(metrics);
  };

  useEffect(() => {
    prepared.scene.updateMatrixWorld(true);
    const worldBounds = new THREE.Box3().setFromObject(prepared.scene);
    const worldSize = new THREE.Vector3();
    const worldCenter = new THREE.Vector3();
    const sphere = new THREE.Sphere();
    worldBounds.getSize(worldSize);
    worldBounds.getCenter(worldCenter);
    worldBounds.getBoundingSphere(sphere);

    if (camera instanceof THREE.PerspectiveCamera) {
      const portrait = viewport.width > 0 && viewport.height > viewport.width;
      const margin = lowPower ? 1.28 : portrait ? 1.34 : 1.18;
      const fovRadians = THREE.MathUtils.degToRad(camera.fov);
      const distance = Math.max(7.5, (sphere.radius / Math.tan(fovRadians / 2)) * margin);
      const targetY = THREE.MathUtils.clamp(
        worldBounds.min.y + worldSize.y * (portrait ? 0.22 : 0.46),
        portrait ? 0.45 : 0.85,
        Math.max(portrait ? 0.9 : 1.15, worldBounds.max.y - worldSize.y * 0.12),
      );
      const target = new THREE.Vector3(worldCenter.x, targetY, worldCenter.z);
      camera.position.set(target.x, target.y + distance * 0.16, target.z + distance);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      if (controls && typeof controls === "object") {
        const orbitControls = controls as { target?: THREE.Vector3; update?: () => void };
        orbitControls.target?.copy(target);
        orbitControls.update?.();
      }

      const metrics: ThemeAssetRuntimeMetrics = {
        ...prepared.metrics,
        camera: {
          distance,
          fov: camera.fov,
          aspect: camera.aspect,
          target: [target.x, target.y, target.z] as [number, number, number],
        },
      };
      runtimeMetricsRef.value = metrics;
      writeRuntimeState("loaded");
      writeRuntimeMetrics(metrics);
    } else {
      writeRuntimeState("loaded");
      writeRuntimeMetrics(prepared.metrics);
    }
  }, [camera, controls, onLoaded, prepared, runtimeMetricsRef, viewport.height, viewport.width, lowPower]);

  useFrame(({ clock }) => {
    prepared.scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const worldBounds = new THREE.Box3().setFromObject(prepared.scene);
    const worldSphere = new THREE.Sphere();
    worldBounds.getBoundingSphere(worldSphere);
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    );
    const visibleInCamera = frustum.intersectsSphere(worldSphere);
    if (prepared.metrics.meshCount > 0 && visibleInCamera && !visibleRef.value) {
      visibleRef.value = true;
      writeRuntimeState("visible");
    }
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    prepared.scene.rotation.y = Math.sin(t * 0.16) * (lowPower ? 0.018 : 0.035);
    prepared.scene.position.y = prepared.basePosition[1] + Math.sin(t * 0.34) * (lowPower ? 0.006 : 0.014);
  });

  const scale = category === "universe" ? 1.08 : category === "galaxy" ? 1.02 : category === "world" ? 1 : 0.94;
  return <primitive object={prepared.scene} scale={scale * prepared.fitScale} />;
}

export function ThemeManifestAssetScene({ themeKey, category, directAssetUrl = null, lowPower = false, reducedMotion = false, fallback = null, onRuntimeState, onRuntimeMetrics }: {
  themeKey?: string | null;
  category: AssetCategory;
  directAssetUrl?: string | null;
  lowPower?: boolean;
  reducedMotion?: boolean;
  fallback?: ReactNode;
  onRuntimeState?: (state: ThemeAssetRuntimeState) => void;
  onRuntimeMetrics?: (metrics: ThemeAssetRuntimeMetrics) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (directAssetUrl) {
      onRuntimeState?.("loading-gltf");
      setUrl(directAssetUrl);
      return () => { onRuntimeState?.("idle"); };
    }
    if (!themeKey) {
      onRuntimeState?.("idle");
      return;
    }
    onRuntimeState?.("loading-manifest");
    const controller = new AbortController();
    const endpoint = API_BASE + "/api/v1/themes/world-runtime/public/themes/" + encodeURIComponent(themeKey) + "/asset-manifest";
    fetch(endpoint, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (cancelled) return;
        const assets: ManifestAsset[] = payload?.data?.binary_3d_assets ?? [];
        const aliases: Record<AssetCategory, string[]> = {
          universe: ["universe", "galaxy_navigator", "universe_core"],
          galaxy: ["galaxy", "galaxy_navigator"],
          world: ["world", "world_planet"],
          orbit: ["orbit", "navigation_orbit"],
          capsule: ["capsule", "content_capsule"],
          district: ["district", "district_city"],
          booth: ["booth", "booth_tenant"],
          "content-feed": ["content-feed", "content_feed", "content_capsule"],
          "agent-character": ["agent-character", "agent_character", "ai_character_companion"],
          "live-stage": ["live-stage", "live_stage", "podcast_stage", "classroom_stage"],
          "human-live": ["human-live", "human_live", "human_uniform_formal", "human_uniform_hero"],
          "sticker-social": ["sticker-social", "sticker_social"],
          animation: ["animation", "ai_character_animation"],
          "navigation-fx": ["navigation-fx", "navigation_fx", "spatial_fx"],
        };
        const normalize = (value: unknown) => String(value ?? "")
          .toLowerCase()
          .replace(/\\.glb$/, "")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        const accepted = aliases[category] ?? [category];
        const candidate = assets.find((asset) => {
          if (!asset.signed_url) return false;
          const metadata = asset.metadata ?? {};
          const path = String(asset.storage_path ?? "").replace(/^\/+/, "");
          const basename = path.split("/").pop() ?? "";
          const declaredCategory = normalize(metadata.category ?? metadata.asset_category ?? metadata.assetCategory);
          const declaredKey = normalize(metadata.asset_key ?? metadata.assetKey ?? metadata.name ?? basename);
          const categoryMatches = accepted.some((alias) => {
            const key = normalize(alias);
            return declaredCategory === key || declaredKey === key;
          });
          const legacySuffix = path.toLowerCase().endsWith(("/" + themeKey + "/" + category + ".glb").toLowerCase());
          // Only assets already authorized by the canonical signed manifest are eligible.
          // Prefer explicit category/key metadata; retain the legacy path contract for older manifests.
          return categoryMatches || legacySuffix;
        });
        if (!candidate?.signed_url) {
          onRuntimeState?.("error");
          setUrl(null);
          return;
        }
        onRuntimeState?.("manifest-resolved");
        setUrl(candidate.signed_url);
      })
      .catch(() => {
        if (!cancelled) {
          onRuntimeState?.("error");
          setUrl(null);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
      onRuntimeState?.("idle");
    };
  }, [themeKey, category, directAssetUrl, onRuntimeState]);

  useEffect(() => {
    if (url) {
      onRuntimeState?.("loading-gltf");
    }
  }, [url, onRuntimeState]);

  return url
    ? <ProductionAssetModel url={url} category={category} lowPower={lowPower} reducedMotion={reducedMotion} onRuntimeState={onRuntimeState} onLoaded={onRuntimeMetrics} />
    : <>{fallback}</>;
}
