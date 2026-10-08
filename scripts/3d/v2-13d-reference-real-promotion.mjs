#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const BUCKET="allpha-world-assets";
const ROOT="theme-v2-real-3d/v2.13";
const CATS=["universe","galaxy","world","district"];
const THEMES=["aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city","desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden","galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier","mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis","pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"];
function fail(x){throw new Error("REFERENCE_REAL_PROMOTION_BLOCKED:"+x)}
function sha(b){return crypto.createHash("sha256").update(b).digest("hex")}
async function req(url,opt={}){const r=await fetch(url,opt);const t=await r.text();if(!r.ok)fail((opt.method||"GET")+" "+r.status+" "+t.slice(0,500));return t?JSON.parse(t):null}
const root=path.resolve(process.env.ALLPHA_REFERENCE_REAL_ROOT||"reference-real-evidence/allpha-theme-v2-13d-reference-real");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
if(manifest.schema!=="allpha-3d-v2-13d-reference-real/1.0"||manifest.generated!==100||manifest.matrixSize!==100) fail("manifest contract");
if(process.env.ALLPHA_REFERENCE_REAL_APPROVED!=="true") fail("explicit approval required");
if(process.env.ALLPHA_REFERENCE_REAL_CONFIRMATION!=="V2.13D REFERENCE REAL APPROVE 100 MACRO ASSETS") fail("exact confirmation required");
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)fail("service role key missing");
const url=process.env.SUPABASE_URL||"https://qltbacemtvnuzqkterly.supabase.co";
const headers={apikey:key,Authorization:"Bearer "+key};
const entries=[];
for(const theme of THEMES) for(const category of CATS){
 const f=path.join(root,theme,category+".glb"); if(!fs.existsSync(f)) fail("missing "+theme+"/"+category);
 const b=fs.readFileSync(f); if(b.subarray(0,4).toString("ascii")!=="glTF") fail("invalid glb "+theme+"/"+category);
 entries.push({theme,category,file:f,bytes:b.length,checksum:sha(b),storagePath:ROOT+"/"+theme+"/"+category+".glb"});
}
if(entries.length!==100)fail("expected 100 assets");
const themeCache=new Map();
for(const slug of THEMES){
 const ts=await req(url+"/rest/v1/themes?select=id,slug&catalog_key=eq."+encodeURIComponent(slug)+"&limit=1",{headers});
 if(!ts?.[0])fail("theme "+slug);
 const vs=await req(url+"/rest/v1/theme_versions?select=id,version&theme_id=eq."+ts[0].id+"&status=eq.published&order=version.desc&limit=1",{headers});
 if(!vs?.[0])fail("published version "+slug);
 themeCache.set(slug,{themeId:ts[0].id,versionId:vs[0].id,version:vs[0].version});
}
for(const e of entries){
 const b=fs.readFileSync(e.file);
 const objectUrl=url+"/storage/v1/object/"+BUCKET+"/"+e.storagePath.split("/").map(encodeURIComponent).join("/");
 const r=await fetch(objectUrl,{method:"POST",headers:{...headers,"Content-Type":"model/gltf-binary","x-upsert":"true","cache-control":"31536000"},body:b});
 if(!r.ok)fail("storage upload "+e.theme+"/"+e.category);
}
for(const e of entries){
 const ids=themeCache.get(e.theme);
 const q=url+"/rest/v1/theme_assets?select=id&theme_id=eq."+ids.themeId+"&theme_version_id=eq."+ids.versionId+"&asset_type=eq.3d_scene&storage_path=eq."+encodeURIComponent(e.storagePath)+"&limit=1";
 const existing=await req(q,{headers});
 const row={theme_id:ids.themeId,theme_version_id:ids.versionId,asset_type:"3d_scene",storage_path:e.storagePath,mime_type:"model/gltf-binary",metadata:{schema:"allpha-3d-v2-13d-reference-real/1.0",phase:"V2.13D-REFERENCE-REAL",source:"blender-reference-real-production",reference:"ALLPHA_UI_UX_REFERENCE_20261004",presentationOnly:true,legacy:false,artQuality:"reference-realistic-production-v2",canonicalRenderer:"AllphaWorldRenderer",humanVisualGate:"USER_CONFIRMED"},sort_order:CATS.indexOf(e.category),status:"active",moderation_status:"approved",safety_status:"passed",performance_status:"passed",storage_bucket:BUCKET,content_size_bytes:e.bytes,checksum_sha256:e.checksum,uploaded_at:new Date().toISOString()};
 if(existing?.[0]?.id) await req(url+"/rest/v1/theme_assets?id=eq."+existing[0].id,{method:"PATCH",headers:{...headers,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(row)});
 else await req(url+"/rest/v1/theme_assets",{method:"POST",headers:{...headers,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(row)});
}
const report={schema:"allpha-3d-v2-13d-reference-real-promotion/1.0",phase:"V2.13D-REFERENCE-REAL",decision:"PROMOTED_REFERENCE_REAL_100_MACRO_ASSETS",themes:25,assets:100,bucket:BUCKET,root:ROOT,uploaded:100,registeredThemeAssets:100,oldV213ObjectsReplaced:true,canonicalRenderer:"AllphaWorldRenderer"};
fs.writeFileSync("v2-13d-reference-real-promotion-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
