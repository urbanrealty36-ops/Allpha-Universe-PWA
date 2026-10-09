"""Headless Blender inspection/export gate for a real GLB asset.

Run:
  blender --background --python scripts/theme-rebuild/blender_process_glb.py -- input.glb output.glb report.json

This does not invent geometry or certify visual quality. It imports the source, checks
scene/mesh/material/UV/bounds, exports a GLB, and records hashes and statistics.
A human still reviews the scene and preview before production activation.
"""
import bpy
import hashlib
import json
import os
import sys
from mathutils import Vector


def args_after_separator():
    if "--" not in sys.argv:
        raise RuntimeError("Expected input.glb output.glb report.json after --")
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 3:
        raise RuntimeError("Usage: blender --background --python blender_process_glb.py -- input.glb output.glb report.json")
    return args


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    source, output, report_path = [os.path.abspath(item) for item in args_after_separator()]
    if not os.path.isfile(source) or not source.lower().endswith(".glb"):
        raise RuntimeError("SOURCE_GLB_MISSING")
    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(report_path) or ".", exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("BLENDER_SCENE_HAS_NO_MESHES")

    vertices = sum(len(obj.data.vertices) for obj in meshes)
    polygons = sum(len(obj.data.polygons) for obj in meshes)
    material_slots = sum(len(obj.material_slots) for obj in meshes)
    materials = {slot.material for obj in meshes for slot in obj.material_slots if slot.material}
    uv_layers = sum(len(obj.data.uv_layers) for obj in meshes)
    images = {image for material in materials if material.use_nodes and material.node_tree
              for node in material.node_tree.nodes if node.type == "TEX_IMAGE" and node.image}
    bounds = []
    for obj in meshes:
        for corner in obj.bound_box:
            bounds.append(obj.matrix_world @ Vector(corner))
    if not bounds:
        raise RuntimeError("BLENDER_BOUNDS_MISSING")
    mins = [min(point[axis] for point in bounds) for axis in range(3)]
    maxs = [max(point[axis] for point in bounds) for axis in range(3)]
    dimensions = [round(maxs[i] - mins[i], 6) for i in range(3)]
    if max(dimensions) <= 0:
        raise RuntimeError("BLENDER_ZERO_SCALE_SCENE")

    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=True,
    )
    if not os.path.isfile(output) or os.path.getsize(output) < 20:
        raise RuntimeError("BLENDER_GLB_EXPORT_FAILED")
    report = {
        "schema": "allpha-blender-glb-report/1.0",
        "status": "BLENDER_STRUCTURAL_QA_PASS",
        "source": os.path.basename(source),
        "source_sha256": sha256(source),
        "output": os.path.basename(output),
        "output_sha256": sha256(output),
        "output_bytes": os.path.getsize(output),
        "mesh_object_count": len(meshes),
        "vertex_count": vertices,
        "polygon_count": polygons,
        "material_slot_count": material_slots,
        "unique_material_count": len(materials),
        "uv_layer_count": uv_layers,
        "referenced_image_count": len(images),
        "world_bounds_min": [round(value, 6) for value in mins],
        "world_bounds_max": [round(value, 6) for value in maxs],
        "world_dimensions": dimensions,
        "human_visual_review_required": True,
        "limitations": [
            "Does not certify artistic quality, correct real-world scale, topology suitability, texture fidelity, animation correctness, or target-device performance.",
            "A reviewer must inspect Blender scene and rendered preview before production activation."
        ]
    }
    with open(report_path, "w", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
