"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";
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

type DistrictSpatialObject = {
  id: string;
  object_type: string;
  name: string;
  status: string;
  capacity?: number | null;
  availability?: string;
  spatial_config?: Record<string, unknown>;
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
  spatialObjects?: DistrictSpatialObject[];
  selectedBoothId?: string;
  selectedDistrictId?: string;
  themePackUrl?: string | null;
  liveStageUrl?: string | null;
  agentCharacterUrl?: string | null;
  agentCharacterAsset?: { source?: string | null; characterKey?: string | null; contract?: Record<string, unknown> | null };
  agentCharacterPerformance?: { state?: "idle" | "listening" | "thinking" | "speaking" | "emphasis" | "greeting" | "acknowledge" | "farewell"; speaking: boolean; level: number; userSpeaking: boolean };
};

function Structure({ kind, color, accent, position, scale = 1 }: {
  kind: string; color: string; accent: string; position: [number, number, number]; scale?: number;
}) {
  if (kind === "tree") return <group position={position} scale={scale}><mesh position={[0,1,0]} castShadow><cylinderGeometry args={[.18,.28,2,8]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,2.1,0]} castShadow><dodecahedronGeometry args={[1.1,1]}/><meshStandardMaterial color={accent} roughness={.8}/></mesh></group>;
  if (kind === "crystal") return <mesh position={[position[0],position[1]+1.2,position[2]]} rotation={[0,.5,0]} scale={scale} castShadow><coneGeometry args={[.75,2.8,6]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.25} metalness={.35}/></mesh>;
  if (kind === "temple") return <group position={position} scale={scale}><mesh position={[0,1,0]} castShadow><boxGeometry args={[2.2,2,2.2]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,2.3,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[1.8,.8,4]}/><meshStandardMaterial color={accent}/></mesh></group>;
  if (kind === "castle") return <group position={position} scale={scale}><mesh position={[0,1.2,0]} castShadow><boxGeometry args={[2.4,2.4,2.4]}/><meshStandardMaterial color={color}/></mesh><mesh position={[-1,2.7,0]}><cylinderGeometry args={[.4,.5,2,8]}/><meshStandardMaterial color={accent}/></mesh><mesh position={[1,2.7,0]}><cylinderGeometry args={[.4,.5,2,8]}/><meshStandardMaterial color={accent}/></mesh></group>;
  if (kind === "tech") return <group position={position} scale={scale}><mesh position={[0,1.2,0]} castShadow><boxGeometry args={[1.8,2.4,1.8]}/><meshStandardMaterial color={color} metalness={.65} roughness={.25}/></mesh><mesh position={[0,1.2,0]}><boxGeometry args={[1.85,.08,1.85]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.8}/></mesh></group>;
  return <group position={position} scale={scale}><mesh position={[0,1.4,0]} castShadow><cylinderGeometry args={[.65,.9,2.8,8]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,3.1,0]}><sphereGeometry args={[.42,12,12]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.6}/></mesh></group>;
}

function ThemePackEnvironment({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((object: any) => {
      const name = String(object.name || "");
      if (["BoothTemplate","AgentCharacterTemplate","ContentAICapsule","PortalGateway","LiveExperienceStage"].includes(name)) object.visible = false;
    });
    return clone;
  }, [gltf.scene, url]);
  return <primitive object={scene}/>;
}

function Booth3DAsset({ url, position, scale = 1, onClick }: { url:string; position:[number,number,number]; scale?:number; onClick?:()=>void }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene.clone(true)} position={position} scale={scale} onClick={onClick}/>;
}

function BoothThemeTemplate({ url, position, scale = 1, onClick }: { url:string; position:[number,number,number]; scale?:number; onClick?:()=>void }) {
  const gltf = useGLTF(url);
  const template = useMemo(() => {
    const source = gltf.scene.getObjectByName("BoothTemplate");
    return source ? source.clone(true) : null;
  }, [gltf.scene]);
  if (!template) return null;
  return <primitive object={template} position={position} scale={scale} onClick={onClick}/>;
}

function LiveStage3DAsset({ url }: { url:string }) {
  const gltf = useGLTF(url);
  const stage = useMemo(() => {
    const source = gltf.scene.getObjectByName("LiveExperienceStage");
    return source ? source.clone(true) : null;
  }, [gltf.scene]);
  if (!stage) return null;
  return <primitive object={stage} position={[0,0,-3]}/>;
}

