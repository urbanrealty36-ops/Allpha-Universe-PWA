"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Evidence = {
  domain: string; status: string; canonical_engine: string;
  db: string[]; rpc: string[]; api: string[]; ui: string[];
  gap: string; runtime_gate: boolean;
};

export default function DomainEvidencePage() {
  const [rows, setRows] = useState<Evidence[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{data:{domains:Evidence[]}}>("/api/v1/admin/domain-evidence")
      .then((r) => setRows(r.data.domains))
      .catch((e) => setError(e instanceof Error ? e.message : "DOMAIN_EVIDENCE_LOAD_FAILED"));
  }, []);

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Evidence Lock · Canonical Engines</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Domain Evidence</h1>
        <p className="mt-3 max-w-4xl text-slate-400">
          Source-level evidence registry. It deliberately separates canonical implementation evidence from authenticated runtime/provider verification.
        </p>
        {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        <div className="mt-8 space-y-4">
          {rows.map((row) => (
            <article key={row.domain} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{row.domain}</h2>
                  <p className="mt-1 text-sm text-slate-400">{row.canonical_engine}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs">{row.status}</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><p className="text-[10px] uppercase tracking-wider text-slate-500">DB</p><p className="mt-1 text-xs text-slate-300">{row.db.join(", ") || "—"}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-slate-500">RPC / Function</p><p className="mt-1 text-xs text-slate-300">{row.rpc.join(", ") || "—"}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-slate-500">FastAPI</p><p className="mt-1 text-xs text-slate-300">{row.api.join(", ") || "—"}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-slate-500">UI</p><p className="mt-1 text-xs text-slate-300">{row.ui.join(", ") || "—"}</p></div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{row.gap}</p>
              {row.runtime_gate && <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-300">Runtime verification required before GREEN</p>}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
