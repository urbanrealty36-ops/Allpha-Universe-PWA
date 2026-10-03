"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { WorldScene, SceneNode } from "../../lib/world-engine/scene-schema";
import { proceduralThemeStyle } from "../../lib/world-engine/procedural-theme";

type SpatialPresence = {
  id: string;
  agent_id: string;
  movement_state: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  zone_key?: string | null;
};

type SpatialPortal = {
  id: string;
  target: string;
  position?: { x: number; y: number; z: number };
  presentation_only?: boolean;
};

type SpatialContent = {
  id: string;
  title?: string | null;
  position?: { x: number; y: number; z: number };
};

type Props = {
  scene?: WorldScene | null;
  tokens?: Record<string, unknown>;
  lowPower?: boolean;
  onHotspot?: (node: SceneNode) => void;
  booths?: SceneNode[];
  presence?: SpatialPresence[];
  portals?: SpatialPortal[];
  content?: SpatialContent[];
  selectedBoothId?: string;
  selectedDistrictId?: string;
};

function Structure({
  kind,
  color,
  accent,
  position,
  scale = 1,
}: {
  kind: string;
  color: string;
  accent: string;
  position: [number, number, number];
  scale?: number;
}) {
  if (kind === "tree") return <group position={position} scale={scale}><mesh position={[0, 1, 0]} castShadow><cylinderGeometry args={[.18, .28, 2, 8]} /><meshStandardMaterial color={color} /></mesh><mesh position={[0, 2.1, 0]} castShadow><dodecahedronGeometry args={[1.1, 1]} /><meshStandardMaterial color={accent} roughness={.8} /></mesh></group>;
  if (kind === "crystal") return <mesh position={[position[0], position[1] + 1.2, position[2]]} rotation={[0, .5, 0]} scale={scale} castShadow><coneGeometry args={[.75, 2.8, 6]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.25} metalness={.35} /></mesh>;
  if (kind === "temple") return <group position={position} scale={scale}><mesh position={[0, 1, 0]} castShadow><boxGeometry args={[2.2, 2, 2.2]} /><meshStandardMaterial color={color} /></mesh><mesh position={[0, 2.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[1.8, .8, 4]} /><meshStandardMaterial color={accent} /></mesh></group>;
  if (kind === "castle") return <group position={position} scale={scale}><mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[2.4, 2.4, 2.4]} /><meshStandardMaterial color={color} /></mesh><mesh position={[-1, 2.7, 0]}><cylinderGeometry args={[.4, .5, 2, 8]} /><meshStandardMaterial color={accent} /></mesh><mesh position={[1, 2.7, 0]}><cylinderGeometry args={[.4, .5, 2, 8]} /><meshStandardMaterial color={accent} /></mesh></group>;
  if (kind === "tech") return <group position={position} scale={scale}><mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[1.8, 2.4, 1.8]} /><meshStandardMaterial color={color} metalness={.65} roughness={.25} /></mesh><mesh position={[0, 1.2, 0]}><boxGeometry args={[1.85, .08, 1.85]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.8} /></mesh></group>;
  return <group position={position} scale={scale}><mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[.65, .9, 2.8, 8]} /><meshStandardMaterial color={color} /></mesh><mesh position={[0, 3.1, 0]}><sphereGeometry args={[.42, 12, 12]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.6} /></mesh></group>;
}

function Booth3DAsset({ url, position, scale = 1, onClick }: { url: string; position: [number, number, number]; scale?: number; onClick?: () => void }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene.clone(true)} position={position} scale={scale} onClick={onClick} />;
}

