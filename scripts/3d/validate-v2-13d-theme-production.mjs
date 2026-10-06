#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root = process.env.ALLPHA_V213D_OUT ?? "allpha-theme-v2-13d-production";
const manifestPath = path.join(root, "manifest.json");
const expectedThemes=25, expectedCategories=14, expectedAssets=350;
const categories=["universe","galaxy","world","orbit","capsule","district","booth","content-feed","agent-character","live-stage","human-live","sticker-social","animation","navigation-fx"];
const errors=[];
if(!fs.existsSync(manifestPath)) throw new Error("V2.13D_MANIFEST_MISSING");
const report=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
if(report.schema!=="allpha-3d-v2-13d-theme-production/1.0") errors.push("SCHEMA_INVALID");
if(report.themes!==expectedThemes) errors.push("THEME_COUNT_INVALID");
if(report.categories!==expectedCategories) errors.push("CATEGORY_COUNT_INVALID");
if(report.matrixSize!==expectedAssets) errors.push("MATRIX_SIZE_INVALID");
if(report.generated!==expectedAssets) errors.push("GENERATED_COUNT_INVALID");
if(report.goldenReference!=="crystal-ai-city") errors.push("GOLDEN_REFERENCE_INVALID");
const seen=new Set();
for(const item of report.assets??[]){
 const key=item.themeKey+"::"+item.category;
 if(seen.has(key)) errors.push("DUPLICATE_ASSET:"+key);
 seen.add(key);
 if(!categories.includes(item.category)) errors.push("UNKNOWN_CATEGORY:"+item.category);
 if(item.presentationOnly!==true) errors.push("PRESENTATION_BOUNDARY_INVALID:"+key);
 if(item.canonicalRenderer!=="AllphaWorldRenderer") errors.push("RENDERER_INVALID:"+key);
 if(!item.glb||!fs.existsSync(item.glb)) errors.push("GLB_MISSING:"+key);
 else { const b=fs.readFileSync(item.glb); if(b.subarray(0,4).toString("ascii")!=="glTF") errors.push("GLB_HEADER_INVALID:"+key); if(b.length<64) errors.push("GLB_TOO_SMALL:"+key); }
 if(item.preview&&!fs.existsSync(item.preview)) errors.push("PREVIEW_MISSING:"+key);
}
if(seen.size!==expectedAssets) errors.push("UNIQUE_ASSET_COUNT_INVALID:"+seen.size);
for(const theme of fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory())){
 const dir=path.join(root,theme.name), glbs=fs.readdirSync(dir).filter(f=>f.endsWith(".glb")), pngs=fs.readdirSync(dir).filter(f=>f.endsWith(".png"));
 if(glbs.length!==expectedCategories) errors.push("THEME_GLB_COUNT_INVALID:"+theme.name+":"+glbs.length);
 if(report.previewRequested&&pngs.length!==expectedCategories) errors.push("THEME_PREVIEW_COUNT_INVALID:"+theme.name+":"+pngs.length);
}
const output={schema:"allpha-3d-v2-13d-validation/1.0",phase:"3D-V2.13D",ok:errors.length===0,themes:expectedThemes,categories:expectedCategories,assets:seen.size,previews:report.previewRequested?expectedAssets:0,errors};
fs.writeFileSync("3d-v2-13d-production-validation-report.json",JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify(output,null,2)); process.exit(errors.length?1:0);
