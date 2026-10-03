"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import ContentEvolutionPanel from "./content-evolution-panel";
import AgentIntelligencePanel from "./agent-intelligence-panel";
import AgentCompanion from "./agent-companion";
import UniverseThemeNavigator from "./universe-theme-navigator";

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
  gravity_score?: number;
  gravity_reason_codes?: string[];
  gravity_signals?: {
    feed_base?: number;
    interest_context?: number;
    personalization?: number;
    world_context?: number;
  };
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

type Community = {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  visibility: string;
  join_policy: string;
};

type DiscoveryResponse = {
  surface: Surface;
  content: ContentItem[] | { data?: ContentItem[] };
  worlds: World[];
  communities: Community[];
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
  const [askContentId, setAskContentId] = useState<string | null>(null);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askMeta, setAskMeta] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

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

  async function trackContentInteraction(
    contentId: string,
    eventType: "event_interaction" | "search_after_view",
    metadata: Record<string, unknown>,
  ) {
    try {
      await apiFetch("/api/v1/feed/interactions", {
        method: "POST",
        body: JSON.stringify({
          content_id: contentId,
          surface,
          event_type: eventType,
          metadata: {
            ...metadata,
            discovery_surface: surface,
            discovery_query: query.trim() || null,
          },
        }),
      });
    } catch {
      // Telemetry is best-effort; navigation and discovery must remain available.
    }
  }

  async function askTheContent(contentId: string) {
    if (!askQuestion.trim()) return;
    await trackContentInteraction(contentId, "event_interaction", { action: "ask_content" });
    setAsking(true);
    setAskAnswer(null);
    setAskMeta(null);
    try {
      const result = await apiFetch<{
        data: {
          answer: string;
          rag: { status: string; memory_count: number; knowledge_count: number };
          action_handoff?: { status: string } | null;
        };
      }>("/api/v1/discovery/content/" + contentId + "/ask", {
        method: "POST",
        body: JSON.stringify({ question: askQuestion.trim() }),
      });
      setAskAnswer(result.data.answer);
      setAskMeta(
        result.data.rag.status === "embedding_required"
          ? "Jawaban memakai Content Context. Vector Memory/Knowledge RAG belum dijalankan karena query embedding belum tersedia."
          : "Jawaban menggunakan context yang diizinkan oleh permission boundary.",
      );
    } catch (e) {
      setAskAnswer(e instanceof Error ? e.message : "ASK_CONTENT_FAILED");
    } finally {
      setAsking(false);
    }
  }

  async function openContent(
    event: React.MouseEvent<HTMLAnchorElement>,
    contentId: string,
    action: "open" | "ask_content",
  ) {
    event.preventDefault();
    const href = event.currentTarget.href;
    await trackContentInteraction(contentId, "event_interaction", { action });
    window.location.assign(href);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-700">Allpha Universe</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Discover people, Agents, content and Worlds.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
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
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-cyan-300/30 focus:ring-2"
              />
              <button className="rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-medium text-white">
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
                    : "shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:text-slate-950"
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {surface === "home" ? <UniverseThemeNavigator /> : null}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
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
                      className="min-w-[270px] snap-start rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-violet-50 p-5 shadow-sm hover:border-slate-300"
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{world.world_type}</p>
                      <h2 className="mt-3 text-xl font-semibold">{world.name}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {world.description || "Published World available for exploration."}
                      </p>
                      <p className="mt-5 text-xs text-slate-500">{world.theme_key || "Theme configured by World"}</p>
                    </a>
                  ))}
                </div>
              </Section>
            ) : null}

            {surface === "home" && data?.communities?.length ? (
              <Section title="Communities" eyebrow="COMMUNITY GRAPH" action="/communities">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.communities.map((community) => (
                    <a
                      key={community.id}
                      href={"/communities/" + community.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-700">@{community.handle}</p>
                      <h2 className="mt-3 text-xl font-semibold">{community.name}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {community.description || "Authoritative Community available for participation."}
                      </p>
                      <p className="mt-5 text-xs text-slate-500">{community.visibility} · {community.join_policy}</p>
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
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"
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
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
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
                        {(item.gravity_reason_codes || item.reason_codes || []).filter(Boolean).slice(0, 4).map((reason) => (
                          <span key={reason} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-500">
                            {reason}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex gap-2">
                        <a
                          href={"/content/" + item.id}
                          onClick={(event) => void openContent(event, item.id, "open")}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-950"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setAskContentId(askContentId === item.id ? null : item.id);
                            setAskAnswer(null);
                            setAskMeta(null);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                        >
                          Ask the Content
                        </button>
                      </div>
                      <ContentEvolutionPanel
                        contentId={item.id}
                        onTelemetry={(action) =>
                          void trackContentInteraction(item.id, "event_interaction", {
                            action: "content_evolution:" + action,
                          })
                        }
                      />
                      <AgentIntelligencePanel
                        contentId={item.id}
                        onTelemetry={(action) =>
                          void trackContentInteraction(item.id, "event_interaction", {
                            action,
                          })
                        }
                      />
                      <AgentCompanion
                        contentId={item.id}
                        onTelemetry={(action) =>
                          void trackContentInteraction(item.id, "event_interaction", {
                            action,
                          })
                        }
                      />
                      {askContentId === item.id ? (
                        <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-black/20 p-4">
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              void askTheContent(item.id);
                            }}
                            className="flex flex-col gap-2 sm:flex-row"
                          >
                            <input
                              value={askQuestion}
                              onChange={(event) => setAskQuestion(event.target.value)}
                              placeholder="Tanyakan sesuatu tentang content ini…"
                              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-cyan-300/30"
                              maxLength={12000}
                            />
                            <button
                              disabled={asking || !askQuestion.trim()}
                              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                            >
                              {asking ? "Thinking…" : "Ask"}
                            </button>
                          </form>
                          {askAnswer ? (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{askAnswer}</p>
                              {askMeta ? <p className="mt-3 text-[10px] leading-4 text-slate-500">{askMeta}</p> : null}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
