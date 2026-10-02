"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Agent = { id: string; name: string; status: string; runtime_state: string };
type Activation = {
  data: {
    status: "ready" | "blocked";
    checks: {
      owned_agent: { ready: boolean; count: number };
      published_content: { ready: boolean; count: number };
      ai_gateway: { ready: boolean; enabled_models: number; providers: Array<{ provider_key: string; enabled: boolean; credential_bound: boolean }> };
      agent_runtime: { ready: boolean; command_observed: boolean };
      feed_telemetry: { ready: boolean };
      rag: { optional_ready: boolean; memory_available: boolean; knowledge_available: boolean; embedding_generation: boolean };
    };
    blockers: Array<{ code: string; message: string }>;
    notes: string[];
  };
};

export default function RuntimeActivationPage() {
  const [activation, setActivation] = useState<Activation | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [smokeResult, setSmokeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [status, owned] = await Promise.all([
        apiFetch<Activation>("/api/v1/runtime/activation"),
        apiFetch<{ data: Agent[] }>("/api/v1/agents/me"),
      ]);
      setActivation(status);
      setAgents(owned.data || []);
      if (!selectedAgent && owned.data?.[0]) setSelectedAgent(owned.data[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "RUNTIME_ACTIVATION_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function runGatewaySmokeTest() {
    if (!selectedAgent || running) return;
    setRunning(true);
    setSmokeResult(null);
    setError(null);
    try {
      const result = await apiFetch<any>("/api/v1/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          agent_id: selectedAgent,
          capabilities: ["ai.generate"],
          idempotency_key: crypto.randomUUID(),
          messages: [
            {
              role: "system",
              content: "You are performing an Allpha runtime smoke test. Answer briefly and do not claim actions were executed."
            },
            {
              role: "user",
              content: "Reply with exactly: ALLPHA_RUNTIME_OK"
            }
          ],
          metadata: { purpose: "phase_11a14_runtime_smoke_test" }
        })
      });
      setSmokeResult(result);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI_GATEWAY_SMOKE_TEST_FAILED");
    } finally {
      setRunning(false);
    }
  }

  const checks = activation?.data.checks;
  const rows = [
    ["Authenticated User", true, "Session is required by the API boundary."],
    ["Agent Catalog", Boolean(checks?.owned_agent || activation), "111 Skills · 71 Types · 34 Characters"],
    ["Real Owned Agent", Boolean(checks?.owned_agent.ready), checks?.owned_agent.ready ? `${checks.owned_agent.count} owned Agent(s)` : "Create one through Agent Factory."],
    ["Published Content", Boolean(checks?.published_content.ready), checks?.published_content.ready ? `${checks.published_content.count} published public item(s)` : "Create real Content from /create and publish it."],
    ["OpenAI AI Gateway", Boolean(checks?.ai_gateway.ready), checks?.ai_gateway.ready ? `${checks.ai_gateway.enabled_models} enabled model(s); server credential bound` : "Provider/model or server credential is still incomplete."],
    ["Agent Runtime", Boolean(checks?.agent_runtime.ready), checks?.agent_runtime.command_observed ? "Command telemetry observed." : "Run a real Agent command after Gateway activation."],
    ["Discovery Telemetry", Boolean(checks?.feed_telemetry.ready), checks?.feed_telemetry.ready ? "Interaction telemetry observed." : "Open/interact with real Discovery content."],
    ["RAG", Boolean(checks?.rag.optional_ready), checks?.rag.optional_ready ? "Real Memory/Knowledge available." : "Optional for first non-RAG activation; embeddings remain unconfigured."],
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Phase 11A.14</p>
            <h1 className="mt-3 text-4xl font-semibold">Real Runtime Activation</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Activation center untuk memverifikasi jalur nyata User → Agent → Content/Discovery → AI Gateway → Agent Runtime → Telemetry.
              Tidak ada data sintetis yang dibuat oleh halaman ini.
            </p>
          </div>
          <button onClick={() => void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400/30">
            Refresh Runtime
          </button>
        </div>

        {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? <p className="mt-8 text-slate-400">Memeriksa runtime…</p> : <>
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Activation Status</p>
                <p className="mt-2 text-2xl font-semibold">{activation?.data.status === "ready" ? "Ready for E2E" : "Blocked by Runtime Dependencies"}</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-xs font-semibold ${activation?.data.status === "ready" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
                {activation?.data.status?.toUpperCase()}
              </span>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map(([name, ready, detail]) => (
              <div key={String(name)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium">{name}</h2>
                  <span className={`text-xs ${ready ? "text-emerald-300" : "text-amber-300"}`}>{ready ? "READY" : "PENDING"}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.035] p-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">OpenAI Gateway Smoke Test</p>
            <h2 className="mt-2 text-xl font-semibold">Test the real server-side model path</h2>
            <p className="mt-2 text-sm text-slate-400">
              Ini hanya dapat dijalankan dengan Agent milik user. Request melewati FastAPI AI Gateway; browser tidak pernah menerima atau mengirim API key ke OpenAI.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} disabled={!agents.length} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">
                {!agents.length && <option value="">Belum ada Agent</option>}
                {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name} · {agent.status}</option>)}
              </select>
              <button onClick={() => void runGatewaySmokeTest()} disabled={!selectedAgent || running} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">
                {running ? "Testing…" : "Run Gateway Smoke Test"}
              </button>
            </div>
            {smokeResult && <pre className="mt-5 max-h-80 overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-300">{JSON.stringify(smokeResult, null, 2)}</pre>}
          </section>

          {activation?.data.blockers.length ? <section className="mt-6 rounded-3xl border border-amber-400/15 bg-amber-400/[0.035] p-6">
            <h2 className="text-xl font-semibold">Current Blockers</h2>
            <div className="mt-4 space-y-3">
              {activation.data.blockers.map(blocker => <div key={blocker.code} className="rounded-xl border border-white/10 p-4"><p className="text-sm font-medium text-amber-200">{blocker.code}</p><p className="mt-1 text-sm text-slate-400">{blocker.message}</p></div>)}
            </div>
          </section> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/agents/create" className="rounded-xl border border-cyan-400/30 px-4 py-3 text-sm text-cyan-200">Open Agent Factory</a>
            <a href="/create" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300">Create Content</a>
            <a href="/feed" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300">Open Discovery</a>
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-600">
            Secret material is never displayed. RAG embeddings are not fabricated. Agent authority remains Policy → Risk → Approval → Agent Runtime.
          </p>
        </>}
      </div>
    </main>
  );
}
