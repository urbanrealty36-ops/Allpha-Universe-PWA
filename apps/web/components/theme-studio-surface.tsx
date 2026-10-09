"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { normalizeWorldScene, type WorldScene } from "../lib/world-engine/scene-schema";
import ThemeSpatialSlice from "./theme-spatial-slice";
import LiveExperienceVerticalSlice from "./live-experience-vertical-slice";
import AvatarStudioSurface from "./avatar-studio-surface";
import TripoGenerationPanel from "./tripo-generation-panel";

const AllphaWorldRenderer = dynamic(() => import("./world/allpha-world-renderer"), {
  ssr: false,
  loading: () => <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-white/10 bg-black text-sm text-slate-500">Preparing 3D Theme renderer…</div>,
});

type Theme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  catalog_order?: number | null;
  tokens?: Record<string, unknown>;
  world_schema?: unknown;
  theme_version?: number | null;
};

type Manifest = {
  assets?: Array<{ id: string; asset_type: string; status: string; signed_url?: string | null }>;
  binary_3d_assets?: Array<{ id: string; signed_url?: string | null }>;
  has_binary_3d_pack?: boolean;
};

type StepStatus = "ready" | "partial" | "missing";

type WorkflowStep = {
  key: string;
  title: string;
  description: string;
  href?: string;
  status: StepStatus;
  action: string;
};

const statusLabel: Record<StepStatus, string> = {
  ready: "READY",
  partial: "PARTIAL",
  missing: "NOT ACTIVATED",
};

