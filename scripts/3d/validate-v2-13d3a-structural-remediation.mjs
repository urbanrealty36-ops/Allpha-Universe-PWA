#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root=process.env.ALLPHA_V213D3A_OUT ?? "allpha-theme-v2-13d3a-remediation";
const singleTheme=process.env.ALLPHA_V213D3A_THEME || null;
const expectedThemes=singleTheme ? 1 : 25, expectedCategories=4, expectedAssets=singleTheme ? 4 : 100;
const categories=["universe","galaxy","world","district"];
const errors=[];
const manifest=path.join(root,"manifest.json");
if(!fs.existsSync(manifest)) throw new Error("V2.13D3A_MANIFEST_MISSING");
const r=JSON.parse(fs.readFileSync(manifest,"utf8"));
for(const [k,v] of [["schema","allpha-3d-v2-13d3a-structural-fidelity/1.0"],["phase","V2.13D.3A"],["goldenReference","crystal-ai-city"]]) if(r[k]!==v) errors.push("INVALID_"+k.toUpperCase());
if(r.themes!==25) errors.push("THEME_COUNT_INVALID");
if(r.categories!==expectedCategories) errors.push("CATEGORY_COUNT_INVALID");
if(r.matrixSize!==100||r.generated!==expectedAssets) errors.push("ASSET_COUNT_INVALID");
if(!Array.isArray(r.sourceLockedEvidence)||!r.sourceLockedEvidence.includes("V2.13D.1A-R3")||!r.sourceLockedEvidence.includes("V2.13D.2")) errors.push("LOCKED_EVIDENCE_BINDING_INVALID");
const seen=new Set();
for(const a of r.assets??[]){
 const key=a.themeKey+"::"+a.category; if(seen.has(key)) errors.push("DUPLICATE:"+key); seen.add(key);
 if(!categories.includes(a.category)) errors.push("CATEGORY_INVALID:"+key);
 if(a.presentationOnly!==true||a.canonicalRenderer!=="AllphaWorldRenderer") errors.push("RUNTIME_BOUNDARY_INVALID:"+key);
 if(a.remediation!=="world-scale-structural") errors.push("REMEDIATION_SCOPE_INVALID:"+key);
 if(!a.glb||!fs.existsSync(a.glb)) errors.push("GLB_MISSING:"+key);
 else { const b=fs.readFileSync(a.glb); if(b.subarray(0,4).toString("ascii")!=="glTF"||b.length<64) errors.push("GLB_INVALID:"+key); }
 if(r.previewRequested&&(!a.preview||!fs.existsSync(a.preview))) errors.push("PREVIEW_MISSING:"+key);
}
if(seen.size!==expectedAssets) errors.push("UNIQUE_ASSET_COUNT_INVALID:"+seen.size);
const themes=fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory());
if(themes.length!==expectedThemes) errors.push("THEME_DIRECTORY_COUNT_INVALID:"+themes.length);
for(const d of themes){
 const dir=path.join(root,d.name), glbs=fs.readdirSync(dir).filter(x=>x.endsWith(".glb")), pngs=fs.readdirSync(dir).filter(x=>x.endsWith(".png"));
 if(glbs.length!==4) errors.push("THEME_GLB_COUNT_INVALID:"+d.name+":"+glbs.length);
 if(r.previewRequested&&pngs.length!==4) errors.push("THEME_PREVIEW_COUNT_INVALID:"+d.name+":"+pngs.length);
}
const out={schema:"allpha-3d-v2-13d3a-validation/1.0",phase:"V2.13D.3A",ok:errors.length===0,themes:expectedThemes,categories:4,assets:seen.size,previews:r.previewRequested?expectedAssets:0,sourceLockedEvidence:r.sourceLockedEvidence,errors};
fs.writeFileSync("3d-v2-13d3a-structural-validation-report.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out,null,2)); process.exit(errors.length?1:0);
