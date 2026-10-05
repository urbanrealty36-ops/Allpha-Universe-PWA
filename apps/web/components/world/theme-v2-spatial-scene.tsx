"use client";

import { Float, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ALLPHA_3D_THEME_PROFILES, type Allpha3DThemeProfile } from "../../../../packages/design-tokens/3d-visual-language";
import { create3DAssetRecipe, type AssetCategory } from "../../lib/world-engine/asset-factory";

export type ThemeV2SpatialLayer = "universe" | "galaxy" | "world" | "district" | "booth" | "content" | "live";
export type ThemeV2Category = AssetCategory;

const categoryByLayer: Record<ThemeV2SpatialLayer, AssetCategory> = {
  universe: "universe",
  galaxy: "galaxy",
  world: "world",
  district: "district",
  booth: "booth",
  content: "content-feed",
  live: "live-stage",
};

const profileByKey = new Map(ALLPHA_3D_THEME_PROFILES.map((profile) => [profile.key, profile]));

function resolveProfile(themeKey?: string | null, architecture?: string | null): Allpha3DThemeProfile {
  if (themeKey && profileByKey.has(themeKey)) return profileByKey.get(themeKey)!;
  const normalized = String(architecture ?? "").trim().toLowerCase();
  return ALLPHA_3D_THEME_PROFILES.find((profile) =>
    profile.key === normalized ||
    profile.key.replaceAll("-", " ") === normalized ||
    profile.landmark.toLowerCase() === normalized ||
    profile.family.toLowerCase() === normalized,
  ) ?? profileByKey.get("crystal-ai-city")!;
}

export function resolveThemeV2Profile(themeKey?: string | null, architecture?: string | null) {
  return resolveProfile(themeKey, architecture);
}

export function resolveThemeV2Category(layer: ThemeV2SpatialLayer, explicit?: AssetCategory): AssetCategory {
  return explicit ?? categoryByLayer[layer];
}

function themeAccent(profile: Allpha3DThemeProfile) {
  return { primary: profile.accent[0], secondary: profile.accent[1], tertiary: profile.accent[2] };
}

function OrbitRing({ radius, tilt, color, opacity = 0.7, speed = 0.12, reducedMotion }: { radius: number; tilt: number; color: string; opacity?: number; speed?: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current && !reducedMotion) ref.current.rotation.y += delta * speed;
  });
  return (
    <group ref={ref} rotation={[tilt, 0, tilt * 0.45]}>
      <mesh>
        <torusGeometry args={[radius, Math.max(0.018, radius * 0.008), 8, 96]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius, Math.max(0.008, radius * 0.004), 6, 72]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.22} />
      </mesh>
    </group>
  );
}

function EnergyLink({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const length = start.distanceTo(end);
  const direction = end.clone().sub(start).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  return (
    <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={quaternion}>
      <cylinderGeometry args={[0.012, 0.012, length, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} transparent opacity={0.42} />
    </mesh>
  );
}

function CelestialCore({ profile, layer, reducedMotion }: { profile: Allpha3DThemeProfile; layer: ThemeV2SpatialLayer; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { primary, secondary } = themeAccent(profile);
  const size = layer === "universe" ? 1.45 : layer === "galaxy" ? 1.15 : 0.92;
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y = clock.elapsedTime * 0.12;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.08;
  });
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[size, 3]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1.45} metalness={0.25} roughness={0.24} />
      </mesh>
      <mesh scale={1.13}>
        <icosahedronGeometry args={[size, 2]} />
        <meshBasicMaterial color={secondary} transparent opacity={0.08} wireframe />
      </mesh>
      <mesh scale={1.28}>
        <sphereGeometry args={[size, 24, 16]} />
        <meshBasicMaterial color={primary} transparent opacity={0.045} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function WorldOrb({ profile, position, scale, index, reducedMotion, label }: { profile: Allpha3DThemeProfile; position: [number, number, number]; scale: number; index: number; reducedMotion: boolean; label?: string }) {
  const ref = useRef<THREE.Group>(null);
  const { primary, secondary, tertiary } = themeAccent(profile);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const t = clock.elapsedTime + index * 0.8;
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 0.16;
    ref.current.rotation.y = t * 0.18;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.72, 24, 18]} />
        <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.45} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh scale={1.035} rotation={[0.55, 0.2, 0.15]}>
        <torusGeometry args={[0.78, 0.035, 8, 48]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.9} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <coneGeometry args={[0.22, 0.8, 6]} />
        <meshStandardMaterial color={tertiary} emissive={tertiary} emissiveIntensity={0.7} metalness={0.45} roughness={0.28} />
      </mesh>
      {label ? <mesh position={[0, -0.82, 0]}><sphereGeometry args={[0.025, 6, 6]} /><meshBasicMaterial color={primary} /></mesh> : null}
    </group>
  );
}

