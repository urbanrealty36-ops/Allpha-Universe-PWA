"use client";

import { useEffect, useMemo, useState } from "react";
import ImmersiveUniverseShell from "./universe/immersive-universe-shell";
import { apiFetch } from "../lib/api";

type View = "universe" | "discover" | "worlds" | "agents" | "live";

type Theme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  catalog_order?: number | null;
  catalog_key?: string | null;
  theme_version?: number | null;
};

type Content = {
  id: string;
  title?: string | null;
  excerpt?: string | null;
  content_type?: string | null;
  owner_display_name?: string | null;
  gravity_score?: number;
};

type LiveTemplate = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  status: string;
};

type Agent = {
  id: string;
  name: string;
  handle?: string | null;
  status: string;
  runtime_state?: string | null;
  description?: string | null;
};

const nav: Array<{ key: View; label: string; icon: string }> = [
  { key: "universe", label: "Universe", icon: "✦" },
  { key: "discover", label: "Discover", icon: "⌕" },
  { key: "worlds", label: "Worlds", icon: "◎" },
  { key: "agents", label: "Agents", icon: "◈" },
  { key: "live", label: "Live", icon: "◉" },
];

export default function UniverseProductExperience() {
  const [view, setView] = useState<View>("universe");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [templates, setTemplates] = useState<LiveTemplate[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProductData() {
    setLoading(true);
    setError(null);
    try {
      const [themeResult, discoveryResult, liveResult, agentResult] = await Promise.all([
        apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog"),
        apiFetch<{ content?: Content[]; data?: Content[] }>("/api/v1/discovery/home?surface=home&limit=12"),
        apiFetch<{ data: LiveTemplate[] }>("/api/v1/live/templates?source=platform&limit=12"),
        apiFetch<{ data: Agent[] }>("/api/v1/agents/me"),
      ]);

      setThemes(themeResult.data ?? []);
      const discovery = Array.isArray(discoveryResult.content)
        ? discoveryResult.content
        : Array.isArray(discoveryResult.data)
          ? discoveryResult.data
          : [];
      setContent(discovery);
      setTemplates(liveResult.data ?? []);
      setAgents(agentResult.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNIVERSE_PRODUCT_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProductData();
  }, []);

  return (
    <main className="min-h-screen bg-[#03050b] text-white">
      <div className="fixed inset-x-0 top-0 z-[70] border-b border-white/[0.07] bg-[#03050b]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setView("universe")}
            className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/[0.05] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-100"
          >
            Allpha
          </button>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
            {nav.map((item) => (
              <NavButton key={item.key} item={item} active={view === item.key} onClick={() => setView(item.key)} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <a href="/messages" className="hidden rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-white/55 hover:text-white sm:block">Messages</a>
            <a href="/profile" className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-white/55 hover:text-white">Profile</a>
          </div>
        </div>
      </div>

      <div className="pb-16 pt-14 md:pb-0">
        {error && (
          <div className="relative z-50 mx-auto max-w-7xl px-4 pt-3 sm:px-6">
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-100">
              {error}
            </div>
          </div>
        )}

        {view === "universe" && (
          <section className="relative">
            <UniverseCommandDock
              themes={themes}
              agents={agents}
              templates={templates}
              onView={setView}
              loading={loading}
            />
            <ImmersiveUniverseShell />
          </section>
        )}

        {view === "discover" && (
          <DiscoverSurface content={content} themes={themes} loading={loading} onView={setView} />
        )}

        {view === "worlds" && (
          <WorldsSurface themes={themes} loading={loading} onEnter={() => setView("universe")} />
        )}

        {view === "agents" && (
          <AgentsSurface agents={agents} loading={loading} />
        )}

        {view === "live" && (
          <LiveSurface templates={templates} loading={loading} />
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/[0.08] bg-[#03050b]/90 px-2 py-2 backdrop-blur-2xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {nav.map((item) => (
            <NavButton key={item.key} item={item} active={view === item.key} onClick={() => setView(item.key)} mobile />
          ))}
        </div>
      </nav>
    </main>
  );
}

function NavButton({
  item,
  active,
  onClick,
  mobile = false,
}: {
  item: (typeof nav)[number];
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        mobile
          ? `flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[8px] transition ${active ? "bg-cyan-300/10 text-cyan-100" : "text-white/35"}`
          : `rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.14em] transition ${active ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/80"}`
      }
    >
      <span className={mobile ? "text-sm" : "mr-1"}>{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}

function UniverseCommandDock({
  themes,
  agents,
  templates,
  onView,
  loading,
}: {
  themes: Theme[];
  agents: Agent[];
  templates: LiveTemplate[];
  onView: (view: View) => void;
  loading: boolean;
}) {
  const featured = themes.slice(0, 4);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 hidden px-4 pt-4 lg:block">
      <div className="mx-auto flex max-w-[1800px] items-start justify-between gap-4">
        <div className="pointer-events-auto w-[310px] rounded-3xl border border-white/10 bg-black/40 p-3 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between px-2 pb-2">
            <div>
              <p className="text-[8px] uppercase tracking-[0.28em] text-cyan-300">Universe Discover</p>
              <p className="mt-1 text-xs text-white/70">Choose a destination</p>
            </div>
            <span className="text-[9px] text-white/25">{themes.length} worlds</span>
          </div>
          <div className="space-y-1.5">
            {featured.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => onView("worlds")}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2.5 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[radial-gradient(circle_at_35%_30%,rgba(103,232,249,.8),rgba(124,58,237,.22)_48%,rgba(0,0,0,.2))] text-xs">✦</div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-white/85">{theme.name}</p>
                  <p className="mt-0.5 truncate text-[9px] text-white/35">{theme.category ?? "Universe"} · v{theme.theme_version ?? "—"}</p>
                </div>
                <span className="ml-auto text-white/20">→</span>
              </button>
            ))}
            {!loading && featured.length === 0 && <p className="px-2 py-4 text-[10px] text-white/35">No published World is available.</p>}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-white/[0.07] pt-2">
            <QuickMetric label="Agents" value={String(agents.length)} />
            <QuickMetric label="Live" value={String(templates.length)} />
            <QuickMetric label="Feed" value={String(themes.length ? "Ready" : "—")} />
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-2 backdrop-blur-2xl">
          <button onClick={() => onView("discover")} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-white/60 hover:text-white">Discover</button>
          <button onClick={() => onView("agents")} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-white/60 hover:text-white">My Agents</button>
          <button onClick={() => onView("live")} className="rounded-full bg-cyan-300 px-3 py-1.5 text-[9px] font-semibold text-slate-950">Live</button>
        </div>
      </div>
    </div>
  );
}

function DiscoverSurface({
  content,
  themes,
  loading,
  onView,
}: {
  content: Content[];
  themes: Theme[];
  loading: boolean;
  onView: (view: View) => void;
}) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 sm:py-10">
      <header className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <p className="text-[9px] uppercase tracking-[0.32em] text-cyan-300">Allpha Discover</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">What is alive in the Universe?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Discover content and spatial destinations from the authoritative backend. Nothing is synthesized to fill the screen.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Universe signal</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <QuickMetric label="Themes" value={String(themes.length)} />
            <QuickMetric label="Content" value={String(content.length)} />
            <QuickMetric label="Mode" value="Live" />
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : content.map((item) => (
              <article key={item.id} className="group rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-cyan-300/20">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[8px] uppercase tracking-[0.16em] text-white/35">{item.content_type ?? "content"}</span>
                  {typeof item.gravity_score === "number" && <span className="text-[9px] text-cyan-200/50">{item.gravity_score.toFixed(2)}</span>}
                </div>
                <h2 className="mt-5 line-clamp-2 text-lg font-medium">{item.title ?? "Untitled Content"}</h2>
                <p className="mt-2 line-clamp-4 text-xs leading-5 text-white/40">{item.excerpt ?? "No excerpt available."}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="truncate text-[9px] text-white/25">{item.owner_display_name ?? "Allpha"}</span>
                  <a href={`/content/${item.id}`} className="rounded-xl border border-white/10 px-3 py-2 text-[9px] text-white/60 hover:text-white">Open</a>
                </div>
              </article>
            ))}
      </section>

      {!loading && content.length === 0 && (
        <EmptyState title="No live content yet" body="The Feed is ready, but this account has no content available to display. Create legitimate content through the canonical content flow." />
      )}

      <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/[0.06] to-violet-400/[0.05] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-violet-300">Spatial discovery</p>
            <h2 className="mt-1 text-xl font-semibold">Enter the Worlds</h2>
            <p className="mt-1 text-xs text-white/40">Explore published Themes and their World schemas.</p>
          </div>
          <button onClick={() => onView("worlds")} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950">Explore Worlds</button>
        </div>
      </section>
    </div>
  );
}

