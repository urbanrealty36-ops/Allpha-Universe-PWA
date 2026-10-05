#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const THEMES = [
  "aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city",
  "desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden",
  "galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier",
  "mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis",
  "pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord",
];
const CATEGORIES = [
  "universe","galaxy","world","orbit","capsule","district","booth","content-feed",
  "agent-character","live-stage","human-live","sticker-social","animation","navigation-fx",
];
const ROOT="theme-v2-real-3d", BUCKET="allpha-world-assets";
const expected=THEMES.flatMap(theme=>CATEGORIES.map(category=>({theme,category,path:ROOT+"/"+theme+"/"+category+".glb"})));
const errors=[], warnings=[], repoRoot=process.cwd();
const read=p=>fs.readFileSync(path.join(repoRoot,p),"utf8");
const exists=p=>fs.existsSync(path.join(repoRoot,p));
function check(name,ok,detail){if(!ok) errors.push(name+": "+detail);}
function contains(file,needles){const content=read(file); for(const needle of needles) check(file+":"+needle,content.includes(needle),"required runtime contract missing");}
check("matrix.theme_count",THEMES.length===25,String(THEMES.length));
check("matrix.category_count",CATEGORIES.length===14,String(CATEGORIES.length));
check("matrix.asset_count",expected.length===350,String(expected.length));
check("matrix.unique_paths",new Set(expected.map(x=>x.path)).size===350,"duplicate paths");

const activation="apps/web/lib/world-engine/production-3d-activation.ts";
const spatial="apps/web/components/world/theme-v2-spatial-scene.tsx";
const prodScene="apps/web/components/world/theme-v2-production-asset-scene.tsx";
const renderer="apps/web/components/world/allpha-world-renderer.tsx";
const api="apps/api/app/api/world_runtime.py";
for(const f of [activation,spatial,prodScene,renderer,api]) check("file:"+f,exists(f),"file missing");
if(exists(activation)) contains(activation,["PRODUCTION_3D_ACTIVATION_SCHEMA","PRODUCTION_3D_STORAGE_BUCKET","PRODUCTION_3D_STORAGE_ROOT","PRODUCTION_3D_ACTIVATION_MATRIX","assets: 350"]);
if(exists(spatial)) contains(spatial,["ThemeV2ProductionAssetScene","production-manifest-first-with-procedural-fallback","AllphaWorldRenderer","presentationOnly: true","legacy: false"]);
if(exists(prodScene)) contains(prodScene,["asset-manifest","signed_url","useGLTF","fallback","NEXT_PUBLIC_API_BASE_URL"]);
if(exists(renderer)) contains(renderer,["ThemeV2SpatialScene","Cinematic3DScene","SpatialMotionLayer","SpatialPortalFx"]);
if(exists(api)) contains(api,["asset-manifest","signed_url","create_service_signed_download_url"]);

const packageJson=exists("package.json")?JSON.parse(read("package.json")):null;
check("package.qa_script",Boolean(packageJson?.scripts?.["qa:3d:v2.12"]),"package script missing");
check("security.no_service_role_frontend",!read(prodScene).match(/SERVICE_ROLE|SUPABASE_SERVICE_ROLE|SUPABASE_SECRET_KEY/),"service-role token referenced by client scene");
check("security.no_authority_in_renderer",!read(spatial).match(/status\s*=|moderation|safety_status|billing|permission|role\s*=/),"authority logic detected in renderer cutover");

const live={mode:"static",themeAssetCount:null,activeCount:null,pendingCount:null};
if(process.argv.includes("--live")){
  const base=(process.env.SUPABASE_URL??"").replace(/\/$/,""), key=process.env.SUPABASE_SERVICE_ROLE_KEY??process.env.SUPABASE_SECRET_KEY??"";
  if(!base||!key) errors.push("live.supabase_env: SUPABASE_URL and service-role key required for --live");
  else {
    live.mode="live"; const h={apikey:key,Authorization:"Bearer "+key};
    const get=async u=>{const r=await fetch(u,{headers:h});if(!r.ok)throw new Error(r.status+" "+u);return r.json();};
    try{
      const assets=await get(base+"/rest/v1/theme_assets?storage_path=like.*theme-v2-real-3d/*&select=id,status,storage_path,metadata&limit=1000");
      live.themeAssetCount=assets.length; live.activeCount=assets.filter(x=>x.status==="active").length; live.pendingCount=assets.filter(x=>x.status==="pending").length;
      check("live.theme_assets_350",assets.length===350,"found "+assets.length);
      check("live.no_active_before_promotion",live.activeCount===0,"found "+live.activeCount+" active");
      check("live.all_pending",live.pendingCount===350,"found "+live.pendingCount+" pending");
      check("live.all_paths_canonical",assets.every(x=>String(x.storage_path).startsWith(ROOT+"/")),"non-canonical storage path");
    }catch(e){errors.push("live.supabase: "+e.message);}
  }
}
const report={
 schema:"allpha-3d-v2-qa/1.0",phase:"3D-V2.12",generatedAt:new Date().toISOString(),
 matrix:{themes:25,categories:14,assets:350},
 contracts:{canonicalRenderer:"AllphaWorldRenderer",storageBucket:BUCKET,storageRoot:ROOT,productionManifestFirst:true,proceduralFallback:"exclusive-on-production-resolution-failure"},
 live,visualEvidence:{browserDeviceCapture:false,status:"OPEN"},
 result:{ok:errors.length===0,errors,warnings}
};
fs.writeFileSync(path.join(repoRoot,"3d-v2-12-qa-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
process.exit(errors.length?1:0);
