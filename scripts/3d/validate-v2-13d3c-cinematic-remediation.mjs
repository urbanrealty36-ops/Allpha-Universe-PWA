#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root=path.resolve(process.env.ALLPHA_V213D3C_OUT ?? "allpha-theme-v2-13d3c-visual-remediation");
const singleTheme=process.env.ALLPHA_V213D3C_THEME || null;
const expectedThemes=singleTheme ? 1 : 25;
const expectedAssets=singleTheme ? 4 : 100;
const categories=["universe","galaxy","world","district"];
const errors=[];
const manifestPath=path.join(root,"manifest.json");
if(!fs.existsSync(manifestPath)) throw new Error("V2.13D3C_MANIFEST_MISSING");
const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));

if(manifest.schema!=="allpha-3d-v2-13d3c-cinematic-visual-fidelity/1.0") errors.push("SCHEMA_INVALID");
if(manifest.phase!=="V2.13D.3C") errors.push("PHASE_INVALID");
if(manifest.goldenReference!=="crystal-ai-city") errors.push("GOLDEN_REFERENCE_INVALID");
if(manifest.themes!==25||manifest.categories!==4||manifest.matrixSize!==100) errors.push("MATRIX_CONTRACT_INVALID");
if(manifest.generated!==expectedAssets) errors.push("GENERATED_ASSET_COUNT_INVALID");
if(manifest.commonCityGrammarRemoved!==true) errors.push("COMMON_CITY_GRAMMAR_NOT_REMOVED");
if(manifest.sourceHumanGate!=="V2.13D.3B-REJECTED") errors.push("SOURCE_HUMAN_GATE_INVALID");
if(!Array.isArray(manifest.sourceLockedEvidence)||!manifest.sourceLockedEvidence.includes("V2.13D.3A")) errors.push("SOURCE_LOCK_BINDING_INVALID");

const seen=new Set();
for(const a of manifest.assets??[]){
  const key=a.themeKey+"::"+a.category;
  if(seen.has(key)) errors.push("DUPLICATE:"+key);
  seen.add(key);
  if(!categories.includes(a.category)) errors.push("CATEGORY_INVALID:"+key);
  if(singleTheme&&a.themeKey!==singleTheme) errors.push("MATRIX_THEME_INVALID:"+key);
  if(a.presentationOnly!==true||a.canonicalRenderer!=="AllphaWorldRenderer") errors.push("RUNTIME_BOUNDARY_INVALID:"+key);
  if(a.remediation!=="cinematic-world-scale-visual") errors.push("REMEDIATION_SCOPE_INVALID:"+key);
  if(a.commonCityGrammarRemoved!==true) errors.push("COMMON_CITY_GRAMMAR_FLAG_INVALID:"+key);
  const glb=a.glb?(path.isAbsolute(a.glb)?a.glb:path.resolve(a.glb)):null;
  if(!glb||!fs.existsSync(glb)) errors.push("GLB_MISSING:"+key);
  else {const b=fs.readFileSync(glb);if(b.subarray(0,4).toString("ascii")!=="glTF"||b.length<64) errors.push("GLB_INVALID:"+key);}
  const preview=a.preview?(path.isAbsolute(a.preview)?a.preview:path.resolve(a.preview)):null;
  if(manifest.previewRequested&&(!preview||!fs.existsSync(preview))) errors.push("PREVIEW_MISSING:"+key);
}
if(seen.size!==expectedAssets) errors.push("UNIQUE_ASSET_COUNT_INVALID:"+seen.size);
const dirs=fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory());
if(dirs.length!==expectedThemes) errors.push("THEME_DIRECTORY_COUNT_INVALID:"+dirs.length);
for(const d of dirs){
  const dir=path.join(root,d.name);
  const glbs=fs.readdirSync(dir).filter(x=>x.endsWith(".glb"));
  const pngs=fs.readdirSync(dir).filter(x=>x.endsWith(".png"));
  if(glbs.length!==4) errors.push("THEME_GLB_COUNT_INVALID:"+d.name+":"+glbs.length);
  if(manifest.previewRequested&&pngs.length!==4) errors.push("THEME_PREVIEW_COUNT_INVALID:"+d.name+":"+pngs.length);
}
const report={schema:"allpha-3d-v2-13d3c-validation/1.0",phase:"V2.13D.3C",ok:errors.length===0,themes:expectedThemes,categories:4,assets:seen.size,previews:manifest.previewRequested?expectedAssets:0,commonCityGrammarRemoved:manifest.commonCityGrammarRemoved===true,errors};
fs.writeFileSync("3d-v2-13d3c-validation-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
process.exit(errors.length?1:0);