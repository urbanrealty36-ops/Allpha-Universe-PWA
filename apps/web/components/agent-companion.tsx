"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

type Agent = {
  id: string;
  name: string;
  handle?: string | null;
  status?: string;
};

type IntelligenceResult = {
  insight: string;
  rag: { status: string; memory_count: number; knowledge_count: number };
  agent_context: {
    name?: string | null;
    verification_status?: string | null;
    capability_count: number;
    policy_autonomy_level?: string | null;
  };
  evidence_context: {
    reviewed_ai_capsule: boolean;
    topic_count: number;
  };
};

const prompts = [
  "Jelaskan inti content ini untuk saya.",
  "Apa yang paling relevan dari content ini?",
  "Apa yang perlu saya perhatikan dari content ini?",
];

export default function AgentCompanion({
  contentId,
  onTelemetry,
}: {
  contentId: string;
  onTelemetry?: (action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [thinking, setThinking] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || agents.length || loadingAgents) return;

    setLoadingAgents(true);
    setStatus(null);
    try {
      const response = await apiFetch<{ data: Agent[] }>("/api/v1/agents/me");
      const owned = response.data || [];
      setAgents(owned);
      if (owned[0]) setAgentId(owned[0].id);
      onTelemetry?.("agent_companion_open");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AGENT_COMPANION_AGENT_LIST_FAILED");
      onTelemetry?.("agent_companion_error");
    } finally {
      setLoadingAgents(false);
    }
  }

  async function ask(prompt?: string) {
    if (prompt) setQuestion(prompt);
    const requestedQuestion = (prompt || question).trim();
    if (!agentId || !requestedQuestion) return;

    setThinking(true);
    setResult(null);
    setStatus(null);
    onTelemetry?.("agent_companion_ask");

    try {
      const response = await apiFetch<{ data: IntelligenceResult }>(
        "/api/v1/discovery/content/" + contentId + "/agent-intelligence",
        {
          method: "POST",
          body: JSON.stringify({
            agent_id: agentId,
            focus: requestedQuestion,
          }),
        },
      );
      setResult(response.data);
      onTelemetry?.("agent_companion_result");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AGENT_COMPANION_FAILED");
      onTelemetry?.("agent_companion_error");
    } finally {
      setThinking(false);
    }
  }

  return (
    <aside className="mt-4">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] px-4 py-3 text-left"
      >
        <span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-cyan-300">Optional</span>
          <span className="mt-1 block text-sm font-medium text-slate-200">Agent Companion</span>
        </span>
        <span className="text-xs text-slate-500">{open ? "Hide" : "Ask your Agent"}</span>
      </button>

      {open ? (
        <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          {loadingAgents ? (
            <p className="text-xs text-slate-500">Memuat Owned Agent…</p>
          ) : agents.length === 0 ? (
            <div>
              <p className="text-xs leading-5 text-slate-500">
                Companion membutuhkan Owned Agent. Tidak ada Agent sintetis yang dibuat.
              </p>
              {status ? <p className="mt-2 text-[10px] text-red-300">{status}</p> : null}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  aria-label="Owned Agent untuk Companion"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} className="bg-slate-900">
                      {agent.name}
                    </option>
                  ))}
                </select>
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void ask();
                  }}
                  maxLength={4000}
                  placeholder="Tanyakan tentang content ini…"
                  className="min-w-0 flex-[2] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 outline-none focus:ring-2 focus:ring-cyan-300/20"
                />
                <button
                  type="button"
                  disabled={thinking || !agentId || !question.trim()}
                  onClick={() => void ask()}
                  className="rounded-xl bg-cyan-200 px-3 py-2 text-xs font-medium text-slate-950 disabled:opacity-40"
                >
                  {thinking ? "Thinking…" : "Ask"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={thinking}
                    onClick={() => void ask(prompt)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {result ? (
                <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                      {result.agent_context.name || "Owned Agent"}
                    </p>
                    <span className="text-[10px] text-slate-600">RAG: {result.rag.status}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {result.insight}
                  </p>
                  <p className="mt-3 text-[10px] leading-4 text-slate-500">
                    Memory {result.rag.memory_count} · Knowledge {result.rag.knowledge_count} · Topics{" "}
                    {result.evidence_context.topic_count}
                    {result.evidence_context.reviewed_ai_capsule ? " · Reviewed AI Capsule" : ""}
                  </p>
                </div>
              ) : null}

              {status ? <p className="mt-3 text-xs text-red-300">{status}</p> : null}

              <p className="mt-4 text-[10px] leading-4 text-slate-600">
                Companion hanya membantu memahami Content. Permintaan tindakan tidak dieksekusi dari sini;
                tindakan Agent tetap mengikuti Agent Runtime, policy, risk dan approval.
              </p>
            </>
          )}
        </div>
      ) : null}
    </aside>
  );
}
