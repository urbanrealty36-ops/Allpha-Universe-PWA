"""Allpha V2.13D Reference Real Production Art Builder.

This replaces the rejected primitive D3C visual grammar with reference-led,
architectural production scenes. Blender is the art-authoring layer only.
Runtime authority remains AllphaWorldRenderer.

Scope: 25 themes x Universe/Galaxy/World/District = 100 macro assets.
Reference language: cinematic depth, believable scale, architectural detail,
PBR-like materials, practical/emissive lighting, atmospheric separation,
mobile-portrait composition, real spatial environments.
"""
from __future__ import annotations
import bpy, math, os, random, sys, json, importlib.util
from mathutils import Vector

HERE = os.path.dirname(__file__)
BASE_PATH = os.path.join(HERE, "build_v2_13_production_art.py")
spec = importlib.util.spec_from_file_location("allpha_ref_base", BASE_PATH)
BASE = importlib.util.module_from_spec(spec); spec.loader.exec_module(BASE)

ROOT = os.environ.get("ALLPHA_V213D_OUT", "allpha-theme-v2-13d-reference-real")
MANIFEST = os.environ.get("ALLPHA_V213C_MANIFEST", "allpha-v2-13c-theme-factory-manifest.json")
CATEGORIES = ["universe","galaxy","world","district"]
SCHEMA = "allpha-3d-v2-13d-reference-real/1.0"
THEMES = ["aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city","desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden","galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier","mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis","pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"]

def rgb(v):
    v=v.lstrip("#"); return tuple(int(v[i:i+2],16)/255 for i in (0,2,4))

def bind_palette(p):
    a,b,c=[rgb(x) for x in p["accent"]]
    BASE.PALETTE.update({
      "primary":(*a,1),"secondary":(*b,1),"cyan":(*a,1),"violet":(*b,1),
      "ice":(*c,1),"steel":tuple(.035+x*.12 for x in a)+(1,),
      "glass":tuple(.012+x*.20 for x in b)+(1,),"midnight":(.002,.004,.012,1),
      "skin":(.58,.34,.27,1)
    })

def mat(name, base, metallic=.0, rough=.38, emission=None, strength=0.0, transmission=0.0):
    return BASE.production_material(name, base, metallic=metallic, roughness=rough,
      emission=emission or base, emission_strength=strength, transmission=transmission,
      noise_scale=7.0, noise_strength=.035)

def materials():
    p=BASE.PALETTE
    return {
      "metal":mat("REF_Metal",p["steel"],.86,.23),
      "dark":mat("REF_Dark",p["midnight"],.28,.22),
      "glass":mat("REF_Glass",p["glass"],.18,.11,p["cyan"],.16,.28),
      "light":mat("REF_Light",p["cyan"],.05,.16,p["cyan"],5.0),
      "accent":mat("REF_Accent",p["secondary"],.05,.16,p["secondary"],4.0),
      "ice":mat("REF_Ice",p["ice"],.12,.14,p["ice"],.55,.12),
      "ground":mat("REF_Ground",(.012,.018,.028,1),.22,.48),
      "road":mat("REF_Road",(.006,.009,.014,1),.10,.62),
      "warm":mat("REF_Warm",(.42,.16,.045,1),.08,.30,(1,.28,.06,1),2.2),
      "green":mat("REF_Green",(.025,.11,.055,1),.05,.68),
      "water":mat("REF_Water",(.006,.045,.075,1),.16,.08,p["cyan"],.12,.34),
      "skin":mat("REF_Skin",p["skin"],0,.42),
    }

def cube(n,loc,scale,m,b=.04,rot=0):
    o=BASE.cube(n,loc,scale,m,b); o.rotation_euler[2]=rot; return o
def cyl(n,loc,r,d,m,v=32,b=.025):
    return BASE.cylinder(n,loc,r,d,m,v,b)
def sph(n,loc,scale,m): return BASE.sphere(n,loc,scale,m)
def tor(n,loc,R,r,m,rot=(math.pi/2,0,0),seg=96): return BASE.torus(n,loc,R,r,m,rot,seg)

