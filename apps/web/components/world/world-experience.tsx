"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { normalizeWorldScene, type WorldScene, type SceneNode } from "../../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(() => import("./allpha-world-renderer"), {
  ssr: false,
  loading: () => <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-white/10 bg-black text-xs text-white/40">Preparing World renderer…</div>,
});

type World = {
  id: string;
  galaxy_id: string;
  name: string;
  slug: string;
  description?: string | null;
  world_type: string;
  visibility?: string | null;
  theme_key?: string | null;
  spatial_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};
type District = { id: string; world_id: string; name: string; slug: string; description?: string | null; district_type: string; theme_key?: string | null; spatial_config?: Record<string, unknown> };
type Theme = { id: string; name: string; slug: string; description?: string | null; category?: string | null; tokens?: Record<string, unknown>; world_schema?: unknown; theme_version_id?: string | null };
type Agent = { id: string; agent_id?: string; name?: string | null; handle?: string | null; status?: string | null; presence_role?: string | null; runtime_state?: string | null };
type LinkedContent = { id: string; content_id?: string; placement?: string; sort_order?: number };
type Portal = { id: string; target_world_id?: string; name: string; access_policy?: string; metadata?: Record<string, unknown> };
type Presence = { id: string; agent_id: string; state?: string; activity?: string | null; context?: Record<string, unknown> };
type CatalogItem = { id: string; name: string; slug: string; tokens?: Record<string, unknown>; world_schema?: unknown; theme_version_id?: string | null };

type Tab = "districts" | "people" | "live" | "content";

