"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Command = {
  id: string;
  agent_id: string;
  command_text: string;
  status: string;
  risk_level: string;
  risk_decision: string;
  error_code?: string | null;
  error_message?: string | null;
  result_summary?: string | null;
  created_at: string;
};

export default function AgentRuntimeSurface() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [agentId, setAgentId] = useState("");
  const [command, setCommand] = useState("");
  const [selected, setSelected] = useState<Command | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await apiFetch<{ data: Command[] }>("/api/v1/agent-runtime/commands?limit=50");
      setCommands(response.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AGENT_RUNTIME_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!agentId.trim() || !command.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await apiFetch<{ data: Command }>("/api/v1/agent-runtime/commands", {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId.trim(), command: command.trim() }),
      });
      setCommands((current) => [created.data, ...current]);
      setCommand("");
      await openCommand(created.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AGENT_COMMAND_CREATE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function openCommand(item: Command) {
    setSelected(item);
    try {
      const response = await apiFetch<{ data: any }>(`/api/v1/agent-runtime/commands/${item.id}`);
      setDetail(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AGENT_COMMAND_DETAIL_FAILED");
    }
  }

  async function planAndExecute() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/agent-runtime/commands/${selected.id}/plan`, { method: "POST" });
      const executed = await apiFetch<{ data: any }>(`/api/v1/agent-runtime/commands/${selected.id}/execute`, { method: "POST" });
      await load();
      await openCommand({ ...selected, status: executed.data.status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "AGENT_RUNTIME_EXECUTION_FAILED");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[.24em] text-cyan-300">Phase 15</p>
            <h1 className="mt-2 text-4xl font-semibold">Agent Runtime &amp; Command System</h1>
            <p className="mt-3 max-w-3xl text-slate-400">Command → intent/planning → policy → risk → approval → execution → audit. No synthetic Agents or execution records are shown.</p>
          </div>
          <button onClick={() => void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Refresh</button>
        </header>

        {error && <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <h2 className="font-semibold">Issue Agent Command</h2>
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <input value={agentId} onChange={(e) => setAgentId(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm" placeholder="Agent UUID" />
            <textarea value={command} onChange={(e) => setCommand(e.target.value)} className="min-h-28 rounded-xl border border-white/10 bg-black/20 p-4 text-sm" placeholder="Describe the task you want the Agent to perform…" />
            <div className="flex justify-end"><button disabled={busy || !agentId.trim() || !command.trim()} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{busy ? "Working…" : "Create Command"}</button></div>
          </form>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Command History</h2><span className="text-xs text-slate-500">{loading ? "Loading…" : `${commands.length} commands`}</span></div>
            {commands.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No Agent commands have been created.</p> : <div className="mt-4 space-y-2">{commands.map((item) => <button key={item.id} onClick={() => void openCommand(item)} className="w-full rounded-xl border border-white/10 p-4 text-left hover:bg-white/[.04]"><div className="flex justify-between gap-3"><span className="font-medium">{item.command_text}</span><span className="text-xs uppercase text-slate-400">{item.status}</span></div><p className="mt-2 text-xs text-slate-500">{item.risk_level} · {new Date(item.created_at).toLocaleString()}</p>{item.error_code && <p className="mt-2 text-xs text-red-300">{item.error_code}</p>}</button>)}</div>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Execution</h2>{selected && <button disabled={busy || !["planning","ready","waiting_approval"].includes(selected.status)} onClick={() => void planAndExecute()} className="rounded-xl border border-white/10 px-3 py-2 text-xs disabled:opacity-40">{busy ? "Executing…" : "Plan & Execute"}</button>}</div>
            {!detail ? <p className="mt-4 text-sm text-slate-500">Select a command to inspect its execution context.</p> : <div className="mt-4 space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">Status</p><p className="mt-1 font-medium">{detail.command.status}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">Risk</p><p className="mt-1 font-medium">{detail.command.risk_level}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">Decision</p><p className="mt-1 font-medium">{detail.command.risk_decision}</p></div></div><div><p className="text-xs uppercase tracking-wider text-slate-500">Tasks &amp; Steps</p><div className="mt-2 space-y-2">{detail.steps?.length ? detail.steps.map((step: any) => <div key={step.id} className="rounded-xl border border-white/10 p-3"><div className="flex justify-between"><span>{step.tool_key}</span><span className="text-xs text-slate-500">{step.status}</span></div><p className="mt-1 text-xs text-slate-500">{step.step_key} · {step.risk_level}</p></div>) : <p className="mt-2 text-sm text-slate-500">No executable steps materialized yet.</p>}</div></div><div><p className="text-xs uppercase tracking-wider text-slate-500">Runtime Events</p><div className="mt-2 max-h-48 overflow-auto space-y-1">{detail.events?.length ? detail.events.map((event: any) => <div key={event.id} className="rounded-lg border border-white/5 p-2 text-xs"><span>{event.event_type}</span> <span className="text-slate-500">{event.from_state} → {event.to_state}</span></div>) : <p className="text-sm text-slate-500">No runtime events.</p>}</div></div></div>}
          </div>
        </section>
      </div>
    </main>
  );
}
