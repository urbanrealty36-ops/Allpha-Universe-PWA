"""Allpha V2.13D Reference Real Production Art Builder.

This replaces the rejected primitive D3C visual grammar with reference-led,
architectural production scenes. Blender is the art-authoring layer only.
Runtime authority remains AllphaWorldRenderer.

Scope: 25 themes x Universe/Galaxy/World/District = 100 macro assets.\nAuthoritative asset generation: V2.13D Reference Real only; legacy V2.13/V2.13B production builders are not runtime sources.
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
      "wood":mat("REF_Wood",(.20,.065,.028,1),.05,.34),
      "fabric":mat("REF_Fabric",(.045,.055,.075,1),0,.72),
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
            cube("FacadeLightBand",(x,h*level,z-d/2-.035),(w*.40,.018,.028),m["light"],.008,rot)
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
        for x in (-5,-2,1,4): sph("WaterPod",(x,1.1,5.1),(.75,.7,.75),m["glass"])
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
    # Civic landmark: architectural tower with stepped podium, glazing and vertical fins.
    cube("CivicPodium",(0,.35,.9),(2.15,.28,1.25),m["metal"],.18)
    for i in range(4):
        y=.95+i*1.45
        width=1.72-i*.18
        depth=1.05-i*.10
        cube("CivicLevel",(0,y,.9),(width,.55,depth),m["glass"],.12)
        cube("CivicFrontLight",(0,y,.9-depth-.035),(width*.72,.035,.026),m["light"],.008)
    cyl("CivicCore",(0,4.25,.9),.54,7.3,m["glass"],64,.05)
    for x in (-.72,.72):
        cube("CivicVerticalFin",(x,4.15,.15),(.075,3.55,.10),m["ice"],.02)
    cube("CivicCrown",(0,8.05,.9),(1.18,.18,.78),m["metal"],.12)
    cube("CivicCrownLight",(0,8.22,.9),(.82,.025,.52),m["light"],.01)
    # Pedestrian scale.
    for x,z in [(-6,-2.3),(-4,-2.2),(4,-2.2),(6,-2.3),(0,-1.9)]:
        streetlight(m,x,z,2.6)
    for x,z in [(-6.8,-1.7),(-5.5,1.7),(5.8,1.4),(6.7,3.8)]: tree(m,x,z,.9)
    if district:
        for x in (-2.2,2.2):
            cube("DistrictGateway",(x,1.8,-.6),(.18,1.8,.18),m["accent"],.03)
            cube("DistrictGatewayLight",(x,1.85,-.80),(.035,1.35,.025),m["light"],.01)
        cube("DistrictGatewayHeader",(0,3.55,-.6),(2.38,.18,.18),m["accent"],.06)
        cube("DistrictGatewayHeaderLight",(0,3.56,-.80),(1.85,.025,.025),m["light"],.01)

def planet(m,theme_i):
    sph("Planet",(0,3.5,1.2),(2.55,2.55,2.55),m["ground"])
    # layered continents as sculptural terrain masses, not flat UI primitives.
    for i in range(8):
        a=i*math.tau/8
        x=math.cos(a)*1.8; z=1.2+math.sin(a)*1.35
        sph("Continent",(x,3.65,z),(.75,.18,.52),m["green"])
    sph("AtmosphereShell",(0,3.5,1.2),(2.74,2.74,2.74),m["glass"])
    for i in range(18):
        a=i*math.tau/18
        sph("AtmosphericCloud",(math.cos(a)*2.5,3.5+math.sin(a*2)*.22,1.2+math.sin(a)*2.0),
            (.10,.035,.28),m["ice"])

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
    # Dust is represented as irregular spiral clusters, not decorative rings.
    random.seed(8100 + theme_i)
    for arm in range(3):
        for i in range(34):
            t=i/33
            r=1.2+4.9*t
            a=arm*math.tau/3 + t*math.tau*1.35 + random.uniform(-.05,.05)
            x=math.cos(a)*r
            z=1.0+math.sin(a)*r*.62
            y=3.8+random.uniform(-.18,.18)
            sph("GalaxyDust",(x,y,z),(.055+.045*(1-t),.018,.055+.045*(1-t)),m["accent"])

def universe(m,p,theme_i):
    galaxy(m,theme_i); planet(m,theme_i)
    city(m,p,theme_i,False)
    for pos,scale in [((-6,6,7),.55),((6,7,8),.75),((7,3,1),.45)]:
        sph("DistantWorld",pos,(scale,scale,scale),m["glass"])
        for j in range(6):
            a=j*math.tau/6
            sph("DistantOrbitMarker",
                (pos[0]+math.cos(a)*scale*1.55,pos[1]+math.sin(a)*.12,pos[2]+math.sin(a)*scale*1.55),
                (.025,.025,.025),m["light"])


def seat(m, x, z, rot=0):
    # Believable upholstered lounge chair, built from rounded primitives and scaled to human proportion.
    cube("SeatBase",(x,.38,z),(.42,.16,.42),m["dark"],.12,rot)
    cube("SeatCushion",(x,.62,z),(.39,.10,.36),m["skin"],.09,rot)
    cube("SeatBack",(x,.98,z+.30),(.39,.38,.10),m["skin"],.09,rot)

def human_figure(m, x, z, scale=1.0, rot=0, ai=False):
    # Presentation-scale human/AI figure for reference-led environments.
    body_mat = m["ice"] if ai else m["skin"]
    suit_mat = m["dark"] if not ai else m["metal"]
    cyl("FigureLegL",(x-.13*scale,.55*scale,z),.085*scale,.85*scale,suit_mat,24,.025)
    cyl("FigureLegR",(x+.13*scale,.55*scale,z),.085*scale,.85*scale,suit_mat,24,.025)
    sph("FigureTorso",(x,1.20*scale,z),(.30*scale,.48*scale,.20*scale),suit_mat)
    sph("FigureShoulders",(x,1.43*scale,z),(.40*scale,.14*scale,.23*scale),suit_mat)
    cyl("FigureNeck",(x,1.57*scale,z),.075*scale,.16*scale,body_mat,20,.018)
    sph("FigureHead",(x,1.86*scale,z),(.22*scale,.25*scale,.22*scale),body_mat)
    if ai:
        cube("AIEyeBand",(x,1.87*scale,z-.215*scale),(.13*scale,.025*scale,.012*scale),m["light"],.01)
        cube("AIJawAccent",(x,1.72*scale,z-.19*scale),(.12*scale,.025*scale,.035*scale),m["ice"],.01)
    else:
        sph("FigureHair",(x,2.06*scale,z),(.23*scale,.08*scale,.22*scale),m["dark"])
    for side in (-1,1):
        cyl("FigureArm",(x+side*.38*scale,1.23*scale,z),.065*scale,.72*scale,suit_mat,20,.02)
        sph("FigureHand",(x+side*.38*scale,.86*scale,z),(.075*scale,.09*scale,.075*scale),body_mat)
        cube("FigureShoe",(x+side*.13*scale,.12*scale,z-.08*scale),(.16*scale,.08*scale,.26*scale),m["dark"],.04)
    o=bpy.context.object
    o.rotation_euler[2]=rot

def display_screen(m, x, y, z, w, h, rot=0):
    cube("MediaScreen",(x,y,z),(w/2,h/2,.035),m["dark"],.035,rot)
    cube("MediaScreenGlow",(x,y,z+.045),(w*.44,h*.40,.012),m["light"],.015,rot)

def studio_set(m, variant=0):
    # Reference-led AI media/live studio: floor, wall panels, practical shelves,
    # cameras, stage desk, display wall and presenter/owned-agent presence.
    cube("StudioFloor",(0,.0,1.0),(7.6,.08,5.7),m["wood"],.14)
    cube("StudioBackWall",(0,3.2,-5.0),(7.6,3.2,.18),m["dark"],.12)
    cube("StudioSideWallL",(-7.45,3.0,1.0),(.16,3.0,5.7),m["metal"],.10)
    cube("StudioSideWallR",(7.45,3.0,1.0),(.16,3.0,5.7),m["metal"],.10)
    for x in (-6.0,-3.0,0,3.0,6.0):
        cube("CeilingBeam",(x,6.1,1.0),(1.15,.10,5.3),m["metal"],.04)
    for z in (-3.8,-1.2,1.4,4.0):
        cube("FloorInlay",(0,.10,z),(6.7,.018,.025),m["warm"],.006)
    for x in (-6.3,-4.2,4.2,6.3):
        cube("WallPanel",(x,3.2,-4.72),(1.55,2.7,.05),m["metal"],.06)
    for x in (-5.8,-3.9,3.9,5.8):
        display_screen(m,x,3.45,-4.62,1.55,1.05)
    # Warm shelf bands create the practical-lighting language of the reference.
    for y in (1.35,2.2,3.05):
        cube("Shelf",(0,y,-4.72),(6.6,.035,.34),m["warm"],.025)
    for x in (-5.8,-4.7,-3.6,3.6,4.7,5.8):
        cyl("ShelfPlantStem",(x,1.55,-4.42),.025,.36,m["green"],12,.01)
        sph("ShelfPlant",(x,1.78,-4.42),(.18,.22,.18),m["green"])
    # Large hero display.
    display_screen(m,0,3.0,-4.48,4.8,2.45)
    for x in (-2.7,-1.8,1.8,2.7):
        cube("AcousticPanel",(x,2.8,-4.48),(.34,1.65,.06),m["fabric"],.035)
    # Presentation desk / stage.
    cube("StageDeck",(0,.24,2.0),(3.7,.16,1.65),m["metal"],.16)
    cube("StageLightFront",(0,.47,.38),(3.0,.035,.04),m["light"],.012)
    cube("StageLightLeft",(-3.05,.47,2.0),(.04,.035,1.25),m["light"],.012)
    cube("StageLightRight",(3.05,.47,2.0),(.04,.035,1.25),m["light"],.012)
    cube("StageStepFront",(0,.14,.25),(3.2,.10,.42),m["dark"],.10)
    cube("PresentationDesk",(0,1.15,1.35),(1.65,.12,.62),m["glass"],.08)
    display_screen(m,0,1.45,1.0,2.55,1.05)
    human_figure(m,-1.25,.85,1.0,ai=False)
    human_figure(m,1.25,.85,1.0,ai=True)
    # Audience / lounge furniture.
    for x,z in [(-4.7,-1.7),(-2.2,-1.9),(2.2,-1.9),(4.7,-1.7)]:
        seat(m,x,z,0)
    # Studio camera rigs.
    for x,z in (-5.8,-1.4),(5.8,-1.4):
        cube("CameraTripodBase",(x,.28,z),(.28,.10,.28),m["dark"],.08)
        cyl("CameraColumn",(x,1.18,z),.055,1.75,m["metal"],20,.018)
        cube("BroadcastCamera",(x,2.05,z),(.34,.22,.28),m["dark"],.07)
        display_screen(m,x,2.12,z-.31,.22,.12)
    # Overhead softboxes.
    for x in (-4.8,-1.6,1.6,4.8):
        cube("Softbox",(x,6.3,1.4),(1.05,.10,.55),m["ice"],.08)
        cyl("SoftboxRig",(x,6.0,1.4),.025,.55,m["metal"],12,.008)

def reference_environment(m, category, theme_i, p):
    if category == "district":
        studio_set(m, theme_i)
    elif category == "world":
        # World remains a city-scale environment but gains a recognizable media campus.
        city(m, p, theme_i, False)
        studio_set(m, theme_i)
    else:
        return

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
    else: cam.location=(10.2,6.0,13.8); target=(0,2.7,.1); cam.data.lens=42
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
    elif category=="world":
        city(m,p,ti,False)
        reference_environment(m,category,ti,p)
    else:
        city(m,p,ti,True)
        reference_environment(m,category,ti,p)
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