def window_wall(m,x,y,z,w,h,d,rows=8,cols=5,rot=0):
    for row in range(rows):
        py=y-h/2+.28+(h-.56)*row/max(1,rows-1)
        for col in range(cols):
            px=x-w/2+.22+(w-.44)*col/max(1,cols-1)
            if (row*7+col*3)%6:
                o=cube("FacadeWindow",(px,py,z-d/2-.018),(.045,.07,.012),m["light"],.006,rot)

def building(m,x,z,w,h,d,theme_i,style=0):
    rot=((theme_i*17)%13-6)*.012
    cube("BuildingBody",(x,h/2,z),(w/2,h/2,d/2),m["metal"],.11,rot)
    cube("BuildingGlass",(x,h*.54,z-d/2-.012),(w*.39,h*.38,.025),m["glass"],.018,rot)
    window_wall(m,x,h*.56,z-d/2,w*.72,h*.72,d,rows=max(5,int(h*1.1)),cols=4,rot=rot)
    for side in (-1,1):
        cube("FacadeFin",(x+side*(w/2-.08),h*.58,z),(0.035,h*.39,d*.53),m["accent"],.018,rot)
    for level in (0.34,.62,.86):
        if h>5:
            tor("FacadeBand",(x,h*level,z),w*.54,.018,m["light"],(0,0,0),64)
    if style%3==0:
        cube("RoofGarden",(x,h+.08,z),(w*.30,.08,d*.30),m["green"],.025,rot)
    if style%4==1:
        cyl("RoofAntenna",(x,h+.55,z),.028,1.0,m["light"],12,.008)
    return h

def tree(m,x,z,s=1.0):
    cyl("TreeTrunk",(x,.55*s,z),.10*s,1.1*s,m["metal"],16,.018)
    for dx,dz,sy in [(-.28,0,1.0),(.25,.04,.92),(0,.22,1.08)]:
        sph("TreeCrown",(x+dx*s,1.18*s,z+dz*s),(.48*s,.58*s,.48*s),m["green"])

def streetlight(m,x,z,h=2.8):
    cyl("StreetPole",(x,h/2,z),.035,h,m["metal"],16,.008)
    cube("StreetArm",(x+.24,h-.12,z),(.26,.025,.025),m["metal"],.008)
    sph("StreetLamp",(x+.49,h-.14,z),(.055,.055,.055),m["warm"])

def road(m,a,b,width=.75):
    ax,az=a; bx,bz=b; dx=bx-ax; dz=bz-az; L=math.hypot(dx,dz)
    o=cube("Road",((ax+bx)/2,.02,(az+bz)/2),(L/2,.035,width/2),m["road"],.02,math.atan2(dz,dx))
    for t in (.2,.4,.6,.8):
        x=ax+dx*t; z=az+dz*t
        cube("RoadLane",(x,.064,z),(.16,.012,.028),m["light"],.004,math.atan2(dz,dx))

