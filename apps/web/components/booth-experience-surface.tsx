"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { apiFetch } from "../lib/api";
import UniverseShell, { type UniverseShellKey } from "./universe/universe-shell";
import AgentAccountCard, { type AgentAccount } from "./agent-account-card";
import { normalizeWorldScene, type SceneNode, type WorldScene } from "../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(() => import("./world/allpha-world-renderer"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center bg-[#02040b] text-xs text-white/35">
      Preparing Booth spatial renderer…
    </div>
  ),
});

type Booth = {
  id: string;
  owner_user_id?: string | null;
  owner_organization_id?: string | null;
  agent_id?: string | null;
  district_id: string;
  district_zone_id?: string | null;
  booth_type: string;
  tier: string;
  name: string;
  slug: string;
  description?: string | null;
  theme_id?: string | null;
  theme_key?: string | null;
  display_config?: Record<string, unknown>;
  scene_config?: Record<string, unknown>;
  catalog_config?: Record<string, unknown>;
  live_entry_config?: Record<string, unknown>;
  branding_config?: Record<string, unknown>;
  portal_config?: Record<string, unknown>;
  status: string;
  moderation_status: string;
  host_agent_id?: string | null;
  platform_owned?: boolean;
  created_at?: string;
  updated_at?: string;
};

type BoothProjection = Booth & {
  spatial_projection?: {
    position?: { x: number; y: number; z: number } | null;
    presentation_only?: boolean;
  };
  asset_manifest?: Array<{ asset_type?: string; signed_url?: string | null }>;
};

type Asset = {
  id: string;
  booth_id: string;
  asset_type: string;
  storage_path: string;
  mime_type?: string | null;
  status: string;
  content_size_bytes?: number | null;
  checksum_sha256?: string | null;
  uploaded_at?: string | null;
  signed_url?: string | null;
};

type Slot = {
  id: string;
  booth_id: string;
  slot_key: string;
  asset_id?: string | null;
  presentation_config?: Record<string, unknown>;
  updated_at?: string;
};

type Lease = {
  id: string;
  booth_id: string;
  owner_user_id?: string | null;
  owner_organization_id?: string | null;
  tier: string;
  size_class: string;
  visibility_class: string;
  traffic_score?: number | null;
  price_amount?: number | null;
  currency?: string | null;
  billing_cycle?: string | null;
  starts_at: string;
  ends_at?: string | null;
  status: string;
  entitlement_snapshot?: Record<string, unknown>;
};

type District = {
  id: string;
  world_id: string;
  name: string;
  description?: string | null;
  district_type: string;
  visibility: string;
  status: string;
  theme_key?: string | null;
};

type Zone = {
  id: string;
  name: string;
  zone_key: string;
  zone_type: string;
  status: string;
};

type Theme = {
  id: string;
  name: string;
  slug: string;
  catalog_key?: string | null;
  description?: string | null;
  world_schema?: unknown;
  tokens?: Record<string, unknown>;
};

type Presence = {
  id: string;
  agent_id: string;
  movement_state: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  zone_key?: string | null;
};

type Listing = {
  id: string;
  listing_type?: string;
  title?: string;
  description?: string | null;
  price_amount?: number | null;
  currency?: string | null;
  price_unit?: string | null;
  status?: string;
  skill_name?: string | null;
  booth_id?: string | null;
  seller_type?: string;
};

type Tab = "overview" | "catalog" | "agent" | "space";

type Composition = {
  district: District;
  zones?: Zone[];
  booths?: BoothProjection[];
  spatial_presence?: Presence[];
};

