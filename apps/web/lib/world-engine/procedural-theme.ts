export type ProceduralThemeStyle={
 ground:string;
 secondary:string;
 accent:string;
 structure:"tower"|"temple"|"crystal"|"tree"|"tech"|"castle";
 density:number;
 water:boolean;
 ring:boolean;
 sky:string;
 particle:string;
};

const profiles:Record<string,ProceduralThemeStyle>={
 "Heroic Nexus":{ground:"#111827",secondary:"#334155",accent:"#7C3AED",structure:"tower",density:9,water:false,ring:true,sky:"#070A18",particle:"#A78BFA"},
 "Nusantara Raya":{ground:"#3B5F45",secondary:"#8A6A43",accent:"#E6B85C",structure:"temple",density:8,water:true,ring:false,sky:"#08251A",particle:"#FDE68A"},
 "Neo Jakarta 2099":{ground:"#101827",secondary:"#27364F",accent:"#22D3EE",structure:"tech",density:11,water:true,ring:true,sky:"#050816",particle:"#67E8F9"},
 "Celestial Samurai":{ground:"#211A25",secondary:"#513044",accent:"#FB7185",structure:"temple",density:9,water:true,ring:true,sky:"#120914",particle:"#FDA4AF"},
 "Skyforge Empire":{ground:"#263142",secondary:"#5B6474",accent:"#F59E0B",structure:"tower",density:10,water:false,ring:true,sky:"#0B1220",particle:"#FDE68A"},
 "Emerald Rainforest":{ground:"#183C2A",secondary:"#355F3E",accent:"#84CC16",structure:"tree",density:11,water:true,ring:false,sky:"#061B12",particle:"#BEF264"},
 "Aurora Kingdom":{ground:"#24314A",secondary:"#4C5C78",accent:"#67E8F9",structure:"castle",density:8,water:true,ring:true,sky:"#081329",particle:"#C4B5FD"},
 "Desert Starfall":{ground:"#6D4B2C",secondary:"#A9783D",accent:"#F5C46A",structure:"temple",density:7,water:false,ring:true,sky:"#1A0E08",particle:"#FDE68A"},
 "Oceanic Atlantis":{ground:"#0B3145",secondary:"#176B83",accent:"#67E8F9",structure:"crystal",density:10,water:true,ring:false,sky:"#031622",particle:"#A5F3FC"},
 "Lunar Frontier":{ground:"#151923",secondary:"#343B50",accent:"#A78BFA",structure:"crystal",density:8,water:false,ring:true,sky:"#05070D",particle:"#DDD6FE"},
 "Mars Frontier":{ground:"#4A2521",secondary:"#754033",accent:"#FB923C",structure:"tower",density:8,water:false,ring:true,sky:"#190A08",particle:"#FDBA74"},
 "Neon Tokyo":{ground:"#211A25",secondary:"#513044",accent:"#F472B6",structure:"tech",density:12,water:true,ring:true,sky:"#100616",particle:"#F0ABFC"},
 "Pharaoh Eternal":{ground:"#6D4B2C",secondary:"#B8863B",accent:"#FDE68A",structure:"temple",density:7,water:true,ring:false,sky:"#1C1005",particle:"#FEF3C7"},
 "Viking Fjord":{ground:"#263142",secondary:"#556070",accent:"#38BDF8",structure:"castle",density:8,water:true,ring:false,sky:"#07111C",particle:"#BAE6FD"},
 "Kingdom of Aether":{ground:"#27324A",secondary:"#65708C",accent:"#C084FC",structure:"castle",density:9,water:false,ring:true,sky:"#0D0A20",particle:"#E9D5FF"},
 "Coral Metropolis":{ground:"#0B3145",secondary:"#176B83",accent:"#FB7185",structure:"crystal",density:10,water:true,ring:false,sky:"#041B25",particle:"#FBCFE8"},
 "Savanna Spirit":{ground:"#4B3A24",secondary:"#7A6038",accent:"#FACC15",structure:"tree",density:9,water:false,ring:false,sky:"#171008",particle:"#FEF08A"},
 "Floating Garden":{ground:"#183C2A",secondary:"#4C7A55",accent:"#A3E635",structure:"tree",density:10,water:true,ring:true,sky:"#061A12",particle:"#D9F99D"},
 "Dragon Dominion":{ground:"#263142",secondary:"#5A3B3B",accent:"#EF4444",structure:"castle",density:9,water:false,ring:true,sky:"#160708",particle:"#FCA5A5"},
 "Quantum City":{ground:"#101827",secondary:"#34445E",accent:"#818CF8",structure:"tech",density:12,water:false,ring:true,sky:"#050816",particle:"#C7D2FE"},
 "Crystal AI City":{ground:"#20203B",secondary:"#4B3F72",accent:"#C084FC",structure:"crystal",density:11,water:true,ring:true,sky:"#0A0718",particle:"#E9D5FF"},
 "Galactic Frontier":{ground:"#151923",secondary:"#343B50",accent:"#38BDF8",structure:"tower",density:10,water:false,ring:true,sky:"#02030A",particle:"#BAE6FD"},
 "Chronos Realm":{ground:"#2A2234",secondary:"#5B4A6F",accent:"#FBBF24",structure:"temple",density:8,water:false,ring:true,sky:"#100A18",particle:"#FDE68A"},
 "Mystic Academy":{ground:"#20203B",secondary:"#4B3F72",accent:"#C084FC",structure:"crystal",density:9,water:false,ring:true,sky:"#0A0718",particle:"#F0ABFC"},
 "Dream Carnival":{ground:"#24182D",secondary:"#5B2C65",accent:"#F472B6",structure:"tech",density:10,water:true,ring:true,sky:"#140719",particle:"#F9A8D4"},
};

const fallback:ProceduralThemeStyle={ground:"#172033",secondary:"#334155",accent:"#38BDF8",structure:"tower",density:7,water:false,ring:true,sky:"#050914",particle:"#BAE6FD"};

export function proceduralThemeStyle(scene:any):ProceduralThemeStyle{
 const architecture=String(scene?.environment?.architecture||"").trim();
 if(profiles[architecture]) return profiles[architecture];
 const biome=String(scene?.environment?.biome||"").toLowerCase();
 if(biome.includes("rainforest")||biome.includes("garden")) return profiles["Emerald Rainforest"];
 if(biome.includes("ocean")||biome.includes("coral")||biome.includes("atlantis")) return profiles["Oceanic Atlantis"];
 if(biome.includes("cyber")||biome.includes("neon")) return profiles["Neo Jakarta 2099"];
 if(biome.includes("desert")||biome.includes("pharaoh")) return profiles["Desert Starfall"];
 if(biome.includes("lunar")) return profiles["Lunar Frontier"];
 if(biome.includes("mars")) return profiles["Mars Frontier"];
 if(biome.includes("viking")||biome.includes("kingdom")||biome.includes("dragon")) return profiles["Viking Fjord"];
 if(biome.includes("samurai")||biome.includes("tokyo")) return profiles["Celestial Samurai"];
 if(biome.includes("mystic")||biome.includes("crystal")) return profiles["Mystic Academy"];
 if(biome.includes("carnival")) return profiles["Dream Carnival"];
 return fallback;
}
