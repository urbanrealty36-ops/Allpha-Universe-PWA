#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root=process.cwd();
const blenderScript=path.join(root,"scripts/3d/blender/build_v2_13_production_art.py");
const contract=path.join(root,"apps/web/lib/world-engine/production-realistic-art-v2-13.ts");
const errors=[];
const check=(ok,msg)=>{if(!ok)errors.push(msg)};
check(fs.existsSync(blenderScript),"BLENDER_PRODUCTION_SCRIPT_MISSING");
check(fs.existsSync(contract),"V213_CONTRACT_MISSING");

if(fs.existsSync(blenderScript)){
  const c=fs.readFileSync(blenderScript,"utf8");
  for(const token of ["BLENDER_EEVEE_NEXT","export_scene.gltf","production-realistic-golden","presentationOnly","legacy","ALLPHA_V2_13A_PRODUCTION_METADATA","procedural-pbr-with-surface-variation","cinematic-key-fill-rim-practical"]){
    check(c.includes(token),"BLENDER_SCRIPT_MISSING:"+token);
  }
}
if(fs.existsSync(contract)){
  const c=fs.readFileSync(contract,"utf8");
  for(const token of ["allpha-3d-v2-13-production-art/1.1","theme-v2-real-3d/v2.13","crystal-ai-city","golden-theme-14-category-runtime-visual-qa","AllphaWorldRenderer"]){
    check(c.includes(token),"CONTRACT_MISSING:"+token);
  }
}

const blender=spawnSync(process.env.BLENDER_BIN||"blender",["--version"],{encoding:"utf8"});
const blenderAvailable=blender.status===0;
const report={
  schema:"allpha-3d-v2-13-production-art-qa/1.0",
  phase:"3D-V2.13",
  generatedAt:new Date().toISOString(),
  goldenTheme:"crystal-ai-city",
  matrix:{themes:25,categories:14,assets:350},
  productionSource:"Blender",
  blenderAvailable,
  exportCommand:"blender -b --python scripts/3d/blender/build_v2_13_production_art.py -- --theme crystal-ai-city --preview",
  activationPolicy:"staged-only-until-runtime-visual-qa",
  result:{ok:errors.length===0 && blenderAvailable, errors: blenderAvailable ? errors : [...errors,"BLENDER_NOT_AVAILABLE_FOR_GOLDEN_RENDER"]},\n  visualGate:"Blender previews + GLB validation + staged storage + signed URL + AllphaWorldRenderer + browser + mobile",\n  activationStatus: blenderAvailable && errors.length===0 ? "OPEN_FOR_VISUAL_QA" : "BLOCKED_PENDING_BLENDER"
};
fs.writeFileSync(path.join(root,"3d-v2-13-production-art-qa-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
process.exit(errors.length?1:0);
