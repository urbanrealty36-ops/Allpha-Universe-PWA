"use client";

import { Float, Sparkles, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ThemeV2SpatialScene } from "./world/theme-v2-spatial-scene";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

type PublicThemeManifest = {
  data?: {
    binary_3d_assets?: Array<{ signed_url?: string | null; storage_path?: string | null }>;
  };
};

function HumanSilhouette({ identity = false }: { identity?: boolean }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.position.y = Math.sin(clock.elapsedTime * 0.72) * 0.035;
    root.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.055;
  });
  return (
    <group ref={root} position={[identity ? 2.6 : -2.7, identity ? -0.55 : -0.45, 2.1]} scale={identity ? 0.78 : 0.68}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.34, 20, 16]} />
        <meshStandardMaterial color="#E6B7A8" roughness={0.68} />
      </mesh>
      <mesh position={[0, 2.03, -0.02]} scale={[1.04, 0.72, 1.03]}>
        <sphereGeometry args={[0.38, 20, 14]} />
        <meshStandardMaterial color="#B8A7FF" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.52, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.68, 8, 14]} />
        <meshStandardMaterial color="#0B1B46" emissive="#173A80" emissiveIntensity={0.3} metalness={0.32} roughness={0.48} />
      </mesh>
      <mesh position={[-0.42, 1.38, 0]} rotation={[0, 0, -0.16]}>
        <capsuleGeometry args={[0.085, 0.66, 6, 10]} />
        <meshStandardMaterial color="#DCAEA1" />
      </mesh>
      <mesh position={[0.42, 1.38, 0]} rotation={[0, 0, 0.16]}>
        <capsuleGeometry args={[0.085, 0.66, 6, 10]} />
        <meshStandardMaterial color="#DCAEA1" />
      </mesh>
      <mesh position={[-0.18, 0.62, 0]} rotation={[0, 0, 0.03]}>
        <capsuleGeometry args={[0.12, 0.92, 6, 10]} />
        <meshStandardMaterial color="#0A1027" />
      </mesh>
      <mesh position={[0.18, 0.62, 0]} rotation={[0, 0, -0.03]}>
        <capsuleGeometry args={[0.12, 0.92, 6, 10]} />
        <meshStandardMaterial color="#0A1027" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <torusGeometry args={[0.66, 0.035, 8, 40]} />
        <meshStandardMaterial color="#67E8F9" emissive="#22D3EE" emissiveIntensity={1.8} transparent opacity={0.78} />
      </mesh>
    </group>
  );
}

function RealThemeWorldAsset({ url, reducedMotion }: { url: string; reducedMotion: boolean }) {
  const gltf = useGLTF(url);
  const root = useRef<THREE.Group>(null);
  const portal = useRef<THREE.Object3D | null>(null);
  const landmark = useRef<THREE.Object3D | null>(null);

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.name === "AgentCharacterTemplate" || object.name === "BoothTemplate" || object.name === "ContentAICapsule" || object.name === "LiveExperienceStage") {
        object.visible = false;
      }
      if (object.name === "PortalGateway") portal.current = object;
      if (object.name === "WorldLandmark") landmark.current = object;
    });
    return clone;
  }, [gltf.scene]);

  useFrame(({ clock }) => {
    if (!reducedMotion) {
      const t = clock.elapsedTime;
      if (root.current) root.current.rotation.y = Math.sin(t * 0.08) * 0.035;
      if (portal.current) portal.current.rotation.z = Math.sin(t * 0.45) * 0.035;
      if (landmark.current) landmark.current.rotation.y = Math.sin(t * 0.22) * 0.08;
    }
  });

  return (
    <group ref={root} position={[0, -1.2, -0.8]} scale={1.12}>
      <primitive object={scene} />
      <group position={[0, 0.98, -4.28]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.12, 0.045, 10, 64]} />
          <meshStandardMaterial color="#67E8F9" emissive="#22D3EE" emissiveIntensity={1.4} transparent opacity={0.72} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.72, 0.018, 8, 48]} />
          <meshStandardMaterial color="#A78BFA" emissive="#8B5CF6" emissiveIntensity={1.2} transparent opacity={0.55} />
        </mesh>
        <Sparkles count={reducedMotion ? 10 : 28} scale={[2.5, 2.8, 0.9]} size={0.9} speed={reducedMotion ? 0 : 0.32} color="#8DEFFF" />
      </group>
    </group>
  );
}

function PublicScene({ variant, assetUrl }: { variant: PublicUniverse3DVariant; assetUrl: string | null }) {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = variant === "identity" ? "world" : "universe";

  return (
    <>
      <color attach="background" args={["#02040B"]} />
      <fog attach="fog" args={["#02040B", 12, 34]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[7, 12, 8]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[4, 7, 5]} intensity={18} color="#67E8F9" />
      <pointLight position={[-5, 4, 1]} intensity={12} color="#8B5CF6" />

      {assetUrl ? (
        <RealThemeWorldAsset url={assetUrl} reducedMotion={reducedMotion} />
      ) : (
        <ThemeV2SpatialScene
          themeKey="crystal-ai-city"
          architecture="Crystal AI City"
          layer={layer as "universe" | "world"}
          lowPower={false}
          reducedMotion={reducedMotion}
        />
      )}

      <HumanSilhouette identity={variant === "identity"} />
      <Sparkles count={reducedMotion ? 60 : 140} scale={[20, 10, 18]} size={0.6} speed={reducedMotion ? 0 : 0.12} color="#C7D2FE" />
    </>
  );
}

export default function PublicUniverse3D({ variant }: { variant: PublicUniverse3DVariant }) {
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [assetLoading, setAssetLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPublicThemeAsset() {
      const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiBase) {
        if (active) setAssetLoading(false);
        return;
      }
      try {
        const response = await fetch(`${apiBase}/api/v1/themes/world-runtime/public/themes/crystal-ai-city/asset-manifest`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`ASSET_MANIFEST_${response.status}`);
        const payload = (await response.json()) as PublicThemeManifest;
        const url = payload.data?.binary_3d_assets?.find((item) => item.signed_url)?.signed_url ?? null;
        if (active) setAssetUrl(url);
      } catch {
        if (active) setAssetUrl(null);
      } finally {
        if (active) setAssetLoading(false);
      }
    }
    void loadPublicThemeAsset();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={`allpha-public-3d allpha-public-3d-${variant}${assetLoading ? " allpha-public-3d-loading" : ""}`} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        shadows
        camera={{ position: variant === "identity" ? [0, 5.5, 13.5] : [0, 5.9, 14.5], fov: variant === "universe" ? 43 : 42 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <PublicScene variant={variant} assetUrl={assetUrl} />
      </Canvas>
    </div>
  );
}
