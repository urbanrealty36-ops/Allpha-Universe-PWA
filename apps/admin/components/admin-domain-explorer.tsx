"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../app/lib/api";

type Props = {
  resource: string;
  title: string;
  eyebrow: string;
  description: string;
  columns: string[];
};

export default function AdminDomainExplorer({ resource, title, eyebrow, description, columns }: Props) {
  const [data, setData] = useState<{items?: any[]; total?: number} | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      const r = await apiFetch<{data: {items?: any[]; total?: number}}>(`/api/v1/admin/control-plane/domains/${resource}?${params}`);
      setData(r.data ?? {items: [], total: 0});
    } catch (e) {
      setError(e instanceof Error ? e.message : "ADMIN_DOMAIN_LOAD_FAILED");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [resource]);

  const rows = data?.items ?? [];
  const statuses = Array.from(new Set(rows.map(x => x.status).filter(Boolean))).slice(0, 12);

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-[1700px]">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{eyebrow} · Phase 27D</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-4xl text-slate-400">{description}</p>
        {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void load(); }} placeholder="Search authoritative records…" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm">
              <option value="">All statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => void load()} className="rounded-xl border border-cyan-300/30 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-300/10">Refresh</button>
          </div>
          <div className="mt-4 text-xs text-slate-500">{loading ? "Loading authoritative data…" : `${data?.total ?? rows.length} record(s) · no synthetic fixtures`}</div>
        </section>
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs text-slate-500">
                <tr>{columns.map(c => <th key={c} className="px-5 py-4">{c.replaceAll("_", " ")}</th>)}</tr>
              </thead>
              <tbody>
                {!rows.length && !loading ? <tr><td colSpan={columns.length} className="px-5 py-14 text-center text-slate-500">No authoritative records returned.</td></tr> :
                  rows.map((row, i) => <tr key={row.id ?? i} className="border-t border-white/5">
                    {columns.map(c => <td key={c} className="max-w-[360px] px-5 py-4 align-top text-xs text-slate-300">{typeof row[c] === "object" && row[c] !== null ? JSON.stringify(row[c]) : String(row[c] ?? "—")}</td>)}
                  </tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