function stringConfig(config: Record<string, unknown> | undefined, key: string): string | null {
  const value = config?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function BoothExperienceSurface({ boothId }: { boothId: string }) {
  const [booth, setBooth] = useState<Booth | null>(null);
  const [district, setDistrict] = useState<District | null>(null);
  const [worldName, setWorldName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [hostAgent, setHostAgent] = useState<AgentAccount | null>(null);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [scene, setScene] = useState<WorldScene | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [lowPower, setLowPower] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState<"connecting" | "connected" | "polling">("connecting");
  const [interactionStatus, setInteractionStatus] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    let boothValue: Booth | null = null;
    const failures: string[] = [];

    try {
      const result = await apiFetch<{ data: Booth }>(`/api/v1/booths/${encodeURIComponent(boothId)}`);
      boothValue = result.data ?? null;
      setBooth(boothValue);
    } catch (e) {
      setBooth(null);
      setLoading(false);
      setRefreshing(false);
      setError(e instanceof Error ? e.message : "BOOTH_LOAD_FAILED");
      return;
    }

    const optional = await Promise.allSettled([
      apiFetch<{ data: Asset[] }>(`/api/v1/booths/${encodeURIComponent(boothId)}/assets/3d`),
      apiFetch<{ data: Slot[] }>(`/api/v1/booths/${encodeURIComponent(boothId)}/slots`),
      apiFetch<{ data: Lease[] }>(`/api/v1/booths/${encodeURIComponent(boothId)}/leases`),
      apiFetch<{ data: Composition }>(`/api/v1/themes/world-runtime/districts/${encodeURIComponent(boothValue.district_id)}/composition`),
      apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog"),
      apiFetch<{ data: Listing[] }>(`/api/v1/marketplace/listings?booth_id=${encodeURIComponent(boothId)}&limit=24`),
      apiFetch<{ data: AgentAccount[] }>(`/api/v1/agent-catalog/accounts?booth_id=${encodeURIComponent(boothId)}&limit=8`),
    ]);

    const [assetResult, slotResult, leaseResult, compositionResult, themeResult, listingResult, agentResult] = optional;

    if (assetResult.status === "fulfilled") setAssets(Array.isArray(assetResult.value.data) ? assetResult.value.data : []);
    else failures.push("BOOTH_ASSETS_UNAVAILABLE");

    if (slotResult.status === "fulfilled") setSlots(Array.isArray(slotResult.value.data) ? slotResult.value.data : []);
    else failures.push("BOOTH_DISPLAY_SLOTS_UNAVAILABLE");

    if (leaseResult.status === "fulfilled") setLeases(Array.isArray(leaseResult.value.data) ? leaseResult.value.data : []);
    else failures.push("BOOTH_TENANCY_UNAVAILABLE");

    if (listingResult.status === "fulfilled") setListings(Array.isArray(listingResult.value.data) ? listingResult.value.data : []);
    else failures.push("BOOTH_CATALOG_UNAVAILABLE");

    if (agentResult.status === "fulfilled") {
      const candidate = Array.isArray(agentResult.value.data) ? agentResult.value.data[0] : null;
      setHostAgent(candidate ?? null);
    } else failures.push("BOOTH_AGENT_UNAVAILABLE");

    let composition: Composition | null = null;
    if (compositionResult.status === "fulfilled") {
      composition = compositionResult.value.data;
      const districtValue = composition?.district ?? null;
      setDistrict(districtValue);
      const matchedZone = (composition?.zones ?? []).find((item) => item.id === boothValue?.district_zone_id) ?? null;
      setZone(matchedZone);
      const matchedBooth = (composition?.booths ?? []).find((item) => item.id === boothValue?.id);
      setPresence((composition?.spatial_presence ?? []).filter((item) =>
        Boolean(boothValue?.host_agent_id && item.agent_id === boothValue.host_agent_id)
      ));

      if (districtValue?.world_id) {
        try {
          const worldResult = await apiFetch<{ data: { name?: string } }>(
            `/api/v1/universe/worlds/${encodeURIComponent(districtValue.world_id)}`,
          );
          setWorldName(worldResult.data?.name ?? null);
        } catch {
          failures.push("BOOTH_WORLD_CONTEXT_UNAVAILABLE");
        }
      }

      const themeKey = boothValue?.theme_key ?? districtValue?.theme_key ?? null;
      if (themeResult.status === "fulfilled") {
        const themes = Array.isArray(themeResult.value.data) ? themeResult.value.data : [];
        const resolvedTheme =
          themes.find((item) => item.id === boothValue?.theme_id) ??
          themes.find((item) => item.slug === themeKey || item.id === themeKey || item.catalog_key === themeKey) ??
          themes[0] ??
          null;
        setTheme(resolvedTheme);
        const normalizedScene = resolvedTheme?.world_schema ? normalizeWorldScene(resolvedTheme.world_schema) : null;
        const runtimeThemeKey = themeKey ?? resolvedTheme?.slug ?? null;
        setScene(runtimeThemeKey ? {
          ...(normalizedScene ?? {
            schema_version: "1.0",
            renderer: "AllphaWorldRenderer",
            zones: [],
            lighting: { profile: "asset-owned", presentation_only: true },
            atmosphere: { profile: "asset-owned", presentation_only: true },
            spawn_points: [{ id: "booth-spawn", zone: "booth", position: { x: 0, y: 0, z: 0 } }],
            camera: { mobile: { position: [0, 3.5, 8], fov: 50 }, desktop: { position: [0, 5, 11], fov: 52 }, min_distance: 3, max_distance: 24 },
            authority_boundary: { presentation_only: true as const },
          }),
          environment: {
            ...(normalizedScene?.environment ?? {}),
            architecture: resolvedTheme?.name ?? boothValue.name,
            spatial_layer: "booth",
            theme_key: runtimeThemeKey,
            asset_generation: "tripo-v3",
            presentation_only: true,
          },
          zones: normalizedScene?.zones ?? [],
          structures: normalizedScene?.structures ?? [],
          booths: normalizedScene?.booths ?? [],
          portals: normalizedScene?.portals ?? [],
          spawn_points: normalizedScene?.spawn_points ?? [{ id: "booth-spawn", zone: "booth", position: { x: 0, y: 0, z: 0 } }],
        } : normalizedScene);
      if (!matchedBooth) failures.push("BOOTH_SPATIAL_PROJECTION_UNAVAILABLE");
    } else {
      failures.push("BOOTH_DISTRICT_CONTEXT_UNAVAILABLE");
      setDistrict(null);
      setZone(null);
      setPresence([]);
      setScene(null);
      setTheme(null);
    }

    setError(failures.length ? failures.join(" · ") : null);
    setLoading(false);
    setRefreshing(false);
  }, [boothId]);

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
        .channel(`allpha-booth-experience-${boothId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "booths", filter: `id=eq.${boothId}` }, () => {
          if (active) void load(true);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "booth_display_assets", filter: `booth_id=eq.${boothId}` }, () => {
          if (active) void load(true);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "booth_display_slots", filter: `booth_id=eq.${boothId}` }, () => {
          if (active) void load(true);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "booth_leases", filter: `booth_id=eq.${boothId}` }, () => {
          if (active) void load(true);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_listings", filter: `booth_id=eq.${boothId}` }, () => {
          if (active) void load(true);
        })
        .subscribe((status: string) => {
          if (!active) return;
          if (status === "SUBSCRIBED") setRealtime("connected");
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setRealtime("polling");
        });
    } catch {
      setRealtime("polling");
    }

    timer = setInterval(() => {
      if (active) void load(true);
    }, 5000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      if (channel) void channel.unsubscribe();
    };
  }, [boothId, load]);

  const boothNode = useMemo<SceneNode | null>(() => {
    if (!booth) return null;
    const configured =
      (booth.scene_config?.position as { x: number; y: number; z: number } | undefined) ??
      (booth.display_config?.position as { x: number; y: number; z: number } | undefined) ??
      { x: 0, y: 0, z: 0 };
    const modelUrl = assets.find((asset) => asset.asset_type === "3d_scene" && asset.signed_url)?.signed_url ?? null;
    return {
      id: booth.id,
      kind: "booth",
      position: configured,
      scale: { x: 1, y: 1, z: 1 },
      metadata: {
        booth_id: booth.id,
        booth_type: booth.booth_type,
        tier: booth.tier,
        status: booth.status,
        moderation_status: booth.moderation_status,
        model_url: modelUrl,
        presentation_only: true,
      },
      presentation_only: true,
    };
  }, [booth, assets]);

  const hostPresence = useMemo(() => presence.map((item) => ({
    id: item.id,
    agent_id: item.agent_id,
    movement_state: item.movement_state,
    position: item.position,
    rotation: item.rotation,
    zone_key: item.zone_key,
  })), [presence]);

  const activeLease = useMemo(
    () => leases.find((lease) => lease.status === "active") ?? leases.find((lease) => lease.status === "pending") ?? null,
    [leases],
  );

  const tagline = stringConfig(booth?.branding_config, "tagline");
  const liveSessionId =
    stringConfig(booth?.live_entry_config, "session_id") ??
    stringConfig(booth?.live_entry_config, "live_session_id");
  const liveEnabled = booth?.live_entry_config?.enabled === true || Boolean(liveSessionId);
  const catalogLabel = stringConfig(booth?.catalog_config, "label");

  async function interact(kind: "conversation" | "collaboration" | "shopping" | "negotiation") {
    if (!booth || !hostAgent || !district) return;
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
          target_id: hostAgent.agent_id,
          interaction_type: kind,
          payload: { source_surface: "booth", booth_id: booth.id, district_id: booth.district_id },
        }),
      });
      setInteractionStatus("Interaction recorded by Spatial Runtime. Policy, permission, risk, approval and execution remain authoritative.");
    } catch (e) {
      setInteractionStatus(e instanceof Error ? e.message : "BOOTH_AGENT_INTERACTION_FAILED");
    }
  }

  function navigateShell(key: UniverseShellKey) {
    if (key === "universe" || key === "explore") window.location.assign("/universe");
    else if (key === "my-agent") window.location.assign("/agents");
    else if (key === "social") window.location.assign("/social");
    else if (key === "communities") window.location.assign("/communities");
    else if (key === "missions") window.location.assign("/missions");
    else if (key === "marketplace") window.location.assign("/marketplace");
  }

  if (loading && !booth) return <BoothLoading />;
  if (!booth) {
    return (
      <UniverseShell active="explore" onNavigate={navigateShell} onCreate={() => setCreateOpen(true)}>
        <StatePanel title="Booth unavailable" description={error ?? "The authoritative Booth record could not be loaded."} />
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
          <span className="allpha-eyebrow">Booth Context</span>
          <strong>{booth.name}</strong>
          <span>{district ? `District · ${district.name}` : "District context unavailable"}</span>
        </div>
      }
      commandBar={
        <div className="allpha-universe-command-default">
          <span className="allpha-universe-command-signal" aria-hidden="true" />
          <span>Booth Command</span>
          {(["overview", "catalog", "agent", "space"] as Tab[]).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)}>{item}</button>
          ))}
          <button type="button" onClick={() => setLowPower((value) => !value)}>{lowPower ? "Spatial quality" : "Low power"}</button>
        </div>
      }
    >
      <div className="pb-20 pt-16 md:pb-0">
        {error ? <RuntimeNotice message={error} onRetry={() => void load()} /> : null}

        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-[#02040b]">
            {scene && boothNode ? (
              <AllphaWorldRenderer
                productionSpatialLayer="booth"
                scene={scene}
                tokens={theme?.tokens}
                lowPower={lowPower}
                booths={[boothNode]}
                presence={hostPresence}
                selectedBoothId={booth.id}
                selectedDistrictId={booth.district_id}
              />
            ) : (
              <div
                className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6"
                style={{
                  background:
                    "radial-gradient(circle at 50% 40%, rgba(34,211,238,.18), transparent 24%), radial-gradient(circle at 75% 25%, rgba(124,58,237,.2), transparent 32%), #02040b",
                }}
              >
                <div className="max-w-md text-center">
                  <p className="text-[9px] uppercase tracking-[.32em] text-cyan-200/55">Booth / Tenant</p>
                  <h2 className="mt-3 text-2xl font-semibold">2D Booth experience active</h2>
                  <p className="mt-2 text-xs leading-5 text-white/35">No validated published Theme/World scene is available for this Booth context. The Booth identity, catalog, Agent Host and tenancy state remain available below.</p>
                </div>
              </div>
            )}
          </div>

          <div className="pointer-events-none relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col justify-between gap-6 px-4 py-5 sm:px-7 sm:py-7">
            <div className="pointer-events-auto max-w-2xl rounded-[30px] border border-white/10 bg-[#02040b]/72 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200/15 bg-cyan-300/[.07] px-3 py-1.5 text-[8px] uppercase tracking-[.18em] text-cyan-100/70">Booth / Tenant</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] text-white/35">{booth.booth_type}</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] text-white/35">{booth.tier}</span>
                <span className={`rounded-full border px-3 py-1.5 text-[8px] ${realtime === "connected" ? "border-emerald-200/20 bg-emerald-300/[.06] text-emerald-100/70" : "border-amber-200/20 bg-amber-300/[.06] text-amber-100/65"}`}>
                  {realtime === "connected" ? "Realtime connected" : realtime === "polling" ? "Live polling" : "Connecting realtime"}
                </span>
              </div>
              <p className="mt-4 text-[8px] uppercase tracking-[.32em] text-violet-200/55">Universe → District → Booth → Agent / Presence</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{booth.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/42">{tagline ?? booth.description ?? "A spatial tenant / venue inside the Allpha Universe."}</p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Listings" value={listings.length} />
                <Metric label="3D Assets" value={assets.length} />
                <Metric label="Display Slots" value={slots.length} />
                <Metric label="Host" value={hostAgent ? 1 : 0} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`/districts/${encodeURIComponent(booth.district_id)}`} className="min-h-11 rounded-full bg-white px-5 py-3 text-xs font-semibold text-slate-950">Back to District</a>
                <button type="button" onClick={() => setTab("catalog")} className="min-h-11 rounded-full border border-white/10 bg-white/[.03] px-4 py-3 text-xs text-white/65">{catalogLabel ?? "Explore catalog"}</button>
                {liveEnabled ? (
                  <a href={liveSessionId ? `/live?session_id=${encodeURIComponent(liveSessionId)}` : "/live"} className="min-h-11 rounded-full border border-violet-200/15 bg-violet-300/[.06] px-4 py-3 text-xs text-violet-100/75">Open Live</a>
                ) : null}
              </div>
            </div>

            <div className="pointer-events-auto grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-[28px] border border-white/10 bg-[#02040b]/75 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[8px] uppercase tracking-[.28em] text-violet-200/55">Booth Presence</p>
                    <h2 className="mt-1 text-sm font-semibold">{hostAgent?.name ?? "No AI Host bound"}</h2>
                  </div>
                  <button type="button" onClick={() => void load(true)} disabled={refreshing} className="min-h-10 rounded-xl border border-white/10 px-3 text-[9px] text-white/50">{refreshing ? "Syncing…" : "Refresh"}</button>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-white/30">{presence.length ? `Host presence: ${presence[0].movement_state}${presence[0].zone_key ? ` · ${presence[0].zone_key}` : ""}` : "Host Agent presence is not currently resolved in the District spatial runtime."}</p>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-[#02040b]/75 p-3 backdrop-blur-xl">
                <div className="grid grid-cols-4 gap-1">
                  {(["overview", "catalog", "agent", "space"] as Tab[]).map((item) => (
                    <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-11 rounded-xl text-[8px] uppercase tracking-[.1em] ${tab === item ? "bg-cyan-300/10 text-cyan-100" : "text-white/35"}`} aria-pressed={tab === item}>{item}</button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <BoothTabPanel
              tab={tab}
              booth={booth}
              district={district}
              zone={zone}
              worldName={worldName}
              theme={theme}
              listings={listings}
              leases={leases}
              assets={assets}
              slots={slots}
              hostAgent={hostAgent}
              onInteraction={interact}
            />
            <aside className="rounded-[28px] border border-white/[.08] bg-white/[.02] p-5">
              <p className="text-[8px] uppercase tracking-[.26em] text-cyan-200/50">Tenant & Runtime</p>
              <h2 className="mt-1 text-xl font-semibold">Booth controls</h2>
              <div className="mt-4 space-y-2">
                <RuntimeRow label="District" value={district?.name ?? booth.district_id} />
                <RuntimeRow label="World" value={worldName ?? "Context unavailable"} />
                <RuntimeRow label="Zone" value={zone?.name ?? (booth.district_zone_id ? booth.district_zone_id : "District level")} />
                <RuntimeRow label="Theme" value={theme?.name ?? booth.theme_key ?? "Theme not resolved"} />
                <RuntimeRow label="Renderer" value={scene ? "AllphaWorldRenderer" : "2D fallback"} />
                <RuntimeRow label="Presence" value={realtime === "connected" ? "Realtime" : "5s authoritative polling"} />
                <RuntimeRow label="Tenancy" value={activeLease ? `${activeLease.status} · ${activeLease.tier}` : "No lease record"} />
              </div>
              {interactionStatus ? <div className="mt-4 rounded-xl border border-cyan-200/15 bg-cyan-300/[.05] p-3 text-[10px] leading-5 text-cyan-50">{interactionStatus}</div> : null}
              <div className="mt-5 rounded-2xl border border-white/[.08] bg-black/20 p-4">
                <p className="text-[9px] uppercase tracking-[.18em] text-white/30">Authority boundary</p>
                <p className="mt-2 text-[10px] leading-5 text-white/35">Booth identity, ownership, entitlement, pricing, tenancy, Agent authority, policy, risk, approval and commerce state remain server-authoritative.</p>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </UniverseShell>
  );
}

