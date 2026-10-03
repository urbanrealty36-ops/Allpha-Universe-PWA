"""Generate the deterministic low-poly Allpha 25 Theme GLB implementation pack.

This is an asset-authoring tool, not business-data seeding. It requires trimesh + numpy
in the asset-generation environment. Output is intentionally small and named so the
runtime can hide template-only nodes while real server-authoritative runtime objects
remain interactive.
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

OUT = Path("dist/allpha-25-theme-3d")
OUT.mkdir(parents=True, exist_ok=True)

THEMES = {
    "heroic-nexus": ("#111827", "#334155", "#7C3AED"),
    "nusantara-raya": ("#3B5F45", "#8A6A43", "#E6B85C"),
    "neo-jakarta-2099": ("#101827", "#27364F", "#22D3EE"),
    "celestial-samurai": ("#211A25", "#513044", "#FB7185"),
    "skyforge-empire": ("#263142", "#5B6474", "#F59E0B"),
    "emerald-rainforest": ("#183C2A", "#355F3E", "#84CC16"),
    "aurora-kingdom": ("#24314A", "#4C5C78", "#67E8F9"),
    "desert-starfall": ("#6D4B2C", "#A9783D", "#F5C46A"),
    "oceanic-atlantis": ("#0B3145", "#176B83", "#67E8F9"),
    "lunar-frontier": ("#151923", "#343B50", "#A78BFA"),
    "mars-frontier": ("#4A2521", "#754033", "#FB923C"),
    "neon-tokyo": ("#211A25", "#513044", "#F472B6"),
    "pharaoh-eternal": ("#6D4B2C", "#B8863B", "#FDE68A"),
    "viking-fjord": ("#263142", "#556070", "#38BDF8"),
    "kingdom-of-aether": ("#27324A", "#65708C", "#C084FC"),
    "coral-metropolis": ("#0B3145", "#176B83", "#FB7185"),
    "savanna-spirit": ("#4B3A24", "#7A6038", "#FACC15"),
    "floating-garden": ("#183C2A", "#4C7A55", "#A3E635"),
    "dragon-dominion": ("#263142", "#5A3B3B", "#EF4444"),
    "quantum-city": ("#101827", "#34445E", "#818CF8"),
    "crystal-ai-city": ("#20203B", "#4B3F72", "#C084FC"),
    "galactic-frontier": ("#151923", "#343B50", "#38BDF8"),
    "chronos-realm": ("#2A2234", "#5B4A6F", "#FBBF24"),
    "mystic-academy": ("#20203B", "#4B3F72", "#C084FC"),
    "dream-carnival": ("#24182D", "#5B2C65", "#F472B6"),
}

COMPONENTS = [
    "WorldGround",
    "District_A",
    "District_B",
    "District_C",
    "District_D",
    "WorldLandmark",
    "BoothTemplate",
    "AgentCharacterTemplate",
    "PortalGateway",
    "ContentAICapsule",
    "LiveExperienceStage",
]


def rgba(value: str) -> list[int]:
    return [int(value[i : i + 2], 16) for i in (1, 3, 5)] + [255]


def material(value: str) -> trimesh.visual.material.PBRMaterial:
    return trimesh.visual.material.PBRMaterial(
        baseColorFactor=rgba(value),
        metallicFactor=0.2,
        roughnessFactor=0.55,
    )


def add(scene: trimesh.Scene, name: str, mesh: trimesh.Trimesh, position: tuple[float, float, float]) -> None:
    mesh.visual.material = material(mesh.visual.material.baseColorFactor if False else "#FFFFFF")
    scene.add_geometry(
        mesh,
        node_name=name,
        transform=trimesh.transformations.translation_matrix(position),
    )


def build(slug: str, ground: str, secondary: str, accent: str) -> None:
    scene = trimesh.Scene()

    parts = [
        ("WorldGround", trimesh.creation.cylinder(6, 0.25, sections=12), (0, 0, 0), ground),
        ("District_A", trimesh.creation.box((2.4, 0.25, 2.4)), (3, 0.18, 0), secondary),
        ("District_B", trimesh.creation.box((2.4, 0.25, 2.4)), (-3, 0.18, 0), secondary),
        ("District_C", trimesh.creation.box((2.4, 0.25, 2.4)), (0, 0.18, 3), secondary),
        ("District_D", trimesh.creation.box((2.4, 0.25, 2.4)), (0, 0.18, -3), secondary),
        ("WorldLandmark", trimesh.creation.cone(1.0, 2.8, sections=6), (0, 1.4, 0), accent),
        ("PortalGateway", trimesh.creation.torus(1.0, 0.1, major_sections=16, minor_sections=6), (0, 0.95, -4.3), accent),
        ("BoothTemplate", trimesh.creation.box((1.1, 1.1, 1.1)), (3, 0.75, 0), accent),
        ("AgentCharacterTemplate", trimesh.creation.icosphere(subdivisions=1, radius=0.4), (1.8, 1.2, 1.8), accent),
        ("ContentAICapsule", trimesh.creation.octahedron(), (-1.8, 1.4, 1.6), accent),
        ("LiveExperienceStage", trimesh.creation.cylinder(1.1, 0.16, sections=16), (-1.8, 0.45, -1.8), secondary),
    ]

    for name, mesh, position, color in parts:
        mesh.visual.material = material(color)
        scene.add_geometry(
            mesh,
            node_name=name,
            transform=trimesh.transformations.translation_matrix(position),
        )

    scene.export(OUT / f"{slug}.glb", file_type="glb")


def main() -> None:
    for slug, colors in THEMES.items():
        build(slug, *colors)
    print(f"generated {len(THEMES)} Theme GLBs in {OUT}")


if __name__ == "__main__":
    main()