export default function ThemeStudioSurface() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selected, setSelected] = useState<Theme | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [assetLoading, setAssetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog");
        const catalog = response.data ?? [];
        setThemes(catalog);
        setSelected(catalog[0] ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "THEME_STUDIO_LOAD_FAILED");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setManifest(null);
    if (!selected?.id) return () => { cancelled = true; };
    setAssetLoading(true);
    void (async () => {
      try {
        const response = await apiFetch<{ data: Manifest }>(
          `/api/v1/themes/world-runtime/themes/${selected.id}/asset-manifest`,
        );
        if (!cancelled) setManifest(response.data ?? null);
      } catch {
        if (!cancelled) setManifest(null);
      } finally {
        if (!cancelled) setAssetLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected?.id]);

  const scene = useMemo<WorldScene | null>(
    () => (selected ? normalizeWorldScene(selected.world_schema) : null),
    [selected],
  );

  const binaryUrl = manifest?.binary_3d_assets?.find(
    (asset) => typeof asset.signed_url === "string",
  )?.signed_url ?? null;

  const steps = useMemo<WorkflowStep[]>(() => {
    const hasTheme = Boolean(selected);
    const hasBinary = Boolean(binaryUrl);
    return [
      {
        key: "theme",
        title: "Theme",
        description: "Pilih Theme Version yang authoritative sebagai fondasi seluruh presentation layer.",
        status: hasTheme ? "ready" : "missing",
        action: "Selected",
      },
      {
        key: "world",
        title: "World / 3D Scene",
        description: "Validated declarative Scene Schema diteruskan ke AllphaWorldRenderer.",
        href: "/world-builder",
        status: scene ? "ready" : "partial",
        action: scene ? "Open Builder" : "Configure",
      },
      {
        key: "district",
        title: "District 3D",
        description: "World dipecah menjadi District → Zone sebelum Booth dan spatial presence.",
        href: "/districts",
        status: "partial",
        action: "Manage District",
      },
      {
        key: "booth",
        title: "Booth 3D",
        description: "Booth memakai real GLB melalui signed Storage upload dan asset lifecycle.",
        href: "/booths",
        status: "partial",
        action: "Manage Booth",
      },
      {
        key: "content",
        title: "Feed / Content Universe",
        description: "Content dan AI Capsule menjadi objek discovery dan presentation di Universe.",
        href: "/feed",
        status: "partial",
        action: "Open Feed",
      },
      {
        key: "live",
        title: "Live Experience Stage",
        description: "Live template/session/collaboration siap menjadi stage bertema setelah asset stage aktif.",
        href: "/live",
        status: "partial",
        action: "Open Live",
      },
      {
        key: "agent",
        title: "AI Character",
        description: "Character Catalog dan Agent Factory sudah tersedia; 3D character asset lifecycle masih perlu aktivasi.",
        href: "/agents/create",
        status: "partial",
        action: "Create Agent",
      },
      {
        key: "user-character",
        title: "User Character / Uniform",
        description: "User Character sudah memiliki ownership/equipped state; Uniform memiliki catalog, ownership dan equipped state. Asset/entitlement activation masih pending.",
        status: "partial",
        href: "/avatar-studio",
        action: "Open Avatar Studio",
      },
      {
        key: "sticker",
        title: "AI Sticker",
        description: "Catalog, ownership, entitlement reference, moderation dan asset reference sudah tersedia; acquisition/real asset activation masih pending.",
        status: "partial",
        href: "/avatar-studio",
        action: "Open Avatar Studio",
      },
      {
        key: "cosmetic",
        title: "AI Cosmetics",
        description: "Cosmetic catalog, ownership, equip slot, theme compatibility dan asset reference sudah tersedia; acquisition/real 3D activation masih pending.",
        status: "missing",
        action: "Not activated",
      },
      {
        key: "asset",
        title: "Real 3D Asset Activation",
        description: hasBinary
          ? "Signed binary 3D asset aktif untuk Theme ini."
          : "Theme masih menggunakan procedural fallback sampai GLB diverifikasi dan diaktifkan melalui Storage lifecycle.",
        status: hasBinary ? "ready" : "partial",
        action: hasBinary ? "Binary active" : "Upload GLB in Admin",
      },
      {
        key: "universe",
        title: "Living Universe",
        description: "Galaxy → World → District → Booth → Agent → Content → Portal → Live presentation.",
        href: "/universe",
        status: "partial",
        action: "Enter Universe",
      },
    ];
  }, [selected, scene, binaryUrl]);

  const readyCount = steps.filter((step) => step.status === "ready").length;
  const partialCount = steps.filter((step) => step.status === "partial").length;
  const missingCount = steps.filter((step) => step.status === "missing").length;

  return (
    <main className="min-h-screen bg-[#03050b] px-4 py-5 text-white sm:px-7 sm:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Allpha Theme Studio · Phase 18 Completion</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Theme → World → Living Universe</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Satu workflow untuk mengaktifkan Theme sebagai pengalaman Universe. Presentation layer tidak mengubah identity,
              ownership, capability, policy, consent, risk, approval, billing, atau audit.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Ready" value={readyCount} />
            <Metric label="Partial" value={partialCount} />
            <Metric label="Missing" value={missingCount} />
          </div>
        </header>

        {error && <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

        <section className="mt-7 grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Theme Catalog</h2>
                <p className="mt-1 text-[11px] text-slate-500">{loading ? "Loading…" : `${themes.length} platform themes`}</p>
              </div>
              <div className="flex flex-wrap gap-2"><a href="/theme-studio/generate" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-[10px] text-cyan-100">Generate Theme Package ↗</a><a href="/universe" className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-slate-300">Universe</a></div>
            </div>
            <div className="mt-4 space-y-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelected(theme)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === theme.id ? "border-cyan-300/60 bg-cyan-300/5" : "border-white/10 hover:border-white/20"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{theme.name}</span>
                    <span className="text-[9px] text-slate-600">#{theme.catalog_order}</span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{theme.category}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-violet-300">Selected Theme</p>
                  <h2 className="mt-1 text-2xl font-semibold">{selected?.name ?? "Loading…"}</h2>
                  <p className="mt-1 max-w-2xl text-xs text-slate-500">{selected?.description ?? ""}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <p>Version {selected?.theme_version ?? "—"}</p>
                  <p className="mt-1">{assetLoading ? "Checking asset manifest…" : binaryUrl ? "Verified binary 3D active" : "Procedural fallback"}</p>
                </div>
              </div>
              <div className="h-[460px]">
                {scene ? (
                  <AllphaWorldRenderer scene={scene} tokens={selected?.tokens} themePackUrl={binaryUrl} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No validated Theme Scene available.</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-white/10 p-4 text-[10px] text-slate-500">
                <span className="rounded-full border border-white/10 px-2.5 py-1">{manifest?.assets?.length ?? 0} verified assets</span>
                <span className={`rounded-full border px-2.5 py-1 ${binaryUrl ? "border-emerald-300/20 text-emerald-200" : "border-amber-300/20 text-amber-200"}`}>
                  {binaryUrl ? "REAL GLB ACTIVE" : "PROCEDURAL FALLBACK"}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">Server-authoritative</span>
              </div>
            </div>

            <TripoGenerationPanel />

            <ThemeSpatialSlice theme={selected} />

            <LiveExperienceVerticalSlice theme={selected} />

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Theme Activation Workflow</h2>
                  <p className="mt-1 text-xs text-slate-500">Ikuti dari atas ke bawah. Link membuka surface canonical yang sudah ada.</p>
                </div>
                <a href="/world-builder" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950">Open World Builder</a>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {steps.map((step, index) => (
                  <article key={step.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] text-slate-400">{index + 1}</span>
                      <span className={`rounded-full border px-2 py-1 text-[9px] tracking-wider ${step.status === "ready" ? "border-emerald-300/20 text-emerald-200" : step.status === "partial" ? "border-amber-300/20 text-amber-200" : "border-white/10 text-slate-500"}`}>{statusLabel[step.status]}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                    <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{step.description}</p>
                    {step.href ? (
                      <a href={step.href} className="mt-3 inline-flex rounded-lg border border-white/10 px-3 py-2 text-[10px] text-slate-300 hover:border-cyan-300/30 hover:text-cyan-200">{step.action} →</a>
                    ) : (
                      <span className="mt-3 inline-flex rounded-lg border border-white/5 px-3 py-2 text-[10px] text-slate-600">{step.action}</span>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[72px] rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
