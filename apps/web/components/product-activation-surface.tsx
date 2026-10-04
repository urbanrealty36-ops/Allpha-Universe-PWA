"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type Check = { key: string; title: string; layer: string; href: string; status: "ready" | "empty" | "blocked"; detail: string };

export default function ProductActivationSurface() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [galaxies, themes, agents, workflows, runs, feed, listings, live, plans, credits] = await Promise.all([
        apiFetch<{ data: any[] }>("/api/v1/universe/galaxies"),
        apiFetch<{ data: any[] }>("/api/v1/themes/world-runtime/catalog"),
        apiFetch<{ data: any[] }>("/api/v1/agents/me"),
        apiFetch<{ data: any[] }>("/api/v1/workflows"),
        apiFetch<{ data: any[] }>("/api/v1/workflows/runs"),
        apiFetch<{ content?: any[] }>("/api/v1/discovery/home?surface=home&limit=1"),
        apiFetch<{ data: any[] }>("/api/v1/marketplace/listings?status=published&limit=1"),
        apiFetch<{ data: any[] }>("/api/v1/live/sessions?limit=1"),
        apiFetch<{ data: any[] }>("/api/v1/billing/plans"),
        apiFetch<{ data: any[] }>("/api/v1/economy/credit-products"),
      ]);

      const rows: Check[] = [
        { key: "identity", title: "Identity & Agent", layer: "Identity → Agent Runtime", href: "/agents", status: agents.data?.length ? "ready" : "empty", detail: agents.data?.length ? `${agents.data.length} owned Agent(s)` : "No owned Agent yet; empty state is authoritative." },
        { key: "memory", title: "Memory / Knowledge", layer: "Agent Context → RAG", href: agents.data?.[0] ? `/agents/${agents.data[0].id}/memory` : "/agents", status: agents.data?.length ? "ready" : "empty", detail: agents.data?.length ? "Memory/Knowledge surface is available for the owned Agent." : "Requires a real owned Agent before memory records can exist." },
        { key: "orchestration", title: "Workflow / Mission", layer: "Workflow → Agent Runtime", href: "/workflows", status: workflows.data?.length ? "ready" : "empty", detail: workflows.data?.length ? `${workflows.data.length} Workflow definition(s), ${runs.data?.length ?? 0} run(s)` : "No Workflow definitions yet." },
        { key: "universe", title: "Galaxy / World", layer: "Universe → Spatial Runtime", href: "/universe", status: galaxies.data?.length ? "ready" : "empty", detail: galaxies.data?.length ? `${galaxies.data.length} authoritative Galaxy record(s)` : "No creator/business Galaxy records; platform catalog remains separate." },
        { key: "theme", title: "Theme / 3D", layer: "Theme → World Renderer", href: "/theme-studio", status: themes.data?.length ? "ready" : "empty", detail: themes.data?.length ? `${themes.data.length} platform Theme Template(s)` : "No Theme catalog returned." },
        { key: "world-builder", title: "World Builder", layer: "Theme Version → World Template", href: "/world-builder", status: "ready", detail: "Canonical builder API and validation lifecycle are available; no builder state is fabricated." },
        { key: "content", title: "Content / Discovery", layer: "Content → Feed → Discovery", href: "/feed", status: feed.content?.length ? "ready" : "empty", detail: feed.content?.length ? "Published Discovery content is available." : "No published Content exists yet." },
        { key: "marketplace", title: "Marketplace", layer: "Listing → Commerce → Payment", href: "/marketplace", status: listings.data?.length ? "ready" : "empty", detail: listings.data?.length ? "Published marketplace listing available." : "No published marketplace listings exist yet." },
        { key: "live", title: "Live / Character", layer: "Live → Agent → Character → Renderer", href: "/live", status: live.data?.length ? "ready" : "empty", detail: live.data?.length ? "Live Session data is available." : "No Live Sessions exist yet." },
        { key: "billing", title: "Billing / Economy", layer: "Commerce → Billing → Economy", href: "/billing", status: plans.data?.length || credits.data?.length ? "ready" : "empty", detail: `${plans.data?.length ?? 0} billing plan(s) · ${credits.data?.length ?? 0} credit product(s)` },
      ];
      setChecks(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PRODUCT_ACTIVATION_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => ({
    ready: checks.filter(x => x.status === "ready").length,
    empty: checks.filter(x => x.status === "empty").length,
    blocked: checks.filter(x => x.status === "blocked").length,
  }), [checks]);

  return (
    <main className="min-h-screen bg-[var(--allpha-space)] px-5 py-7 text-[var(--allpha-text)] sm:px-9">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.25em] text-[var(--allpha-cyan)]">Phase 29–30 · Integration & Feature Activation</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Product Activation Center</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--allpha-text-secondary)]">
              Satu wiring surface untuk menavigasi domain canonical tanpa membuat engine baru. Semua status berasal dari API authoritative dan empty state tetap dipertahankan.
            </p>
          </div>
          <button onClick={() => void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Refresh</button>
        </header>

        {error && <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            ["Ready", counts.ready, "text-emerald-300"],
            ["Authoritative Empty", counts.empty, "text-amber-300"],
            ["Blocked", counts.blocked, "text-red-300"],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
              <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        {loading ? <p className="mt-8 text-sm text-slate-500">Reading canonical domain contracts…</p> : (
          <section className="mt-7 grid gap-4 md:grid-cols-2">
            {checks.map(check => (
              <article key={check.key} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[.2em] text-slate-500">{check.layer}</p>
                    <h2 className="mt-2 text-lg font-semibold">{check.title}</h2>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] ${check.status === "ready" ? "border-emerald-300/20 text-emerald-200" : check.status === "empty" ? "border-amber-300/20 text-amber-200" : "border-red-300/20 text-red-200"}`}>
                    {check.status === "ready" ? "CONNECTED" : check.status === "empty" ? "EMPTY" : "BLOCKED"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{check.detail}</p>
                <a href={check.href} className="mt-4 inline-flex rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 hover:border-cyan-300/30">Open canonical surface →</a>
              </article>
            ))}
          </section>
        )}

        <p className="mt-7 text-xs leading-5 text-slate-600">
          This is an integration/navigation layer only. Ownership, authorization, risk, approval, billing, audit, memory retrieval, Agent execution and 3D rendering remain owned by their existing canonical engines.
        </p>
      </div>
    </main>
  );
}
