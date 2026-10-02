export type Vec3 = { x:number; y:number; z:number };
export type SceneNode = { id:string; position?:Vec3; rotation?:Vec3; scale?:Vec3; kind?:string; zone_id?:string; presentation_only?:boolean; metadata?:Record<string,unknown> };
export type NavigationNode = { id:string; position:Vec3; zone_id?:string|null };
export type NavigationEdge = { from:string; to:string; cost?:number; bidirectional?:boolean };
export type WorldScene = {
  schema_version:string;
  renderer:string;
  environment:Record<string,unknown>;
  terrain?:Record<string,unknown>;
  structures?:SceneNode[];
  roads?:SceneNode[];
  pathways?:SceneNode[];
  zones: Array<{id:string;type:string;capacity?:number}>;
  booths?:SceneNode[];
  portals?:Array<{id:string;target:string;presentation_only?:boolean;position?:Vec3}>;
  signage?:SceneNode[];
  screens?:SceneNode[];
  lighting:Record<string,unknown>;
  atmosphere:Record<string,unknown>;
  ambient_audio?:Record<string,unknown>;
  interactive_hotspots?:SceneNode[];
  spawn_points:Array<{id:string;zone:string;position?:Vec3}>;
  navigation_graph?:{nodes:NavigationNode[];edges:NavigationEdge[]};
  camera:Record<string,unknown>;
  performance_budget?:Record<string,unknown>;
  accessibility?:Record<string,unknown>;
  animation?:Record<string,unknown>;
  materials?:Record<string,unknown>;
  characters?:SceneNode[];
  interaction_points?:SceneNode[];
  authority_boundary?:{presentation_only:true};
};

const forbidden = new Set(["code","script","callback","executable","security","permission","policy","risk","ownership","verification","reputation","audit","billing","entitlement","approval"]);
const required = ["schema_version","renderer","environment","zones","lighting","atmosphere","spawn_points","camera"] as const;

export function validateWorldScene(value: unknown): { ok:true; scene:WorldScene } | { ok:false; errors:string[] } {
  const errors:string[]=[];
  if(!value || typeof value!=="object" || Array.isArray(value)){return {ok:false,errors:["SCENE_INVALID_OBJECT"]};}
  const scene=value as Record<string,unknown>;
  for(const key of required) if(!(key in scene)) errors.push(`SCENE_REQUIRED_${key.toUpperCase()}`);
  for(const key of Object.keys(scene)) if(forbidden.has(key)) errors.push(`SCENE_FORBIDDEN_NAMESPACE_${key.toUpperCase()}`);
  if(scene.schema_version!=="1.0") errors.push("SCENE_SCHEMA_VERSION_UNSUPPORTED");
  if(typeof scene.renderer!=="string" || scene.renderer.length===0) errors.push("SCENE_RENDERER_INVALID");
  if(!Array.isArray(scene.zones)) errors.push("SCENE_ZONES_INVALID");
  if(!Array.isArray(scene.spawn_points)) errors.push("SCENE_SPAWN_POINTS_INVALID");
  if(scene.authority_boundary && JSON.stringify(scene.authority_boundary)!==JSON.stringify({presentation_only:true})) errors.push("SCENE_AUTHORITY_BOUNDARY_INVALID");
  if(errors.length) return {ok:false,errors};
  return {ok:true,scene:scene as unknown as WorldScene};
}

export function normalizeWorldScene(value: unknown): WorldScene | null {
  const result=validateWorldScene(value);
  if(!result.ok) return null;
  return {
    ...result.scene,
    structures:Array.isArray(result.scene.structures)?result.scene.structures:[],
    roads:Array.isArray(result.scene.roads)?result.scene.roads:[],
    pathways:Array.isArray(result.scene.pathways)?result.scene.pathways:[],
    booths:Array.isArray(result.scene.booths)?result.scene.booths:[],
    portals:Array.isArray(result.scene.portals)?result.scene.portals:[],
    signage:Array.isArray(result.scene.signage)?result.scene.signage:[],
    screens:Array.isArray(result.scene.screens)?result.scene.screens:[],
    interactive_hotspots:Array.isArray(result.scene.interactive_hotspots)?result.scene.interactive_hotspots:[],
    navigation_graph:result.scene.navigation_graph ?? {nodes:[],edges:[]},
    characters:Array.isArray(result.scene.characters)?result.scene.characters:[],
    interaction_points:Array.isArray(result.scene.interaction_points)?result.scene.interaction_points:[],
  };
}
