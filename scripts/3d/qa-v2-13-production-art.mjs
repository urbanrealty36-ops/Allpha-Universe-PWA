#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const builder=path.join(root,"scripts/3d/blender/build_v2_13d_reference_real.py");
const validator=path.join(root,"scripts/3d/validate-v2-13d-reference-real.mjs");
const contract=path.join(root,"apps/web/lib/world-engine/production-realistic-art-v2-13.ts");
const errors=[];
const check=(ok,msg)=>{if(!ok) errors.push(msg)};

check(fs.existsSync(builder),"REFERENCE_REAL_BUILDER_MISSING");
check(fs.existsSync(validator),"REFERENCE_REAL_VALIDATOR_MISSING");
check(fs.existsSync(contract),"V213_RUNTIME_CONTRACT_MISSING");

if(fs.existsSync(builder)){
 const c=fs.readFileSync(builder,"utf8");
 for(const token of ["allpha-3d-v2-13d-reference-real/1.0","ALLPHA_UI_UX_REFERENCE_20261004","reference-realistic-production-v2","AllphaWorldRenderer","reference_environment(m,category,ti,p)"])
   check(c.includes(token),"REFERENCE_REAL_BUILDER_MISSING:"+token);
 for(const legacy of ["build_v2_13_production_art.py","production-realistic-golden","ALLPHA_V2_13A_PRODUCTION_METADATA"])
   check(!c.includes(legacy),"LEGACY_BUILDER_REFERENCE_FORBIDDEN:"+legacy);
}
if(fs.existsSync(validator)){
 const c=fs.readFileSync(validator,"utf8");
 check(c.includes("reference-realistic-production-v2"),"REFERENCE_REAL_VALIDATOR_CONTRACT_MISSING");
}
if(fs.existsSync(contract)){
 const c=fs.readFileSync(contract,"utf8");
 check(c.includes("AllphaWorldRenderer"),"RUNTIME_RENDERER_CONTRACT_MISSING");
 check(c.includes("theme-v2-real-3d/v2.13"),"CANONICAL_STORAGE_PATH_MISSING");
}
const report={
 schema:"allpha-3d-v2-13-reference-real-qa/2.0",
 phase:"V2.13D.1-R1",
 generatedAt:new Date().toISOString(),
 goldenTheme:"crystal-ai-city",
 matrix:{themes:25,categories:4,assets:100},
 productionSource:"Blender reference-real",
 legacyAssetsAllowed:false,
 productionMutation:false,
 humanVisualGateRequired:true,
 result:{ok:errors.length===0,errors},
 activationStatus:errors.length===0?"BLOCKED_PENDING_REFERENCE_REAL_GOLDEN_AND_HUMAN_GATE":"BLOCKED_CONTRACT"
};
fs.writeFileSync(path.join(root,"3d-v2-13-production-art-qa-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
process.exit(errors.length?1:0);