function FloatingLandmark({ profile, position, index, reducedMotion }: { profile: Allpha3DThemeProfile; position: [number, number, number]; index: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { primary, secondary, tertiary } = themeAccent(profile);
  const geometry = profile.geometry.toLowerCase();
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const t = clock.elapsedTime * (0.45 + index * 0.035);
    ref.current.position.y = position[1] + Math.sin(t + index) * 0.07;
    ref.current.rotation.y = Math.sin(t * 0.65) * 0.18;
  });
  const isOrganic = /garden|rainforest|coral|reef|canopy|island|fjord|savanna|archipelago/.test(geometry);
  const isTemple = /pagoda|temple|pyramid|doj|palace|castle|academy/.test(geometry);
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        {isOrganic ? <dodecahedronGeometry args={[0.55, 1]} /> : isTemple ? <coneGeometry args={[0.62, 1.9, 5]} /> : <boxGeometry args={[0.72, 1.8, 0.72]} />}
        <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.35} metalness={isOrganic ? 0.05 : 0.58} roughness={isOrganic ? 0.72 : 0.28} />
      </mesh>
      <mesh position={[0, 1.68, 0]}>
        <octahedronGeometry args={[0.26, 1]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.018, 6, 28]} />
        <meshStandardMaterial color={tertiary} emissive={tertiary} emissiveIntensity={0.8} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function DistrictCity({ profile, lowPower, reducedMotion }: { profile: Allpha3DThemeProfile; lowPower: boolean; reducedMotion: boolean }) {
  const { primary, secondary, tertiary } = themeAccent(profile);
  const count = lowPower ? 5 : 9;
  return (
    <group>
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <cylinderGeometry args={[4.7, 5.2, 0.7, lowPower ? 28 : 48]} />
        <meshStandardMaterial color={secondary} roughness={0.5} metalness={0.45} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[4.15, 4.4, 0.12, lowPower ? 28 : 48]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.28} transparent opacity={0.62} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const radius = 2.2 + (i % 3) * 0.72;
        return <FloatingLandmark key={i} profile={profile} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]} index={i} reducedMotion={reducedMotion} />;
      })}
      <OrbitRing radius={4.45} tilt={0.14} color={tertiary} opacity={0.44} speed={0.08} reducedMotion={reducedMotion} />
    </group>
  );
}

function BoothCluster({ profile, lowPower, reducedMotion }: { profile: Allpha3DThemeProfile; lowPower: boolean; reducedMotion: boolean }) {
  const { primary, secondary, tertiary } = themeAccent(profile);
  const count = lowPower ? 4 : 7;
  return (
    <group>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[2.7, 3.0, 0.45, lowPower ? 24 : 40]} />
        <meshStandardMaterial color={secondary} metalness={0.55} roughness={0.28} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const radius = 1.65;
        const scale = 0.7 + (i % 2) * 0.1;
        return (
          <Float key={i} speed={0.65 + i * 0.04} floatIntensity={reducedMotion ? 0 : 0.08} rotationIntensity={reducedMotion ? 0 : 0.12}>
            <group position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]} scale={scale}>
              <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[0.72, 1.3, 0.72]} /><meshStandardMaterial color={secondary} metalness={0.62} roughness={0.24} /></mesh>
              <mesh position={[0, 1.36, 0]}><octahedronGeometry args={[0.26, 1]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1.1} /></mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.6, 0.025, 6, 28]} /><meshStandardMaterial color={tertiary} emissive={tertiary} emissiveIntensity={0.75} /></mesh>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

