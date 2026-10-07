"""Allpha V2.13D.3C — Cinematic Visual Fidelity Remediation.

Isolated remediation for the 100 world-scale assets rejected by D3B.
The legacy V2.13A macro build_category() is intentionally NOT invoked because
the common city grammar was the dominant human-review failure.

Scope: 25 themes x 4 categories = 100 assets.
No Storage/Supabase mutation. Runtime authority remains AllphaWorldRenderer.
"""
from __future__ import annotations

import importlib.util
import json
import math
import os
import sys
from pathlib import Path

import bpy

ROOT = Path(os.environ.get("ALLPHA_V213D3C_OUT", "allpha-theme-v2-13d3c-visual-remediation")).resolve()
MANIFEST = Path(os.environ.get("ALLPHA_V213C_MANIFEST", "allpha-v2-13c-theme-factory-manifest.json")).resolve()
CATEGORIES = ["universe", "galaxy", "world", "district"]
SCHEMA = "allpha-3d-v2-13d3c-cinematic-visual-fidelity/1.0"

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "allpha_v213_base_for_3c",
    HERE / "build_v2_13_production_art.py",
)
if not spec or not spec.loader:
    raise RuntimeError("D3C_BASE_BUILDER_LOAD_FAILED")
BASE = importlib.util.module_from_spec(spec)
spec.loader.exec_module(BASE)

def theme_variant(theme):
    return sum((i + 1) * ord(ch) for i, ch in enumerate(theme)) % 25

def platform(name, loc, scale, material, rot=0):
    bpy.ops.mesh.primitive_cube_add(location=loc, scale=scale, rotation=(0, 0, rot))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    BASE.bevel(o, min(scale) * .12, 2)
    return o

def prism(name, loc, radius, height, material, vertices=6, rot=0):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=height,
        location=loc, rotation=(0, 0, rot)
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    BASE.bevel(o, min(radius * .08, .10), 2)
    return o

def arch(name, loc, radius, material, rot=(math.pi / 2, 0, 0), major=72):
    return BASE.torus(name, loc, radius, max(.035, radius * .045), material, rot, major)

