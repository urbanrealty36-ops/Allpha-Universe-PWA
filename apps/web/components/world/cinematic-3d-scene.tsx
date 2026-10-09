"use client";

import { ContactShadows, Float, Sparkles, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { ALLPHA_3D_THEME_PROFILES } from "../../../../packages/design-tokens/3d-visual-language";
import { AdvancedEnvironmentDetail } from "./advanced-environment-detail";

export type CinematicLayer = "universe" | "galaxy" | "orbit" | "world" | "district" | "booth" | "content" | "live";

type Props = {
  themeKey?: string | null;
  layer?: CinematicLayer;
  lowPower?: boolean;
  reducedMotion?: boolean;
  children?: ReactNode;
};

type LightingPreset = {
  key: string;
  keyLight: [number, number, number];
  fillLight: [number, number, number];
  rimLight: [number, number, number];
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  fogDensity: number;
  starFactor: number;
};

const PRESETS: Record<string, LightingPreset> = {
  cosmic: { key: "cosmic", keyLight: [7, 12, 6], fillLight: [-6, 5, 4], rimLight: [2, 7, -8], keyIntensity: 4.1, fillIntensity: 1.4, rimIntensity: 3.2, fogDensity: 0.012, starFactor: 1.0 },
  organic: { key: "organic", keyLight: [5, 13, 5], fillLight: [-7, 4, 6], rimLight: [3, 6, -6], keyIntensity: 3.4, fillIntensity: 1.8, rimIntensity: 2.3, fogDensity: 0.018, starFactor: 0.72 },
  neon: { key: "neon", keyLight: [4, 9, 4], fillLight: [-6, 5, 3], rimLight: [5, 5, -7], keyIntensity: 3.6, fillIntensity: 2.0, rimIntensity: 4.2, fogDensity: 0.015, starFactor: 1.2 },
  warm: { key: "warm", keyLight: [6, 12, 3], fillLight: [-5, 4, 5], rimLight: [3, 7, -6], keyIntensity: 4.5, fillIntensity: 1.2, rimIntensity: 2.5, fogDensity: 0.016, starFactor: 0.55 },
  aquatic: { key: "aquatic", keyLight: [3, 11, 7], fillLight: [-6, 4, 5], rimLight: [4, 5, -8], keyIntensity: 3.2, fillIntensity: 2.2, rimIntensity: 3.5, fogDensity: 0.022, starFactor: 0.45 },
};

function presetForFamily(family: string) {
  if (/oceanic|submerged|living-organic|organic-fantasy|living-earth|tropical/i.test(family)) return PRESETS.organic;
  if (/neon|metropolis|quantum|ai-tech|tropical-megacity/i.test(family)) return PRESETS.neon;
  if (/desert|ancient-cosmic|martian|heroic|industrial/i.test(family)) return PRESETS.warm;
  if (/oceanic|lunar/i.test(family)) return PRESETS.aquatic;
  return PRESETS.cosmic;
}

function darken(hex: string, factor: number) {
  const color = new THREE.Color(hex);
  color.multiplyScalar(factor);
  return "#" + color.getHexString();
}

function CinematicMaterialRealism({ children, reducedMotion, lowPower }: { children?: ReactNode; reducedMotion: boolean; lowPower: boolean }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const group = root.current;
    if (!group) return;
    const t = clock.elapsedTime;
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const materials = Array.isArray(material) ? material : material ? [material] : [];
      for (const item of materials) {
        const pbr = item as THREE.MeshStandardMaterial;
        if (typeof pbr.roughness === "number") {
          const metalness = typeof pbr.metalness === "number" ? pbr.metalness : 0;
          pbr.envMapIntensity = lowPower ? 0.68 : metalness > 0.6 ? 1.2 : 0.92;
          pbr.roughness = Math.max(0.16, Math.min(0.9, pbr.roughness));
          if (pbr.transparent) pbr.depthWrite = false;
        }
        if (pbr.emissive && typeof pbr.emissiveIntensity === "number") {
          const cap = lowPower ? 1.15 : 2.7;
          const base = Math.min(pbr.emissiveIntensity, cap);
          pbr.emissiveIntensity = reducedMotion ? base : base * (0.96 + Math.sin(t * 0.6) * 0.02);
        }
      }
    });
  });
  return <group ref={root}>{children}</group>;
}

