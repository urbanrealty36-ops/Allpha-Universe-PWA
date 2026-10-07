"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { createGoldenScene } from "../../lib/world-engine/golden-scene";
import { createSpatialCompositionV205 } from "../../lib/world-engine/spatial-composition-v2";
import { createWorldDistrictBoothV206 } from "../../lib/world-engine/world-district-booth-v2";
import { createContentSpatialCompositionV207, validateContentSpatialComposition, type ContentSpatialRelationship } from "../../lib/world-engine/content-spatial-v2";
import { createLiveStageV208Composition, validateLiveStageV208Composition, type LiveStageActorState } from "../../lib/world-engine/live-stage-v2";
import type { Group } from "three";
import type { WorldScene, SceneNode } from "../../lib/world-engine/scene-schema";
import { proceduralThemeStyle } from "../../lib/world-engine/procedural-theme";
import type { CharacterAnimationSignal } from "../../lib/live-character-animation";
import { createCharacterV2Profile, normalizeCharacterV2Signal } from "../../lib/live-character-v2";
import { ThemeV2SpatialScene } from "./theme-v2-spatial-scene";
import { Cinematic3DScene, configureCinematicRenderer } from "./cinematic-3d-scene";
import { CinematicProductionHero } from "./cinematic-production-hero";
import { ThemeV2ProductionAssetScene } from "./theme-v2-production-asset-scene";

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
  excerpt?: string | null;
  position?: { x: number; y: number; z: number };
  gravity?: number | null;
  relationshipCount?: number | null;
  relationships?: ContentSpatialRelationship[];
};