def dome(name, loc, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (radius, radius * .55, radius)
    o.data.materials.append(material)
    return o

def add_bridge(name, a, b, material):
    ax, ay, az = a
    bx, by, bz = b
    dx, dy, dz = bx - ax, by - ay, bz - az
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    bpy.ops.mesh.primitive_cube_add(
        location=((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2)
    )
    o = bpy.context.object
    o.name = name
    o.scale = (length * .5, .10, .10)
    o.data.materials.append(material)
    BASE.bevel(o, .05, 2)
    return o

def metadata(p, category):
    o = bpy.data.objects.new("ALLPHA_V2_13D3C_CINEMATIC_REMEDIATION_METADATA", None)
    bpy.context.collection.objects.link(o)
    values = {
        "schema": SCHEMA,
        "phase": "V2.13D.3C",
        "themeKey": p["key"],
        "family": p["family"],
        "category": category,
        "goldenReference": "crystal-ai-city",
        "presentationOnly": True,
        "legacy": False,
        "artQuality": "cinematic-visual-fidelity-remediation-v1",
        "canonicalRenderer": "AllphaWorldRenderer",
        "runtimeAuthority": "outside-blender",
        "remediationScope": "world-scale-only",
        "commonCityGrammarRemoved": True,
        "structuralSignatureVersion": "3.0",
        "themeVariant": theme_variant(p["key"]),
        "sourceHumanGate": "V2.13D.3B-REJECTED",
    }
    for k, v in values.items():
        o[k] = v
    o.hide_render = True

def add_cinematic_macro_hero(theme, p, category, m):
    v = theme_variant(theme)
    phase = (v % 12) * math.pi / 12
    primary, secondary = m["cyan"], m["violet"]
    ice, ground, archmat = m["ice"], m["ground"], m["architectural"]
    fam = p["family"].lower()

    if category == "universe":
        mode = v % 5
        if mode == 0:
            for r in (2.8, 3.8, 4.8):
                arch(f"{theme}_D3C_HeroOrbit_{r}", (0, 3.0, .2), r, primary,
                     (1.0, phase + r * .03, .08), 112)
            prism(f"{theme}_D3C_HeroCore", (0, 3.0, .2), .72, 5.4, ice, 8, phase)
        elif mode == 1:
            for i in range(5):
                a = phase + i * math.tau / 5
                x, z = math.cos(a) * 3.8, math.sin(a) * 3.8
                platform(f"{theme}_D3C_HeroIsland_{i}", (x, .25 + (i % 2) * .35, z),
                         (1.0, .16, .7), ground, a)
                prism(f"{theme}_D3C_HeroIslandSpire_{i}", (x, 1.1, z), .32,
                      2.0 + (i % 3) * .5, archmat, 5, a)
        elif mode == 2:
            prism(f"{theme}_D3C_HeroCathedral", (0, 2.7, 0), 1.35, 5.2, archmat, 6, phase)
            for x in (-1.8, 1.8):
                prism(f"{theme}_D3C_HeroTower_{x}", (x, 2.6, 1.0), .4, 4.8, ice, 6, phase)
            arch(f"{theme}_D3C_HeroGate", (0, 3.0, -1.5), 1.6, secondary,
                 (math.pi / 2, phase, 0), 72)
        elif mode == 3:
            for i in range(4):
                platform(f"{theme}_D3C_HeroTerrace_{i}", (0, .55 + i * .75, 0),
                         (2.8 - i * .25, .14, 1.8 - i * .12), ground, phase)
            prism(f"{theme}_D3C_HeroCitadel", (0, 2.8, .2), 1.0, 5.0, ice, 5, phase)
        else:
            for i in range(4):
                x = -1.8 + i * 1.2
                prism(f"{theme}_D3C_HeroSpine_{i}", (x, 2.5, 1.0 - i * .45),
                      .3, 4.8 - i * .4, archmat, 5, phase + i * .1)
            add_bridge(f"{theme}_D3C_HeroSuspendedBridge", (-1.8, 2.1, -1.8),
                       (2.5, 3.3, 1.0), secondary)

    elif category == "galaxy":
        mode = (v * 3 + 2) % 5
        if mode == 0:
            nodes = []
            for i in range(8):
                a = phase + i * math.tau / 8
                r = 1.2 + (i % 4) * .8
                pos = (math.cos(a) * r, 1.0 + (i % 3) * .7, math.sin(a) * r)
                nodes.append(pos)
                prism(f"{theme}_D3C_HeroNode_{i}", pos, .3, .8,
                      ice if i % 3 else primary, 7, a)
            for i in range(7):
                add_bridge(f"{theme}_D3C_HeroLink_{i}", nodes[i], nodes[i + 1], secondary)
        elif mode == 1:
            for r in (2.0, 3.0, 4.0):
                arch(f"{theme}_D3C_HeroRing_{r}", (0, 2.2, 0), r, primary,
                     (.75, phase, 0), 96)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(0, 2.2, 0))
            o = bpy.context.object
            o.name = f"{theme}_D3C_HeroPlanet"
            o.scale = (1.4, 1.4, 1.4)
            o.data.materials.append(ice)
        elif mode == 2:
            for x in (-2.3, 2.3):
                bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=(x, 2.2, 0))
                o = bpy.context.object
                o.name = f"{theme}_D3C_HeroBinary_{x}"
                o.scale = (1.25, 1.0, 1.25)
                o.data.materials.append(ice if x < 0 else primary)
            arch(f"{theme}_D3C_HeroBinaryOrbit", (0, 2.2, 0), 3.0, secondary,
                 (math.pi / 2, phase, 0), 96)
        elif mode == 3:
            for i in range(7):
                x = -3.6 + i * 1.2
                prism(f"{theme}_D3C_HeroBeacon_{i}", (x, 2.4, 1.2), .3,
                      2.8 + (i % 3) * .8, ice if i % 2 else archmat, 6, phase)
        else:
            for i in range(5):
                x = -2.8 + i * 1.4
                platform(f"{theme}_D3C_HeroLattice_{i}", (x, 2.1, 0),
                         (1.0, .12, .12), primary, phase)
                prism(f"{theme}_D3C_HeroLatticePost_{i}", (x, 2.1, 0),
                      .18, 4.0, archmat, 4, phase + .2)
            arch(f"{theme}_D3C_HeroLatticeCrown", (0, 3.8, 0), 3.0, secondary,
                 (.45, phase, .25), 72)

    elif category == "world":
        mode = (v * 5 + 1) % 5
        if mode == 0:
            for i in range(5):
                x = -3.5 + i * 1.75
                h = 2.0 + (i % 4) * .7
                prism(f"{theme}_D3C_HeroMountain_{i}", (x, h / 2, 1.1), .9, h, ground, 5, phase + i * .12)
        elif mode == 1 or any(k in fam for k in ("ocean", "submerged")):
            for i in range(4):
                x = -2.7 + i * 1.8
                dome(f"{theme}_D3C_HeroHabitat_{i}", (x, 1.1, 1.0), 1.2, m["glass"])
                prism(f"{theme}_D3C_HeroHabitatSpire_{i}", (x, 2.0, 1.0), .22, 2.4, ice, 6)
        elif mode == 2:
            for i in range(6):
                x = -3.75 + i * 1.5
                h = 2.2 + (i % 4) * .9
                prism(f"{theme}_D3C_HeroSkyline_{i}", (x, h / 2, 1.2), .55, h, archmat, 8, phase)
        elif mode == 3:
            for i in range(7):
                a = phase + i * math.tau / 7
                x, z = math.cos(a) * 3.2, math.sin(a) * 3.0
                platform(f"{theme}_D3C_HeroIsland_{i}", (x, .25, z), (.8, .15, .55), ground, a)
            prism(f"{theme}_D3C_HeroAnchor", (0, 2.6, 0), 1.1, 4.7, ice, 6, phase)
        else:
            for x in (-2.8, 0, 2.8):
                prism(f"{theme}_D3C_HeroMonument_{x}", (x, 2.4, 1.2), .55, 4.7, archmat, 4, phase)
            arch(f"{theme}_D3C_HeroValleyGate", (0, 2.4, -1.8), 2.0, secondary,
                 (math.pi / 2, phase, 0), 72)

    else:
        mode = (v * 7 + 3) % 5
        if mode == 0:
            platform(f"{theme}_D3C_HeroCourtyard", (0, .12, 0), (3.7, .12, 2.7), ground, phase)
            for x, z in ((-2.5, -1.7), (2.5, -1.7), (-2.5, 1.7), (2.5, 1.7)):
                prism(f"{theme}_D3C_HeroHouse_{x}_{z}", (x, 1.25, z), .55, 2.5, archmat, 6, phase)
        elif mode == 1:
            for i in range(6):
                x = -3.6 + i * 1.2
                prism(f"{theme}_D3C_HeroStreet_{i}", (x, 1.5, 0), .52,
                      3.0 + (i % 3) * .6, archmat, 8, phase)
        elif mode == 2:
            for i in range(5):
                x = -3.2 + i * 1.6
                platform(f"{theme}_D3C_HeroPier_{i}", (x, .28, -.8), (.62, .14, 2.0), ground, phase)
                prism(f"{theme}_D3C_HeroHarborTower_{i}", (x, 1.7, 1.0), .35, 3.2, ice, 6, phase)
        elif mode == 3:
            for i in range(7):
                x = -3.6 + i * 1.2
                h = 1.6 + (i % 5) * .7
                prism(f"{theme}_D3C_HeroVertical_{i}", (x, h / 2, 1.0), .46, h, archmat, 8, phase)
        else:
            platform(f"{theme}_D3C_HeroPlaza", (0, .15, 0), (3.6, .15, 2.6), ground, phase)
            for i, a in enumerate((0, math.pi / 2, math.pi, math.pi * 1.5)):
                x, z = math.cos(a) * 2.5, math.sin(a) * 2.0
                prism(f"{theme}_D3C_HeroPlazaTower_{i}", (x, 1.8, z), .58, 3.6 + (i % 2) * 1.0, archmat, 6, phase)