def city(m,p,theme_i,district=False):
    fam=p["family"].lower()
    cube("Terrain",(0,-.24,1.0),(8.8,.20,7.0),m["ground"],.18)
    # Main spatial composition: foreground street, midground architecture, distant skyline.
    road(m,(-7,-2.6),(7,-2.6),1.15); road(m,(-5,-.2),(5,4.6),.62)
    if any(k in fam for k in ("ocean","submerged","atlantis")):
        cube("WaterPlane",(0,-.02,4.6),(7.8,.04,2.1),m["water"],.02)
        for x in (-5,-2,1,4): sph(m,(x,1.1,5.1),(.75,.7,.75),m["glass"])
    if any(k in fam for k in ("desert","pharaoh","ancient")):
        for x in (-6,6): cube("DuneBlock",(x,.25,4.7),(1.3,.25,1.7),m["warm"],.25)
    if any(k in fam for k in ("rainforest","organic","living")):
        for x,z in [(-6,2),(-4,4),(5,2),(6,5),(-2,5),(3,5)]: tree(m,x,z,1.35)
    # Real architectural skyline with layered scale.
    specs=[(-6.2,2.4,1.5,3.8),(-4.5,3.2,1.25,5.4),(-2.8,3.7,1.1,6.5),
           (2.5,3.6,1.2,7.0),(4.4,3.1,1.45,5.8),(6.2,2.7,1.2,4.3),
           (-1.0,5.0,1.35,9.5),(1.0,5.3,1.55,11.0)]
    for i,(x,z,w,h) in enumerate(specs):
        building(m,x,z,w,h,w*.72,theme_i,i)
    # Civic landmark: layered tower rather than primitive monolith.
    for i in range(5):
        y=.4+i*.72; r=1.75-i*.19
        cyl("CivicTier",(0,y,.9),r,.34,m["metal"],64,.035)
        tor("CivicLight",(0,y+.18,.9),r*.9,.022,m["light"],(math.pi/2,0,0),96)
    cyl("CivicCore",(0,4.2,.9),.62,7.4,m["glass"],64,.05)
    for y in (1.6,2.6,3.6,4.6,5.6,6.6): tor("CivicRing",(0,y,.9),.86,.026,m["ice"],(math.pi/2,0,0),80)
    # Pedestrian scale.
    for x,z in [(-6,-2.3),(-4,-2.2),(4,-2.2),(6,-2.3),(0,-1.9)]:
        streetlight(m,x,z,2.6)
    for x,z in [(-6.8,-1.7),(-5.5,1.7),(5.8,1.4),(6.7,3.8)]: tree(m,x,z,.9)
    if district:
        for x in (-2.2,2.2): cube("DistrictGateway",(x,1.8,-.6),(.18,1.8,.18),m["accent"],.03)
        tor("DistrictPortal",(0,2.2,-.6),2.2,.05,m["light"],(math.pi/2,0,0),112)

def planet(m,theme_i):
    sph("Planet",(0,3.5,1.2),(2.55,2.55,2.55),m["ground"])
    # layered continents as sculptural terrain masses, not flat UI primitives.
    for i in range(8):
        a=i*math.tau/8
        x=math.cos(a)*1.8; z=1.2+math.sin(a)*1.35
        sph("Continent",(x,3.65,z),(.75,.18,.52),m["green"])
    tor("Atmosphere",(0,3.5,1.2),2.72,.075,m["ice"],(math.pi/2,.15,.08),128)
    tor("PlanetRing",(0,3.5,1.2),3.5,.035,m["light"],(.95,.15,.22),128)

def galaxy(m,theme_i):
    # Dense spiral field with an actual focal core and curved arms.
    sph("GalaxyCore",(0,3.8,1.0),(1.15,.8,1.15),m["ice"])
    for arm in range(3):
        for i in range(70):
            t=i/69
            r=.8+5.8*t
            a=arm*math.tau/3 + t*math.tau*1.45 + math.sin(i*1.7+theme_i)*.07
            x=math.cos(a)*r; z=1.0+math.sin(a)*r*.62; y=3.8+math.sin(a*1.7)*.45
            s=.018+.035*(1-t)
            sph("Star",(x,y,z),(s,s,s),m["ice"] if i%7 else m["light"])
    for r in (2.1,3.4,4.7): tor("GalaxyDustBand",(0,3.8,1.0),r,.018,m["accent"],(.72,.2,0),112)

def universe(m,p,theme_i):
    galaxy(m,theme_i); planet(m,theme_i)
    city(m,p,theme_i,False)
    for pos,scale in [((-6,6,7),.55),((6,7,8),.75),((7,3,1),.45)]:
        sph("DistantWorld",pos,(scale,scale,scale),m["glass"])
        tor("DistantOrbit",(pos[0],pos[1],pos[2]),scale*1.5,.015,m["light"],(.8,.3,.1),64)

def lights(m):
    p=BASE.PALETTE
    BASE.area_light("ReferenceKey",(7,11,9),1900,p["cyan"],6.0,(0,3,0))
    BASE.area_light("ReferenceFill",(-8,7,5),1050,p["secondary"],5.5,(0,2,0))
    BASE.area_light("ReferenceRim",(2,8,-10),1700,p["ice"],4.5,(0,3,1))
    BASE.point_light("WarmPractical",(0,4,-1),320,(1,.25,.07),1.2)

