# Blender source is intentionally kept as a deterministic production generator.
# Run with Blender 4.x:
# blender -b --python scripts/3d/blender/build_v2_13_production_art.py -- --theme crystal-ai-city --preview
#
# This file is generated from the canonical 3D-V2.13 art contract and uses only Blender
# geometry/material/light APIs. It does not contain product authority logic.

import bpy, math, os, sys, json, random
from mathutils import Vector

SCHEMA = "allpha-3d-v2-13-production-art/1.0"
ROOT = os.environ.get("ALLPHA_V213_OUT", "allpha-theme-v2-13-golden-pack")

THEMES = {
 "crystal-ai-city": ((.06,.55,.95,1),(.58,.20,1,1),(.04,.95,.92,1)),
 "aurora-kingdom": ((.20,.95,.72,1),(.32,.52,1,1),(.70,.35,1,1)),
 "celestial-samurai": ((.95,.16,.32,1),(.12,.55,1,1),(1,.72,.18,1)),
 "chronos-realm": ((.92,.54,.18,1),(.36,.78,.98,1),(.85,.85,.90,1)),
 "coral-metropolis": ((.10,.85,.96,1),(1,.30,.54,1),(.20,.72,.56,1)),
 "desert-starfall": ((1,.45,.18,1),(.96,.78,.26,1),(.40,.16,.10,1)),
 "dragon-dominion": ((.90,.10,.22,1),(.25,.75,.35,1),(.85,.42,.10,1)),
 "dream-carnival": ((.95,.18,.72,1),(.18,.80,1,1),(.75,.36,1,1)),
 "emerald-rainforest": ((.08,.78,.34,1),(.12,.66,.90,1),(.58,.95,.30,1)),
 "floating-garden": ((.42,.95,.58,1),(.50,.62,1,1),(.95,.72,.30,1)),
 "galactic-frontier": ((.18,.40,1,1),(.68,.22,1,1),(.10,.90,1,1)),
 "heroic-nexus": ((.15,.50,1,1),(.95,.25,.18,1),(.98,.82,.20,1)),
 "kingdom-of-aether": ((.40,.85,1,1),(.70,.35,1,1),(.85,.90,1,1)),
 "lunar-frontier": ((.52,.62,.82,1),(.62,.38,1,1),(.20,.78,1,1)),
 "mars-frontier": ((.90,.25,.10,1),(.95,.56,.18,1),(.26,.32,.38,1)),
 "mystic-academy": ((.50,.22,.90,1),(.16,.68,1,1),(.96,.76,.20,1)),
 "neo-jakarta-2099": ((.10,.70,.92,1),(.96,.18,.42,1),(.56,.26,1,1)),
 "neon-tokyo": ((.12,.86,1,1),(.95,.18,.62,1),(.70,.28,1,1)),
 "nusantara-raya": ((.10,.66,.42,1),(.92,.62,.18,1),(.16,.78,.96,1)),
 "oceanic-atlantis": ((.05,.68,.96,1),(.20,.96,.84,1),(.36,.32,1,1)),
 "pharaoh-eternal": ((.98,.68,.18,1),(.94,.40,.12,1),(.24,.12,.06,1)),
 "quantum-city": ((.28,.62,1,1),(.80,.22,1,1),(.16,.92,.96,1)),
 "savanna-spirit": ((.90,.54,.16,1),(.24,.76,.30,1),(.96,.82,.30,1)),
 "skyforge-empire": ((.28,.34,.46,1),(.92,.36,.18,1),(.62,.72,.90,1)),
 "viking-fjord": ((.16,.46,.72,1),(.70,.84,1,1),(.90,.62,.24,1)),
}

CATEGORIES=["universe","galaxy","world","orbit","capsule","district","booth","content-feed",
"agent-character","live-stage","human-live","sticker-social","animation","navigation-fx"]

def rgba(c,a=1): return (c[0],c[1],c[2],a)

def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

def mat(name,base,metallic=.25,rough=.32,emission=None,strength=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=rgba(base)
    bs.inputs["Metallic"].default_value=metallic
    bs.inputs["Roughness"].default_value=rough
    if "Emission Color" in bs.inputs:
        bs.inputs["Emission Color"].default_value=rgba(emission or base)
        bs.inputs["Emission Strength"].default_value=strength
    return m

def bevel(o,amount=.06,segments=3):
    mod=o.modifiers.new("ProductionBevel","BEVEL"); mod.width=amount; mod.segments=segments
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=mod.name)

def cube(name,loc,scale,material,bevel_size=.06):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material); bevel(o,bevel_size); return o

def cyl(name,loc,radius,depth,material,verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=loc)
    o=bpy.context.object; o.name=name; o.data.materials.append(material); bevel(o,.035); return o

def sphere(name,loc,scale,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material); return o