function ContentCapsules({ profile, lowPower, reducedMotion }: { profile: Allpha3DThemeProfile; lowPower: boolean; reducedMotion: boolean }) {
  const { primary, secondary, tertiary } = themeAccent(profile);
  const count = lowPower ? 4 : 7;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const a = i / count * Math.PI * 2;
        const p: [number, number, number] = [Math.cos(a) * (1.8 + (i % 2) * 0.6), 0.45 + (i % 3) * 0.25, Math.sin(a) * (1.8 + (i % 2) * 0.6)];
        return (
          <Float key={i} speed={0.8 + i * 0.03} floatIntensity={reducedMotion ? 0 : 0.12}>
            <group position={p}>
              <mesh><capsuleGeometry args={[0.23, 0.58, 6, 12]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1.0} metalness={0.24} roughness={0.22} /></mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.48, 0.018, 6, 24]} /><meshStandardMaterial color={tertiary} emissive={tertiary} emissiveIntensity={0.8} /></mesh>
              <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.42, 0.04, 0.04]} /><meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={1.2} /></mesh>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

function LiveStage({ profile, reducedMotion }: { profile: Allpha3DThemeProfile; reducedMotion: boolean }) {
  const { primary, secondary, tertiary } = themeAccent(profile);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.08;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, -0.5, 0]}><boxGeometry args={[5.2, 0.45, 3.5]} /><meshStandardMaterial color={secondary} metalness={0.62} roughness={0.25} /></mesh>
      <mesh position={[0, 1.15, -1.25]}><boxGeometry args={[4.5, 2.7, 0.08]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.32} transparent opacity={0.55} /></mesh>
      <OrbitRing radius={2.35} tilt={0.06} color={tertiary} opacity={0.65} speed={0.16} reducedMotion={reducedMotion} />
      <mesh position={[-1.05, 0.15, 0]}><capsuleGeometry args={[0.22, 0.7, 6, 12]} /><meshStandardMaterial color={secondary} /></mesh>
      <mesh position={[1.05, 0.15, 0]}><capsuleGeometry args={[0.22, 0.7, 6, 12]} /><meshStandardMaterial color={tertiary} emissive={tertiary} emissiveIntensity={0.35} /></mesh>
      <mesh position={[0, 0.95, 0]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={1.5} /></mesh>
    </group>
  );
}

