#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root=process.env.ALLPHA_V213D_OUT||"allpha-theme-v2-13d-reference-real";
const cats=["universe","galaxy","world","district"];
const errors=[]; const assets=[];
const manifestPath=path.join(root,"manifest.json");
if(!fs.existsSync(manifestPath)) throw new Error("REFERENCE_REAL_MANIFEST_MISSING");
const m=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
for(const k of ["schema","phase","goldenReference"]){
 if(!m[k]) errors.push("MANIFEST_"+k.toUpperCase()+"_MISSING");
}
if(m.schema!=="allpha-3d-v2-13d-reference-real/1.0") errors.push("SCHEMA_INVALID");
if(m.generated!==100||m.matrixSize!==100||m.themes!==25||m.categories!==4) errors.push("MATRIX_INVALID");
const seen=new Set();
for(const item of m.assets||[]){
 const key=item.themeKey+"::"+item.category;
 if(seen.has(key)) errors.push("DUPLICATE:"+key); seen.add(key);
 const file=path.resolve(item.glb);
 if(!fs.existsSync(file)) { errors.push("GLB_MISSING:"+key); continue; }
 const b=fs.readFileSync(file);
 if(b.subarray(0,4).toString("ascii")!=="glTF") errors.push("GLB_HEADER:"+key);
 let gltf=null;
 try {
   const version=b.readUInt32LE(4);
   const jsonLength=b.readUInt32LE(12);
   const jsonType=b.readUInt32LE(16);
   if(version!==2 || jsonType!==0x4e4f534a) throw new Error("invalid GLB JSON chunk");
   const jsonStart=20;
   gltf=JSON.parse(b.subarray(jsonStart,jsonStart+jsonLength).toString("utf8").trim());
 } catch (err) {
   errors.push("GLB_JSON_INVALID:"+key+":"+err.message);
 }
 const nodeNames=new Set((gltf?.nodes||[]).map(n=>n?.name).filter(Boolean));
 const required = item.category==="world"||item.category==="district"
   ? ["StudioFloor","PresentationDesk","FigureHead","BroadcastCamera","MediaScreen"]
   : [];
 for(const requiredName of required) if(!nodeNames.has(requiredName))
   errors.push("REFERENCE_NODE_MISSING:"+key+":"+requiredName);
 const forbidden=["FacadeBand","CivicRing","StageLightRing","AIHeadHalo","DistrictPortal"];
 for(const name of forbidden) if(nodeNames.has(name))
   errors.push("FORBIDDEN_R1_HERO_GRAMMAR:"+key+":"+name);
 if(b.length<50000) errors.push("GLB_TOO_SMALL_REFERENCE_REAL:"+key+":"+b.length);
 if(item.artQuality!=="reference-realistic-production-v2") errors.push("ART_QUALITY:"+key);
 assets.push({theme:item.themeKey,category:item.category,bytes:b.length,sha256:crypto.createHash("sha256").update(b).digest("hex")});
 const preview=item.preview;
 if(m.previewRequested && (!preview || !fs.existsSync(path.resolve(preview)))) errors.push("PREVIEW_MISSING:"+key);
}
if(seen.size!==100) errors.push("UNIQUE_ASSET_COUNT:"+seen.size);
for(const d of fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory())){
 const gs=fs.readdirSync(path.join(root,d.name)).filter(x=>x.endsWith(".glb"));
 if(gs.length!==4) errors.push("CATEGORY_COUNT:"+d.name+":"+gs.length);
}
const report={schema:"allpha-3d-v2-13d-reference-real-validation/1.1",phase:"V2.13D.1-R1",ok:errors.length===0,generated:assets.length,expected:100,humanVisualGateRequired:true,errors,assets};
fs.writeFileSync("3d-v2-13d-reference-real-validation-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({ok:report.ok,generated:report.generated,errors:errors.length},null,2));
process.exit(errors.length?1:0);
