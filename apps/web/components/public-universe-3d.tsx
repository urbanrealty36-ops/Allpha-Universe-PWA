"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type PublicUniverse3DVariant = "splash" | "universe" | "identity";

function Globe({ scale = 1 }: { scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });
  return (
    <group scale={scale}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.65, 48, 48]} />
        <meshStandardMaterial color="#102b63" emissive="#071d52" emissiveIntensity={1.4} roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh scale={1.035}>
        <sphereGeometry args={[1.65, 32, 32]} />
        <meshBasicMaterial color="#65e7ff" transparent opacity={0.12} wireframe />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[1.65, 32, 32]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function UniverseCore() {
  const ref = useRef<THREE.Group>(null);
  const nodes = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return [Math.cos(a) * 3.2, Math.sin(a) * 1.35, Math.sin(a) * 1.2] as [number, number, number];
  }), []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#67e8f9" emissive="#38bdf8" emissiveIntensity={3} />
      </mesh>
      <mesh scale={1.8}>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.1} />
      </mesh>
      {nodes.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <sphereGeometry args={[0.22 + (i % 3) * 0.04, 20, 20]} />
            <meshStandardMaterial color={i % 2 ? "#8b5cf6" : "#22d3ee"} emissive={i % 2 ? "#6d28d9" : "#0891b2"} emissiveIntensity={2} />
          </mesh>
          <mesh scale={1.8}>
            <sphereGeometry args={[0.22 + (i % 3) * 0.04, 12, 12]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0.12} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Character() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.035;
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;
    }
  });
  return (
    <group ref={group} position={[0, -1.25, 0]}>
      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#f4c7b5" roughness={0.65} />
      </mesh>
      <mesh position={[0, 2.02, -0.02]} scale={[1.02, 0.72, 1.02]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#d8c4ff" roughness={0.8} />
      </mesh>
      <mesh position={[-0.16, 1.76, 0.33]} scale={[0.06, 0.035, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[0.16, 1.76, 0.33]} scale={[0.06, 0.035, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 1.52, 0]}>
        <capsuleGeometry args={[0.38, 0.72, 8, 16]} />
        <meshStandardMaterial color="#172554" emissive="#0c4a6e" emissiveIntensity={0.3} roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[-0.48, 1.42, 0]} rotation={[0, 0, -0.16]}>
        <capsuleGeometry args={[0.1, 0.7, 6, 12]} />
        <meshStandardMaterial color="#f0b7a7" />
      </mesh>
      <mesh position={[0.48, 1.42, 0]} rotation={[0, 0, 0.16]}>
        <capsuleGeometry args={[0.1, 0.7, 6, 12]} />
        <meshStandardMaterial color="#f0b7a7" />
      </mesh>
      <mesh position={[-0.2, 0.65, 0]} rotation={[0, 0, 0.03]}>
        <capsuleGeometry args={[0.13, 0.95, 6, 12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.2, 0.65, 0]} rotation={[0, 0, -0.03]}>
        <capsuleGeometry args={[0.13, 0.95, 6, 12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.65, 0.85, 0.08, 32]} />
        <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={2} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function WorldIcons() {
  const worlds = [
    { p: [-2.9, 0.9, -0.4] as [number, number, number], c: "#67e8f9", label: "TECH" },
    { p: [2.7, 1.1, -0.2] as [number, number, number], c: "#a78bfa", label: "CREATIVE" },
    { p: [-2.5, -1.15, 0.1] as [number, number, number], c: "#60a5fa", label: "BUSINESS" },
    { p: [2.45, -1.05, 0.15] as [number, number, number], c: "#22d3ee", label: "SCIENCE" },
  ];
  return <group>{worlds.map((w) => <Float key={w.label} speed={1.1} rotationIntensity={0.3} floatIntensity={0.3} position={w.p}>
    <group>
      <mesh>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color={w.c} emissive={w.c} emissiveIntensity={1.7} roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh scale={1.45}>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshBasicMaterial color={w.c} transparent opacity={0.09} wireframe />
      </mesh>
    </group>
  </Float>)}</group>;
}

export default function PublicUniverse3D({ variant }: { variant: PublicUniverse3DVariant }) {
  return (
    <div className={`allpha-public-3d allpha-public-3d-${variant}`} aria-hidden="true">
      <Canvas dpr={[1, 1.6]} camera={{ position: variant === "identity" ? [0, 0.2, 8.2] : [0, 0.4, 8.5], fov: 42 }}>
        <ambientLight intensity={0.65} />
        <pointLight position={[3, 4, 5]} intensity={45} color="#8be9ff" />
        <pointLight position={[-4, 1, 3]} intensity={30} color="#8b5cf6" />
        <Stars radius={55} depth={24} count={variant === "identity" ? 900 : 1400} factor={2.1} saturation={0} fade speed={0.3} />
        {variant === "splash" && <><Globe scale={1.05} /><Character /></>}
        {variant === "universe" && <><UniverseCore /><WorldIcons /><Globe scale={0.7} /></>}
        {variant === "identity" && <><Character /><UniverseCore /></>}
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={variant === "identity" ? 0.2 : 0.35} />
      </Canvas>
    </div>
  );
}
