"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import AgentAccountCard, { AgentAccount } from "./agent-account-card";

type Template = {
  id: string; name: string; slug: string; category: string; description: string | null;
  catalog_order: number | null; source: "platform" | "creator"; status: string;
};
type Version = {
  id: string; version: number; template_schema: Record<string, any>;
  performance_budget: Record<string, any>; accessibility_constraints: Record<string, any>;
};
type Agent = { id: string; name: string; handle: string | null; status: string; runtime_state: string; };
type Collaboration = {
  id: string; live_session_id: string; agent_id: string; mode: string; required_capability: string | null;
  capability_verified: boolean; policy_verified: boolean; consent_status: string; status: string; risk_decision: string;
  started_at: string | null; ended_at: string | null;
};
type LiveMessage = {
  id: string; live_session_id: string; live_collaboration_id: string | null; viewer_id: string | null;
  sender_type: "owner" | "agent" | "audience" | "system"; sender_user_id: string | null; sender_agent_id: string | null;
  role: "user" | "assistant" | "system"; message_type: string; content: string; created_at: string;
};
type LiveCharacterAsset = { id: string; agent_id: string | null; asset_type: string; name: string; storage_path: string; mime_type: string | null; metadata: Record<string, any>; moderation_status: string; status: string; };
type LiveCharacterBinding = { id: string; live_session_id: string; live_agent_collaboration_id: string | null; asset_id: string; status: string; selected_at: string; removed_at: string | null; metadata: Record<string, any>; };
type LiveInteraction = {
  id: string; live_session_id: string; viewer_id: string; interaction_type: string; payload: Record<string, any>;
  status: string; created_at: string;
};
type Session = {
  id: string; title: string; status: "draft" | "scheduled" | "live" | "ended" | "cancelled";
  visibility: string; source_type: string; scheduled_at: string | null;
  experience_template_id: string; experience_template_version_id: string; host_agent_id?: string | null;
  live_experience_templates?: { name: string; slug: string; category: string } | null;
  live_experience_template_versions?: { version: number } | null;
};

const card = "rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)]";
const input = "w-full rounded-[var(--allpha-radius-md)] border border-white/10 bg-[var(--allpha-space-elevated)] px-3 py-2 text-sm text-[var(--allpha-text)] outline-none focus:border-[var(--allpha-cyan)]";

