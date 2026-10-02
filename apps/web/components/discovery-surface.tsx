"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type Surface = "home" | "following" | "for_you" | "moments" | "worlds" | "live";

type ContentItem = {
  id: string;
  owner_type?: string;
  owner_id?: string;
  owner_display_name?: string | null;
  owner_handle?: string | null;
  content_type?: string;
  title?: string | null;
  excerpt?: string | null;
  body?: string | null;
  rank_score?: number;
  position?: number;
  reason_codes?: (string | null)[];
};

type World = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  world_type: string;
  theme_key?: string | null;
  updated_at?: string;
};

type Live = {
  id: string;
  title: string;
  source_type: string;
  status: string;
  scheduled_at?: string | null;
  district_id?: string | null;
  booth_id?: string | null;
};

type DiscoveryResponse = {
  surface: Surface;
  content: ContentItem[] | { data?: ContentItem[] };
  worlds: World[];
  live: Live[];
  navigation: Record<string, string>;
};

const tabs: { key: Surface; label: string }[] = [
  { key: "home", label: "Universe" },
  { key: "following", label: "Following" },
  { key: "for_you", label: "For You" },
  { key: "moments", label: "Moments" },
  { key: "worlds", label: "Worlds" },
  { key: "live", label: "Live" },
];

function arrayData<T>(value: T[] | { data?: T[] }): T[] {
  return Array.isArray(value) ? value : value.data ?? [];
}

export default function DiscoverySurface() {
  const [surface, setSurface] = useState<Surface>("home");
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load(nextSurface = surface) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ surface: nextSurface, limit: "12" });
      if (query.trim()) params.set("query", query.trim());
      const result = await apiFetch<DiscoveryResponse>("/api/v1/discovery/home?" + params);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "DISCOVERY_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(surface);
  }, [surface]);

  const content = useMemo(() => (data ? arrayData(data.content) : []), [data]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-300">Allpha Universe</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Discover people, Agents, content and Worlds.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                A unified discovery surface over Allpha&apos;s authoritative Feed, Universe and Live engines.
                Relevance is contextual; authority, ownership and permissions remain outside the presentation layer.
              </p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void load();
              }}
              className="flex w-full max-w-xl gap-2"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search published discovery…"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none ring-cyan-300/30 focus:ring-2"
              />
              <button className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-slate-950">
                Search
              </button>
            </form>
          </div>

          <nav className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label="Discovery surfaces">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSurface(tab.key)}
                className={
                  surface === tab.key
                    ? "shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950"
                    : "shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white"
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">
            Loading authoritative discovery…
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {surface === "home" && data?.worlds.length ? (
              <Section title="Universe Scroll" eyebrow="WORLD DISCOVERY" action="/worlds">
                <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                  {data.worlds.map((world) => (
                    <a
                      key={world.id}
                      href="/worlds"
                      className="min-w-[270px] snap-start rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/[0.12] via-white/[0.04] to-violet-400/[0.10] p-5 hover:border-white/20"
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{world.world_type}</p>
                      <h2 className="mt-3 text-xl font-semibold">{world.name}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                        {world.description || "Published World available for exploration."}
                      </p>
                      <p className="mt-5 text-xs text-slate-500">{world.theme_key || "Theme configured by World"}</p>
                    </a>
                  ))}
                </div>
              </Section>
            ) : null}

            {surface === "home" && data?.live.length ? (
              <Section title="Live Now" eyebrow="LIVE EXPERIENCE" action="/live">
                <div className="grid gap-4 md:grid-cols-2">
                  {data.live.map((live) => (
                    <a
                      key={live.id}
                      href="/live"
                      className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 hover:border-white/20"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="rounded-full border border-red-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-red-300">
                          Live
                        </span>
                        <span className="text-xs text-slate-500">{live.source_type}</span>
                      </div>
                      <h2 className="mt-4 text-xl font-semibold">{live.title}</h2>
                      <p className="mt-2 text-sm text-slate-500">Open the authoritative Live session.</p>
                    </a>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section
              title={surface === "moments" ? "Moments" : surface === "worlds" ? "World Stream" : "Content Gravity"}
              eyebrow={surface === "moments" ? "REELS + VIDEO" : "PUBLISHED CONTENT"}
            >
              {content.length === 0 ? (
                <EmptyState
                  text={
                    surface === "live"
                      ? "No live content is available from the current live-content source."
                      : "No published content matches this discovery surface yet."
                  }
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {content.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                          {item.content_type || "content"}
                        </p>
                        {typeof item.rank_score === "number" && (
                          <span className="text-[10px] text-slate-600">relevance {item.rank_score.toFixed(2)}</span>
                        )}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold">{item.title || "Untitled content"}</h2>
                      {item.excerpt ? (
                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-400">{item.excerpt}</p>
                      ) : null}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {(item.reason_codes || []).filter(Boolean).slice(0, 4).map((reason) => (
                          <span key={reason} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-500">
                            {reason}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex gap-2">
                        <a href={"/content/" + item.id} className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-950">
                          Open
                        </a>
                        <a href={"/content/" + item.id} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400">
                          Ask the Content
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
        </div>
        {action ? (
          <a href={action} className="text-xs text-slate-500 hover:text-white">
            Explore →
          </a>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-slate-500">
      {text}
    </div>
  );
}
