"""Allpha Universe 3D-V2.13D — 25 theme production expansion."""
from __future__ import annotations
import importlib.util, json, os, sys
from pathlib import Path
import bpy

ROOT=os.environ.get("ALLPHA_V213D_OUT","allpha-theme-v2-13d-production")
MANIFEST=os.environ.get("ALLPHA_V213C_MANIFEST","allpha-v2-13c-theme-factory-manifest.json")
CATEGORIES=["universe","galaxy","world","orbit","capsule","district","booth","content-feed","agent-character","live-stage","human-live","sticker-social","animation","navigation-fx"]
SCHEMA="allpha-3d-v2-13d-theme-production/1.0"

def load_base():
    p=Path(__file__).resolve().with_name("build_v2_13_production_art.py")
    spec=importlib.util.spec_from_file_location("allpha_v213_base",p)
    if not spec or not spec.loader: raise RuntimeError("BASE_BUILDER_LOAD_FAILED")
    m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
BASE=load_base()

def rgb(h):
    h=h.lstrip("#"); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))

def factory():
    d=json.loads(Path(MANIFEST).read_text())
    if d.get("themes")!=25 or d.get("categories")!=14 or d.get("matrixSize")!=350 or d.get("goldenTheme")!="crystal-ai-city":
        raise SystemExit("V2.13C_FACTORY_MANIFEST_GATE_FAILED")
    return d

def prism(name,loc,radius,depth,mat,vertices=6):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object; o.name=name; o.data.materials.append(mat); BASE.bevel(o,min(radius*.08,.08),2); return o

def arch(name,loc,radius,mat):
    return BASE.torus(name,loc,radius,max(.035,radius*.045),mat,(1.5708,0,0),72)

def dome(name,loc,radius,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=20,location=loc)
    o=bpy.context.object; o.name=name; o.scale=(radius,radius*.58,radius); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat); return o

def signature(m,p,c):
    k,f,g=p["key"],p["family"],p["geometry"]
    if "pagoda" in g:
        for i in range(4): prism(f"{k}_PagodaTier",(0,.5+i*.8,1.5),1.8-i*.3,.28,m["architectural"],8)
    elif "clockwork" in g:
        for r in (1.7,2.5,3.3): arch(f"{k}_ClockRing",(0,1.9,0),r,m["cyan"])
    elif "coral" in g or "underwater" in g:
        for i in range(7):
            a=i*6.283/7; prism(f"{k}_CoralSpire",(a and __import__("math").cos(a)*2.5,1.1+(i%2)*.4,__import__("math").sin(a)*2.5),.4+(i%2)*.1,2.6+(i%3)*.5,m["primary"],9)
    elif "dunes" in g:
        for i in range(5): dome(f"{k}_Dune",(-3.2+i*1.6,.35,-1.8+(i%2)),1.1,m["ground"])
        prism(f"{k}_Obelisk",(0,3.2,.4),.72,6.4,m["ice"],4)
    elif "cliffs" in g or "dragon" in f:
        for i in range(5): prism(f"{k}_Cliff",(-3.2+i*1.6,1.1+(i%2)*.7,2.1),.8,2.2+(i%3)*.8,m["architectural"],5)
        arch(f"{k}_DragonRing",(0,3.5,-1.2),2.8,m["warm"])
    elif "floating-tents" in g:
        for i in range(5): arch(f"{k}_Ribbon",(__import__("math").cos(i*1.256)*2.5,3.2,__import__("math").sin(i*1.256)*2.5),.8,m["secondary"])
    elif "canopy" in g:
        for i in range(6):
            a=i*6.283/6; BASE.cylinder(f"{k}_Trunk",(__import__("math").cos(a)*2.8,2.2,__import__("math").sin(a)*2.8),.16,4.4,m["architectural"],18,.02); dome(f"{k}_Canopy",(__import__("math").cos(a)*2.8,4.6,__import__("math").sin(a)*2.8),1.3,m["primary"])
    elif "floating-islands" in g or "aether-rings" in g:
        for i in range(5): BASE.cylinder(f"{k}_SkyIsland",(__import__("math").cos(i*1.256)*3.2,1.1+i*.2,__import__("math").sin(i*1.256)*3.2),.9,.32,m["ground"],6,.05)
    elif "modular-stations" in g or "moon-bases" in g:
        for i in range(5): dome(f"{k}_Habitat",(__import__("math").cos(i*1.256)*3,.75,__import__("math").sin(i*1.256)*3),.95,m["glass"])
    elif "red-rock" in g:
        for i in range(6): prism(f"{k}_Rock",(__import__("math").cos(i*1.047)*3,1,__import__("math").sin(i*1.047)*3),.75,2+(i%2),m["warm"],7)
        dome(f"{k}_Colony",(0,1,0),2,m["glass"])
    elif "towers-libraries" in g:
        for i in range(4): prism(f"{k}_Academy",(-2.4+i*1.6,2.7,1.8),.55,5.4,m["architectural"],8); arch(f"{k}_Rune",(-2.4+i*1.6,5.4,1.8),.78,m["secondary"])
    elif "vertical-megastructures" in g or "dense-signage" in g:
        for i in range(7): prism(f"{k}_Mega",(-4+i*1.3,2+(i%4)*.6,1.8),.55,4+(i%4)*1.2,m["architectural"],8)
    elif "archipelago" in g:
        for i in range(6): BASE.cylinder(f"{k}_Island",(__import__("math").cos(i*1.047)*3,.55,__import__("math").sin(i*1.047)*3),1,.5,m["ground"],7,.05); prism(f"{k}_Pavilion",(__import__("math").cos(i*1.047)*3,1.35,__import__("math").sin(i*1.047)*3),.48,1.6,m["architectural"],6)
    elif "pyramids" in g:
        for i,x in enumerate((-3,0,3)):
            bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=1.25,radius2=0,depth=3+i*.6,location=(x,1.5,1.6)); bpy.context.object.data.materials.append(m["warm"])
        arch(f"{k}_SolarRing",(0,3.9,1.6),3,m["ice"])
    elif "impossible-frames" in g:
        for i in range(5):
            bpy.ops.mesh.primitive_cube_add(location=(-2.8+i*1.4,2,1.2),scale=(.65,.08,1.8),rotation=(0,i*.16,i*.11)); o=bpy.context.object; o.name=f"{k}_QuantumFrame"; o.data.materials.append(m["glass"]); BASE.bevel(o,.05,2)
    elif "rock-formations" in g:
        for i in range(6): prism(f"{k}_SavannaRock",(__import__("math").cos(i*1.047)*3,1,__import__("math").sin(i*1.047)*3),.65,2+(i%2),m["ground"],5)
        dome(f"{k}_SpiritTree",(0,2.8,0),1.4,m["primary"])
    elif "sky-forges" in g:
        for i in range(4): prism(f"{k}_Forge",(-2.4+i*1.6,2.4,1.4),.6,4.8,m["architectural"],8)
    elif "fjord" in g:
        for i in range(5): prism(f"{k}_FjordCliff",(-3+i*1.5,1.2,2),.75,2.4+(i%3),m["architectural"],5)
        dome(f"{k}_FjordHall",(0,1.3,0),1.8,m["ice"])
    else:
        prism(f"{k}_GoldenLandmark",(0,2,1.2),1.15,4,m["ice"],6)
    if c in {"universe","galaxy","world","district","booth","live-stage","navigation-fx"}: arch(f"{k}_Portal_{c}",(0,1.9,-2.5),1.15,m["secondary"])
    if c in {"agent-character","human-live"}: BASE.torus(f"{k}_IdentityAura",(0,.3,0),1,.04,m["primary"],(1.5708,0,0),72)

