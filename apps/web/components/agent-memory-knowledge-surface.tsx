"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Memory = {
  id: string; memory_type: string; content: string; metadata?: Record<string, unknown>;
  status: string; sensitivity?: string | null; source_type?: string | null;
  expires_at?: string | null; reviewed_at?: string | null; created_at: string;
};
type Knowledge = {
  id: string; title?: string | null; content: string; source_uri?: string | null;
  provenance?: Record<string, unknown>; visibility: string; status: string;
  created_at: string; updated_at: string;
};
type Agent = { id: string; name: string; status: string };

const input = "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-300/40";
const button = "rounded-xl border border-white/10 px-4 py-2 text-xs hover:border-cyan-300/30 disabled:opacity-40";

export default function AgentMemoryKnowledgeSurface({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [memoryType, setMemoryType] = useState("explicit");
  const [memoryContent, setMemoryContent] = useState("");
  const [memorySensitivity, setMemorySensitivity] = useState("");
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [knowledgeSource, setKnowledgeSource] = useState("");
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(null);
  const [chunks, setChunks] = useState<Array<{ id: string; chunk_index: number; content: string }>>([]);
  const [chunkContent, setChunkContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [agents, memory, know] = await Promise.all([
        apiFetch<{ data: Agent[] }>("/api/v1/agents/me"),
        apiFetch<{ data: Memory[] }>(`/api/v1/agents/${agentId}/memory`),
        apiFetch<{ data: Knowledge[] }>(`/api/v1/agents/${agentId}/knowledge`),
      ]);
      setAgent((agents.data ?? []).find((item) => item.id === agentId) ?? null);
      setMemories(memory.data ?? []);
      setKnowledge(know.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AGENT_MEMORY_KNOWLEDGE_LOAD_FAILED");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [agentId]);

  async function createMemory(event: FormEvent) {
    event.preventDefault(); if (!memoryContent.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch(`/api/v1/agents/${agentId}/memory`, {
        method: "POST",
        body: JSON.stringify({
          memory_type: memoryType.trim(),
          content: memoryContent.trim(),
          sensitivity: memorySensitivity.trim() || null,
          metadata: { created_from: "web-memory-surface" },
          source_type: "user_explicit",
        }),
      });
      setMemoryContent(""); setMemorySensitivity(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "MEMORY_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function generateMemoryEmbedding(id: string) { setBusy(true); setError(null); try { await apiFetch(`/api/v1/agents/${agentId}/memory/${id}/embedding/generate`, { method: "POST" }); await load(); } catch (e) { setError(e instanceof Error ? e.message : "MEMORY_EMBEDDING_FAILED"); } finally { setBusy(false); } }

  async function memoryAction(id: string, action: "review" | "delete") {
    setBusy(true); setError(null);
    try {
      await apiFetch(`/api/v1/agents/${agentId}/memory/${id}${action === "review" ? "/review" : ""}`, {
        method: action === "delete" ? "DELETE" : "POST",
      });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "MEMORY_ACTION_FAILED"); }
    finally { setBusy(false); }
  }

  async function createKnowledge(event: FormEvent) {
    event.preventDefault(); if (!knowledgeContent.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch(`/api/v1/agents/${agentId}/knowledge`, {
        method: "POST",
        body: JSON.stringify({
          title: knowledgeTitle.trim() || null,
          content: knowledgeContent.trim(),
          source_uri: knowledgeSource.trim() || null,
          provenance: { created_from: "web-memory-knowledge-surface" },
          visibility: "private",
        }),
      });
      setKnowledgeTitle(""); setKnowledgeContent(""); setKnowledgeSource(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "KNOWLEDGE_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function openKnowledge(item: Knowledge) {
    setSelectedKnowledge(item); setError(null);
    try {
      const response = await apiFetch<{ data: Array<{ id: string; chunk_index: number; content: string }> }>(
        `/api/v1/agents/${agentId}/knowledge/${item.id}/chunks`,
      );
      setChunks(response.data ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "KNOWLEDGE_CHUNKS_LOAD_FAILED"); }
  }

  async function addChunk(event: FormEvent) {
    event.preventDefault(); if (!selectedKnowledge || !chunkContent.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch(`/api/v1/agents/${agentId}/knowledge/${selectedKnowledge.id}/chunks`, {
        method: "POST",
        body: JSON.stringify({
          chunk_index: chunks.length,
          content: chunkContent.trim(),
          metadata: { created_from: "web-memory-knowledge-surface" },
          source_locator: {},
        }),
      });
      setChunkContent(""); await openKnowledge(selectedKnowledge);
    } catch (e) { setError(e instanceof Error ? e.message : "KNOWLEDGE_CHUNK_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function generateChunkEmbedding(id: string) { setBusy(true); setError(null); try { await apiFetch(`/api/v1/agents/${agentId}/knowledge/${selectedKnowledge?.id}/chunks/${id}/embedding/generate`, { method: "POST" }); if (selectedKnowledge) await openKnowledge(selectedKnowledge); } catch (e) { setError(e instanceof Error ? e.message : "KNOWLEDGE_EMBEDDING_FAILED"); } finally { setBusy(false); } }

  async function deleteKnowledge(id: string) {
    setBusy(true); setError(null);
    try {
      await apiFetch(`/api/v1/agents/${agentId}/knowledge/${id}`, { method: "DELETE" });
      if (selectedKnowledge?.id === id) { setSelectedKnowledge(null); setChunks([]); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "KNOWLEDGE_DELETE_FAILED"); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-7 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Phase 07 · Agent Intelligence</p>
            <h1 className="mt-2 text-4xl font-semibold">Memory & Knowledge</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Memory dan Knowledge milik Agent yang sedang dipilih. Semua mutation melewati FastAPI ownership boundary; tidak ada synthetic records.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 px-4 py-3 text-xs text-slate-400">
            Agent: <span className="text-slate-200">{agent?.name ?? agentId}</span>
          </div>
        </header>

        {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? <p className="mt-8 text-sm text-slate-500">Loading authoritative Agent intelligence data…</p> : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-semibold">Agent Memory</h2>
              <p className="mt-1 text-xs text-slate-500">Explicit memories can be reviewed or deleted. Sensitivity and consent remain server-authoritative.</p>
              <form onSubmit={createMemory} className="mt-5 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={memoryType} onChange={(e) => setMemoryType(e.target.value)} className={input} placeholder="Memory type" />
                  <input value={memorySensitivity} onChange={(e) => setMemorySensitivity(e.target.value)} className={input} placeholder="Sensitivity (optional)" />
                </div>
                <textarea value={memoryContent} onChange={(e) => setMemoryContent(e.target.value)} className={input} rows={4} placeholder="Explicit memory content…" />
                <button disabled={busy || !memoryContent.trim()} className="w-fit rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">Save Memory</button>
              </form>
              <div className="mt-6 space-y-3">
                {memories.length === 0 ? <p className="text-sm text-slate-500">No Agent memory exists yet.</p> : memories.map((item) => (
                  <article key={item.id} className="rounded-xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-cyan-200">{item.memory_type}</span>
                      <span className="text-[10px] uppercase text-slate-500">{item.status}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{item.content}</p>
                    <p className="mt-2 text-[10px] text-slate-600">{new Date(item.created_at).toLocaleString()} · {item.reviewed_at ? "reviewed" : "not reviewed"}</p>
                    <div className="mt-3 flex gap-2">
                      {!item.reviewed_at && <button disabled={busy} onClick={() => void memoryAction(item.id, "review")} className={button}>Review</button>}
                      <button disabled={busy} onClick={() => void generateMemoryEmbedding(item.id)} className={button}>Generate Embedding</button>
                      <button disabled={busy} onClick={() => void memoryAction(item.id, "delete")} className={button}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-semibold">Knowledge</h2>
              <p className="mt-1 text-xs text-slate-500">Private Agent Knowledge with provenance and optional chunking. Embeddings are generated through the canonical AI Gateway when the real provider is configured; this UI never fabricates vectors.</p>
              <form onSubmit={createKnowledge} className="mt-5 grid gap-3">
                <input value={knowledgeTitle} onChange={(e) => setKnowledgeTitle(e.target.value)} className={input} placeholder="Knowledge title (optional)" />
                <input value={knowledgeSource} onChange={(e) => setKnowledgeSource(e.target.value)} className={input} placeholder="Source URI (optional)" />
                <textarea value={knowledgeContent} onChange={(e) => setKnowledgeContent(e.target.value)} className={input} rows={4} placeholder="Knowledge content…" />
                <button disabled={busy || !knowledgeContent.trim()} className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">Save Knowledge</button>
              </form>
              <div className="mt-6 space-y-3">
                {knowledge.length === 0 ? <p className="text-sm text-slate-500">No Agent Knowledge exists yet.</p> : knowledge.map((item) => (
                  <article key={item.id} className={"rounded-xl border p-4 " + (selectedKnowledge?.id === item.id ? "border-cyan-300/40" : "border-white/10")}>
                    <button onClick={() => void openKnowledge(item)} className="w-full text-left">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-slate-200">{item.title || "Untitled Knowledge"}</span>
                        <span className="text-[10px] uppercase text-slate-500">{item.status}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-400">{item.content}</p>
                      <p className="mt-2 text-[10px] text-slate-600">{item.visibility} · updated {new Date(item.updated_at).toLocaleString()}</p>
                    </button>
                    <div className="mt-3"><button disabled={busy} onClick={() => void deleteKnowledge(item.id)} className={button}>Delete Knowledge</button></div>
                  </article>
                ))}
              </div>
            </section>

            {selectedKnowledge && (
              <section className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.025] p-5 lg:col-span-2">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300">Knowledge Chunks</p><h2 className="mt-1 text-xl font-semibold">{selectedKnowledge.title || "Untitled Knowledge"}</h2></div>
                  <button onClick={() => { setSelectedKnowledge(null); setChunks([]); }} className={button}>Close</button>
                </div>
                <form onSubmit={addChunk} className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <textarea value={chunkContent} onChange={(e) => setChunkContent(e.target.value)} className={input} rows={3} placeholder="Add a chunk manually when authoritative source segmentation is available…" />
                  <button disabled={busy || !chunkContent.trim()} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">Add Chunk</button>
                </form>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {chunks.length === 0 ? <p className="text-sm text-slate-500">No chunks yet.</p> : chunks.map((chunk) => (
                    <article key={chunk.id} className="rounded-xl border border-white/10 p-4">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">Chunk {chunk.chunk_index}</span>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{chunk.content}</p>
                      <button disabled={busy} onClick={() => void generateChunkEmbedding(chunk.id)} className={button}>Generate Embedding</button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
