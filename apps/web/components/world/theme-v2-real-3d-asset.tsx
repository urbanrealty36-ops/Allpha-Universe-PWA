"use client";

import { Float, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ALLPHA_3D_THEME_PROFILES, type Allpha3DThemeProfile } from "../../../../packages/design-tokens/3d-visual-language";
import { ASSET_CATEGORIES, type AssetCategory } from "../../lib/world-engine/asset-factory";

export type Real3DSpatialLayer = "universe" | "galaxy" | "orbit" | "world" | "district" | "booth" | "content" | "live";

const categoryByLayer: Record<Real3DSpatialLayer, AssetCategory> = {
  universe: "universe",
  galaxy: "galaxy",
  orbit: "orbit",
  world: "world",
  district: "district",
  booth: "booth",
  content: "content-feed",
  live: "live-stage",
};

const profileMap = new Map(ALLPHA_3D_THEME_PROFILES.map((p) => [p.key, p]));

type Motif =
  | "crystal" | "samurai" | "clockwork" | "coral" | "cyber" | "desert" | "dragon" | "carnival"
  | "rainforest" | "garden" | "space" | "hero" | "aether" | "lunar" | "mars" | "academy"
  | "jakarta" | "tokyo" | "nusantara" | "atlantis" | "pharaoh" | "quantum" | "savanna" | "forge" | "fjord";

function motifFor(profile: Allpha3DThemeProfile): Motif {
  const key = profile.key;
  if (key === "aurora-kingdom") return "crystal";
  if (key === "celestial-samurai") return "samurai";
  if (key === "chronos-realm") return "clockwork";
  if (key === "coral-metropolis") return "coral";
  if (key === "crystal-ai-city") return "cyber";
  if (key === "desert-starfall") return "desert";
  if (key === "dragon-dominion") return "dragon";
  if (key === "dream-carnival") return "carnival";
  if (key === "emerald-rainforest") return "rainforest";
  if (key === "floating-garden") return "garden";
  if (key === "galactic-frontier") return "space";
  if (key === "heroic-nexus") return "hero";
  if (key === "kingdom-of-aether") return "aether";
  if (key === "lunar-frontier") return "lunar";
  if (key === "mars-frontier") return "mars";
  if (key === "mystic-academy") return "academy";
  if (key === "neo-jakarta-2099") return "jakarta";
  if (key === "neon-tokyo") return "tokyo";
  if (key === "nusantara-raya") return "nusantara";
  if (key === "oceanic-atlantis") return "atlantis";
  if (key === "pharaoh-eternal") return "pharaoh";
  if (key === "quantum-city") return "quantum";
  if (key === "savanna-spirit") return "savanna";
  if (key === "skyforge-empire") return "forge";
  return "fjord";
}

function hashSeed(value: string) {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function rand(seed: number, i: number, min: number, max: number) {
  const x = Math.sin((seed + i * 9973) * 0.000001) * 43758.5453;
  return min + (x - Math.floor(x)) * (max - min);
}

function v3(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}

function material(color: string, emissive: string, intensity: number, metalness = 0.45, roughness = 0.28, transparent = false, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    metalness,
    roughness,
    transparent,
    opacity,
  });
}

