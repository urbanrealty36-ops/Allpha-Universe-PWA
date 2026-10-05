import type { Vec3 } from "./scene-schema";

export type WorldDistrictBoothLayer = "world" | "district" | "booth";
export type SpatialDepth = "foreground" | "midground" | "background";

export type WorldDistrictBoothNode = {
  id: string;
  role: "world-core" | "district" | "booth";
  position: Vec3;
  scale: number;
  depth: SpatialDepth;
  zoneKey?: string;
  metadata?: Record<string, unknown>;
};

export type WorldDistrictBoothComposition = {
  version: "3d-v2.06";
  layer: WorldDistrictBoothLayer;
  focal: Vec3;
  nodes: WorldDistrictBoothNode[];
  paths: Array<{ from: string; to: string; kind: "district-path" | "booth-path" }>;
  presentationOnly: true;
  progressiveEnhancement: "2d-2.5d-spatial-3d";
};

const n=(id:string,role:WorldDistrictBoothNode["role"],position:Vec3,scale:number,depth:SpatialDepth,metadata?:Record<string,unknown>):WorldDistrictBoothNode=>({id,role,position,scale,depth,metadata});

export function createWorldDistrictBoothV206(layer: WorldDistrictBoothLayer): WorldDistrictBoothComposition {
  if(layer==="world") return {
    version:"3d-v2.06",layer,focal:{x:0,y:0,z:0},presentationOnly:true,progressiveEnhancement:"2d-2.5d-spatial-3d",
    nodes:[
      n("world-core","world-core",{x:0,y:0,z:0},1.65,"foreground",{assetRecipeKey:"v2/crystal-ai-city/world"}),
      n("district-north","district",{x:-4.2,y:.15,z:-1.8},.92,"midground",{districtSlot:"north"}),
      n("district-east","district",{x:4.15,y:-.1,z:-.4},.88,"midground",{districtSlot:"east"}),
      n("district-south","district",{x:1.7,y:-.3,z:4.5},.78,"background",{districtSlot:"south"}),
      n("district-west","district",{x:-2.2,y:-.25,z:4.1},.74,"background",{districtSlot:"west"}),
    ],
    paths:[
      {from:"world-core",to:"district-north",kind:"district-path"},
      {from:"world-core",to:"district-east",kind:"district-path"},
      {from:"world-core",to:"district-south",kind:"district-path"},
      {from:"world-core",to:"district-west",kind:"district-path"},
    ],
  };

  if(layer==="district") return {
    version:"3d-v2.06",layer,focal:{x:0,y:0,z:0},presentationOnly:true,progressiveEnhancement:"2d-2.5d-spatial-3d",
    nodes:[
      n("district-core","district",{x:0,y:.15,z:0},1.25,"foreground",{assetRecipeKey:"v2/crystal-ai-city/district"}),
      n("booth-a","booth",{x:-3.0,y:0,z:-1.0},.72,"midground",{boothSlot:"a"}),
      n("booth-b","booth",{x:3.0,y:.05,z:-.5},.68,"midground",{boothSlot:"b"}),
      n("booth-c","booth",{x:-2.0,y:-.05,z:3.0},.62,"background",{boothSlot:"c"}),
      n("booth-d","booth",{x:2.2,y:-.1,z:3.25},.58,"background",{boothSlot:"d"}),
      n("booth-e","booth",{x:0,y:-.05,z:4.5},.52,"background",{boothSlot:"e"}),
    ],
    paths:[
      {from:"district-core",to:"booth-a",kind:"booth-path"},
      {from:"district-core",to:"booth-b",kind:"booth-path"},
      {from:"district-core",to:"booth-c",kind:"booth-path"},
      {from:"district-core",to:"booth-d",kind:"booth-path"},
      {from:"district-core",to:"booth-e",kind:"booth-path"},
    ],
  };

  return {
    version:"3d-v2.06",layer,focal:{x:0,y:0,z:0},presentationOnly:true,progressiveEnhancement:"2d-2.5d-spatial-3d",
    nodes:[
      n("booth-core","booth",{x:0,y:.2,z:0},1.1,"foreground",{assetRecipeKey:"v2/crystal-ai-city/booth"}),
      n("booth-portal","booth",{x:0,y:.8,z:-1.65},.58,"midground",{spatialRole:"portal"}),
      n("booth-capsule-left","booth",{x:-1.45,y:.35,z:-.55},.34,"midground",{spatialRole:"capsule"}),
      n("booth-capsule-right","booth",{x:1.45,y:.35,z:-.55},.34,"midground",{spatialRole:"capsule"}),
    ],
    paths:[
      {from:"booth-core",to:"booth-portal",kind:"booth-path"},
      {from:"booth-core",to:"booth-capsule-left",kind:"booth-path"},
      {from:"booth-core",to:"booth-capsule-right",kind:"booth-path"},
    ],
  };
}
