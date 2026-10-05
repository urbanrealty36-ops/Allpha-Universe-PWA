import { ALLPHA_3D_MASTER_LANGUAGE, ALLPHA_3D_THEME_PROFILES, type Allpha3DThemeProfile } from "../../../../packages/design-tokens/3d-visual-language";

export const ASSET_FACTORY_SCHEMA = "allpha-3d-asset-recipe/2.0" as const;

export const ASSET_CATEGORIES = [
  "universe","galaxy","world","orbit","capsule","district","booth",
  "content-feed","agent-character","live-stage","human-live","sticker-social",
  "animation","navigation-fx",
] as const;

export type AssetCategory = typeof ASSET_CATEGORIES[number];
export type GeometryKind = "sphere"|"ring"|"arc"|"capsule"|"platform"|"tower"|"crystal"|"island"|"bridge"|"panel"|"beacon"|"landmark"|"character"|"stage"|"particle-field";
export type MaterialRole = "deep-space"|"luminous-core"|"holographic-glass"|"architectural-metal"|"world-organic"|"character-surface"|"signal-fx";
export type MotionVocabulary = "float"|"orbit"|"pulse"|"drift"|"glow"|"reveal"|"assemble"|"speak"|"listen"|"think"|"greet"|"portal-enter"|"portal-exit"|"live-entrance"|"live-exit";

export type AssetMaterial = {
  id: string; role: MaterialRole; color: string; roughness: number; metalness: number; opacity: number;
  emissive?: string; emissiveIntensity?: number; transparent?: boolean;
};

export type GeometryPart = {
  id: string; kind: GeometryKind; material: string; position: [number,number,number];
  rotation?: [number,number,number]; scale?: [number,number,number];
  dimensions: Record<string,number>; detail: "mobile"|"standard";
};

export type AssetRecipe = {
  schema: typeof ASSET_FACTORY_SCHEMA;
  assetKey: string; themeKey: string; category: AssetCategory; presentationOnly: true;
  profile: Pick<Allpha3DThemeProfile,"family"|"geometry"|"material"|"atmosphere"|"landmark"|"district"|"character"|"portal">;
  materials: AssetMaterial[]; geometry: GeometryPart[]; motion: MotionVocabulary[];
  performance: { maxParts:number; transparentParts:number; mobileDetail:"compact"|"balanced"; lazyLoad:true };
  semantic: { accent:string; role:"system"|"navigation"|"intelligence"|"social-live"|"organic" };
  lifecycle:"concept"|"generated"|"validated"|"moderated"|"stored"|"manifest-ready"|"active";
};

const semanticByCategory: Record<AssetCategory,AssetRecipe["semantic"]["role"]> = {
  universe:"system", galaxy:"navigation", world:"system", orbit:"navigation", capsule:"intelligence",
  district:"system", booth:"social-live", "content-feed":"intelligence", "agent-character":"intelligence",
  "live-stage":"social-live", "human-live":"social-live", "sticker-social":"social-live",
  animation:"system", "navigation-fx":"navigation",
};

const semanticColor = {system:"#42DCFF",navigation:"#75B9FF",intelligence:"#A77CFF","social-live":"#EE7CFF",organic:"#63E6BE"} as const;

function seedFor(themeKey:string,category:string):number {
  let hash=2166136261;
  for(const char of themeKey+":"+category) hash=Math.imul(hash^char.charCodeAt(0),16777619);
  return Math.abs(hash>>>0);
}
function pick<T>(items:readonly T[],seed:number,offset=0):T { return items[(seed+offset)%items.length]; }
function n(seed:number,min:number,max:number,offset=0):number { return min+(((seed>>>(offset%24))%1000)/1000)*(max-min); }

function materialSet(profile:Allpha3DThemeProfile,semanticRole:AssetRecipe["semantic"]["role"]):AssetMaterial[] {
  const [accent,secondary,tertiary]=profile.accent;
  const semantic=semanticColor[semanticRole];
  return [
    {id:"deep-space",role:"deep-space",color:"#03050B",roughness:ALLPHA_3D_MASTER_LANGUAGE.materials.deepSpace.roughness,metalness:ALLPHA_3D_MASTER_LANGUAGE.materials.deepSpace.metalness,opacity:1},
    {id:"core",role:"luminous-core",color:accent,roughness:.28,metalness:.25,opacity:1,emissive:accent,emissiveIntensity:1.8},
    {id:"glass",role:"holographic-glass",color:secondary,roughness:.18,metalness:.18,opacity:.58,emissive:secondary,emissiveIntensity:.25,transparent:true},
    {id:"metal",role:"architectural-metal",color:tertiary,roughness:.3,metalness:.78,opacity:1},
    {id:"organic",role:"world-organic",color:profile.family.includes("organic")||profile.family.includes("living")?secondary:tertiary,roughness:.76,metalness:.04,opacity:1},
    {id:"character",role:"character-surface",color:secondary,roughness:.5,metalness:.12,opacity:1},
    {id:"signal",role:"signal-fx",color:semantic,roughness:.1,metalness:.05,opacity:.72,emissive:semantic,emissiveIntensity:1.25,transparent:true},
  ];
}

