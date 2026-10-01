"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Agent = { id: string; name: string };
type Memory = {
  id: string;
  memory_type: string;
  content: string;
  status: string;
  sensitivity: string | null;
  expires_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export default function Page() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [memory, setMemory] = useState<Memory[]>([]);
  const [content, setContent] = useState("");
  const [memoryType, setMemoryType] = useState("fact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const agents = await apiFetch<{ data: Agent[] }>("/api/v1/agents/me");
      const selected = agents.data[0] ?? null;
      setAgent(selected);
      if (selected) {
        const result = await apiFetch<{ data: Memory[] }>(`/api/v1/agents/${selected.id}/memory`);
        setMemory(result.data);
      } else {
        setMemory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "MEMORY_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!agent || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/agents/${agent.id}/memory`, {
        method: "POST",
        body: JSON.stringify({ memory_type: memoryType, content: content.trim() }),
      });
      setContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "MEMORY_CREATE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Agent</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Agent Mind</h1>
        <p className="mt-4 max-w-2xl text-slate-300">Persistent memory with owner-controlled retention, review and deletion.</p>

        {error && <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? (
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">Loading authoritative memory data…</section>
        ) : !agent ? (
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-medium text-slate-200">No Agent available</p>
            <p className="mt-2 text-sm text-slate-400">Create an Agent first. This surface does not display synthetic memory.</p>
          </section>
        ) : (
          <>
            <form onSubmit={submit} className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-medium text-slate-200">Capture memory for {agent.name}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr_auto]">
                <select value={memoryType} onChange={(e) => setMemoryType(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                  <option value="fact">Fact</option>
                  <option value="preference">Preference</option>
                  <option value="context">Context</option>
                  <option value="goal">Goal</option>
                  <option value="relationship">Relationship</option>
                </select>
                <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter real memory content…" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none" />
                <button disabled={saving || !content.trim()} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{saving ? "Saving…" : "Save Memory"}</button>
              </div>
            </form>

            <section className="mt-6 space-y-3">
              {memory.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">No memory records exist for this Agent.</div>
              ) : memory.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.memory_type}</span>
                    <span className="text-xs text-slate-500">{item.status}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{item.content}</p>
                  <p className="mt-3 text-xs text-slate-500">Created {new Date(item.created_at).toLocaleString()}</p>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
