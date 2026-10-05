"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { ThemeV2SpatialScene } from "./world/theme-v2-spatial-scene";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

function HumanSilhouette({ identity = false }: { identity?: boolean }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.position.y = Math.sin(clock.elapsedTime * 0.72) * 0.035;
    root.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.055;
  });
  return (
    <group ref={root} position={[0, identity ? -1.55 : -1.9, identity ? 1.2 : 0.65]} scale={identity ? 1.05 : 0.9}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.34, 20, 16]} />
        <meshStandardMaterial color="#E6B7A8" roughness={0.68} />
      </mesh>
      <mesh position={[0, 2.03, -0.02]} scale={[1.04, 0.72, 1.03]}>
        <sphereGeometry args={[0.38, 20, 14]} />
        <meshStandardMaterial color="#B8A7FF" roughness={0.72} metalness={0.05} />
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
  const layer = variant === "identity" ? "world" : variant === "splash" ? "universe" : "universe";
  return (
    <>
      <color attach="background" args={["#02040B"]} />
      <fog attach="fog" args={["#02040B", 10, 30]} />
      <ambientLight intensity={0.42} />
      <pointLight position={[4, 7, 8]} intensity={26} color="#67E8F9" />
      <pointLight position={[-6, 2, 3]} intensity={18} color="#8B5CF6" />
      <pointLight position={[2, -2, -5]} intensity={12} color="#EE7CFF" />
      <ThemeV2SpatialScene
        themeKey="crystal-ai-city"
        architecture="Crystal AI City"
        layer={layer as "universe" | "world"}
        lowPower={false}
        reducedMotion={reducedMotion}
      />
      <HumanSilhouette identity={variant === "identity"} />
    </>
  );
}

export default function PublicUniverse3D({ variant }: { variant: PublicUniverse3DVariant }) {
  return (
    <div className={`allpha-public-3d allpha-public-3d-${variant}`} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: variant === "identity" ? [0, 1.0, 8.8] : [0, 1.8, 10.5], fov: variant === "universe" ? 46 : 43 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <PublicScene variant={variant} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
