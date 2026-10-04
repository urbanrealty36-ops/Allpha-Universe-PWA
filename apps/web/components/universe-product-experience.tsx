"use client";

import { useEffect, useMemo, useState } from "react";
import ImmersiveUniverseShell from "./universe/immersive-universe-shell";
import UniverseHomeExperience from "./universe/universe-home-experience";
import GalaxyNavigatorExperience from "./universe/galaxy-navigator-experience";
import UniverseShell, { type UniverseShellKey } from "./universe/universe-shell";
import { apiFetch } from "../lib/api";

type View = "home" | "discover" | "worlds" | "agents" | "live" | "features";
type HomeTab = "universe" | "live" | "following" | "for_you";

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
type Galaxy = { id: string; name: string; slug: string; description?: string | null };
type World = {
  id: string;
  galaxy_id: string;
  name: string;
  slug: string;
  description?: string | null;
  world_type: string;
  theme_key?: string | null;
};
type District = {
  id: string;
  world_id: string;
  name: string;
  slug: string;
  description?: string | null;
  district_type: string;
  theme_key?: string | null;
};

const topNav: Array<{ key: View | HomeTab; label: string }> = [
  { key: "universe", label: "Universe" },
  { key: "live", label: "Live" },
  { key: "following", label: "Following" },
  { key: "for_you", label: "For You" },
];

const featureGroups: Array<{ name: string; domains: string[] }> = [
  { name: "Identity & Graph", domains: ["Human Identity", "AI Agent Identity", "Agent Persona", "Agent Memory", "Agent Skills", "Agent Capability", "Agent Passport", "Interest Ontology", "Interest Graph", "Passion Graph", "Habit Graph", "Goal Graph", "Context Graph", "Social Graph", "Relationship Graph", "Community Graph", "Content Graph", "Knowledge Graph", "Reputation Graph", "Agent Discovery"] },
  { name: "Content & Discovery", domains: ["Content Ingestion", "Feed Engine", "Reels Engine", "Stories Engine", "Live Engine", "AI Live Engine", "AI Capsule Engine", "Recommendation Engine", "Personalization Engine", "Search / Explore Engine", "Trend Engine"] },
  { name: "Social & Collaboration", domains: ["Social Interaction", "Messaging / DM", "Community Engine", "Collaboration Engine", "Mission Engine"] },
  { name: "Commerce & Economy", domains: ["Agent Catalog", "Marketplace", "Commerce Engine", "Economy", "Creator Economy", "Event Engine"] },
  { name: "Universe & Spatial", domains: ["Agent World", "Universe Engine", "District Engine", "Booth / Tenant Engine", "Tenant Leasing & Billing", "World / Scene Schema", "Theme Engine", "World Builder", "Theme Marketplace", "Agent Simulation Engine", "Encounter Engine", "Presence Engine", "Realtime World Engine", "World Stream", "Notification Engine"] },
  { name: "Governance & Trust", domains: ["Analytics", "Policy Engine", "Permission Engine", "Risk Engine", "Human Approval Engine", "Audit Ledger", "Trust & Safety", "Moderation", "Privacy", "Security", "Identity Verification", "Anti-Impersonation", "Anti-Fraud"] },
  { name: "Platform & Operations", domains: ["Agent Interoperability", "Agent API / Protocol", "Subscription / Billing", "Revenue Engine", "Entitlement Engine", "Feature Flag Engine", "Configuration Engine", "Super Admin Control Plane", "Developer Platform", "Observability", "Evaluation Engine", "E2E Test / QA Engine"] },
];

