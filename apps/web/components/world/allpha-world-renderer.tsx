"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { createGoldenScene } from "../../lib/world-engine/golden-scene";
import { createSpatialCompositionV205 } from "../../lib/world-engine/spatial-composition-v2";
import type { Group } from "three";
import type { WorldScene, SceneNode } from "../../lib/world-engine/scene-schema";
import { proceduralThemeStyle } from "../../lib/world-engine/procedural-theme";
import type { CharacterAnimationSignal } from "../../lib/live-character-animation";
import { createCharacterV2Profile, normalizeCharacterV2Signal } from "../../lib/live-character-v2";

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
  liveStageUrl?: string | null;
  agentCharacterUrl?: string | null;
  agentCharacterAsset?: { source?: string | null; characterKey?: string | null; contract?: Record<string, unknown> | null };
  agentCharacterPerformance?: CharacterAnimationSignal;
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



function GoldenSpatialLayerView({ layer, lowPower, onHotspot, presence, agentCharacterAsset, agentCharacterPerformance }: { layer: "universe" | "galaxy" | "orbit"; lowPower: boolean; onHotspot?: Props["onHotspot"]; presence: SpatialPresence[]; agentCharacterAsset?: Props["agentCharacterAsset"]; agentCharacterPerformance?: Props["agentCharacterPerformance"] }) {
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = useRef<Group>(null);
  const scene = useMemo(() => createGoldenScene(layer), [layer]);
  const composition = useMemo(() => createSpatialCompositionV205(layer), [layer]);
  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    const t = clock.getElapsedTime();
    root.current.rotation.y = lowPower ? t * .018 : t * .038;
  });

  const core = "#42DCFF";
  const intelligence = "#A77CFF";
  const social = "#EE7CFF";
  const world = "#67E8F9";

  return (
    <group ref={root}>
      <mesh position={[0, -.35, -1.8]}>
        <sphereGeometry args={[layer === "universe" ? 2.2 : layer === "galaxy" ? 1.7 : 1.35, lowPower ? 20 : 32, lowPower ? 14 : 24]} />
        <meshStandardMaterial color={core} emissive={core} emissiveIntensity={1.4} metalness={.35} roughness={.18} />
      </mesh>
      <mesh position={[0, -.35, -1.8]}>
        <sphereGeometry args={[layer === "universe" ? 2.8 : 2.15, lowPower ? 16 : 24, lowPower ? 12 : 18]} />
        <meshStandardMaterial color={core} emissive={core} emissiveIntensity={.18} transparent opacity={.08} />
      </mesh>

      {composition.rings.map((ring) => (
        <mesh key={ring.id} position={[0, -.35, 0]} rotation={[Math.PI / 2 + ring.tilt, 0, 0]}>
          <torusGeometry args={[ring.radius, layer === "orbit" ? .055 : .045, 8, lowPower ? 48 : 88]} />
          <meshStandardMaterial color={ring.depth === "near" ? core : intelligence} emissive={ring.depth === "near" ? core : intelligence} emissiveIntensity={ring.depth === "near" ? 1.15 : .75} transparent opacity={ring.opacity} />
        </mesh>
      ))}

      {Array.from({ length: lowPower ? Math.max(8, Math.floor(composition.particleBudget * .55)) : composition.particleBudget }, (_, i) => {
        const a = i * 2.399;
        const radius = layer === "universe" ? 8.4 + (i % 6) * 1.15 : 6.6 + (i % 5) * .8;
        const y = ((i % 7) - 3) * .55;
        return (
          <mesh key={"particle-" + i} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}>
            <sphereGeometry args={[i % 5 === 0 ? .045 : .022, 7, 7]} />
            <meshStandardMaterial color={i % 4 === 0 ? intelligence : core} emissive={i % 4 === 0 ? intelligence : core} emissiveIntensity={1.2} />
          </mesh>
        );
      })}

      {composition.nodes.filter((item) => item.role !== "core").map((item) => {
        const p = item.position;
        const nodeColor = item.role === "galaxy" ? social : item.role === "world" ? world : intelligence;
        const depthScale = item.depth === "foreground" ? 1.08 : item.depth === "midground" ? 1 : .9;
        const scale = item.scale * depthScale;
        return (
          <group key={item.id} position={[p.x, p.y, p.z]} onClick={() => onHotspot?.({
            id: item.id,
            kind: item.role === "galaxy" ? "galaxy" : item.role === "world" ? "world" : "orbit",
            position: p,
            presentation_only: true,
            metadata: { label: item.label ?? null, depth: item.depth, spatial_layer: layer, golden_scene: true },
          })}>
            <mesh>
              <icosahedronGeometry args={[scale, lowPower ? 1 : 2]} />
              <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={1.65} metalness={.42} roughness={.2} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[scale * 1.55, .026, 6, lowPower ? 24 : 40]} />
              <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={1.25} transparent opacity={.7} />
            </mesh>
            <mesh position={[0, -scale * 1.7, 0]}>
              <coneGeometry args={[scale * .14, scale * 1.9, 6]} />
              <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={.7} transparent opacity={.38} />
            </mesh>
          </group>
        );
      })}

      {presence.filter((agent) => agent.position).map((agent) => {
        const p = agent.position!;
        return (
          <group key={"presence-" + agent.id} position={[p.x, p.y + .5, p.z]} onClick={() => onHotspot?.({
            id: agent.id, kind: "character", position: p,
            metadata: { agent_id: agent.agent_id, movement_state: agent.movement_state, zone_key: agent.zone_key },
          })}>
            {agentCharacterAsset?.source === "platform_catalog" ? (
              <PlatformAgentCharacter3D characterKey={agentCharacterAsset.characterKey} position={[0, .05, 0]} performance={agentCharacterPerformance} themeKey="crystal-ai-city" architecture="Crystal AI City" />
            ) : (
              <mesh><sphereGeometry args={[.28, 12, 12]} /><meshStandardMaterial color={social} emissive={social} emissiveIntensity={1.1} /></mesh>
            )}
            <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.52, .03, 8, 28]} /><meshStandardMaterial color={social} emissive={social} emissiveIntensity={1.1} transparent opacity={.78} /></mesh>
          </group>
        );
      })}

      <mesh position={[0, -.34, -1.8]}>
        <torusGeometry args={[layer === "universe" ? 2.15 : 1.55, .018, 6, 48]} />
        <meshStandardMaterial color={core} emissive={core} emissiveIntensity={1.8} transparent opacity={.55} />
      </mesh>

      {scene.portals?.map((portal) => {
        const p = portal.position ?? { x: 0, y: 0, z: 0 };
        return <group key={portal.id} position={[p.x, p.y, p.z]} />;
      })}
    </group>
  );
}

