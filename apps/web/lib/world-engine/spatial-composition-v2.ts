import type { Vec3 } from "./scene-schema";

export type SpatialCompositionLayer = "universe" | "galaxy" | "orbit";
export type SpatialNodeRole = "core" | "galaxy" | "world" | "orbit";
export type SpatialCompositionNode = { id:string; role:SpatialNodeRole; position:Vec3; scale:number; depth:"foreground"|"midground"|"background"; orbitRadius?:number; phase?:number; label?:string };
export type SpatialComposition = { layer:SpatialCompositionLayer; version:"3d-v2.05"; focal:Vec3; nodes:SpatialCompositionNode[]; rings:Array<{id:string;radius:number;tilt:number;opacity:number;depth:"near"|"far"}>; particleBudget:number; presentationOnly:true };
const node=(id:string,role:SpatialNodeRole,position:Vec3,scale:number,depth:SpatialCompositionNode["depth"],extra:Partial<SpatialCompositionNode>={}):SpatialCompositionNode=>({id,role,position,scale,depth,...extra});

export function createSpatialCompositionV205(layer:SpatialCompositionLayer):SpatialComposition {
  if(layer==="universe") return {layer,version:"3d-v2.05",focal:{x:0,y:0,z:0},presentationOnly:true,
    nodes:[node("universe-core","core",{x:0,y:0,z:0},1.35,"foreground"),node("galaxy-anchor-alpha","galaxy",{x:-5.2,y:1.15,z:-1.8},1.05,"midground",{orbitRadius:5.6,phase:.2,label:"Galaxy Alpha"}),node("galaxy-anchor-beta","galaxy",{x:4.9,y:-.15,z:.7},.95,"midground",{orbitRadius:5.1,phase:2.3,label:"Galaxy Beta"}),node("galaxy-anchor-gamma","galaxy",{x:-2.1,y:-.95,z:5.8},.88,"background",{orbitRadius:6.2,phase:4.2,label:"Galaxy Gamma"})],
    rings:[{id:"universe-near",radius:3.45,tilt:.16,opacity:.82,depth:"near"},{id:"universe-mid",radius:5.55,tilt:-.28,opacity:.56,depth:"near"},{id:"universe-far",radius:7.8,tilt:.48,opacity:.34,depth:"far"}],particleBudget:34};
  if(layer==="galaxy") return {layer,version:"3d-v2.05",focal:{x:0,y:0,z:0},presentationOnly:true,
    nodes:[node("galaxy-core","core",{x:0,y:0,z:0},1.15,"foreground"),node("world-node-1","world",{x:3.25,y:.85,z:-.25},.76,"midground",{orbitRadius:3.4,phase:.1,label:"World One"}),node("world-node-2","world",{x:-2.85,y:-.55,z:1.25},.7,"midground",{orbitRadius:3.15,phase:2,label:"World Two"}),node("world-node-3","world",{x:.75,y:1,z:-4.65},.66,"background",{orbitRadius:4.7,phase:4,label:"World Three"}),node("world-node-4","world",{x:.1,y:-.72,z:4.55},.62,"background",{orbitRadius:4.55,phase:5.4,label:"World Four"})],
    rings:[{id:"galaxy-primary",radius:3.35,tilt:.18,opacity:.8,depth:"near"},{id:"galaxy-secondary",radius:5.15,tilt:-.34,opacity:.42,depth:"far"}],particleBudget:26};
  const nodes=Array.from({length:8},(_,index)=>{const angle=index/8*Math.PI*2;return node("orbit-node-"+index,"orbit",{x:Math.cos(angle)*3.55,y:Math.sin(angle*2)*.5,z:Math.sin(angle)*3.55},index%2===0?.38:.3,index%3===0?"foreground":index%3===1?"midground":"background",{orbitRadius:3.55,phase:angle,label:"Orbit Node "+(index+1)});});
  return {layer,version:"3d-v2.05",focal:{x:0,y:0,z:0},presentationOnly:true,nodes:[node("orbit-core","core",{x:0,y:0,z:0},.92,"foreground"),...nodes],rings:[{id:"orbit-inner",radius:2.75,tilt:.2,opacity:.78,depth:"near"},{id:"orbit-outer",radius:4.25,tilt:-.38,opacity:.46,depth:"far"}],particleBudget:18};
}