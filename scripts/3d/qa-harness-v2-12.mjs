#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const THEMES=["aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city","desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden","galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier","mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis","pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"];
const CATEGORIES=["universe","galaxy","world","orbit","capsule","district","booth","content-feed","agent-character","live-stage","human-live","sticker-social","animation","navigation-fx"];
const ROOT="theme-v2-real-3d",BUCKET="allpha-world-assets",SIGN_TTL=900;
const expected=THEMES.flatMap(theme=>CATEGORIES.map(category=>({theme,category,path:`${ROOT}/${theme}/${category}.glb`})));
const errors=[],warnings=[],repoRoot=process.cwd();
const read=p=>fs.readFileSync(path.join(repoRoot,p),"utf8");
const exists=p=>fs.existsSync(path.join(repoRoot,p));
const check=(name,ok,detail)=>{if(!ok) errors.push(name+": "+detail)};
const contains=(file,needles)=>{const c=read(file);for(const n of needles)check(file+":"+n,c.includes(n),"required runtime contract missing")};

check("matrix.theme_count",THEMES.length===25,String(THEMES.length));
check("matrix.category_count",CATEGORIES.length===14,String(CATEGORIES.length));
check("matrix.asset_count",expected.length===350,String(expected.length));
check("matrix.unique_paths",new Set(expected.map(x=>x.path)).size===350,"duplicate paths");

const files={activation:"apps/web/lib/world-engine/production-3d-activation.ts",spatial:"apps/web/components/world/theme-v2-spatial-scene.tsx",prodScene:"apps/web/components/world/theme-v2-production-asset-scene.tsx",renderer:"apps/web/components/world/allpha-world-renderer.tsx",api:"apps/api/app/api/world_runtime.py"};
for(const [k,f] of Object.entries(files))check("file:"+k,exists(f),"missing "+f);
if(exists(files.activation))contains(files.activation,["PRODUCTION_3D_ACTIVATION_SCHEMA","PRODUCTION_3D_STORAGE_BUCKET","PRODUCTION_3D_STORAGE_ROOT","PRODUCTION_3D_ACTIVATION_MATRIX","PRODUCTION_3D_ACTIVATION_COUNTS","expected: 350"]);
if(exists(files.spatial))contains(files.spatial,["ThemeV2ProductionAssetScene","production-manifest-first-with-procedural-fallback","AllphaWorldRenderer","presentationOnly: true","legacy: false"]);
if(exists(files.prodScene))contains(files.prodScene,["asset-manifest","signed_url","useGLTF","fallback","NEXT_PUBLIC_API_BASE_URL"]);
if(exists(files.renderer))contains(files.renderer,["ThemeV2SpatialScene","Cinematic3DScene","SpatialMotionLayer","SpatialPortalFx"]);
if(exists(files.api))contains(files.api,["asset-manifest","signed_url","create_service_signed_download_url"]);

const pkg=exists("package.json")?JSON.parse(read("package.json")):null;
check("package.qa_script",Boolean(pkg?.scripts?.["qa:3d:v2.12"]),"missing package script");
check("security.no_service_role_frontend",!read(files.prodScene).match(/SERVICE_ROLE|SUPABASE_SERVICE_ROLE|SUPABASE_SECRET_KEY/),"service-role token referenced by client scene");
check("security.no_authority_in_renderer",!read(files.spatial).match(/status\s*=|moderation|safety_status|billing|permission|role\s*=/),"authority logic detected in renderer cutover");