function BoothTabPanel({
  tab, booth, district, zone, worldName, theme, listings, leases, assets, slots, hostAgent, onInteraction,
}: {
  tab: Tab;
  booth: Booth;
  district: District | null;
  zone: Zone | null;
  worldName: string | null;
  theme: Theme | null;
  listings: Listing[];
  leases: Lease[];
  assets: Asset[];
  slots: Slot[];
  hostAgent: AgentAccount | null;
  onInteraction: (kind: "conversation" | "collaboration" | "shopping" | "negotiation") => void;
}) {
  if (tab === "catalog") {
    return (
      <Panel title="Published Booth Catalog" eyebrow="Booth → Marketplace">
        <div className="grid gap-3 sm:grid-cols-2">
          {listings.length ? listings.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/[.08] bg-black/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-cyan-200/10 bg-cyan-300/[.05] px-2 py-1 text-[8px] uppercase tracking-[.14em] text-cyan-100/60">{item.listing_type ?? "listing"}</span>
                <span className="text-[8px] text-white/25">{item.status ?? "published"}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{item.title ?? "Untitled listing"}</h3>
              <p className="mt-2 line-clamp-3 text-[10px] leading-5 text-white/35">{item.description ?? "No listing description."}</p>
              <div className="mt-4 flex items-center justify-between text-[10px]">
                <span className="text-white/45">{item.price_amount == null ? "Price not exposed" : `${item.price_amount.toLocaleString()} ${item.currency ?? "IDR"}`}</span>
                <span className="text-white/25">{item.price_unit ?? ""}</span>
              </div>
            </article>
          )) : <Empty title="No published Marketplace listing is currently exposed for this Booth." />}
        </div>
        <div className="mt-4 rounded-2xl border border-white/[.08] bg-black/15 p-4 text-[10px] leading-5 text-white/30">Marketplace listing and order state remain owned by the canonical Commerce / Marketplace engine. This surface only presents authoritative published listings.</div>
      </Panel>
    );
  }

  if (tab === "agent") {
    return (
      <Panel title="AI Host" eyebrow="Booth → Agent">
        {hostAgent ? (
          <>
            <AgentAccountCard agent={hostAgent} discoveryContext={{ source_surface: "booth", booth_id: booth.id, district_id: booth.district_id, world_id: district?.world_id }} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["conversation", "collaboration", "shopping", "negotiation"] as const).map((kind) => (
                <button key={kind} type="button" onClick={() => onInteraction(kind)} className="min-h-11 rounded-xl border border-white/10 bg-white/[.03] px-3 text-[10px] text-white/65">{kind}</button>
              ))}
            </div>
          </>
        ) : (
          <Empty title="No public AI Host is currently resolved for this Booth." />
        )}
      </Panel>
    );
  }

  if (tab === "space") {
    return (
      <Panel title="Spatial Booth Runtime" eyebrow="Booth → Space">
        <div className="grid gap-3 sm:grid-cols-2">
          <Summary title="3D assets" value={assets.length} detail="Verified active Booth display assets" />
          <Summary title="Display slots" value={slots.length} detail="Declarative Booth presentation slots" />
          <Summary title="Theme" value={theme?.name ?? booth.theme_key ?? "Not resolved"} detail="Existing Theme / World runtime" />
          <Summary title="World" value={worldName ?? "Not resolved"} detail="Existing World context" />
        </div>
        <div className="mt-5 rounded-2xl border border-white/[.08] bg-black/15 p-4">
          <p className="text-[8px] uppercase tracking-[.2em] text-white/25">3D lifecycle</p>
          <p className="mt-2 text-xs leading-5 text-white/45">Upload → Storage Verification → Active Asset → Display Slot → AllphaWorldRenderer.</p>
          <div className="mt-4 space-y-2">
            {assets.length ? assets.map((asset) => (
              <div key={asset.id} className="rounded-xl border border-white/[.07] p-3">
                <div className="flex items-center justify-between gap-3 text-[10px]">
                  <span>{asset.asset_type}</span>
                  <span className="text-emerald-200/60">{asset.status}</span>
                </div>
                <p className="mt-1 break-all text-[9px] text-white/25">{asset.storage_path}</p>
                <p className="mt-1 text-[9px] text-white/20">{asset.content_size_bytes ?? 0} bytes · signed runtime URL {asset.signed_url ? "ready" : "unavailable"}</p>
              </div>
            )) : <Empty title="No active 3D Booth asset is available." />}
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Booth Overview" eyebrow="Tenant Identity">
      <div className="grid gap-3 sm:grid-cols-2">
        <Summary title="Booth status" value={booth.status} detail={`Moderation · ${booth.moderation_status}`} />
        <Summary title="Tier" value={booth.tier} detail={booth.booth_type} />
        <Summary title="District" value={district?.name ?? booth.district_id} detail={zone?.name ?? "District level"} />
        <Summary title="Theme" value={theme?.name ?? booth.theme_key ?? "Not resolved"} detail="Existing Theme runtime" />
      </div>

      <div className="mt-5 rounded-2xl border border-white/[.08] bg-black/15 p-4">
        <p className="text-[8px] uppercase tracking-[.2em] text-white/25">Branding</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <RuntimeRow label="Tagline" value={stringConfig(booth.branding_config, "tagline") ?? "Not configured"} />
          <RuntimeRow label="Brand accent" value={stringConfig(booth.branding_config, "accent") ?? "Theme default"} />
          <RuntimeRow label="Portal" value={Object.keys(booth.portal_config ?? {}).length ? "Configured" : "Not configured"} />
          <RuntimeRow label="Live entry" value={Object.keys(booth.live_entry_config ?? {}).length ? "Configured" : "Not configured"} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[.08] bg-black/15 p-4">
        <p className="text-[8px] uppercase tracking-[.2em] text-white/25">Tenant state</p>
        {leases.length ? (
          <div className="mt-3 space-y-2">
            {leases.slice(0, 4).map((lease) => (
              <div key={lease.id} className="rounded-xl border border-white/[.07] p-3">
                <div className="flex items-center justify-between gap-3 text-[10px]">
                  <span>{lease.status} · {lease.tier}</span>
                  <span className="text-white/35">{lease.price_amount == null ? "Price not exposed" : `${lease.price_amount.toLocaleString()} ${lease.currency ?? ""}`}</span>
                </div>
                <p className="mt-1 text-[9px] text-white/25">{lease.size_class} · {lease.visibility_class} · {lease.billing_cycle ?? "billing cycle not exposed"}</p>
              </div>
            ))}
          </div>
        ) : <Empty title="No Booth lease record is currently exposed to this viewer." />}
      </div>
    </Panel>
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
  return (
    <div className="rounded-2xl border border-white/[.08] bg-black/20 p-3">
      <p className="text-[8px] uppercase tracking-[.16em] text-white/25">{label}</p>
      <p className="mt-1 text-lg font-semibold text-cyan-100/80">{value}</p>
    </div>
  );
}

function Summary({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-black/15 p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 break-words text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[9px] leading-4 text-white/30">{detail}</p>
    </div>
  );
}

function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[.07] px-3 py-2 text-xs">
      <span className="text-white/30">{label}</span>
      <span className="max-w-[65%] truncate text-right text-white/65">{value}</span>
    </div>
  );
}

function RuntimeNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="relative z-[70] mx-auto max-w-[1500px] px-5 pt-3 sm:px-8">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] px-4 py-3 text-[10px] text-amber-50">
        <span>{message}</span>
        <button type="button" onClick={onRetry} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-white/70">Retry</button>
      </div>
    </div>
  );
}

function Empty({ title }: { title: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.015] p-5 text-xs leading-5 text-white/35">{title}</div>;
}

function StatePanel({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#02040b] px-5 pb-20 pt-24 text-white">
      <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-white/[.025] p-7">
        <p className="text-[9px] uppercase tracking-[.3em] text-cyan-200/60">Booth / Tenant</p>
        <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-white/40">{description}</p>
      </div>
    </main>
  );
}

function BoothLoading() {
  return (
    <main className="min-h-screen bg-[#02040b] px-5 pb-20 pt-24 text-white">
      <div className="mx-auto max-w-6xl animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-white/10" />
        <div className="h-[520px] rounded-[30px] bg-white/[.04]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-white/[.04]" />
          <div className="h-28 rounded-2xl bg-white/[.04]" />
          <div className="h-28 rounded-2xl bg-white/[.04]" />
        </div>
      </div>
    </main>
  );
}

function CreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="allpha-mobile-create-sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="allpha-mobile-create-sheet" role="dialog" aria-modal="true" aria-labelledby="booth-create-title" onClick={(event) => event.stopPropagation()}>
        <div className="allpha-mobile-create-sheet-handle" aria-hidden="true" />
        <div className="allpha-mobile-create-sheet-header">
          <div>
            <p className="allpha-eyebrow">Create</p>
            <h2 id="booth-create-title">Create in Allpha</h2>
            <p>Use the existing Agent Factory now. Full Experience creation remains WEB-16.</p>
          </div>
          <button type="button" className="allpha-button allpha-button-icon allpha-button-ghost" aria-label="Close create menu" onClick={onClose}>×</button>
        </div>
        <a href="/agents/create" className="allpha-mobile-create-action">
          <span className="allpha-mobile-create-action-icon">◈</span>
          <span><strong>Agent Factory</strong><small>Create an owner-owned AI Agent</small></span>
          <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}
