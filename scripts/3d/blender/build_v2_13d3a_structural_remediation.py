"""Allpha V2.13D.3A — Structural Theme Fidelity Remediation.
Generates only the affected world-scale categories:
Universe, Galaxy, World, District = 25 x 4 = 100 assets.
Previous GREEN evidence is reused and never rebuilt.
"""
from __future__ import annotations
import importlib.util, json, math, os, sys
from pathlib import Path
import bpy

ROOT=Path(os.environ.get("ALLPHA_V213D3A_OUT","allpha-theme-v2-13d3a-remediation")).resolve()
MANIFEST=Path(os.environ.get("ALLPHA_V213C_MANIFEST","allpha-v2-13c-theme-factory-manifest.json")).resolve()
CATEGORIES=["universe","galaxy","world","district"]
SCHEMA="allpha-3d-v2-13d3a-structural-fidelity/1.0"

def load_base():
    p=Path(__file__).resolve().with_name("build_v2_13_production_art.py")
    spec=importlib.util.spec_from_file_location("allpha_v213_base_3a",p)
    if not spec or not spec.loader: raise RuntimeError("BASE_BUILDER_LOAD_FAILED")
    m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
BASE=load_base()

def rgb(h):
    h=h.lstrip("#"); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))

def mat(name, material):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o=bpy.context.object; o.name=name; o.data.materials.append(material); return o

def prism(name, loc, radius, depth, material, vertices=6, rot=0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation=(0,0,rot))
    o=bpy.context.object; o.name=name; o.data.materials.append(material)
    BASE.bevel(o,min(radius*.08,.10),2); return o

def arch(name, loc, radius, material, rot=(1.5708,0,0), major=72):
    return BASE.torus(name,loc,radius,max(.035,radius*.045),material,rot,major)

def platform(name, loc, scale, material, rot=0):
    bpy.ops.mesh.primitive_cube_add(location=loc,scale=scale,rotation=(0,0,rot))
    o=bpy.context.object; o.name=name; o.data.materials.append(material); BASE.bevel(o,min(scale)*.12,2); return o

def dome(name, loc, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=loc)
    o=bpy.context.object; o.name=name; o.scale=(radius,radius*.55,radius); o.data.materials.append(material); return o


def family_seed(theme):
    return sum(ord(c) for c in theme) % 7

def add_bridge(name,a,b,material):
    ax,ay,az=a; bx,by,bz=b
    dx,dy,dz=bx-ax,by-ay,bz-az
    length=math.sqrt(dx*dx+dy*dy+dz*dz)
    bpy.ops.mesh.primitive_cube_add(location=((ax+bx)/2,(ay+by)/2,(az+bz)/2))
    o=bpy.context.object; o.name=name; o.scale=(length*.5,.10,.10); o.data.materials.append(material)
    BASE.bevel(o,.05,2); return o