function MotifStructure({ motif, profile, seed, scale = 1, accent = false }: {
  motif: Motif;
  profile: Allpha3DThemeProfile;
  seed: number;
  scale?: number;
  accent?: boolean;
}) {
  const [a, b, c] = profile.accent;
  const core = material(a, a, accent ? 1.7 : 0.75, 0.48, 0.25);
  const metal = material(c, c, accent ? 1.0 : 0.25, 0.82, 0.24);
  const glass = material(b, b, 0.55, 0.18, 0.16, true, 0.64);
  const organic = material(b, b, 0.18, 0.05, 0.72);
  const s = scale;
  const n = (i: number, lo: number, hi: number) => rand(seed, i, lo, hi);

  switch (motif) {
    case "crystal":
      return <group scale={s}>
        <mesh position={[0, 1.3, 0]} castShadow><coneGeometry args={[0.82, 2.7, 6]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0.45, 0.85, 0.2]} rotation={[0.18, 0.45, -0.22]}><coneGeometry args={[0.34, 1.7, 5]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[-0.42, 0.62, -0.18]} rotation={[-0.1, -0.5, 0.18]}><coneGeometry args={[0.28, 1.25, 5]} /><primitive object={glass.clone()} attach="material" /></mesh>
      </group>;
    case "samurai":
      return <group scale={s}>
        <mesh position={[0, 1.15, 0]}><cylinderGeometry args={[0.72, 0.9, 2.1, 8]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.28, 0]}><coneGeometry args={[1.0, 0.52, 8]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.58, 0]}><cylinderGeometry args={[0.08, 0.08, 1.0, 8]} /><primitive object={glass.clone()} attach="material" /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.28, 0]}><torusGeometry args={[0.98, 0.035, 8, 40]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "clockwork":
      return <group scale={s}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.0, 0.18, 12, 48]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh rotation={[Math.PI / 2, 0.4, 0.2]}><torusGeometry args={[0.58, 0.10, 10, 36]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.32, 0.32, 1.6, 12]} /><primitive object={glass.clone()} attach="material" /></mesh>
        {Array.from({ length: 6 }).map((_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.78, 0, Math.sin(i * Math.PI / 3) * 0.78]} rotation={[0, i * Math.PI / 3, 0]}><boxGeometry args={[0.08, 0.72, 0.24]} /><primitive object={metal.clone()} attach="material" /></mesh>)}
      </group>;
    case "coral":
      return <group scale={s}>
        <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.42, 0.62, 1.5, 9]} /><primitive object={organic.clone()} attach="material" /></mesh>
        {[0, 1, 2].map((i) => <mesh key={i} position={[(i - 1) * 0.48, 1.35 + i * 0.25, Math.sin(i) * 0.22]} rotation={[0.15 * i, 0.35 * i, (i - 1) * 0.35]}><cylinderGeometry args={[0.16, 0.28, 1.5 + i * 0.28, 8]} /><primitive object={core.clone()} attach="material" /></mesh>)}
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.0, 0.05, 8, 48]} /><primitive object={glass.clone()} attach="material" /></mesh>
      </group>;
    case "cyber":
    case "jakarta":
    case "tokyo":
      return <group scale={s}>
        {Array.from({ length: 5 }).map((_, i) => {
          const w = 0.48 + n(i, 0, 0.38);
          const h = 1.3 + n(i + 9, 0, 2.2);
          const x = (i - 2) * 0.62;
          return <group key={i} position={[x, h / 2, (i % 2) * 0.45 - 0.22]}>
            <mesh castShadow><boxGeometry args={[w, h, 0.62 + n(i + 20, 0, 0.4)]} /><primitive object={i % 2 ? glass.clone() : metal.clone()} attach="material" /></mesh>
            <mesh position={[0, h * 0.28, 0.34]}><boxGeometry args={[w * 0.78, 0.06, 0.04]} /><primitive object={core.clone()} attach="material" /></mesh>
          </group>;
        })}
        <mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[1.65, 0.055, 8, 64]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "desert":
    case "pharaoh":
      return <group scale={s}>
        <mesh position={[0, 1.15, 0]}><coneGeometry args={[1.25, 2.3, 4]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[1.1, 0.62, -0.35]}><boxGeometry args={[0.24, 1.25, 0.24]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[-1.0, 0.45, 0.3]}><boxGeometry args={[0.18, 0.9, 0.18]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}><torusGeometry args={[1.5, 0.06, 8, 48]} /><primitive object={glass.clone()} attach="material" /></mesh>
      </group>;
    case "dragon":
      return <group scale={s}>
        <mesh position={[0, 0.75, 0]}><dodecahedronGeometry args={[1.05, 1]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.75, 0]} rotation={[0.15, 0, 0]}><torusGeometry args={[0.92, 0.09, 8, 48]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[0.1, 2.08, 0]}><coneGeometry args={[0.26, 0.85, 5]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "carnival":
      return <group scale={s}>
        <mesh position={[0, 1.05, 0]}><coneGeometry args={[1.15, 1.75, 12]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.0, 0]}><sphereGeometry args={[0.18, 16, 12]} /><primitive object={glass.clone()} attach="material" /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.25, 0.05, 8, 64]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh rotation={[0.35, 0.2, 0.25]}><torusGeometry args={[1.0, 0.035, 8, 56]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "rainforest":
    case "savanna":
    case "garden":
      return <group scale={s}>
        <mesh position={[0, 0.95, 0]}><cylinderGeometry args={[0.28, 0.46, 1.9, 8]} /><primitive object={organic.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.05, 0]} scale={[1.15, 0.8, 1.15]}><dodecahedronGeometry args={[0.9, 1]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[0.7, 1.45, 0.3]} rotation={[0.2, 0.5, 0.5]}><torusGeometry args={[0.72, 0.055, 8, 40]} /><primitive object={glass.clone()} attach="material" /></mesh>
      </group>;
    case "space":
    case "lunar":
    case "mars":
      return <group scale={s}>
        <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[1.05, 1.22, 0.9, 12]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.2, 0]} scale={[1.0, 0.62, 1.0]}><sphereGeometry args={[0.92, 20, 14]} /><primitive object={glass.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.55, 0]}><cylinderGeometry args={[0.07, 0.07, 1.0, 8]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.45, 0.04, 8, 56]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "hero":
      return <group scale={s}>
        <mesh position={[0, 1.25, 0]}><boxGeometry args={[0.72, 2.5, 0.72]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.65, 0]}><octahedronGeometry args={[0.42, 1]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.1, 0.06, 8, 64]} /><primitive object={glass.clone()} attach="material" /></mesh>
      </group>;
    case "aether":
      return <group scale={s}>
        <mesh position={[0, 0.2, 0]} rotation={[0.18, 0.1, 0]}><cylinderGeometry args={[1.15, 0.72, 0.32, 6]} /><primitive object={glass.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.05, 0]}><coneGeometry args={[0.82, 1.7, 8]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh rotation={[0.5, 0, 0.3]}><torusGeometry args={[1.2, 0.045, 8, 64]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "academy":
      return <group scale={s}>
        <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.72, 0.86, 2.2, 10]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.45, 0]}><coneGeometry args={[0.9, 0.8, 8]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.05, 0.035, 8, 48]} /><primitive object={glass.clone()} attach="material" /></mesh>
      </group>;
    case "nusantara":
      return <group scale={s}>
        <mesh position={[0, 0.85, 0]}><boxGeometry args={[1.45, 1.3, 1.15]} /><primitive object={organic.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.9, 0]}><coneGeometry args={[1.25, 0.95, 4]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.4, 0]}><sphereGeometry args={[0.13, 12, 10]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "atlantis":
      return <group scale={s}>
        <mesh position={[0, 0.7, 0]} scale={[1.15, 0.72, 1.15]}><sphereGeometry args={[1.05, 20, 14]} /><primitive object={glass.clone()} attach="material" /></mesh>
        {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, 0.62, 0]}><cylinderGeometry args={[0.12, 0.18, 1.25, 8]} /><primitive object={metal.clone()} attach="material" /></mesh>)}
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.25, 0.05, 8, 56]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "quantum":
      return <group scale={s}>
        {[0, 1, 2].map((i) => <mesh key={i} position={[(i - 1) * 0.55, 1.0 + i * 0.35, (i % 2) * 0.4 - 0.2]} rotation={[0.15 * i, 0.2 * i, 0.1]}><boxGeometry args={[0.9, 0.9, 0.9]} /><meshStandardMaterial color={i === 1 ? a : b} emissive={i === 1 ? a : b} emissiveIntensity={0.7} wireframe /></mesh>)}
        <mesh position={[0, 1.05, 0]}><icosahedronGeometry args={[0.45, 2]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "forge":
      return <group scale={s}>
        <mesh position={[-0.7, 1.0, 0]}><boxGeometry args={[0.65, 2.0, 0.65]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0.7, 1.35, 0]}><boxGeometry args={[0.65, 2.7, 0.65]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 2.5, 8]} /><primitive object={core.clone()} attach="material" /></mesh>
        <mesh position={[0, 2.45, 0]}><sphereGeometry args={[0.18, 12, 10]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
    case "fjord":
      return <group scale={s}>
        <mesh position={[-0.62, 0.7, 0]} rotation={[0.12, 0, -0.1]}><coneGeometry args={[0.8, 1.7, 5]} /><primitive object={metal.clone()} attach="material" /></mesh>
        <mesh position={[0.62, 0.62, -0.1]} rotation={[-0.08, 0.2, 0.08]}><coneGeometry args={[0.72, 1.55, 5]} /><primitive object={glass.clone()} attach="material" /></mesh>
        <mesh position={[0, 0.58, 0.2]}><boxGeometry args={[1.0, 0.7, 1.25]} /><primitive object={organic.clone()} attach="material" /></mesh>
        <mesh position={[0, 1.1, 0.2]}><coneGeometry args={[0.88, 0.62, 4]} /><primitive object={core.clone()} attach="material" /></mesh>
      </group>;
  }
}