def metadata(p,r,c):
    o=bpy.data.objects.new("ALLPHA_V2_13D_PRODUCTION_METADATA",None); bpy.context.collection.objects.link(o)
    for k,v in {"schema":SCHEMA,"themeKey":p["key"],"family":p["family"],"category":c,"goldenReference":"crystal-ai-city","presentationOnly":True,"legacy":False,"artQuality":"production-realistic-theme-factory","canonicalRenderer":"AllphaWorldRenderer","runtimeAuthority":"outside-blender","geometry":p["geometry"],"material":p["material"],"atmosphere":p["atmosphere"],"landmark":p["landmark"],"district":p["district"],"character":p["character"],"portal":p["portal"],"requiredDimensions":json.dumps(r["requiredDimensions"])}.items(): o[k]=v
    o.hide_render=True

def main():
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    preview="--preview" in args
    theme=args[args.index("--theme")+1] if "--theme" in args else None
    category=args[args.index("--category")+1] if "--category" in args else None
    data=factory(); profiles={p["key"]:p for p in data["profiles"]}
    rows=[]
    selected=[r for r in data["matrix"] if (not theme or r["themeKey"]==theme) and (not category or r["category"]==category)]
    if not theme and not category and len(selected)!=350: raise SystemExit("V2.13D_EXPECTED_350_RECIPES")
    Path(ROOT).mkdir(parents=True,exist_ok=True)
    for r in selected:
        p=profiles[r["themeKey"]]; BASE.clear_scene()
        a,b,c=map(rgb,p["accent"]); BASE.PALETTE.update({"primary":(*a,1),"secondary":(*b,1),"cyan":(*a,1),"ice":(*c,1),"steel":tuple(.045+x*.10 for x in a)+(.1,),"glass":tuple(.02+x*.18 for x in b)+(1,),"midnight":(.004,.007,.018,1),"skin":(.58,.34,.27,1)}); BASE.PALETTE["warm"]=(*a,1)
        BASE.setup_world_and_render(); mats=BASE.build_materials(); BASE.add_lighting(mats); BASE.build_category(mats,r["category"]); signature(mats,p,r["category"]); BASE.add_stars(mats,180 if r["category"] in {"universe","galaxy","world","district","live-stage"} else 70); metadata(p,r,r["category"]); BASE.configure_camera(r["category"])
        out=Path(ROOT)/p["key"]; out.mkdir(parents=True,exist_ok=True); glb=out/f'{r["category"]}.glb'
        bpy.ops.object.select_all(action="SELECT"); bpy.ops.export_scene.gltf(filepath=str(glb),export_format="GLB",export_apply=True,export_animations=True,export_materials="EXPORT",use_selection=False)
        png=None
        if preview: png=out/f'{r["category"]}.png'; bpy.context.scene.render.filepath=str(png); bpy.ops.render.render(write_still=True)
        rows.append({"themeKey":p["key"],"category":r["category"],"glb":str(glb),"preview":str(png) if png else None,"schema":SCHEMA,"presentationOnly":True,"goldenReference":"crystal-ai-city","canonicalRenderer":"AllphaWorldRenderer"})
    (Path(ROOT)/"manifest.json").write_text(json.dumps({"schema":SCHEMA,"phase":"3D-V2.13D","goldenReference":"crystal-ai-city","themes":25,"categories":14,"matrixSize":350,"generated":len(rows),"previewRequested":preview,"assets":rows,"status":"PRODUCTION_EXPANSION_BUILT"},indent=2))
    print(json.dumps({"ok":True,"themes":25,"categories":14,"generated":len(rows),"root":ROOT}))
if __name__=="__main__": main()