function FilmGrain({ accent, reducedMotion, lowPower }: { accent: string; reducedMotion: boolean; lowPower: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.z = t * 0.002;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = lowPower ? 0.018 : 0.028 + Math.sin(t * 0.7) * 0.006;
  });
  return (
    <mesh ref={ref} position={[0, 0, -8]} renderOrder={20}>
      <planeGeometry args={[24, 18]} />
      <meshBasicMaterial color={accent} transparent opacity={0.02} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function CinematicLighting({
  profile,
  layer,
  lowPower,
  reducedMotion,
}: {
  profile: (typeof ALLPHA_3D_THEME_PROFILES)[number] | null;
  layer: CinematicLayer;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const preset = profile ? presetForFamily(profile.family) : PRESETS.cosmic;
  const [accentA, accentB, accentC] = profile?.accent ?? ["#050816", "#42DCFF", "#A77CFF"];
  const intensityScale = lowPower ? 0.72 : 1;
  const fogColor = useMemo(() => darken(accentB, 0.035), [accentB]);
  const particleCount = lowPower ? 28 : layer === "universe" ? 115 : layer === "galaxy" ? 90 : 58;

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    if (keyRef.current) keyRef.current.intensity = preset.keyIntensity * intensityScale * (0.96 + Math.sin(t * 0.42) * 0.025);
    if (rimRef.current) rimRef.current.intensity = preset.rimIntensity * intensityScale * (0.92 + Math.sin(t * 0.7) * 0.06);
  });

  return (
    <>
      <color attach="background" args={[darken(accentA, 0.012)]} />
      <fog attach="fog" args={[fogColor, 10, lowPower ? 34 : 44]} />
      <hemisphereLight args={[accentB, "#02040B", lowPower ? 0.55 : 0.82]} />
      <directionalLight
        ref={keyRef}
        position={preset.keyLight}
        color={accentB}
        intensity={preset.keyIntensity * intensityScale}
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <pointLight position={preset.fillLight} color={accentA} intensity={preset.fillIntensity * intensityScale} distance={28} decay={2} />
      <pointLight ref={rimRef} position={preset.rimLight} color={accentC} intensity={preset.rimIntensity * intensityScale} distance={32} decay={2} />
      <pointLight position={[0, 4, 1]} color={accentA} intensity={lowPower ? 2.2 : 4.5} distance={16} decay={2} />

      {!lowPower && <Stars radius={38} depth={24} count={Math.round(650 * preset.starFactor)} factor={2.2} saturation={0.15} fade speed={reducedMotion ? 0 : 0.18} />}
      <Sparkles
        count={particleCount}
        scale={[18, 10, 18]}
        size={lowPower ? 0.45 : 0.7}
        speed={reducedMotion ? 0 : 0.16}
        opacity={lowPower ? 0.25 : 0.52}
        color={accentB}
      />
      <Sparkles
        count={lowPower ? 12 : 34}
        scale={[12, 7, 12]}
        size={0.55}
        speed={reducedMotion ? 0 : 0.1}
        opacity={0.24}
        color={accentC}
      />

      <ContactShadows
        position={[0, -0.62, 0]}
        opacity={lowPower ? 0.22 : 0.42}
        scale={layer === "universe" ? 15 : 10}
        blur={lowPower ? 2.8 : 2.1}
        far={layer === "universe" ? 11 : 8}
        resolution={lowPower ? 256 : 512}
        color="#000000"
      />
    </>
  );
}

export function Cinematic3DScene({
  themeKey,
  layer = "universe",
  lowPower = false,
  reducedMotion = false,
  children,
}: Props) {
  const profile = ALLPHA_3D_THEME_PROFILES.find((item) => item.key === themeKey) ?? null;
  return (
    <group>
      <CinematicLighting profile={profile} layer={layer} lowPower={lowPower} reducedMotion={reducedMotion} />
      <CinematicMaterialRealism reducedMotion={reducedMotion} lowPower={lowPower} />
      <Float speed={reducedMotion ? 0 : 0.28} rotationIntensity={reducedMotion ? 0 : 0.035} floatIntensity={reducedMotion ? 0 : 0.04}>
        <group>{children}</group>
      </Float>
      {!lowPower && <FilmGrain accent={profile?.accent[1] ?? "#42DCFF"} reducedMotion={reducedMotion} lowPower={lowPower} />}
    </group>
  );
}

export function configureCinematicRenderer(gl: THREE.WebGLRenderer, lowPower = false) {
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = lowPower ? 1.0 : 1.16;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.shadowMap.enabled = !lowPower;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
}
