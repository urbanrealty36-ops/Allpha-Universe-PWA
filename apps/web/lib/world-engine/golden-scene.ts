import type { WorldScene, Vec3 } from "./scene-schema";

export type GoldenSpatialLayer = "universe" | "galaxy" | "orbit";
export const GOLDEN_THEME_KEY = "crystal-ai-city";

const node = (id: string, position: Vec3, kind: string, metadata: Record<string, unknown> = {}) => ({
  id, position, kind, presentation_only: true,
  metadata: { ...metadata, golden_scene: true, presentation_only: true },
});

export function createGoldenScene(layer: GoldenSpatialLayer): WorldScene {
  const common = {
    schema_version: "1.0", renderer: "AllphaWorldRenderer",
    environment: { architecture: "Crystal AI City", biome: "premium-ai-tech", spatial_layer: layer, golden_theme: GOLDEN_THEME_KEY, visual_language: "3d-v2.01", presentation_only: true },
    terrain: { type: "spatial-platform", presentation_only: true },
    lighting: { key: "cyan-silhouette", fill: "deep-space", accent: "violet-intelligence", presentation_only: true },
    atmosphere: { depth: "cinematic-cosmic", haze: "neural-particles", stars: true, presentation_only: true },
    zones: [{ id: "golden-core-zone", type: "universe-core", capacity: 0 }, { id: "golden-orbit-zone", type: "orbital-field", capacity: 0 }],
    spawn_points: [{ id: "golden-spawn", zone: "golden-core-zone", position: { x: 0, y: 0, z: 6 } }],
    camera: { mobile: { position: [0, 5.2, 12], fov: 48 }, desktop: { position: [0, 7.5, 17], fov: 52 }, min_distance: 6, max_distance: 28 },
    performance_budget: { mobile: "golden-scene-reference", low_power: true, transparency_budget: "controlled" },
    accessibility: { reduced_motion: true, color_independent_state: true, touch_target_px: 44 },
    animation: { vocabulary: ["float", "orbit", "pulse", "drift", "glow"], reduced_motion: "static-state" },
    materials: { family: ["deepSpace", "luminousCore", "holographicGlass", "architecturalMetal", "signalFx"] },
    authority_boundary: { presentation_only: true as const },
  };
  if (layer === "universe") return { ...common, structures: [
    node("universe-core", { x: 0, y: 0, z: 0 }, "universe-core"),
    node("universe-ring-1", { x: 0, y: 0, z: 0 }, "orbit-ring", { radius: 3.4, tilt: 0.12 }),
    node("universe-ring-2", { x: 0, y: 0, z: 0 }, "orbit-ring", { radius: 5.4, tilt: -0.28 }),
    node("universe-ring-3", { x: 0, y: 0, z: 0 }, "orbit-ring", { radius: 7.5, tilt: 0.48 }),
    node("galaxy-anchor-alpha", { x: -4.8, y: 1.2, z: -1.5 }, "galaxy-node", { label: "Galaxy Alpha" }),
    node("galaxy-anchor-beta", { x: 4.6, y: -0.2, z: 0.5 }, "galaxy-node", { label: "Galaxy Beta" }),
    node("galaxy-anchor-gamma", { x: -2.0, y: -1.0, z: 5.5 }, "galaxy-node", { label: "Galaxy Gamma" }),
  ], portals: [] };
  if (layer === "galaxy") return { ...common, structures: [
    node("galaxy-core", { x: 0, y: 0, z: 0 }, "galaxy-core"),
    node("galaxy-ring-primary", { x: 0, y: 0, z: 0 }, "orbit-ring", { radius: 3.2, tilt: 0.18 }),
    node("galaxy-ring-secondary", { x: 0, y: 0, z: 0 }, "orbit-ring", { radius: 5.1, tilt: -0.32 }),
    node("world-node-1", { x: 3.1, y: 0.8, z: 0 }, "world-node", { label: "World One" }),
    node("world-node-2", { x: -2.7, y: -0.5, z: 1.1 }, "world-node", { label: "World Two" }),
    node("world-node-3", { x: 0.7, y: 1.0, z: -4.5 }, "world-node", { label: "World Three" }),
    node("world-node-4", { x: 0, y: -0.7, z: 4.4 }, "world-node", { label: "World Four" }),
  ], portals: [] };
  return { ...common, structures: [
    node("orbit-core", { x: 0, y: 0, z: 0 }, "orbit-core"),
    node("orbit-ring-a", { x: 0, y: 0, z: 0 }, "orbit-ring", { radius: 2.8, tilt: 0.2 }),
    node("orbit-ring-b", { x: 0, y: 0, z: 0 }, "orbit-ring", { radius: 4.2, tilt: -0.38 }),
    ...Array.from({ length: 8 }, (_, index) => {
      const angle = (index / 8) * Math.PI * 2;
      return node("orbit-node-" + index, { x: Math.cos(angle) * 3.6, y: Math.sin(angle * 2) * 0.45, z: Math.sin(angle) * 3.6 }, "orbit-node", { index, label: "Orbit Node " + (index + 1) });
    }),
  ], portals: [] };
}

export const GOLDEN_SCENE_SET = { universe: createGoldenScene("universe"), galaxy: createGoldenScene("galaxy"), orbit: createGoldenScene("orbit") } as const;