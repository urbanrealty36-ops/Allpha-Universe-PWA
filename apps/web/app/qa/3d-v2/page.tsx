"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { WorldScene } from "../../../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(() => import("../../../components/world/allpha-world-renderer"), { ssr: false });

const THEMES = ["aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city","desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden","galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier","mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis","pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord"] as const;

export default function ThreeDV2RuntimePage() {
  const params = useSearchParams();
  const requested = params.get("theme") || "crystal-ai-city";
  const themeKey = THEMES.includes(requested as (typeof THEMES)[number]) ? requested : "crystal-ai-city";
  const scene = useMemo<WorldScene>(() => ({
    schema_version: "1.0",
    renderer: "AllphaWorldRenderer",
    environment: { spatial_layer: "world", theme_key: themeKey, architecture: themeKey, spatial_runtime: "theme-v2" },
    terrain: { type: "theme-v2-production" },
    structures: [
      { id: "core", kind: "world-core", position: { x: 0, y: 0, z: 0 }, presentation_only: true },
      { id: "north", kind: "district", position: { x: -3.2, y: 0, z: -1.8 }, presentation_only: true },
      { id: "south", kind: "district", position: { x: 3.2, y: 0, z: 1.2 }, presentation_only: true },
    ],
    roads: [], pathways: [], zones: [{ id: "runtime-qa", type: "world", capacity: 25 }], booths: [], portals: [], signage: [], screens: [],
    lighting: { preset: "cinematic" }, atmosphere: { preset: "theme-v2" },
    spawn_points: [{ id: "runtime-qa-spawn", zone: "runtime-qa", position: { x: 0, y: 0, z: 0 } }],
    navigation_graph: { nodes: [], edges: [] }, camera: { mode: "orbit" },
    performance_budget: { quality: "production" }, accessibility: { reduced_motion_supported: true },
    animation: { mode: "theme-v2" }, materials: { mode: "theme-v2" }, authority_boundary: { presentation_only: true },
  }), [themeKey]);

  return (
    <main className="min-h-screen bg-[#02040b] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-200/55">Allpha 3D Runtime QA</p>
          <h1 data-testid="v2-runtime-theme" data-theme={themeKey} className="mt-1 text-sm font-semibold">{themeKey}</h1>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-1 text-[9px] text-emerald-100/70">LIVE MANIFEST → SIGNED GLB</span>
      </header>
      <section className="h-[calc(100svh-61px)] min-h-[520px]"><AllphaWorldRenderer scene={scene} lowPower={false} /></section>
    </main>
  );
}