function partsFor(category:AssetCategory,profile:Allpha3DThemeProfile,seed:number):GeometryPart[] {
  const detail="standard" as const;
  const p=(id:string,kind:GeometryKind,material:string,dimensions:Record<string,number>,position:[number,number,number],scale?:[number,number,number]):GeometryPart=>({id,kind,material,dimensions,position,scale,detail});
  const ring=(id:string,radius:number,tube:number,material="signal",y=0):GeometryPart=>p(id,"ring",material,{radius,tube,segments:48},[0,y,0]);
  const count=3+(seed%3);
  switch(category){
    case "universe": return [p("core","sphere","core",{radius:1.4,segments:24},[0,0,0]),ring("orbit-primary",3.6,.045),ring("orbit-secondary",5.6,.035,"glass",.08),p("gateway","arc","glass",{radius:2.1,thickness:.12},[0,0,-1.6]),p("field","particle-field","signal",{radius:9,density:28},[0,0,0])];
    case "galaxy": return [p("core","sphere","core",{radius:1.05,segments:24},[0,0,0]),ring("primary-ring",3.2,.05),ring("secondary-ring",4.9,.035,"glass",.14),...Array.from({length:4},(_,i)=>p("world-node-"+(i+1),"beacon",i%2?"metal":"signal",{radius:.34,height:.6},[Math.cos(i*1.57)*3.1,(i%2)*.35,Math.sin(i*1.57)*3.1]))];
    case "world": return [p("ground","island","organic",{radius:6,height:.55},[0,-.35,0]),p("landmark","landmark","metal",{height:3.8,width:2.2},[0,1.6,0]),p("world-ring","ring","signal",{radius:5.2,tube:.035,segments:64},[0,.1,0]),p("portal","arc","glass",{radius:1.6,thickness:.12},[0,1.1,-4.2])];
    case "orbit": return [ring("primary",2.8,.05),ring("secondary",4.2,.035,"glass",.18),...Array.from({length:8},(_,i)=>p("orbit-node-"+(i+1),"beacon","signal",{radius:.22,height:.5},[Math.cos(i*Math.PI/4)*3.45,(i%3-.9)*.16,Math.sin(i*Math.PI/4)*3.45]))];
    case "capsule": return [p("capsule-core","capsule","core",{radius:.55,length:1.2},[0,0,0]),ring("capsule-orbit",1.05,.028),p("signal","beacon","signal",{radius:.1,height:.8},[0,.72,0])];
    case "district": return [p("district-ground","platform","organic",{width:7,depth:5,height:.35},[0,-.18,0]),...Array.from({length:count},(_,i)=>p("district-landmark-"+(i+1),pick(["tower","crystal","arc"] as const,seed,i),i%2?"metal":"organic",{height:1.8+n(seed,0,1,i),width:1+n(seed,0,.7,i+2)},[(-1+i)*1.7,.9,(i%2)*1.4-.7])),p("zone-marker","beacon","signal",{radius:.18,height:.8},[0,.5,2.5])];
    case "booth": return [p("shell","platform","metal",{width:2.8,depth:2.2,height:.3},[0,.15,0]),p("booth-structure",pick(["tower","arc","panel"] as const,seed),"glass",{height:2.2,width:2.4},[0,1.25,0]),p("sign","panel","signal",{width:1.8,height:.45,depth:.08},[0,2.25,.1]),p("portal","arc","core",{radius:.7,thickness:.08},[0,.8,-1.1])];
    case "content-feed": return [p("content-node","capsule","core",{radius:.42,length:.8},[0,0,0]),ring("relationship-orbit",.9,.022,"signal"),p("media-signal","panel","glass",{width:.9,height:.55,depth:.05},[0,.72,0])];
    case "agent-character": return [p("body","character","character",{height:2.6,width:.85},[0,1.3,0]),p("aura","ring","signal",{radius:.78,tube:.025,segments:32},[0,.05,0]),p("identity-beacon","beacon","core",{radius:.08,height:.5},[0,3.05,0])];
    case "live-stage": return [p("stage","stage","metal",{width:5.2,depth:3.6,height:.35},[0,.18,0]),p("backdrop","panel","glass",{width:4.6,height:2.5,depth:.08},[0,1.55,-1.25]),ring("stage-ring",2.4,.055,"signal",.42),p("audience-field","particle-field","signal",{radius:4.5,density:18},[0,.2,0])];
    case "human-live": return [p("presenter","character","character",{height:2.6,width:.85},[0,1.3,0]),p("uniform-accent","panel","signal",{width:.5,height:1.2,depth:.05},[0,1.5,.45]),ring("presence-ring",.75,.025,"signal",.04)];
    case "sticker-social": return [p("sticker","sphere","core",{radius:.65,segments:20},[0,0,0]),ring("sticker-ring",.9,.025,"signal"),p("badge","beacon","glass",{radius:.14,height:.35},[.55,.5,0])];
    case "animation": return [p("anchor","sphere","core",{radius:.55,segments:18},[0,0,0]),ring("motion-orbit",1.2,.025,"signal")];
    case "navigation-fx": return [p("portal","arc","core",{radius:1.45,thickness:.1},[0,0,0]),p("beam","beacon","signal",{radius:.06,height:3.2},[0,1.5,0]),ring("breadcrumb",1.9,.022,"glass")];
  }
}