function characterPalette(key?: string | null) {
  const palettes: Record<string, [string, string, string]> = {
    sage: ["#334155", "#e2e8f0", "#38bdf8"], navigator: ["#0f766e", "#ccfbf1", "#14b8a6"],
    strategist: ["#312e81", "#e0e7ff", "#818cf8"], builder: ["#7c2d12", "#ffedd5", "#f97316"],
    analyst: ["#1f2937", "#f3f4f6", "#60a5fa"], mentor: ["#78350f", "#fef3c7", "#f59e0b"],
    companion: ["#7f1d1d", "#fee2e2", "#fb7185"], operator: ["#164e63", "#cffafe", "#22d3ee"],
    guardian: ["#1e293b", "#e2e8f0", "#94a3b8"], creator: ["#581c87", "#f3e8ff", "#d946ef"],
    host: ["#0f172a", "#f8fafc", "#38bdf8"], detective: ["#1c1917", "#f5f5f4", "#a8a29e"],
    engineer: ["#172554", "#dbeafe", "#3b82f6"], diplomat: ["#14532d", "#dcfce7", "#4ade80"],
    coach: ["#7f1d1d", "#fee2e2", "#ef4444"], friend: ["#831843", "#fce7f3", "#f472b6"],
    connector: ["#164e63", "#cffafe", "#06b6d4"], ambassador: ["#3f3f46", "#f4f4f5", "#a1a1aa"],
    moderator: ["#1e3a8a", "#dbeafe", "#60a5fa"], journalist: ["#292524", "#f5f5f4", "#f59e0b"],
    presenter: ["#172554", "#eff6ff", "#60a5fa"], emcee: ["#701a75", "#fae8ff", "#e879f9"],
    facilitator: ["#064e3b", "#d1fae5", "#34d399"], interviewer: ["#312e81", "#eef2ff", "#818cf8"],
    reviewer: ["#374151", "#f3f4f6", "#9ca3af"], critic: ["#450a0a", "#fee2e2", "#f87171"],
    teacher: ["#713f12", "#fef9c3", "#facc15"], shopkeeper: ["#365314", "#ecfccb", "#84cc16"],
    sales_guide: ["#0c4a6e", "#e0f2fe", "#38bdf8"], negotiator: ["#3f3f46", "#fafafa", "#d4d4d8"],
    world_guide: ["#164e63", "#cffafe", "#67e8f9"], booth_host: ["#581c87", "#f3e8ff", "#c084fc"],
    streamer: ["#172554", "#dbeafe", "#3b82f6"], producer: ["#1f2937", "#f3f4f6", "#94a3b8"],
  };
  return palettes[key || ""] ?? ["#111827", "#e5e7eb", "#22d3ee"];
}