def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def variant(theme):
    return theme_variant(theme)


def add_slab(name, loc, scale, material, bevel=.12, rot=0):
    return platform(name, loc, scale, material, rot)


def add_pylon(name, loc, height, material, radius=.18, rot=0):
    return prism(name, loc, radius, height, material, vertices=6, rot=rot)


def add_backdrop(theme, p, category, m):
    """Sparse, category-specific horizon. Never reconstructs the shared Crystal city."""
    v = variant(theme)
    fam = p["family"].lower()
    primary = m["cyan"]
    secondary = m["violet"]
    ice = m["ice"]
    archmat = m["architectural"]
    ground = m["ground"]
    rot = (v % 8) * math.pi / 16

    # Low asymmetric floor: the hero silhouette owns the portrait frame.
    add_slab(f"{theme}_{category}_Floor", (0, -0.18, 0), (6.4, .16, 5.1), ground, .16, rot)

    if category == "universe":
        for x, z, h in [(-5.2, 3.8, 5.2), (4.8, 4.2, 6.0)]:
            add_pylon(f"{theme}_Universe_HorizonPylon_{x}", (x, h / 2, z), h, archmat, .26, rot)
        arch(f"{theme}_Universe_HorizonArc", (0, 4.8, 4.5), 4.8, secondary, (.9, rot, .12), 96)
    elif category == "galaxy":
        for x, h in [(-4.8, 3.2), (4.5, 4.6)]:
            add_pylon(f"{theme}_Galaxy_BeaconFrame_{x}", (x, h / 2, 3.5), h, ice, .16, rot)
        arch(f"{theme}_Galaxy_HorizonFrame", (0, 3.7, 4.0), 4.4, primary, (.42, rot, .22), 96)
    elif category == "world":
        if any(k in fam for k in ("desert", "ancient", "pharaoh")):
            for i, x in enumerate((-5.0, -3.1, 3.2, 5.1)):
                add_pylon(
                    f"{theme}_World_DunePillar_{i}",
                    (x, 1.3 + (i % 2) * .7, 4.0),
                    2.6 + (i % 2) * 1.4,
                    ground,
                    .55,
                    rot + i * .12,
                )
        elif any(k in fam for k in ("ocean", "submerged")):
            for i, x in enumerate((-4.5, -1.5, 1.5, 4.5)):
                dome(f"{theme}_World_HorizonDome_{i}", (x, 1.0 + (i % 2) * .35, 4.2), 1.1, m["glass"])
        elif any(k in fam for k in ("rainforest", "organic", "living")):
            for i, x in enumerate((-4.8, -2.0, 2.2, 4.8)):
                dome(f"{theme}_World_HorizonCanopy_{i}", (x, 2.2 + (i % 2) * .4, 4.0), 1.35, ground)
        else:
            for i, x in enumerate((-5.0, -3.2, 3.2, 5.0)):
                add_pylon(
                    f"{theme}_World_HorizonPylon_{i}",
                    (x, 1.7, 4.0),
                    3.4 + (i % 3) * .7,
                    archmat,
                    .22,
                    rot,
                )
    else:
        add_pylon(f"{theme}_District_LeftFrame", (-4.8, 2.3, 3.4), 4.6, archmat, .24, rot)
        add_pylon(f"{theme}_District_RightFrame", (4.8, 2.7, 3.8), 5.4, secondary, .20, -rot)
        arch(f"{theme}_District_HorizonGate", (0, 3.5, 4.1), 3.5, primary, (.55, rot, 0), 72)

    # Family landmarks are high/back to create recognizable silhouettes without
    # another foreground object pile.
    if "japanese" in fam or "samurai" in fam:
        for x in (-3.8, 3.8):
            add_pylon(f"{theme}_Family_Torii_{x}", (x, 2.5, 3.6), 5.0, secondary, .18, rot)
            platform(f"{theme}_Family_ToriiCross_{x}", (x, 4.7, 3.6), (1.0, .14, .16), secondary, rot)
    elif any(k in fam for k in ("desert", "ancient", "pharaoh")):
        for x in (-3.7, 3.7):
            bpy.ops.mesh.primitive_cone_add(
                vertices=4, radius1=1.0, radius2=.06, depth=5.4,
                location=(x, 2.7, 3.5), rotation=(0, 0, rot)
            )
            o = bpy.context.object
            o.name = f"{theme}_Family_Pyramid_{x}"
            o.data.materials.append(ice)
    elif any(k in fam for k in ("rainforest", "organic", "living")):
        for x in (-3.8, 3.8):
            dome(f"{theme}_Family_Canopy_{x}", (x, 3.0, 3.7), 1.55, ground)
    elif any(k in fam for k in ("ocean", "submerged")):
        for x in (-3.8, 0, 3.8):
            dome(f"{theme}_Family_Dome_{x}", (x, 2.6, 3.8), 1.15, m["glass"])
    elif any(k in fam for k in ("industrial", "forge", "heroic")):
        for x in (-3.8, 0, 3.8):
            add_pylon(f"{theme}_Family_Spine_{x}", (x, 2.8, 3.7), 5.6, archmat, .25, rot)
    elif any(k in fam for k in ("neon", "tropical-megacity")):
        for i in range(4):
            arch(f"{theme}_Family_NeonArc_{i}", (-3.0 + i * 2.0, 3.1, 3.7), .9, primary, (math.pi / 2, rot + i * .16, 0), 64)
    elif any(k in fam for k in ("quantum", "temporal")):
        for i in range(3):
            arch(f"{theme}_Family_QuantumFrame_{i}", (0, 2.0 + i * .9, 3.8), 1.5 + i * .35, secondary, (.38, rot + i * .18, .22), 72)