type DistrictSpatialObject = {
  id: string;
  object_type: string;
  name: string;
  status: string;
  capacity?: number | null;
  availability?: string | null;
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
  themeKey?: string | null;
  liveStageUrl?: string | null;
  agentCharacterUrl?: string | null;
  agentCharacterAsset?: { source?: string | null; characterKey?: string | null; contract?: Record<string, unknown> | null };
  agentCharacterPerformance?: CharacterAnimationSignal;
  liveStageMode?: boolean;
  humanPresentationActive?: boolean;
  humanPresentationStatus?: string | null;
  liveCollaborationActive?: boolean;
  liveCollaborationConsentApproved?: boolean;
  liveCollaborationRiskAllowed?: boolean;
  liveAgentId?: string | null;
  humanPresentationState?: LiveStageActorState;
  liveAgentStageState?: LiveStageActorState;
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

function PlatformAgentCharacter3D({position,characterKey,performance,themeKey,architecture}:{position:[number,number,number];characterKey?:string|null;performance?: CharacterAnimationSignal;themeKey?:string|null;architecture?:string|null}){
  const root=useRef<Group>(null),head=useRef<Group>(null),torso=useRef<Group>(null),la=useRef<Group>(null),ra=useRef<Group>(null),lf=useRef<Group>(null),rf=useRef<Group>(null),ll=useRef<Group>(null),rl=useRef<Group>(null),le=useRef<Group>(null),re=useRef<Group>(null),mouth=useRef<Group>(null);
  const profile=useMemo(()=>createCharacterV2Profile(themeKey,characterKey,architecture),[themeKey,characterKey,architecture]);
  const signal=useMemo(()=>normalizeCharacterV2Signal(performance),[performance]);
  const {primary,secondary,accent}=profile.wardrobe;
  const reduceMotion=typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useFrame(({clock})=>{const t=clock.getElapsedTime(),v=Math.max(0,Math.min(1,signal.level)),s=signal.state,talk=signal.speaking,listen=s==="listening",think=s==="thinking",facial=signal.facial??"neutral",gaze=signal.gaze??"camera";
    if(root.current&&!reduceMotion){root.current.position.y=.02+Math.sin(t*(talk?3:1.8))*(talk?.04+v*.05:.018);root.current.rotation.y=Math.sin(t*.45)*.035}
    if(torso.current){torso.current.rotation.z=reduceMotion?0:Math.sin(t*1.15)*(talk?.025+v*.045:.012);torso.current.rotation.x=think?-.05:listen?.02:0}
    if(head.current){const gazeTurn=gaze==="human"?-.08:gaze==="agent"?.08:gaze==="attention"?.04:0;head.current.rotation.y=gazeTurn+(reduceMotion?0:Math.sin(t*.55)*.08);head.current.rotation.x=listen?.08:think?-.09:facial==="surprised"?.04:.02}
    if(mouth.current){const smile=facial==="smile"||facial==="happy"?.08:0;const concern=facial==="concerned"||facial==="serious"?-.02:0;mouth.current.scale.y=.15+(talk?v*1.15:0)+smile+concern;mouth.current.scale.x=.75+(talk?v*.25:0)}
    if(le.current&&re.current){const blink=Math.sin(t*1.7)>.994?.12:1;const gazeShift=gaze==="human"?-.035:gaze==="agent"?.035:gaze==="attention"?.06:0;le.current.scale.y=blink;re.current.scale.y=blink;le.current.position.x=-.18+gazeShift;re.current.position.x=.18+gazeShift}
    if(la.current&&ra.current&&lf.current&&rf.current){const g=talk?.12+v*.2:.035;la.current.rotation.z=-g;ra.current.rotation.z=g;if(think){ra.current.rotation.x=-.45;rf.current.rotation.x=-1}else if(s==="greeting"||s==="farewell"){ra.current.rotation.x=-.55;rf.current.rotation.z=Math.sin(t*4)*.55}else{ra.current.rotation.x=0;rf.current.rotation.x=talk?Math.sin(t*2.2)*(.05+v*.08):0}lf.current.rotation.x=talk?Math.sin(t*2+1)*(.04+v*.07):0}
    if(ll.current&&rl.current){const q=talk?Math.sin(t*1.9)*(.02+v*.025):Math.sin(t*.9)*.01;ll.current.rotation.x=q;rl.current.rotation.x=-q}
  });
  return <group ref={root} position={position} scale={1.05}>
    <group ref={torso}><mesh position={[0,1.55,0]} castShadow><boxGeometry args={[.9,1.25,.48]}/><meshStandardMaterial color={primary}/></mesh>
      <group ref={la} position={[-.58,1.85,0]}><mesh position={[0,-.38,0]}><cylinderGeometry args={[.13,.15,.76,10]}/><meshStandardMaterial color={primary}/></mesh><group ref={lf} position={[0,-.78,0]}><mesh position={[0,-.33,0]}><cylinderGeometry args={[.11,.13,.66,10]}/><meshStandardMaterial color={secondary}/></mesh><mesh position={[0,-.72,0]}><sphereGeometry args={[.14,10,10]}/><meshStandardMaterial color={secondary}/></mesh></group></group>
      <group ref={ra} position={[.58,1.85,0]}><mesh position={[0,-.38,0]}><cylinderGeometry args={[.13,.15,.76,10]}/><meshStandardMaterial color={primary}/></mesh><group ref={rf} position={[0,-.78,0]}><mesh position={[0,-.33,0]}><cylinderGeometry args={[.11,.13,.66,10]}/><meshStandardMaterial color={secondary}/></mesh><mesh position={[0,-.72,0]}><sphereGeometry args={[.14,10,10]}/><meshStandardMaterial color={secondary}/></mesh></group></group>
    </group>
    <group ref={head} position={[0,2.78,0]}><mesh><sphereGeometry args={[profile.silhouette.headScale,24,20]}/><meshStandardMaterial color={secondary}/></mesh>
      <mesh position={[0,.34,0]} scale={[1.02,.48,1.02]}><sphereGeometry args={[.52,18,12]}/><meshStandardMaterial color={profile.face.hair} roughness={.48}/></mesh>
      <mesh ref={le} position={[-.18,.05,.52]}><sphereGeometry args={[.09,12,12]}/><meshStandardMaterial color="#fff"/></mesh><mesh ref={re} position={[.18,.05,.52]}><sphereGeometry args={[.09,12,12]}/><meshStandardMaterial color="#fff"/></mesh><mesh position={[-.18,.19,.54]} rotation={[0,0,.12]}><boxGeometry args={[.18,.035,.025]}/><meshStandardMaterial color={accent}/></mesh><mesh position={[.18,.19,.54]} rotation={[0,0,-.12]}><boxGeometry args={[.18,.035,.025]}/><meshStandardMaterial color={accent}/></mesh>
      <group ref={mouth} position={[0,-.48,.53]} scale={[.75,.15,.35]}><mesh><sphereGeometry args={[.16,14,10]}/><meshStandardMaterial color="#160b12"/></mesh></group>
    </group>
    <group ref={ll} position={[-.25,.65,0]}><mesh position={[0,-.45,0]}><cylinderGeometry args={[.17,.19,.9,10]}/><meshStandardMaterial color={primary}/></mesh><mesh position={[0,-.98,.08]}><boxGeometry args={[.34,.18,.56]}/><meshStandardMaterial color={secondary}/></mesh></group>
    <group ref={rl} position={[.25,.65,0]}><mesh position={[0,-.45,0]}><cylinderGeometry args={[.17,.19,.9,10]}/><meshStandardMaterial color={primary}/></mesh><mesh position={[0,-.98,.08]}><boxGeometry args={[.34,.18,.56]}/><meshStandardMaterial color={secondary}/></mesh></group>
    <mesh position={[0,.03,0]}><torusGeometry args={[.72,.025,8,32]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.9}/></mesh>
    <mesh position={[0,1.58,.3]}><sphereGeometry args={[.07,10,10]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6}/></mesh>
  </group>
}
function AgentCharacter3DAsset({ url, position, performance }: { url:string; position:[number,number,number]; performance?: CharacterAnimationSignal }) {
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
        if (/(head|neck)/.test(name)) {
          node.rotation.y = base.y + Math.sin(t * .55) * .008;
          node.rotation.x = base.x + Math.sin(t * .8) * .006;
        }
        if (/(leftarm|rightarm|leftshoulder|rightshoulder)/.test(name)) {
          const side = /(left)/.test(name) ? -1 : 1;
          node.rotation.z = base.z + side * Math.sin(t * (speaking ? 1.7 : .8)) * (speaking ? .018 + level * .035 : .008);
        }
        if (/(leftforearm|rightforearm|lefthand|righthand)/.test(name) && speaking) {
          node.rotation.x = base.x + Math.sin(t * 2.1) * (.012 + level * .02);
        }
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



function WorldDistrictBoothV2View({ layer, lowPower, onHotspot, scene }: { layer: "world" | "district" | "booth"; lowPower: boolean; onHotspot?: Props["onHotspot"]; scene: WorldScene }) {
  const root = useRef<Group>(null);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const composition = useMemo(() => createWorldDistrictBoothV206(layer), [layer]);
  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    root.current.rotation.y = Math.sin(clock.getElapsedTime() * .12) * .025;
  });
  const colors = layer === "world"
    ? { core:"#42DCFF", node:"#A77CFF", accent:"#EE7CFF" }
    : layer === "district"
      ? { core:"#67E8F9", node:"#60A5FA", accent:"#A78BFA" }
      : { core:"#22D3EE", node:"#C084FC", accent:"#F0ABFC" };

  const actualNodes = layer === "world"
    ? scene.structures ?? []
    : layer === "district"
      ? scene.structures ?? []
      : scene.booths ?? [];

  const nodePositions = actualNodes.slice(0, lowPower ? 12 : 24).map((item, i) => ({
    id: item.id,
    position: item.position ?? { x: ((i % 5) - 2) * 1.8, y: 0, z: Math.floor(i / 5) * 1.7 - 1.7 },
    kind: item.kind ?? "structure",
    source: "authoritative",
  }));

  const themeKey = typeof scene.environment?.theme_key === "string" ? String(scene.environment.theme_key) : typeof scene.environment?.golden_theme === "string" ? String(scene.environment.golden_theme) : undefined;
  const architecture = typeof scene.environment?.architecture === "string" ? String(scene.environment.architecture) : undefined;
  return <group ref={root}>
    <ThemeV2SpatialScene themeKey={themeKey} architecture={architecture} layer={layer} lowPower={lowPower} reducedMotion={reduceMotion} />
    <mesh position={[0,-.65,0]}>
      <cylinderGeometry args={[layer==="world"?6.2:layer==="district"?4.7:2.8,.65, .55, lowPower?32:56]} />
      <meshStandardMaterial color="#07101d" metalness={.72} roughness={.26} />
    </mesh>
    <mesh position={[0,-.28,0]}>
      <cylinderGeometry args={[layer==="world"?5.6:layer==="district"?4.15:2.35,.18,.18, lowPower?32:48]} />
      <meshStandardMaterial color={colors.core} emissive={colors.core} emissiveIntensity={.45} transparent opacity={.35} />
    </mesh>

    {composition.paths.map((path, i) => {
      const a = composition.nodes.find(n => n.id === path.from)?.position ?? {x:0,y:0,z:0};
      const b = composition.nodes.find(n => n.id === path.to)?.position ?? {x:0,y:0,z:0};
      const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z, len=Math.sqrt(dx*dx+dy*dy+dz*dz);
      return <mesh key={"path-"+i} position={[(a.x+b.x)/2,(a.y+b.y)/2-.45,(a.z+b.z)/2]}>
        <boxGeometry args={[.035,.025,Math.max(.2,len)]}/>
        <meshStandardMaterial color={path.kind==="district-path"?colors.node:colors.accent} emissive={path.kind==="district-path"?colors.node:colors.accent} emissiveIntensity={.8} transparent opacity={.52}/>
      </mesh>;
    })}

    {composition.nodes.map((item) => {
      const p=item.position;
      const c=item.role==="world-core"?colors.core:item.role==="district"?colors.node:colors.accent;
      const scale=item.scale*(item.depth==="foreground"?1.06:item.depth==="background"?.9:1);
      return <group key={item.id} position={[p.x,p.y,p.z]} onClick={() => onHotspot?.({
        id:item.id,
        kind:item.role==="world-core"?"world":item.role==="district"?"district":"booth",
        position:p,
        presentation_only:true,
        metadata:{...item.metadata, depth:item.depth, spatial_layer:layer, golden_scene:false, v2_contract:"3d-v2.06"},
      })}>
        <mesh>
          <icosahedronGeometry args={[scale,lowPower?1:2]}/>
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.25} metalness={.5} roughness={.22}/>
        </mesh>
        <mesh rotation={[Math.PI/2,0,0]}>
          <torusGeometry args={[scale*1.45,.025,6,lowPower?24:40]}/>
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.1} transparent opacity={.68}/>
        </mesh>
      </group>;
    })}

    {nodePositions.map((item) => {
      const p=item.position;
      const scale=layer==="booth"?.24:layer==="district"?.34:.42;
      return <group key={"actual-"+item.id} position={[p.x,p.y,p.z]} onClick={() => onHotspot?.({
        id:item.id, kind:layer==="world"?"world":layer==="district"?"district":"booth", position:p, metadata:{source:item.source, object_kind:item.kind, spatial_layer:layer}
      })}>
        <mesh>
          <boxGeometry args={[scale*1.4,scale*1.8,scale*1.4]}/>
          <meshStandardMaterial color={colors.node} emissive={colors.node} emissiveIntensity={.75} metalness={.55} roughness={.3}/>
        </mesh>
        <mesh position={[0,scale*1.2,0]}>
          <octahedronGeometry args={[scale*.5,0]}/>
          <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={1.1}/>
        </mesh>
      </group>;
    })}
  </group>;
}

