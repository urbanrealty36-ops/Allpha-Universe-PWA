"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ALLPHA_3D_THEME_PROFILES } from "../../../../packages/design-tokens/3d-visual-language";

type Props = {
  themeKey?: string | null;
  lowPower?: boolean;
  reducedMotion?: boolean;
};

function pbr(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.55,
    roughness: 0.24,
    ...opts,
  });
}

function CityTower({ x, z, height, width, primary, accent, index }: {
  x: number; z: number; height: number; width: number; primary: string; accent: string; index: number;
}) {
  const windows = Math.max(2, Math.floor(height * 1.2));
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, width * 0.72]} />
        <primitive object={pbr(primary, { metalness: 0.78, roughness: 0.2 })} attach="material" />
      </mesh>
      {Array.from({ length: windows }).map((_, row) => (
        <group key={row} position={[0, 0.35 + row * ((height - 0.7) / Math.max(1, windows - 1)), -width * 0.37]}>
          <mesh position={[-width * 0.22, 0, 0]}>
            <boxGeometry args={[width * 0.16, 0.075, 0.018]} />
            <primitive object={pbr(accent, { emissive: accent, emissiveIntensity: 2.2, metalness: 0.05, roughness: 0.18 })} attach="material" />
          </mesh>
          <mesh position={[width * 0.22, 0, 0]}>
            <boxGeometry args={[width * 0.16, 0.075, 0.018]} />
            <primitive object={pbr(accent, { emissive: accent, emissiveIntensity: 1.5, metalness: 0.05, roughness: 0.18 })} attach="material" />
          </mesh>
        </group>
      ))}
      {index % 3 === 0 ? (
        <mesh position={[0, height + 0.25, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
          <primitive object={pbr(accent, { emissive: accent, emissiveIntensity: 3 })} attach="material" />
        </mesh>
      ) : null}
    </group>
  );
}

function Character({ primary, accent }: { primary: string; accent: string }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.position.y = Math.sin(clock.elapsedTime * 1.1) * 0.025;
    root.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.035;
  });
  return (
    <group ref={root} position={[0, 0.2, 2.7]} scale={0.92}>
      <mesh position={[0, 1.55, 0]} castShadow>
        <capsuleGeometry args={[0.38, 1.05, 8, 18]} />
        <primitive object={pbr(primary, { metalness: 0.72, roughness: 0.22 })} attach="material" />
      </mesh>
      <mesh position={[0, 2.48, 0]} castShadow>
        <sphereGeometry args={[0.34, 28, 20]} />
        <meshStandardMaterial color="#d7a995" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.7, 0.01]}>
        <sphereGeometry args={[0.36, 24, 16]} />
        <primitive object={pbr(primary, { metalness: 0.1, roughness: 0.62 })} attach="material" />
      </mesh>
      <mesh position={[0, 1.55, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.028, 8, 48]} />
        <primitive object={pbr(accent, { emissive: accent, emissiveIntensity: 2.4, transparent: true, opacity: 0.78 })} attach="material" />
      </mesh>
    </group>
  );
}

function OrbitSystem({ accent, secondary, reducedMotion }: { accent: string; secondary: string; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!root.current || reducedMotion) return;
    root.current.rotation.y = clock.elapsedTime * 0.045;
    root.current.rotation.z = Math.sin(clock.elapsedTime * 0.16) * 0.025;
  });
  return (
    <group ref={root} position={[0, 2.8, -0.8]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.8, 0.045, 12, 128]} />
        <primitive object={pbr(accent, { emissive: accent, emissiveIntensity: 2.0, transparent: true, opacity: 0.72 })} attach="material" />
      </mesh>
      <mesh rotation={[Math.PI / 2 + 0.35, 0.2, 0.18]}>
        <torusGeometry args={[5.5, 0.028, 10, 112]} />
        <primitive object={pbr(secondary, { emissive: secondary, emissiveIntensity: 1.4, transparent: true, opacity: 0.52 })} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.05, 48, 32]} />
        <meshStandardMaterial color="#07162c" roughness={0.62} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0, 1.9]}>
        <sphereGeometry args={[1.88, 48, 32]} />
        <primitive object={pbr(accent, { emissive: accent, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.25 })} attach="material" />
      </mesh>
    </group>
  );
}

function AtmosphericRibbons({ accent, secondary, reducedMotion }: { accent: string; secondary: string; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!root.current || reducedMotion) return;
    root.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.06;
  });
  return (
    <group ref={root}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0.15 + i * 0.18, 0.2, i * 0.55]} position={[0, 2.5 + i * 0.8, -1]}>
          <torusGeometry args={[4.2 + i * 0.8, 0.018, 8, 96]} />
          <primitive object={pbr(i % 2 ? secondary : accent, { emissive: i % 2 ? secondary : accent, emissiveIntensity: 1.5, transparent: true, opacity: 0.2 })} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

export function CinematicProductionHero({ themeKey, lowPower = false, reducedMotion = false }: Props) {
  const profile = ALLPHA_3D_THEME_PROFILES.find((item) => item.key === themeKey) ?? ALLPHA_3D_THEME_PROFILES.find((item) => item.key === "crystal-ai-city")!;
  const [primary, secondary, accent] = profile.accent;
  const towers = useMemo(() => {
    const result: Array<{ x: number; z: number; h: number; w: number; i: number }> = [];
    const count = lowPower ? 12 : 24;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.1 + (i % 4) * 0.75;
      result.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius - 0.6,
        h: 1.8 + (i % 5) * 0.55,
        w: 0.38 + (i % 3) * 0.1,
        i,
      });
    }
    return result;
  }, [lowPower]);

  return (
    <group>
      <ambientLight intensity={0.18} />
      <directionalLight position={[6, 9, 7]} intensity={3.2} color={secondary} castShadow={!lowPower} />
      <pointLight position={[-4, 4, 4]} intensity={2.8} distance={18} color={primary} />
      <pointLight position={[5, 3, -4]} intensity={3.5} distance={20} color={accent} />

      <mesh position={[0, -0.35, -0.5]} receiveShadow>
        <cylinderGeometry args={[6.8, 7.4, 0.35, 64]} />
        <meshStandardMaterial color="#020817" roughness={0.3} metalness={0.82} />
      </mesh>

      <mesh position={[0, -0.1, 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 5.9, 96]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.55} transparent opacity={0.36} />
      </mesh>

      {towers.map((tower) => (
        <CityTower key={tower.i} x={tower.x} z={tower.z} height={tower.h} width={tower.w} primary={secondary} accent={accent} index={tower.i} />
      ))}

      <OrbitSystem accent={accent} secondary={secondary} reducedMotion={reducedMotion} />
      <AtmosphericRibbons accent={accent} secondary={secondary} reducedMotion={reducedMotion} />
      <Character primary={primary} accent={accent} />

      <Sparkles
        count={lowPower ? 24 : 70}
        scale={[14, 9, 14]}
        size={lowPower ? 0.45 : 0.72}
        speed={reducedMotion ? 0 : 0.12}
        opacity={0.42}
        color={secondary}
      />
    </group>
  );
}