function WorldsSurface({
  themes,
  loading,
  onEnter,
}: {
  themes: Theme[];
  loading: boolean;
  onEnter: () => void;
}) {
  const [selected, setSelected] = useState<Theme | null>(null);
  useEffect(() => {
    if (!selected && themes[0]) setSelected(themes[0]);
  }, [themes, selected]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-violet-300">World Navigator</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Choose your World</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Published Theme catalog, existing World schema and the canonical renderer remain the source of the spatial experience.</p>
        </div>
        <button onClick={onEnter} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950">Enter Universe</button>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} compact />)
            : themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelected(theme)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === theme.id ? "border-cyan-300/50 bg-cyan-300/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-[radial-gradient(circle_at_35%_30%,rgba(103,232,249,.7),rgba(124,58,237,.22)_52%,rgba(0,0,0,.3))]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{theme.name}</p>
                      <p className="mt-1 truncate text-[9px] uppercase tracking-wider text-white/30">{theme.category ?? "Universe"} · #{theme.catalog_order ?? "—"}</p>
                    </div>
                  </div>
                </button>
              ))}
        </div>

        <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,.12),transparent_22%),radial-gradient(circle_at_75%_75%,rgba(124,58,237,.12),transparent_30%)]" />
          {selected ? (
            <div className="relative flex min-h-[560px] flex-col justify-between p-6 sm:p-8">
              <div className="max-w-2xl">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-cyan-200">World Preview</span>
                <h2 className="mt-5 text-3xl font-semibold sm:text-5xl">{selected.name}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">{selected.description ?? "Published Allpha World Theme."}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <PreviewStat label="Theme" value={selected.category ?? "Universe"} />
                <PreviewStat label="Version" value={String(selected.theme_version ?? "—")} />
                <PreviewStat label="Order" value={String(selected.catalog_order ?? "—")} />
                <PreviewStat label="Runtime" value="Renderer" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={onEnter} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950">Enter World Space</button>
                <a href="/theme-studio" className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/65 hover:text-white">Theme Studio</a>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[560px] items-center justify-center text-sm text-white/30">Select a published World.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentsSurface({ agents, loading }: { agents: Agent[]; loading: boolean }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-7 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-300">AI Workforce</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">My Agents</h1>
          <p className="mt-2 text-sm leading-6 text-white/45">Owned Agents only. Runtime, policy, capability and authority remain server-side.</p>
        </div>
        <a href="/agents/create" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950">Create Agent</a>
      </header>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : agents.length === 0 ? (
        <EmptyState title="Your Agent space is empty" body="No synthetic Agents are shown. Use Agent Factory to create the first real owner-owned Agent." href="/agents/create" action="Open Agent Factory" />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <article key={agent.id} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_35%_30%,rgba(103,232,249,.8),rgba(124,58,237,.2)_52%,rgba(0,0,0,.4))] text-lg">◈</div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{agent.name}</h2>
                  <p className="text-[10px] text-white/35">{agent.handle ? `@${agent.handle}` : agent.runtime_state ?? agent.status}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-xs leading-5 text-white/40">{agent.description ?? "No description."}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-[9px] text-white/45">
                <span className="rounded-full border border-white/10 px-2 py-1">{agent.status}</span>
                <span className="rounded-full border border-white/10 px-2 py-1">{agent.runtime_state ?? "runtime"}</span>
              </div>
              <div className="mt-5 flex gap-2">
                <a href={`/agents/${agent.id}`} className="rounded-xl bg-white px-3 py-2 text-[10px] font-medium text-slate-950">Open Agent</a>
                <a href={`/agents/${agent.id}/control`} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-white/60">Control</a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveSurface({ templates, loading }: { templates: LiveTemplate[]; loading: boolean }) {
  const featured = useMemo(() => templates.slice(0, 6), [templates]);
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-7 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-violet-300">Live Experience</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Live in a World</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Select an existing published Live Stage Template. Stage assets and sessions remain backend-authoritative.</p>
        </div>
        <a href="/live" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950">Open Live Studio</a>
      </header>

      {loading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : featured.length === 0 ? (
        <EmptyState title="No Live templates available" body="The Live engine has no published template available for this account. No synthetic stages are created." href="/live" action="Open Live Studio" />
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((template) => (
            <article key={template.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
              <div className="relative aspect-video bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,.3),transparent_38%),radial-gradient(circle_at_75%_70%,rgba(34,211,238,.18),transparent_32%),#05070d]">
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[8px] uppercase tracking-[0.16em] text-cyan-200">Stage Template</span>
                  <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[8px] text-white/40">{template.category}</span>
                </div>
              </div>
              <div className="p-5">
                <h2 className="font-semibold">{template.name}</h2>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/40">{template.description ?? "Published Live Experience template."}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-white/25">{template.status}</span>
                  <a href="/live" className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-white/65 hover:text-white">Use in Live Studio</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-2 py-2 text-center"><p className="text-[8px] uppercase tracking-wider text-white/25">{label}</p><p className="mt-1 text-[11px] font-medium text-white/70">{value}</p></div>;
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[8px] uppercase tracking-[0.18em] text-white/25">{label}</p><p className="mt-1 text-sm text-white/70">{value}</p></div>;
}

function SkeletonCard({ compact = false }: { compact?: boolean }) {
  return <div className={`animate-pulse rounded-2xl border border-white/10 bg-white/[0.025] ${compact ? "h-[76px]" : "h-[190px]"}`} />;
}

function EmptyState({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">{body}</p>
      {href && action && <a href={href} className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950">{action}</a>}
    </div>
  );
}
