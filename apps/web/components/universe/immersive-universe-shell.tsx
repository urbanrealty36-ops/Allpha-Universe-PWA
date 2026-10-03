"use client";

import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { apiFetch } from "../../lib/api";
import type { SceneNode } from "../../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(
  () => import("../world/allpha-world-renderer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[520px] items-center justify-center text-sm text-white/50">
        Preparing world…
      </div>
    ),
  },
);

type Level = "galaxy" | "world" | "district" | "booth";
type Galaxy = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility?: string;
};
type World = {
  id: string;
  galaxy_id: string;
  name: string;
  slug: string;
  description?: string | null;
  world_type: string;
  theme_key?: string | null;
  spatial_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};
type District = {
  id: string;
  world_id: string;
  name: string;
  slug: string;
  description?: string | null;
  district_type: string;
  theme_key?: string | null;
  visibility?: string;
  spatial_config?: Record<string, unknown>;
};
type Booth = {
  id: string;
  district_id: string;
  name: string;
  slug: string;
  booth_type: string;
  description?: string | null;
  theme_key?: string | null;
  scene_config?: Record<string, unknown>;
  display_config?: Record<string, unknown>;
};
type Theme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  catalog_order?: number | null;
  tokens?: Record<string, unknown>;
  world_schema?: any;
  theme_version?: number | null;
};
type Content = {
  id: string;
  title?: string | null;
  excerpt?: string | null;
  content_type?: string;
  owner_display_name?: string | null;
  gravity_reason_codes?: string[];
  gravity_score?: number;
  rank_score?: number;
};
type Capsule = {
  id?: string;
  summary?: string | null;
  key_points?: unknown[];
  source_metadata?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
  confidence?: number | null;
  generated_by?: string | null;
  model_reference?: string | null;
};
type Portal = {
  id: string;
  target_world_id: string;
  name: string;
  access_policy?: string;
  metadata?: Record<string, unknown>;
};
type Presence = {
  id?: string;
  world_id: string;
  agent_id: string;
  state?: string;
  activity?: string | null;
  context?: Record<string, unknown>;
  position?: { x: number; y: number; z: number };
};
type SpatialBooth = Booth & {
  spatial_projection?: {
    position?: { x: number; y: number; z: number } | null;
    spatial_anchor?: { x: number; y: number; z: number } | null;
    presentation_only?: boolean;
  };
  asset_manifest?: Array<{ signed_url?: string | null; metadata?: Record<string, unknown> }>;
};
type SpatialComposition = {
  district: District;
  spatial_projection?: { spatial_config?: Record<string, unknown> };
  zones: Array<{ id: string; zone_key?: string; name?: string; zone_type?: string; spatial_config?: Record<string, unknown> }>;
  booths: SpatialBooth[];
  spatial_presence: Presence[];
};

const levelLabels: Record<Level, string> = {
  galaxy: "Galaxy",
  world: "World",
  district: "District",
  booth: "Booth",
};

const stageDescriptions: Record<Level, string> = {
  galaxy: "Orbit the living atlas, then enter a real Galaxy to travel inward.",
  world: "Worlds are living destinations. Portals, Content and Agent presence stay in the same spatial context.",
  district: "Zoom into a District. Booths, Characters and Content become places you can approach.",
  booth: "Enter a Booth as a spatial object while authority remains server-side.",
};

