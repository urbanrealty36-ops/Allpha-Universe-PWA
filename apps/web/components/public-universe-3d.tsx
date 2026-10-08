"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ThemeV2ProductionAssetScene } from "./world/theme-v2-production-asset-scene";
import { Cinematic3DScene, configureCinematicRenderer } from "./world/cinematic-3d-scene";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

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

function PublicScene({ variant }: { variant: PublicUniverse3DVariant }) {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = variant === "identity" ? "world" : "universe";

  return (
    <>
      <Cinematic3DScene themeKey="crystal-ai-city" layer={layer as "universe"|"world"} lowPower={false} reducedMotion={reducedMotion}>
        <ThemeV2ProductionAssetScene
          themeKey="crystal-ai-city"
          category={layer === "world" ? "world" : "universe"}
          lowPower={false}
          reducedMotion={reducedMotion}
          allowProceduralFallback={false}
        />
        <HumanSilhouette identity={variant === "identity"} />
      </Cinematic3DScene>
    </>
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
      >
        <PublicScene variant={variant} />
      </Canvas>
    </div>
  );
}