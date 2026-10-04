"use client";

type Theme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
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
};

type Agent = {
  id: string;
  name: string;
  handle?: string | null;
  status: string;
  description?: string | null;
};

type World = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

type District = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

type HomeTab = "universe" | "live" | "following" | "for_you";

type Props = {
  tab: HomeTab;
  content: Content[];
  themes: Theme[];
  worlds: World[];
  districts: District[];
  templates: LiveTemplate[];
  agents: Agent[];
  loading: boolean;
  onTab: (tab: HomeTab) => void;
  onWorlds: () => void;
  onFeatures: () => void;
};

const tabLabels: Array<{ key: HomeTab; label: string }> = [
  { key: "universe", label: "Universe" },
  { key: "live", label: "Live" },
  { key: "for_you", label: "For You" },
];

const categoryVisuals = [
  { label: "Technology", icon: "◈" },
  { label: "Creative", icon: "✦" },
  { label: "Business", icon: "◇" },
  { label: "Community", icon: "◉" },
  { label: "Gaming", icon: "⌁" },
  { label: "Science", icon: "✧" },
];

export default function UniverseHomeExperience({
  tab,
  content,
  themes,
  worlds,
  districts,
  templates,
  agents,
  loading,
  onTab,
  onWorlds,
  onFeatures,
}: Props) {
  const heroThemes = themes.slice(0, 5);
  const storyContent = content.slice(0, 5);
  const live = templates.slice(0, 3);
  const featuredAgents = agents.slice(0, 4);

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-[#02040b] text-white">
      <HomeHeader onFeatures={onFeatures} />

      <div className="mx-auto max-w-[1600px] px-3 pb-28 sm:px-5 lg:px-8">
        <section className="pt-3 sm:pt-5">
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1 [scrollbar-width:none] sm:max-w-md">
            {tabLabels.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onTab(item.key)}
                aria-current={tab === item.key ? "page" : undefined}
                className={[
                  "min-h-11 flex-1 whitespace-nowrap rounded-xl px-4 text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                  tab === item.key
                    ? "bg-white text-slate-950 shadow-lg"
                    : "text-white/45 hover:text-white/80",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="allpha-universe-entry mt-3 overflow-hidden sm:mt-5">
          <div className="allpha-universe-entry-space" aria-hidden="true">
            <div className="allpha-entry-nebula nebula-a" />
            <div className="allpha-entry-nebula nebula-b" />
            <div className="allpha-entry-starfield" />
            <div className="allpha-entry-orbit orbit-1" />
            <div className="allpha-entry-orbit orbit-2" />
            <div className="allpha-entry-orbit orbit-3" />
            <div className="allpha-entry-planet">
              <div className="allpha-entry-planet-glow" />
              <div className="allpha-entry-planet-surface" />
              <div className="allpha-entry-planet-atmosphere" />
            </div>
            <div className="allpha-entry-node node-galaxy"><span>GALAXY</span><b>✦</b></div>
            <div className="allpha-entry-node node-world"><span>WORLD</span><b>◈</b></div>
            <div className="allpha-entry-node node-district"><span>DISTRICT</span><b>◇</b></div>
            <div className="allpha-entry-node node-agent"><span>AI AGENT</span><b>◉</b></div>
            <div className="allpha-entry-node node-content"><span>CONTENT</span><b>✧</b></div>
          </div>
          <div className="allpha-entry-overlay">
            <div className="allpha-entry-copy">
              <span className="allpha-entry-kicker"><i /> ALLPHA UNIVERSE · HOME ORBIT</span>
              <h1>Enter a living Universe.</h1>
              <p>Explore worlds, meet AI Agents, discover communities and move through a connected spatial network.</p>
              <div className="allpha-entry-actions">
                <button type="button" onClick={onWorlds} className="allpha-entry-primary">Explore Worlds <span>↗</span></button>
                <a href="/agents" className="allpha-entry-secondary">Meet AI Agents <span>◉</span></a>
              </div>
            </div>
            <div className="allpha-entry-hud">
              <div><span>YOU ARE HERE</span><strong>UNIVERSE</strong></div>
              <div><span>CONNECTED</span><strong>{loading ? "SYNCING…" : "LIVE"}</strong></div>
              <div><span>PATH</span><strong>GALAXY → WORLD</strong></div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <SectionHeading
            eyebrow="Explore"
            title="Find your next world"
            action="View all"
            onClick={onWorlds}
          />
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {categoryVisuals.map((category, index) => (
              <button
                key={category.label}
                type="button"
                onClick={onWorlds}
                className="group min-h-20 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/[0.035]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/10 bg-cyan-200/[0.04] text-cyan-100/70">
                  {category.icon}
                </span>
                <span className="mt-2 block text-[9px] font-medium text-white/65">{category.label}</span>
                <span className="mt-0.5 block text-[7px] text-white/25">
                  {heroThemes[index]?.name ?? "Explore"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading
            eyebrow="Worlds"
            title="Featured worlds"
            action="Open navigator"
            onClick={onWorlds}
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <SkeletonGrid count={4} />
            ) : heroThemes.length ? (
              heroThemes.map((theme, index) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={onWorlds}
                  className="group relative min-h-[235px] overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#070b17] text-left"
                >
                  <WorldVisual index={index} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 pt-20">
                    <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[7px] uppercase tracking-[0.16em] text-cyan-100/65">
                      {theme.category ?? "World"}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">{theme.name}</h3>
                    <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-white/40">
                      {theme.description ?? "Published Allpha World."}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState title="No published worlds are available for this surface yet." action="Open World Navigator" onClick={onWorlds} />
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <SectionHeading
              eyebrow="Universe Stream"
              title={tab === "for_you" ? "For You" : tab === "live" ? "Live in the Universe" : "What is alive"}
              action="Discover"
              onClick={() => onTab(tab === "for_you" ? "universe" : "for_you")}
            />
            <div className="mt-3 space-y-3">
              {loading ? (
                <SkeletonGrid count={3} horizontal />
              ) : storyContent.length ? (
                storyContent.map((item, index) => (
                  <ContentStory key={item.id} item={item} index={index} />
                ))
              ) : (
                <EmptyState title="No content is available for this account and surface yet." />
              )}
            </div>
          </div>

          <aside>
            <SectionHeading eyebrow="Live Now" title="Experiences happening" action="Open Live" onClick={() => window.location.assign("/live")} />
            <div className="mt-3 space-y-3">
              {loading ? <SkeletonGrid count={3} compact /> : live.length ? live.map((item, index) => <LiveCard key={item.id} item={item} index={index} />) : <EmptyState title="No live experience is active right now." />}
            </div>
          </aside>
        </section>

        <section className="mt-8">
          <SectionHeading eyebrow="People & Agents" title="Meet the intelligence around you" action="My Agents" onClick={() => window.location.assign("/agents")} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? <SkeletonGrid count={4} compact /> : featuredAgents.length ? featuredAgents.map((agent, index) => <AgentCard key={agent.id} agent={agent} index={index} />) : <EmptyState title="No owner-owned Agents are available yet." action="Open Agent Factory" onClick={() => window.location.assign("/agents/create")} />}
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="Published Worlds" value={String(worlds.length)} detail="From canonical World runtime" />
          <StatCard label="Districts in view" value={String(districts.length)} detail="Authoritative spatial records" />
          <StatCard label="Owned Agents" value={String(agents.length)} detail="Current authenticated owner" />
        </section>

        <section className="mt-8 rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-cyan-300/[0.07] via-white/[0.015] to-violet-400/[0.07] p-5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.32em] text-cyan-200/55">Allpha Universe</p>
              <h2 className="mt-2 text-2xl font-semibold">One Universe. One connected experience.</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-white/38">
                Identity, discovery, social, AI, spatial, commerce and live
                capabilities are surfaced through the existing canonical engines.
              </p>
            </div>
            <button type="button" onClick={onFeatures} className="min-h-11 rounded-full border border-white/10 px-4 py-2.5 text-[10px] text-white/60">
              Explore 82 Domains
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function HomeHeader({ onFeatures }: { onFeatures: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#02040b]/90 px-3 py-2.5 backdrop-blur-2xl sm:px-5 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center gap-2">
        <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-left" onClick={onFeatures} aria-label="Open Allpha feature constellation">
          <span className="text-lg font-black tracking-[-0.08em] text-white">A<span className="text-cyan-300">.</span></span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[-0.04em] text-white sm:text-sm">ALLPHA<span className="text-cyan-300">.</span></p>
          <p className="truncate text-[7px] uppercase tracking-[0.18em] text-white/25">AI Social Universe</p>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="rounded-full border border-white/[0.07] px-2.5 py-1.5 text-[8px] text-white/30">Humans &amp; AI Agents</span>
        </div>
        <a href="/notifications" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/55" aria-label="Notifications">♢</a>
        <a href="/profile" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-cyan-200/20 bg-[radial-gradient(circle_at_35%_25%,#fff,rgba(103,232,249,.45),rgba(124,58,237,.45))] text-[9px] font-semibold" aria-label="Profile">AI</a>
      </div>
    </header>
  );
}

function UniverseOrbitalPreview({ themes, loading }: { themes: Theme[]; loading: boolean }) {
  return (
    <div className="relative mx-auto h-[330px] w-full max-w-[560px] sm:h-[420px]" aria-label="Allpha Universe spatial preview">
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff,rgba(103,232,249,.72)_10%,rgba(79,70,229,.58)_32%,rgba(124,58,237,.2)_58%,transparent_76%)] shadow-[0_0_100px_rgba(70,190,255,.28)] sm:h-56 sm:w-56" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute left-1/2 top-1/2 h-44 w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-200/[0.1]" style={{ transform: `translate(-50%,-50%) rotate(${i * 38 - 25}deg) scale(${1 + i * .18})` }} />
      ))}
      {(loading ? [0, 1, 2, 3] : themes.slice(0, 4)).map((theme, index) => (
        <div key={typeof theme === "number" ? theme : theme.id} className="absolute" style={{ left: [8, 73, 18, 77][index] + "%", top: [18, 28, 70, 68][index] + "%" }}>
          <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/[0.05] shadow-[0_0_28px_rgba(70,190,255,.12)] backdrop-blur-xl sm:h-16 sm:w-16" />
          <span className="mt-1 block max-w-20 truncate text-[7px] text-white/35">{typeof theme === "number" ? "Loading" : theme.name}</span>
        </div>
      ))}
    </div>
  );
}

function WorldVisual({ index }: { index: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_35%_28%,rgba(103,232,249,.28),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(124,58,237,.28),transparent_36%),linear-gradient(145deg,#09152a,#03050c)]">
      <div className="absolute left-1/2 top-[42%] h-28 w-28 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_24%,#fff,rgba(103,232,249,.65),rgba(79,70,229,.4),transparent_72%)] shadow-[0_0_70px_rgba(70,190,255,.25)]" />
      {[0, 1].map((i) => <div key={i} className="absolute left-1/2 top-[42%] h-24 w-[85%] -translate-x-1/2 rounded-[50%] border border-white/[0.08]" style={{ transform: `translateX(-50%) rotate(${index * 12 + i * 32}deg)` }} />)}
      <div className="absolute inset-x-5 bottom-5 h-px bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent" />
    </div>
  );
}

function ContentStory({ item, index }: { item: Content; index: number }) {
  return (
    <article className="group rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-cyan-300/20 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-[radial-gradient(circle_at_35%_25%,#fff,rgba(103,232,249,.55),rgba(124,58,237,.4))]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-white/65">{item.owner_display_name ?? "Allpha Creator"}</p>
          <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">{item.content_type ?? "Content"} · Capsule {index + 1}</p>
        </div>
        <span className="text-[9px] text-cyan-200/45">{typeof item.gravity_score === "number" ? item.gravity_score.toFixed(1) : "•"}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold leading-5">{item.title ?? "Untitled Content"}</h3>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/38">{item.excerpt ?? "Discover this Content Capsule in the Allpha Universe."}</p>
      <div className="mt-4 flex gap-2">
        <button type="button" className="min-h-10 rounded-xl border border-white/[0.08] px-3 text-[9px] text-white/45">Ask</button>
        <button type="button" className="min-h-10 rounded-xl border border-white/[0.08] px-3 text-[9px] text-white/45">Explore</button>
      </div>
    </article>
  );
}

function LiveCard({ item, index }: { item: LiveTemplate; index: number }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.025]">
      <div className="relative aspect-[16/8] bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,.25),transparent_35%),radial-gradient(circle_at_75%_75%,rgba(124,58,237,.35),transparent_42%),#050711]">
        <span className="absolute left-3 top-3 rounded-full border border-rose-200/10 bg-rose-400/15 px-2 py-1 text-[7px] uppercase tracking-[0.16em] text-rose-100">Live</span>
        <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2 py-1 text-[7px] text-white/55">{item.category}</span>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-white/35">{item.description ?? "Published Live Experience."}</p>
      </div>
    </article>
  );
}

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  return (
    <a href={`/agents/${agent.id}`} className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-cyan-300/20">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-[radial-gradient(circle_at_30%_25%,#fff,rgba(103,232,249,.5),rgba(124,58,237,.4),transparent)]" />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{agent.name}</h3>
          <p className="truncate text-[8px] text-white/30">{agent.handle ? `@${agent.handle}` : agent.status}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-[9px] leading-4 text-white/35">{agent.description ?? "AI Agent in the Allpha Universe."}</p>
    </a>
  );
}

function SectionHeading({ eyebrow, title, action, onClick }: { eyebrow: string; title: string; action?: string; onClick?: () => void }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[8px] uppercase tracking-[0.3em] text-cyan-200/55">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      </div>
      {action && onClick ? (
        <button type="button" onClick={onClick} className="min-h-10 rounded-full border border-white/[0.08] px-3 py-2 text-[9px] text-white/45 hover:text-white">
          {action} →
        </button>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <p className="text-[8px] uppercase tracking-[0.18em] text-white/25">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-cyan-100/85">{value}</p>
      <p className="mt-1 text-[8px] text-white/25">{detail}</p>
    </div>
  );
}

function SkeletonGrid({ count, horizontal = false, compact = false }: { count: number; horizontal?: boolean; compact?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={[
            "animate-pulse rounded-[24px] border border-white/[0.07] bg-white/[0.025]",
            horizontal ? "h-28 w-full" : compact ? "h-24 w-full" : "h-[235px] w-full",
          ].join(" ")}
        />
      ))}
    </>
  );
}

function EmptyState({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/[0.1] bg-white/[0.015] p-6 text-xs text-white/35">
      <p>{title}</p>
      {action && onClick ? (
        <button type="button" onClick={onClick} className="mt-4 min-h-10 rounded-xl bg-cyan-300 px-3 py-2 text-[9px] font-semibold text-slate-950">
          {action}
        </button>
      ) : null}
    </div>
  );
}