function Portal({ profile, motif, radius = 1.25, reducedMotion }: { profile: Allpha3DThemeProfile; motif: Motif; radius?: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [a, b] = profile.accent;
  useFrame(({ clock }) => {
    if (ref.current && !reducedMotion) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.035;
  });
  const shape = motif === "samurai" ? "torii" : motif === "pharaoh" || motif === "desert" ? "solar" : motif === "coral" || motif === "atlantis" ? "tidal" : "ring";
  return <group ref={ref}>
    {shape === "torii" ? <group>
      <mesh position={[ -radius * 0.72, radius * 0.7, 0 ]}><boxGeometry args={[0.18, radius * 1.5, 0.28]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={1.0} /></mesh>
      <mesh position={[ radius * 0.72, radius * 0.7, 0 ]}><boxGeometry args={[0.18, radius * 1.5, 0.28]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={1.0} /></mesh>
      <mesh position={[0, radius * 1.42, 0]}><boxGeometry args={[radius * 1.8, 0.18, 0.3]} /><meshStandardMaterial color={b} emissive={b} emissiveIntensity={0.9} /></mesh>
      <mesh position={[0, radius * 1.17, 0]}><boxGeometry args={[radius * 1.5, 0.12, 0.25]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.7} /></mesh>
    </group> : <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, radius * 0.07, 12, 72]} />
      <meshStandardMaterial color={a} emissive={b} emissiveIntensity={1.5} metalness={0.42} roughness={0.2} />
    </mesh>}
    <mesh position={[0, radius * 0.75, 0]}>
      <sphereGeometry args={[radius * 0.14, 16, 12]} />
      <meshStandardMaterial color={b} emissive={b} emissiveIntensity={1.8} />
    </mesh>
  </group>;
}

function RealAssetScene({ profile, category, lowPower, reducedMotion }: {
  profile: Allpha3DThemeProfile;
  category: AssetCategory;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  const motif = motifFor(profile);
  const seed = hashSeed(profile.key + ":" + category);
  const [a, b, c] = profile.accent;
  const root = useRef<THREE.Group>(null);
  const count = lowPower ? 4 : 7;

  useFrame(({ clock }) => {
    if (root.current && !reducedMotion) {
      root.current.rotation.y = Math.sin(clock.elapsedTime * 0.055) * 0.045;
      root.current.position.y = Math.sin(clock.elapsedTime * 0.32) * 0.025;
    }
  });

  const positions = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rand(seed, i, -0.12, 0.12);
    const radius = category === "universe" ? 4.2 + (i % 2) * 1.3 : category === "world" ? 3.0 + (i % 3) * 0.7 : 2.1 + (i % 2) * 0.45;
    return [Math.cos(angle) * radius, 0.15 + (i % 3) * 0.3, Math.sin(angle) * radius] as [number, number, number];
  }), [category, count, seed]);

  if (category === "agent-character" || category === "human-live") {
    return <group ref={root}>
      <mesh position={[0, 1.55, 0]} castShadow><capsuleGeometry args={[0.52, 1.65, 10, 18]} /><meshStandardMaterial color={c} metalness={0.3} roughness={0.42} /></mesh>
      <mesh position={[0, 2.72, 0]}><sphereGeometry args={[0.42, 24, 18]} /><meshStandardMaterial color="#E7C1B2" roughness={0.62} /></mesh>
      <mesh position={[0, 2.86, -0.04]} scale={[1.05, 0.55, 1.0]}><sphereGeometry args={[0.43, 20, 14]} /><meshStandardMaterial color={a} roughness={0.65} /></mesh>
      <mesh position={[-0.54, 1.65, 0]} rotation={[0, 0, -0.16]}><capsuleGeometry args={[0.12, 1.0, 8, 12]} /><meshStandardMaterial color="#E7C1B2" /></mesh>
      <mesh position={[0.54, 1.65, 0]} rotation={[0, 0, 0.16]}><capsuleGeometry args={[0.12, 1.0, 8, 12]} /><meshStandardMaterial color="#E7C1B2" /></mesh>
      <mesh position={[-0.2, 0.48, 0]}><capsuleGeometry args={[0.14, 1.25, 8, 12]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0.2, 0.48, 0]}><capsuleGeometry args={[0.14, 1.25, 8, 12]} /><meshStandardMaterial color={c} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.82, 0.04, 8, 56]} /><meshStandardMaterial color={b} emissive={a} emissiveIntensity={1.5} transparent opacity={0.82} /></mesh>
      <MotifStructure motif={motif} profile={profile} seed={seed + 7} scale={0.34} accent />
    </group>;
  }

  if (category === "navigation-fx") {
    return <group ref={root}>
      <Portal profile={profile} motif={motif} radius={1.6} reducedMotion={reducedMotion} />
      <mesh position={[0, 2.0, 0]}><cylinderGeometry args={[0.055, 0.09, 3.8, 8]} /><meshStandardMaterial color={b} emissive={b} emissiveIntensity={1.8} /></mesh>
      <Sparkles count={lowPower ? 24 : 70} scale={[4, 4, 2]} size={0.55} speed={reducedMotion ? 0 : 0.25} color={a} />
    </group>;
  }

  if (category === "animation") {
    return <group ref={root}>
      <MotifStructure motif={motif} profile={profile} seed={seed} scale={0.65} accent />
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.8, 0.035, 8, 64]} /><meshStandardMaterial color={b} emissive={b} emissiveIntensity={1.3} transparent opacity={0.72} /></mesh>
      <mesh rotation={[0.5, 0.3, 0]}><torusGeometry args={[2.35, 0.025, 8, 64]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.1} transparent opacity={0.5} /></mesh>
    </group>;
  }

  if (category === "sticker-social") {
    return <group ref={root}>
      <mesh scale={[1.0, 0.78, 0.35]} rotation={[0, 0, 0.12]}><sphereGeometry args={[1.1, 24, 16]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.75} /></mesh>
      <MotifStructure motif={motif} profile={profile} seed={seed + 11} scale={0.48} accent />
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.45, 0.045, 8, 48]} /><meshStandardMaterial color={b} emissive={b} emissiveIntensity={1.2} /></mesh>
    </group>;
  }

  if (category === "capsule" || category === "content-feed") {
    return <group ref={root}>
      <Float speed={0.7} floatIntensity={reducedMotion ? 0 : 0.08}>
        <mesh rotation={[0.15, 0.2, 0]}><capsuleGeometry args={[0.65, 1.25, 10, 18]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.75} metalness={0.28} roughness={0.2} /></mesh>
        <mesh position={[0, 0.1, 0.62]}><boxGeometry args={[0.82, 0.58, 0.08]} /><meshStandardMaterial color={b} emissive={b} emissiveIntensity={0.7} transparent opacity={0.7} /></mesh>
        <MotifStructure motif={motif} profile={profile} seed={seed + 13} scale={0.34} />
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.18, 0.035, 8, 56]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.2} transparent opacity={0.78} /></mesh>
      </Float>
    </group>;
  }

  if (category === "booth") {
    return <group ref={root}>
      <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[2.0, 2.2, 0.35, 48]} /><meshStandardMaterial color="#07101D" metalness={0.72} roughness={0.25} /></mesh>
      <MotifStructure motif={motif} profile={profile} seed={seed + 17} scale={0.82} accent />
      <Portal profile={profile} motif={motif} radius={0.72} reducedMotion={reducedMotion} />
    </group>;
  }

  if (category === "live-stage") {
    return <group ref={root}>
      <mesh position={[0, -0.18, 0]}><boxGeometry args={[5.4, 0.42, 3.8]} /><meshStandardMaterial color="#07101D" metalness={0.78} roughness={0.23} /></mesh>
      <mesh position={[0, 1.55, -1.45]}><boxGeometry args={[4.8, 2.7, 0.12]} /><meshStandardMaterial color={b} emissive={b} emissiveIntensity={0.45} transparent opacity={0.58} /></mesh>
      <MotifStructure motif={motif} profile={profile} seed={seed + 19} scale={0.72} accent />
      <Portal profile={profile} motif={motif} radius={1.35} reducedMotion={reducedMotion} />
      <Sparkles count={lowPower ? 22 : 65} scale={[5, 3.5, 3]} size={0.5} speed={reducedMotion ? 0 : 0.18} color={a} />
    </group>;
  }

  if (category === "orbit") {
    return <group ref={root}>
      {[2.4, 3.5, 4.6].map((radius, i) => <mesh key={radius} rotation={[0.2 + i * 0.22, i * 0.35, i * 0.12]}>
        <torusGeometry args={[radius, 0.035 + i * 0.01, 8, 72]} />
        <meshStandardMaterial color={i === 0 ? a : i === 1 ? b : c} emissive={i === 0 ? a : i === 1 ? b : c} emissiveIntensity={1.0} transparent opacity={0.62 - i * 0.12} />
      </mesh>)}
      {positions.slice(0, lowPower ? 4 : 7).map((p, i) => <group key={i} position={p}><MotifStructure motif={motif} profile={profile} seed={seed + i} scale={0.22} /></group>)}
    </group>;
  }

  if (category === "galaxy") {
    return <group ref={root}>
      <MotifStructure motif={motif} profile={profile} seed={seed} scale={0.85} accent />
      {positions.slice(0, lowPower ? 3 : 5).map((p, i) => <group key={i} position={[p[0], p[1] + 0.3, p[2]]}><MotifStructure motif={motif} profile={profile} seed={seed + 30 + i} scale={0.38} /></group>)}
      {[3.2, 4.5].map((radius, i) => <mesh key={radius} rotation={[0.35 + i * 0.25, 0, 0]}><torusGeometry args={[radius, 0.035, 8, 72]} /><meshStandardMaterial color={i ? b : a} emissive={i ? b : a} emissiveIntensity={1.0} transparent opacity={0.5 - i * 0.12} /></mesh>)}
    </group>;
  }

  if (category === "universe") {
    return <group ref={root}>
      <mesh><icosahedronGeometry args={[1.25, 3]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={1.2} metalness={0.3} roughness={0.2} /></mesh>
      {[3.6, 5.3, 7.0].map((radius, i) => <mesh key={radius} rotation={[0.2 + i * 0.23, i * 0.2, i * 0.12]}>
        <torusGeometry args={[radius, 0.045 - i * 0.007, 8, 80]} />
        <meshStandardMaterial color={i === 0 ? a : i === 1 ? b : c} emissive={i === 0 ? a : i === 1 ? b : c} emissiveIntensity={1.1} transparent opacity={0.68 - i * 0.15} />
      </mesh>)}
      {positions.slice(0, lowPower ? 3 : 5).map((p, i) => <group key={i} position={p}><MotifStructure motif={motif} profile={profile} seed={seed + 40 + i} scale={0.32} /></group>)}
      <Sparkles count={lowPower ? 80 : 220} scale={[16, 10, 16]} size={0.7} speed={reducedMotion ? 0 : 0.16} color={b} />
    </group>;
  }

  return <group ref={root}>
    <mesh position={[0, -0.55, 0]} receiveShadow><cylinderGeometry args={[5.2, 5.8, 0.55, lowPower ? 32 : 56]} /><meshStandardMaterial color="#07101D" metalness={0.7} roughness={0.28} /></mesh>
    <mesh position={[0, -0.24, 0]}><cylinderGeometry args={[4.7, 5.0, 0.14, lowPower ? 32 : 56]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.22} transparent opacity={0.52} /></mesh>
    {positions.map((p, i) => <group key={i} position={p}><MotifStructure motif={motif} profile={profile} seed={seed + 100 + i} scale={0.72 + (i % 3) * 0.11} accent={i === 0} /></group>)}
    <Portal profile={profile} motif={motif} radius={1.35} reducedMotion={reducedMotion} />
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><torusGeometry args={[4.9, 0.04, 8, 72]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.0} transparent opacity={0.58} /></mesh>
  </group>;
}

