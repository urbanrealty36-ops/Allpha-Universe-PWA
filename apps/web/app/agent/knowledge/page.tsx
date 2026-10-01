"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Agent = { id: string; name: string };
type Knowledge = { id: string; title: string | null; content: string; source_uri: string | null; status: string; created_at: string; updated_at: string };

export default function Page() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [items, setItems] = useState<Knowledge[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUri, setSourceUri] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const agents = await apiFetch<{ data: Agent[] }>("/api/v1/agents/me");
      const selected = agents.data[0] ?? null;
      setAgent(selected);
      if (selected) {
        const result = await apiFetch<{ data: Knowledge[] }>(`/api/v1/agents/${selected.id}/knowledge`);
        setItems(result.data);
      } else setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "KNOWLEDGE_LOAD_FAILED");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!agent || !content.trim()) return;
    setSaving(true); setError(null);
    try {
      await apiFetch(`/api/v1/agents/${agent.id}/knowledge`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          source_uri: sourceUri.trim() || null,
          provenance: { source: "user_input" },
        }),
      });
      setTitle(""); setContent(""); setSourceUri("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "KNOWLEDGE_CREATE_FAILED");
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.24em] text-violet-300">Agent Knowledge</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Knowledge</h1>
        <p className="mt-4 max-w-2xl text-slate-300">Persistent source-backed knowledge with provenance, chunks and semantic retrieval.</p>

        {error && <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? (
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">Loading authoritative knowledge data…</section>
        ) : !agent ? (
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-medium text-slate-200">No Agent available</p>
            <p className="mt-2 text-sm text-slate-400">Create an Agent first. No synthetic knowledge is shown.</p>
          </section>
        ) : (
          <>
            <form onSubmit={submit} className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-medium text-slate-200">Add source knowledge for {agent.name}</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Knowledge content…" rows={7} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none" />
              <div className="flex gap-3">
                <input value={sourceUri} onChange={(e) => setSourceUri(e.target.value)} placeholder="Source URI (optional)" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none" />
                <button disabled={saving || !content.trim()} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{saving ? "Saving…" : "Save Knowledge"}</button>
              </div>
            </form>

            <section className="mt-6 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">No knowledge records exist for this Agent.</div>
              ) : items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-medium text-slate-200">{item.title || "Untitled knowledge"}</h2>
                    <span className="text-xs text-slate-500">{item.status}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{item.content}</p>
                  {item.source_uri && <p className="mt-3 break-all text-xs text-slate-500">{item.source_uri}</p>}
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
