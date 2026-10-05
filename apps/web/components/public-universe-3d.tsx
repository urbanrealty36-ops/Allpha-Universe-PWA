"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ThemeV2Real3DAsset } from "./world/theme-v2-real-3d-asset";

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

function PublicScene({ variant }: { variant: PublicUniverse3DVariant }) {\n  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n  const layer = variant === "identity" ? "world" : "universe";\n\n  return (\n    <>\n      <color attach="background" args={["#02040B"]} />\n      <fog attach="fog" args={["#02040B", 12, 34]} />\n      <ambientLight intensity={0.62} />\n      <directionalLight position={[7, 12, 8]} intensity={3.8} castShadow shadow-mapSize={[1024, 1024]} />\n      <pointLight position={[4, 7, 5]} intensity={16} color="#67E8F9" />\n      <pointLight position={[-5, 4, 1]} intensity={11} color="#8B5CF6" />\n\n      <ThemeV2Real3DAsset\n        themeKey="crystal-ai-city"\n        architecture="Crystal AI City"\n        layer={layer}\n        lowPower={false}\n        reducedMotion={reducedMotion}\n      />\n\n      <HumanSilhouette identity={variant === "identity"} />\n      <Sparkles count={reducedMotion ? 55 : 120} scale={[20, 10, 18]} size={0.6} speed={reducedMotion ? 0 : 0.12} color="#C7D2FE" />\n    </>\n  );\n}\n\nexport default function PublicUniverse3D({ variant }: { variant: PublicUniverse3DVariant }) {\n  return (\n    <div className={`allpha-public-3d allpha-public-3d-${variant}`} aria-hidden="true">\n      <Canvas\n        dpr={[1, 1.5]}\n        shadows\n        camera={{ position: variant === "identity" ? [0, 5.6, 13.8] : [0, 6.2, 15.2], fov: variant === "universe" ? 43 : 42 }}\n        gl={{ antialias: true, powerPreference: "high-performance" }}\n      >\n        <PublicScene variant={variant} />\n      </Canvas>\n    </div>\n  );\n}