def add_category_semantic_anchors(theme, p, category, m):
    """Sparse semantic anchors make scale/category legible before palette is noticed."""
    v = variant(theme)
    fam = p["family"].lower()
    primary = m["cyan"]
    secondary = m["violet"]
    ice = m["ice"]
    archmat = m["architectural"]
    ground = m["ground"]
    skew = -1 if v % 2 else 1
    phase = (v % 10) * math.pi / 10

    if category == "universe":
        for i in range(4):
            a = phase + i * math.pi / 2
            x, z = math.cos(a) * 4.5, math.sin(a) * 4.5
            add_slab(f"{theme}_Universe_OrbitalDistrict_{i}", (x, .2 + (i % 2) * .35, z), (.75, .16, .55), ground, .12, a)
        prism(f"{theme}_Universe_CosmicCore", (0, 3.3, .2), 1.0, 6.0, ice, 8, phase)
        for r in (3.0, 4.3, 5.4):
            arch(f"{theme}_Universe_GrandOrbit_{r}", (0, 3.1, .2), r, primary, (1.0, phase + r * .03, .08), 112)

    elif category == "galaxy":
        nodes = []
        for i in range(8):
            a = phase + i * math.tau / 8
            r = 1.3 + (i % 4) * .9
            pos = (math.cos(a) * r, 1.0 + (i % 3) * .85, math.sin(a) * r)
            nodes.append(pos)
            prism(
                f"{theme}_Galaxy_NavigationNode_{i}", pos,
                .3 + (i % 2) * .1, .72 + (i % 3) * .25,
                ice if i % 3 == 0 else primary, 7, a
            )
        for i in range(0, 8, 2):
            add_bridge(f"{theme}_Galaxy_NavigationLink_{i}", nodes[i], nodes[(i + 3) % 8], secondary)
        arch(f"{theme}_Galaxy_NavigationArc", (0, 2.2, 0), 3.8, secondary, (.68, phase, .25), 96)

    elif category == "world":
        if any(k in fam for k in ("ocean", "submerged")):
            for i in range(5):
                a = phase + i * math.tau / 5
                dome(f"{theme}_World_HabitatDome_{i}", (math.cos(a) * 3.0, .95 + (i % 2) * .25, math.sin(a) * 2.2), .85, m["glass"])
        elif any(k in fam for k in ("desert", "ancient", "pharaoh")):
            for i in range(5):
                a = phase + i * math.tau / 5
                x, z = math.cos(a) * 3.0, math.sin(a) * 2.1
                bpy.ops.mesh.primitive_cone_add(
                    vertices=4, radius1=.72, radius2=.04, depth=2.2 + (i % 3) * .6,
                    location=(x, 1.1, z)
                )
                o = bpy.context.object
                o.name = f"{theme}_World_Monolith_{i}"
                o.data.materials.append(ground)
        elif any(k in fam for k in ("rainforest", "organic", "living")):
            for i in range(5):
                a = phase + i * math.tau / 5
                dome(f"{theme}_World_BiomeCanopy_{i}", (math.cos(a) * 3.1, 1.0, math.sin(a) * 2.0), 1.0, ground)
        else:
            for i in range(5):
                a = phase + i * math.tau / 5
                x, z = math.cos(a) * 3.0, math.sin(a) * 2.1
                add_slab(f"{theme}_World_TerrainPlate_{i}", (x, .28, z), (.8, .15, .55), ground, .15, a)
        prism(f"{theme}_World_LandmarkSpire", (skew * .65, 2.8, .3), .8, 5.0, ice, 6, phase)
        arch(f"{theme}_World_Portal", (0, 2.1, -3.0), 1.45, primary, (math.pi / 2, phase, 0), 80)

    else:
        mode = (v + 1) % 3
        if mode == 0:
            add_slab(f"{theme}_District_Plaza", (0, .08, 0), (3.5, .12, 2.6), ground, .14, phase)
            for x, z in ((-2.4, -1.6), (2.4, -1.6), (-2.4, 1.6), (2.4, 1.6)):
                prism(f"{theme}_District_Building_{x}_{z}", (x, 1.3, z), .62, 2.6, archmat, 6, phase)
            arch(f"{theme}_District_Portal", (0, 2.1, -2.5), 1.25, secondary, (math.pi / 2, phase, 0), 72)
        elif mode == 1:
            for i in range(6):
                x = -3.2 + i * 1.28
                h = 1.8 + (i % 3) * .8
                prism(f"{theme}_District_StreetBlock_{i}", (x, h / 2, .8), .52, h, archmat, 8, phase)
                add_bridge(f"{theme}_District_StreetSpan_{i}", (x, h, .8), (x + skew * .7, h + .35, -1.6), primary)
        else:
            for i in range(5):
                x = -3.2 + i * 1.6
                platform(f"{theme}_District_HarborPier_{i}", (x, .22, -1.1), (.62, .12, 1.9), ground, phase)
                prism(f"{theme}_District_HarborTower_{i}", (x, 1.7, 1.2), .35, 3.2, ice, 6, phase)
            arch(f"{theme}_District_HarborGate", (0, 2.8, 2.6), 1.8, primary, (math.pi / 2, phase, 0), 72)


