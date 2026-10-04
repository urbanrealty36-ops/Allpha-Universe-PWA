"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../lib/api";
import { normalizeWorldScene, type WorldScene } from "../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(() => import("./world/allpha-world-renderer"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-black text-sm text-slate-500">Preparing Live 3D Stage…</div>,
});

type Theme = { id: string; name: string; slug: string; tokens?: Record<string, unknown>; world_schema?: unknown };
type Template = { id: string; name: string; slug: string; category: string; description?: string | null };
type Version = { id: string; version: number; template_schema: Record<string, unknown>; validation_status: string; moderation_status: string; status: string };
type District = { id: string; world_id: string; name: string; status: string };
type Booth = { id: string; district_id: string; name: string; status: string };
type Agent = { id: string; name: string; handle?: string | null; status: string; runtime_state?: string | null };
type Session = { id: string; title: string; status: string; district_id?: string | null; booth_id?: string | null; experience_template_id: string; experience_template_version_id: string };
type Collaboration = { id: string; agent_id: string; status: string; consent_status: string; required_capability: string; capability_verified: boolean; policy_verified: boolean; risk_decision?: string | null };
type SpatialState = { id: string; agent_id: string; movement_state: string; position?: { x: number; y: number; z: number }; rotation?: { x: number; y: number; z: number }; zone_key?: string | null };
type AssetManifest = { active?: { signed_url?: string | null } | null; assets?: Array<{ signed_url?: string | null }> };