def world_scale_signature(theme, p, category, m):
    g=p["geometry"].lower(); fam=p["family"].lower(); s=family_seed(theme)
    primary=m["cyan"]; secondary=m["violet"]; ice=m["ice"]; archmat=m["architectural"]; ground=m["ground"] if "ground" in m else m["steel"]
    # Category-specific composition is deliberately different: no shared cylindrical/rail backbone.
    if category=="universe":
        # Macro identity: asymmetrical landmark + orbit bands + suspended districts.
        core_height=4.2 + (s%3)*.7
        prism(f"{theme}_Universe_Core",(0,core_height/2,0),1.15,core_height,ice,8)
        for i in range(3):
            a=(i+s)*2*math.pi/3; r=3.2+i*.65
            arch(f"{theme}_Universe_Orbit_{i}",(0,1.4+i*.7,0),r,primary,(math.pi/2,0,a),96)
            px,pz=math.cos(a)*r,math.sin(a)*r
            platform(f"{theme}_Universe_District_{i}",(px,.45+i*.25,pz),(.65,.12,.65),ground,a)
            add_bridge(f"{theme}_Universe_Bridge_{i}",(px,.6+i*.25,pz),(math.cos(a+.55)*2.0,1.2+i*.3,math.sin(a+.55)*2.0),secondary)
        if "floating" in g or "aether" in g or "archipelago" in g:
            for i in range(4):
                a=i*math.pi/2+.3; prism(f"{theme}_Universe_Float_{i}",(math.cos(a)*4,2.8+(i%2),math.sin(a)*4),.55,.32,ground,7)
        elif "pyramid" in g or "obelisk" in g:
            for x in (-3,0,3): prism(f"{theme}_Universe_Monument_{x}",(x,.9,2.5),.55,1.8+(abs(x)/3)*.7,archmat,4)
        else:
            for i in range(4):
                a=i*math.pi/2; prism(f"{theme}_Universe_Beacon_{i}",(math.cos(a)*4,.9,math.sin(a)*4),.35,1.8,secondary,6)
    elif category=="galaxy":
        # Navigation identity: constellation graph, not concentric rails.
        nodes=[]
        for i in range(7):
            a=(i*1.618+s*.31)
            r=1.4+(i%3)*1.05
            y=1.0+(i%4)*.55
            pos=(math.cos(a)*r,y,math.sin(a)*r); nodes.append(pos)
            prism(f"{theme}_Galaxy_Node_{i}",pos,.28+.05*(i%3),.65,primary if i%2 else ice,8)
        for i in range(6):
            add_bridge(f"{theme}_Galaxy_Link_{i}",nodes[i],nodes[(i+2)%7],secondary)
        arch(f"{theme}_Galaxy_Constellation",(0,2.3,0),2.1,secondary,(0,0,0),64)
        if "orbital" in g or "rings" in g:
            for r in (3.0,3.8): arch(f"{theme}_Galaxy_Outer_{r}",(0,2,0),r,primary,(math.pi/3,0,.2),96)
        else:
            prism(f"{theme}_Galaxy_Beacon",(0,3.6,0),.42,3.0,ice,8)
    elif category=="world":
        # World identity: terrain silhouette + landmark + directional bridges.
        if "cliff" in g or "fjord" in g or "rock" in g:
            for i in range(6):
                x=-3.75+i*1.5; z=2.0+(i%2)*.8
                prism(f"{theme}_World_Terrain_{i}",(x,.9,z),.8,1.8+(i%3)*.7,ground,5,i*.13)
        elif "underwater" in g or "coral" in g or "dome" in g:
            for i in range(6):
                a=i*math.pi/3; pos=(math.cos(a)*3,.65,math.sin(a)*3)
                bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=pos)
                o=bpy.context.object; o.name=f"{theme}_World_Habitat_{i}"; o.scale=(.95,.55,.95); o.data.materials.append(m["glass"])
        elif "megastructure" in g or "tower" in g:
            for i in range(5):
                x=-3+i*1.5; prism(f"{theme}_World_Skyline_{i}",(x,(i%3)*.7+1.2,1.5),.65,2.4+(i%3)*1.5,archmat,8)
        else:
            for i in range(7):
                a=i*2*math.pi/7; prism(f"{theme}_World_Island_{i}",(math.cos(a)*3,.45,math.sin(a)*3),.75,.45,ground,7)
        prism(f"{theme}_World_Landmark",(0,2.5,-.3),1.0,4.5,ice,6)
        for i,a in enumerate((0,math.pi/2,math.pi,math.pi*1.5)):
            add_bridge(f"{theme}_World_Axis_{i}",(math.cos(a)*2.4,.75,math.sin(a)*2.4),(math.cos(a)*.8,1.5,math.sin(a)*.8),secondary)
        arch(f"{theme}_World_Portal",(0,1.9,-3.2),1.25,primary)
    elif category=="district":
        # District identity: street/courtyard/block grammar, never the universe cylinder.
        if "courtyard" in p["district"].lower() or "garden" in g or "village" in p["district"].lower():
            for i in range(5):
                a=i*2*math.pi/5; x,z=math.cos(a)*2.6,math.sin(a)*2.6
                platform(f"{theme}_District_Court_{i}",(x,.25,z),(.8,.12,.8),ground,a)
                prism(f"{theme}_District_House_{i}",(x,.9,z),.45,1.5,archmat,6,a)
        elif "vertical" in p["district"].lower() or "stacked" in p["district"].lower() or "mega" in p["district"].lower():
            for i in range(7):
                x=-3.6+i*1.2; h=1.5+(i%4)*.8
                prism(f"{theme}_District_Block_{i}",(x,h/2,1.3),.48,h,archmat,8)
                add_bridge(f"{theme}_District_Transit_{i}",(x,.9,1.3),(x+.45,1.8,-1.2),primary)
        elif "reef" in p["district"].lower() or "harbor" in p["district"].lower() or "cliff" in p["district"].lower():
            for i in range(6):
                x=-3+i*1.2; z=1.5 if i%2 else -1.2
                prism(f"{theme}_District_Terrain_{i}",(x,.8,z),.6,1.6+(i%3)*.5,ground,5)
        else:
            for i in range(4):
                x=-2.7+i*1.8
                platform(f"{theme}_District_Block_{i}",(x,.3,0),(.7,.12,1.0),ground)
                prism(f"{theme}_District_Tower_{i}",(x,1.5,0),.5,2.8+(i%2),archmat,8)
        arch(f"{theme}_District_Gateway",(0,1.8,-2.8),1.15,secondary)
        for i,x in enumerate((-2.4,0,2.4)):
            prism(f"{theme}_District_Landmark_{i}",(x,.7,2.3),.35,1.4,primary,6)

    # Theme family cues add silhouette without reducing to color-only differentiation.
    if "samurai" in fam or "japanese" in fam:
        for x in (-2.5,2.5): prism(f"{theme}_Family_Tori_{x}",(x,2.1,3),.18,4.2,secondary,4,math.pi/4)
    elif "desert" in fam or "ancient" in fam or "pharaoh" in fam:
        for x in (-2.8,2.8): prism(f"{theme}_Family_Obelisk_{x}",(x,2.2,3),.32,4.4,ice,4)
    elif "organic" in fam or "rainforest" in fam or "living" in fam:
        for x in (-2.6,2.6): arch(f"{theme}_Family_Vine_{x}",(x,2.5,2.5),1.1,primary,(0.9,0.2,0.4),48)
    elif "ocean" in fam or "submerged" in fam:
        for i in range(3): dome(f"{theme}_Family_Dome_{i}",(-2+i*2,1.0,3),.7,m["glass"])
    elif "industrial" in fam or "forge" in fam or "heroic" in fam:
        for i in range(3): prism(f"{theme}_Family_Spine_{i}",(-2+i*2,2.0,3),.22,4.0,archmat,6)
    elif "neon" in fam or "tropical-megacity" in fam:
        for i in range(5): arch(f"{theme}_Family_Transit_{i}",(-2+i,2.8,2.8),.7,primary,(math.pi/2,0,0),48)
    elif "quantum" in fam or "temporal" in fam:
        for i in range(3): arch(f"{theme}_Family_Phase_{i}",(0,1.2+i*.8,2.8),1.2+i*.35,secondary,(0.4,i*.3,0.2),64)