export default function UniverseProductExperience() {
  const [view, setView] = useState<View>("home");
  const [homeTab, setHomeTab] = useState<HomeTab>("universe");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [templates, setTemplates] = useState<LiveTemplate[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [galaxies, setGalaxies] = useState<Galaxy[]>([]);
  const [selectedGalaxyId, setSelectedGalaxyId] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function loadProductData(tab: HomeTab = homeTab) {
    setLoading(true);
    setError(null);

    const requests = await Promise.allSettled([
      apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog"),
      apiFetch<{ content?: Content[]; data?: Content[] }>(
        `/api/v1/discovery/home?surface=${tab === "universe" ? "home" : tab}&limit=12`,
      ),
      apiFetch<{ data: LiveTemplate[] }>("/api/v1/live/templates?source=platform&limit=12"),
      apiFetch<{ data: Agent[] }>("/api/v1/agents/me"),
      apiFetch<{ data: Galaxy[] }>("/api/v1/universe/galaxies"),
    ]);

    const errors: string[] = [];
    const [themeResult, discoveryResult, liveResult, agentResult, galaxyResult] = requests;

    if (themeResult.status === "fulfilled") setThemes(Array.isArray(themeResult.value.data) ? themeResult.value.data : []);
    else errors.push("WORLD_CATALOG_UNAVAILABLE");

    if (discoveryResult.status === "fulfilled") {
      const value = discoveryResult.value;
      setContent(Array.isArray(value.content) ? value.content : Array.isArray(value.data) ? value.data : []);
    } else errors.push("DISCOVERY_UNAVAILABLE");

    if (liveResult.status === "fulfilled") setTemplates(Array.isArray(liveResult.value.data) ? liveResult.value.data : []);
    else errors.push("LIVE_CATALOG_UNAVAILABLE");

    if (agentResult.status === "fulfilled") setAgents(Array.isArray(agentResult.value.data) ? agentResult.value.data : []);
    else errors.push("AGENT_SPACE_UNAVAILABLE");

    if (galaxyResult.status === "fulfilled") {
      const galaxyData = Array.isArray(galaxyResult.value.data) ? galaxyResult.value.data : [];
      setGalaxies(galaxyData);
      const activeGalaxyId = selectedGalaxyId && galaxyData.some((galaxy) => galaxy.id === selectedGalaxyId)
        ? selectedGalaxyId
        : galaxyData[0]?.id ?? null;
      setSelectedGalaxyId(activeGalaxyId);
      if (activeGalaxyId) {
        try {
          const w = await apiFetch<{ data: World[] }>(`/api/v1/universe/worlds?galaxy_id=${activeGalaxyId}&limit=24`);
          setWorlds(Array.isArray(w.data) ? w.data : []);
          if (w.data?.[0]) {
            const d = await apiFetch<{ data: District[] }>(`/api/v1/districts?world_id=${w.data[0].id}&limit=12`);
            setDistricts(Array.isArray(d.data) ? d.data : []);
          } else {
            setDistricts([]);
          }
        } catch {
          errors.push("SPATIAL_DISCOVERY_UNAVAILABLE");
        }
      } else {
        setWorlds([]);
        setDistricts([]);
      }
    } else {
      errors.push("SPATIAL_DISCOVERY_UNAVAILABLE");
    }

    setError(errors.length ? errors.join(" · ") : null);
    setLoading(false);
  }

  useEffect(() => {
    void loadProductData("universe");
  }, []);

  function navigateHome(tab: HomeTab) {
    setHomeTab(tab);
    setView("home");
    void loadProductData(tab);
  }

  const shellActive: UniverseShellKey =
    view === "home" ? "universe" :
    view === "discover" || view === "worlds" ? "explore" :
    view === "agents" ? "my-agent" :
    view === "live" ? "social" :
    "universe";

  function navigateShell(key: UniverseShellKey) {
    if (key === "universe") {
      navigateHome("universe");
      return;
    }
    if (key === "explore") {
      setView("discover");
      return;
    }
    if (key === "my-agent") {
      setView("agents");
      return;
    }
    if (key === "create") {
      setCreateOpen(true);
      return;
    }
    const routes: Partial<Record<UniverseShellKey, string>> = {
      social: "/social",
      communities: "/communities",
      missions: "/missions",
      marketplace: "/marketplace",
    };
    const href = routes[key];
    if (href) window.location.assign(href);
  }

  return (
    <UniverseShell
      active={shellActive}
      onNavigate={navigateShell}
      onCreate={() => setCreateOpen(true)}
      contextDock={
        <div className="allpha-universe-context-content">
          <span className="allpha-eyebrow">Universe Context</span>
          <strong>{view === "home" ? (homeTab === "universe" ? "Living Universe" : homeTab.replace("_", " ")) : view}</strong>
          <span>Canonical engines remain authoritative.</span>
        </div>
      }
    >
      <div className="pb-20 pt-16 md:pb-0">
        {error && <RuntimeNotice message={error} onRetry={() => void loadProductData()} />}

        {view === "home" && (
          <UniverseHomeExperience
            tab={homeTab}
            content={content}
            themes={themes}
            worlds={worlds}
            districts={districts}
            templates={templates}
            agents={agents}
            loading={loading}
            onTab={navigateHome}
            onWorlds={() => setView("worlds")}
            onFeatures={() => setView("features")}
          />
        )}

        {view === "discover" && <DiscoverSurface content={content} themes={themes} loading={loading} onWorlds={() => setView("worlds")} />}
        {view === "worlds" && (
          <GalaxyNavigatorExperience
            galaxies={galaxies}
            worlds={worlds}
            themes={themes}
            selectedGalaxyId={selectedGalaxyId}
            loading={loading}
            onGalaxy={(id) => {
              setSelectedGalaxyId(id);
              void loadProductData(homeTab);
            }}
            onEnterWorld={() => setView("discover")}
            onBack={() => navigateHome("universe")}
          />
        )}
        {view === "agents" && <AgentsSurface agents={agents} loading={loading} />}
        {view === "live" && <LiveSurface templates={templates} loading={loading} />}
        {view === "features" && <FeatureConstellation onClose={() => setView("home")} />}
      </div>

      {createOpen && (
        <div className="allpha-mobile-create-sheet-backdrop" role="presentation" onClick={() => setCreateOpen(false)}>
          <section
            className="allpha-mobile-create-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-create-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="allpha-mobile-create-sheet-handle" aria-hidden="true" />
            <div className="allpha-mobile-create-sheet-header">
              <div>
                <p className="allpha-eyebrow">Create</p>
                <h2 id="mobile-create-title">Create in Allpha</h2>
                <p>Start from an existing canonical creation flow. New Experience creation remains part of WEB-16.</p>
              </div>
              <button type="button" className="allpha-button allpha-button-icon allpha-button-ghost" aria-label="Close create menu" onClick={() => setCreateOpen(false)}>×</button>
            </div>
            <a href="/agents/create" className="allpha-mobile-create-action">
              <span className="allpha-mobile-create-action-icon">◈</span>
              <span><strong>Agent Factory</strong><small>Create an owner-owned AI Agent</small></span>
              <span aria-hidden="true">→</span>
            </a>
          </section>
        </div>
      )}

    </UniverseShell>
  );
}

function UniverseHome({
  tab, content, themes, worlds, districts, templates, agents, loading, onTab, onWorlds, onFeatures,
}: {
  tab: HomeTab; content: Content[]; themes: Theme[]; worlds: World[]; districts: District[];
  templates: LiveTemplate[]; agents: Agent[]; loading: boolean; onTab: (tab: HomeTab) => void;
  onWorlds: () => void; onFeatures: () => void;
}) {
  const featuredThemes = themes.slice(0, 5);
  const featuredDistricts = districts.slice(0, 4);
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="relative min-h-[620px] overflow-hidden border-b border-white/[0.06]">
        <UniverseHero />
        <div className="relative z-10 mx-auto max-w-[1500px] px-5 pb-12 pt-16 sm:px-8 sm:pt-20">
          <div className="max-w-3xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.48em] text-cyan-200/75">Allpha Universe · Living Spatial Network</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              A universe where <span className="text-cyan-200">humans</span>, AI Agents and worlds meet.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
              Discover real published worlds, content, communities and live experiences. Spatial presentation is driven by the canonical Theme → World → District → Zone → Booth runtime.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <button onClick={onWorlds} className="rounded-full bg-white px-5 py-3 text-xs font-semibold text-slate-950">Explore Worlds</button>
              <a href="/agents/create" className="rounded-full border border-cyan-200/20 bg-cyan-300/[0.07] px-5 py-3 text-xs text-cyan-100">Create Agent</a>
              <a href="/live" className="rounded-full border border-white/10 bg-black/25 px-5 py-3 text-xs text-white/65">Open Live</a>
            </div>
          </div>

          <div className="mt-10 flex max-w-full gap-2 overflow-x-auto pb-1">
            {(["universe", "live", "following", "for_you"] as HomeTab[]).map((item) => (
              <button key={item} onClick={() => onTab(item)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.16em] ${tab === item ? "border-cyan-200/35 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-black/20 text-white/40"}`}>
                {item === "for_you" ? "For You" : item.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] space-y-12 px-5 py-10 sm:px-8">
        <section>
          <SectionHeader eyebrow="Worlds" title="Choose where to enter" action="View all" onClick={onWorlds} />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? <LoadingGrid count={4} /> : featuredThemes.map((theme, i) => (
              <button key={theme.id} onClick={onWorlds} className="group relative min-h-[220px] overflow-hidden rounded-[28px] border border-white/10 bg-[#070b16] p-5 text-left">
                <div className={`absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_${20+i*14}%_${22+i*8}%,rgba(94,234,212,.28),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,.26),transparent_35%)]`} />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[8px] uppercase tracking-[0.16em] text-cyan-100/70">{theme.category ?? "World"}</span>
                    <span className="text-white/25">↗</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{theme.name}</h3>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-white/40">{theme.description ?? "Published Allpha World."}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Spatial Discovery" title="Districts to explore" action="Open 3D Universe" onClick={onWorlds} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? <LoadingGrid count={4} compact /> : featuredDistricts.length ? featuredDistricts.map((district) => (
              <a key={district.id} href={`/districts/${district.id}`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left hover:border-cyan-300/25">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-violet-200/55">District</span>
                  <span className="text-cyan-200/50">◎</span>
                </div>
                <h3 className="mt-4 font-medium">{district.name}</h3>
                <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-white/35">{district.description ?? district.district_type}</p>
              </a>
            )) : <EmptyInline title="No district is available for this spatial context yet." />}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Live Now" title="Live experiences" action="Live Studio" onClick={() => window.location.assign("/live")} />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.slice(0, 3).map((template) => (
              <article key={template.id} className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025]">
                <div className="relative aspect-[16/8] bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,.28),transparent_35%),radial-gradient(circle_at_75%_75%,rgba(124,58,237,.35),transparent_42%),#050711]">
                  <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2 py-1 text-[8px] uppercase tracking-[0.15em] text-cyan-100">Live Experience</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/40">{template.description ?? "Published Live template."}</p>
                </div>
              </article>
            ))}
            {!loading && templates.length === 0 && <EmptyInline title="No live session is active. Published Live templates remain available in Live Studio." />}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Feed" title={tab === "for_you" ? "For You" : tab === "following" ? "Following" : "What is alive"} action="Discover" onClick={() => window.location.assign("/universe")} />
          <div className="grid gap-4 md:grid-cols-3">
            {content.slice(0, 6).map((item) => (
              <article key={item.id} className="rounded-[26px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase tracking-[0.18em] text-white/30">{item.content_type ?? "Content"}</span>
                <h3 className="mt-4 line-clamp-2 text-base font-semibold">{item.title ?? "Untitled Content"}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/38">{item.excerpt ?? "No excerpt available."}</p>
                <div className="mt-5 flex items-center justify-between text-[9px] text-white/25"><span>{item.owner_display_name ?? "Allpha"}</span><span>{typeof item.gravity_score === "number" ? item.gravity_score.toFixed(2) : ""}</span></div>
              </article>
            ))}
            {!loading && content.length === 0 && <EmptyInline title="No content is available for this account and surface yet." />}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-cyan-300/[0.07] via-transparent to-violet-400/[0.08] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-200/65">Allpha Feature Constellation</p>
              <h2 className="mt-2 text-2xl font-semibold">One Universe. 82 domains. One connected product.</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">Identity, social, content, AI, spatial, commerce, governance and platform operations converge through the existing canonical engines.</p>
            </div>
            <button onClick={onFeatures} className="rounded-full border border-white/10 px-4 py-2.5 text-[10px] text-white/65">View 82 Domains</button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Identity", "Agents", "Content", "Feed", "Social", "Messaging", "Community", "Marketplace", "Commerce", "Universe", "District", "Booth", "Theme", "World Builder", "Live", "AI Character", "Memory / RAG", "AI Gateway", "Runtime", "Policy", "Risk", "Approval", "Audit", "Security", "Observability"].map((x) => <span key={x} className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[9px] text-white/40">{x}</span>)}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <QuickAction label="My Agents" detail={agents.length ? `${agents.length} owned` : "Empty state"} href="/agents" />
          <QuickAction label="Agent Factory" detail="Create real Agent" href="/agents/create" />
          <QuickAction label="Marketplace" detail="Commerce surface" href="/marketplace" />
          <QuickAction label="Communities" detail="Social graph" href="/communities" />
          <QuickAction label="Messages" detail="Human + Agent DM" href="/messages" />
        </section>
      </main>
    </div>
  );
}

function UniverseHero() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(48,113,255,.24),transparent_19%),radial-gradient(circle_at_18%_35%,rgba(0,214,255,.13),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(126,55,255,.16),transparent_28%),linear-gradient(180deg,#061021,#02040b_72%)]">
      <div className="absolute left-1/2 top-[58%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_26%,#fff,rgba(103,232,249,.75)_7%,rgba(79,70,229,.55)_28%,rgba(124,58,237,.18)_55%,transparent_72%)] shadow-[0_0_130px_rgba(63,170,255,.22)] sm:h-[650px] sm:w-[650px]" />
      {[0, 1, 2, 3].map((i) => <div key={i} className="absolute left-1/2 top-[58%] h-[260px] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-200/[0.08]" style={{ transform: `translate(-50%,-50%) rotate(${i * 23 - 25}deg) scale(${1 + i * .16})` }} />)}
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(255,255,255,.75)_0_1px,transparent_1.5px)] [background-size:170px_170px]" />
    </div>
  );
}

function SectionHeader({ eyebrow, title, action, onClick }: { eyebrow: string; title: string; action?: string; onClick?: () => void }) {
  return <div className="flex items-end justify-between gap-4"><div><p className="text-[8px] uppercase tracking-[0.3em] text-cyan-200/55">{eyebrow}</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2></div>{action && onClick && <button onClick={onClick} className="rounded-full border border-white/10 px-3 py-2 text-[9px] text-white/45 hover:text-white">{action} →</button>}</div>;
}

function QuickAction({ label, detail, href }: { label: string; detail: string; href: string }) {
  return <a href={href} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.03]"><p className="text-sm font-medium">{label}</p><p className="mt-1 text-[9px] text-white/30">{detail}</p></a>;
}

function RuntimeNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="relative z-[70] mx-auto max-w-[1500px] px-5 pt-3 sm:px-8"><div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[10px] text-amber-50"><span>{message}</span><button onClick={onRetry} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-white/70">Retry</button></div></div>;
}

function MobileNav({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 ${active ? "text-cyan-100" : "text-white/40"}`}><span className="text-lg">{icon}</span><span className="text-[8px]">{label}</span></button>;
}