def camera(category):
    scene=bpy.context.scene
    bpy.ops.object.camera_add(location=(13,7.4,17))
    cam=bpy.context.object; cam.name="ReferenceProductionCamera"
    cam.data.lens=52; cam.data.sensor_width=32; cam.data.dof.use_dof=True; cam.data.dof.aperture_fstop=3.2
    if category=="universe": cam.location=(14,8.8,18.5); target=(0,3.3,1)
    elif category=="galaxy": cam.location=(12,7.6,17); target=(0,3.6,1)
    elif category=="world": cam.location=(12.5,6.8,16.5); target=(0,3.0,.8)
    else: cam.location=(10.2,5.2,12.2); target=(0,2.4,-.2); cam.data.lens=55
    cam.data.dof.focus_distance=(Vector(target)-cam.location).length
    BASE.look_at(cam,target); scene.camera=cam

def metadata(theme,category,p):
    e=bpy.data.objects.new("ALLPHA_V2_13D_REFERENCE_REAL_METADATA",None); bpy.context.collection.objects.link(e)
    vals={"schema":SCHEMA,"phase":"V2.13D-REFERENCE-REAL","themeKey":theme,"category":category,
      "source":"blender-reference-real-production","reference":"ALLPHA_UI_UX_REFERENCE_20261004",
      "presentationOnly":True,"legacy":False,"artQuality":"reference-realistic-production-v2",
      "composition":"foreground-midground-background","materialModel":"procedural-pbr-surface-variation",
      "lightingModel":"cinematic-key-fill-rim-practical","canonicalRenderer":"AllphaWorldRenderer",
      "runtimeAuthority":"outside-blender","humanVisualGate":"required"}
    for k,v in vals.items(): e[k]=v
    e.hide_render=True

def build_one(theme,p,category,preview):
    BASE.clear_scene(); bind_palette(p); BASE.setup_world_and_render(); m=materials(); lights(m)
    ti=sum((i+1)*ord(c) for i,c in enumerate(theme))%25
    if category=="universe": universe(m,p,ti)
    elif category=="galaxy": galaxy(m,ti)
    elif category=="world": city(m,p,ti,False)
    else: city(m,p,ti,True)
    BASE.add_stars(m,360 if category in ("universe","galaxy") else 120)
    metadata(theme,category,p); camera(category)
    out=os.path.join(ROOT,theme); os.makedirs(out,exist_ok=True)
    glb=os.path.join(out,category+".glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=glb,export_format="GLB",export_apply=True,export_animations=True,export_materials="EXPORT",use_selection=False)
    png=None
    if preview:
        png=os.path.join(out,category+".png"); bpy.context.scene.render.filepath=png; bpy.ops.render.render(write_still=True)
    return {"themeKey":theme,"category":category,"glb":glb,"preview":png,"schema":SCHEMA,"presentationOnly":True,"legacy":False,"canonicalRenderer":"AllphaWorldRenderer","artQuality":"reference-realistic-production-v2"}

def main():
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    preview="--preview" in args
    only=args[args.index("--theme")+1] if "--theme" in args else None
    data=json.load(open(MANIFEST,encoding="utf-8"))
    if data.get("themes")!=25 or data.get("categories")!=14 or data.get("matrixSize")!=350: raise SystemExit("V2.13C_FACTORY_MANIFEST_GATE_FAILED")
    profiles={p["key"]:p for p in data["profiles"]}
    selected=[r for r in data["matrix"] if r["category"] in CATEGORIES and (not only or r["themeKey"]==only)]
    expected=4 if only else 100
    if len(selected)!=expected: raise SystemExit("REFERENCE_REAL_EXPECTED_"+str(expected))
    os.makedirs(ROOT,exist_ok=True); rows=[build_one(r["themeKey"],profiles[r["themeKey"]],r["category"],preview) for r in selected]
    json.dump({"schema":SCHEMA,"phase":"V2.13D-REFERENCE-REAL","goldenReference":"crystal-ai-city","themes":25,"categories":4,"matrixSize":100,"generated":len(rows),"previewRequested":preview,"humanVisualGateRequired":True,"assets":rows},open(os.path.join(ROOT,"manifest.json"),"w"),indent=2)
    print(json.dumps({"ok":True,"phase":"V2.13D-REFERENCE-REAL","generated":len(rows),"root":ROOT},indent=2))

if __name__=="__main__": main()
