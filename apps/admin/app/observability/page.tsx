"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Analytics = {
  kpis?: any;
  series?: any[];
  commerce_breakdown?: any;
};

export default function ObservabilityPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [security, setSecurity] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    try {
      const [analytics, posture] = await Promise.all([
        apiFetch<{ data: Analytics }>(
          `/api/v1/admin/control-plane/analytics?date_from=${encodeURIComponent(from.toISOString())}&date_to=${encodeURIComponent(to.toISOString())}`,
        ),
        apiFetch<{ data: any }>("/api/v1/admin/agent-authority/security-summary"),
      ]);
      setData(analytics.data);
      setSecurity(posture.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OBSERVABILITY_LOAD_FAILED");
    }
  }

  useEffect(() => { void load(); }, [days]);

  const k = data?.kpis ?? {};
  const ai = k.ai ?? {};
  const commerce = k.commerce ?? {};
  const governance = k.governance ?? {};
  const universe = k.universe ?? {};

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Phase 28 · Operational Intelligence</p>
            <h1 className="mt-3 text-4xl font-semibold">Observability</h1>
            <p className="mt-3 max-w-4xl text-slate-400">
              Read-only operational telemetry composed from the existing Analytics, Governance and Security boundaries.
              This page does not create telemetry or replace the canonical engines.
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((value) => (
              <button key={value} onClick={() => setDays(value)}
                className={`rounded-xl border px-4 py-2 text-sm ${days === value ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/10"}`}>
                {value}D
              </button>
            ))}
          </div>
        </header>

        {error && <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            ["AI Requests", ai.requests ?? 0],
            ["AI Completed", ai.completed ?? 0],
            ["AI Tokens", ai.tokens ?? 0],
            ["AI Latency", `${Math.round(Number(ai.avg_latency_ms ?? 0))} ms`],
            ["Orders", commerce.orders ?? 0],
            ["Captured", commerce.captured_payments ?? 0],
            ["Approvals", governance.pending_approvals ?? 0],
            ["Agent Presence", universe.active_presences ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-semibold">{String(value)}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
            <h2 className="font-semibold">Daily Operational Series</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500">
                  <tr><th className="py-2">Date</th><th>Orders</th><th>Paid</th><th>Revenue</th><th>Impressions</th><th>Interactions</th><th>AI Tokens</th></tr>
                </thead>
                <tbody>
                  {(data?.series ?? []).map((row: any) => (
                    <tr key={row.date} className="border-t border-white/5">
                      <td className="py-2">{row.date}</td><td>{row.orders ?? 0}</td><td>{row.paid_orders ?? 0}</td>
                      <td>{row.revenue_idr ?? 0}</td><td>{row.impressions ?? 0}</td><td>{row.interactions ?? 0}</td><td>{row.ai_tokens ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.series?.length && <p className="mt-4 text-sm text-slate-500">No telemetry observations exist in the selected window. Empty telemetry is authoritative.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold">Security Posture</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Feature Flags RLS", security?.security?.rls_feature_flags],
                ["Config Versions RLS", security?.security?.rls_config_versions],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className="text-xs text-slate-400">{value === true ? "ENABLED" : value === false ? "DISABLED" : "UNKNOWN"}</span>
                </div>
              ))}
            </div>
            <a href="/security" className="mt-4 inline-flex rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300">Open Security Control Plane →</a>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Governance", `${governance.pending_approvals ?? 0} pending approvals · ${governance.risk_assessments ?? 0} risk assessments`],
            ["Universe", `${universe.worlds ?? 0} worlds · ${universe.districts ?? 0} districts · ${universe.booths ?? 0} booths`],
            ["Audit", `${governance.audit_events ?? 0} audit events · ${governance.moderation_cases ?? 0} moderation cases`],
          ].map(([title, detail]) => (
            <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
              <p className="mt-2 text-sm text-slate-300">{detail}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