export default function LiveExperienceVerticalSlice({ theme }: { theme: Theme | null }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [spatialStates, setSpatialStates] = useState<SpatialState[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [boothId, setBoothId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [command, setCommand] = useState("");
  const [stageUrl, setStageUrl] = useState<string | null>(null);
  const [themePackUrl, setThemePackUrl] = useState<string | null>(null);
  const [characterUrl, setCharacterUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const scene = useMemo<WorldScene | null>(() => theme ? normalizeWorldScene(theme.world_schema) : null, [theme]);

  async function refreshSpatial(worldId: string) {
    const r = await apiFetch<{ data: SpatialState[] }>(`/api/v1/spatial-runtime/worlds/${worldId}/states?limit=200`);
    setSpatialStates(r.data ?? []);
  }

  async function loadBase() {
    const [t, d, a] = await Promise.all([
      apiFetch<{ data: Template[] }>("/api/v1/live/templates"),
      apiFetch<{ data: District[] }>("/api/v1/districts?limit=100"),
      apiFetch<{ data: Agent[] }>("/api/v1/agents/me"),
    ]);
    setTemplates(t.data ?? []);
    setDistricts(d.data ?? []);
    setAgents(a.data ?? []);
  }

  useEffect(() => {
    void loadBase().catch(e => setError(e instanceof Error ? e.message : "LIVE_BOOTSTRAP_FAILED"));
  }, [theme?.id]);

  useEffect(() => {
    setStageUrl(null);
    if (!versionId) return;
    void apiFetch<{ data: AssetManifest }>(`/api/v1/live-assets/templates/${versionId}/stage`)
      .then(r => setStageUrl(r.data?.active?.signed_url ?? null))
      .catch(() => setStageUrl(null));
  }, [versionId]);

  useEffect(() => {
    setCharacterUrl(null);
    if (!agentId) return;
    void apiFetch<{ data: AssetManifest }>(`/api/v1/live-assets/agents/${agentId}/character`)
      .then(r => setCharacterUrl(r.data?.active?.signed_url ?? null))
      .catch(() => setCharacterUrl(null));
  }, [agentId]);

  useEffect(() => {
    if (!templateId) { setVersions([]); return; }
    void apiFetch<{ data: Version[] }>(`/api/v1/live/templates/${templateId}/versions`)
      .then(r => setVersions(r.data ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "LIVE_TEMPLATE_VERSION_LOAD_FAILED"));
  }, [templateId]);

  useEffect(() => {
    if (!districtId) { setBooths([]); setSpatialStates([]); return; }
    const district = districts.find(x => x.id === districtId);
    void apiFetch<{ data: Booth[] }>(`/api/v1/booths?district_id=${districtId}`)
      .then(r => setBooths(r.data ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "LIVE_BOOTH_LOAD_FAILED"));
    if (district) void refreshSpatial(district.world_id).catch(() => setSpatialStates([]));
  }, [districtId, districts]);

  async function createSession(e: FormEvent) {
    e.preventDefault();
    if (!templateId || !versionId || !title.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await apiFetch<{ data: Session }>("/api/v1/live/sessions", {
        method: "POST",
        body: JSON.stringify({
          experience_template_id: templateId,
          experience_template_version_id: versionId,
          source_type: "agent_world",
          title: title.trim(),
          visibility: "public",
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          district_id: districtId || null,
          booth_id: boothId || null,
          metadata: { theme_id: theme?.id ?? null, theme_slug: theme?.slug ?? null, presentation_only: true, created_from: "theme-studio" },
        }),
      });
      setSession(r.data); setResult(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_SESSION_CREATE_FAILED");
    } finally { setBusy(false); }
  }

  async function transition(path: "schedule" | "start" | "end") {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      const r = await apiFetch<{ data: Session }>(`/api/v1/live/sessions/${session.id}/${path}`, { method: "POST" });
      setSession(r.data); setResult(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_TRANSITION_FAILED");
    } finally { setBusy(false); }
  }

  async function requestCollaboration() {
    if (!session || !agentId) return;
    setBusy(true); setError(null);
    try {
      const r = await apiFetch<{ data: Collaboration }>(`/api/v1/live/sessions/${session.id}/collaborations`, {
        method: "POST",
        body: JSON.stringify({
          agent_id: agentId,
          mode: "interactive",
          required_capability: "ai.generate",
          authority_policy: { presentation_only: true, session_id: session.id, theme_id: theme?.id ?? null },
          interaction_policy: { human_approval_required_for_side_effects: true },
        }),
      });
      setCollaboration(r.data); setResult(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_COLLAB_REQUEST_FAILED");
    } finally { setBusy(false); }
  }

  async function collaborationAction(path: "consent" | "activate", body?: unknown) {
    if (!collaboration) return;
    setBusy(true); setError(null);
    try {
      const r = await apiFetch<{ data: Collaboration }>(`/api/v1/live/collaborations/${collaboration.id}/${path}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      setCollaboration(r.data); setResult(r.data);
      if (path === "activate" && r.data.status === "active") {
        const district = districts.find(x => x.id === districtId);
        if (district) {
          await apiFetch(`/api/v1/universe/worlds/${district.world_id}/agents`, {
            method: "POST",
            body: JSON.stringify({ agent_id: agentId, presence_role: "host" }),
          });
          await apiFetch(`/api/v1/universe/worlds/${district.world_id}/presence`, {
            method: "POST",
            body: JSON.stringify({
              agent_id: agentId,
              state: "collaborating",
              activity: "live-experience",
              context: { live_session_id: session?.id ?? null, collaboration_id: r.data.id, theme_id: theme?.id ?? null },
            }),
          });
          await refreshSpatial(district.world_id);
          const char = await apiFetch<{ data: AssetManifest }>(`/api/v1/live-assets/agents/${agentId}/character`);
          setCharacterUrl(char.data?.active?.signed_url ?? null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_COLLAB_ACTION_FAILED");
    } finally { setBusy(false); }
  }

  async function createRuntimeCommand(e: FormEvent) {
    e.preventDefault();
    if (!collaboration || !command.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await apiFetch<{ data: { id: string } }>(`/api/v1/live/collaborations/${collaboration.id}/runtime/commands`, {
        method: "POST",
        body: JSON.stringify({ command: command.trim(), capabilities: ["ai.generate"] }),
      });
      const planned = await apiFetch<{ data: unknown }>(`/api/v1/live/collaborations/${collaboration.id}/runtime/commands/${r.data.id}/plan`, { method: "POST" });
      setResult(planned.data); setCommand("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_RUNTIME_COMMAND_FAILED");
    } finally { setBusy(false); }
  }

  const boothNodes = booths.map((b, i) => ({
    id: b.id,
    kind: "booth" as const,
    label: b.name,
    position: { x: (i % 4) * 3 - 4.5, y: 0, z: Math.floor(i / 4) * 3 - 3 },
    metadata: { booth_id: b.id, status: b.status },
  }));

  const selectedAgentPresence = spatialStates.filter(s => s.agent_id === agentId && s.position);
  const assetStatus = stageUrl ? "REAL LIVE STAGE" : "LIVE STAGE ASSET NOT ACTIVATED";
  const characterStatus = characterUrl ? "REAL AI CHARACTER" : "AI CHARACTER 3D ASSET NOT ACTIVATED";

  return <section className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
    <header className="border-b border-white/10 p-5">
      <p className="text-[9px] uppercase tracking-[0.25em] text-violet-300">Vertical Slice · Live Experience</p>
      <h2 className="mt-1 text-xl font-semibold">Theme → District → Booth → Live Stage → AI Agent → Collaboration</h2>
      <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500">Stage dan AI Character sekarang membaca asset aktif + approved dari Storage melalui signed URL. Presentation layer tetap tidak memberi authority.</p>
    </header>
    {error && <div className="m-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100">{error}</div>}
    <div className="grid gap-5 p-5 xl:grid-cols-[1fr_1.15fr]">
      <div className="space-y-3">
        <Card n="01" title="Live Template">
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} className={input}><option value="">Select published template</option>{templates.map(x => <option key={x.id} value={x.id}>{x.name} · {x.category}</option>)}</select>
          <select value={versionId} onChange={e => setVersionId(e.target.value)} disabled={!templateId} className={input}><option value="">Select approved version</option>{versions.map(x => <option key={x.id} value={x.id}>v{x.version} · {x.validation_status} · {x.moderation_status}</option>)}</select>
          <p className={stageUrl ? "text-[10px] text-emerald-200" : "text-[10px] text-amber-200"}>{assetStatus}</p>
        </Card>
        <Card n="02" title="District / Booth">
          <select value={districtId} onChange={e => setDistrictId(e.target.value)} className={input}><option value="">Select District</option>{districts.map(x => <option key={x.id} value={x.id}>{x.name} · {x.status}</option>)}</select>
          <select value={boothId} onChange={e => setBoothId(e.target.value)} disabled={!districtId} className={input}><option value="">Optional Booth</option>{booths.map(x => <option key={x.id} value={x.id}>{x.name} · {x.status}</option>)}</select>
        </Card>
        <Card n="03" title="Create Live Session">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Live session title" className={input} />
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={input} />
          <button disabled={busy || !templateId || !versionId || !title.trim()} onClick={e => void createSession(e)} className={button}>Create Draft Session</button>
          {session && <div className="mt-2 rounded-xl border border-white/10 p-3 text-[10px] text-slate-400">Session: {session.status} · {session.id}</div>}
          {session && <div className="mt-2 flex flex-wrap gap-2">
            {session.status === "draft" && <button disabled={busy} onClick={() => void transition("schedule")} className={button}>Schedule</button>}
            {session.status === "scheduled" && <button disabled={busy} onClick={() => void transition("start")} className={button}>Start Live</button>}
            {session.status === "live" && <button disabled={busy} onClick={() => void transition("end")} className={button}>End Live</button>}
          </div>}
        </Card>
        <Card n="04" title="AI Character / Agent">
          <select value={agentId} onChange={e => setAgentId(e.target.value)} className={input}><option value="">Select owned Agent</option>{agents.map(x => <option key={x.id} value={x.id}>{x.name} · {x.status}</option>)}</select>
          <p className={characterUrl ? "text-[10px] text-emerald-200" : "text-[10px] text-amber-200"}>{characterStatus}</p>
          <button disabled={busy || !session || !agentId} onClick={() => void requestCollaboration()} className={button}>Request Collaboration</button>
          {collaboration && <div className="mt-3 rounded-xl border border-white/10 p-3 text-[10px] text-slate-400">
            <p>status: {collaboration.status}</p><p>consent: {collaboration.consent_status}</p><p>capability: {String(collaboration.capability_verified)}</p><p>policy: {String(collaboration.policy_verified)}</p><p>risk: {collaboration.risk_decision ?? "pending"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {collaboration.consent_status !== "approved" && <button disabled={busy} onClick={() => void collaborationAction("consent", { approved: true })} className={button}>Approve Consent</button>}
              {collaboration.consent_status === "approved" && collaboration.status !== "active" && <button disabled={busy} onClick={() => void collaborationAction("activate")} className={button}>Activate</button>}
            </div>
          </div>}
        </Card>
        <Card n="05" title="Runtime Command">
          <form onSubmit={createRuntimeCommand} className="space-y-2">
            <textarea value={command} onChange={e => setCommand(e.target.value)} rows={3} placeholder="Contoh: siapkan respons pembukaan live..." className={input} />
            <button disabled={busy || !collaboration || collaboration.status !== "active" || !command.trim()} className={button}>Create + Plan</button>
          </form>
          <p className="mt-2 text-[9px] text-slate-600">Execution tidak dilakukan otomatis pada step ini; plan tetap melewati Agent Runtime capability/risk/approval gates.</p>
        </Card>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div><p className="text-[9px] uppercase tracking-[0.2em] text-violet-300">Canonical 3D Stage</p><p className="mt-1 text-xs text-white/70">{theme?.name ?? "Theme"} · {session?.title ?? "No session selected"}</p></div>
          <div className="text-right text-[9px]"><p className={stageUrl ? "text-emerald-200" : "text-amber-200"}>{assetStatus}</p><p className={characterUrl ? "text-emerald-200" : "text-amber-200"}>{characterStatus}</p></div>
        </div>
        <div className="h-[560px]">
          {scene ? <AllphaWorldRenderer scene={scene} tokens={theme?.tokens} booths={boothNodes} presence={selectedAgentPresence} themePackUrl={themePackUrl} liveStageUrl={stageUrl} agentCharacterUrl={characterUrl} /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">No validated Theme Scene.</div>}
        </div>
        {result !== null && <pre className="max-h-40 overflow-auto border-t border-white/10 p-3 text-[9px] text-slate-500">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </div>
  </section>;
}

function Card({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><div className="mb-2 flex items-center gap-2"><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-slate-500">{n}</span><span className="text-xs font-semibold">{title}</span></div><div className="space-y-2">{children}</div></div>;
}

const input = "w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white outline-none";
const button = "rounded-xl bg-cyan-300 px-3 py-2 text-[10px] font-semibold text-slate-950 disabled:opacity-30";
