"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { WorldScene, SceneNode } from "../../lib/world-engine/scene-schema";

type Props={scene:WorldScene; lowPower?:boolean; onHotspot?: (node:SceneNode)=>void; booths?:SceneNode[]};

function WorldObjects({scene,onHotspot,lowPower,booths}:{scene:WorldScene;onHotspot?:Props["onHotspot"];lowPower:boolean;booths:SceneNode[]}){
  const primary=String((scene.lighting as any)?.key ?? "#334155").replace("theme.color.primary", "#4f46e5");
  const accent=String((scene.lighting as any)?.emissive ?? "#38bdf8").replace("theme.effects.glow", "#38bdf8");
  const color=primary.startsWith("#")?primary:"#4f46e5";
  const accentColor=accent.startsWith("#")?accent:"#38bdf8";
  const zones=scene.zones;
  return <>
    <mesh position={[0,-0.3,0]} receiveShadow><boxGeometry args={[28,0.5,28]}/><meshStandardMaterial color="#111827" roughness={0.9}/></mesh>
    <mesh position={[0,-0.02,0]}><boxGeometry args={[22,0.06,22]}/><meshStandardMaterial color="#1f2937"/></mesh>
    {zones.map((zone,i)=>{const angle=(i/Math.max(1,zones.length))*Math.PI*2;const x=Math.cos(angle)*6;const z=Math.sin(angle)*6;return <group key={zone.id} position={[x,0,z]}>
      <mesh castShadow onClick={()=>onHotspot?.({id:zone.id,kind:"zone",metadata:{type:zone.type}})}><boxGeometry args={[3.4,0.5,3.4]}/><meshStandardMaterial color={i===0?color:"#334155"}/></mesh>
      <mesh position={[0,1.2,0]} castShadow><boxGeometry args={[2.4,2.2,2.4]}/><meshStandardMaterial color={i%2?accentColor:"#64748b"} metalness={0.15} roughness={0.65}/></mesh>
      {!lowPower && <mesh position={[0,2.7,0]}><sphereGeometry args={[0.45,16,16]}/><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8}/></mesh>}
    </group>})}
    {booths.map((booth,i)=>{const x=booth.position?.x ?? (i%4)*2.8-4.2;const z=booth.position?.z ?? (Math.floor(i/4))*2.8-2.8;return <mesh key={booth.id} position={[x,0.8,z]} castShadow onClick={()=>onHotspot?.(booth)}><boxGeometry args={[1.6,1.6,1.6]}/><meshStandardMaterial color={accentColor} metalness={0.25} roughness={0.55}/></mesh>})}
    {scene.spawn_points.map((p,i)=>{const x=p.position?.x ?? (i===0?0:2);const z=p.position?.z ?? (i===0?0:2);return <mesh key={p.id} position={[x,0.08,z]}><cylinderGeometry args={[0.25,0.25,0.08,16]}/><meshStandardMaterial color="#f8fafc"/></mesh>})}
  </>;
}
function MotionCamera(){const ref=useRef<THREE.Group>(null);useFrame((_,delta)=>{if(ref.current)ref.current.rotation.y+=delta*0.01});return <group ref={ref}/>}

export default function AllphaWorldRenderer({scene,lowPower=false,onHotspot,booths=[]}:Props){
  const shadows=!lowPower;
  const dpr=lowPower?[1,1.25]:[1,1.75] as [number,number];
  const background=useMemo(()=>"#070b14",[]);
  return <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
    <Canvas dpr={dpr} shadows={shadows} gl={{antialias:!lowPower,powerPreference:lowPower?"low-power":"high-performance"}}>
      <color attach="background" args={[background]}/><PerspectiveCamera makeDefault position={[14,11,14]} fov={58}/><ambientLight intensity={0.8}/><directionalLight position={[8,14,6]} intensity={2} castShadow={shadows}/>
      <WorldObjects scene={scene} onHotspot={onHotspot} lowPower={lowPower} booths={booths}/><MotionCamera/><OrbitControls enablePan={!lowPower} minDistance={5} maxDistance={32} maxPolarAngle={Math.PI*0.48}/>
    </Canvas>
  </div>;
}
