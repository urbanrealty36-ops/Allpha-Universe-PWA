"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { apiFetch } from "../lib/api";
import UniverseShell, { type UniverseShellKey } from "./universe/universe-shell";
import { normalizeWorldScene, type SceneNode, type WorldScene } from "../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(() => import("./world/allpha-world-renderer"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center bg-[#02040b] text-xs text-white/35">
      Preparing District spatial renderer…
    </div>
  ),
});

type District = {
  id: string;
  world_id: string;
  name: string;
  slug: string;
  description?: string | null;
  district_type: string;
  visibility: string;
  status: string;
  theme_key?: string | null;
  spatial_config?: Record<string, unknown>;
};
type Theme = {
  id: string;
  name: string;
  slug: string;
  catalog_key?: string | null;
  world_schema?: unknown;
  tokens?: Record<string, unknown>;
  theme_version_id?: string | null;
};
type Zone = {
  id: string;
  name: string;
  zone_key: string;
  zone_type: string;
  status: string;
  spatial_config?: Record<string, unknown>;
};
type SpatialObject = {
  id: string;
  district_id: string;
  zone_id?: string | null;
  object_type: string;
  name: string;
  slug: string;
  status: string;
  capacity?: number | null;
  availability?: string | null;
  spatial_config?: Record<string, unknown>;
  presentation_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};
type Booth = {
  id: string;
  name: string;
  slug: string;
  booth_type: string;
  tier: string;
  status: string;
  moderation_status: string;
  district_id: string;
  district_zone_id?: string | null;
  theme_key?: string | null;
  host_agent_id?: string | null;
  scene_config?: Record<string, unknown>;
  display_config?: Record<string, unknown>;
  spatial_projection?: {
    position?: { x: number; y: number; z: number } | null;
    presentation_only?: boolean;
  };
  asset_manifest?: Array<{ asset_type?: string; signed_url?: string | null }>;
};
type Presence = {
  id: string;
  world_id: string;
  agent_id: string;
  movement_state: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  zone_key?: string | null;
  target_position?: { x: number; y: number; z: number };
  speed?: number;
  updated_at?: string;
};
type Agent = {
  id?: string;
  agent_id?: string;
  name: string;
  handle?: string | null;
  description?: string | null;
  status?: string;
  runtime_state?: string | null;
};
type Composition = {
  district: District;
  spatial_projection?: { spatial_config?: Record<string, unknown>; presentation_only?: boolean };
  zones: Zone[];
  booths: Booth[];
  spatial_presence: Presence[];
};
type Tab = "overview" | "zones" | "booths" | "agents";
type Selection =
  | { kind: "booth"; value: Booth }
  | { kind: "agent"; value: Agent }
  | { kind: "zone"; value: Zone }
  | { kind: "object"; value: SpatialObject }
  | null;