const motionByCategory:Record<AssetCategory,MotionVocabulary[]> = {
  universe:["float","orbit","pulse"],galaxy:["orbit","pulse","drift"],world:["float","glow","drift"],orbit:["orbit","pulse"],
  capsule:["float","pulse","glow"],district:["drift","glow"],booth:["reveal","glow"],"content-feed":["float","orbit","reveal"],
  "agent-character":["float","speak","listen","think","greet"],"live-stage":["pulse","live-entrance","live-exit"],
  "human-live":["speak","listen","greet"],"sticker-social":["float","pulse","reveal"],
  animation:["float","orbit","pulse","speak","listen","think"],"navigation-fx":["portal-enter","portal-exit","glow"],
};

export function get3DThemeProfile(themeKey:string):Allpha3DThemeProfile|null {
  return ALLPHA_3D_THEME_PROFILES.find((profile)=>profile.key===themeKey)??null;
}

export function create3DAssetRecipe(themeKey:string,category:AssetCategory):AssetRecipe {
  const profile=get3DThemeProfile(themeKey);
  if(!profile) throw new Error("Unknown Allpha 3D theme: "+themeKey);
  const seed=seedFor(themeKey,category);
  const semantic=semanticByCategory[category];
  const geometry=partsFor(category,profile,seed);
  return {
    schema:ASSET_FACTORY_SCHEMA,assetKey:"v2/"+themeKey+"/"+category,themeKey,category,presentationOnly:true,
    profile:{family:profile.family,geometry:profile.geometry,material:profile.material,atmosphere:profile.atmosphere,landmark:profile.landmark,district:profile.district,character:profile.character,portal:profile.portal},
    materials:materialSet(profile,semantic),geometry,motion:motionByCategory[category],
    performance:{maxParts:geometry.length,transparentParts:geometry.filter((part)=>["glass","signal"].includes(part.material)).length,mobileDetail:geometry.length<=7?"balanced":"compact",lazyLoad:true},
    semantic:{accent:semanticColor[semantic],role:semantic},lifecycle:"generated",
  };
}

export function createThemeAssetMatrix(themeKey?:string):AssetRecipe[] {
  const themes=themeKey?[themeKey]:ALLPHA_3D_THEME_PROFILES.map((profile)=>profile.key);
  return themes.flatMap((key)=>ASSET_CATEGORIES.map((category)=>create3DAssetRecipe(key,category)));
}

export function validate3DAssetRecipe(recipe:AssetRecipe):{ok:true}|{ok:false;errors:string[]} {
  const errors:string[]=[];
  if(recipe.schema!==ASSET_FACTORY_SCHEMA) errors.push("ASSET_SCHEMA_UNSUPPORTED");
  if(recipe.presentationOnly!==true) errors.push("ASSET_PRESENTATION_BOUNDARY_INVALID");
  if(!recipe.assetKey.startsWith("v2/")) errors.push("ASSET_KEY_INVALID");
  if(!recipe.geometry.length) errors.push("ASSET_GEOMETRY_EMPTY");
  if(recipe.geometry.length>16) errors.push("ASSET_GEOMETRY_PART_BUDGET_EXCEEDED");
  if(recipe.performance.transparentParts>5) errors.push("ASSET_TRANSPARENCY_BUDGET_EXCEEDED");
  if(!recipe.materials.some((material)=>material.role==="luminous-core")) errors.push("ASSET_CORE_MATERIAL_MISSING");
  if(!recipe.materials.some((material)=>material.role==="signal-fx")) errors.push("ASSET_SIGNAL_MATERIAL_MISSING");
  return errors.length?{ok:false,errors}:{ok:true};
}

export const ALLPHA_3D_ASSET_FACTORY = {
  schema:ASSET_FACTORY_SCHEMA,themes:ALLPHA_3D_THEME_PROFILES.length,categories:ASSET_CATEGORIES.length,
  baselineAssets:ALLPHA_3D_THEME_PROFILES.length*ASSET_CATEGORIES.length,
  create:create3DAssetRecipe,matrix:createThemeAssetMatrix,validate:validate3DAssetRecipe,
} as const;