def apply_cinematic_camera(theme, category):
    v = variant(theme)
    p = (v % 12) * math.pi / 12
    if category == "universe":
        radius, y, lens, target = 20.5, 9.2, 58, (0, 3.0, .4)
    elif category == "galaxy":
        radius, y, lens, target = 18.0, 8.0, 55, (0, 2.3, .1)
    elif category == "world":
        radius, y, lens, target = 15.0, 6.2, 60, (0, 2.2, .2)
    else:
        radius, y, lens, target = 12.2, 5.0, 62, (0, 1.65, .0)

    cam = bpy.context.scene.camera
    if cam is None:
        BASE.configure_camera(category)
        cam = bpy.context.scene.camera
    cam.location = (
        math.sin(p) * radius,
        y + ((v % 5) - 2) * .3,
        math.cos(p) * radius,
    )
    cam.data.lens = lens + (v % 4)
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 3.4 if category == "district" else 4.2
    cam.data.dof.focus_distance = radius
    target = (
        target[0] + math.cos(p) * ((v % 3) - 1) * .35,
        target[1],
        target[2] + math.sin(p) * ((v % 3) - 1) * .35,
    )
    BASE.look_at(cam, target)
    bpy.context.scene.camera = cam


def cinematic_lighting():
    p = BASE.PALETTE
    BASE.area_light("D3C_Key", (8, 12, 9), 1850, p["cyan"], 6.5, (0, 2.6, 0))
    BASE.area_light("D3C_Fill", (-9, 7, 5), 650, p["secondary"], 5.0, (0, 2.2, 0))
    BASE.area_light("D3C_Rim", (2, 8, -10), 1650, p["ice"], 4.5, (0, 3.0, 1.0))