def theme_variant(theme):
    """Stable 0..24 visual variant; used for silhouette/composition, never randomness."""
    return sum((i + 1) * ord(ch) for i, ch in enumerate(theme)) % 25

def add_theme_fidelity_hero(theme, p, category, m):
    """Add a large, theme-specific macro silhouette.
    This is intentionally geometry-first: it changes massing, negative space and focal
    silhouette rather than merely changing palette/materials.
    """
    v=theme_variant(theme)
    fam=p["family"].lower()
    g=p["geometry"].lower()
    primary=m["cyan"]; secondary=m["violet"]; ice=m["ice"]; archmat=m["architectural"]; ground=m["ground"]
    angle=(v % 12) * math.pi / 12
    side=-1 if v % 2 else 1
    width=2.2 + (v % 5) * .42
    height=3.8 + (v % 6) * .55
    offset=-2.6 + (v % 9) * .65

    if category=="universe":
        # Five macro silhouettes: orbital crown, floating archipelago, cathedral,
        # stepped citadel and suspended spine.
        mode=v % 5
        if mode==0:
            for i in range(3):
                arch(f"{theme}_Hero_Orbit_{i}",(0,2.2+i*.65,0),3.1+i*.55,primary,(math.pi/2,angle+i*.18,0),96)
            prism(f"{theme}_Hero_Spire",(offset*.25,3.0,0),.7,height,ice,6,angle)
        elif mode==1:
            for i in range(5):
                a=angle+i*2*math.pi/5
                x,z=math.cos(a)*3.8,math.sin(a)*3.8
                platform(f"{theme}_Hero_Island_{i}",(x,.15+(i%3)*.45,z),(1.05,.18,.72),ground,a)
                prism(f"{theme}_Hero_IslandSpire_{i}",(x,1.0+(i%2)*.55,z),.34,2.0+(i%3)*.6,archmat,5,a)
        elif mode==2:
            prism(f"{theme}_Hero_CathedralBody",(offset*.25,2.3,0),1.5,height,archmat,6,angle)
            for x in (-2.0,0,2.0):
                prism(f"{theme}_Hero_CathedralTower_{x}",(x,2.5,1.2),.42,5.0,ice,6,angle)
            arch(f"{theme}_Hero_CathedralArch",(0,3.2,-1.5),1.7,secondary,(math.pi/2,angle,0),72)
        elif mode==3:
            for i in range(4):
                y=.5+i*.9
                platform(f"{theme}_Hero_Terrace_{i}",(offset*.12,y,0),(width-i*.22,.16,1.8-i*.18),ground,angle)
            prism(f"{theme}_Hero_Citadel",(offset*.18,3.0,.2),1.0,5.2,ice,5,angle)
        else:
            for i in range(4):
                x=offset+side*i*.9
                prism(f"{theme}_Hero_Spine_{i}",(x,2.3,1.5-i*.55),.32,5.0-i*.45,archmat,5,angle+i*.1)
            add_bridge(f"{theme}_Hero_SuspendedBridge",(offset,2.0,-2.0),(offset+side*4,3.2,1.5),secondary)

    elif category=="galaxy":
        # Five navigation silhouettes: constellation web, ring planet, binary system,
        # beacon forest and tilted lattice. These deliberately change negative space.
        mode=(v*3+2) % 5
        if mode==0:
            nodes=[]
            for i in range(9):
                a=angle+i*2*math.pi/9
                r=1.1+(i%4)*.9
                pos=(math.cos(a)*r,1.0+(i%3)*.65,math.sin(a)*r)
                nodes.append(pos)
                prism(f"{theme}_Hero_Node_{i}",pos,.38+(i%2)*.12,.8,ice if i%3 else primary,6,a)
            for i in range(8):
                add_bridge(f"{theme}_Hero_Link_{i}",nodes[i],nodes[i+1],secondary)
        elif mode==1:
            for r in (2.1,3.0,4.0):
                arch(f"{theme}_Hero_Ring_{r}",(0,2.1,0),r,primary,(.75,angle,0),96)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(offset*.18,2.1,0))
            o=bpy.context.object; o.name=f"{theme}_Hero_Planet"; o.scale=(1.5,1.5,1.5); o.data.materials.append(ice)
        elif mode==2:
            for x in (-2.4,2.4):
                bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(x,2.2,0))
                o=bpy.context.object; o.name=f"{theme}_Hero_Binary_{x}"; o.scale=(1.35,1.0,1.35); o.data.materials.append(ice if x<0 else primary)
            arch(f"{theme}_Hero_BinaryOrbit",(0,2.2,0),3.2,secondary,(math.pi/2,angle,0),96)
        elif mode==3:
            for i in range(7):
                x=-3.6+i*1.2
                prism(f"{theme}_Hero_Beacon_{i}",(x,2.5,1.4),.32,3.0+(i%3)*.9,ice if i%2 else archmat,6,angle)
                if i<6: add_bridge(f"{theme}_Hero_BeaconLink_{i}",(x,1.3,1.4),(x+1.2,2.0,1.4),secondary)
        else:
            for i in range(5):
                x=-2.8+i*1.4
                platform(f"{theme}_Hero_Lattice_{i}",(x,2.2,0),(1.0,.12,.12),primary,angle)
                prism(f"{theme}_Hero_LatticePost_{i}",(x,2.2,0),.18,4.2,archmat,4,angle+.2)
            arch(f"{theme}_Hero_LatticeCrown",(0,3.8,0),3.0,secondary,(.45,angle,.25),72)

    elif category=="world":
        # Five habitat silhouettes: mountain, dome habitat, megacity, island chain, monument valley.
        mode=(v*5+1) % 5
        if mode==0 or "cliff" in g or "fjord" in g:
            for i in range(5):
                x=-3.5+i*1.75
                h=2.0+(i%4)*.8
                prism(f"{theme}_Hero_Mountain_{i}",(x,h*.5,1.2),.9,h,ground,5,angle+i*.12)
        elif mode==1 or "underwater" in g or "coral" in g:
            for i in range(4):
                x=-2.7+i*1.8
                dome(f"{theme}_Hero_Habitat_{i}",(x,1.15,1.0),1.25,m["glass"])
                prism(f"{theme}_Hero_HabitatSpire_{i}",(x,2.0,1.0),.24,2.5,ice,6)
            arch(f"{theme}_Hero_HabitatCrown",(0,2.8,1.0),3.4,primary,(math.pi/2,angle,0),96)
        elif mode==2 or "megastructure" in g or "tower" in g:
            for i in range(6):
                x=-3.75+i*1.5
                h=2.2+(i%4)*1.0
                prism(f"{theme}_Hero_Skyline_{i}",(x,h*.5,1.3),.58,h,archmat,8,angle)
                add_bridge(f"{theme}_Hero_Skybridge_{i}",(x,h,1.3),(x+.75,h+.35,-1.1),primary)
        elif mode==3:
            for i in range(7):
                a=angle+i*2*math.pi/7
                x,z=math.cos(a)*3.2,math.sin(a)*3.2
                platform(f"{theme}_Hero_Island_{i}",(x,.25,z),(.8,.16,.55),ground,a)
            prism(f"{theme}_Hero_Anchor",(0,2.6,0),1.15,4.8,ice,6,angle)
        else:
            for x in (-2.8,0,2.8):
                prism(f"{theme}_Hero_Monument_{x}",(x,2.4,1.2),.55,4.8,archmat,4,angle)
            arch(f"{theme}_Hero_ValleyGate",(0,2.4,-1.8),2.0,secondary,(math.pi/2,angle,0),72)

    else:  # district
        # Five settlement silhouettes: courtyard, street canyon, harbor, vertical stack, plaza.
        mode=(v*7+3) % 5
        if mode==0 or "courtyard" in p["district"].lower() or "garden" in g:
            platform(f"{theme}_Hero_Courtyard",(0,.12,0),(3.8,.12,2.8),ground,angle)
            for x,z in ((-2.5,-1.7),(2.5,-1.7),(-2.5,1.7),(2.5,1.7)):
                prism(f"{theme}_Hero_CourtyardHouse_{x}_{z}",(x,1.25,z),.58,2.5,archmat,6,angle)
            arch(f"{theme}_Hero_CourtyardGate",(0,2.2,-2.6),1.4,secondary,(math.pi/2,angle,0),72)
        elif mode==1:
            for i in range(6):
                x=-3.6+i*1.2
                prism(f"{theme}_Hero_StreetBlock_{i}",(x,1.5,0),.55,3.0+(i%3)*.65,archmat,8,angle)
                add_bridge(f"{theme}_Hero_StreetSpan_{i}",(x,1.4,1.5),(x+.5,1.8,-1.6),primary)
        elif mode==2 or "harbor" in p["district"].lower() or "reef" in p["district"].lower():
            for i in range(5):
                x=-3.2+i*1.6
                platform(f"{theme}_Hero_HarborPier_{i}",(x,.3,-.8),(.65,.14,2.2),ground,angle)
                prism(f"{theme}_Hero_HarborTower_{i}",(x,1.7,1.0),.38,3.2,ice,6,angle)
            arch(f"{theme}_Hero_HarborGate",(0,2.7,2.4),2.0,primary,(math.pi/2,angle,0),72)
        elif mode==3:
            for i in range(7):
                x=-3.6+i*1.2
                h=1.6+(i%5)*.75
                prism(f"{theme}_Hero_Vertical_{i}",(x,h*.5,1.0),.48,h,archmat,8,angle)
                if i<6: add_bridge(f"{theme}_Hero_Transit_{i}",(x,h,1.0),(x+1.2,h+.45,-1.2),primary)
        else:
            platform(f"{theme}_Hero_Plaza",(0,.15,0),(3.6,.15,2.6),ground,angle)
            for i,a in enumerate((0,math.pi/2,math.pi,math.pi*1.5)):
                x,z=math.cos(a)*2.5,math.sin(a)*2.0
                prism(f"{theme}_Hero_PlazaTower_{i}",(x,1.8,z),.6,3.6+(i%2)*1.2,archmat,6,angle+a)
            arch(f"{theme}_Hero_PlazaCrown",(0,3.4,0),2.6,secondary,(math.pi/2,angle,0),72)

    # Family-specific landmark is pushed into the upper/background silhouette so it
    # remains visible in portrait previews without becoming a palette-only cue.
    if "japanese" in fam or "samurai" in fam:
        for x in (-3.0,3.0):
            prism(f"{theme}_Family_Gate_{x}",(x,2.8,3.8),.22,5.2,secondary,4,angle)
    elif "desert" in fam or "ancient" in fam or "pharaoh" in fam:
        for x in (-3.2,3.2):
            bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.95,radius2=.12,depth=5.5,location=(x,2.75,3.2),rotation=(0,0,angle))
            o=bpy.context.object; o.name=f"{theme}_Family_Pyramid_{x}"; o.data.materials.append(ice)
    elif "rainforest" in fam or "organic" in fam or "living" in fam:
        for x in (-3.0,3.0):
            dome(f"{theme}_Family_Canopy_{x}",(x,3.0,3.2),1.35,ground)
    elif "ocean" in fam or "submerged" in fam:
        for x in (-2.8,0,2.8):
            dome(f"{theme}_Family_OceanDome_{x}",(x,2.5,3.5),1.0,m["glass"])
    elif "industrial" in fam or "forge" in fam or "heroic" in fam:
        for x in (-3.0,0,3.0):
            prism(f"{theme}_Family_ForgeSpine_{x}",(x,2.8,3.5),.28,5.4,archmat,6,angle)
    elif "neon" in fam or "tropical-megacity" in fam:
        for i in range(4):
            arch(f"{theme}_Family_NeonArc_{i}",(-2.7+i*1.8,3.0,3.6),.85,primary,(math.pi/2,angle+i*.2,0),64)
    elif "quantum" in fam or "temporal" in fam:
        for i in range(3):
            arch(f"{theme}_Family_QuantumFrame_{i}",(0,1.8+i*.85,3.4),1.4+i*.35,secondary,(.35,angle+i*.18,.25),72)

