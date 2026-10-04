"use client";

import { useMemo, useState } from "react";

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
type Theme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  theme_version?: number | null;
};

type Props = {
  galaxies: Galaxy[];
  worlds: World[];
  themes: Theme[];
  selectedGalaxyId: string | null;
  loading: boolean;
  onGalaxy: (id: string) => void;
  onEnterWorld: (world: World) => void;
  onBack: () => void;
};

const filters = ["All", "Trending", "Popular", "New"] as const;

export default function GalaxyNavigatorExperience({
  galaxies,
  worlds,
  themes,
  selectedGalaxyId,
  loading,
  onGalaxy,
  onEnterWorld,
  onBack,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const selectedGalaxy = galaxies.find((galaxy) => galaxy.id === selectedGalaxyId) ?? galaxies[0] ?? null;

  const visibleWorlds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return worlds.filter((world) => {
      if (!normalized) return true;
      return [world.name, world.slug, world.world_type, world.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, worlds]);

  const featured = visibleWorlds.slice(0, 6);
  const themeFor = (world: World) =>
    themes.find((theme) => theme.slug === world.theme_key || theme.id === world.theme_key) ?? themes.find((theme) => theme.name.toLowerCase() === world.name.toLowerCase());

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-[#02040b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#02040b]/92 px-3 py-3 backdrop-blur-2xl sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onBack} className="min-h-11 min-w-11 rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/65" aria-label="Back to Universe Home">←</button>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] uppercase tracking-[0.26em] text-cyan-200/50">Galaxy Navigator</p>
              <h1 className="truncate text-base font-semibold sm:text-xl">Explore the Universe</h1>
            </div>
            <span className="hidden rounded-full border border-white/[0.07] px-3 py-1.5 text-[8px] text-white/35 sm:inline-flex">{galaxies.length} Galaxies · {worlds.length} Worlds</span>
          </div>

          <div className="mt-3 flex min-h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3">
            <span className="text-white/30" aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
              placeholder="Search worlds, galaxies..."
              aria-label="Search worlds and galaxies"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={[
                  "min-h-10 shrink-0 rounded-full border px-4 text-[9px] font-semibold",
                  filter === item ? "border-cyan-200/30 bg-cyan-300/10 text-cyan-100" : "border-white/[0.08] bg-white/[0.02] text-white/40",
                ].join(" ")}
                aria-pressed={filter === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-3 pb-28 pt-4 sm:px-5 lg:px-8">
        <section className="grid gap-3 lg:grid-cols-[.78fr_1.22fr]">
          <div className="relative min-h-[330px] overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#050816] p-5 sm:min-h-[420px] sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(103,232,249,.18),transparent_18%),radial-gradient(circle_at_20%_20%,rgba(59,130,246,.12),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(124,58,237,.2),transparent_34%),linear-gradient(145deg,#071327,#02040b_72%)]" />
            <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff,rgba(103,232,249,.72)_8%,rgba(79,70,229,.55)_34%,rgba(124,58,237,.18)_62%,transparent_75%)] shadow-[0_0_90px_rgba(70,190,255,.24)] sm:h-52 sm:w-52" />
            {[0, 1, 2].map((index) => (
              <div key={index} className="absolute left-1/2 top-1/2 h-32 w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-100/[0.1]" style={{ transform: `translate(-50%,-50%) rotate(${index * 42 - 28}deg) scale(${1 + index * .17})` }} />
            ))}
            {galaxies.slice(0, 6).map((galaxy, index) => (
              <button
                key={galaxy.id}
                type="button"
                onClick={() => onGalaxy(galaxy.id)}
                className={[
                  "absolute min-h-10 max-w-28 rounded-2xl border px-3 py-2 text-left backdrop-blur-xl",
                  selectedGalaxy?.id === galaxy.id ? "border-cyan-200/35 bg-cyan-300/10 shadow-[0_0_28px_rgba(70,190,255,.16)]" : "border-white/10 bg-black/25",
                ].join(" ")}
                style={{ left: [6, 68, 13, 73, 42, 43][index] + "%", top: [16, 19, 67, 70, 4, 83][index] + "%" }}
              >
                <span className="block truncate text-[8px] font-semibold text-white/75">{galaxy.name}</span>
                <span className="mt-0.5 block text-[7px] text-white/30">Galaxy</span>
              </button>
            ))}
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] text-cyan-200/55">Spatial Navigation</p>
                <h2 className="mt-1 text-2xl font-semibold">{selectedGalaxy?.name ?? "Allpha Galaxy"}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[8px] text-white/35">2D / Spatial Ready</span>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.02] p-4 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] text-cyan-200/55">Galaxy / World Navigator</p>
                <h2 className="mt-1 text-2xl font-semibold">{selectedGalaxy?.name ?? "Select a Galaxy"}</h2>
                <p className="mt-1 max-w-xl text-[10px] leading-5 text-white/35">{selectedGalaxy?.description ?? "Explore authoritative World records grouped by Galaxy."}</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-2xl font-semibold text-cyan-100/80">{visibleWorlds.length}</p>
                <p className="text-[7px] uppercase tracking-[0.16em] text-white/25">Worlds in view</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {loading ? (
                <LoadingCards count={6} />
              ) : featured.length ? (
                featured.map((world, index) => (
                  <button key={world.id} type="button" onClick={() => onEnterWorld(world)} className="group relative min-h-[190px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#070b17] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/25">
                    <WorldOrb index={index} />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[7px] uppercase tracking-[0.16em] text-cyan-100/65">{world.world_type}</span>
                        <span className="text-white/30">↗</span>
                      </div>
                      <div>
                        <p className="text-[7px] uppercase tracking-[0.15em] text-white/25">{themeFor(world)?.category ?? "World"}</p>
                        <h3 className="mt-1 text-base font-semibold">{world.name}</h3>
                        <p className="mt-1 line-clamp-2 text-[8px] leading-4 text-white/35">{world.description ?? "Published World in the Allpha Universe."}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState title={query ? "No World matches this search." : "No World is available for the selected Galaxy yet."} />
              )}
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-violet-200/55">Galaxies</p>
              <h2 className="mt-1 text-xl font-semibold">Choose a Galaxy</h2>
            </div>
            <span className="text-[8px] text-white/25">Tap a Galaxy to load its Worlds</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {galaxies.map((galaxy, index) => (
              <button key={galaxy.id} type="button" onClick={() => onGalaxy(galaxy.id)} className={[
                "min-h-24 rounded-2xl border p-3 text-left transition",
                selectedGalaxy?.id === galaxy.id ? "border-cyan-200/25 bg-cyan-300/[0.06]" : "border-white/[0.08] bg-white/[0.02]",
              ].join(" ")}>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/10 bg-cyan-200/[0.04] text-cyan-100/70">{["✦", "◈", "◇", "◎", "⌁", "✧"][index % 6]}</span>
                <span className="mt-2 block truncate text-[9px] font-semibold text-white/65">{galaxy.name}</span>
                <span className="mt-0.5 block text-[7px] text-white/25">Open Worlds</span>
              </button>
            ))}
          </div>
          {!loading && galaxies.length === 0 ? <EmptyState title="No authoritative Galaxies are available for this account." /> : null}
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Galaxies" value={galaxies.length} />
          <Metric label="Worlds" value={worlds.length} />
          <Metric label="Published Themes" value={themes.length} />
        </section>

        <section className="mt-5 rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-cyan-300/[0.06] via-white/[0.015] to-violet-400/[0.07] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-cyan-200/55">Canonical Spatial Chain</p>
              <h2 className="mt-2 text-xl font-semibold">Galaxy → World → District → Zone → Booth</h2>
              <p className="mt-2 max-w-2xl text-[10px] leading-5 text-white/35">WEB-08 selects the spatial destination. World detail and deeper spatial experiences remain separate phases and continue through the canonical AllphaWorldRenderer.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] text-white/35">Progressive 2D → 2.5D → 3D</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function WorldOrb({ index }: { index: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_28%_28%,rgba(103,232,249,.22),transparent_25%),radial-gradient(circle_at_78%_72%,rgba(124,58,237,.24),transparent_38%),linear-gradient(145deg,#09152a,#03050c)]">
      <div className="absolute left-1/2 top-[42%] h-20 w-20 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff,rgba(103,232,249,.65),rgba(79,70,229,.4),transparent_72%)] shadow-[0_0_55px_rgba(70,190,255,.22)]" />
      {[0, 1].map((ring) => <div key={ring} className="absolute left-1/2 top-[42%] h-20 w-[88%] -translate-x-1/2 rounded-[50%] border border-white/[0.08]" style={{ transform: `translateX(-50%) rotate(${index * 15 + ring * 34}deg)` }} />)}
    </div>
  );
}

function LoadingCards({ count }: { count: number }) {
  return <>{Array.from({ length: count }).map((_, index) => <div key={index} className="h-[190px] animate-pulse rounded-[24px] border border-white/[0.07] bg-white/[0.025]" />)}</>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"><p className="text-[8px] uppercase tracking-[0.18em] text-white/25">{label}</p><p className="mt-2 text-2xl font-semibold text-cyan-100/80">{value}</p></div>;
}

function EmptyState({ title }: { title: string }) {
  return <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] p-6 text-xs text-white/35">{title}</div>;
}
