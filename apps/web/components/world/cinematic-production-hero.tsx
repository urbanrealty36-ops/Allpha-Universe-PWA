"use client";

import { Float, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ALLPHA_3D_THEME_PROFILES } from "../../../../packages/design-tokens/3d-visual-language";
import { ThemeV2ProductionAssetScene } from "./theme-v2-production-asset-scene";

type Props = {
  themeKey?: string | null;
  lowPower?: boolean;
  reducedMotion?: boolean;
};

function RuntimeMaterial({ color, emission = color, intensity = 0.7, opacity = 1 }: {
  color: string;
  emission?: string;
  intensity?: number;
  opacity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={0.42}
      roughness={0.24}
      emissive={emission}
      emissiveIntensity={intensity}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function HeroAtmosphere({ primary, secondary, lowPower, reducedMotion }: {
  primary: string;
  secondary: string;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  const root = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!root.current || reducedMotion) return;
    root.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.035;
    root.current.rotation.z = Math.sin(clock.elapsedTime * 0.05) * 0.012;
  });

  return (
    <group ref={root}>
      <mesh position={[0, -0.65, -1.5]} receiveShadow>
        <cylinderGeometry args={[7.8, 8.3, 0.28, lowPower ? 48 : 96]} />
        <RuntimeMaterial color="#020714" emission={primary} intensity={0.08} />
      </mesh>

      <mesh position={[0, -0.42, -0.95]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 7.2, lowPower ? 64 : 128]} />
        <RuntimeMaterial color={primary} emission={primary} intensity={0.38} opacity={0.18} />
      </mesh>

      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          position={[0, 2.8 + index * 0.7, -1.6]}
          rotation={[
            0.16 + index * 0.13,
            index * 0.16,
            0.2 + index * 0.32,
          ]}
        >
          <torusGeometry
            args={[
              4.8 + index * 0.9,
              0.018 + index * 0.006,
              8,
              lowPower ? 64 : 128,
            ]}
          />
          <RuntimeMaterial
            color={index % 2 ? secondary : primary}
            emission={index % 2 ? secondary : primary}
            intensity={1.2}
            opacity={0.22}
          />
        </mesh>
      ))}
    </group>
  );
}

function GoldenCharacterAccent({ primary, lowPower, reducedMotion }: {
  primary: string;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  const root = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!root.current || reducedMotion) return;
    root.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.018;
  });

  return (
    <group ref={root} position={[0, -0.1, 3.25]} scale={0.9}>
      <mesh position={[0, 1.55, 0]} castShadow>
        <capsuleGeometry args={[0.39, 1.08, 10, 20]} />
        <RuntimeMaterial color="#081327" emission={primary} intensity={0.18} />
      </mesh>
      <mesh position={[0, 2.48, 0]}>
        <sphereGeometry args={[0.35, lowPower ? 20 : 32, lowPower ? 14 : 22]} />
        <meshStandardMaterial color="#d7a995" roughness={0.48} />
      </mesh>
      <mesh position={[0, 2.67, -0.015]} scale={[1.05, 0.55, 1.0]}>
        <sphereGeometry args={[0.36, lowPower ? 18 : 28, lowPower ? 12 : 18]} />
        <RuntimeMaterial color="#07101f" emission={primary} intensity={0.1} />
      </mesh>
      <mesh position={[0, 2.48, -0.335]}>
        <boxGeometry args={[0.25, 0.055, 0.025]} />
        <RuntimeMaterial color={primary} emission={primary} intensity={3.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <torusGeometry args={[0.86, 0.028, 8, lowPower ? 32 : 64]} />
        <RuntimeMaterial color={primary} emission={primary} intensity={1.7} opacity={0.72} />
      </mesh>
    </group>
  );
}

export function CinematicProductionHero({
  themeKey,
  lowPower = false,
  reducedMotion = false,
}: Props) {
  const profile =
    ALLPHA_3D_THEME_PROFILES.find((item) => item.key === themeKey) ??
    ALLPHA_3D_THEME_PROFILES.find((item) => item.key === "crystal-ai-city")!;

  const [primary, secondary, accent] = profile.accent;
  const theme = profile.key;

  const cameraTarget = useMemo(
    () => (theme === "crystal-ai-city" ? [0, 2.7, 0] : [0, 2.5, 0]),
    [theme],
  );

  return (
    <group>
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[7, 11, 8]}
        intensity={3.8}
        color={secondary}
        castShadow={!lowPower}
      />
      <pointLight position={[-5, 4, 5]} intensity={2.2} distance={22} color={primary} />
      <pointLight position={[5, 3, -5]} intensity={2.6} distance={24} color={accent} />

      <HeroAtmosphere
        primary={primary}
        secondary={secondary}
        lowPower={lowPower}
        reducedMotion={reducedMotion}
      />

      {/* V2.13A production asset is now the focal scene. Blender remains the art source of truth. */}
      <group position={[0, -0.15, -0.7]} scale={1.0}>
        <ThemeV2ProductionAssetScene
          themeKey={theme}
          category="universe"
          lowPower={lowPower}
          reducedMotion={reducedMotion}
          fallback={null}
        />
      </group>

      <GoldenCharacterAccent
        primary={primary}
        lowPower={lowPower}
        reducedMotion={reducedMotion}
      />

      <Float
        speed={reducedMotion ? 0 : 0.18}
        rotationIntensity={reducedMotion ? 0 : 0.035}
        floatIntensity={reducedMotion ? 0 : 0.035}
      >
        <Sparkles
          count={lowPower ? 28 : 100}
          scale={[15, 11, 16]}
          size={lowPower ? 0.4 : 0.62}
          speed={reducedMotion ? 0 : 0.08}
          opacity={0.36}
          color={secondary}
        />
      </Float>

      {/* Keep the target explicit for camera compositions that consume the hero scene. */}
      <group position={cameraTarget as [number, number, number]} visible={false} />
    </group>
  );
}