const live={mode:"static",themeAssetCount:null,activeCount:null,pendingCount:null,storageObjectCount:null,signedUrlChecked:0,signedUrlResolved:0,headChecked:0,headPassed:0};
if(process.argv.includes("--live")){
 const base=(process.env.SUPABASE_URL??"").replace(/\/$/,""),key=process.env.SUPABASE_SERVICE_ROLE_KEY??process.env.SUPABASE_SECRET_KEY??"";
 if(!base||!key)errors.push("live.supabase_env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --live");
 else{
  live.mode="live";const h={apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"};
  const get=async u=>{const r=await fetch(u,{headers:h});if(!r.ok)throw new Error(r.status+" "+u);return r.json()};
  try{
   const assets=await get(base+"/rest/v1/theme_assets?storage_path=like.*theme-v2-real-3d/*&select=id,status,storage_bucket,storage_path,metadata&limit=1000");
   live.themeAssetCount=assets.length;live.activeCount=assets.filter(x=>x.status==="active").length;live.pendingCount=assets.filter(x=>x.status==="pending").length;
   check("live.theme_assets_350",assets.length===350,"found "+assets.length);
   check("live.no_active_before_promotion",live.activeCount===0,"found "+live.activeCount+" active");
   check("live.all_pending",live.pendingCount===350,"found "+live.pendingCount+" pending");
   check("live.all_bucket",assets.every(x=>x.storage_bucket===BUCKET),"non-canonical bucket");
   const paths=new Set(assets.map(x=>x.storage_path));check("live.all_paths_canonical",expected.every(x=>paths.has(x.path)),"expected GLB path missing from theme_assets");

   const rootObjects=[];
   const walk=async prefix=>{
    const r=await fetch(base+"/storage/v1/object/list/"+BUCKET,{method:"POST",headers:h,body:JSON.stringify({prefix,limit:1000,offset:0,sortBy:{column:"name",order:"asc"}})});
    if(!r.ok)throw new Error(r.status+" list "+prefix);
    const rows=await r.json();
    for(const row of rows){
      if(row.name?.endsWith(".glb"))rootObjects.push(prefix+row.name);
      else if(row.name && !row.id)await walk(prefix+row.name+"/");
    }
   };
   await walk(ROOT+"/");
   live.storageObjectCount=rootObjects.length;check("live.storage_glb_350",rootObjects.length===350,"found "+rootObjects.length);
   const objectSet=new Set(rootObjects);check("live.storage_matrix_exact",expected.every(x=>objectSet.has(x.path)),"storage matrix incomplete");

   for(const asset of assets){
    const sign=await fetch(base+"/storage/v1/object/sign/"+BUCKET+"/"+asset.storage_path,{method:"POST",headers:h,body:JSON.stringify({expiresIn:SIGN_TTL})});
    if(!sign.ok){errors.push("live.signed_url:"+asset.storage_path+" HTTP "+sign.status);continue}
    const payload=await sign.json(),signed=payload.signedURL||payload.signedUrl;live.signedUrlChecked++;
    if(!signed){errors.push("live.signed_url_missing:"+asset.storage_path);continue}
    const absolute=signed.startsWith("http")?signed:base+"/storage/v1"+signed;
    const response=await fetch(absolute,{method:"HEAD"});live.headChecked++;
    if(response.ok){live.signedUrlResolved++;live.headPassed++}else errors.push("live.signed_url_head:"+asset.storage_path+" HTTP "+response.status);
   }
   check("live.signed_urls_350",live.signedUrlResolved===350,"resolved "+live.signedUrlResolved+"/350");
   check("live.signed_url_heads_350",live.headPassed===350,"HEAD passed "+live.headPassed+"/350");
  }catch(e){errors.push("live.supabase: "+e.message)}
 }
}

const report={schema:"allpha-3d-v2-qa/1.1",phase:"3D-V2.12",generatedAt:new Date().toISOString(),matrix:{themes:25,categories:14,assets:350},contracts:{canonicalRenderer:"AllphaWorldRenderer",storageBucket:BUCKET,storageRoot:ROOT,productionManifestFirst:true,proceduralFallback:"exclusive-on-production-resolution-failure",signedUrlTtlSeconds:SIGN_TTL},live,visualEvidence:{browserDeviceCapture:"workflow",status:"OPEN"},result:{ok:errors.length===0,errors,warnings}};
fs.writeFileSync(path.join(repoRoot,"3d-v2-12-qa-report.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));process.exit(errors.length?1:0);
