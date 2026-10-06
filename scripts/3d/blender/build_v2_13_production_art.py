"""Allpha Universe — 3D-V2.13A Crystal AI City production-art generator.

Run with Blender 4.x:
  blender -b --python scripts/3d/blender/build_v2_13_production_art.py -- --theme crystal-ai-city --preview

The script is deliberately presentation-only. It creates production-art geometry/materials and
exports GLB assets. Product authority, storage, manifests and signed URLs remain outside Blender.
Canonical runtime renderer: AllphaWorldRenderer.
"""

from __future__ import annotations

import bpy
import math
import os
import random
import sys
import json
from mathutils import Vector

SCHEMA = "allpha-3d-v2-13-production-art/1.1"
ROOT = os.environ.get("ALLPHA_V213_OUT", "allpha-theme-v2-13-golden-pack")
THEME = "crystal-ai-city"

CATEGORIES = [
    "universe", "galaxy", "world", "orbit", "capsule", "district", "booth",
    "content-feed", "agent-character", "live-stage", "human-live",
    "sticker-social", "animation", "navigation-fx",
]

PALETTE = {
    "primary": (0.035, 0.42, 0.82, 1.0),
    "secondary": (0.42, 0.10, 0.88, 1.0),
    "cyan": (0.02, 0.88, 0.98, 1.0),
    "ice": (0.72, 0.94, 1.0, 1.0),
    "midnight": (0.004, 0.009, 0.025, 1.0),
    "steel": (0.045, 0.075, 0.13, 1.0),
    "glass": (0.025, 0.12, 0.22, 1.0),
    "skin": (0.58, 0.34, 0.27, 1.0),
}

random.seed(213013)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for item in list(datablocks):
            if item.users == 0:
                datablocks.remove(item)


def color_rgba(value, alpha=1.0):
    return (value[0], value[1], value[2], alpha)


def production_material(
    name: str,
    base,
    *,
    metallic=0.0,
    roughness=0.4,
    emission=None,
    emission_strength=0.0,
    transmission=0.0,
    noise_scale=5.0,
    noise_strength=0.08,
):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")

    bsdf.inputs["Base Color"].default_value = color_rgba(base)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness

    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.28
        bsdf.inputs["Coat Roughness"].default_value = 0.12

    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    elif "Transmission" in bsdf.inputs:
        bsdf.inputs["Transmission"].default_value = transmission

    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = color_rgba(emission or base)
        bsdf.inputs["Emission Strength"].default_value = emission_strength

    # Subtle procedural surface variation. This is intentionally texture-light so the
    # golden pack remains mobile-aware while still reading as a real material.
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = noise_scale
    noise.inputs["Detail"].default_value = 4.0
    noise.inputs["Roughness"].default_value = 0.62

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.25
    ramp.color_ramp.elements[0].color = color_rgba(base, 1.0)
    ramp.color_ramp.elements[1].position = 0.78
    ramp.color_ramp.elements[1].color = color_rgba(tuple(min(1.0, c * 1.18) for c in base[:3]), 1.0)

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = noise_strength
    bump.inputs["Distance"].default_value = 0.035

    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def build_materials():
    p = PALETTE
    return {
        "architectural": production_material("CAC_Architectural_Metal", p["steel"], metallic=.88, roughness=.24, noise_scale=7, noise_strength=.055),
        "dark": production_material("CAC_BlackGlass", p["midnight"], metallic=.42, roughness=.18, transmission=.06, noise_scale=9, noise_strength=.035),
        "glass": production_material("CAC_SmartGlass", p["glass"], metallic=.22, roughness=.10, transmission=.32, emission=p["cyan"], emission_strength=.12, noise_scale=6, noise_strength=.025),
        "cyan": production_material("CAC_CyanLight", p["cyan"], metallic=.08, roughness=.18, emission=p["cyan"], emission_strength=4.5, noise_scale=18, noise_strength=.015),
        "violet": production_material("CAC_VioletLight", p["secondary"], metallic=.08, roughness=.18, emission=p["secondary"], emission_strength=4.0, noise_scale=18, noise_strength=.015),
        "ice": production_material("CAC_Ice", p["ice"], metallic=.15, roughness=.12, transmission=.18, emission=p["ice"], emission_strength=.4, noise_scale=11, noise_strength=.025),
        "skin": production_material("CAC_Skin", p["skin"], metallic=.0, roughness=.42, noise_scale=4, noise_strength=.025),
        "fabric": production_material("CAC_Fabric", (0.015, .025, .05, 1), metallic=.04, roughness=.72, noise_scale=18, noise_strength=.10),
        "ground": production_material("CAC_Ground", (.008, .015, .032, 1), metallic=.68, roughness=.31, noise_scale=4, noise_strength=.12),
        "warm": production_material("CAC_WarmPractical", (.72, .26, .08, 1), metallic=.15, roughness=.3, emission=(1.0, .34, .08, 1), emission_strength=2.1),
    }


