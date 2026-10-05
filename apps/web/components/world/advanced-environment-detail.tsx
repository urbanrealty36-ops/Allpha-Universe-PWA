"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ALLPHA_3D_THEME_PROFILES, type Allpha3DThemeProfile } from "../../../../packages/design-tokens/3d-visual-language";

type Layer = "universe" | "galaxy" | "orbit" | "world" | "district" | "booth" | "content" | "live";

type Props = {
  profile: Allpha3DThemeProfile;
  layer: Layer;
  lowPower: boolean;
  reducedMotion: boolean;
};

const DETAIL_FAMILIES = {
  crystal: ["premium-ai-tech", "luminous-fantasy", "ethereal-fantasy", "quantum-tech"],
  neon: ["neon-metropolis", "tropical-megacity", "heroic-futurism"],
  organic: ["living-organic", "organic-fantasy", "living-earth", "indigenous-futurism"],
  aquatic: ["oceanic-urban", "submerged-fantasy"],
  warm: ["desert-cosmic", "ancient-cosmic", "martian-scifi", "industrial-fantasy"],
  mythic: ["mythic-japanese", "mythic-draconic", "arcane-academia", "nordic-frontier", "surreal-playful", "temporal-arcane"],
  cosmic: ["space-exploration", "lunar-scifi"],
} as const;

function familyFor(profile: Allpha3DThemeProfile): keyof typeof DETAIL_FAMILIES {
  const family = profile.family;
  for (const [key, values] of Object.entries(DETAIL_FAMILIES) as Array<[keyof typeof DETAIL_FAMILIES, readonly string[]]>) {
    if (values.some((value) => family.includes(value))) return key;
  }
  return "cosmic";
}

const SHADER_VERTEX = `
varying vec2 vUv;
varying float vElevation;
uniform float uTime;
void main() {
  vUv = uv;
  vec3 p = position;
  float wave = sin((p.x + uTime * 0.22) * 2.4) * 0.035 + cos((p.y - uTime * 0.16) * 2.1) * 0.025;
  p.z += wave;
  vElevation = wave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const SHADER_FRAGMENT = `