function DiscoverSurface({ content, themes, loading, onWorlds }: { content: Content[]; themes: Theme[]; loading: boolean; onWorlds: () => void }) {
  return <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8"><p className="text-[9px] uppercase tracking-[0.3em] text-cyan-200/65">Discover</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">What is alive in the Universe?</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">Universe, Following, For You, Moments, Worlds and Live remain backed by the canonical Discovery/Feed/Personalization boundary.</p><div className="mt-8 grid gap-4 md:grid-cols-3">{loading ? <LoadingGrid count={6} /> : content.map((item) => <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><span className="text-[8px] uppercase tracking-[0.18em] text-white/30">{item.content_type ?? "Content"}</span><h2 className="mt-4 text-lg font-medium">{item.title ?? "Untitled Content"}</h2><p className="mt-2 text-xs leading-5 text-white/40">{item.excerpt ?? "No excerpt available."}</p></article>)}</div>{!loading && !content.length && <EmptyInline title="No discovery content is available for this surface." />}<button onClick={onWorlds} className="mt-8 rounded-full bg-cyan-300 px-5 py-3 text-xs font-semibold text-slate-950">Explore Worlds</button><p className="mt-4 text-[9px] text-white/25">{themes.length} published Themes available to the canonical World runtime.</p></div>;
}