def bind_theme_palette(p):
    a, b, c = rgb(p["accent"])
    BASE.PALETTE.update({
        "primary": (*a, 1),
        "secondary": (*b, 1),
        "cyan": (*a, 1),
        "violet": (*b, 1),
        "ice": (*c, 1),
        "steel": tuple(.045 + x * .10 for x in a) + (1.0,),
        "glass": tuple(.02 + x * .18 for x in b) + (1,),
        "midnight": (.004, .007, .018, 1),
        "skin": (.58, .34, .27, 1),
        "warm": (*a, 1),
    })


def build_one(theme, p, category, preview):
    BASE.clear_scene()
    bind_theme_palette(p)
    BASE.setup_world_and_render()
    mats = BASE.build_materials()
    cinematic_lighting()
    add_backdrop(theme, p, category, mats)
    add_category_semantic_anchors(theme, p, category, mats)

    # D3C owns the macro composition. No dependency on the unmerged D3A branch.
    add_cinematic_macro_hero(theme, p, category, mats)
    BASE.add_stars(mats, 180 if category in {"universe", "galaxy"} else 80)

    metadata(p, category)
    meta = bpy.data.objects.get("ALLPHA_V2_13D3C_CINEMATIC_REMEDIATION_METADATA")
    if meta:
        meta["schema"] = SCHEMA
        meta["phase"] = "V2.13D.3C"
        meta["artQuality"] = "cinematic-visual-fidelity-remediation-v1"
        meta["visualComposition"] = "hero-dominant-clean-macro"
        meta["commonCityGrammarRemoved"] = True
        meta["structuralSignatureVersion"] = "3.0"
        meta["themeVariant"] = variant(theme)
        meta["sourceHumanGate"] = "V2.13D.3B-REJECTED"
        meta["runtimeAuthority"] = "outside-blender"

    apply_cinematic_camera(theme, category)

    out = ROOT / theme
    out.mkdir(parents=True, exist_ok=True)
    glb = out / f"{category}.glb"
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(glb),
        export_format="GLB",
        export_apply=True,
        export_animations=True,
        export_materials="EXPORT",
        use_selection=False,
    )

    png = None
    if preview:
        png = out / f"{category}.png"
        bpy.context.scene.render.filepath = str(png)
        bpy.ops.render.render(write_still=True)

    return {
        "themeKey": theme,
        "category": category,
        "glb": str(glb),
        "preview": str(png) if png else None,
        "schema": SCHEMA,
        "presentationOnly": True,
        "canonicalRenderer": "AllphaWorldRenderer",
        "remediation": "cinematic-world-scale-visual",
        "commonCityGrammarRemoved": True,
    }


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    preview = "--preview" in args
    theme = args[args.index("--theme") + 1] if "--theme" in args else None

    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if (
        data.get("themes") != 25
        or data.get("categories") != 14
        or data.get("matrixSize") != 350
        or data.get("goldenTheme") != "crystal-ai-city"
    ):
        raise SystemExit("V2.13C_FACTORY_MANIFEST_GATE_FAILED")

    profiles = {p["key"]: p for p in data["profiles"]}
    selected = [
        r for r in data["matrix"]
        if r["category"] in CATEGORIES and (not theme or r["themeKey"] == theme)
    ]
    expected = 4 if theme else 100
    if len(selected) != expected:
        raise SystemExit(f"V2.13D3C_EXPECTED_{expected}_RECIPES")

    ROOT.mkdir(parents=True, exist_ok=True)
    rows = []
    for recipe in selected:
        profile = profiles[recipe["themeKey"]]
        rows.append(build_one(profile["key"], profile, recipe["category"], preview))

    payload = {
        "schema": SCHEMA,
        "phase": "V2.13D.3C",
        "goldenReference": "crystal-ai-city",
        "themes": 25,
        "categories": 4,
        "matrixSize": 100,
        "generated": len(rows),
        "previewRequested": preview,
        "commonCityGrammarRemoved": True,
        "sourceLockedEvidence": ["V2.13D.1A-R3", "V2.13D.2", "V2.13D.3A"],
        "sourceHumanGate": "V2.13D.3B-REJECTED",
        "assets": rows,
    }
    manifest_path = ROOT / "manifest.json"
    manifest_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    if not manifest_path.is_file():
        raise RuntimeError("V2.13D3C_OUTPUT_MANIFEST_WRITE_FAILED")
    print(json.dumps({
        "ok": True, "phase": "V2.13D.3C", "themes": 25,
        "categories": 4, "generated": len(rows), "root": str(ROOT),
    }, indent=2))


if __name__ == "__main__":
    main()
