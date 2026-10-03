"use client";

import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

const AllphaWorldRenderer = dynamic(
  () => import("../world/allpha-world-renderer"),
  { ssr: false, loading: () => <div className="flex h-full min-h-[520px] items-center justify-center text-sm text-white/50">Preparing world…</div> },
);

type Level = "galaxy" | "world" | "district" | "booth";
type Galaxy = { id: string; name: string; slug: string; description?: string | null; visibility?: string };
type World = { id: string; galaxy_id: string; name: string; slug: string; description?: string | null; world_type: string; theme_key?: string | null; spatial_config?: Record<string, unknown>; metadata?: Record<string, unknown> };
type District = { id: string; world_id: string; name: string; slug: string; description?: string | null; district_type: string; theme_key?: string | null; visibility?: string; spatial_config?: Record<string, unknown> };
type Booth = { id: string; district_id: string; name: string; slug: string; booth_type: string; description?: string | null; theme_key?: string | null; scene_config?: Record<string, unknown>; display_config?: Record<string, unknown> };
type Theme = { id: string; name: string; slug: string; description?: string | null; category?: string | null; catalog_order?: number | null; tokens?: Record<string, unknown>; world_schema?: any; theme_version?: number | null };
type Content = { id: string; title?: string | null; excerpt?: string | null; content_type?: string; owner_display_name?: string | null; gravity_reason_codes?: string[]; gravity_score?: number; rank_score?: number };
type Capsule = { id?: string; summary?: string | null; key_points?: unknown[]; source_metadata?: Record<string, unknown>; provenance?: Record<string, unknown>; confidence?: number | null; generated_by?: string | null; model_reference?: string | null };

const levelLabels: Record<Level, string> = { galaxy: "Galaxy", world: "World", district: "District", booth: "Booth" };