function WorldObjects({
  scene,
  tokens,
  onHotspot,
  lowPower,
  booths,
  presence,
  portals,
  content,
  selectedBoothId,
}: {
  scene: WorldScene;
  tokens?: Record<string, unknown>;
  onHotspot?: Props["onHotspot"];
  lowPower: boolean;
  booths: SceneNode[];
  presence: SpatialPresence[];
  portals: SpatialPortal[];
  content: SpatialContent[];
  selectedBoothId?: string;
}) {
  const style = useMemo(() => proceduralThemeStyle(scene), [scene]);
  const primary = String(tokens?.["theme.color.primary"] ?? style.accent);
  const secondary = String(tokens?.["theme.color.secondary"] ?? style.secondary);
  const accent = String(tokens?.["theme.effects.glow"] ?? style.accent);
  const color = primary.startsWith("#") ? primary : style.accent;
  const zones = scene.zones;
  const density = lowPower ? Math.min(4, style.density) : style.density;

  return <>
    <mesh position={[0, -.3, 0]} receiveShadow><boxGeometry args={[28, .5, 28]} /><meshStandardMaterial color={style.ground} roughness={.9} /></mesh>
    <mesh position={[0, -.02, 0]}><boxGeometry args={[22, .06, 22]} /><meshStandardMaterial color={secondary} /></mesh>
    {style.water && !lowPower && <mesh position={[0, .02, -5]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[4, 32]} /><meshStandardMaterial color={accent} transparent opacity={.28} metalness={.2} /></mesh>}
    {style.ring && !lowPower && <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[4.8, .08, 8, 64]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.5} /></mesh>}

    {zones.map((zone, i) => {
      const angle = (i / Math.max(1, zones.length)) * Math.PI * 2;
      const x = Math.cos(angle) * 6;
      const z = Math.sin(angle) * 6;
      return <group key={zone.id} position={[x, 0, z]}>
        <mesh onClick={() => onHotspot?.({ id: zone.id, kind: "zone", metadata: { type: zone.type } })}><boxGeometry args={[3.4, .45, 3.4]} /><meshStandardMaterial color={i === 0 ? color : style.secondary} /></mesh>
        <Structure kind={style.structure} color={style.secondary} accent={accent} position={[0, 0, 0]} scale={.75 + (i % 3) * .1} />
      </group>;
    })}

    {Array.from({ length: density }).map((_, i) => {
      const a = i / density * Math.PI * 2;
      const r = 8 + (i % 3) * 1.1;
      return <Structure key={"decor-" + i} kind={style.structure} color={style.secondary} accent={accent} position={[Math.cos(a) * r, .05, Math.sin(a) * r]} scale={.45 + (i % 2) * .12} />;
    })}

    {presence.filter((agent) => agent.position).map((agent) => {
      const p = agent.position!;
      const selected = agent.id === selectedBoothId;
      return <group key={agent.id} position={[p.x, p.y + .55, p.z]} onClick={() => onHotspot?.({ id: agent.id, kind: "character", position: p, metadata: { agent_id: agent.agent_id, movement_state: agent.movement_state, zone_key: agent.zone_key } })}>
        <mesh><sphereGeometry args={[selected ? .42 : .32, 14, 14]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={selected ? 1 : .55} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[selected ? .72 : .55, .035, 8, 32]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} transparent opacity={.8} /></mesh>
      </group>;
    })}

    {booths.map((booth, i) => {
      const x = booth.position?.x ?? (i % 4) * 2.8 - 4.2;
      const y = booth.position?.y ?? 0;
      const z = booth.position?.z ?? Math.floor(i / 4) * 2.8 - 2.8;
      const modelUrl = typeof booth.metadata?.model_url === "string" ? booth.metadata.model_url : null;
      const scale = booth.scale?.x ?? 1;
      const selected = booth.id === selectedBoothId;
      return modelUrl
        ? <Booth3DAsset key={booth.id} url={modelUrl} position={[x, y, z]} scale={selected ? scale * 1.08 : scale} onClick={() => onHotspot?.(booth)} />
        : <group key={booth.id} position={[x, y, z]} onClick={() => onHotspot?.(booth)}>
            <mesh position={[0, .8, 0]} castShadow><boxGeometry args={[1.6, 1.6, 1.6]} /><meshStandardMaterial color={selected ? "#f0abfc" : accent} emissive={selected ? "#d946ef" : accent} emissiveIntensity={selected ? 1.3 : .35} metalness={.25} roughness={.55} /></mesh>
            <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]}><torusGeometry args={[.58, .06, 8, 24]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.8} /></mesh>
          </group>;
    })}

    {portals.map((portal) => {
      const p = portal.position ?? { x: 0, y: .8, z: -5 };
      return <group key={portal.id} position={[p.x, p.y, p.z]} onClick={() => onHotspot?.({ id: portal.id, kind: "portal", position: p, metadata: { target_world_id: portal.target, presentation_only: true } })}>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.9, .11, 12, 48]} /><meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={1.8} /></mesh>
        <mesh><sphereGeometry args={[.56, 20, 20]} /><meshStandardMaterial color="#160d2a" emissive="#7e22ce" emissiveIntensity={.75} transparent opacity={.72} /></mesh>
      </group>;
    })}

    {content.slice(0, 16).map((item, i) => {
      const p = item.position ?? { x: (i % 4) * 2.4 - 3.6, y: 2 + (i % 2) * .4, z: -1 + Math.floor(i / 4) * 2.2 };
      return <group key={item.id} position={[p.x, p.y, p.z]} onClick={() => onHotspot?.({ id: item.id, kind: "content", position: p, metadata: { title: item.title ?? null, presentation_only: true } })}>
        <mesh><octahedronGeometry args={[.24, 0]} /><meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.4} /></mesh>
      </group>;
    })}

    {scene.spawn_points.map((p, i) => {
      const x = p.position?.x ?? (i === 0 ? 0 : 2);
      const z = p.position?.z ?? (i === 0 ? 0 : 2);
      return <mesh key={p.id} position={[x, .08, z]}><cylinderGeometry args={[.25, .25, .08, 16]} /><meshStandardMaterial color="#f8fafc" /></mesh>;
    })}
  </>;
}

export default function AllphaWorldRenderer({
  scene,
  tokens,
  lowPower = false,
  onHotspot,
  booths = [],
  presence = [],
  portals = [],
  content = [],
  selectedBoothId,
}: Props) {
  if (!scene) {
    return <div className="flex h-full min-h-[520px] items-center justify-center bg-black/30 p-8 text-center text-sm text-white/40">No validated Theme/World Scene is available for this layer.</div>;
  }

  const shadows = !lowPower;
  const dpr = (lowPower ? [1, 1.25] : [1, 1.75]) as [number, number];

  return <div className="relative h-full min-h-[420px] w-full overflow-hidden bg-black">
    <Canvas dpr={dpr} shadows={shadows} performance={{ min: .55 }} gl={{ antialias: !lowPower, powerPreference: lowPower ? "low-power" : "high-performance" }}>
      <color attach="background" args={["#070b14"]} />
      <PerspectiveCamera makeDefault position={[14, 11, 14]} fov={58} />
      <ambientLight intensity={.8} />
      <directionalLight position={[8, 14, 6]} intensity={2} castShadow={shadows} />
      <WorldObjects scene={scene} tokens={tokens} onHotspot={onHotspot} lowPower={lowPower} booths={booths} presence={presence} portals={portals} content={content} selectedBoothId={selectedBoothId} />
      <OrbitControls enablePan={!lowPower} minDistance={5} maxDistance={32} maxPolarAngle={Math.PI * .48} enableDamping dampingFactor={.08} />
    </Canvas>
  </div>;
}