function GoldenSpatialLayerView({
  layer,
  lowPower,
  onHotspot,
  presence,
  agentCharacterAsset,
  agentCharacterPerformance,
}: {
  layer: "universe" | "galaxy" | "orbit";
  lowPower: boolean;
  onHotspot?: Props["onHotspot"];
  presence: SpatialPresence[];
  agentCharacterAsset?: Props["agentCharacterAsset"];
  agentCharacterPerformance?: Props["agentCharacterPerformance"];
}) {
  const root = useRef<Group>(null);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const composition = useMemo(() => createSpatialCompositionV205(layer), [layer]);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    root.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.035;
  });

  const colors = {
    universe: { core: "#42DCFF", node: "#A77CFF", accent: "#EE7CFF" },
    galaxy: { core: "#67E8F9", node: "#60A5FA", accent: "#A78BFA" },
    orbit: { core: "#22D3EE", node: "#C084FC", accent: "#F0ABFC" },
  }[layer];

  const nodes = composition.nodes.slice(0, lowPower ? 6 : composition.nodes.length);
  const rings = composition.rings.slice(0, lowPower ? 2 : composition.rings.length);

  return (
    <group ref={root}>
      <ThemeV2SpatialScene themeKey="crystal-ai-city" architecture="Crystal AI City" layer={layer} lowPower={lowPower} reducedMotion={reducedMotion} />
      <mesh position={[0, -0.65, 0]}>
        <sphereGeometry args={[layer === "universe" ? 2.1 : layer === "galaxy" ? 1.55 : 1.15, lowPower ? 16 : 24, lowPower ? 12 : 18]} />
        <meshStandardMaterial color={colors.core} emissive={colors.core} emissiveIntensity={1.1} transparent opacity={0.2} />
      </mesh>

      {rings.map((ring) => (
        <mesh key={ring.id} rotation={[ring.tilt, 0, ring.tilt * 0.45]}>
          <torusGeometry args={[ring.radius, lowPower ? 0.025 : 0.045, 8, lowPower ? 36 : 64]} />
          <meshStandardMaterial color={ring.depth === "near" ? colors.node : colors.accent} emissive={ring.depth === "near" ? colors.node : colors.accent} emissiveIntensity={0.9} transparent opacity={ring.opacity} />
        </mesh>
      ))}

      {nodes.map((node) => {
        const scale = node.scale * (node.depth === "foreground" ? 1.12 : node.depth === "background" ? 0.84 : 1);
        const color = node.role === "core" ? colors.core : node.role === "galaxy" ? colors.node : colors.accent;
        return (
          <group
            key={node.id}
            position={[node.position.x, node.position.y, node.position.z]}
            onClick={() => onHotspot?.({
              id: node.id,
              kind: node.role === "core" ? "universe" : node.role,
              position: node.position,
              presentation_only: true,
              metadata: { spatial_layer: layer, role: node.role, depth: node.depth, v2_contract: "3d-v2.05" },
            })}
          >
            <mesh>
              <icosahedronGeometry args={[scale, lowPower ? 1 : 2]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.25} metalness={0.42} roughness={0.22} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[scale * 1.45, 0.022, 8, lowPower ? 24 : 40]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.05} transparent opacity={0.68} />
            </mesh>
          </group>
        );
      })}

      {presence.filter((agent) => agent.position).slice(0, lowPower ? 2 : 4).map((agent) => {
        const p = agent.position!;
        return (
          <group key={"presence-" + agent.id} position={[p.x, p.y + 0.35, p.z]}>
            {agentCharacterAsset?.source === "platform_catalog" ? (
              <PlatformAgentCharacter3D
                characterKey={agentCharacterAsset.characterKey}
                position={[0, 0, 0]}
                performance={agentCharacterPerformance}
              />
            ) : (
              <mesh>
                <sphereGeometry args={[0.26, 12, 12]} />
                <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.9} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function ContentCapsuleSpatialView({
  items,
  lowPower,
  onHotspot,
}: {
  items: SpatialContent[];
  lowPower: boolean;
  onHotspot?: Props["onHotspot"];
}) {
  const root = useRef<Group>(null);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const composition = useMemo(
    () => createContentSpatialCompositionV207(items, lowPower),
    [items, lowPower],
  );
  const validation = useMemo(() => validateContentSpatialComposition(composition), [composition]);

  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    root.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.08) * 0.025;
  });

  if (!validation.ok || !composition.nodes.length) return null;

  const nodeById = new Map(composition.nodes.map((node) => [node.id, node]));

  return (
    <group ref={root}>
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, composition.fieldRadius, 64]} />
        <meshStandardMaterial color="#A77CFF" transparent opacity={lowPower ? 0.025 : 0.045} />
      </mesh>

      {composition.links.map((link) => {
        const from = nodeById.get(link.from);
        const to = nodeById.get(link.to);
        if (!from || !to) return null;
        const dx = to.position.x - from.position.x;
        const dy = to.position.y - from.position.y;
        const dz = to.position.z - from.position.z;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const angle = Math.atan2(dz, dx) - Math.PI / 2;
        return (
          <mesh
            key={link.from + ":" + link.to}
            position={[
              (from.position.x + to.position.x) / 2,
              (from.position.y + to.position.y) / 2,
              (from.position.z + to.position.z) / 2,
            ]}
            rotation={[0, angle, Math.atan2(dy, Math.sqrt(dx * dx + dz * dz))]}
          >
            <boxGeometry args={[0.018, 0.018, Math.max(0.2, length)]} />
            <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.8} transparent opacity={0.48} />
          </mesh>
        );
      })}

      {composition.nodes.map((node) => {
        const color = node.gravity === undefined ? "#FBBF24" : node.gravity >= 0.75 ? "#F0ABFC" : node.gravity >= 0.45 ? "#A78BFA" : "#67E8F9";
        const scale = node.scale * (node.depth === "foreground" ? 1.08 : node.depth === "background" ? 0.84 : 1);
        return (
          <group
            key={node.id}
            position={[node.position.x, node.position.y, node.position.z]}
            onClick={() => onHotspot?.({
              id: node.id,
              kind: "content",
              position: node.position,
              presentation_only: true,
              metadata: {
                content_id: node.id,
                title: node.title,
                gravity: node.gravity ?? null,
                relationship_count: node.relationshipCount,
                relationships: node.relationships,
                spatial_layer: "content-feed-universe",
                v2_contract: "3d-v2.07",
              },
            })}
          >
            <mesh>
              <capsuleGeometry args={[scale * 0.34, scale * 0.62, 6, 12]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.15} metalness={0.25} roughness={0.2} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[scale * 0.82, 0.022, 8, lowPower ? 24 : 40]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.95} transparent opacity={0.72} />
            </mesh>
            {node.relationshipCount > 0 ? (
              <mesh position={[0, scale * 0.9, 0]}>
                <sphereGeometry args={[0.06 + Math.min(0.12, node.relationshipCount * 0.012), 10, 10]} />
                <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function LiveCollaborationStageView({
  stageUrl,
  lowPower,
  humanPresentationActive = false,
  humanPresentationStatus,
  collaborationActive = false,
  consentApproved = false,
  riskAllowed = false,
  agentId,
  agentCharacterAsset,
  agentCharacterPerformance,
  themeKey,
  architecture,
  humanState,
  agentState,
}: {
  stageUrl?: string | null;
  lowPower: boolean;
  humanPresentationActive?: boolean;
  humanPresentationStatus?: string | null;
  collaborationActive?: boolean;
  consentApproved?: boolean;
  riskAllowed?: boolean;
  agentId?: string | null;
  agentCharacterAsset?: Props["agentCharacterAsset"];
  agentCharacterPerformance?: Props["agentCharacterPerformance"];
  themeKey?: string;
  architecture?: string;
  humanState?: LiveStageActorState;
  agentState?: LiveStageActorState;
}) {
  const root = useRef<Group>(null);
  const composition = useMemo(
    () => createLiveStageV208Composition({
      stageActive: Boolean(stageUrl),
      stageSource: stageUrl ? "dedicated_stage_asset" : "theme_stage",
      humanPresentationActive,
      humanPresentationStatus,
      collaborationActive,
      consentApproved,
      riskAllowed,
      agentId,
      humanState,
      agentState,
    }),
    [stageUrl, humanPresentationActive, humanPresentationStatus, collaborationActive, consentApproved, riskAllowed, agentId, humanState, agentState],
  );
  const validation = useMemo(() => validateLiveStageV208Composition(composition), [composition]);

  useFrame(({ clock }) => {
    if (!root.current || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.08) * 0.018;
  });

  if (!validation.ok) return null;

  return (
    <group ref={root}>
      {stageUrl ? <LiveStage3DAsset url={stageUrl} /> : null}

      {composition.actors.map((actor) => {
        if (actor.role === "ai-agent") {
          return agentCharacterAsset?.source === "platform_catalog" ? (
            <PlatformAgentCharacter3D
              key={actor.id}
              characterKey={agentCharacterAsset.characterKey}
              position={[actor.position.x, actor.position.y, actor.position.z]}
              performance={agentCharacterPerformance}
              themeKey={themeKey}
              architecture={architecture}
            />
          ) : (
            <group key={actor.id} position={[actor.position.x, actor.position.y, actor.position.z]}>
              <mesh>
                <sphereGeometry args={[0.34, lowPower ? 12 : 18, lowPower ? 10 : 14]} />
                <meshStandardMaterial color="#A78BFA" emissive="#A78BFA" emissiveIntensity={1.1} />
              </mesh>
              <mesh position={[0, 0.48, 0]}>
                <torusGeometry args={[0.46, 0.022, 8, lowPower ? 20 : 32]} />
                <meshStandardMaterial color="#67E8F9" emissive="#67E8F9" emissiveIntensity={0.9} />
              </mesh>
            </group>
          );
        }

        return (
          <group key={actor.id} position={[actor.position.x, actor.position.y, actor.position.z]}>
            <mesh position={[0, 0.92, 0]} castShadow>
              <capsuleGeometry args={[0.28, 0.78, 6, 12]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.42} />
            </mesh>
            <mesh position={[0, 1.62, 0]}>
              <sphereGeometry args={[0.28, 16, 12]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <torusGeometry args={[0.48, 0.024, 8, lowPower ? 20 : 32]} />
              <meshStandardMaterial color={humanPresentationStatus === "active" ? "#22D3EE" : "#64748B"} emissive={humanPresentationStatus === "active" ? "#22D3EE" : "#64748B"} emissiveIntensity={0.8} />
            </mesh>
          </group>
        );
      })}

      {composition.collaboration.active ? (
        <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.12, 64]} />
          <meshStandardMaterial
            color={composition.collaboration.consentApproved && composition.collaboration.riskAllowed ? "#22D3EE" : "#F59E0B"}
            emissive={composition.collaboration.consentApproved && composition.collaboration.riskAllowed ? "#22D3EE" : "#F59E0B"}
            emissiveIntensity={0.8}
            transparent
            opacity={0.5}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function WorldObjects({
  scene,tokens,onHotspot,lowPower,booths,presence,portals,content,spatialObjects,selectedBoothId,selectedDistrictId,themePackUrl,themeKey:themeKeyOverride,liveStageUrl,agentCharacterUrl,agentCharacterAsset,agentCharacterPerformance,liveStageMode,humanPresentationActive,humanPresentationStatus,liveCollaborationActive,liveCollaborationConsentApproved,liveCollaborationRiskAllowed,liveAgentId,humanPresentationState,liveAgentStageState
}: {
  scene:WorldScene; tokens?:Record<string,unknown>; onHotspot?:Props["onHotspot"]; lowPower:boolean;
  booths:SceneNode[]; presence:SpatialPresence[]; portals:SpatialPortal[]; content:SpatialContent[];
  spatialObjects:DistrictSpatialObject[];
  selectedBoothId?:string; selectedDistrictId?:string; themePackUrl?:string|null; themeKey?:string|null; liveStageUrl?:string|null; agentCharacterUrl?:string|null; agentCharacterAsset?:{source?:string|null;characterKey?:string|null;contract?:Record<string,unknown>|null}; agentCharacterPerformance?: Props["agentCharacterPerformance"]; liveStageMode?: boolean; humanPresentationActive?: boolean; humanPresentationStatus?: string|null; liveCollaborationActive?: boolean; liveCollaborationConsentApproved?: boolean; liveCollaborationRiskAllowed?: boolean; liveAgentId?: string|null; humanPresentationState?: LiveStageActorState; liveAgentStageState?: LiveStageActorState;
}) {
  const style=useMemo(()=>proceduralThemeStyle(scene),[scene]);
  const primary=String(tokens?.["theme.color.primary"]??style.accent);
  const secondary=String(tokens?.["theme.color.secondary"]??style.secondary);
  const accent=String(tokens?.["theme.effects.glow"]??style.accent);
  const color=primary.startsWith("#")?primary:style.accent;
  const zones=scene.zones;
  const density=lowPower?Math.min(4,style.density):style.density;
  const hasThemePack=Boolean(themePackUrl);
  const spatialLayer = String(scene.environment?.spatial_layer ?? "world");
  const themeKey = themeKeyOverride ?? (typeof scene.environment?.theme_key === "string" ? String(scene.environment.theme_key) : typeof scene.environment?.golden_theme === "string" ? String(scene.environment.golden_theme) : undefined);
  const architecture = typeof scene.environment?.architecture === "string" ? String(scene.environment.architecture) : undefined;
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const goldenLayer = String(scene.environment?.spatial_layer ?? "");
  if (goldenLayer === "universe") {
    return <CinematicProductionHero themeKey={themeKey} lowPower={lowPower} reducedMotion={reducedMotion} />;
  }
  if (goldenLayer === "galaxy" || goldenLayer === "orbit") {
    return <GoldenSpatialLayerView layer={goldenLayer} lowPower={lowPower} onHotspot={onHotspot} presence={presence} agentCharacterAsset={agentCharacterAsset} agentCharacterPerformance={agentCharacterPerformance}/>;
  }

  return <>
    {spatialLayer === "world" ? (
      <ThemeV2ProductionAssetScene
        themeKey={themeKey}
        category="world"
        lowPower={lowPower}
        reducedMotion={reducedMotion}
      />
    ) : null}
    {themePackUrl?<ThemePackEnvironment url={themePackUrl}/>:null}
    {liveStageMode ? <LiveCollaborationStageView stageUrl={liveStageUrl} lowPower={lowPower} humanPresentationActive={humanPresentationActive} humanPresentationStatus={humanPresentationStatus} collaborationActive={liveCollaborationActive} consentApproved={liveCollaborationConsentApproved} riskAllowed={liveCollaborationRiskAllowed} agentId={liveAgentId} agentCharacterAsset={agentCharacterAsset} agentCharacterPerformance={agentCharacterPerformance} themeKey={typeof scene.environment?.golden_theme==="string"?String(scene.environment.golden_theme):undefined} architecture={typeof scene.environment?.architecture==="string"?String(scene.environment.architecture):undefined} humanState={humanPresentationState} agentState={liveAgentStageState}/> : (liveStageUrl ? <LiveStage3DAsset url={liveStageUrl}/> : null)}
    {!hasThemePack ? <ThemeV2SpatialScene themeKey={themeKey} architecture={architecture} layer={(["universe","galaxy","world","district","booth","content","live"].includes(spatialLayer) ? spatialLayer : "world") as "universe"|"galaxy"|"world"|"district"|"booth"|"content"|"live"} lowPower={lowPower} reducedMotion={reducedMotion} /> : null}

    {zones.map((zone,i)=>{
      const angle=(i/Math.max(1,zones.length))*Math.PI*2;
      const x=Math.cos(angle)*5.4,z=Math.sin(angle)*5.4;
      return <group key={zone.id} position={[x,0,z]} onClick={()=>onHotspot?.({id:zone.id,kind:"zone",metadata:{type:zone.type,presentation_only:true}})}>
        <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.42,.018,6,24]}/><meshStandardMaterial color={i===0?color:style.secondary} emissive={i===0?color:style.secondary} emissiveIntensity={.8} transparent opacity={.72}/></mesh>
      </group>;
    })}

    {presence.filter(agent=>agent.position).map(agent=>{
      const p=agent.position!;
      const selected=agent.id===selectedBoothId;
      return <group key={agent.id} position={[p.x,p.y+.55,p.z]} onClick={()=>onHotspot?.({id:agent.id,kind:"character",position:p,metadata:{agent_id:agent.agent_id,movement_state:agent.movement_state,zone_key:agent.zone_key}})}>
        {agentCharacterAsset?.source==="platform_catalog"?<PlatformAgentCharacter3D characterKey={agentCharacterAsset.characterKey} position={[0,.05,0]} performance={agentCharacterPerformance} themeKey={typeof scene.environment?.golden_theme==="string"?String(scene.environment.golden_theme):undefined} architecture={typeof scene.environment?.architecture==="string"?String(scene.environment.architecture):undefined}/>:agentCharacterUrl&&agent.agent_id?<AgentCharacter3DAsset url={agentCharacterUrl} position={[0,.05,0]} performance={agentCharacterPerformance}/>:<mesh><sphereGeometry args={[selected?.42:.32,14,14]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={selected?1:.55}/></mesh>}
        <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[selected?.72:.55,.035,8,32]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} transparent opacity={.8}/></mesh>
      </group>;
    })}

    {booths.map((booth,i)=>{
      const x=booth.position?.x??(i%4)*2.8-4.2,y=booth.position?.y??0,z=booth.position?.z??Math.floor(i/4)*2.8-2.8;
      const modelUrl=typeof booth.metadata?.model_url==="string"?booth.metadata.model_url:null;
      const scale=booth.scale?.x??1,selected=booth.id===selectedBoothId;
      return modelUrl?<Booth3DAsset key={booth.id} url={modelUrl} position={[x,y,z]} scale={selected?scale*1.08:scale} onClick={()=>onHotspot?.(booth)}/>:themePackUrl?<BoothThemeTemplate key={booth.id} url={themePackUrl} position={[x,y,z]} scale={(selected?scale*1.08:scale)*.9} onClick={()=>onHotspot?.(booth)}/>:<group key={booth.id} position={[x,y,z]} onClick={()=>onHotspot?.(booth)}><mesh position={[0,.8,0]} castShadow><boxGeometry args={[1.6,1.6,1.6]}/><meshStandardMaterial color={selected?"#f0abfc":accent} emissive={selected?"#d946ef":accent} emissiveIntensity={selected?1.3:.35} metalness={.25} roughness={.55}/></mesh><mesh position={[0,1.75,0]} rotation={[0,Math.PI/4,0]}><torusGeometry args={[.58,.06,8,24]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.8}/></mesh></group>;
    })}

    {portals.map(portal=>{
      const p=portal.position??{x:0,y:.8,z:-5};
      return <group key={portal.id} onClick={()=>onHotspot?.({id:portal.id,kind:"portal",position:p,metadata:{target_world_id:portal.target,presentation_only:true}})}>
        <SpatialPortalFx mode="portal" layer={spatialLayer as any} color={accent} secondaryColor={style.secondary} lowPower={lowPower} reducedMotion={reducedMotion} position={[p.x,p.y,p.z]} onActivate={()=>onHotspot?.({id:portal.id,kind:"portal",position:p,metadata:{target_world_id:portal.target,presentation_only:true}})} />
      </group>;
    })}

    {spatialObjects.map((object,i)=>{
      const angle=(i/Math.max(1,spatialObjects.length))*Math.PI*2;
      const radius=4.2+(i%3)*1.15;
      const p=object.spatial_config?.position as {x?:number;y?:number;z?:number}|undefined;
      const x=typeof p?.x==="number"?p.x:Math.cos(angle)*radius;
      const y=typeof p?.y==="number"?p.y:0;
      const z=typeof p?.z==="number"?p.z:Math.sin(angle)*radius;
      const kind=object.object_type;
      const height=kind==="building"?2.4:kind==="meeting_room"||kind==="coworking"?1.7:kind==="road"?0.12:1.05;
      const width=kind==="road"?4.2:kind==="building"?1.8:1.45;
      const depth=kind==="road"?0.55:kind==="building"?1.8:1.45;
      return <group key={object.id} position={[x,y,z]} onClick={()=>onHotspot?.({id:object.id,kind:"district_object",position:{x,y,z},metadata:{object_type:kind,name:object.name,availability:object.availability,capacity:object.capacity??null}})}>
        <mesh castShadow rotation={kind==="road"?[0,0,0]:[0,(i%4)*0.35,0]}>
          <boxGeometry args={[width,height,depth]}/>
          <meshStandardMaterial color={object.status==="active"?accent:secondary} transparent opacity={object.status==="active"?.9:.45}/>
        </mesh>
        {kind!=="road"&&<mesh position={[0,height/2+.12,0]}><sphereGeometry args={[.12,10,10]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.7}/></mesh>}
      </group>;
    })}

    {content.length ? <ContentCapsuleSpatialView items={content} lowPower={lowPower} onHotspot={onHotspot}/> : null}

    {scene.spawn_points.map((p,i)=>{
      const x=p.position?.x??(i===0?0:2),z=p.position?.z??(i===0?0:2);
      return <mesh key={p.id} position={[x,.08,z]}><cylinderGeometry args={[.25,.25,.08,16]}/><meshStandardMaterial color="#f8fafc"/></mesh>;
    })}
  </>;
}

import { SpatialMotionLayer } from "./spatial-motion-v2";
import { SpatialPortalFx } from "./spatial-portal-fx-v2";

export default function AllphaWorldRenderer({
  scene,tokens,lowPower=false,onHotspot,booths=[],presence=[],portals=[],content=[],spatialObjects=[],selectedBoothId,selectedDistrictId,themePackUrl=null,themeKey:themeKeyOverride=null,liveStageUrl=null,agentCharacterUrl=null,agentCharacterAsset,agentCharacterPerformance,
  liveStageMode,
  humanPresentationActive,
  humanPresentationStatus,
  liveCollaborationActive,
  liveCollaborationConsentApproved,
  liveCollaborationRiskAllowed,
  liveAgentId,
  humanPresentationState,
  liveAgentStageState,
}: Props) {
  if(!scene)return <div className="flex h-full min-h-[520px] items-center justify-center bg-black/30 p-8 text-center text-sm text-white/40">No validated Theme/World Scene is available for this layer.</div>;
  const shadows=!lowPower,style=proceduralThemeStyle(scene),dpr=(lowPower?[1,1.25]:[1,1.75]) as [number,number];
  const goldenLayer=String(scene.environment?.spatial_layer ?? "");
  const spatialLayer=String(scene.environment?.spatial_layer ?? "");
  const themeKey = themeKeyOverride ?? (typeof scene.environment?.theme_key === "string" ? String(scene.environment.theme_key) : typeof scene.environment?.golden_theme === "string" ? String(scene.environment.golden_theme) : undefined);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return <div className="relative h-[420px] w-full overflow-hidden bg-black sm:h-[560px]" data-allpha-3d-runtime="true">
    <Canvas dpr={dpr} shadows={shadows} performance={{min:.55}} gl={{antialias:!lowPower,powerPreference:lowPower?"low-power":"high-performance"}} onCreated={({ gl }) => configureCinematicRenderer(gl, lowPower)}>
      <Cinematic3DScene themeKey={themeKey} layer={(spatialLayer || goldenLayer || "universe") as any} lowPower={lowPower} reducedMotion={reducedMotion}>
      <SpatialMotionLayer layer={(spatialLayer || goldenLayer || "universe") as any} lowPower={lowPower} reducedMotion={reducedMotion} />
      
      <PerspectiveCamera makeDefault position={goldenLayer ? (goldenLayer === "universe" ? [0, 6.2, 15.5] : goldenLayer === "galaxy" ? [0, 5.4, 13.2] : [0, 4.8, 11.2]) : [14,11,14]} fov={goldenLayer ? (goldenLayer === "universe" ? 48 : 50) : 58} onUpdate={(camera) => camera.lookAt(0, 1.2, 0)}/>
      <ambientLight intensity={.22}/>
      <directionalLight position={[8,14,6]} intensity={.8} castShadow={shadows}/>
      {(["world","district","booth"].includes(spatialLayer)) ? <WorldDistrictBoothV2View layer={spatialLayer as "world"|"district"|"booth"} lowPower={lowPower} onHotspot={onHotspot} scene={scene}/> : null}
      <WorldObjects scene={scene} tokens={tokens} themeKey={themeKey} onHotspot={onHotspot} lowPower={lowPower} booths={booths} presence={presence} portals={portals} content={content} spatialObjects={spatialObjects} selectedBoothId={selectedBoothId} selectedDistrictId={selectedDistrictId} themePackUrl={themePackUrl} liveStageUrl={liveStageUrl} agentCharacterUrl={agentCharacterUrl} agentCharacterAsset={agentCharacterAsset} agentCharacterPerformance={agentCharacterPerformance} liveStageMode={liveStageMode} humanPresentationActive={humanPresentationActive} humanPresentationStatus={humanPresentationStatus} liveCollaborationActive={liveCollaborationActive} liveCollaborationConsentApproved={liveCollaborationConsentApproved} liveCollaborationRiskAllowed={liveCollaborationRiskAllowed} liveAgentId={liveAgentId} humanPresentationState={humanPresentationState} liveAgentStageState={liveAgentStageState}/>
      <OrbitControls enablePan={!lowPower} minDistance={5} maxDistance={32} maxPolarAngle={Math.PI*.48} enableDamping dampingFactor={.08}/>
          </Cinematic3DScene>
    </Canvas>
  </div>;
}