export default function ImmersiveUniverseShell() {
  const [level, setLevel] = useState<Level>("galaxy");
  const [galaxies, setGalaxies] = useState<Galaxy[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [themePackUrl, setThemePackUrl] = useState<string | null>(null);
  const [transitionLabel, setTransitionLabel] = useState("Entering spatial layer…");
  const [content, setContent] = useState<Content[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [composition, setComposition] = useState<SpatialComposition | null>(null);
  const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<SpatialBooth | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [selectedPresence, setSelectedPresence] = useState<Presence | null>(null);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [capsuleTitle, setCapsuleTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBase() {
    setLoading(true);
    setError(null);
    try {
      const [g, t, d] = await Promise.all([
        apiFetch<{ data: Galaxy[] }>("/api/v1/universe/galaxies"),
        apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog"),
        apiFetch<{ content: Content[] | { data?: Content[] } }>(
          "/api/v1/discovery/home?surface=home&limit=16",
        ),
      ]);
      setGalaxies(g.data ?? []);
      setThemes(t.data ?? []);
      setSelectedTheme(null);
      setContent(Array.isArray(d.content) ? d.content : (d.content?.data ?? []));
      setPortals([]);
      setPresence([]);
      setComposition(null);
      if (g.data?.[0]) {
        setSelectedGalaxy(g.data[0]);
        const w = await apiFetch<{ data: World[] }>(
          `/api/v1/universe/worlds?galaxy_id=${g.data[0].id}&limit=100`,
        );
        setWorlds(w.data ?? []);
      } else {
        setWorlds([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNIVERSE_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBase();
  }, []);

  function beginTransition(label = "Entering spatial layer…") {
    setTransitionLabel(label);
    setTransitioning(true);
    window.setTimeout(() => setTransitioning(false), 760);
  }

  async function selectGalaxy(galaxy: Galaxy) {
    setBusy(true);
    setError(null);
    beginTransition(`Entering ${galaxy.name}…`);
    setSelectedGalaxy(galaxy);
    setSelectedWorld(null);
    setSelectedDistrict(null);
    setSelectedBooth(null);
    setSelectedContent(null);
    setSelectedPortal(null);
    setSelectedPresence(null);
    setComposition(null);
    try {
      const r = await apiFetch<{ data: World[] }>(
        `/api/v1/universe/worlds?galaxy_id=${galaxy.id}&limit=100`,
      );
      setWorlds(r.data ?? []);
      setPortals([]);
      setPresence([]);
      setLevel("world");
    } catch (e) {
      setError(e instanceof Error ? e.message : "WORLD_LOAD_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function selectWorld(world: World) {
    setBusy(true);
    setError(null);
    beginTransition(`Entering ${world.name}…`);
    setSelectedWorld(world);
    setSelectedDistrict(null);
    setSelectedBooth(null);
    setSelectedContent(null);
    setSelectedPortal(null);
    setSelectedPresence(null);
    setComposition(null);
    try {
      const [d, c, p, a] = await Promise.all([
        apiFetch<{ data: District[] }>(
          `/api/v1/districts?world_id=${world.id}&limit=100`,
        ),
        apiFetch<{ data: Content[] }>(
          `/api/v1/universe/worlds/${world.id}/content`,
        ),
        apiFetch<{ data: Portal[] }>(
          `/api/v1/universe/worlds/${world.id}/portals`,
        ),
        apiFetch<{ data: Presence[] }>(
          `/api/v1/universe/worlds/${world.id}/presence`,
        ),
      ]);
      setDistricts(d.data ?? []);
      setPortals(p.data ?? []);
      setPresence(a.data ?? []);
      if (c.data?.length) {
        const linkedIds = new Set(
          c.data.map((row: any) => row.content_id).filter(Boolean),
        );
        setContent((previous) =>
          previous.filter((item) => linkedIds.has(item.id)),
        );
      }
      setLevel("district");
    } catch (e) {
      setError(e instanceof Error ? e.message : "DISTRICT_LOAD_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function selectDistrict(district: District) {
    setBusy(true);
    setError(null);
    beginTransition(`Descending into ${district.name}…`);
    setSelectedDistrict(district);
    setSelectedBooth(null);
    setSelectedContent(null);
    setSelectedPortal(null);
    setSelectedPresence(null);
    try {
      const r = await apiFetch<{ data: SpatialComposition }>(
        `/api/v1/themes/world-runtime/districts/${district.id}/composition`,
      );
      setComposition(r.data ?? null);
      setBooths(r.data?.booths ?? []);
      setPresence(r.data?.spatial_presence ?? []);
      setLevel("booth");
    } catch (e) {
      setError(e instanceof Error ? e.message : "BOOTH_COMPOSITION_LOAD_FAILED");
      try {
        const fallback = await apiFetch<{ data: Booth[] }>(
          `/api/v1/booths?district_id=${district.id}&limit=100`,
        );
        setBooths(fallback.data ?? []);
        setComposition(null);
        setLevel("booth");
      } catch {
        setBooths([]);
      }
    } finally {
      setBusy(false);
    }
  }

  function selectBooth(booth: SpatialBooth) {
    beginTransition(`Entering ${booth.name}…`);
    setSelectedBooth(booth);
    setSelectedContent(null);
    setMobileHudOpen(true);
  }

  async function openCapsule(item: Content) {
    setSelectedContent(item);
    setCapsuleTitle(item.title || "AI Capsule");
    setCapsule(null);
    setMobileHudOpen(true);
    try {
      const r = await apiFetch<{ data: Capsule | null }>(
        `/api/v1/content/${item.id}/ai-capsule`,
      );
      setCapsule(r.data ?? null);
    } catch {
      setCapsule(null);
    }
  }

  function selectPortal(portal: Portal) {
    setSelectedPortal(portal);
    setMobileHudOpen(true);
    const target = worlds.find((world) => world.id === portal.target_world_id);
    if (target) {
      void selectWorld(target);
    }
  }

  const activeTheme = useMemo(() => {
    const key =
      selectedBooth?.theme_key ||
      selectedDistrict?.theme_key ||
      selectedWorld?.theme_key;
    return themes.find((t) => t.slug === key || t.id === key || t.catalog_key === key) ?? selectedTheme ?? null;
  }, [selectedWorld, selectedDistrict, selectedBooth, selectedTheme, themes]);

  const scene = activeTheme?.world_schema ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadThemePack() {
      setThemePackUrl(null);
      if (!activeTheme?.id) return;
      try {
        const response = await apiFetch<{
          data?: {
            has_binary_3d_pack?: boolean;
            binary_3d_assets?: Array<{ signed_url?: string | null; metadata?: Record<string, unknown> }>;
          };
        }>(`/api/v1/themes/world-runtime/themes/${activeTheme.id}/asset-manifest`);
        const url = response.data?.binary_3d_assets?.find((asset) => typeof asset.signed_url === "string")?.signed_url;
        if (!cancelled) setThemePackUrl(url ?? null);
      } catch {
        if (!cancelled) setThemePackUrl(null);
      }
    }
    void loadThemePack();
    return () => {
      cancelled = true;
    };
  }, [activeTheme?.id]);

  function goBack() {
    beginTransition();
    setMobileHudOpen(false);
    setSelectedContent(null);
    setSelectedPortal(null);
    if (level === "booth") {
      setSelectedBooth(null);
      setLevel("district");
      return;
    }
    if (level === "district") {
      setSelectedDistrict(null);
      setLevel("world");
      return;
    }
    if (level === "world") {
      setSelectedWorld(null);
      setLevel("galaxy");
    }
  }

  const visibleBooths: SceneNode[] = (composition?.booths ?? booths).map((booth, index) => {
    const position = booth.spatial_projection?.position;
    const modelUrl = booth.asset_manifest?.find((asset) => asset.signed_url)?.signed_url;
    return {
      id: booth.id,
      position: position ?? {
        x: (index % 4) * 2.8 - 4.2,
        y: 0,
        z: Math.floor(index / 4) * 2.8 - 2.8,
      },
      scale: { x: 1, y: 1, z: 1 },
      kind: "booth",
      presentation_only: true,
      metadata: { model_url: modelUrl ?? undefined, booth_name: booth.name },
    };
  });

  return (
    <main className="min-h-screen overflow-hidden bg-[#03050b] text-white">
      <div className="relative min-h-screen">
        <UniverseBackdrop level={level} theme={activeTheme} />

        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-6">
          <div className="pointer-events-auto mb-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[.16em] text-white/50"><span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">Theme: {activeTheme?.catalog_key || activeTheme?.slug || "unbound"}</span><span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">Version: {activeTheme?.theme_version ?? "—"}</span><span className={themePackUrl?"rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-emerald-200":"rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-amber-200"}>3D Pack: {themePackUrl?"active":"procedural fallback"}</span></div><div className="pointer-events-auto flex items-start justify-between gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 shadow-2xl backdrop-blur-2xl sm:rounded-full sm:px-5 sm:py-2.5">
              <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-300">Allpha AI · Living Universe</p>
              <div className="mt-1 flex max-w-[78vw] items-center gap-1 overflow-x-auto whitespace-nowrap text-[10px] text-white/65 sm:text-xs">
                <button onClick={() => { setLevel("galaxy"); setSelectedGalaxy(null); setSelectedWorld(null); setSelectedDistrict(null); setSelectedBooth(null); }} className="hover:text-white">Universe</button>
                {selectedGalaxy && <><span className="text-white/20">/</span><button onClick={() => { setLevel("world"); setSelectedWorld(null); setSelectedDistrict(null); setSelectedBooth(null); }} className="hover:text-white">{selectedGalaxy.name}</button></>}
                {selectedWorld && <><span className="text-white/20">/</span><button onClick={() => { setLevel("district"); setSelectedDistrict(null); setSelectedBooth(null); }} className="hover:text-white">{selectedWorld.name}</button></>}
                {selectedDistrict && <><span className="text-white/20">/</span><span>{selectedDistrict.name}</span></>}
              </div>
            </div>
            <div className="flex gap-2">
              <a href="/theme-studio" className="pointer-events-auto rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-[10px] text-cyan-100 backdrop-blur-xl hover:border-cyan-300/40">Theme Studio</a>
              {activeTheme && (
                <span className="pointer-events-auto rounded-full border border-violet-300/20 bg-violet-300/5 px-3 py-2 text-[10px] text-violet-100 backdrop-blur-xl">
                  Theme · {activeTheme.name}
                </span>
              )}
              {level !== "galaxy" && (
                <button onClick={goBack} className="pointer-events-auto rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] text-white/65 backdrop-blur-xl hover:text-white">← Back</button>
              )}
              <button onClick={() => void loadBase()} className="pointer-events-auto rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] text-white/65 backdrop-blur-xl hover:text-white">Refresh</button>
            </div>
          </div>
        </header>

        <section className="relative z-10 min-h-screen">
          <div className="absolute inset-0">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-white/40">Loading authoritative Universe…</div>
            ) : (
              <ImmersiveStage
                level={level}
                galaxies={galaxies}
                themes={themes}
                selectedThemeId={selectedTheme?.id}
                onTheme={(theme) => {
                  setSelectedTheme(theme);
                  setMobileHudOpen(true);
                  setError(null);
                  beginTransition(`Activating ${theme.name}…`);
                }}
                worlds={worlds}
                districts={districts}
                booths={visibleBooths}
                presence={presence}
                portals={portals}
                content={content}
                activeTheme={activeTheme}
                selectedWorldId={selectedWorld?.id}
                selectedDistrictId={selectedDistrict?.id}
                selectedBoothId={selectedBooth?.id}
                transitioning={transitioning}
                onWorld={selectWorld}
                onDistrict={selectDistrict}
                onBooth={(node) => {
                  const booth = (composition?.booths ?? booths).find((item) => item.id === node.id);
                  if (booth) selectBooth(booth);
                }}
                onPortal={selectPortal}
                onContent={(item) => void openCapsule(item)}
                onPresence={(item) => {
                  setMobileHudOpen(true);
                  setSelectedContent(null);
                  setSelectedBooth(null);
                  setSelectedPortal(null);
                  setSelectedPresence(item);
                  setError(null);
                }}
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="pointer-events-auto mx-auto flex max-w-6xl flex-col gap-3">
              {error && <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-xs text-red-100 backdrop-blur-xl">{error}</div>}

              <div
                className="rounded-[1.75rem] border border-white/10 bg-black/45 p-4 shadow-2xl backdrop-blur-2xl transition-all duration-300 sm:p-5"
                onTouchStart={(event) => {
                  const start = event.changedTouches[0]?.clientY ?? 0;
                  event.currentTarget.dataset.touchY = String(start);
                }}
                onTouchEnd={(event) => {
                  const start = Number(event.currentTarget.dataset.touchY ?? 0);
                  const end = event.changedTouches[0]?.clientY ?? start;
                  if (start - end > 42) setMobileHudOpen(true);
                  if (end - start > 42) setMobileHudOpen(false);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-violet-300">Spatial HUD</p>
                    <h1 className="mt-1 text-lg font-semibold sm:text-2xl">
                      {selectedBooth?.name || selectedDistrict?.name || selectedWorld?.name || selectedGalaxy?.name || "Enter the Universe"}
                    </h1>
                  </div>
                  <button
                    onClick={() => setMobileHudOpen((open) => !open)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/55 hover:text-white sm:hidden"
                  >
                    {mobileHudOpen ? "Collapse" : "Explore"}
                  </button>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${mobileHudOpen ? "mt-3 max-h-72 opacity-100" : "max-h-0 opacity-0 sm:mt-3 sm:max-h-40 sm:opacity-100"}`}>
                  <p className="max-w-2xl text-xs leading-5 text-white/50">{stageDescriptions[level]}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-white/45">
                    <span className="rounded-full border border-white/10 px-2.5 py-1">Server-authoritative</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">Touch / drag to orbit</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{presence.length} Agent presence</span>
                    {selectedPresence && <span className="max-w-[240px] truncate rounded-full border border-emerald-300/20 bg-emerald-300/5 px-2.5 py-1 text-emerald-100">Agent {selectedPresence.agent_id.slice(0, 8)} · {selectedPresence.state ?? "present"}</span>}
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{content.length} spatial Content</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{portals.length} Portal</span>
                  </div>
                </div>
              </div>

              <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-black/35 px-2 py-2 shadow-2xl backdrop-blur-2xl">
                <span className="shrink-0 px-3 text-[9px] uppercase tracking-[0.22em] text-white/35">
                  {level === "galaxy" ? "Galaxy" : level === "world" ? "World" : level === "district" ? "District" : "Booth"}
                </span>
                {(level === "galaxy" ? galaxies : level === "world" ? worlds : level === "district" ? districts : (composition?.booths ?? booths))
                  .slice(0, 10)
                  .map((item: any) => {
                    const id = item.id;
                    const selectedId = level === "galaxy" ? selectedGalaxy?.id : level === "world" ? selectedWorld?.id : level === "district" ? selectedDistrict?.id : selectedBooth?.id;
                    const active = selectedId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          if (level === "galaxy") void selectGalaxy(item as Galaxy);
                          if (level === "world") void selectWorld(item as World);
                          if (level === "district") void selectDistrict(item as District);
                          if (level === "booth") selectBooth(item as SpatialBooth);
                        }}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] transition ${active ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-50" : "border-white/8 text-white/45 hover:border-white/20 hover:text-white"}`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                {level === "world" && portals.length > 0 && (
                  <span className="shrink-0 border-l border-white/10 pl-2 text-[10px] text-fuchsia-200/70">{portals.length} portals</span>
                )}
                {level !== "galaxy" && presence.length > 0 && (
                  <span className="shrink-0 border-l border-white/10 pl-2 text-[10px] text-emerald-200/70">{presence.length} agents</span>
                )}
                {content.length > 0 && (
                  <span className="shrink-0 border-l border-white/10 pl-2 text-[10px] text-amber-100/70">{content.length} content</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {transitioning && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-[#03050b]/70 backdrop-blur-[2px]" />
            <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15 shadow-[0_0_120px_rgba(34,211,238,0.16)] animate-ping" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-200/30 bg-violet-400/10 shadow-[0_0_80px_rgba(139,92,246,0.45)] backdrop-blur-xl" />
            <div className="absolute inset-x-0 bottom-[18%] text-center">
              <p className="text-[9px] uppercase tracking-[0.35em] text-cyan-200/60">Spatial Transition</p>
              <p className="mt-2 text-lg font-medium text-white">{transitionLabel}</p>
              {activeTheme && <p className="mt-1 text-[10px] text-white/35">Theme · {activeTheme.name}</p>}
            </div>
          </div>
        )}

        {capsuleTitle && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-md sm:items-center sm:p-6" onClick={() => setCapsuleTitle("")}>
            <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#090c15]/95 p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-violet-300">AI Capsule · spatial insight</p>
                  <h2 className="mt-2 text-2xl font-semibold">{capsuleTitle}</h2>
                </div>
                <button onClick={() => setCapsuleTitle("")} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Close</button>
              </div>
              {!capsule ? (
                <p className="mt-6 text-sm leading-6 text-white/45">No reviewed AI Capsule is available for this Content yet.</p>
              ) : (
                <>
                  <p className="mt-6 text-sm leading-6 text-white/75">{capsule.summary || "No summary available."}</p>
                  {!!capsule.key_points?.length && (
                    <div className="mt-5 space-y-2">
                      {capsule.key_points.slice(0, 8).map((point, index) => (
                        <div key={index} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
                          {typeof point === "string" ? point : JSON.stringify(point)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap gap-2 text-[9px] text-white/35">
                    {capsule.generated_by && <span className="rounded-full border border-white/10 px-2 py-1">Generated by {capsule.generated_by}</span>}
                    {capsule.model_reference && <span className="rounded-full border border-white/10 px-2 py-1">{capsule.model_reference}</span>}
                    {typeof capsule.confidence === "number" && <span className="rounded-full border border-white/10 px-2 py-1">Confidence {(capsule.confidence * 100).toFixed(0)}%</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ImmersiveStage({
  level,
  galaxies,
  themes,
  selectedThemeId,
  onTheme,
  worlds,
  districts,
  booths,
  presence,
  portals,
  content,
  activeTheme,
  selectedWorldId,
  selectedBoothId,
  transitioning,
  onWorld,
  onDistrict,
  onBooth,
  onPortal,
  onContent,
  onPresence,
}: {
  level: Level;
  galaxies: Galaxy[];
  themes: Theme[];
  selectedThemeId?: string;
  onTheme: (theme: Theme) => void;
  worlds: World[];
  districts: District[];
  booths: SceneNode[];
  presence: Presence[];
  portals: Portal[];
  content: Content[];
  activeTheme: Theme | null;
  selectedWorldId?: string;
  selectedBoothId?: string;
  transitioning: boolean;
  onWorld: (world: World) => void;
  onDistrict: (district: District) => void;
  onBooth: (node: SceneNode) => void;
  onPortal: (portal: Portal) => void;
  onContent: (content: Content) => void;
  onPresence: (presence: Presence) => void;
}) {
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const update = () => setLowPower(window.innerWidth < 768 || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (level === "galaxy") {
    return (
      <div className={`h-screen w-full transition-all duration-500 ${transitioning ? "scale-[1.04] opacity-40 blur-[1px]" : "scale-100 opacity-100"}`}>
        <Canvas dpr={lowPower ? [1, 1.15] : [1, 1.6]} performance={{ min: 0.55 }} gl={{ antialias: !lowPower, powerPreference: lowPower ? "low-power" : "high-performance" }}>
          <PerspectiveCamera makeDefault position={[0, 3.8, 13]} fov={54} />
          <ambientLight intensity={0.55} />
          <pointLight position={[0, 4, 0]} intensity={24} color="#7c3aed" />
          <GalaxyScene galaxies={galaxies} themes={themes} selectedThemeId={selectedThemeId} onTheme={onTheme} />
          <OrbitControls enablePan={false} minDistance={7} maxDistance={20} autoRotate={!lowPower} autoRotateSpeed={0.16} enableDamping dampingFactor={0.08} />
        </Canvas>
      </div>
    );
  }

  if (level === "world") {
    return (
      <div className={`h-screen w-full transition-all duration-500 ${transitioning ? "scale-[0.94] opacity-45 blur-[1px]" : "scale-100 opacity-100"}`}>
        <Canvas dpr={lowPower ? [1, 1.15] : [1, 1.6]} performance={{ min: 0.55 }} gl={{ antialias: !lowPower, powerPreference: lowPower ? "low-power" : "high-performance" }}>
          <PerspectiveCamera makeDefault position={[0, 5.8, 15]} fov={56} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 4]} intensity={2.2} />
          <WorldNavigationScene worlds={worlds} portals={portals} content={content} presence={presence} activeTheme={activeTheme} onWorld={onWorld} onPortal={onPortal} onContent={onContent} onPresence={onPresence} />
          <OrbitControls enablePan={false} minDistance={7} maxDistance={22} enableDamping dampingFactor={0.09} />
        </Canvas>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full transition-all duration-500 ${transitioning ? "scale-[1.06] opacity-45 blur-[1px]" : "scale-100 opacity-100"}`}>
      <AllphaWorldRenderer
        scene={activeTheme?.world_schema}
        themePackUrl={themePackUrl}
        tokens={activeTheme?.tokens}
        lowPower={lowPower}
        booths={booths}
        presence={presence.map((item) => ({
          id: item.id ?? item.agent_id,
          agent_id: item.agent_id,
          movement_state: item.state ?? "present",
          position: item.position,
        }))}
        portals={portals.map((portal, index) => ({
          id: portal.id,
          target: portal.target_world_id,
          position: {
            x: Number(portal.metadata?.x ?? 0) + (index % 3) * 2.5,
            y: Number(portal.metadata?.y ?? 0),
            z: Number(portal.metadata?.z ?? -4) + Math.floor(index / 3) * 2.5,
          },
          presentation_only: true,
        }))}
        content={content}
        selectedBoothId={selectedBoothId}
        selectedDistrictId={selectedDistrictId}
        onHotspot={(node) => {
          if (node.kind === "booth") onBooth(node);
          if (node.kind === "portal") {
            const portal = portals.find((item) => item.id === node.id);
            if (portal) onPortal(portal);
          }
          if (node.kind === "content") {
            const item = content.find((entry) => entry.id === node.id);
            if (item) onContent(item);
          }
          if (node.kind === "character") {
            const agent = presence.find((item) => (item.id ?? item.agent_id) === node.id);
            if (agent) onPresence(agent);
          }
        }}
      />
    </div>
  );
}

function GalaxyScene({
  galaxies,
  themes,
  selectedThemeId,
  onTheme,
}: {
  galaxies: Galaxy[];
  themes: Theme[];
  selectedThemeId?: string;
  onTheme: (theme: Theme) => void;
}) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.55, 48, 48]} />
        <meshStandardMaterial color="#0b1224" emissive="#6d28d9" emissiveIntensity={0.9} metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.25, 0.055, 10, 128]} />
        <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={1.4} transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2.25, 0.25, 0]}>
        <torusGeometry args={[3.2, 0.025, 8, 128]} />
        <meshStandardMaterial color="#a78bfa" emissive="#8b5cf6" emissiveIntensity={1.1} transparent opacity={0.65} />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div className="rounded-full border border-cyan-200/20 bg-slate-950/65 px-4 py-2 text-center shadow-2xl backdrop-blur-xl">
          <div className="text-[8px] uppercase tracking-[0.3em] text-cyan-200/60">Allpha AI Social Universe</div>
          <div className="mt-1 text-sm font-semibold text-white">Explore the living Galaxy</div>
          <div className="mt-1 text-[8px] text-white/40">{galaxies.length ? `${galaxies.length} published Galaxy${galaxies.length === 1 ? "" : "ies"}` : "No published Galaxy yet"}</div>
        </div>
      </Html>

      {galaxies.slice(0, 24).map((galaxy, index) => {
        const angle = (index / Math.max(1, galaxies.length)) * Math.PI * 2;
        const radius = 4.6 + (index % 3) * 0.65;
        return (
          <group key={galaxy.id} position={[Math.cos(angle) * radius, Math.sin(index * 0.71) * 1.1, Math.sin(angle) * radius]}>
            <mesh>
              <icosahedronGeometry args={[0.55 + (index % 3) * 0.08, 1]} />
              <meshStandardMaterial color={index % 2 ? "#22d3ee" : "#8b5cf6"} emissive={index % 2 ? "#22d3ee" : "#8b5cf6"} emissiveIntensity={1.15} metalness={0.5} roughness={0.35} />
            </mesh>
            <Html center distanceFactor={9} style={{ pointerEvents: "none" }}>
              <div className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[9px] text-white/70 backdrop-blur-xl">{galaxy.name}</div>
            </Html>
          </group>
        );
      })}

      <Html position={[-5.8, -2.9, 0]} center distanceFactor={11} style={{ pointerEvents: "none" }}>
        <div className="max-w-[220px] rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-[9px] leading-4 text-white/40 backdrop-blur-xl">
          <span className="text-cyan-200/70">3D Theme Templates</span><br />
          {themes.length} published platform themes provide the visual language for Worlds. Theme Templates are configuration, not business records.
        </div>
      </Html>

      {themes.slice(0, 25).map((theme, index) => {
        const angle = (index / Math.max(1, Math.min(themes.length, 25))) * Math.PI * 2 + 0.18;
        const radius = 7.2 + (index % 3) * 0.45;
        const selected = selectedThemeId === theme.id;
        return (
          <group
            key={`theme-${theme.id}`}
            position={[Math.cos(angle) * radius, Math.sin(index * 0.44) * 1.7, Math.sin(angle) * radius]}
            onClick={(event) => {
              event.stopPropagation();
              onTheme(theme);
            }}
          >
            <mesh scale={selected ? 1.8 : 1}>
              <sphereGeometry args={[0.09 + (index % 2) * 0.025, 12, 12]} />
              <meshStandardMaterial
                color={selected ? "#ffffff" : index % 2 ? "#67e8f9" : "#c4b5fd"}
                emissive={selected ? "#ffffff" : index % 2 ? "#22d3ee" : "#8b5cf6"}
                emissiveIntensity={selected ? 3 : 1.7}
              />
            </mesh>
            <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
              <div className={`whitespace-nowrap rounded-full border px-2 py-1 text-[8px] backdrop-blur-xl ${selected ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-black/35 text-white/50"}`}>
                {theme.name}
              </div>
            </Html>
          </group>
        );
      })}
      <StarsField />
    </group>
  );
}

function WorldNavigationScene({
  worlds,
  portals,
  content,
  presence,
  activeTheme,
  onWorld,
  onPortal,
  onContent,
  onPresence,
}: {
  worlds: World[];
  portals: Portal[];
  content: Content[];
  presence: Presence[];
  activeTheme: Theme | null;
  onWorld: (world: World) => void;
  onPortal: (portal: Portal) => void;
  onContent: (content: Content) => void;
  onPresence: (presence: Presence) => void;
}) {
  return (
    <group>
      {activeTheme && (
        <Html position={[0, 3.4, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div className="rounded-2xl border border-violet-200/15 bg-slate-950/55 px-4 py-2 text-center shadow-2xl backdrop-blur-xl">
            <div className="text-[8px] uppercase tracking-[0.28em] text-violet-200/55">Active World Theme</div>
            <div className="mt-1 text-sm font-medium text-white">{activeTheme.name}</div>
          </div>
        </Html>
      )}
      <mesh position={[0, -0.5, 0]>
        <cylinderGeometry args={[8, 8, 0.5, 64]} />
        <meshStandardMaterial color="#0b1020" metalness={0.35} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.7, 7.2, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.35} transparent opacity={0.7} />
      </mesh>

      {worlds.map((world, index) => {
        const angle = (index / Math.max(1, worlds.length)) * Math.PI * 2;
        const radius = 4.6;
        return (
          <group key={world.id} position={[Math.cos(angle) * radius, 0.35 + Math.sin(index * 0.8) * 0.4, Math.sin(angle) * radius]}>
            <mesh onClick={() => onWorld(world)} onPointerOver={(event) => (event.stopPropagation(), (event.object.scale.setScalar(1.12)))} onPointerOut={(event) => event.object.scale.setScalar(1)}>
              <icosahedronGeometry args={[1.05, 1]} />
              <meshStandardMaterial color={index % 2 ? "#0ea5e9" : "#8b5cf6"} emissive={index % 2 ? "#0ea5e9" : "#8b5cf6"} emissiveIntensity={0.45} metalness={0.45} roughness={0.4} />
            </mesh>
            <Html center distanceFactor={9} style={{ pointerEvents: "none" }}>
              <div className="rounded-xl border border-white/10 bg-black/50 px-2.5 py-1.5 text-center text-[9px] text-white/75 backdrop-blur-xl">
                <div className="font-medium">{world.name}</div>
                <div className="mt-0.5 text-[8px] text-white/35">{world.world_type}</div>
              </div>
            </Html>
          </group>
        );
      })}

      {portals.map((portal, index) => {
        const angle = (index / Math.max(1, portals.length)) * Math.PI * 2 + 0.45;
        const radius = 6.2;
        return (
          <group key={portal.id} position={[Math.cos(angle) * radius, 1, Math.sin(angle) * radius]} onClick={() => onPortal(portal)}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.75, 0.12, 12, 40]} />
              <meshStandardMaterial color="#f0abfc" emissive="#d946ef" emissiveIntensity={1.8} />
            </mesh>
            <pointLight intensity={3} distance={4} color="#d946ef" />
            <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
              <div className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-2 py-1 text-[8px] text-fuchsia-100 backdrop-blur-xl">Portal · {portal.name}</div>
            </Html>
          </group>
        );
      })}

      {content.slice(0, 12).map((item, index) => {
        const angle = index * 2.399;
        const radius = 2.3 + (index % 3) * 0.35;
        return (
          <group key={item.id} position={[Math.cos(angle) * radius, 1.25 + (index % 2) * 0.35, Math.sin(angle) * radius]} onClick={() => onContent(item)}>
            <mesh>
              <octahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.3} />
            </mesh>
          </group>
        );
      })}

      {presence.slice(0, 24).map((agent, index) => {
        const angle = index * 2.1;
        const radius = 3.2 + (index % 2) * 0.6;
        return (
          <group key={agent.id ?? agent.agent_id} position={[Math.cos(angle) * radius, 0.75, Math.sin(angle) * radius]} onClick={() => onPresence(agent)}>
            <mesh>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.1} />
            </mesh>
            <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
              <div className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2 py-1 text-[8px] text-emerald-100 backdrop-blur-xl">{agent.state ?? "present"}</div>
            </Html>
          </group>
        );
      })}

      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshStandardMaterial color={activeTheme?.tokens?.["theme.color.primary"] as string || "#111827"} emissive="#22d3ee" emissiveIntensity={0.28} transparent opacity={0.92} />
      </mesh>
      <StarsField />
    </group>
  );
}

function StarsField() {
  const points = useMemo(() => {
    const values: [number, number, number][] = [];
    for (let i = 0; i < 120; i += 1) {
      const a = i * 2.399963;
      const r = 10 + (i % 9) * 1.4;
      values.push([Math.cos(a) * r, ((i % 11) - 5) * 0.8, Math.sin(a) * r]);
    }
    return values;
  }, []);
  return (
    <group>
      {points.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function SpatialQuickList({
  title,
  items,
  selectedId,
  onSelect,
  empty = "Nothing available.",
}: {
  title: string;
  items: any[];
  selectedId?: string;
  onSelect: (item: any) => void;
  empty?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">{title}</p>
        <span className="text-[9px] text-white/25">{items.length}</span>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {items.length ? items.slice(0, 6).map((item, index) => {
          const id = item.id;
          const name = item.name || item.title || item.activity || item.state || `Object ${index + 1}`;
          return (
            <button
              key={id ?? index}
              onClick={() => onSelect(item)}
              className={`min-w-[110px] rounded-xl border px-2.5 py-2 text-left text-[9px] transition ${selectedId === id ? "border-cyan-300/50 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.025] text-white/55 hover:text-white"}`}
            >
              <span className="block truncate">{name}</span>
              {item.description && <span className="mt-1 block line-clamp-1 text-[8px] text-white/25">{item.description}</span>}
            </button>
          );
        }) : <span className="px-1 py-1 text-[9px] text-white/25">{empty}</span>}
      </div>
    </div>
  );
}

function UniverseBackdrop({ level, theme }: { level: Level; theme: Theme | null }) {
  const primary =
    typeof theme?.tokens?.["theme.color.primary"] === "string"
      ? String(theme.tokens["theme.color.primary"])
      : "#7c3aed";
  const accent =
    typeof theme?.tokens?.["theme.color.secondary"] === "string"
      ? String(theme.tokens["theme.color.secondary"])
      : "#22d3ee";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          level === "galaxy"
            ? `radial-gradient(circle at 50% 45%, ${primary}22, transparent 38%), radial-gradient(circle at 75% 20%, ${accent}14, transparent 35%), #03050b`
            : `radial-gradient(circle at 50% 45%, ${primary}20, transparent 45%), radial-gradient(circle at 20% 80%, ${accent}10, transparent 35%), #03050b`,
      }}
    />
  );
}