function Preview({ schema }: { schema: Record<string, any> | null }) {
  const stage = schema?.stage ?? {};
  const roles = Array.isArray(schema?.roles) ? schema.roles : [];
  const overlays = schema?.overlays ?? {};
  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-space)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(99,102,241,.28),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,.18),transparent_30%)]" />
      <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[9px] uppercase tracking-[.18em] text-[var(--allpha-cyan)]">
        {stage.layout ?? "live_stage"}
      </div>
      <div className="absolute right-3 top-3 flex gap-1">
        <span className="rounded-full bg-red-500/80 px-2 py-1 text-[9px]">LIVE</span>
        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[9px]">AI COLLAB</span>
      </div>
      <div className="absolute inset-x-5 bottom-9 top-12 grid min-h-0 gap-2" style={{ gridTemplateColumns: roles.length > 2 ? "repeat(3,minmax(0,1fr))" : "repeat(2,minmax(0,1fr))" }}>
        {roles.map((role: any, i: number) => (
          <div key={role.slot ?? i} className="relative min-h-0 rounded-xl border border-white/10 bg-white/[.06] p-2 backdrop-blur">
            <div className="absolute bottom-2 left-2 right-2 rounded-md bg-black/45 px-2 py-1 text-[9px] text-white/80">{role.slot ?? "participant"}</div>
            <div className="flex h-full items-center justify-center text-xl text-white/25">{role.slot?.startsWith("ai_") || role.slot?.startsWith("agent_") ? "✦" : "●"}</div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[8px] uppercase tracking-wider text-white/50">
        <span>{overlays.primary ?? "overlay"}</span><span>captions · audience · owner control</span>
      </div>
    </div>
  );
}

function statusClass(status: Session["status"]) {
  if (status === "live") return "text-red-300 border-red-300/20 bg-red-300/10";
  if (status === "scheduled") return "text-[var(--allpha-cyan)] border-[var(--allpha-cyan)]/20 bg-[var(--allpha-cyan)]/10";
  if (status === "ended" || status === "cancelled") return "text-white/45 border-white/10 bg-white/5";
  return "text-amber-200 border-amber-200/20 bg-amber-200/10";
}

export default function LiveStreamingCollaboration() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [category, setCategory] = useState("all");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [sourceType, setSourceType] = useState("live");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [collaborationMode, setCollaborationMode] = useState("cohost");
  const [requiredCapability, setRequiredCapability] = useState("live");
  const [collaborations, setCollaborations] = useState<Record<string, Collaboration[]>>({});
  const [runtimeCommand, setRuntimeCommand] = useState<Record<string, string>>({});
  const [runtimeCommands, setRuntimeCommands] = useState<Record<string, { id: string; status: string }[]>>({});
  const [selectedLiveSessionId, setSelectedLiveSessionId] = useState("");
  const [selectedConversationCollabId, setSelectedConversationCollabId] = useState("");
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [liveInteractions, setLiveInteractions] = useState<LiveInteraction[]>([]);
  const [characterAssets, setCharacterAssets] = useState<LiveCharacterAsset[]>([]);
  const [characterBinding, setCharacterBinding] = useState<LiveCharacterBinding | null>(null);
  const [selectedCharacterAssetId, setSelectedCharacterAssetId] = useState("");
  const [conversationText, setConversationText] = useState("");
  const [viewerId, setViewerId] = useState("");
  const [audiencePresence, setAudiencePresence] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState("disconnected");\n  const [liveHostAgent, setLiveHostAgent] = useState<AgentAccount|null>(null);

  useEffect(() => {
    const session = sessions.find(s => s.id === selectedLiveSessionId);
    const hostId = session?.host_agent_id;
    if (!hostId) { setLiveHostAgent(null); return; }
    void (async () => {
      try {
        const r = await apiFetch<{ data: { agent: { id: string; name: string; handle: string | null; description: string | null; avatar_path: string | null; status: string; runtime_state: string; is_owned_by_viewer: boolean }; skills: AgentAccount["skills"]; reputation: { quality_score: number; verified_usage_count: number; successful_usage_count: number; reward_credits_earned: number; challenge_level: number } } }>("/api/v1/agent-catalog/accounts/" + hostId);
        const x=r.data;
        setLiveHostAgent({agent_id:x.agent.id,name:x.agent.name,handle:x.agent.handle,description:x.agent.description,avatar_path:x.agent.avatar_path,status:x.agent.status,runtime_state:x.agent.runtime_state,is_owned_by_viewer:x.agent.is_owned_by_viewer,skills:x.skills,quality_score:x.reputation.quality_score,verified_usage_count:x.reputation.verified_usage_count,successful_usage_count:x.reputation.successful_usage_count,reward_credits_earned:x.reputation.reward_credits_earned,challenge_level:x.reputation.challenge_level});
      } catch { setLiveHostAgent(null); }
    })();
  }, [selectedLiveSessionId, sessions]);
  async function loadCatalog() {
    setLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: Template[] }>("/api/v1/live/templates?source=platform&limit=100");
      const rows = r.data ?? [];
      setTemplates(rows);
      if (!selected && rows[0]) setSelected(rows[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_TEMPLATE_LOAD_FAILED");
    } finally { setLoading(false); }
  }

  async function loadSessions() {
    try {
      const r = await apiFetch<{ data: Session[] }>("/api/v1/live/sessions?limit=50");
      setSessions(r.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_SESSION_LOAD_FAILED");
    }
  }

  async function loadAgents() {
    try {
      const r = await apiFetch<{ data: Agent[] }>("/api/v1/agents/me");
      const rows = r.data ?? [];
      setAgents(rows);
      if (!agentId && rows[0]) setAgentId(rows[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AGENT_LOAD_FAILED");
    }
  }

  async function loadCollaborations(sessionId: string) {
    try {
      const r = await apiFetch<{ data: Collaboration[] }>(`/api/v1/live/sessions/${sessionId}/collaborations`);
      setCollaborations(prev => ({ ...prev, [sessionId]: r.data ?? [] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_COLLAB_LOAD_FAILED");
    }
  }

  async function loadCharacters(sessionId: string) {
    try {
      const bindingResponse = await apiFetch<{ data: LiveCharacterBinding[] }>(`/api/v1/live/sessions/${sessionId}/characters`);
      setCharacterBinding(bindingResponse.data?.find(b => b.status === "active") ?? null);
      const collabResponse = await apiFetch<{ data: Collaboration[] }>(`/api/v1/live/sessions/${sessionId}/collaborations`);
      const currentCollabs = collabResponse.data ?? [];
      setCollaborations(prev => ({ ...prev, [sessionId]: currentCollabs }));
      const collab = currentCollabs.find(c => c.status === "active");
      if (!collab) { setCharacterAssets([]); return; }
      const assetsResponse = await apiFetch<{ data: LiveCharacterAsset[] }>(`/api/v1/live/character-assets?agent_id=${collab.agent_id}`);
      const assets = assetsResponse.data ?? [];
      setCharacterAssets(assets);
      setSelectedCharacterAssetId(bindingResponse.data?.find(b => b.status === "active")?.asset_id ?? assets[0]?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_CHARACTER_LOAD_FAILED");
    }
  }

  async function selectCharacter() {
    if (!selectedLiveSessionId || !selectedCharacterAssetId || !selectedConversationCollabId) return;
    setSessionLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: LiveCharacterBinding }>(`/api/v1/live/sessions/${selectedLiveSessionId}/characters`, {
        method: "POST",
        body: JSON.stringify({ asset_id: selectedCharacterAssetId, collaboration_id: selectedConversationCollabId, metadata: { surface: "live" } }),
      });
      setCharacterBinding(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_CHARACTER_SELECT_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function removeCharacter() {
    if (!selectedLiveSessionId) return;
    setSessionLoading(true); setError(null);
    try {
      await apiFetch(`/api/v1/live/sessions/${selectedLiveSessionId}/characters/remove`, { method: "POST" });
      setCharacterBinding(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_CHARACTER_REMOVE_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function requestCollaboration(sessionId: string) {
    if (!agentId || !requiredCapability.trim()) return;
    setSessionLoading(true); setError(null);
    try {
      await apiFetch(`/api/v1/live/sessions/${sessionId}/collaborations`, {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId, mode: collaborationMode, required_capability: requiredCapability.trim() }),
      });
      await loadCollaborations(sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_COLLAB_REQUEST_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function createRuntimeCommand(collaborationId: string) {
    const command = (runtimeCommand[collaborationId] ?? "").trim();
    if (!command) return;
    setSessionLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: { id: string; status: string } }>("/api/v1/live/collaborations/" + collaborationId + "/runtime/commands", {
        method: "POST",
        body: JSON.stringify({ command, capabilities: ["ai.generate"] }),
      });
      setRuntimeCommands(prev => ({ ...prev, [collaborationId]: [...(prev[collaborationId] ?? []), r.data] }));
      setRuntimeCommand(prev => ({ ...prev, [collaborationId]: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_RUNTIME_COMMAND_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function runtimeAction(collaborationId: string, commandId: string, action: "plan" | "execute") {
    setSessionLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: { status?: string } }>("/api/v1/live/collaborations/" + collaborationId + "/runtime/commands/" + commandId + "/" + action, { method: "POST" });
      setRuntimeCommands(prev => ({ ...prev, [collaborationId]: (prev[collaborationId] ?? []).map(c => c.id === commandId ? { ...c, status: r.data?.status ?? c.status } : c) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_RUNTIME_ACTION_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function collaborationAction(id: string, action: "consent" | "activate" | "pause" | "end", approved?: boolean) {
    setSessionLoading(true); setError(null);
    try {
      await apiFetch(`/api/v1/live/collaborations/${id}/${action}`, {
        method: "POST",
        body: action === "consent" ? JSON.stringify({ approved: approved ?? false }) : undefined,
      });
      await Promise.all(sessions.map(s => loadCollaborations(s.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_COLLAB_ACTION_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function createSession() {
    if (!selected || !version || !title.trim()) return;
    setSessionLoading(true); setError(null);
    try {
      await apiFetch("/api/v1/live/sessions", {
        method: "POST",
        body: JSON.stringify({
          experience_template_id: selected.id,
          experience_template_version_id: version.id,
          source_type: sourceType,
          title: title.trim(),
          visibility,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });
      setTitle(""); setScheduledAt("");
      await loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_SESSION_CREATE_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function transition(id: string, action: "schedule" | "start" | "end" | "cancel") {
    setSessionLoading(true); setError(null);
    try {
      await apiFetch("/api/v1/live/sessions/" + id + "/" + action, { method: "POST" });
      await loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_SESSION_TRANSITION_FAILED");
    } finally { setSessionLoading(false); }
  }



  async function loadLiveMessages(sessionId: string) {
    const r = await apiFetch<{ data: LiveMessage[] }>(`/api/v1/live/sessions/${sessionId}/messages?limit=100`);
    setLiveMessages(r.data ?? []);
  }

  async function sendConversation() {
    const text = conversationText.trim();
    if (!selectedLiveSessionId || !selectedConversationCollabId || !text) return;
    setSessionLoading(true); setError(null);
    try {
      await apiFetch(`/api/v1/live/sessions/${selectedLiveSessionId}/conversation?collaboration_id=${selectedConversationCollabId}`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setConversationText("");
      await loadLiveMessages(selectedLiveSessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_CONVERSATION_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function joinAudience(sessionId: string) {
    setSessionLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: { id: string } }>(`/api/v1/live/sessions/${sessionId}/audience/join`, { method: "POST" });
      setViewerId(r.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_AUDIENCE_JOIN_FAILED");
    } finally { setSessionLoading(false); }
  }

  async function sendAudienceInteraction(type: "reaction" | "question" | "raise_hand" | "share") {
    if (!selectedLiveSessionId || !viewerId) return;
    setSessionLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: LiveInteraction }>(`/api/v1/live/sessions/${selectedLiveSessionId}/audience/interactions`, {
        method: "POST",
        body: JSON.stringify({ viewer_id: viewerId, interaction_type: type, payload: {} }),
      });
      setLiveInteractions(prev => [...prev.slice(-49), r.data]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_AUDIENCE_INTERACTION_FAILED");
    } finally { setSessionLoading(false); }
  }

  useEffect(() => {
    if (!selectedLiveSessionId) {
      setLiveMessages([]); setLiveInteractions([]); setAudiencePresence(0); setRealtimeStatus("disconnected");
      return;
    }
    let disposed = false;
    let activeChannel: any = null;
    let joinedViewerId = "";
    const supabase = createSupabaseBrowserClient();
    const session = sessions.find(s => s.id === selectedLiveSessionId);
    void (async () => {
      try {
        await loadLiveMessages(selectedLiveSessionId);
        await loadCollaborations(selectedLiveSessionId);
        await loadCharacters(selectedLiveSessionId);
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("AUTH_REQUIRED");
        await supabase.realtime.setAuth(data.session.access_token);
        const channel = supabase.channel(`live:${selectedLiveSessionId}`, {
          config: { private: true, presence: { key: data.session.user.id } },
        })
          .on("broadcast", { event: "live_message_created" }, ({ payload }) => {
            const next = payload as LiveMessage;
            setLiveMessages(prev => prev.some(m => m.id === next.id) ? prev : [...prev, next]);
          })
          .on("broadcast", { event: "live_audience_interaction" }, ({ payload }) => {
            const next = payload as LiveInteraction;
            setLiveInteractions(prev => prev.some(i => i.id === next.id) ? prev : [...prev.slice(-49), next]);
          })
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            setAudiencePresence(Object.values(state).flat().filter((entry: any) => entry?.role === "viewer").length);
          });
        activeChannel = channel;
        channel.subscribe(async status => {
          if (disposed) return;
          setRealtimeStatus(status.toLowerCase());
          if (status === "SUBSCRIBED" && session?.visibility === "public" && session.status === "live") {
            try {
              const joined = await apiFetch<{ data: { id: string } }>(`/api/v1/live/sessions/${selectedLiveSessionId}/audience/join`, { method: "POST" });
              if (!disposed) setViewerId(joined.data.id);
              joinedViewerId = joined.data.id;
              await channel.track({ role: "viewer", session_id: selectedLiveSessionId });
            } catch (e) {
              if (!disposed) setError(e instanceof Error ? e.message : "LIVE_AUDIENCE_JOIN_FAILED");
            }
          }
        });
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : "LIVE_REALTIME_FAILED");
      }
    })();
    return () => {
      disposed = true;
      if (activeChannel) {
        void activeChannel.untrack();
        void supabase.removeChannel(activeChannel);
      }
      if (joinedViewerId) void apiFetch(`/api/v1/live/sessions/${selectedLiveSessionId}/audience/leave`, { method: "POST" }).catch(() => undefined);
    };
  }, [selectedLiveSessionId, sessions]);

  useEffect(() => { void loadCatalog(); void loadSessions(); void loadAgents(); }, []);

  useEffect(() => {
    if (!selected) { setVersion(null); return; }
    void apiFetch<{ data: Version[] }>(`/api/v1/live/templates/${selected.id}/versions`)
      .then(r => setVersion(r.data?.[0] ?? null))
      .catch(e => setError(e instanceof Error ? e.message : "LIVE_TEMPLATE_VERSION_LOAD_FAILED"));
  }, [selected]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(templates.map(t => t.category)))], [templates]);
  const visible = category === "all" ? templates : templates.filter(t => t.category === category);
  const schema = version?.template_schema ?? null;

  return (
    <main className="min-h-screen bg-[var(--allpha-space)] px-5 py-7 text-[var(--allpha-text)] sm:px-9">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-xs font-medium uppercase tracking-[.25em] text-[var(--allpha-cyan)]">Phase 22 · Live Stories / Streaming / Experiences</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Live Stories / Streaming / Experiences</h1>
          <p className="mt-3 max-w-3xl text-[var(--allpha-text-secondary)]">
            Pilih template, buat Live Session milik Anda, lalu kelola lifecycle-nya. Human Owner tetap menjadi authority. Phase 22B menambahkan kolaborasi dengan Owned AI Agent melalui ownership, capability, policy, consent, risk gate, dan Agent Runtime boundary.
          </p>
        </header>

        {error && <div className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm">{error}</div>}

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
          <div className={card + " p-5"}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Allpha Live Collection</h2>
                <p className="mt-1 text-sm text-[var(--allpha-text-muted)]">{loading ? "Loading catalog…" : `${templates.length} built-in collaboration templates`}</p>
              </div>
              <select className={input + " max-w-48"} value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c === "all" ? "All formats" : c}</option>)}
              </select>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map(t => (
                <button key={t.id} onClick={() => setSelected(t)} className={`text-left rounded-[var(--allpha-radius-lg)] border p-4 transition ${selected?.id === t.id ? "border-[var(--allpha-cyan)] bg-[var(--allpha-cyan)]/5" : "border-white/10 hover:border-white/20"}`}>
                  <div className="mb-3"><Preview schema={selected?.id === t.id ? schema : null} /></div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{t.name}</h3>
                    <span className="text-[9px] uppercase tracking-wider text-[var(--allpha-cyan)]">{t.category}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--allpha-text-secondary)]">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <aside className={card + " h-fit p-5 lg:sticky lg:top-5"}>
            {selected ? <>
              <p className="text-xs uppercase tracking-[.2em] text-[var(--allpha-cyan)]">Session Setup</p>
              <h2 className="mt-2 text-2xl font-semibold">{selected.name}</h2>
              <p className="mt-2 text-sm text-[var(--allpha-text-secondary)]">{selected.description}</p>
              <div className="mt-5"><Preview schema={schema} /></div>

              <div className="mt-5 space-y-3">
                <label className="block text-xs text-[var(--allpha-text-muted)]">Live title<input className={input + " mt-1"} value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Allpha Product Talk" /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-[var(--allpha-text-muted)]">Format<select className={input + " mt-1"} value={sourceType} onChange={e => setSourceType(e.target.value)}><option value="live">Live</option><option value="story">Story</option><option value="event">Event</option><option value="booth">Booth</option><option value="agent_world">Agent World</option></select></label>
                  <label className="block text-xs text-[var(--allpha-text-muted)]">Visibility<select className={input + " mt-1"} value={visibility} onChange={e => setVisibility(e.target.value)}><option value="public">Public</option><option value="followers">Followers</option><option value="community">Community</option><option value="enterprise">Enterprise</option><option value="private">Private</option></select></label>
                </div>
                <label className="block text-xs text-[var(--allpha-text-muted)]">Schedule (optional)<input type="datetime-local" className={input + " mt-1"} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></label>
                <button disabled={sessionLoading || !title.trim() || !version} onClick={() => void createSession()} className="w-full rounded-[var(--allpha-radius-md)] bg-[var(--allpha-cyan)] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">Create Live Session</button>
              </div>

              <div className="mt-5 rounded-lg border border-[var(--allpha-cyan)]/20 bg-[var(--allpha-cyan)]/5 p-3 text-xs leading-5 text-[var(--allpha-text-secondary)]">
                Template Version {version?.version ?? "—"} is bound when the session is created. Presentation config cannot grant Agent ownership, permission, policy or risk authority.
              </div>
            </> : <p className="text-sm text-[var(--allpha-text-muted)]">No published platform templates available.</p>}
          </aside>
        </section>

        <section className={card + " mt-5 p-5"}>
          <div className="flex items-end justify-between gap-3">
            <div><h2 className="text-xl font-semibold">My Live Sessions</h2><p className="mt-1 text-sm text-[var(--allpha-text-muted)]">Owner-scoped sessions from the authoritative backend.</p></div>
            <button className="rounded-md border border-white/10 px-3 py-2 text-xs" onClick={() => void loadSessions()}>Refresh</button>
          </div>
          <div className="mt-4 grid gap-3">
            {sessions.length === 0 ? <div className="rounded-lg border border-dashed border-white/10 p-6 text-sm text-[var(--allpha-text-muted)]">Belum ada Live Session. Membuat session tidak membuat Agent, viewer, atau stream palsu.</div> :
              sessions.map(s => (
                <div key={s.id} className="grid gap-3 rounded-lg border border-white/10 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{s.title}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase ${statusClass(s.status)}`}>{s.status}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[var(--allpha-cyan)]">{s.live_experience_templates?.name ?? "Template"}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--allpha-text-muted)]">{s.source_type} · {s.visibility}{s.scheduled_at ? ` · ${new Date(s.scheduled_at).toLocaleString()}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.status === "draft" && <><button disabled={sessionLoading} onClick={() => void transition(s.id, "schedule")} className="rounded-md border border-white/10 px-3 py-2 text-xs">Schedule</button><button disabled={sessionLoading} onClick={() => void transition(s.id, "cancel")} className="rounded-md border border-white/10 px-3 py-2 text-xs">Cancel</button></>}
                    {s.status === "scheduled" && <><button disabled={sessionLoading} onClick={() => void transition(s.id, "start")} className="rounded-md border border-[var(--allpha-cyan)]/30 px-3 py-2 text-xs text-[var(--allpha-cyan)]">Start Live</button><button disabled={sessionLoading} onClick={() => void transition(s.id, "cancel")} className="rounded-md border border-white/10 px-3 py-2 text-xs">Cancel</button></>}
                    {s.status === "live" && <button disabled={sessionLoading} onClick={() => void transition(s.id, "end")} className="rounded-md border border-red-300/20 px-3 py-2 text-xs text-red-200">End Live</button>}
                  </div>
                  <div className="mt-3 rounded-lg border border-[var(--allpha-cyan)]/15 bg-[var(--allpha-cyan)]/5 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[.18em] text-[var(--allpha-cyan)]">Phase 22B · Human Owner → Owned AI Agent</div>
                    <div className="mt-2 grid gap-2 md:grid-cols-4">
                      <select className={input} value={agentId} onChange={e => setAgentId(e.target.value)}>
                        <option value="">Select owned Agent</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}{a.handle ? ` · @${a.handle}` : ""}</option>)}
                      </select>
                      <select className={input} value={collaborationMode} onChange={e => setCollaborationMode(e.target.value)}>
                        <option value="cohost">Co-host</option><option value="interactive">Interactive</option><option value="sales">Sales</option>
                        <option value="podcast">Podcast</option><option value="talkshow">Talkshow</option><option value="presentation">Presentation</option><option value="moderation">Moderation</option>
                      </select>
                      <input className={input} value={requiredCapability} onChange={e => setRequiredCapability(e.target.value)} placeholder="Required capability" />
                      <button disabled={sessionLoading || !agentId || !requiredCapability.trim()} onClick={() => void requestCollaboration(s.id)} className="rounded-md border border-[var(--allpha-cyan)]/30 px-3 py-2 text-xs text-[var(--allpha-cyan)]">Request Collaboration</button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(collaborations[s.id] ?? []).map(c => (
                        <div key={c.id} className="rounded-md border border-white/10 bg-black/10 p-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{agents.find(a => a.id === c.agent_id)?.name ?? "Owned Agent"}</span>
                            <span className="text-white/50">{c.mode}</span><span className="text-white/50">cap:{c.required_capability ?? "—"}</span>
                            <span className="rounded-full border border-white/10 px-2 py-0.5">{c.status}</span>
                            <span className="text-white/45">consent:{c.consent_status} · risk:{c.risk_decision}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {c.status === "requested" && <button disabled={sessionLoading} onClick={() => void collaborationAction(c.id, "consent", true)} className="rounded-md border border-white/10 px-2 py-1">Approve Consent</button>}
                            {c.status === "approved" && <button disabled={sessionLoading} onClick={() => void collaborationAction(c.id, "activate")} className="rounded-md border border-[var(--allpha-cyan)]/30 px-2 py-1 text-[var(--allpha-cyan)]">Activate</button>}
                            {c.status === "active" && <><button disabled={sessionLoading} onClick={() => void collaborationAction(c.id, "pause")} className="rounded-md border border-white/10 px-2 py-1">Pause</button><button disabled={sessionLoading} onClick={() => void collaborationAction(c.id, "end")} className="rounded-md border border-red-300/20 px-2 py-1 text-red-200">End</button></>}
                          </div>
                          {c.status === "active" && (
                            <div className="mt-3 rounded-md border border-[var(--allpha-cyan)]/15 bg-[var(--allpha-cyan)]/5 p-3">
                              <div className="text-[10px] uppercase tracking-[.16em] text-[var(--allpha-cyan)]">AI Character / Presentation Runtime</div>
                              <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                                <select className={input} value={selectedCharacterAssetId} onChange={e => setSelectedCharacterAssetId(e.target.value)} disabled={!characterAssets.length}>
                                  <option value="">{characterAssets.length ? "Select approved character asset" : "No approved character asset"}</option>
                                  {characterAssets.map(a => <option key={a.id} value={a.id}>{a.name} · {a.asset_type}</option>)}
                                </select>
                                <button disabled={sessionLoading || !selectedCharacterAssetId} onClick={() => void selectCharacter()} className="rounded border border-[var(--allpha-cyan)]/30 px-3 py-2 text-xs text-[var(--allpha-cyan)]">Select</button>
                                <button disabled={sessionLoading || !characterBinding} onClick={() => void removeCharacter()} className="rounded border border-white/10 px-3 py-2 text-xs">Remove</button>
                              </div>
                              <p className="mt-2 text-[10px] leading-4 text-[var(--allpha-text-muted)]">{characterBinding ? "Character is bound to this Live Session. Character presentation never grants Agent authority." : "Character assets require real owned/approved Storage assets; none are fabricated."}</p>
                            </div>
                            <div className="mt-3 rounded-md border border-white/10 p-2">
                              <div className="text-[10px] uppercase tracking-[.16em] text-white/45">Agent Runtime → AI Gateway</div>
                              <div className="mt-2 flex gap-2">
                                <input className={input + " flex-1"} value={runtimeCommand[c.id] ?? ""} onChange={e => setRuntimeCommand(prev => ({ ...prev, [c.id]: e.target.value }))} placeholder="Send a Live Agent command" />
                                <button disabled={sessionLoading || !(runtimeCommand[c.id] ?? "").trim()} onClick={() => void createRuntimeCommand(c.id)} className="rounded-md border border-[var(--allpha-cyan)]/30 px-3 py-2 text-xs text-[var(--allpha-cyan)]">Create</button>
                              </div>
                              {(runtimeCommands[c.id] ?? []).map(cmd => (
                                <div key={cmd.id} className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                                  <span className="font-mono text-white/50">{cmd.id.slice(0, 8)}</span><span>{cmd.status}</span>
                                  {cmd.status === "planning" && <button disabled={sessionLoading} onClick={() => void runtimeAction(c.id, cmd.id, "plan")} className="rounded border border-white/10 px-2 py-1">Plan</button>}
                                  {cmd.status === "ready" && <button disabled={sessionLoading} onClick={() => void runtimeAction(c.id, cmd.id, "execute")} className="rounded border border-[var(--allpha-cyan)]/30 px-2 py-1 text-[var(--allpha-cyan)]">Execute</button>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-[var(--allpha-text-muted)]">Ownership, capability, Agent policy, kill-switch and consent are verified server-side. Theme/character presentation cannot grant Agent authority.</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className={card + " mt-5 p-5"}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-[var(--allpha-cyan)]">Phase 22D</p>
              <h2 className="mt-1 text-xl font-semibold">Realtime Live Conversation / Audience</h2>
              <p className="mt-1 text-sm text-[var(--allpha-text-muted)]">Durable messages and audience interactions are backend-authoritative; Realtime only transports live events and presence.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="rounded-full border border-white/10 px-2 py-1">Realtime: {realtimeStatus}</span>
              <span className="rounded-full border border-white/10 px-2 py-1">Online: {audiencePresence}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[.75fr_1.5fr_.75fr]">
            <div>
              <label className="block text-xs text-[var(--allpha-text-muted)]">Live Session
                <select className={input + " mt-1"} value={selectedLiveSessionId} onChange={e => {
                  setSelectedLiveSessionId(e.target.value);
                  const cs = collaborations[e.target.value] ?? [];
                  const active = cs.find(c => c.status === "active");
                  setSelectedConversationCollabId(active?.id ?? "");
                }}>
                  <option value="">Select live session</option>
                  {sessions.filter(s => s.status === "live").map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </label>
              {selectedLiveSessionId && liveHostAgent ? <div className="mb-3"><p className="mb-2 text-[10px] uppercase tracking-[.18em] text-[var(--allpha-cyan)]">Live Host → Agent Account</p><AgentAccountCard agent={liveHostAgent} compact discoveryContext={{source_surface:"live",live_session_id:selectedLiveSessionId}} /></div> : null}
              {selectedLiveSessionId && (
                <div className="mt-3 space-y-2">
                  <button disabled={sessionLoading || !sessions.find(s => s.id === selectedLiveSessionId)?.visibility || !!viewerId} onClick={() => void joinAudience(selectedLiveSessionId)} className="w-full rounded-md border border-white/10 px-3 py-2 text-xs disabled:opacity-40">Join Audience</button>
                  <div className="grid grid-cols-2 gap-2">
                    {(["reaction","raise_hand","share"] as const).map(type => <button key={type} disabled={sessionLoading || !viewerId} onClick={() => void sendAudienceInteraction(type)} className="rounded-md border border-white/10 px-2 py-2 text-[10px] disabled:opacity-40">{type.replace("_"," ")}</button>)}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <div className="max-h-80 space-y-2 overflow-auto">
                {liveMessages.length === 0 ? <p className="p-4 text-xs text-[var(--allpha-text-muted)]">Belum ada pesan realtime.</p> : liveMessages.map(m => (
                  <div key={m.id} className="rounded-md border border-white/10 bg-black/10 p-2 text-xs">
                    <div className="flex items-center gap-2 text-[9px] uppercase text-white/45"><span>{m.sender_type}</span><span>{new Date(m.created_at).toLocaleTimeString()}</span></div>
                    <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
              {selectedLiveSessionId && (
                <div className="mt-3 flex gap-2">
                  <select className={input + " max-w-48"} value={selectedConversationCollabId} onChange={e => setSelectedConversationCollabId(e.target.value)}>
                    <option value="">Active collaboration</option>
                    {(collaborations[selectedLiveSessionId] ?? []).filter(c => c.status === "active").map(c => <option key={c.id} value={c.id}>{c.mode} · {c.required_capability}</option>)}
                  </select>
                  <input className={input} value={conversationText} onChange={e => setConversationText(e.target.value)} placeholder="Talk to the active Owned AI Agent" />
                  <button disabled={sessionLoading || !selectedConversationCollabId || !conversationText.trim()} onClick={() => void sendConversation()} className="rounded-md border border-[var(--allpha-cyan)]/30 px-3 py-2 text-xs text-[var(--allpha-cyan)]">Send</button>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <div className="text-[10px] uppercase tracking-[.18em] text-[var(--allpha-cyan)]">Audience Runtime</div>
              <div className="mt-3 space-y-2 text-xs">
                <div>Presence: <span className="text-white/60">{audiencePresence} connected</span></div>
                <div>Viewer: <span className="font-mono text-white/50">{viewerId ? viewerId.slice(0,8) : "not joined"}</span></div>
                <div>Interactions: <span className="text-white/60">{liveInteractions.length}</span></div>
                <div className="pt-2 text-[10px] leading-4 text-[var(--allpha-text-muted)]">No fake viewer count or generated audience activity is used. Presence comes from the authenticated Realtime channel.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
