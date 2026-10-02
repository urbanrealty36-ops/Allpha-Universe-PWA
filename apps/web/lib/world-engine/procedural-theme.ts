export type ProceduralThemeStyle={ground:string;secondary:string;accent:string;structure:"tower"|"temple"|"crystal"|"tree"|"tech"|"castle";density:number;water:boolean;ring:boolean};
export function proceduralThemeStyle(scene:any):ProceduralThemeStyle{
 const biome=String(scene?.environment?.biome||"").toLowerCase();
 if(biome.includes("nusantara")) return {ground:"#3b5f45",secondary:"#8a6a43",accent:"#e6b85c",structure:"temple",density:7,water:true,ring:false};
 if(biome.includes("cyber")||biome.includes("neon")) return {ground:"#101827",secondary:"#27364f",accent:"#22d3ee",structure:"tech",density:10,water:false,ring:true};
 if(biome.includes("rainforest")||biome.includes("savanna")||biome.includes("garden")) return {ground:"#183c2a",secondary:"#355f3e",accent:"#84cc16",structure:"tree",density:8,water:true,ring:false};
 if(biome.includes("desert")||biome.includes("pharaoh")) return {ground:"#6d4b2c",secondary:"#a9783d",accent:"#f5c46a",structure:"temple",density:6,water:false,ring:true};
 if(biome.includes("ocean")||biome.includes("coral")||biome.includes("atlantis")) return {ground:"#0b3145",secondary:"#176b83",accent:"#67e8f9",structure:"crystal",density:8,water:true,ring:false};
 if(biome.includes("lunar")||biome.includes("mars")||biome.includes("galactic")||biome.includes("quantum")) return {ground:"#151923",secondary:"#343b50",accent:"#a78bfa",structure:"crystal",density:9,water:false,ring:true};
 if(biome.includes("viking")||biome.includes("kingdom")||biome.includes("dragon")||biome.includes("aether")) return {ground:"#263142",secondary:"#556070",accent:"#f59e0b",structure:"castle",density:7,water:true,ring:false};
 if(biome.includes("samurai")||biome.includes("tokyo")) return {ground:"#211a25",secondary:"#513044",accent:"#fb7185",structure:"temple",density:8,water:true,ring:true};
 if(biome.includes("mystic")||biome.includes("crystal")) return {ground:"#20203b",secondary:"#4b3f72",accent:"#c084fc",structure:"crystal",density:8,water:false,ring:true};
 if(biome.includes("carnival")||biome.includes("music")||biome.includes("concert")) return {ground:"#24182d",secondary:"#5b2c65",accent:"#f472b6",structure:"tech",density:9,water:false,ring:true};
 return {ground:"#172033",secondary:"#334155",accent:"#38bdf8",structure:"tower",density:7,water:false,ring:true};
}