function WorldsSurface({ themes, worlds, districts, loading, onEnter }: { themes: Theme[]; worlds: World[]; districts: District[]; loading: boolean; onEnter: () => void }) {
  return <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] uppercase tracking-[0.3em] text-violet-200/65">World Navigator</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Galaxy → World → District → Booth</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">The visual layer follows the canonical spatial chain and reuses AllphaWorldRenderer.</p></div><button onClick={onEnter} className="rounded-full bg-cyan-300 px-5 py-3 text-xs font-semibold text-slate-950">Enter Universe</button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{loading ? <LoadingGrid count={8} /> : themes.map((theme) => <article key={theme.id} className="min-h-[210px] rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_35%_25%,rgba(34,211,238,.16),transparent_35%),#070a13] p-5"><span className="text-[8px] uppercase tracking-[0.18em] text-cyan-200/50">{theme.category ?? "World"}</span><h2 className="mt-4 text-lg font-semibold">{theme.name}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-white/35">{theme.description ?? "Published Theme."}</p><div className="mt-6 flex items-center justify-between text-[8px] text-white/25"><span>v{theme.theme_version ?? "—"}</span><span>Runtime Ready</span></div></article>)}</div><div className="mt-10 grid gap-4 lg:grid-cols-2"><SpatialList title="Published Worlds" items={worlds.map((x) => x.name)} /><SpatialList title="District Discovery" items={districts.map((x) => x.name)} /></div></div>;
}

function SpatialList({ title, items }: { title: string; items: string[] }) { return <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><p className="text-[9px] uppercase tracking-[0.2em] text-white/30">{title}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{items.length ? items.map((x) => <div key={x} className="rounded-2xl border border-white/[0.07] px-4 py-3 text-xs text-white/60">{x}</div>) : <EmptyInline title="No authoritative records available." />}</div></section>; }

function AgentsSurface({ agents, loading }: { agents: Agent[]; loading: boolean }) {
  return <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] uppercase tracking-[0.3em] text-cyan-200/65">AI Agents</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">My Agents</h1><p className="mt-3 text-sm text-white/40">Identity, Persona, Memory, Skills, Capability, Passport, Policy and Runtime remain server-authoritative.</p></div><a href="/agents/create" className="rounded-full bg-cyan-300 px-5 py-3 text-xs font-semibold text-slate-950">Create Agent</a></div>{loading ? <div className="mt-8"><LoadingGrid count={3} /></div> : agents.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{agents.map((a) => <article key={a.id} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-[radial-gradient(circle_at_30%_25%,#fff,rgba(103,232,249,.5),rgba(124,58,237,.3),transparent)]" /><div><h2 className="font-semibold">{a.name}</h2><p className="text-[9px] text-white/30">{a.handle ? `@${a.handle}` : a.status}</p></div></div><p className="mt-4 text-xs leading-5 text-white/35">{a.description ?? "No description."}</p><div className="mt-5 flex gap-2"><a href={`/agents/${a.id}`} className="rounded-xl bg-white px-3 py-2 text-[10px] font-medium text-slate-950">Open</a><a href={`/agents/${a.id}/control`} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-white/55">Control</a></div></article>)}</div> : <EmptyInline title="No real Agents exist yet. Agent Factory is ready for the first owner-owned Agent." href="/agents/create" action="Open Agent Factory" />}</div>;
}

function LiveSurface({ templates, loading }: { templates: LiveTemplate[]; loading: boolean }) {
  return <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8"><p className="text-[9px] uppercase tracking-[0.3em] text-violet-200/65">Live Universe</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Live, Stage & AI Character</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">Live Session → Theme Stage → Human Presentation → Agent → Voice → Character → Animation → Realtime.</p><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{loading ? <LoadingGrid count={6} /> : templates.map((t) => <article key={t.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"><div className="aspect-video bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,.2),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(124,58,237,.28),transparent_40%),#05070d]" /><div className="p-5"><span className="text-[8px] uppercase tracking-[0.18em] text-cyan-200/50">{t.category}</span><h2 className="mt-3 font-semibold">{t.name}</h2><p className="mt-2 text-xs leading-5 text-white/35">{t.description ?? "Published Live Experience template."}</p></div></article>)}</div>{!loading && !templates.length && <EmptyInline title="No published Live template is available." />}<a href="/live" className="mt-8 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-xs font-semibold text-slate-950">Open Live Studio</a></div>;
}

function FeatureConstellation({ onClose }: { onClose: () => void }) {
  return <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.3em] text-cyan-200/65">Allpha Architecture → Web IA</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">82 Domain Feature Constellation</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/40">The web experience exposes one connected product. These domains are not 82 independent engines; they converge through the canonical backend and cross-domain journeys.</p></div><button onClick={onClose} className="rounded-full border border-white/10 px-4 py-2 text-[10px] text-white/55">Back</button></div><div className="mt-8 space-y-5">{featureGroups.map((group) => <section key={group.name} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">{group.name}</h2><span className="text-[9px] text-white/25">{group.domains.length} domains</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{group.domains.map((domain) => <div key={domain} className="rounded-2xl border border-white/[0.07] bg-black/15 px-3 py-3 text-[10px] text-white/55">{domain}</div>)}</div></section>)}</div></div>;
}

function LoadingGrid({ count, compact = false }: { count: number; compact?: boolean }) { return <>{Array.from({ length: count }).map((_, i) => <div key={i} className={`animate-pulse rounded-3xl border border-white/10 bg-white/[0.025] ${compact ? "h-24" : "h-52"}`} />)}</>; }
function EmptyInline({ title, href, action }: { title: string; href?: string; action?: string }) { return <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-5 text-xs text-white/35">{title}{href && action && <a href={href} className="ml-3 inline-flex rounded-lg bg-cyan-300 px-3 py-1.5 text-[9px] font-semibold text-slate-950">{action}</a>}</div>; }