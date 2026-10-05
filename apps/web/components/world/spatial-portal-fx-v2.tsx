"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CinematicLayer } from "./cinematic-3d-scene";

export type SpatialFxMode = "portal" | "waypoint" | "transition" | "selection";

type Props = {
  mode: SpatialFxMode;
  layer: CinematicLayer;
  color: string;
  secondaryColor?: string;
  lowPower?: boolean;
  reducedMotion?: boolean;
  active?: boolean;
  position?: [number, number, number];
  onActivate?: () => void;
};

const LAYER_SCALE: Record<CinematicLayer, number> = {
  universe: 1.45, galaxy: 1.25, orbit: 1.12, world: 1, district: 0.82, booth: 0.68, content: 0.7, live: 0.72,
};

function PortalCore({ color, secondaryColor, lowPower, reducedMotion, active }: Omit<Props, "mode" | "layer">) {
  const group = useRef<THREE.Group>(null);
  const count = lowPower ? 2 : 4;
  useFrame(({ clock }) => {
    if (!group.current || reducedMotion) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = t * 0.18;
    group.current.rotation.z = Math.sin(t * 0.35) * 0.025;
    group.current.scale.setScalar((active ? 1.04 : 1) + Math.sin(t * 1.7) * 0.018);
  });
  return (
    <group ref={group}>
      <mesh>
        <torusGeometry args={[1.25, active ? 0.12 : 0.085, 14, 96]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 2.2 : 1.35} metalness={0.45} roughness={0.18} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.025, 8, 72]} />
        <meshBasicMaterial color={secondaryColor ?? color} transparent opacity={0.52} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <circleGeometry args={[1.02, 64]} />
        <meshBasicMaterial color={secondaryColor ?? color} transparent opacity={active ? 0.12 : 0.07} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i / count) * Math.PI * 2]}>
          <torusGeometry args={[1.48 + i * 0.18, 0.018, 6, 72, Math.PI * 0.72]} />
          <meshBasicMaterial color={i % 2 ? secondaryColor ?? color : color} transparent opacity={0.28 - i * 0.035} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

function TransitionFx({ color, reducedMotion, lowPower }: { color: string; reducedMotion: boolean; lowPower: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const t = clock.elapsedTime;
    ref.current.rotation.z = t * 0.12;
    ref.current.scale.setScalar(1 + Math.sin(t * 1.1) * 0.03);
  });
  const rings = lowPower ? 3 : 6;
  return (
    <group ref={ref}>
      {Array.from({ length: rings }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.2]}>
          <torusGeometry args={[1.5 + i * 0.5, 0.018, 6, 72]} />
          <meshBasicMaterial color={color} transparent opacity={0.22 - i * 0.025} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export function SpatialPortalFx({ mode, layer, color, secondaryColor, lowPower = false, reducedMotion = false, active = false, position = [0, 0.8, -4], onActivate }: Props) {
  const scale = LAYER_SCALE[layer];
  const group = useRef<THREE.Group>(null);
  const interactive = mode === "portal" || mode === "waypoint" || mode === "selection";
  const handlePointer = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onActivate?.();
  };
  return (
    <group ref={group} position={position} scale={scale}>
      {mode === "transition" ? <TransitionFx color={color} reducedMotion={reducedMotion} lowPower={lowPower} /> : <PortalCore color={color} secondaryColor={secondaryColor} lowPower={lowPower} reducedMotion={reducedMotion} active={active} />}
      {interactive ? (
        <mesh onPointerOver={(e) => e.stopPropagation()} onClick={handlePointer}>
          <torusGeometry args={[1.34, 0.16, 8, 48]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ) : null}
    </group>
  );
}

export function SpatialWaypoint({ position, color, active, lowPower, reducedMotion, onActivate }: { position: [number, number, number]; color: string; active?: boolean; lowPower?: boolean; reducedMotion?: boolean; onActivate?: () => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y = clock.elapsedTime * 0.28;
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[active ? 0.34 : 0.24, active ? 0.46 : 0.32, 0.14, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.8 : 0.8} metalness={0.5} roughness={0.25} />
      </mesh>
      <SpatialPortalFx mode="waypoint" layer="world" color={color} lowPower={lowPower} reducedMotion={reducedMotion} active={active} position={[0, 0.3, 0]} onActivate={onActivate} />
    </group>
  );
}

export const SPATIAL_FX_V2 = {
  schema: "3d-v2.10/1.0",
  modes: ["portal", "waypoint", "transition", "selection"] as const,
  presentationOnly: true,
} as const;
