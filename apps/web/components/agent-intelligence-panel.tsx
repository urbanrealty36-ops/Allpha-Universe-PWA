"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

type Agent = {
  id: string;
  name: string;
  handle?: string | null;
  status?: string;
  description?: string | null;
};

export default function AgentIntelligencePanel({
  contentId,
  onTelemetry,
}: {
  contentId: string;
  onTelemetry?: (action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [focus, setFocus] = useState("");
  const [insight, setInsight] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [thinking, setThinking] = useState(false);

  async function openPanel() {
    setOpen((value) => !value);
    if (open || agents.length || loadingAgents) return;
    setLoadingAgents(true);
    try {
      const result = await apiFetch<{ data: Agent[] }>("/api/v1/agents/me");
      const owned = result.data || [];
      setAgents(owned);
      if (owned[0]) setAgentId(owned[0].id);
      onTelemetry?.("agent_intelligence_open");
    } catch (error) {
      setMeta(error instanceof Error ? error.message : "AGENT_LIST_FAILED");
    } finally {
      setLoadingAgents(false);
    }
  }

  async function generateInsight() {
    if (!agentId) return;
    setThinking(true);
    setInsight(null);
    setMeta(null);
    onTelemetry?.("agent_intelligence_generate");
    try {
      const result = await apiFetch<{
        data: {
          insight: string;
          rag: { status: string; memory_count: number; knowledge_count: number };
          agent_context: {
            name?: string | null;
            verification_status?: string | null;
            capability_count: number;
            policy_autonomy_level?: string | null;
          };
          evidence_context: { reviewed_ai_capsule: boolean; topic_count: number };
        };
      }>("/api/v1/discovery/content/" + contentId + "/agent-intelligence", {
        method: "POST",
        body: JSON.stringify({
          agent_id: agentId,
          focus: focus.trim() || null,
        }),
      });
      setInsight(result.data.insight);
      setMeta(
        [
          "Agent: " + (result.data.agent_context.name || "Owned Agent"),
          "RAG: " + result.data.rag.status,
          "Memory " + result.data.rag.memory_count,
          "Knowledge " + result.data.rag.knowledge_count,
          result.data.evidence_context.reviewed_ai_capsule ? "Reviewed AI Capsule tersedia" : "Reviewed AI Capsule belum tersedia",
        ].join(" · "),
      );
      onTelemetry?.("agent_intelligence_result");
    } catch (error) {
      setMeta(error instanceof Error ? error.message : "AGENT_INTELLIGENCE_FAILED");
      onTelemetry?.("agent_intelligence_error");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void openPanel()}
        className="rounded-xl border border-violet-300/20 bg-violet-300/[0.06] px-3 py-2 text-xs text-violet-200"
        aria-expanded={open}
      >
        Agent Intelligence
      </button>

      {open ? (
        <div className="mt-3 rounded-2xl border border-violet-300/10 bg-black/20 p-4">
          {loadingAgents ? (
            <p className="text-xs text-slate-500">Memuat Owned Agent…</p>
          ) : agents.length === 0 ? (
            <p className="text-xs leading-5 text-slate-500">
              Belum ada Owned Agent pada akun ini. Agent Intelligence tidak membuat Agent sintetis.
            </p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                <select
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
                  aria-label="Pilih Owned Agent"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} className="bg-slate-900">
                      {agent.name}
                    </option>
                  ))}
                </select>
                <input
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  maxLength={4000}
                  placeholder="Fokus insight (opsional)…"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 outline-none focus:ring-2 focus:ring-violet-300/20"
                />
              </div>
              <button
                type="button"
                onClick={() => void generateInsight()}
                disabled={thinking || !agentId}
                className="mt-3 rounded-xl bg-violet-200 px-3 py-2 text-xs font-medium text-slate-950 disabled:opacity-40"
              >
                {thinking ? "Analyzing…" : "Generate Agent Insight"}
              </button>
              {insight ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{insight}</p>
                  {meta ? <p className="mt-3 text-[10px] leading-4 text-slate-500">{meta}</p> : null}
                </div>
              ) : meta && agents.length ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">{meta}</p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