export default function DistrictExperienceSurface({ districtId }: { districtId: string }) {
  const [district, setDistrict] = useState<District | null>(null);
  const [worldName, setWorldName] = useState<string | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [spatialObjects, setSpatialObjects] = useState<SpatialObject[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [entered, setEntered] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [interactionStatus, setInteractionStatus] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [lowPower, setLowPower] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState<"connecting" | "connected" | "polling">("connecting");
  const [themeAssetUrl, setThemeAssetUrl] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);

    const results = await Promise.allSettled([
      apiFetch<{ data: Composition }>(`/api/v1/themes/world-runtime/districts/${encodeURIComponent(districtId)}/composition`),
      apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog"),
      apiFetch<{ data: SpatialObject[] }>(`/api/v1/districts/${encodeURIComponent(districtId)}/spatial-objects`),
    ]);

    const failures: string[] = [];
    const [compositionResult, themeResult, objectResult] = results;

    if (compositionResult.status === "fulfilled") {
      const composition = compositionResult.value.data;
      setDistrict(composition?.district ?? null);
      setZones(composition?.zones ?? []);
      setBooths(composition?.booths ?? []);
      setPresence(composition?.spatial_presence ?? []);
    } else failures.push("DISTRICT_COMPOSITION_UNAVAILABLE");

    if (themeResult.status === "fulfilled") setThemes(Array.isArray(themeResult.value.data) ? themeResult.value.data : []);
    else failures.push("WORLD_THEME_UNAVAILABLE");

    if (objectResult.status === "fulfilled") setSpatialObjects(Array.isArray(objectResult.value.data) ? objectResult.value.data : []);
    else failures.push("DISTRICT_SPATIAL_OBJECTS_UNAVAILABLE");

    const districtForAgents =
      compositionResult.status === "fulfilled" ? compositionResult.value.data?.district : null;

    if (districtForAgents) {
      try {
        const [agentResult, worldResult] = await Promise.allSettled([
          apiFetch<{ data: Agent[] }>(`/api/v1/agent-catalog/accounts?district_id=${encodeURIComponent(districtId)}&limit=48`),
          apiFetch<{ data: { name: string } }>(`/api/v1/universe/worlds/${encodeURIComponent(districtForAgents.world_id)}`),
        ]);
        if (agentResult.status === "fulfilled") setAgents(Array.isArray(agentResult.value.data) ? agentResult.value.data : []);
        else failures.push("DISTRICT_AGENT_DISCOVERY_UNAVAILABLE");
        if (worldResult.status === "fulfilled") setWorldName(worldResult.value.data?.name ?? null);
      } catch {
        failures.push("DISTRICT_CONTEXT_UNAVAILABLE");
      }
    }

    setError(failures.length ? failures.join(" · ") : null);
    if (!quiet) setLoading(false);
    setRefreshing(false);
  }, [districtId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    let channel: any = null;

    try {
      const supabase = createSupabaseBrowserClient();
      channel = supabase
        .channel(`allpha-district-experience-${districtId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agent_spatial_states" },
          () => { if (active) void load(true); },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "booths", filter: `district_id=eq.${districtId}` },
          () => { if (active) void load(true); },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "district_zones", filter: `district_id=eq.${districtId}` },
          () => { if (active) void load(true); },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "district_spatial_objects", filter: `district_id=eq.${districtId}` },
          () => { if (active) void load(true); },
        )
        .subscribe((status: string) => {
          if (!active) return;
          if (status === "SUBSCRIBED") setRealtime("connected");
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setRealtime("polling");
        });
    } catch {
      setRealtime("polling");
    }

    timer = setInterval(() => { if (active) void load(true); }, 5000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      if (channel) void channel.unsubscribe();
    };
  }, [districtId, load]);

  const activeTheme = useMemo(() => {
    const key = district?.theme_key;
    if (!key) return themes[0] ?? null;
    return themes.find((theme) => theme.slug === key || theme.id === key || theme.catalog_key === key) ?? themes[0] ?? null;
  }, [district, themes]);

  const scene = useMemo<WorldScene | null>(() => {
    return activeTheme?.world_schema ? normalizeWorldScene(activeTheme.world_schema) : null;
  }, [activeTheme]);

  useEffect(() => {
    let cancelled = false;
    async function loadThemeAsset() {
      if (!activeTheme?.id) {
        setThemeAssetUrl(null);
        return;
      }
      try {
        const response = await apiFetch<{
          data?: { binary_3d_assets?: Array<{ signed_url?: string | null }> };
        }>(`/api/v1/themes/world-runtime/themes/${encodeURIComponent(activeTheme.id)}/asset-manifest`);
        const url = response.data?.binary_3d_assets?.find((asset) => asset.signed_url)?.signed_url ?? null;
        if (!cancelled) setThemeAssetUrl(url);
      } catch {
        if (!cancelled) setThemeAssetUrl(null);
      }
    }
    void loadThemeAsset();
    return () => { cancelled = true; };
  }, [activeTheme?.id]);

  const boothNodes = useMemo<SceneNode[]>(() => booths.map((booth, index) => {
    const configured = booth.spatial_projection?.position
      ?? (booth.scene_config?.position as { x: number; y: number; z: number } | undefined)
      ?? (booth.display_config?.position as { x: number; y: number; z: number } | undefined)
      ?? { x: (index % 4) * 2.8 - 4.2, y: 0, z: Math.floor(index / 4) * 2.8 - 2.8 };
    const modelUrl = booth.asset_manifest?.find((asset) => asset.asset_type === "3d_scene" && asset.signed_url)?.signed_url;
    return {
      id: booth.id,
      kind: "booth",
      name: booth.name,
      position: configured,
      scale: { x: 1, y: 1, z: 1 },
      metadata: {
        booth_id: booth.id,
        booth_type: booth.booth_type,
        tier: booth.tier,
        status: booth.status,
        moderation_status: booth.moderation_status,
        model_url: modelUrl ?? null,
        presentation_only: true,
      },
      presentation_only: true,
    };
  }), [booths]);

  const spatialPresence = useMemo(() => presence.map((item) => ({
    id: item.id,
    agent_id: item.agent_id,
    movement_state: item.movement_state,
    position: item.position,
    rotation: item.rotation,
    zone_key: item.zone_key,
  })), [presence]);

  const activeZoneCount = useMemo(() => zones.filter((zone) => zone.status === "active").length, [zones]);
  const activeBoothCount = useMemo(() => booths.filter((booth) => booth.status === "active" || booth.status === "published").length, [booths]);
  const livePresenceCount = presence.length;

  async function enterDistrict() {
    if (!district) return;
    setInteractionStatus("Authorizing District entry…");
    try {
      await apiFetch(`/api/v1/districts/${encodeURIComponent(district.id)}/join`, {
        method: "POST",
        body: JSON.stringify({ subject_type: "user" }),
      });
      setEntered(true);
      setInteractionStatus("District access accepted by the server.");
      await load(true);
    } catch (e) {
      setInteractionStatus(e instanceof Error ? e.message : "DISTRICT_JOIN_FAILED");
    }
  }

  async function requestAccess() {
    if (!district || requestingAccess) return;
    setRequestingAccess(true);
    setInteractionStatus(null);
    try {
      await apiFetch(`/api/v1/districts/${encodeURIComponent(district.id)}/requests`, {
        method: "POST",
        body: JSON.stringify({
          requester_type: "user",
          requested_tier: "standard",
          reason: requestReason.trim() || null,
        }),
      });
      setRequestReason("");
      setInteractionStatus("Access request submitted to the authoritative District workflow.");
      await load(true);
    } catch (e) {
      setInteractionStatus(e instanceof Error ? e.message : "DISTRICT_ACCESS_REQUEST_FAILED");
    } finally {
      setRequestingAccess(false);
    }
  }

  async function interact(kind: "conversation" | "collaboration" | "shopping" | "negotiation") {
    if (!district || !selection || selection.kind !== "agent") return;
    const agentId = selection.value.agent_id || selection.value.id;
    if (!agentId) return;
    setInteractionStatus(`Authorizing ${kind}…`);
    try {
      const supabase = createSupabaseBrowserClient();
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user?.id) throw new Error("AUTH_SESSION_REQUIRED");
      await apiFetch(`/api/v1/spatial-runtime/worlds/${encodeURIComponent(district.world_id)}/interactions`, {
        method: "POST",
        body: JSON.stringify({
          initiator_type: "user",
          initiator_id: session.user.id,
          target_type: "agent",
          target_id: agentId,
          interaction_type: kind,
          payload: { source_surface: "district", district_id: district.id },
        }),
      });
      setInteractionStatus("Interaction recorded by Spatial Runtime. Policy, risk, approval and execution remain authoritative.");
    } catch (e) {
      setInteractionStatus(e instanceof Error ? e.message : "AGENT_INTERACTION_FAILED");
    }
  }

  function navigateShell(key: UniverseShellKey) {
    if (key === "universe") window.location.assign("/universe");
    else if (key === "explore") window.location.assign("/universe");
    else if (key === "my-agent") window.location.assign("/agents");
    else if (key === "social") window.location.assign("/social");
    else if (key === "communities") window.location.assign("/communities");
    else if (key === "missions") window.location.assign("/missions");
    else if (key === "marketplace") window.location.assign("/marketplace");
  }

  if (loading && !district) return <DistrictLoading />;
  if (!district) {
    return (
      <UniverseShell active="explore" onNavigate={navigateShell} onCreate={() => setCreateOpen(true)}>
        <DistrictState title="District unavailable" description={error ?? "The authoritative District record could not be loaded."} />
        <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      </UniverseShell>
    );
  }

  return (
    <UniverseShell
      active="explore"
      onNavigate={navigateShell}
      onCreate={() => setCreateOpen(true)}
      contextDock={
        <div className="allpha-universe-context-content">
          <span className="allpha-eyebrow">Spatial Context</span>
          <strong>{district.name}</strong>
          <span>{worldName ? `World · ${worldName}` : "World → District"}</span>
        </div>
      }
      commandBar={
        <div className="allpha-universe-command-default">
          <span className="allpha-universe-command-signal" aria-hidden="true" />
          <span>District Command</span>
          <button type="button" onClick={() => setTab("zones")}>Zones</button>
          <button type="button" onClick={() => setTab("agents")}>Agents</button>
          <button type="button" onClick={() => setLowPower((value) => !value)}>{lowPower ? "Spatial quality" : "Low power"}</button>
        </div>
      }
    >
      <div className="pb-20 pt-16 md:pb-0">
        {error ? <RuntimeNotice message={error} onRetry={() => void load()} /> : null}

        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-[#02040b]">
            {scene ? (
              <AllphaWorldRenderer
                scene={scene}
                tokens={activeTheme?.tokens}
                lowPower={lowPower}
                themePackUrl={themeAssetUrl}
                booths={boothNodes}
                presence={spatialPresence}
                spatialObjects={spatialObjects}
                selectedBoothId={selection?.kind === "booth" ? selection.value.id : undefined}
                selectedDistrictId={district.id}
                onHotspot={(node) => {
                  if (node.kind === "booth") {
                    const booth = booths.find((item) => item.id === node.id);
                    if (booth) setSelection({ kind: "booth", value: booth });
                  } else if (node.kind === "character") {
                    const agent = agents.find((item) => (item.agent_id || item.id) === String(node.metadata?.agent_id));
                    if (agent) setSelection({ kind: "agent", value: agent });
                  } else if (node.kind === "zone") {
                    const zone = zones.find((item) => item.id === node.id);
                    if (zone) setSelection({ kind: "zone", value: zone });
                  } else if (node.kind === "district_object") {
                    const object = spatialObjects.find((item) => item.id === node.id);
                    if (object) setSelection({ kind: "object", value: object });
                  }
                }}
              />
            ) : (
              <div className="flex h-full min-h-[calc(100vh-4rem)] items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,.18),transparent_22%),radial-gradient(circle_at_75%_25%,rgba(124,58,237,.22),transparent_32%),#02040b] p-6">
                <div className="max-w-md text-center">
                  <p className="text-[9px] uppercase tracking-[.32em] text-cyan-200/55">District Experience</p>
                  <h2 className="mt-3 text-xl font-semibold">Spatial scene unavailable</h2>
                  <p className="mt-2 text-xs leading-5 text-white/35">The District is available, but no validated published Theme/World scene is available for this District. The 2D District controls remain usable.</p>
                </div>
              </div>
            )}
          </div>

          <div className="pointer-events-none relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col justify-between gap-6 px-4 py-5 sm:px-7 sm:py-7">
            <div className="pointer-events-auto max-w-2xl rounded-[30px] border border-white/10 bg-[#02040b]/70 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200/15 bg-cyan-300/[.07] px-3 py-1.5 text-[8px] uppercase tracking-[.18em] text-cyan-100/70">District</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] text-white/35">{district.district_type}</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] text-white/35">{district.visibility}</span>
                <span className={`rounded-full border px-3 py-1.5 text-[8px] ${realtime === "connected" ? "border-emerald-200/20 bg-emerald-300/[.06] text-emerald-100/70" : "border-amber-200/20 bg-amber-300/[.06] text-amber-100/65"}`}>
                  {realtime === "connected" ? "Realtime connected" : realtime === "polling" ? "Live polling" : "Connecting realtime"}
                </span>
              </div>
              <p className="mt-4 text-[8px] uppercase tracking-[.32em] text-violet-200/55">World → District → Zone → Booth → Presence</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{district.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/42">{district.description ?? "A living spatial District backed by authoritative zones, booths, spatial objects and Agent presence."}</p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Metric label="Zones" value={zones.length} />
                <Metric label="Active" value={activeZoneCount} />
                <Metric label="Booths" value={activeBoothCount} />
                <Metric label="Agents" value={agents.length} />
                <Metric label="Live" value={livePresenceCount} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => void enterDistrict()} className="min-h-11 rounded-full bg-white px-5 py-3 text-xs font-semibold text-slate-950">
                  {entered ? "Entered District" : "Enter District"}
                </button>
                <button type="button" onClick={() => setTab("zones")} className="min-h-11 rounded-full border border-white/10 bg-white/[.03] px-4 py-3 text-xs text-white/60">Explore Zones</button>
                <button type="button" onClick={() => setLowPower((value) => !value)} className="min-h-11 rounded-full border border-white/10 bg-white/[.03] px-4 py-3 text-xs text-white/60">{lowPower ? "Enable spatial quality" : "Low-power mode"}</button>
              </div>
            </div>

            <div className="pointer-events-auto grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-[28px] border border-white/10 bg-[#02040b]/75 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[8px] uppercase tracking-[.28em] text-violet-200/55">Living District</p>
                    <h2 className="mt-1 text-sm font-semibold">Spatial activity</h2>
                  </div>
                  <button type="button" onClick={() => void load(true)} disabled={refreshing} className="min-h-10 rounded-xl border border-white/10 px-3 text-[9px] text-white/50">{refreshing ? "Syncing…" : "Refresh"}</button>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
                  {zones.map((zone) => (
                    <button key={zone.id} type="button" onClick={() => setSelection({ kind: "zone", value: zone })} className="min-h-10 shrink-0 rounded-full border border-white/10 bg-white/[.03] px-3 text-[9px] text-white/50">
                      {zone.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid max-h-36 gap-2 overflow-auto sm:grid-cols-2">
                  {presence.length ? presence.map((item) => {
                    const agent = agents.find((candidate) => (candidate.agent_id || candidate.id) === item.agent_id);
                    return (
                      <button key={item.id} type="button" onClick={() => agent && setSelection({ kind: "agent", value: agent })} className="rounded-xl border border-white/[.08] bg-black/20 p-3 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] text-white/70">{agent?.name ?? "Agent Presence"}</span>
                          <span className="text-[8px] text-cyan-200/55">{item.movement_state}</span>
                        </div>
                        <p className="mt-1 text-[8px] text-white/25">{item.zone_key ?? "District"} · {item.position ? `${item.position.x.toFixed(1)}, ${item.position.z.toFixed(1)}` : "position pending"}</p>
                      </button>
                    );
                  }) : <p className="text-[10px] text-white/30">No active Agent Presence in this District yet.</p>}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-[#02040b]/75 p-3 backdrop-blur-xl">
                <div className="grid grid-cols-4 gap-1">
                  {(["overview", "zones", "booths", "agents"] as Tab[]).map((item) => (
                    <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-11 rounded-xl text-[8px] uppercase tracking-[.1em] ${tab === item ? "bg-cyan-300/10 text-cyan-100" : "text-white/35"}`} aria-pressed={tab === item}>
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <DistrictTabPanel
              tab={tab}
              zones={zones}
              booths={booths}
              agents={agents}
              spatialObjects={spatialObjects}
              presence={presence}
              onSelect={(item) => setSelection(item)}
            />
            <aside className="rounded-[28px] border border-white/[.08] bg-white/[.02] p-5">
              <p className="text-[8px] uppercase tracking-[.26em] text-cyan-200/50">Access & Runtime</p>
              <h2 className="mt-1 text-xl font-semibold">District controls</h2>
              <div className="mt-4 space-y-2">
                <RuntimeRow label="World" value={worldName ?? district.world_id} />
                <RuntimeRow label="Theme" value={activeTheme?.name ?? district.theme_key ?? "Published theme not resolved"} />
                <RuntimeRow label="Renderer" value={scene ? "AllphaWorldRenderer" : "2D fallback"} />
                <RuntimeRow label="Presence" value={realtime === "connected" ? "Realtime" : "5s authoritative polling"} />
              </div>
              <div className="mt-5 rounded-2xl border border-white/[.08] bg-black/20 p-4">
                <p className="text-[9px] uppercase tracking-[.18em] text-white/30">Need access?</p>
                <p className="mt-1 text-xs leading-5 text-white/40">Request access through the existing District access workflow. The server remains authoritative.</p>
                <textarea value={requestReason} onChange={(event) => setRequestReason(event.target.value)} placeholder="Reason (optional)" className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white outline-none placeholder:text-white/20" />
                <button type="button" onClick={() => void requestAccess()} disabled={requestingAccess} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 px-3 text-xs text-white/65 disabled:opacity-50">
                  {requestingAccess ? "Submitting…" : "Request District Access"}
                </button>
              </div>
              {interactionStatus ? <div className="mt-3 rounded-xl border border-cyan-200/15 bg-cyan-300/[.05] p-3 text-[10px] leading-5 text-cyan-50">{interactionStatus}</div> : null}
            </aside>
          </div>
        </section>
      </div>

      {selection ? (
        <SelectionSheet
          selection={selection}
          onClose={() => setSelection(null)}
          onInteraction={interact}
          onOpenBooth={() => window.location.assign("/booths")}
          onOpenAgent={(agent) => window.location.assign(`/agents/${encodeURIComponent(agent.agent_id || agent.id || "")}`)}
          onSelectZone={(zone) => setSelection({ kind: "zone", value: zone })}
        />
      ) : null}

      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </UniverseShell>
  );
}

