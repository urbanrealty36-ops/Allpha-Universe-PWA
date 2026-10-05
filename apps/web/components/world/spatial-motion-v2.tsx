"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CinematicLayer } from "./cinematic-3d-scene";

type MotionProps = {
  layer: CinematicLayer;
  lowPower: boolean;
  reducedMotion: boolean;
  focusPoint?: [number, number, number];
};

type CameraRigProps = MotionProps & { target?: THREE.Vector3 };

const CONFIG: Record<CinematicLayer, { position: [number, number, number]; fov: number; orbit: number; min: number; max: number }> = {
  universe: { position: [0, 6.2, 15.5], fov: 48, orbit: 0.045, min: 7, max: 34 },
  galaxy: { position: [0, 5.4, 13.2], fov: 50, orbit: 0.06, min: 6, max: 30 },
  orbit: { position: [0, 4.8, 11.2], fov: 52, orbit: 0.075, min: 5, max: 26 },
  world: { position: [10, 7, 12], fov: 55, orbit: 0.035, min: 4, max: 24 },
  district: { position: [8, 5.5, 9], fov: 56, orbit: 0.025, min: 3.5, max: 20 },
  booth: { position: [5, 3.5, 6], fov: 54, orbit: 0.018, min: 2.5, max: 14 },
  content: { position: [5, 3.8, 7], fov: 53, orbit: 0.02, min: 2.5, max: 16 },
  live: { position: [7, 4.5, 8], fov: 52, orbit: 0.016, min: 3, max: 18 },
};

export function SpatialCameraRig({ layer, lowPower, reducedMotion, focusPoint = [0, 0, 0] }: MotionProps) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(...focusPoint), [focusPoint]);
  const current = useRef(new THREE.Vector3(...CONFIG[layer].position));
  const velocity = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const cfg = CONFIG[layer];
    const t = reducedMotion ? 0 : clock.elapsedTime;
    const amplitude = lowPower ? cfg.orbit * 0.55 : cfg.orbit;
    const desired = new THREE.Vector3(
      cfg.position[0] + Math.sin(t * 0.18) * amplitude * 14,
      cfg.position[1] + Math.sin(t * 0.23) * amplitude * 4,
      cfg.position[2] + Math.cos(t * 0.16) * amplitude * 10,
    );
    current.current.lerp(desired, Math.min(1, delta * 1.6));
    camera.position.copy(current.current);
    const look = target.clone();
    look.y += reducedMotion ? 0 : Math.sin(t * 0.12) * 0.06;
    camera.lookAt(look);
    camera.fov += (cfg.fov - camera.fov) * Math.min(1, delta * 3);
    camera.updateProjectionMatrix();
    velocity.current = delta;
  });

  return null;
}

export function SpatialMotionField({ layer, lowPower, reducedMotion }: MotionProps) {
  const group = useRef<THREE.Group>(null);
  const count = lowPower ? 3 : layer === "universe" ? 7 : 5;
  const points = useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [Math.cos(a) * (3.5 + i * 0.25), 0.2 + (i % 3) * 0.35, Math.sin(a) * (3.5 + i * 0.25)] as [number, number, number];
  }), [count]);

  useFrame(({ clock }) => {
    if (!group.current || reducedMotion) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = t * (lowPower ? 0.012 : 0.022);
    group.current.children.forEach((child, i) => {
      child.position.y = points[i][1] + Math.sin(t * 0.45 + i) * 0.08;
    });
  });

  return <group ref={group}>{points.map((p, i) => (
    <mesh key={i} position={p}>
      <sphereGeometry args={[lowPower ? 0.055 : 0.075, 8, 8]} />
      <meshBasicMaterial color="#94A3B8" transparent opacity={0.32} />
    </mesh>
  ))}</group>;
}

export function SpatialFocusMarker({ position, color, active = false }: { position: [number, number, number]; color: string; active?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = active ? 1 + Math.sin(clock.elapsedTime * 3.2) * 0.05 : 1;
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[active ? 0.72 : 0.5, active ? 0.78 : 0.55, 48]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.8 : 0.35} />
      </mesh>
    </group>
  );
}

export function SpatialInteractionTarget({ position, color, onActivate }: { position: [number, number, number]; color: string; onActivate?: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={() => { ref.current?.scale.setScalar(1.12); }}
      onPointerOut={() => { ref.current?.scale.setScalar(1); }}
      onClick={(event) => { event.stopPropagation(); onActivate?.(); }}
    >
      <sphereGeometry args={[0.12, 12, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0.65} />
    </mesh>
  );
}

export function SpatialMotionLayer({ layer, lowPower, reducedMotion }: MotionProps) {
  return (
    <>
      <SpatialCameraRig layer={layer} lowPower={lowPower} reducedMotion={reducedMotion} />
      <SpatialMotionField layer={layer} lowPower={lowPower} reducedMotion={reducedMotion} />
    </>
  );
}

export const SPATIAL_MOTION_V2 = {
  schema: "3d-v2.09-d/1.0",
  cameraLayers: Object.keys(CONFIG),
  reducedMotion: true,
  lowPower: true,
  presentationOnly: true,
} as const;
