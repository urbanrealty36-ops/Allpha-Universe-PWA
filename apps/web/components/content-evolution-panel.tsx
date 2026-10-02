"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

type EvolutionData = {
  path: Array<{
    key: string;
    available: boolean;
    target_type: string;
    target_id?: string | null;
    target_count?: number;
  }>;
  ai_summary?: { summary: string; key_points?: unknown[]; confidence?: number | null } | null;
  discussion: Array<{ id: string; community_id: string }>;
  related_content: Array<{ id: string; title?: string | null; excerpt?: string | null; content_type?: string }>;
  live_experience: Array<{ id: string; title: string; status: string }>;
  world: Array<{ world_id: string; placement?: string | null }>;
};

const labels: Record<string, string> = {
  original: "Original",
  ai_summary: "AI Summary",
  discussion: "Discussion",
  related_content: "Related Content",
  live_experience: "Live Experience",
  world: "World",
};

export default function ContentEvolutionPanel({
  contentId,
  onTelemetry,
}: {
  contentId: string;
  onTelemetry?: (action: string) => void;
}) {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<{ data: EvolutionData }>(
        "/api/v1/discovery/content/" + contentId + "/evolution?related_limit=6",
      );
      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CONTENT_EVOLUTION_FAILED");
    } finally {
      setLoading(false);
    }
  }

  function activate(action: string) {
    onTelemetry?.(action);
  }

  return (
    <div className="mt-4 rounded-2xl border border-violet-300/10 bg-violet-300/[0.03] p-4">
      {!data ? (
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl border border-violet-300/20 px-3 py-2 text-xs text-violet-200 disabled:opacity-40"
        >
          {loading ? "Loading evolution…" : "Explore Content Evolution"}
        </button>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" aria-label="Content evolution path">
            {data.path.map((step) => (
              <button
                key={step.key}
                type="button"
                disabled={!step.available}
                onClick={() => activate(step.key)}
                className={
                  step.available
                    ? "rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[10px] text-violet-100"
                    : "cursor-not-allowed rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-slate-600"
                }
                title={step.available ? labels[step.key] : "Not available from authoritative data"}
              >
                {labels[step.key] || step.key}
                {typeof step.target_count === "number" ? " · " + step.target_count : ""}
              </button>
            ))}
          </div>

          {data.ai_summary ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300">AI Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{data.ai_summary.summary}</p>
            </div>
          ) : null}

          {data.related_content.length ? (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Related Content</p>
              {data.related_content.map((item) => (
                <a
                  key={item.id}
                  href={"/content/" + item.id}
                  onClick={() => activate("related_content_open")}
                  className="block rounded-xl border border-white/10 p-3 hover:border-white/20"
                >
                  <p className="text-sm font-medium">{item.title || "Untitled content"}</p>
                  {item.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.excerpt}</p> : null}
                </a>
              ))}
            </div>
          ) : null}

          {data.discussion.length ? (
            <p className="mt-4 text-xs text-slate-500">
              {data.discussion.length} published Community discussion link{data.discussion.length === 1 ? "" : "s"} available.
            </p>
          ) : null}

          {data.live_experience.length ? (
            <a href="/live" onClick={() => activate("live_experience_open")} className="mt-4 block rounded-xl border border-white/10 p-3 text-xs text-slate-300">
              Open the linked Live Experience
            </a>
          ) : null}

          {data.world.length ? (
            <a href="/worlds" onClick={() => activate("world_open")} className="mt-2 block rounded-xl border border-white/10 p-3 text-xs text-slate-300">
              Explore the linked World
            </a>
          ) : null}
        </>
      )}
      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