varying vec2 vUv;
varying float vElevation;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uOpacity;
uniform float uGrid;
void main() {
  float radial = 1.0 - distance(vUv, vec2(0.5)) * 1.65;
  float gridX = smoothstep(0.46, 0.49, abs(fract(vUv.x * 18.0) - 0.5));
  float gridY = smoothstep(0.46, 0.49, abs(fract(vUv.y * 12.0) - 0.5));
  float scan = 0.5 + 0.5 * sin(vUv.y * 34.0 - uTime * 0.7);
  vec3 color = mix(uColorA, uColorB, clamp(vUv.y + scan * 0.08, 0.0, 1.0));
  float edge = smoothstep(0.02, 0.42, radial);
  float lines = max(gridX, gridY) * uGrid;
  float alpha = clamp((0.12 + lines * 0.25 + edge * 0.32) * uOpacity, 0.0, 0.68);
  gl_FragColor = vec4(color * (0.55 + edge * 0.65), alpha);
}
`;

function AdvancedShaderSurface({
  colors,
  lowPower,
  reducedMotion,
  layer,
}: {
  colors: readonly [string, string, string];
  lowPower: boolean;
  reducedMotion: boolean;
  layer: Layer;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(colors[0]) },
    uColorB: { value: new THREE.Color(colors[1]) },
    uOpacity: { value: lowPower ? 0.16 : layer === "universe" ? 0.28 : 0.2 },
    uGrid: { value: lowPower ? 0.22 : 0.55 },
  }), [colors, layer, lowPower]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.68, 0]} scale={layer === "universe" ? [1.45, 1.45, 1.45] : [1.1, 1.1, 1.1]}>
      <planeGeometry args={[18, 18, lowPower ? 12 : 28, lowPower ? 12 : 28]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={SHADER_VERTEX}
        fragmentShader={SHADER_FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AtmosphericRibbon({ color, position, rotation, scale, reducedMotion }: {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y += 0.0007;
    ref.current.rotation.z = Math.sin(t * 0.22) * 0.035;
  });
  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <mesh>
        <torusGeometry args={[2.2, 0.045, 8, 96, Math.PI * 1.32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <torusGeometry args={[1.82, 0.018, 6, 80, Math.PI * 1.22]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function LightShaft({ color, position, rotation, height, lowPower }: {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  height: number;
  lowPower: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.7, height, 20, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={lowPower ? 0.035 : 0.075} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CrystalDetail({ colors, lowPower }: { colors: readonly [string, string, string]; lowPower: boolean }) {
  const count = lowPower ? 4 : 7;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const radius = 4.4 + (i % 2) * 1.2;
        const height = 0.8 + (i % 3) * 0.55;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, height * 0.5 - 0.55, Math.sin(angle) * radius]} rotation={[0.08 * i, angle, -0.05 * i]} castShadow>
            <coneGeometry args={[0.26 + (i % 2) * 0.12, height, 6]} />
            <meshPhysicalMaterial color={colors[i % 3]} emissive={colors[i % 3]} emissiveIntensity={0.34} metalness={0.35} roughness={0.14} transmission={lowPower ? 0 : 0.18} thickness={0.35} transparent opacity={0.78} />
          </mesh>
        );
      })}
    </group>
  );
}

function OrganicDetail({ colors, lowPower }: { colors: readonly [string, string, string]; lowPower: boolean }) {
  const count = lowPower ? 3 : 5;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const radius = 4.6;
        return (
          <group key={i} position={[Math.cos(angle) * radius, -0.45, Math.sin(angle) * radius]} rotation={[0.12, angle, 0]}>
            <mesh position={[0, 1.0, 0]} rotation={[0.1, 0.2, 0]}>
              <cylinderGeometry args={[0.06, 0.11, 2.0, 7]} />
              <meshStandardMaterial color={colors[0]} roughness={0.82} />
            </mesh>
            <mesh position={[0.24, 1.45, 0]} rotation={[0.2, 0.1, 0.5]}>
              <sphereGeometry args={[0.42, 12, 8]} />
              <meshStandardMaterial color={colors[1]} roughness={0.88} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function NeonDetail({ colors, lowPower }: { colors: readonly [string, string, string]; lowPower: boolean }) {
  const count = lowPower ? 3 : 6;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const radius = 4.8;
        return (
          <group key={i} position={[Math.cos(angle) * radius, -0.25, Math.sin(angle) * radius]}>
            <mesh rotation={[0, angle, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 2.4, 8]} />
              <meshBasicMaterial color={colors[i % 3]} transparent opacity={0.72} />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
              <boxGeometry args={[0.72, 0.08, 0.04]} />
              <meshBasicMaterial color={colors[(i + 1) % 3]} transparent opacity={0.68} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function AquaticDetail({ colors, lowPower }: { colors: readonly [string, string, string]; lowPower: boolean }) {
  return (
    <group>
      {[0, 1, 2].slice(0, lowPower ? 2 : 3).map((i) => (
        <mesh key={i} position={[(i - 1) * 3.2, 1.4 + i * 0.4, -2.8]} rotation={[0.15, i * 0.4, 0]}>
          <torusGeometry args={[1.3 + i * 0.55, 0.025, 8, 64]} />
          <meshBasicMaterial color={colors[i]} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
      <SparklesLike color={colors[1]} count={lowPower ? 30 : 80} />
    </group>
  );
}

function SparklesLike({ color, count }: { color: string; count: number }) {
  const positions = useMemo(() => {
    const values: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = i * 1.618;
      const r = 2 + (i % 11) * 0.38;
      values.push(Math.cos(a) * r, -0.2 + (i % 9) * 0.24, Math.sin(a) * r);
    }
    return new Float32Array(values);
  }, [count]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.035} transparent opacity={0.32} sizeAttenuation />
    </points>
  );
}

function MythicDetail({ colors, lowPower }: { colors: readonly [string, string, string]; lowPower: boolean }) {
  const count = lowPower ? 3 : 5;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 4.8, -0.4, Math.sin(angle) * 4.8]}>
            <mesh position={[0, 1.0, 0]}>
              <boxGeometry args={[0.12, 2.0 + (i % 2) * 0.8, 0.12]} />
              <meshStandardMaterial color={colors[2]} metalness={0.72} roughness={0.25} />
            </mesh>
            <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[0.45, 0.025, 6, 40]} />
              <meshStandardMaterial color={colors[i % 3]} emissive={colors[i % 3]} emissiveIntensity={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function AdvancedEnvironmentDetail({ profile, layer, lowPower, reducedMotion }: Props) {
  const colors = profile.accent;
  const family = familyFor(profile);
  const detailScale = layer === "universe" ? 1 : layer === "galaxy" ? 0.86 : 0.72;
  return (
    <group scale={detailScale}>
      <AdvancedShaderSurface colors={colors} lowPower={lowPower} reducedMotion={reducedMotion} layer={layer} />
      <AtmosphericRibbon color={colors[1]} position={[0, 2.2, -2.4]} rotation={[0.25, 0.15, 0]} scale={layer === "universe" ? 1.15 : 0.9} reducedMotion={reducedMotion} />
      <LightShaft color={colors[0]} position={[-3.8, 3.0, -4.5]} rotation={[0.14, 0.2, -0.25]} height={layer === "universe" ? 8 : 6} lowPower={lowPower} />
      <LightShaft color={colors[2]} position={[3.4, 2.7, -4.0]} rotation={[-0.08, -0.24, 0.18]} height={layer === "universe" ? 7 : 5.5} lowPower={lowPower} />
      {family === "crystal" ? <CrystalDetail colors={colors} lowPower={lowPower} /> : null}
      {family === "organic" ? <OrganicDetail colors={colors} lowPower={lowPower} /> : null}
      {family === "neon" ? <NeonDetail colors={colors} lowPower={lowPower} /> : null}
      {family === "aquatic" ? <AquaticDetail colors={colors} lowPower={lowPower} /> : null}
      {family === "mythic" ? <MythicDetail colors={colors} lowPower={lowPower} /> : null}
      {family === "warm" ? <MythicDetail colors={colors} lowPower={lowPower} /> : null}
      {family === "cosmic" ? <NeonDetail colors={colors} lowPower={lowPower} /> : null}
    </group>
  );
}