def torus(name,loc,major,minor,material,rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=96,minor_segments=16,location=loc,rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(material); return o

def look_at(o,target=(0,1,0)):
    o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()

def area(name,loc,energy,color,size=5):
    d=bpy.data.lights.new(name,"AREA"); d.energy=energy; d.color=color[:3]; d.shape="DISK"; d.size=size
    o=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(o); o.location=loc; look_at(o,(0,1.4,0)); return o

def setup(theme,accent):
    clear()
    world=bpy.context.scene.world or bpy.data.worlds.new("AllphaWorld")
    bpy.context.scene.world=world; world.use_nodes=True
    bg=world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value=(.0015,.003,.01,1); bg.inputs["Strength"].default_value=.12
    scene=bpy.context.scene; scene.render.engine="BLENDER_EEVEE_NEXT"
    scene.render.resolution_x=720; scene.render.resolution_y=720; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"
    scene.view_settings.look="AgX - Medium High Contrast"
    a,b,c=accent
    return {
      "core":mat(theme+"_Core",a,.72,.22,a,4.2),
      "metal":mat(theme+"_Metal",b,.92,.20,b,.9),
      "glass":mat(theme+"_Glass",(.05,.12,.25,1),.45,.12,c,1.3),
      "dark":mat(theme+"_Dark",(.008,.015,.035,1),.78,.27,(.01,.025,.08,1),.2),
      "skin":mat(theme+"_Skin",(.58,.32,.24,1),0,.48),
      "light":mat(theme+"_Light",(.78,.92,1,1),.1,.18,c,2.6),
      "organic":mat(theme+"_Organic",(.03,.18,.09,1),0,.72,a,.2),
    }

def windows(x,y,z,w,h,d,m):
    rows=max(4,int(h*1.5))
    for r in range(rows):
      for col in range(3):
        xx=x+(col-1)*w*.36
        zz=z+(r/(rows-1)-.5)*d*.82
        cube("Window",(xx,y,zz),(w*.07,.018,d*.055),m,.008)

def city(m):
    random.seed(213)
    for i in range(26):
      x=(i%8-3.5)*1.35+random.uniform(-.15,.15)
      z=(i//8-1.5)*1.35+random.uniform(-.15,.15)
      h=random.uniform(2.0,6.4)*(1 if abs(x)<3 else .72)
      w=random.uniform(.42,.78)
      cube("Tower",(x,h/2,z),(w,h/2,w*.72),m["dark"],.10)
      windows(x,h*.56,z,w,h,w*1.35,m["light"])
      if i%3==0: torus("SkyRing",(x,h+.10,z),w*.82,.024,m["core"],(math.pi/2,0,0))
    cube("Plaza",(0,-.14,0),(7.5,.14,5.8),m["glass"],.12)
    for r in range(3): torus("OrbitRail",(0,.18+r*.32,0),2.8+r*1.3,.026,m["metal"],(math.pi/2,0,0))

def character(m,x=0,z=0):
    sphere("Head",(x,2.55,z),(.46,.52,.43),m["skin"])
    sphere("Hair",(x,2.84,z-.02),(.52,.34,.47),m["dark"])
    cube("Torso",(x,1.72,z),(.45,.68,.27),m["metal"],.16)
    for sx in (-1,1): cyl("Arm",(x+sx*.52,1.72,z),.12,1.28,m["skin"],20)
    for sx in (-1,1): cyl("Leg",(x+sx*.20,.66,z),.14,1.55,m["dark"],20)
    sphere("EyeL",(x-.16,2.58,z-.40),(.055,.07,.035),m["light"])
    sphere("EyeR",(x+.16,2.58,z-.40),(.055,.07,.035),m["light"])
    torus("CharacterAura",(x,1.70,z),.86,.034,m["core"],(math.pi/2,0,0))

def portal(m,r=2):
    torus("Portal",(0,1.7,0),r,.10,m["core"],(math.pi/2,0,0))
    torus("PortalInner",(0,1.7,0),r*.82,.045,m["light"],(math.pi/2,0,0))
    sphere("PortalCore",(0,1.7,0),(r*.48,.14,r*.48),m["glass"])

def build(theme,accent,category,preview=False):
    m=setup(theme,accent)
    area("Key",(5,8,6),1200,accent[2],6)
    area("Rim",(-6,5,-3),900,accent[1],5)
    area("Fill",(0,4,7),650,accent[0],4)
    hero={"universe","galaxy","world","district","live-stage"}
    if category in hero: city(m)
    if category=="universe":
      portal(m,3.2); character(m,0,2)
    elif category=="galaxy":
      sphere("Planet",(0,2,0),(2,1.4,2),m["glass"]); portal(m,2.8)
      for i in range(8): torus("Orbit",(0,2,0),2.4+i*.35,.025,m["metal"],(math.pi/2+i*.12,0,i*.2))
    elif category=="world":
      portal(m,2.5); sphere("WorldCore",(0,1,0),(1.5,.55,1.5),m["core"])
    elif category=="district":
      for i in range(6): character(m,(i-2.5)*1.5,(i%2)*1.2-.6)
      portal(m,2.3)
    elif category=="orbit":
      sphere("Core",(0,0,0),(1.15,1.15,1.15),m["core"])
      for i in range(6): torus("Orbit",(0,0,0),1.6+i*.35,.035,m["metal"],(math.pi/2,i*.18,i*.24))
    elif category=="capsule":
      sphere("Capsule",(0,1.5,0),(1.8,1.05,1.2),m["glass"]); torus("CapsuleRing",(0,1.5,0),1.75,.06,m["core"],(math.pi/2,0,0)); cube("CapsuleBase",(0,.25,0),(1.3,.16,.9),m["dark"],.14)
    elif category=="booth":
      cube("BoothShell",(0,1.6,0),(2.2,1.5,1.6),m["dark"],.18); cube("BoothFront",(0,1.35,-1.66),(1.9,1.05,.05),m["glass"],.02); cube("BoothSign",(0,2.85,-1.72),(1.4,.12,.04),m["core"],.03); character(m,0,-.9)
    elif category=="content-feed":
      for i in range(5):
        x=(i-2)*1.15; cube("ContentCard",(x,1.45,0),(.48,.72,.08),m["glass"],.07); torus("CardGlow",(x,2,-.12),.26,.025,m["core"],(math.pi/2,0,0))
      portal(m,2.4)
    elif category in {"agent-character","human-live"}:
      character(m)
    elif category=="live-stage":
      cube("Stage",(0,.2,0),(3.8,.18,2.8),m["dark"],.12); torus("StageRing",(0,.45,0),2.6,.05,m["core"],(math.pi/2,0,0)); character(m,-1.2,.1); character(m,1.2,.1); portal(m,3)
    elif category=="sticker-social":
      sphere("StickerCore",(0,1.4,0),(1.35,.35,1.35),m["light"]); torus("StickerRing",(0,1.4,0),1.25,.07,m["core"],(math.pi/2,0,0))
    elif category=="animation":
      character(m); torus("AnimationPath",(0,1.2,0),2.2,.035,m["core"],(math.pi/2,0,0))
      bpy.context.scene.frame_start=1; bpy.context.scene.frame_end=60
      bpy.context.object.rotation_euler[2]=0
    elif category=="navigation-fx":
      portal(m,2.8); torus("NavOuter",(0,1.7,0),3.5,.035,m["metal"],(math.pi/2,0,0))
    if category in hero or category in {"booth","live-stage"}: cube("Ground",(0,-.28,0),(8,.12,8),m["dark"],.12)
    bpy.ops.object.camera_add(location=(10,8,12)); cam=bpy.context.object; cam.data.lens=48; look_at(cam,(0,1.4,0)); bpy.context.scene.camera=cam
    bpy.ops.object.empty_add(type="PLAIN_AXES",location=(0,-20,0))
    meta=bpy.context.object; meta.name="ALLPHA_V2_13_PRODUCTION_ART_METADATA"
    meta["schema"]=SCHEMA; meta["themeKey"]=theme; meta["category"]=category
    meta["source"]="blender-production-export"; meta["presentationOnly"]=True; meta["legacy"]=False
    meta.hide_render=True
    out=os.path.join(ROOT,theme,category+".glb"); os.makedirs(os.path.dirname(out),exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=out,export_format="GLB",export_apply=True,export_animations=True,export_materials="EXPORT",use_selection=False)
    if preview:
      bpy.context.scene.render.filepath=os.path.join(ROOT,theme,category+".png"); bpy.ops.render.render(write_still=True)
    return out

def main():
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    theme=args[args.index("--theme")+1] if "--theme" in args else "crystal-ai-city"
    category=args[args.index("--category")+1] if "--category" in args else None
    preview="--preview" in args
    if theme not in THEMES: raise SystemExit("Unknown theme: "+theme)
    cats=[category] if category else CATEGORIES
    for c in cats:
      if c not in CATEGORIES: raise SystemExit("Unknown category: "+c)
    rows=[{"themeKey":theme,"category":c,"path":build(theme,THEMES[theme],c,preview),"schema":SCHEMA,"source":"blender-production-export","presentationOnly":True,"legacy":False} for c in cats]
    os.makedirs(ROOT,exist_ok=True)
    with open(os.path.join(ROOT,"manifest.json"),"w") as f: json.dump({"schema":"allpha-3d-v2-13-production-art-manifest/1.0","themes":1,"categories":len(cats),"assets":len(rows),"source":"blender-production-export","assetsList":rows},f,indent=2)
    print(json.dumps({"schema":SCHEMA,"theme":theme,"categories":len(cats),"assets":len(rows),"root":ROOT}))

main()