def apply_theme_camera(theme, category):
    """Theme-specific framing is part of the visual identity contract."""
    v=theme_variant(theme)
    phase=(v % 12) * math.pi / 12
    base=(11.8,7.4,15.8)
    camera=bpy.context.scene.camera
    if camera is None:
        BASE.configure_camera(category)
        camera=bpy.context.scene.camera
    radius=math.sqrt(base[0]**2+base[2]**2)
    camera.location=(
        base[0] + math.sin(phase)*2.8,
        base[1] + ((v%5)-2)*.35,
        base[2] + math.cos(phase)*2.8,
    )
    camera.data.lens=47 + (v%6)*2
    camera.data.dof.focus_distance=18.0 + (v%5)*.7
    target=(0,3.0+((v%4)-1.5)*.25,.2+((v%3)-1)*.35)
    BASE.look_at(camera,target)
    bpy.context.scene.camera=camera

def metadata(p,r,c):
    o=bpy.data.objects.new("ALLPHA_V2_13D3A_STRUCTURAL_REMEDIATION_METADATA",None); bpy.context.collection.objects.link(o)
    vals={"schema":SCHEMA,"phase":"V2.13D.3A","themeKey":p["key"],"family":p["family"],"category":c,
          "goldenReference":"crystal-ai-city","presentationOnly":True,"legacy":False,
          "artQuality":"structural-theme-fidelity-remediation-v2","canonicalRenderer":"AllphaWorldRenderer",
          "runtimeAuthority":"outside-blender","remediationScope":"world-scale-only",
          "replacesPriorEvidence":"false","sourceEvidenceLocked":"V2.13D.1A-R3+V2.13D.2","structuralSignatureVersion":"2.0","themeVariant":theme_variant(p["key"])}
    for k,v in vals.items(): o[k]=v
    o.hide_render=True