function DistrictTabPanel({
  tab, zones, booths, agents, spatialObjects, presence, onSelect,
}: {
  tab: Tab;
  zones: Zone[];
  booths: Booth[];
  agents: Agent[];
  spatialObjects: SpatialObject[];
  presence: Presence[];
  onSelect: (selection: Exclude<Selection, null>) => void;
}) {
  if (tab === "zones") {
    return (
      <Panel title="Zones" eyebrow="District → Zone">
        <div className="grid gap-3 sm:grid-cols-2">
          {zones.length ? zones.map((zone) => (
            <button key={zone.id} type="button" onClick={() => onSelect({ kind: "zone", value: zone })} className="rounded-2xl border border-white/[.08] bg-black/15 p-4 text-left hover:border-cyan-200/20">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{zone.name}</span><span className="text-[8px] uppercase text-white/25">{zone.status}</span></div>
              <p className="mt-1 text-[9px] text-white/30">{zone.zone_key} · {zone.zone_type}</p>
            </button>
          )) : <Empty title="No Zones are available for this District." />}
        </div>
        {spatialObjects.length ? (
          <div className="mt-5">
            <p className="text-[8px] uppercase tracking-[.2em] text-white/25">Spatial Objects</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {spatialObjects.map((object) => (
                <button key={object.id} type="button" onClick={() => onSelect({ kind: "object", value: object })} className="rounded-xl border border-white/[.07] p-3 text-left">
                  <div className="flex items-center justify-between"><span className="text-[10px]">{object.name}</span><span className="text-[8px] text-white/25">{object.status}</span></div>
                  <p className="mt-1 text-[8px] text-white/25">{object.object_type} · {object.availability ?? "availability unknown"}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Panel>
    );
  }

  if (tab === "booths") {
    return (
      <Panel title="Booths & Tenants" eyebrow="District → Booth">
        <div className="grid gap-3 sm:grid-cols-2">
          {booths.length ? booths.map((booth) => (
            <button key={booth.id} type="button" onClick={() => onSelect({ kind: "booth", value: booth })} className="rounded-2xl border border-white/[.08] bg-black/15 p-4 text-left hover:border-violet-200/20">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{booth.name}</span><span className="text-[8px] text-white/25">{booth.status}</span></div>
              <p className="mt-1 text-[9px] text-white/30">{booth.booth_type} · {booth.tier}{booth.district_zone_id ? " · zone-bound" : ""}</p>
            </button>
          )) : <Empty title="No published Booth is available in this District yet." />}
        </div>
      </Panel>
    );
  }

  if (tab === "agents") {
    return (
      <Panel title="Agents in District" eyebrow="Presence → Agent">
        <div className="grid gap-3 sm:grid-cols-2">
          {agents.length ? agents.map((agent) => (
            <button key={agent.agent_id || agent.id} type="button" onClick={() => onSelect({ kind: "agent", value: agent })} className="rounded-2xl border border-white/[.08] bg-black/15 p-4 text-left hover:border-cyan-200/20">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{agent.name}</span><span className="text-[8px] text-emerald-200/55">{agent.status ?? agent.runtime_state ?? "linked"}</span></div>
              <p className="mt-1 text-[9px] text-white/30">{agent.handle ? `@${agent.handle}` : "AI Agent"} · {agent.description ?? "Public Agent Account"}</p>
            </button>
          )) : <Empty title="No public Agent Account is resolved for this District." />}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="District Overview" eyebrow="Living Spatial Layer">
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard title="Zones" value={zones.length} detail="Authoritative District zones" />
        <SummaryCard title="Spatial objects" value={spatialObjects.length} detail="Buildings, rooms, event and community objects" />
        <SummaryCard title="Booths" value={booths.length} detail="Published District tenants / venues" />
        <SummaryCard title="Agent presence" value={presence.length} detail="Realtime spatial states currently visible" />
      </div>
    </Panel>
  );
}

function SelectionSheet({
  selection, onClose, onInteraction, onOpenBooth, onOpenAgent, onSelectZone,
}: {
  selection: Exclude<Selection, null>;
  onClose: () => void;
  onInteraction: (kind: "conversation" | "collaboration" | "shopping" | "negotiation") => void;
  onOpenBooth: () => void;
  onOpenAgent: (agent: Agent) => void;
  onSelectZone: (zone: Zone) => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/65 p-3 backdrop-blur-sm" role="presentation" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="mx-auto mt-auto max-h-[78vh] max-w-xl overflow-auto rounded-[28px] border border-white/10 bg-[#080b16] p-5 shadow-2xl sm:mt-[10vh]" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="float-right min-h-11 min-w-11 rounded-full border border-white/10 text-xs" aria-label="Close spatial selection">×</button>
        <p className="text-[8px] uppercase tracking-[.24em] text-cyan-200/55">
          {selection.kind === "booth" ? "Booth / Tenant" : selection.kind === "agent" ? "Agent Presence" : selection.kind === "zone" ? "District Zone" : "Spatial Object"}
        </p>

        {selection.kind === "booth" ? (
          <>
            <h2 className="mt-2 text-2xl font-semibold">{selection.value.name}</h2>
            <p className="mt-1 text-xs text-white/40">{selection.value.booth_type} · {selection.value.tier} · {selection.value.status}</p>
            <div className="mt-5 grid gap-2">
              <Info label="Moderation" value={selection.value.moderation_status} />
              <Info label="Zone" value={selection.value.district_zone_id ? "Zone-bound" : "District level"} />
              <Info label="Host Agent" value={selection.value.host_agent_id ? "Assigned" : "Not assigned"} />
            </div>
            <button type="button" onClick={onOpenBooth} className="mt-5 min-h-11 rounded-xl border border-white/10 px-4 text-xs text-white/65">Open Booth / Tenant</button>
          </>
        ) : null}

        {selection.kind === "agent" ? (
          <>
            <h2 className="mt-2 text-2xl font-semibold">{selection.value.name}</h2>
            <p className="mt-1 text-xs text-white/40">{selection.value.handle ? `@${selection.value.handle}` : "AI Agent"} · {selection.value.status ?? "active"}</p>
            <p className="mt-4 text-xs leading-5 text-white/45">{selection.value.description ?? "Public Agent Account. Interaction remains subject to Passport, Capability, Policy, Permission, Risk and Approval."}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {(["conversation", "collaboration", "shopping", "negotiation"] as const).map((kind) => (
                <button key={kind} type="button" onClick={() => void onInteraction(kind)} className="min-h-11 rounded-xl border border-white/10 bg-white/[.03] px-3 text-[10px] text-white/65">{kind}</button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onOpenAgent(selection.value)} className="min-h-11 rounded-xl border border-white/10 px-3 text-[10px] text-white/60">Agent Profile</button>
              <a href="/messages" className="flex min-h-11 items-center justify-center rounded-xl bg-white px-3 text-[10px] font-semibold text-slate-950">Messages</a>
            </div>
          </>
        ) : null}

        {selection.kind === "zone" ? (
          <>
            <h2 className="mt-2 text-2xl font-semibold">{selection.value.name}</h2>
            <p className="mt-1 text-xs text-white/40">{selection.value.zone_key} · {selection.value.zone_type} · {selection.value.status}</p>
            <div className="mt-5 grid gap-2">
              <Info label="Objects" value="Select Spatial Objects from Zones tab" />
              <Info label="Presentation" value="Spatial zone context" />
            </div>
          </>
        ) : null}

        {selection.kind === "object" ? (
          <>
            <h2 className="mt-2 text-2xl font-semibold">{selection.value.name}</h2>
            <p className="mt-1 text-xs text-white/40">{selection.value.object_type} · {selection.value.status}</p>
            <div className="mt-5 grid gap-2">
              <Info label="Availability" value={selection.value.availability ?? "Not exposed"} />
              <Info label="Capacity" value={selection.value.capacity == null ? "Not exposed" : String(selection.value.capacity)} />
              <Info label="Zone" value={selection.value.zone_id ? String(selection.value.zone_id) : "District level"} />
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/[.08] bg-white/[.02] p-5">
      <p className="text-[8px] uppercase tracking-[.26em] text-cyan-200/50">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[.08] bg-black/20 p-3"><p className="text-[8px] uppercase tracking-[.16em] text-white/25">{label}</p><p className="mt-1 text-lg font-semibold text-cyan-100/80">{value}</p></div>;
}
function SummaryCard({ title, value, detail }: { title: string; value: number; detail: string }) {
  return <div className="rounded-2xl border border-white/[.08] bg-black/15 p-4"><p className="text-sm font-medium">{title}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-[9px] leading-4 text-white/30">{detail}</p></div>;
}
function RuntimeRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[.07] px-3 py-2 text-xs"><span className="text-white/30">{label}</span><span className="max-w-[65%] truncate text-right text-white/65">{value}</span></div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[.07] px-3 py-2 text-xs"><span className="text-white/30">{label}</span><span className="text-right text-white/70">{value}</span></div>;
}
function Empty({ title }: { title: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-5 text-xs text-white/30">{title}</div>;
}
function RuntimeNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mx-auto max-w-[1600px] px-4 pt-3 sm:px-7"><div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-3 text-[10px] text-amber-100/70">{message}<button type="button" onClick={onRetry} className="ml-3 underline">Retry</button></div></div>;
}
function DistrictState({ title, description }: { title: string; description: string }) {
  return <main className="flex min-h-[70vh] items-center justify-center p-6 text-white"><div className="max-w-md text-center"><p className="text-lg font-semibold">{title}</p><p className="mt-2 text-sm text-white/35">{description}</p><a href="/universe" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-xs">Back to Universe</a></div></main>;
}
function DistrictLoading() {
  return <main className="min-h-screen bg-[#02040b] p-4 text-white"><div className="mx-auto max-w-6xl animate-pulse space-y-4 pt-24"><div className="h-8 w-56 rounded bg-white/10"/><div className="h-[58vh] rounded-[30px] bg-white/[.04]"/><div className="grid gap-3 sm:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 rounded-2xl bg-white/[.04]"/>)}</div></div></main>;
}
function CreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="allpha-mobile-create-sheet-backdrop" role="presentation" onClick={onClose}><section className="allpha-mobile-create-sheet" role="dialog" aria-modal="true" aria-labelledby="district-create-title" onClick={(event)=>event.stopPropagation()}><div className="allpha-mobile-create-sheet-handle" aria-hidden="true"/><div className="allpha-mobile-create-sheet-header"><div><p className="allpha-eyebrow">Create</p><h2 id="district-create-title">Create in Allpha</h2><p>Start from the existing canonical creation flow.</p></div><button type="button" className="allpha-button allpha-button-icon allpha-button-ghost" aria-label="Close create menu" onClick={onClose}>×</button></div><a href="/agents/create" className="allpha-mobile-create-action"><span className="allpha-mobile-create-action-icon">◈</span><span><strong>Agent Factory</strong><small>Create an owner-owned AI Agent</small></span><span aria-hidden="true">→</span></a></section></div>;
}