export function ThemeV2SpatialScene({
  themeKey,
  architecture,
  layer = "universe",
  category,
  lowPower = false,
  reducedMotion = false,
}: {
  themeKey?: string | null;
  architecture?: string | null;
  layer?: ThemeV2SpatialLayer;
  category?: AssetCategory;
  lowPower?: boolean;
  reducedMotion?: boolean;
}) {
  const profile = useMemo(() => resolveProfile(themeKey, architecture), [themeKey, architecture]);
  const activeCategory = resolveThemeV2Category(layer, category);
  const { primary, secondary, tertiary } = themeAccent(profile);
  const recipe = useMemo(() => create3DAssetRecipe(profile.key, activeCategory), [profile.key, activeCategory]);
  const sceneRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!sceneRef.current || reducedMotion) return;
    sceneRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.06) * 0.035;
  });

  const galaxyPositions: [number, number, number][] = [
    [-4.7, 1.1, -1.8],
    [4.6, -0.25, 0.5],
    [-1.9, -0.8, 4.8],
    [2.0, 1.2, -4.2],
  ];

  const worldPositions: [number, number, number][] = [
    [3.25, 0.85, -0.2],
    [-2.85, -0.5, 1.15],
    [0.7, 1.0, -4.55],
    [0.1, -0.65, 4.4],
  ];

  return (
    <group ref={sceneRef}>
      <Stars radius={42} depth={24} count={lowPower ? 500 : 1200} factor={1.6} saturation={0} fade speed={reducedMotion ? 0 : 0.18} />

      {layer === "universe" ? (
        <>
          <CelestialCore profile={profile} layer="universe" reducedMotion={reducedMotion} />
          <OrbitRing radius={3.5} tilt={0.18} color={primary} opacity={0.82} speed={0.12} reducedMotion={reducedMotion} />
          <OrbitRing radius={5.6} tilt={-0.28} color={secondary} opacity={0.54} speed={-0.08} reducedMotion={reducedMotion} />
          <OrbitRing radius={7.7} tilt={0.46} color={tertiary} opacity={0.32} speed={0.055} reducedMotion={reducedMotion} />
          {galaxyPositions.slice(0, lowPower ? 3 : 4).map((position, i) => <WorldOrb key={i} profile={profile} position={position} scale={0.9 - i * 0.06} index={i} reducedMotion={reducedMotion} label={"Galaxy " + (i + 1)} />)}
          {galaxyPositions.slice(0, lowPower ? 3 : 4).map((position, i) => <EnergyLink key={"link-"+i} from={[0,0,0]} to={position} color={i % 2 ? secondary : primary} />)}
        </>
      ) : null}

      {layer === "galaxy" ? (
        <>
          <CelestialCore profile={profile} layer="galaxy" reducedMotion={reducedMotion} />
          <OrbitRing radius={3.35} tilt={0.2} color={primary} opacity={0.8} speed={0.13} reducedMotion={reducedMotion} />
          <OrbitRing radius={5.15} tilt={-0.34} color={tertiary} opacity={0.4} speed={-0.08} reducedMotion={reducedMotion} />
          {worldPositions.slice(0, lowPower ? 3 : 4).map((position, i) => <WorldOrb key={i} profile={profile} position={position} scale={0.76 - i * 0.04} index={i} reducedMotion={reducedMotion} label={"World " + (i + 1)} />)}
          {worldPositions.slice(0, lowPower ? 3 : 4).map((position, i) => <EnergyLink key={"link-"+i} from={[0,0,0]} to={position} color={i % 2 ? tertiary : primary} />)}
        </>
      ) : null}

      {layer === "world" ? <><CelestialCore profile={profile} layer="world" reducedMotion={reducedMotion} /><OrbitRing radius={4.7} tilt={0.24} color={primary} opacity={0.55} speed={0.08} reducedMotion={reducedMotion} /><DistrictCity profile={profile} lowPower={lowPower} reducedMotion={reducedMotion} /></> : null}
      {layer === "district" ? <><DistrictCity profile={profile} lowPower={lowPower} reducedMotion={reducedMotion} /><BoothCluster profile={profile} lowPower={lowPower} reducedMotion={reducedMotion} /></> : null}
      {layer === "booth" ? <BoothCluster profile={profile} lowPower={lowPower} reducedMotion={reducedMotion} /> : null}
      {layer === "content" ? <ContentCapsules profile={profile} lowPower={lowPower} reducedMotion={reducedMotion} /> : null}
      {layer === "live" ? <LiveStage profile={profile} reducedMotion={reducedMotion} /> : null}

      <group position={[0, -0.12, 0]}>
        {recipe.motion.includes("orbit") ? <OrbitRing radius={layer === "universe" ? 8.2 : layer === "galaxy" ? 6.0 : 4.9} tilt={0.52} color={tertiary} opacity={0.18} speed={0.035} reducedMotion={reducedMotion} /> : null}
      </group>
    </group>
  );
}

export const THEME_V2_MATRIX_SUMMARY = {
  themes: ALLPHA_3D_THEME_PROFILES.length,
  categories: 14,
  templates: ALLPHA_3D_THEME_PROFILES.length * 14,
  schema: "theme-v2-spatial-visual/1.0",
} as const;