function PlatformAgentCharacter3D({ position, characterKey, performance }: {
  position: [number, number, number];
  characterKey?: string | null;
  performance?: { state?: string; speaking: boolean; level: number; userSpeaking: boolean };
}) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftForearm = useRef<Group>(null);
  const rightForearm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftEye = useRef<Group>(null);
  const rightEye = useRef<Group>(null);
  const mouth = useRef<Group>(null);
  const browLeft = useRef<Group>(null);
  const browRight = useRef<Group>(null);
  const [primary, secondary, accent] = useMemo(() => characterPalette(characterKey), [characterKey]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const level = Math.max(0, Math.min(1, performance?.level ?? 0));
    const state = performance?.state ?? (performance?.speaking ? "speaking" : performance?.userSpeaking ? "listening" : "idle");
    const speaking = state === "speaking";
    const listening = state === "listening";
    const thinking = state === "thinking";
    const gesture = state === "emphasis" || state === "greeting" || state === "acknowledge" || state === "farewell";
    const blink = Math.sin(t * 1.7) > 0.994 ? 1 : 0;
    if (root.current) {
      root.current.position.y = 0.02 + Math.sin(t * (speaking ? 3.2 : 1.8)) * (speaking ? 0.045 + level * 0.05 : 0.018);
      root.current.rotation.y = Math.sin(t * 0.45) * 0.035;
    }
    if (torso.current) {
      torso.current.rotation.z = Math.sin(t * 1.15) * (speaking ? 0.025 + level * 0.045 : 0.012);
      torso.current.rotation.x = thinking ? -0.045 : listening ? 0.02 : 0;
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.55) * 0.075;
      head.current.rotation.x = (listening ? 0.08 : thinking ? -0.09 : 0.02) + Math.sin(t * 0.8) * 0.018;
      head.current.rotation.z = listening ? 0.07 : 0;
    }
    if (mouth.current) {
      mouth.current.scale.y = 0.15 + (speaking ? level * 1.15 : 0);
      mouth.current.scale.x = 0.75 + (speaking ? level * 0.25 : 0);
      mouth.current.position.y = -0.48 + (speaking ? Math.sin(t * 11) * level * 0.018 : 0);
    }
    if (leftEye.current && rightEye.current) {
      const eyeScale = blink ? 0.12 : 1;
      leftEye.current.scale.y = eyeScale; rightEye.current.scale.y = eyeScale;
      const gaze = Math.sin(t * 0.45) * 0.045;
      leftEye.current.position.x = -0.18 + gaze; rightEye.current.position.x = 0.18 + gaze;
    }
    if (browLeft.current && browRight.current) {
      const lift = speaking ? Math.min(0.08, level * 0.08) : thinking ? 0.055 : 0;
      browLeft.current.rotation.z = 0.12 + lift; browRight.current.rotation.z = -0.12 - lift;
    }
    if (leftArm.current && rightArm.current && leftForearm.current && rightForearm.current) {
      const base = speaking ? 0.12 + level * 0.22 : 0.035;
      leftArm.current.rotation.z = -base + Math.sin(t * 1.9) * (gesture ? 0.12 : 0.035);
      rightArm.current.rotation.z = base + Math.sin(t * 1.75 + 0.8) * (gesture ? 0.12 : 0.035);
      if (thinking) {
        rightArm.current.rotation.x = -0.45;
        rightForearm.current.rotation.x = -1.0;
        rightForearm.current.rotation.z = 0.25;
      } else if (state === "greeting" || state === "farewell") {
        rightArm.current.rotation.x = -0.55;
        rightForearm.current.rotation.z = Math.sin(t * 4.2) * 0.55;
      } else {
        rightArm.current.rotation.x = 0;
        rightForearm.current.rotation.x = speaking ? Math.sin(t * 2.2) * (0.06 + level * 0.08) : 0;
        rightForearm.current.rotation.z = 0;
      }
      leftForearm.current.rotation.x = speaking ? Math.sin(t * 2.0 + 1.2) * (0.04 + level * 0.07) : 0;
    }
    if (leftLeg.current && rightLeg.current) {
      const stride = speaking ? Math.sin(t * 1.9) * (0.018 + level * 0.025) : Math.sin(t * 0.9) * 0.01;
      leftLeg.current.rotation.x = stride; rightLeg.current.rotation.x = -stride;
    }
  });

  return (
    <group ref={root} position={position} scale={1.05}>
      <group ref={torso}>
        <mesh position={[0, 1.55, 0]} castShadow><boxGeometry args={[0.9, 1.25, 0.48]} /><meshStandardMaterial color={primary} roughness={0.55} /></mesh>
        <mesh position={[0, 2.22, 0]}><cylinderGeometry args={[0.14, 0.16, 0.24, 12]} /><meshStandardMaterial color={secondary} /></mesh>
        <group ref={leftArm} position={[-0.58, 1.85, 0]}><mesh position={[0, -0.38, 0]} castShadow><cylinderGeometry args={[0.13, 0.15, 0.76, 10]} /><meshStandardMaterial color={primary} /></mesh><group ref={leftForearm} position={[0, -0.78, 0]}><mesh position={[0, -0.33, 0]} castShadow><cylinderGeometry args={[0.11, 0.13, 0.66, 10]} /><meshStandardMaterial color={secondary} /></mesh><mesh position={[0, -0.72, 0]}><sphereGeometry args={[0.14, 10, 10]} /><meshStandardMaterial color={secondary} /></mesh></group></group>
        <group ref={rightArm} position={[0.58, 1.85, 0]}><mesh position={[0, -0.38, 0]} castShadow><cylinderGeometry args={[0.13, 0.15, 0.76, 10]} /><meshStandardMaterial color={primary} /></mesh><group ref={rightForearm} position={[0, -0.78, 0]}><mesh position={[0, -0.33, 0]} castShadow><cylinderGeometry args={[0.11, 0.13, 0.66, 10]} /><meshStandardMaterial color={secondary} /></mesh><mesh position={[0, -0.72, 0]}><sphereGeometry args={[0.14, 10, 10]} /><meshStandardMaterial color={secondary} /></mesh></group></group>
      </group>
      <group ref={head} position={[0, 2.78, 0]}>
        <mesh castShadow><sphereGeometry args={[0.58, 24, 20]} /><meshStandardMaterial color={secondary} roughness={0.65} /></mesh>
        <mesh ref={leftEye} position={[-0.18, 0.05, 0.52]} scale={[1,1,1]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh ref={rightEye} position={[0.18, 0.05, 0.52]} scale={[1,1,1]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[-0.18,0.05,0.6]}><sphereGeometry args={[0.035, 10, 10]} /><meshStandardMaterial color="#111827" /></mesh>
        <mesh position={[0.18,0.05,0.6]}><sphereGeometry args={[0.035, 10, 10]} /><meshStandardMaterial color="#111827" /></mesh>
        <group ref={browLeft} position={[-0.18,0.19,0.54]}><mesh><boxGeometry args={[0.18,0.035,0.025]} /><meshStandardMaterial color={accent} /></mesh></group>
        <group ref={browRight} position={[0.18,0.19,0.54]}><mesh><boxGeometry args={[0.18,0.035,0.025]} /><meshStandardMaterial color={accent} /></mesh></group>
        <group ref={mouth} position={[0,-0.48,0.53]} scale={[0.75,0.15,0.35]}><mesh><sphereGeometry args={[0.16, 14, 10]} /><meshStandardMaterial color="#160b12" roughness={0.4} /></mesh></group>
      </group>
      <group ref={leftLeg} position={[-0.25,0.65,0]}><mesh position={[0,-0.45,0]} castShadow><cylinderGeometry args={[0.17,0.19,0.9,10]} /><meshStandardMaterial color={primary} /></mesh><mesh position={[0,-0.98,0.08]}><boxGeometry args={[0.34,0.18,0.56]} /><meshStandardMaterial color={secondary} /></mesh></group>
      <group ref={rightLeg} position={[0.25,0.65,0]}><mesh position={[0,-0.45,0]} castShadow><cylinderGeometry args={[0.17,0.19,0.9,10]} /><meshStandardMaterial color={primary} /></mesh><mesh position={[0,-0.98,0.08]}><boxGeometry args={[0.34,0.18,0.56]} /><meshStandardMaterial color={secondary} /></mesh></group>
      <mesh position={[0,0.03,0]}><torusGeometry args={[0.72,0.025,8,32]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} /></mesh>
    </group>
  );
}