export default function WorldExperience() {
  const params = useSearchParams();
  const worldId = params.get("world_id");
  const [world, setWorld] = useState<World | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [content, setContent] = useState<LinkedContent[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [themes, setThemes] = useState<CatalogItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [tab, setTab] = useState<Tab>("districts");
  const [entered, setEntered] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotspot, setHotspot] = useState<SceneNode | null>(null);

  async function load() {
    if (!worldId) {
      setError("WORLD_ID_REQUIRED");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const requests = await Promise.allSettled([
      apiFetch<{ data: World }>(`/api/v1/universe/worlds/${encodeURIComponent(worldId)}`),
      apiFetch<{ data: District[] }>(`/api/v1/districts?world_id=${encodeURIComponent(worldId)}&limit=100`),
      apiFetch<{ data: Agent[] }>(`/api/v1/universe/worlds/${encodeURIComponent(worldId)}/agents`),
      apiFetch<{ data: LinkedContent[] }>(`/api/v1/universe/worlds/${encodeURIComponent(worldId)}/content`),
      apiFetch<{ data: Portal[] }>(`/api/v1/universe/worlds/${encodeURIComponent(worldId)}/portals`),
      apiFetch<{ data: Presence[] }>(`/api/v1/universe/worlds/${encodeURIComponent(worldId)}/presence`),
      apiFetch<{ data: CatalogItem[] }>(`/api/v1/themes/world-runtime/catalog`),
    ]);
    const [w, d, a, c, p, pr, t] = requests;
    const failures: string[] = [];
    if (w.status === "fulfilled") setWorld(w.value.data);
    else failures.push("WORLD_LOAD_FAILED");
    if (d.status === "fulfilled") setDistricts(Array.isArray(d.value.data) ? d.value.data : []);
    else failures.push("DISTRICT_DISCOVERY_UNAVAILABLE");
    if (a.status === "fulfilled") setAgents(Array.isArray(a.value.data) ? a.value.data : []);
    else failures.push("WORLD_AGENTS_UNAVAILABLE");
    if (c.status === "fulfilled") setContent(Array.isArray(c.value.data) ? c.value.data : []);
    else failures.push("WORLD_CONTENT_UNAVAILABLE");
    if (p.status === "fulfilled") setPortals(Array.isArray(p.value.data) ? p.value.data : []);
    else failures.push("WORLD_PORTALS_UNAVAILABLE");
    if (pr.status === "fulfilled") setPresence(Array.isArray(pr.value.data) ? pr.value.data : []);
    else failures.push("WORLD_PRESENCE_UNAVAILABLE");
    if (t.status === "fulfilled") setThemes(Array.isArray(t.value.data) ? t.value.data : []);
    else failures.push("WORLD_THEME_UNAVAILABLE");
    setError(failures.length ? failures.join(" · ") : null);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [worldId]);

  useEffect(() => {
    if (!world || !themes.length) return;
    const key = world.theme_key;
    const match = themes.find((theme) => theme.slug === key || theme.id === key || theme.name.toLowerCase() === world.name.toLowerCase()) ?? null;
    setSelectedTheme(match as Theme | null);
  }, [world, themes]);

  const scene = useMemo<WorldScene | null>(() => {
    const raw = selectedTheme?.world_schema;
    return raw ? normalizeWorldScene(raw) : null;
  }, [selectedTheme]);

  const activePresence = useMemo(() => {
    const ids = new Set(presence.map((item) => item.agent_id));
    return agents
      .filter((agent) => agent.agent_id && ids.has(agent.agent_id))
      .map((agent) => ({
        id: agent.agent_id!,
        agent_id: agent.agent_id!,
        movement_state: "present",
        position: undefined,
        zone_key: null,
        updated_at: new Date().toISOString(),
      }));
  }, [agents, presence]);

  async function enterWorld() {
    if (!world || joining) return;
    setJoining(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/universe/worlds/${encodeURIComponent(worldId)}/join`, {
        method: "POST",
        body: JSON.stringify({ subject_type: "user" }),
      });
      setEntered(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNIVERSE_WORLD_JOIN_FAILED");
    } finally {
      setJoining(false);
    }
  }

  if (!worldId) return <State title="World ID is required" description="Open a World from Galaxy Navigator to continue." action="/universe" />;
  if (loading && !world) return <Loading />;
  if (!world) return <State title="World unavailable" description={error ?? "The authoritative World record could not be loaded."} action="/universe" />;

  return (
    <main className="min-h-screen bg-[#02040b] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#02040b]/90 px-3 py-3 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2">
          <a href="/universe" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-white/65" aria-label="Back to Universe">←</a>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] uppercase tracking-[0.28em] text-cyan-200/55">World Experience</p>
            <h1 className="truncate text-base font-semibold sm:text-lg">{world.name}</h1>
          </div>
          <label className="hidden items-center gap-2 text-[9px] text-white/35 sm:flex">
            <input type="checkbox" checked={lowPower} onChange={(e) => setLowPower(e.target.checked)} />
            Low-power
          </label>
          <button type="button" onClick={() => window.location.assign("/universe")} className="min-h-11 rounded-xl border border-white/10 px-3 text-[9px] text-white/50">Explore</button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(103,232,249,.2),transparent_26%),radial-gradient(circle_at_82%_75%,rgba(124,58,237,.2),transparent_38%),linear-gradient(145deg,#071327,#02040b_72%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 pb-8 pt-7 sm:px-7 sm:pb-12 sm:pt-10">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[8px] uppercase tracking-[0.16em] text-cyan-100/70">{world.world_type}</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] text-white/35">{world.visibility ?? "public"}</span>
                {selectedTheme ? <span className="rounded-full border border-violet-200/15 bg-violet-300/[0.06] px-3 py-1.5 text-[8px] text-violet-100/65">{selectedTheme.name}</span> : null}
              </div>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl">{world.name}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/42">{world.description ?? "Explore this published World through its authoritative spatial, community and content layers."}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={enterWorld} disabled={joining} className="min-h-11 rounded-full bg-white px-6 py-3 text-xs font-semibold text-slate-950 disabled:opacity-50">
                  {joining ? "Entering…" : entered ? "Entered World" : "Enter World"}
                </button>
                <button type="button" onClick={() => setLowPower((v) => !v)} className="min-h-11 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-white/60">{lowPower ? "Enable spatial quality" : "Low-power mode"}</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <Stat label="Districts" value={districts.length} />
              <Stat label="Agents linked" value={agents.length} />
              <Stat label="Content links" value={content.length} />
              <Stat label="World portals" value={portals.length} />
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="mx-auto mt-4 max-w-[1500px] px-4 sm:px-7"><div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs text-amber-100/70">{error}<button type="button" onClick={() => void load()} className="ml-3 underline">Retry</button></div></div> : null}

      <section className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {(["districts", "people", "live", "content"] as Tab[]).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-11 shrink-0 rounded-full border px-5 text-[9px] font-semibold uppercase tracking-[0.14em] ${tab === item ? "border-cyan-200/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.02] text-white/35"}`} aria-pressed={tab === item}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-3 pb-7 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-black/30">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div>
                <p className="text-[8px] uppercase tracking-[0.25em] text-cyan-200/50">Universe → Galaxy → World</p>
                <h3 className="mt-1 text-sm font-semibold">Spatial World</h3>
              </div>
              <span className="text-[8px] text-white/25">{entered ? "Entered · interactive" : "Preview"}</span>
            </div>
            <div className="min-h-[420px] sm:min-h-[560px]">
              {scene ? (
                <AllphaWorldRenderer
                  scene={scene}
                  tokens={selectedTheme?.tokens}
                  lowPower={lowPower}
                  presence={activePresence}
                  portals={portals.map((portal) => ({ id: portal.id, target: portal.target_world_id ?? "", position: undefined }))}
                  onHotspot={(node) => setHotspot(node)}
                />
              ) : (
                <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
                  <div>
                    <p className="text-sm font-medium text-white/65">World scene is not available</p>
                    <p className="mt-2 max-w-md text-xs leading-5 text-white/30">This World record is available, but no matching published Theme world schema is available to render it yet. No synthetic scene is created.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[30px] border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <PanelContent tab={tab} districts={districts} agents={agents} content={content} portals={portals} presence={presence} worldId={world.id} onDistrict={(district) => window.location.assign(`/districts/${district.id}`)} />
          </aside>
        </div>
      </section>

      {hotspot ? (
        <div className="fixed inset-0 z-[70] bg-black/65 p-3 backdrop-blur-sm" role="presentation" onClick={() => setHotspot(null)}>
          <section role="dialog" aria-modal="true" className="mx-auto mt-auto max-w-xl rounded-[28px] border border-white/10 bg-[#080b16] p-5 shadow-2xl sm:mt-[12vh]" onClick={(e) => e.stopPropagation()}>
            <p className="text-[8px] uppercase tracking-[0.24em] text-cyan-200/55">Spatial Object</p>
            <h3 className="mt-2 text-lg font-semibold">{hotspot.metadata?.name ? String(hotspot.metadata.name) : hotspot.kind}</h3>
            <pre className="mt-3 max-h-56 overflow-auto rounded-2xl bg-black/30 p-3 text-[9px] leading-4 text-white/40">{JSON.stringify(hotspot.metadata ?? {}, null, 2)}</pre>
            <button type="button" onClick={() => setHotspot(null)} className="mt-4 min-h-11 rounded-xl border border-white/10 px-4 text-xs text-white/65">Close</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function PanelContent({ tab, districts, agents, content, portals, presence, worldId, onDistrict }: { tab: Tab; districts: District[]; agents: Agent[]; content: LinkedContent[]; portals: Portal[]; presence: Presence[]; worldId: string; onDistrict: (district: District) => void }) {
  if (tab === "districts") return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.24em] text-cyan-200/50">Districts</p>
      <h3 className="mt-1 text-xl font-semibold">Explore this World</h3>
      <div className="mt-4 space-y-2">{districts.length ? districts.map((district) => (
        <button key={district.id} type="button" onClick={() => onDistrict(district)} className="w-full rounded-2xl border border-white/[0.08] bg-black/15 p-3 text-left hover:border-cyan-200/20">
          <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{district.name}</span><span className="text-[8px] text-white/25">{district.district_type}</span></div>
          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-white/30">{district.description ?? "Published District"}</p>
        </button>
      )) : <Empty title="No Districts available for this World." />}</div>
    </div>
  );
  if (tab === "people") return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.24em] text-cyan-200/50">People & Agents</p>
      <h3 className="mt-1 text-xl font-semibold">Agents in this World</h3>
      <div className="mt-4 space-y-2">{agents.length ? agents.map((agent) => (
        <a key={agent.id} href={agent.agent_id ? `/agents/${agent.agent_id}?world_id=${encodeURIComponent(world.id)}&source_surface=world` : "/agents"} className="block rounded-2xl border border-white/[0.08] bg-black/15 p-3 hover:border-cyan-200/20">
          <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{agent.name ?? agent.handle ?? "Agent"}</span><span className="text-[8px] text-emerald-200/55">{agent.status ?? agent.runtime_state ?? "linked"}</span></div>
          <p className="mt-1 text-[9px] text-white/30">{agent.presence_role ?? "resident"}</p>
        </a>
      )) : <Empty title="No linked Agents are available." />}</div>
    </div>
  );
  if (tab === "live") return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.24em] text-violet-200/55">Live</p>
      <h3 className="mt-1 text-xl font-semibold">World gateways</h3>
      <div className="mt-4 space-y-2">{portals.length ? portals.map((portal) => (
        <div key={portal.id} className="rounded-2xl border border-white/[0.08] bg-black/15 p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-medium">{portal.name}</span><span className="text-[8px] text-white/25">{portal.access_policy ?? "public"}</span></div>
          <p className="mt-1 text-[9px] text-white/30">Portal to another World</p>
        </div>
      )) : <Empty title="No World portals are configured." />}</div>
    </div>
  );
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.24em] text-amber-200/55">Content</p>
      <h3 className="mt-1 text-xl font-semibold">World content</h3>
      <div className="mt-4 space-y-2">{content.length ? content.map((item) => (
        <a key={item.id} href={item.content_id ? `/content/${item.content_id}` : "/content"} className="block rounded-2xl border border-white/[0.08] bg-black/15 p-3">
          <span className="text-xs font-medium">Content link</span>
          <span className="mt-1 block text-[9px] text-white/30">{item.placement ?? "feed"} · order {item.sort_order ?? 0}</span>
        </a>
      )) : <Empty title="No linked Content is available." />}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"><p className="text-[8px] uppercase tracking-[0.16em] text-white/25">{label}</p><p className="mt-2 text-xl font-semibold text-cyan-100/80">{value}</p></div>;
}
function Empty({ title }: { title: string }) { return <div className="rounded-2xl border border-dashed border-white/10 p-5 text-xs text-white/30">{title}</div>; }
function Loading() { return <main className="min-h-screen bg-[#02040b] p-4 text-white"><div className="mx-auto max-w-6xl animate-pulse space-y-4 pt-20"><div className="h-8 w-48 rounded bg-white/10"/><div className="h-48 rounded-[30px] bg-white/[0.04]"/><div className="grid gap-3 sm:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 rounded-2xl bg-white/[0.04]"/>)}</div></div></main>; }
function State({ title, description, action }: { title: string; description: string; action: string }) { return <main className="flex min-h-screen items-center justify-center bg-[#02040b] p-6 text-white"><div className="max-w-md text-center"><p className="text-lg font-semibold">{title}</p><p className="mt-2 text-sm text-white/35">{description}</p><a href={action} className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-xs">Back to Universe</a></div></main>; }