def bevel(obj, width=.06, segments=3):
    modifier = obj.modifiers.new("ProductionBevel", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def cube(name, location, scale, material, bevel_width=.04):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel_width:
        bevel(obj, bevel_width, 3)
    return obj


def cylinder(name, location, radius, depth, material, vertices=48, bevel_width=.025):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    if bevel_width:
        bevel(obj, bevel_width, 2)
    return obj


def sphere(name, location, scale, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return obj


def torus(name, location, major, minor, material, rotation=(0, 0, 0), segments=96):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=segments,
        minor_segments=18, location=location, rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area_light(name, location, energy, color, size, target=(0, 2, 0)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color[:3]
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)
    return obj


def point_light(name, location, energy, color, radius=1.0):
    data = bpy.data.lights.new(name, "POINT")
    data.energy = energy
    data.color = color[:3]
    data.shadow_soft_size = radius
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    return obj


def setup_world_and_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"

    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass

    world = scene.world or bpy.data.worlds.new("AllphaUniverseWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (.001, .003, .012, 1)
    bg.inputs["Strength"].default_value = .045

    volume = world.node_tree.nodes.get("AllphaAtmosphere")
    if volume is None:
        volume = world.node_tree.nodes.new("ShaderNodeVolumePrincipled")
        volume.name = "AllphaAtmosphere"
        volume.inputs["Density"].default_value = .0045
        volume.inputs["Anisotropy"].default_value = .28
        output = world.node_tree.nodes.get("World Output")
        world.node_tree.links.new(volume.outputs["Volume"], output.inputs["Volume"])


def add_stars(materials, count=240):
    random.seed(202613)
    for i in range(count):
        x = random.uniform(-24, 24)
        y = random.uniform(3, 22)
        z = random.uniform(-18, 18)
        radius = random.uniform(.008, .028)
        sphere(f"Star_{i:03d}", (x, y, z), (radius, radius, radius), materials["ice"])


def add_ground(materials):
    cube("ForegroundPlaza", (0, -.28, .3), (9.5, .22, 7.6), materials["ground"], .16)
    for r in (2.1, 3.6, 5.2, 6.8):
        torus("PlazaConcentricRail", (0, -.015, .2), r, .018, materials["cyan"], (math.pi / 2, 0, 0))
    # Radial architectural seams.
    for i in range(16):
        a = (i / 16) * math.tau
        x, z = math.cos(a) * 5.5, math.sin(a) * 5.5
        cube("PlazaSeam", (x * .5, -.015, z * .5), (2.6, .012, .012), materials["violet"], .006).rotation_euler[1] = -a


def add_road_and_bridge(materials, start, end, width=.34):
    sx, sy, sz = start
    ex, ey, ez = end
    midpoint = ((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2)
    dx, dy, dz = ex - sx, ey - sy, ez - sz
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    obj = cube("SkyBridge", midpoint, (width, width, length / 2), materials["dark"], .05)
    obj.rotation_euler = (math.atan2(math.sqrt(dx * dx + dz * dz), dy), math.atan2(dx, dz), 0)
    for t in (.2, .5, .8):
        px, py, pz = sx + dx * t, sy + dy * t, sz + dz * t
        torus("BridgeLight", (px, py + .025, pz), width * .8, .012, materials["cyan"], (math.pi / 2, 0, 0), 48)


def add_window_grid(materials, x, y, z, width, height, depth, rows=8, cols=3):
    rows = max(3, rows)
    cols = max(2, cols)
    for row in range(rows):
        py = y + (-height / 2 + .34 + row * (height - .68) / (rows - 1))
        for col in range(cols):
            px = x + (-width / 2 + .24 + col * (width - .48) / max(1, cols - 1))
            lit = (row * 7 + col * 11) % 5 != 0
            material = materials["cyan"] if lit else materials["violet"]
            cube("FacadeWindow", (px, py, z - depth / 2 - .012), (.055, .035, .012), material, .008)


def add_crystal_tower(materials, x, z, height, width, variant=0):
    body = cube("CrystalTower", (x, height / 2, z), (width, height / 2, width * .72), materials["architectural"], .10)
    if variant % 2:
        cap = cylinder("TowerCap", (x, height + .18, z), width * .54, .24, materials["ice"], 32, .02)
        cap.rotation_euler[2] = math.radians(12)
    else:
        cap = cube("TowerCap", (x, height + .16, z), (width * .48, .12, width * .48), materials["cyan"], .025)
    add_window_grid(materials, x, height * .55, z, width * 1.5, height * .86, width * 1.4, int(height * 1.2), 3)
    for level in (0.34, .58, .82):
        if height > 4.0:
            torus("TowerHalo", (x, height * level, z), width * (1.08 + level * .18), .022, materials["violet"], (math.pi / 2, 0, 0), 64)
    if variant % 3 == 0:
        cylinder("Antenna", (x, height + .65, z), .035, 1.0, materials["cyan"], 12, .01)
        sphere("AntennaBeacon", (x, height + 1.17, z), (.075, .075, .075), materials["cyan"])


def add_city(materials):
    add_ground(materials)

    # Foreground/midground/background hierarchy.
    foreground = [
        (-5.8, -1.4, 3.4, .95), (-3.9, 1.2, 5.0, .72),
        (4.4, .9, 4.6, .78), (6.1, -1.7, 3.1, .95),
    ]
    midground = [
        (-4.5, 3.4, 7.4, .62), (-2.5, 3.0, 8.8, .66), (2.8, 3.1, 8.0, .68),
        (4.8, 3.7, 7.1, .64), (0, 4.5, 11.5, .82),
    ]
    background = [
        (-8.0, 5.4, 9.2, .56), (-6.4, 6.0, 11.0, .5), (-4.6, 6.2, 12.4, .46),
        (4.8, 6.4, 12.6, .46), (6.5, 6.0, 11.2, .52), (8.2, 5.0, 8.7, .56),
    ]
    for i, (x, z, h, w) in enumerate(foreground + midground + background):
        add_crystal_tower(materials, x, z, h, w, i)

    # Central civic spire.
    for level in range(5):
        radius = 2.7 - level * .35
        y = .25 + level * .58
        cylinder("CivicTier", (0, y, .2), radius, .34, materials["architectural"], 64, .035)
        torus("CivicTierLight", (0, y + .18, .2), radius * .92, .028, materials["cyan"], (math.pi / 2, 0, 0), 96)
    cylinder("CivicSpire", (0, 4.6, .2), .58, 8.6, materials["glass"], 64, .05)
    for level in range(8):
        y = 1.0 + level * .9
        torus("SpireHalo", (0, y, .2), .78 + level * .12, .035, materials["ice"], (math.pi / 2, 0, 0), 96)
    cone = None
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=.82, radius2=.08, depth=2.5, location=(0, 9.9, .2))
    cone = bpy.context.object
    cone.name = "CivicCrystalCrown"
    cone.data.materials.append(materials["ice"])
    bevel(cone, .03, 2)

    # Elevated connections create believable city scale.
    add_road_and_bridge(materials, (-4.4, 2.1, 1.2), (0, 3.0, .2), .28)
    add_road_and_bridge(materials, (4.4, 2.1, 1.0), (0, 3.0, .2), .28)
    add_road_and_bridge(materials, (-2.4, 1.4, -2.8), (2.6, 2.1, 1.4), .24)

    # Portal / gateway anchors.
    for x in (-3.8, 3.8):
        torus("CityGateway", (x, 2.5, -2.7), 1.25, .075, materials["cyan"], (math.pi / 2, 0, 0))
        torus("CityGatewayInner", (x, 2.5, -2.7), .96, .035, materials["violet"], (math.pi / 2, 0, 0))
        for sy in (.8, 4.2):
            cylinder("GatewayPillar", (x - 1.0, sy, -2.7), .16, 1.0, materials["architectural"], 32, .02)

    # Atmospheric orbit layer.
    for i, radius in enumerate((4.8, 6.0, 7.2)):
        torus(
            "AtmosphericOrbit",
            (0, 2.6 + i * .35, .2),
            radius,
            .018 + i * .004,
            materials["cyan"] if i % 2 == 0 else materials["violet"],
            (math.radians(66 + i * 8), math.radians(i * 7), math.radians(i * 9)),
            128,
        )


def add_character(materials, location=(0, .05, 2.8), scale=1.0, pose=0.0, ai=False):
    root = bpy.data.objects.new("AICharacter" if ai else "HumanCharacter", None)
    bpy.context.collection.objects.link(root)
    root.location = location
    root.scale = (scale, scale, scale)

    body = cube("CharacterBody", (0, 1.35, 0), (.42, .65, .25), materials["fabric"], .14)
    body.parent = root
    chest = cube("CharacterChestLight", (0, 1.45, -.26), (.27, .18, .025), materials["cyan"], .025)
    chest.parent = root

    head = sphere("CharacterHead", (0, 2.35, 0), (.36, .40, .34), materials["skin"])
    head.parent = root
    hair = sphere("CharacterHair", (0, 2.56, -.015), (.39, .25, .36), materials["architectural"])
    hair.parent = root

    visor = cube("CharacterVisor", (0, 2.36, -.32), (.27, .055, .035), materials["cyan"], .02)
    visor.parent = root

    for side in (-1, 1):
        arm = cylinder("CharacterArm", (side * .53, 1.38, 0), .105, 1.15, materials["skin"], 20, .018)
        arm.rotation_euler[1] = side * pose
        arm.parent = root
        leg = cylinder("CharacterLeg", (side * .20, .48, 0), .13, 1.35, materials["fabric"], 20, .018)
        leg.parent = root

    aura = torus("CharacterAura", (0, .18, 0), .78, .026, materials["violet"], (math.pi / 2, 0, 0), 64)
    aura.parent = root

    if ai:
        core = sphere("AgentCore", (0, 1.15, -.34), (.12, .12, .05), materials["ice"])
        core.parent = root

    return root


def add_live_stage(materials):
    cube("LiveStagePlatform", (0, .18, 0), (4.0, .18, 3.0), materials["ground"], .14)
    torus("LiveStageOuter", (0, .45, 0), 2.65, .055, materials["cyan"], (math.pi / 2, 0, 0), 96)
    torus("LiveStageInner", (0, .47, 0), 1.9, .035, materials["violet"], (math.pi / 2, 0, 0), 96)
    for x in (-2.9, 2.9):
        cube("StagePillar", (x, 2.2, -.8), (.12, 2.0, .12), materials["architectural"], .03)
        sphere("StagePractical", (x, 4.35, -.8), (.18, .18, .18), materials["warm"])
    cube("StageBackdrop", (0, 2.5, -2.2), (3.4, 2.0, .08), materials["glass"], .04)
    add_character(materials, (-1.25, .2, .35), .88, -.15, ai=False)
    add_character(materials, (1.25, .2, .35), .88, .15, ai=True)


def add_booth(materials):
    cube("BoothShell", (0, 1.55, 0), (2.5, 1.45, 1.8), materials["architectural"], .16)
    cube("BoothGlassFront", (0, 1.35, -1.82), (2.15, 1.05, .045), materials["glass"], .02)
    cube("BoothCanopy", (0, 3.2, -.05), (2.7, .13, 1.95), materials["dark"], .05)
    torus("BoothSign", (0, 3.35, -1.82), 1.15, .045, materials["cyan"], (0, 0, 0), 72)
    cube("BoothProductIsland", (0, .75, -.35), (1.2, .14, .75), materials["glass"], .05)
    for x in (-1.25, 1.25):
        cylinder("BoothColumn", (x, 1.55, -1.0), .08, 2.6, materials["violet"], 24, .018)
    add_character(materials, (0, .15, 1.15), .78, 0.0, ai=True)


def add_capsule(materials):
    sphere("ContentCapsule", (0, 1.55, 0), (2.25, 1.35, 1.55), materials["glass"])
    torus("CapsuleRing", (0, 1.55, 0), 2.1, .055, materials["cyan"], (math.pi / 2, 0, 0), 96)
    cube("CapsulePedestal", (0, .18, 0), (1.55, .16, 1.15), materials["ground"], .10)
    for i, x in enumerate((-1.1, 0, 1.1)):
        cube("CapsuleSignal", (x, 2.85, -.2), (.35, .035, .035), materials["violet"] if i else materials["cyan"], .008)


def add_content_feed(materials):
    add_capsule(materials)
    for i in range(6):
        a = i * math.tau / 6
        x, z = math.cos(a) * 3.3, math.sin(a) * 3.3
        cube("ContentCard", (x, 1.2, z), (.52, .75, .06), materials["glass"], .06)
        torus("ContentCardGlow", (x, 2.05, z), .28, .022, materials["cyan"], (math.pi / 2, 0, 0), 48)


def add_orbit(materials):
    sphere("OrbitCore", (0, 1.5, 0), (1.15, 1.15, 1.15), materials["glass"])
    for i, radius in enumerate((1.8, 2.25, 2.7, 3.15, 3.6)):
        torus("OrbitRing", (0, 1.5, 0), radius, .035, materials["cyan"] if i % 2 == 0 else materials["violet"], (math.pi / 2 + i * .09, i * .12, i * .08), 96)


def add_universe_or_galaxy(materials, galaxy=False):
    add_city(materials)
    sphere("UniverseCore" if not galaxy else "GalaxyCore", (0, 4.8, .2), (1.9, 1.4, 1.9), materials["glass"])
    for i, radius in enumerate((2.8, 3.6, 4.4, 5.2)):
        torus("UniverseOrbit", (0, 4.8, .2), radius, .035, materials["cyan"] if i % 2 == 0 else materials["violet"], (math.radians(65 + i * 8), i * .14, i * .1), 128)
    add_character(materials, (0, .1, 3.1), 1.0, .05, ai=False)
    add_character(materials, (2.4, .05, 1.0), .78, -.1, ai=True)


def add_navigation_fx(materials):
    for radius, color in ((1.8, materials["cyan"]), (2.4, materials["violet"]), (3.0, materials["ice"])):
        torus("NavigationPortal", (0, 2.0, 0), radius, .075, color, (math.pi / 2, 0, 0), 112)
    cylinder("NavigationBeam", (0, 3.5, 0), .055, 5.5, materials["cyan"], 16, .012)


def add_sticker_social(materials):
    sphere("StickerSocial", (0, 1.5, 0), (1.55, .42, 1.55), materials["ice"])
    torus("StickerHalo", (0, 1.5, 0), 1.45, .075, materials["cyan"], (math.pi / 2, 0, 0), 72)


def build_category(materials, category):
    if category == "universe":
        add_universe_or_galaxy(materials, False)
    elif category == "galaxy":
        add_universe_or_galaxy(materials, True)
    elif category == "world":
        add_city(materials)
        sphere("WorldCore", (0, 4.0, .2), (1.55, .85, 1.55), materials["glass"])
        torus("WorldHalo", (0, 4.0, .2), 2.15, .045, materials["cyan"], (math.pi / 2, 0, 0), 112)
    elif category == "orbit":
        add_orbit(materials)
    elif category == "capsule":
        add_capsule(materials)
    elif category == "district":
        add_city(materials)
        for i, x in enumerate((-2.8, -1.0, 1.0, 2.8)):
            add_character(materials, (x, .05, -1.8 + (i % 2) * .8), .62, (i - 1.5) * .08, ai=i % 2 == 0)
    elif category == "booth":
        add_booth(materials)
    elif category == "content-feed":
        add_content_feed(materials)
    elif category == "agent-character":
        add_character(materials, (0, .05, 0), 1.15, 0.12, ai=True)
    elif category == "live-stage":
        add_live_stage(materials)
    elif category == "human-live":
        add_character(materials, (0, .05, 0), 1.15, 0.12, ai=False)
    elif category == "sticker-social":
        add_sticker_social(materials)
    elif category == "animation":
        add_character(materials, (0, .05, 0), 1.0, 0.22, ai=True)
        torus("AnimationPath", (0, 1.3, 0), 2.25, .03, materials["cyan"], (math.pi / 2, 0, 0), 96)
    elif category == "navigation-fx":
        add_navigation_fx(materials)


def add_lighting(materials):
    p = PALETTE
    area_light("Key_Cyan", (7, 10, 8), 1400, p["cyan"], 5.5, (0, 3, 0))
    area_light("Fill_Violet", (-7, 6, 4), 1000, p["secondary"], 5.0, (0, 2, 0))
    area_light("Rim_Ice", (1, 7, -8), 1200, p["ice"], 4.0, (0, 3, 0))
    point_light("Practical_Warm", (0, 3.5, 2.5), 220, (1.0, .28, .08), .7)


def configure_camera(category):
    scene = bpy.context.scene
    bpy.ops.object.camera_add(location=(11.8, 7.4, 15.8))
    camera = bpy.context.object
    camera.name = "V213A_GoldenCamera"
    camera.data.lens = 52
    camera.data.sensor_width = 32
    camera.data.dof.use_dof = True
    camera.data.dof.aperture_fstop = 2.8
    camera.data.dof.focus_distance = 18.0
    target = (0, 3.1, .2)

    if category in {"agent-character", "human-live"}:
        camera.location = (6.0, 4.2, 8.2)
        camera.data.lens = 58
        target = (0, 1.8, 0)
    elif category in {"booth", "live-stage"}:
        camera.location = (9.4, 5.1, 11.4)
        camera.data.lens = 55
        target = (0, 2.0, -.2)
    elif category in {"orbit", "navigation-fx"}:
        camera.location = (8.2, 4.8, 11.2)
        target = (0, 1.8, 0)

    look_at(camera, target)
    scene.camera = camera


def add_metadata(theme_key, category):
    empty = bpy.data.objects.new("ALLPHA_V2_13A_PRODUCTION_METADATA", None)
    bpy.context.collection.objects.link(empty)
    empty["schema"] = SCHEMA
    empty["themeKey"] = theme_key
    empty["category"] = category
    empty["source"] = "blender-production-art"
    empty["presentationOnly"] = True
    empty["legacy"] = False
    empty["artQuality"] = "production-realistic-golden"
    empty["depthModel"] = "foreground-midground-background"
    empty["materialModel"] = "procedural-pbr-with-surface-variation"
    empty["lightingModel"] = "cinematic-key-fill-rim-practical"
    empty["composition"] = "mobile-portrait-focal-hero"
    empty["canonicalRenderer"] = "AllphaWorldRenderer"
    empty["runtimeAuthority"] = "outside-blender"
    empty.hide_render = True


def export_category(theme_key, category, preview):
    clear_scene()
    setup_world_and_render()
    materials = build_materials()
    add_lighting(materials)
    build_category(materials, category)
    add_stars(materials, 260 if category in {"universe", "galaxy", "world", "district", "live-stage"} else 110)
    add_metadata(theme_key, category)
    configure_camera(category)

    output_dir = os.path.join(ROOT, theme_key)
    os.makedirs(output_dir, exist_ok=True)
    glb_path = os.path.join(output_dir, f"{category}.glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_apply=True,
        export_animations=True,
        export_materials="EXPORT",
        use_selection=False,
    )

    preview_path = None
    if preview:
        preview_path = os.path.join(output_dir, f"{category}.png")
        bpy.context.scene.render.filepath = preview_path
        bpy.ops.render.render(write_still=True)

    return {
        "themeKey": theme_key,
        "category": category,
        "glb": glb_path,
        "preview": preview_path,
        "schema": SCHEMA,
        "presentationOnly": True,
        "legacy": False,
    }


def parse_args():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    theme = args[args.index("--theme") + 1] if "--theme" in args else THEME
    category = args[args.index("--category") + 1] if "--category" in args else None
    preview = "--preview" in args
    return theme, category, preview


def main():
    theme, category, preview = parse_args()
    if theme != THEME:
        raise SystemExit("V2.13A golden gate is intentionally scoped to crystal-ai-city.")
    categories = [category] if category else CATEGORIES
    invalid = [item for item in categories if item not in CATEGORIES]
    if invalid:
        raise SystemExit(f"Unknown category: {invalid}")

    rows = [export_category(theme, item, preview) for item in categories]
    manifest = {
        "schema": "allpha-3d-v2-13a-golden-manifest/1.1",
        "theme": THEME,
        "categories": len(rows),
        "assets": rows,
        "visualGate": "Blender preview -> visual QA -> GLB validation -> staged storage -> signed URL -> AllphaWorldRenderer -> browser QA -> mobile QA",
        "status": "GOLDEN_ASSET_GATE_OPEN",
    }
    os.makedirs(ROOT, exist_ok=True)
    with open(os.path.join(ROOT, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
    print(json.dumps({"theme": THEME, "categories": len(rows), "root": ROOT, "status": manifest["status"]}))


if __name__ == "__main__":
    main()