function AgentCharacter3DAsset({ url, position, performance }: { url:string; position:[number,number,number]; performance?: { speaking:boolean; level:number; userSpeaking:boolean } }) {
  const gltf = useGLTF(url);
  const character = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  useFrame(({ clock }) => {
    const level = Math.max(0, Math.min(1, performance?.level ?? 0));
    const speaking = Boolean(performance?.speaking);
    const t = clock.getElapsedTime();
    character.traverse((node: any) => {
      const name = String(node.name || "").toLowerCase();
      if (node.morphTargetDictionary && node.morphTargetInfluences) {
        for (const key of Object.keys(node.morphTargetDictionary)) {
          const k = key.toLowerCase();
          const idx = node.morphTargetDictionary[key];
          if (/(mouth|jaw|viseme|talk|lip)/.test(k)) node.morphTargetInfluences[idx] = speaking ? level : Math.max(0, (node.morphTargetInfluences[idx] ?? 0) * .85);
          if (/(smile|happy)/.test(k)) node.morphTargetInfluences[idx] = speaking ? Math.min(.22, level * .22) : Math.max(0, (node.morphTargetInfluences[idx] ?? 0) * .94);
          if (/(blink|eye_close)/.test(k)) node.morphTargetInfluences[idx] = Math.max(0, (Math.sin(t * .75) > .985 ? 1 : 0));
        }
      }
      if (node.isBone) {
        if (!node.userData.__allphaBaseRotation) node.userData.__allphaBaseRotation = { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z };
        const base = node.userData.__allphaBaseRotation;
        if (/(spine|chest|upperchest)/.test(name)) node.rotation.z = base.z + Math.sin(t * 1.1) * (speaking ? .006 + level * .012 : .003);
        if (/(head|neck)/.test(name)) { node.rotation.y = base.y + Math.sin(t * .55) * .008; node.rotation.x = base.x + Math.sin(t * .8) * .006; }
        if (/(leftarm|rightarm|leftshoulder|rightshoulder)/.test(name)) { const side = /(left)/.test(name) ? -1 : 1; node.rotation.z = base.z + side * Math.sin(t * (speaking ? 1.7 : .8)) * (speaking ? .018 + level * .035 : .008); }
        if (/(leftforearm|rightforearm|lefthand|righthand)/.test(name) && speaking) node.rotation.x = base.x + Math.sin(t * 2.1) * (.012 + level * .02);
      }
      if (/(left.?eye|right.?eye|eyeball|eye_l|eye_r)/.test(name)) {
        if (!node.userData.__allphaBaseRotation) node.userData.__allphaBaseRotation = { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z };
        const baseEye = node.userData.__allphaBaseRotation;
        node.rotation.y = baseEye.y + Math.sin(t * .55) * .004;
        node.rotation.x = baseEye.x + Math.sin(t * .7) * .003;
      }
    });
  });
  return <primitive object={character} position={position} scale={1}/>;
}