export default function ImmersiveUniverseShell() {
  const [level, setLevel] = useState<Level>("galaxy");
  const [galaxies, setGalaxies] = useState<Galaxy[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [capsuleTitle, setCapsuleTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBase() {
    setLoading(true);
    setError(null);
    try {
      const [g, t, d] = await Promise.all([
        apiFetch<{ data: Galaxy[] }>("/api/v1/universe/galaxies"),
        apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog"),
        apiFetch<{ data: Content[] }>("/api/v1/discovery/home?surface=home&limit=12"),
      ]);
      setGalaxies(g.data ?? []);
      setThemes(t.data ?? []);
      setContent(Array.isArray(d.data) ? d.data : []);
      if (g.data?.[0]) {
        setSelectedGalaxy(g.data[0]);
        const w = await apiFetch<{ data: World[] }>(`/api/v1/universe/worlds?galaxy_id=${g.data[0].id}&limit=100`);
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

  useEffect(() => { void loadBase(); }, []);

  async function selectGalaxy(galaxy: Galaxy) {
    setBusy(true); setError(null);
    setSelectedGalaxy(galaxy); setSelectedWorld(null); setSelectedDistrict(null); setSelectedBooth(null);
    try {
      const r = await apiFetch<{ data: World[] }>(`/api/v1/universe/worlds?galaxy_id=${galaxy.id}&limit=100`);
      setWorlds(r.data ?? []);
      setLevel("world");
    } catch (e) { setError(e instanceof Error ? e.message : "WORLD_LOAD_FAILED"); }
    finally { setBusy(false); }
  }

  async function selectWorld(world: World) {
    setBusy(true); setError(null);
    setSelectedWorld(world); setSelectedDistrict(null); setSelectedBooth(null);
    try {
      const [d, c] = await Promise.all([
        apiFetch<{ data: District[] }>(`/api/v1/districts?world_id=${world.id}&limit=100`),
        apiFetch<{ data: Content[] }>(`/api/v1/universe/worlds/${world.id}/content`),
      ]);
      setDistricts(d.data ?? []);
      setContent(c.data ?? []);
      setLevel("district");
    } catch (e) { setError(e instanceof Error ? e.message : "DISTRICT_LOAD_FAILED"); }
    finally { setBusy(false); }
  }

  async function selectDistrict(district: District) {
    setBusy(true); setError(null); setSelectedDistrict(district); setSelectedBooth(null);
    try {
      const r = await apiFetch<{ data: Booth[] }>(`/api/v1/booths?district_id=${district.id}&limit=100`);
      setBooths(r.data ?? []);
      setLevel("booth");
    } catch (e) { setError(e instanceof Error ? e.message : "BOOTH_LOAD_FAILED"); }
    finally { setBusy(false); }
  }

  async function openCapsule(item: Content) {
    setCapsuleTitle(item.title || "AI Capsule");
    setCapsule(null);
    try {
      const r = await apiFetch<{ data: Capsule | null }>(`/api/v1/content/${item.id}/ai-capsule`);
      setCapsule(r.data ?? null);
    } catch {
      setCapsule(null);
    }
  }

  const activeTheme = useMemo(() => {
    const key = selectedWorld?.theme_key || selectedDistrict?.theme_key || selectedBooth?.theme_key;
    return themes.find((t) => t.slug === key || t.id === key) ?? themes[0] ?? null;
  }, [selectedWorld, selectedDistrict, selectedBooth, themes]);

  const scene = activeTheme?.world_schema ?? null;

  function goBack() {
    if (level === "booth") { setSelectedBooth(null); setLevel("district"); return; }
    if (level === "district") { setSelectedDistrict(null); setLevel("world"); return; }
    if (level === "world") { setSelectedWorld(null); setLevel("galaxy"); return; }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="relative min-h-screen">
        <UniverseBackdrop level={level} theme={activeTheme} />

        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4 sm:p-6">
          <div className="pointer-events-auto flex items-center justify-between gap-3">
            <div className="rounded-full border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-xl">
              <p className="text-[9px] uppercase tracking-[0.28em] text-cyan-300">Allpha Universe</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-white/70">
                <button onClick={() => { setLevel("galaxy"); setSelectedGalaxy(null); setSelectedWorld(null); }} className="hover:text-white">Universe</button>
                {selectedGalaxy && <><span className="text-white/20">/</span><button onClick={() => { setLevel("world"); setSelectedWorld(null); }} className="hover:text-white">{selectedGalaxy.name}</button></>}
                {selectedWorld && <><span className="text-white/20">/</span><button onClick={() => { setLevel("district"); setSelectedDistrict(null); }} className="hover:text-white">{selectedWorld.name}</button></>}
                {selectedDistrict && <><span className="text-white/20">/</span><span>{selectedDistrict.name}</span></>}
              </div>
            </div>
            <button onClick={() => void loadBase()} className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/70 backdrop-blur-xl hover:text-white">Refresh</button>
          </div>
        </header>

        <section className="relative z-10 min-h-screen px-4 pb-28 pt-24 sm:px-8">
          <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-7xl flex-col justify-between">
            <div className="pointer-events-none max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-violet-300">AI Living World</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
                {level === "galaxy" ? "Enter the Universe." : selectedBooth?.name || selectedDistrict?.name || selectedWorld?.name || selectedGalaxy?.name || "Explore Allpha."}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                {level === "galaxy" ? "Galaxy → World → District → Booth, connected to the living Feed, Content and AI Capsules." : activeTheme?.description || "A spatial surface over authoritative Allpha domains."}
              </p>
            </div>

            {error && <div className="mt-5 max-w-xl rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-xs text-red-100">{error}</div>}

            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="min-h-[460px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-2xl shadow-black/40 backdrop-blur-sm">
                {loading ? <div className="flex min-h-[520px] items-center justify-center text-sm text-white/40">Loading authoritative Universe…</div> :
                  level === "galaxy" ? <GalaxyStage themes={themes} onTheme={() => undefined} /> :
                  level === "world" ? <WorldStage themes={themes} worlds={worlds} onSelect={selectWorld} /> :
                  level === "district" ? <WorldSceneStage scene={scene} theme={activeTheme} /> :
                  <WorldSceneStage scene={scene} theme={activeTheme} />}
              </div>

              <aside className="rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-2xl sm:p-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-[9px] uppercase tracking-[0.22em] text-white/35">Spatial layer</p><h2 className="mt-1 text-xl font-semibold">{levelLabels[level]}</h2></div>
                  {busy && <span className="text-[10px] text-cyan-300">Loading…</span>}
                </div>

                {level !== "galaxy" && <button onClick={goBack} className="mt-4 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/60 hover:text-white">← Back</button>}

                {level === "galaxy" && <GalaxyList items={galaxies} themes={themes} onSelect={selectGalaxy} />}
                {level === "world" && <WorldList items={worlds} onSelect={selectWorld} />}
                {level === "district" && <DistrictList items={districts} onSelect={selectDistrict} />}
                {level === "booth" && <BoothList items={booths} onSelect={setSelectedBooth} />}

                {level === "booth" && selectedBooth && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-cyan-300">Booth</p>
                    <h3 className="mt-2 font-semibold">{selectedBooth.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/45">{selectedBooth.description || "Published Booth data will appear here when available."}</p>
                  </div>
                )}

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">Universe Content</p>
                  <div className="mt-3 space-y-2">
                    {content.length ? content.slice(0, 5).map((item) => (
                      <button key={item.id} onClick={() => void openCapsule(item)} className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-left hover:bg-white/[0.06]">
                        <p className="text-[9px] uppercase tracking-[0.14em] text-violet-300">{item.content_type || "content"}</p>
                        <p className="mt-1 text-xs font-medium text-white/85">{item.title || "Untitled content"}</p>
                        {item.excerpt && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{item.excerpt}</p>}
                        <span className="mt-2 inline-block text-[9px] text-cyan-300">Open AI Capsule →</span>
                      </button>
                    )) : <p className="text-xs leading-5 text-white/35">No published Universe Content is available yet.</p>}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {capsuleTitle && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setCapsuleTitle("")}>
            <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0a0d16] p-5 shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[9px] uppercase tracking-[0.2em] text-violet-300">AI Capsule</p><h2 className="mt-2 text-2xl font-semibold">{capsuleTitle}</h2></div>
                <button onClick={() => setCapsuleTitle("")} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Close</button>
              </div>
              {!capsule ? <p className="mt-6 text-sm leading-6 text-white/45">No reviewed AI Capsule is available for this Content yet.</p> : (
                <>
                  <p className="mt-6 text-sm leading-6 text-white/75">{capsule.summary || "No summary available."}</p>
                  {!!capsule.key_points?.length && <div className="mt-5 space-y-2">{capsule.key_points.slice(0, 8).map((point, i) => <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/60">{typeof point === "string" ? point : JSON.stringify(point)}</div>)}</div>}
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

function GalaxyStage({ themes }: { themes: Theme[]; onTheme: (theme: Theme) => void }) {
  return <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
    <color attach="background" args={["#05070d"]} />
    <PerspectiveCamera makeDefault position={[0, 7, 13]} fov={52} />
    <ambientLight intensity={0.6} />
    <pointLight position={[0, 5, 0]} intensity={35} color="#7c3aed" />
    <OrbitControls enablePan={false} minDistance={7} maxDistance={22} autoRotate autoRotateSpeed={0.25} />
    <mesh><sphereGeometry args={[1.5, 32, 32]} /><meshStandardMaterial color="#111827" emissive="#7c3aed" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} /></mesh>
    {themes.slice(0, 25).map((theme, i) => {
      const a = (i / Math.max(1, Math.min(themes.length, 25))) * Math.PI * 2;
      const r = 3.6 + (i % 3) * 0.8;
      return <mesh key={theme.id} position={[Math.cos(a) * r, Math.sin(i * 0.7) * 1.4, Math.sin(a) * r]}>
        <sphereGeometry args={[0.18 + (i % 3) * 0.04, 16, 16]} />
        <meshStandardMaterial color={i % 2 ? "#06b6d4" : "#a78bfa"} emissive={i % 2 ? "#06b6d4" : "#a78bfa"} emissiveIntensity={2.2} />
      </mesh>;
    })}
  </Canvas>;
}

function WorldStage({ worlds, onSelect }: { themes: Theme[]; worlds: World[]; onSelect: (world: World) => void }) {
  return <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
    <color attach="background" args={["#070a12"]} /><PerspectiveCamera makeDefault position={[0, 5, 11]} fov={55} />
    <ambientLight intensity={0.7} /><directionalLight position={[5, 10, 5]} intensity={2.5} />
    <OrbitControls enablePan={false} minDistance={5} maxDistance={18} />
    {worlds.map((world, i) => { const a=(i/Math.max(worlds.length,1))*Math.PI*2; const r=3.5; return <group key={world.id} position={[Math.cos(a)*r,0,Math.sin(a)*r]} onClick={()=>onSelect(world)}><mesh position={[0,0.7,0]}><boxGeometry args={[1.4,1.4,1.4]} /><meshStandardMaterial color={i%2?"#0ea5e9":"#8b5cf6"} emissive={i%2?"#0ea5e9":"#8b5cf6"} emissiveIntensity={0.25} metalness={0.5}/></mesh><mesh position={[0,1.6,0]}><sphereGeometry args={[0.45,16,16]} /><meshStandardMaterial color="#f8fafc" emissive="#67e8f9" emissiveIntensity={0.4}/></mesh></group>; })}
    {!worlds.length && <mesh><sphereGeometry args={[1.4,32,32]} /><meshStandardMaterial color="#111827" emissive="#334155" emissiveIntensity={0.35}/></mesh>}
  </Canvas>;
}

function WorldSceneStage({ scene, theme }: { scene: any; theme: Theme | null }) {
  if (!scene) return <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-sm text-white/40">No validated Theme/World Scene is available for this layer.</div>;
  return <div className="min-h-[520px] h-full"><AllphaWorldRenderer scene={scene} tokens={theme?.tokens} lowPower={false} /></div>;
}

function GalaxyList({ items, themes, onSelect }: { items: Galaxy[]; themes: Theme[]; onSelect: (g: Galaxy) => void }) {
  return <div className="mt-5 space-y-2">{items.length ? items.map((g)=><button key={g.id} onClick={()=>onSelect(g)} className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06]"><p className="text-sm font-medium">{g.name}</p><p className="mt-1 text-[10px] text-white/35">{g.visibility || "private"} · {g.slug}</p></button>) : <Empty text={themes.length ? "No creator Galaxy is available yet. Platform Themes are shown as the visual Universe atlas without creating business Worlds." : "No Galaxy is available yet."} />}</div>;
}
function WorldList({ items, onSelect }: { items: World[]; onSelect: (w: World)=>void }) { return <div className="mt-5 space-y-2">{items.length ? items.map(w=><button key={w.id} onClick={()=>onSelect(w)} className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06]"><p className="text-sm font-medium">{w.name}</p><p className="mt-1 text-[10px] text-white/35">{w.world_type} · {w.theme_key || "Theme not configured"}</p></button>) : <Empty text="No World is published for this Galaxy yet." />}</div>; }
function DistrictList({ items, onSelect }: { items: District[]; onSelect: (d: District)=>void }) { return <div className="mt-5 space-y-2">{items.length ? items.map(d=><button key={d.id} onClick={()=>onSelect(d)} className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06]"><p className="text-sm font-medium">{d.name}</p><p className="mt-1 text-[10px] text-white/35">{d.district_type} · {d.visibility}</p></button>) : <Empty text="No District is available in this World yet." />}</div>; }
function BoothList({ items, onSelect }: { items: Booth[]; onSelect: (b: Booth)=>void }) { return <div className="mt-5 space-y-2">{items.length ? items.map(b=><button key={b.id} onClick={()=>onSelect(b)} className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06]"><p className="text-sm font-medium">{b.name}</p><p className="mt-1 text-[10px] text-white/35">{b.booth_type} · {b.theme_key || "Theme not configured"}</p></button>) : <Empty text="No Booth is available in this District yet." />}</div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs leading-5 text-white/35">{text}</div>; }

function UniverseBackdrop({ level, theme }: { level: Level; theme: Theme | null }) {
  const accent = typeof theme?.tokens?.["theme.color.primary"] === "string" ? String(theme.tokens["theme.color.primary"]) : "#7c3aed";
  return <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-32 top-0 h-[40rem] w-[40rem] rounded-full blur-3xl" style={{ background: accent, opacity: 0.13 }} /><div className="absolute -right-40 bottom-0 h-[35rem] w-[35rem] rounded-full bg-cyan-400/10 blur-3xl" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(124,58,237,.12),transparent_35%),linear-gradient(180deg,transparent,rgba(2,6,23,.96))]" /><div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/35 to-transparent" /><div className="absolute bottom-5 left-5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-white/30">{level} layer · server-authoritative</div></div>;
}