export function resolveReal3DThemeProfile(themeKey?: string | null, architecture?: string | null) {
  if (themeKey && profileMap.has(themeKey)) return profileMap.get(themeKey)!;
  const normalized = String(architecture ?? "").trim().toLowerCase();
  return ALLPHA_3D_THEME_PROFILES.find((p) =>
    p.key === normalized || p.key.replaceAll("-", " ") === normalized || p.landmark.toLowerCase() === normalized,
  ) ?? profileMap.get("crystal-ai-city")!;
}

export function ThemeV2Real3DAsset({
  themeKey,
  architecture,
  layer = "universe",
  category,
  lowPower = false,
  reducedMotion = false,
}: {
  themeKey?: string | null;
  architecture?: string | null;
  layer?: Real3DSpatialLayer;
  category?: AssetCategory;
  lowPower?: boolean;
  reducedMotion?: boolean;
}) {
  const profile = useMemo(() => resolveReal3DThemeProfile(themeKey, architecture), [themeKey, architecture]);
  const activeCategory = category ?? categoryByLayer[layer];
  return <RealAssetScene profile={profile} category={activeCategory} lowPower={lowPower} reducedMotion={reducedMotion} />;
}

export const REAL_3D_THEME_TEMPLATE_COUNTS = {
  themes: ALLPHA_3D_THEME_PROFILES.length,
  categories: ASSET_CATEGORIES.length,
  templates: ALLPHA_3D_THEME_PROFILES.length * ASSET_CATEGORIES.length,
  legacyPlaceholderPack: true,
  schema: "theme-v2-real-3d/1.0",
} as const;
