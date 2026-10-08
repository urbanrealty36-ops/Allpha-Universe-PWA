#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root=process.env.ALLPHA_V213D_OUT||"golden-reference-preview";
const theme=process.env.ALLPHA_V213D_GOLDEN_THEME||"crystal-ai-city";
const base=path.join(root,theme);
const cats=["universe","galaxy","world","district"];
const errors=[];

function readGlbJson(file){
  const b=fs.readFileSync(file);
  if(b.subarray(0,4).toString("ascii")!=="glTF") throw new Error("GLB_HEADER");
  if(b.readUInt32LE(4)!==2) throw new Error("GLB_VERSION");
  const len=b.readUInt32LE(12);
  const type=b.readUInt32LE(16);
  if(type!==0x4e4f534a) throw new Error("GLB_JSON_CHUNK");
  return JSON.parse(b.subarray(20,20+len).toString("utf8").trim());
}

for(const category of cats){
  const file=path.join(base,category+".glb");
  if(!fs.existsSync(file)){ errors.push("MISSING_GLb:"+category); continue; }
  let gltf;
  try{ gltf=readGlbJson(file); }catch(e){ errors.push("INVALID_GLTF:"+category+":"+e.message); continue; }
  const names=new Set((gltf.nodes||[]).map(n=>n?.name).filter(Boolean));
  if((gltf.nodes||[]).length<30) errors.push("LOW_NODE_COUNT:"+category+":"+((gltf.nodes||[]).length));
  if((gltf.materials||[]).length<8) errors.push("LOW_MATERIAL_COUNT:"+category+":"+((gltf.materials||[]).length));
  if(category==="world"||category==="district"){
    for(const required of ["StudioFloor","PresentationDesk","FigureHead","BroadcastCamera","MediaScreen"]){
      if(!names.has(required)) errors.push("REFERENCE_NODE_MISSING:"+category+":"+required);
    }
  }
  for(const forbidden of ["FacadeBand","CivicRing","StageLightRing","AIHeadHalo","DistrictPortal"]){
    if(names.has(forbidden)) errors.push("FORBIDDEN_R1_HERO_GRAMMAR:"+category+":"+forbidden);
  }
  const preview=path.join(base,category+".png");
  if(!fs.existsSync(preview)) errors.push("PREVIEW_MISSING:"+category);
}

const report={
  schema:"allpha-3d-v2-13d-reference-real-golden-structural/1.0",
  phase:"V2.13D.1-R1",
  goldenReference:theme,
  structuralGate:errors.length?"FAIL":"PASS",
  humanVisualGate:"REQUIRED",
  humanApproval:"PENDING",
  errors
};
fs.writeFileSync("3d-v2-13d-reference-real-golden-structural-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
process.exit(errors.length?1:0);