def main():
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    preview="--preview" in args
    theme=args[args.index("--theme")+1] if "--theme" in args else None
    data=json.loads(MANIFEST.read_text())
    if data.get("themes")!=25 or data.get("categories")!=14 or data.get("matrixSize")!=350 or data.get("goldenTheme")!="crystal-ai-city":
        raise SystemExit("V2.13C_FACTORY_MANIFEST_GATE_FAILED")
    profiles={p["key"]:p for p in data["profiles"]}
    selected=[r for r in data["matrix"] if r["category"] in CATEGORIES and (not theme or r["themeKey"]==theme)]
    expected=4 if theme else 100
    if len(selected)!=expected: raise SystemExit(f"V2.13D3A_EXPECTED_{expected}_RECIPES")
    ROOT.mkdir(parents=True,exist_ok=True); rows=[]
    for r in selected:
        p=profiles[r["themeKey"]]; BASE.clear_scene()
        a,b,c=map(rgb,p["accent"])
        BASE.PALETTE.update({"primary":(*a,1),"secondary":(*b,1),"cyan":(*a,1),"violet":(*b,1),"ice":(*c,1),
          "steel":tuple(.045+x*.10 for x in a)+(1.0,),"glass":tuple(.02+x*.18 for x in b)+(1,),"midnight":(.004,.007,.018,1),"skin":(.58,.34,.27,1),"warm":(*a,1)})
        BASE.setup_world_and_render(); mats=BASE.build_materials(); BASE.add_lighting(mats); BASE.build_category(mats,r["category"])
        world_scale_signature(p["key"],p,r["category"],mats)
        add_theme_fidelity_hero(p["key"],p,r["category"],mats)
        BASE.add_stars(mats,220 if r["category"] in {"universe","galaxy","world"} else 100)
        metadata(p,r,r["category"]); BASE.configure_camera(r["category"]); apply_theme_camera(p["key"],r["category"])
        out=ROOT/p["key"]; out.mkdir(parents=True,exist_ok=True); glb=out/f'{r["category"]}.glb'
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.export_scene.gltf(filepath=str(glb),export_format="GLB",export_apply=True,export_animations=True,export_materials="EXPORT",use_selection=False)
        png=None
        if preview:
            png=out/f'{r["category"]}.png'; bpy.context.scene.render.filepath=str(png); bpy.ops.render.render(write_still=True)
        rows.append({"themeKey":p["key"],"category":r["category"],"glb":str(glb),"preview":str(png) if png else None,"schema":SCHEMA,"presentationOnly":True,"canonicalRenderer":"AllphaWorldRenderer","remediation":"world-scale-structural"})
    manifest_payload={"schema":SCHEMA,"phase":"V2.13D.3A","goldenReference":"crystal-ai-city","themes":25,"categories":4,"matrixSize":100,"generated":len(rows),"previewRequested":preview,"sourceLockedEvidence":["V2.13D.1A-R3","V2.13D.2"],"assets":rows}
    manifest_path=ROOT/"manifest.json"
    manifest_path.write_text(json.dumps(manifest_payload,indent=2)+"\n",encoding="utf-8")
    if not manifest_path.is_file(): raise RuntimeError("V2.13D3A_OUTPUT_MANIFEST_WRITE_FAILED")
    print(json.dumps({"ok":True,"phase":"V2.13D.3A","themes":25,"categories":4,"generated":len(rows),"root":str(ROOT),"manifest":str(manifest_path)},indent=2))
if __name__=="__main__": main()