function WorldObjects({
  scene,tokens,onHotspot,lowPower,booths,presence,portals,content,spatialObjects,selectedBoothId,selectedDistrictId,themePackUrl,liveStageUrl,agentCharacterUrl,agentCharacterAsset,agentCharacterPerformance
}: {
  scene:WorldScene; tokens?:Record<string,unknown>; onHotspot?:Props["onHotspot"]; lowPower:boolean;
  booths:SceneNode[]; presence:SpatialPresence[]; portals:SpatialPortal[]; content:SpatialContent[];
  spatialObjects:DistrictSpatialObject[];
  selectedBoothId?:string; selectedDistrictId?:string; themePackUrl?:string|null; liveStageUrl?:string|null; agentCharacterUrl?:string|null; agentCharacterAsset?:{source?:string|null;characterKey?:string|null;contract?:Record<string,unknown>|null}; agentCharacterPerformance?: Props["agentCharacterPerformance"];
}) {
  const style=useMemo(()=>proceduralThemeStyle(scene),[scene]);
  const primary=String(tokens?.["theme.color.primary"]??style.accent);
  const secondary=String(tokens?.["theme.color.secondary"]??style.secondary);
  const accent=String(tokens?.["theme.effects.glow"]??style.accent);
  const color=primary.startsWith("#")?primary:style.accent;
  const zones=scene.zones;
  const density=lowPower?Math.min(4,style.density):style.density;
  const hasThemePack=Boolean(themePackUrl);
  const goldenLayer = String(scene.environment?.spatial_layer ?? "");
  if (goldenLayer === "universe" || goldenLayer === "galaxy" || goldenLayer === "orbit") {
    return <GoldenSpatialLayerView layer={goldenLayer} lowPower={lowPower} onHotspot={onHotspot} presence={presence} agentCharacterAsset={agentCharacterAsset} agentCharacterPerformance={agentCharacterPerformance}/>;
  }

  return <>
    {themePackUrl?<ThemePackEnvironment url={themePackUrl}/>:null}
    {liveStageUrl?<LiveStage3DAsset url={liveStageUrl}/>:null}
    {!hasThemePack&&<><mesh position={[0,-.3,0]} receiveShadow><boxGeometry args={[28,.5,28]}/><meshStandardMaterial color={style.ground} roughness={.9}/></mesh><mesh position={[0,-.02,0]}><boxGeometry args={[22,.06,22]}/><meshStandardMaterial color={secondary}/></mesh></>}
    {!hasThemePack&&style.water&&!lowPower&&<mesh position={[0,.02,-5]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[4,32]}/><meshStandardMaterial color={accent} transparent opacity={.28} metalness={.2}/></mesh>}
    {!hasThemePack&&style.ring&&!lowPower&&<mesh position={[0,2.8,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[4.8,.08,8,64]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.5}/></mesh>}

    {zones.map((zone,i)=>{
      const angle=(i/Math.max(1,zones.length))*Math.PI*2;
      const x=Math.cos(angle)*6,z=Math.sin(angle)*6;
      return <group key={zone.id} position={[x,0,z]}><mesh onClick={()=>onHotspot?.({id:zone.id,kind:"zone",metadata:{type:zone.type}})}><boxGeometry args={[3.4,.45,3.4]}/><meshStandardMaterial color={i===0?color:style.secondary} transparent={hasThemePack} opacity={hasThemePack?.04:1}/></mesh>{!hasThemePack&&<Structure kind={style.structure} color={style.secondary} accent={accent} position={[0,0,0]} scale={.75+(i%3)*.1}/>}</group>;
    })}

    {!hasThemePack&&Array.from({length:density}).map((_,i)=>{
      const a=i/density*Math.PI*2,r=8+(i%3)*1.1;
      return <Structure key={"decor-"+i} kind={style.structure} color={style.secondary} accent={accent} position={[Math.cos(a)*r,.05,Math.sin(a)*r]} scale={.45+(i%2)*.12}/>;
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
      return <group key={portal.id} position={[p.x,p.y,p.z]} onClick={()=>onHotspot?.({id:portal.id,kind:"portal",position:p,metadata:{target_world_id:portal.target,presentation_only:true}})}><mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.9,.11,12,48]}/><meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={1.8}/></mesh><mesh><sphereGeometry args={[.56,20,20]}/><meshStandardMaterial color="#160d2a" emissive="#7e22ce" emissiveIntensity={.75} transparent opacity={.72}/></mesh></group>;
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

    {content.slice(0,16).map((item,i)=>{
      const p=item.position??{x:(i%4)*2.4-3.6,y:2+(i%2)*.4,z:-1+Math.floor(i/4)*2.2};
      return <group key={item.id} position={[p.x,p.y,p.z]} onClick={()=>onHotspot?.({id:item.id,kind:"content",position:p,metadata:{title:item.title??null,presentation_only:true}})}><mesh><octahedronGeometry args={[.24,0]}/><meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.4}/></mesh></group>;
    })}

    {scene.spawn_points.map((p,i)=>{
      const x=p.position?.x??(i===0?0:2),z=p.position?.z??(i===0?0:2);
      return <mesh key={p.id} position={[x,.08,z]}><cylinderGeometry args={[.25,.25,.08,16]}/><meshStandardMaterial color="#f8fafc"/></mesh>;
    })}
  </>;
}

export default function AllphaWorldRenderer({
  scene,tokens,lowPower=false,onHotspot,booths=[],presence=[],portals=[],content=[],spatialObjects=[],selectedBoothId,selectedDistrictId,themePackUrl=null,liveStageUrl=null,agentCharacterUrl=null,agentCharacterAsset,agentCharacterPerformance
}: Props) {
  if(!scene)return <div className="flex h-full min-h-[520px] items-center justify-center bg-black/30 p-8 text-center text-sm text-white/40">No validated Theme/World Scene is available for this layer.</div>;
  const shadows=!lowPower,style=proceduralThemeStyle(scene),dpr=(lowPower?[1,1.25]:[1,1.75]) as [number,number];
  return <div className="relative h-full min-h-[420px] w-full overflow-hidden bg-black">
    <Canvas dpr={dpr} shadows={shadows} performance={{min:.55}} gl={{antialias:!lowPower,powerPreference:lowPower?"low-power":"high-performance"}}>
      <color attach="background" args={[style.sky]}/>
      <PerspectiveCamera makeDefault position={goldenLayer ? (goldenLayer === "universe" ? [0, 6.2, 15.5] : goldenLayer === "galaxy" ? [0, 5.4, 13.2] : [0, 4.8, 11.2]) : [14,11,14]} fov={goldenLayer ? (goldenLayer === "universe" ? 48 : 50) : 58}/>
      <ambientLight intensity={.8}/>
      <directionalLight position={[8,14,6]} intensity={2} castShadow={shadows}/>
      <WorldObjects scene={scene} tokens={tokens} onHotspot={onHotspot} lowPower={lowPower} booths={booths} presence={presence} portals={portals} content={content} spatialObjects={spatialObjects} selectedBoothId={selectedBoothId} selectedDistrictId={selectedDistrictId} themePackUrl={themePackUrl} liveStageUrl={liveStageUrl} agentCharacterUrl={agentCharacterUrl} agentCharacterAsset={agentCharacterAsset} agentCharacterPerformance={agentCharacterPerformance}/>
      <OrbitControls enablePan={!lowPower} minDistance={5} maxDistance={32} maxPolarAngle={Math.PI*.48} enableDamping dampingFactor={.08}/>
    </Canvas>
  </div>;
}
