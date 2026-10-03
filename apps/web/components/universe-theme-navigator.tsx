"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { normalizeWorldScene, type WorldScene } from "../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(() => import("./world/allpha-world-renderer"), {
  ssr: false,
  loading: () => <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/10 bg-black text-sm text-slate-400">Preparing renderer…</div>,
});

type Theme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  catalog_key?: string | null;
  catalog_order?: number | null;
  tokens?: Record<string, unknown>;
  world_schema?: unknown;
  performance_budget?: Record<string, unknown>;
  accessibility_constraints?: Record<string, unknown>;
  theme_version_id?: string | null;
  theme_version?: number | null;
  world_template_id?: string | null;
  world_template_version_id?: string | null;
};

type Mode = "2d" | "2.5d" | "3d";

type AssetManifest = {
  assets?: Array<{ asset_type?: string; status?: string; signed_url?: string | null }>;
  binary_3d_assets?: Array<{ signed_url?: string | null }>;
  has_binary_3d_pack?: boolean;
};

export default function UniverseThemeNavigator() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selected, setSelected] = useState<Theme | null>(null);
  const [mode, setMode] = useState<Mode>("2d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetCount, setAssetCount] = useState<number | null>(null);
  const [themePackUrl, setThemePackUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<{ data: Theme[] }>("/api/v1/themes/world-runtime/catalog");
        if (cancelled) return;
        const rows = Array.isArray(result.data) ? result.data : [];
        setThemes(rows);
        setSelected((current) => current ?? rows[0] ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "THEME_CATALOG_LOAD_FAILED");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAssetCount(null);
    setThemePackUrl(null);
    if (!selected?.id) return () => { cancelled = true; };

    void (async () => {
      try {
        const result = await apiFetch<{ data?: AssetManifest }>(
          `/api/v1/themes/world-runtime/themes/${selected.id}/asset-manifest`,
        );
        if (cancelled) return;
        const data = result.data;
        setAssetCount(Array.isArray(data?.assets) ? data.assets.length : 0);
        const binary = data?.binary_3d_assets?.find((asset) => typeof asset.signed_url === "string");
        setThemePackUrl(binary?.signed_url ?? null);
      } catch {
        if (!cancelled) {
          setAssetCount(null);
          setThemePackUrl(null);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [selected?.id]);

  const scene = useMemo<WorldScene | null>(
    () => (selected ? normalizeWorldScene(selected.world_schema) : null),
    [selected],
  );

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-violet-300">Universe Navigator</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Explore Allpha Worlds visually</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              The canonical World Renderer consumes the published Theme/World schema and verified 3D assets when available.
              Presentation never changes authority, ownership or permissions.
            </p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-black/20 p-1" role="group" aria-label="Universe presentation mode">
            {(["2d", "2.5d", "3d"] as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={
                  mode === value
                    ? "rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-950"
                    : "rounded-lg px-3 py-2 text-xs text-slate-500 hover:text-white"
                }
              >
                {value === "2.5d" ? "2.5D" : value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-slate-500">Loading the authoritative Theme catalog…</div>
      ) : error ? (
        <div className="p-6 text-sm text-red-200">{error}</div>
      ) : themes.length === 0 ? (
        <div className="p-6 text-sm text-slate-500">No published platform Theme is available.</div>
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto border-b border-white/10 p-4" aria-label="Published Universe themes">
            {themes.map((theme) => {
              const active = selected?.id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelected(theme)}
                  className={
                    active
                      ? "min-w-[180px] rounded-2xl border border-cyan-300/60 bg-cyan-300/10 p-4 text-left"
                      : "min-w-[180px] rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left hover:border-white/20"
                  }
                  aria-pressed={active}
                >
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    #{String(theme.catalog_order ?? 0).padStart(2, "0")}
                  </span>
                  <span className="mt-2 block text-sm font-medium text-white">{theme.name}</span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">{theme.category ?? "Universe"}</span>
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
              <ThemeStage scene={scene} theme={selected} mode={mode} themePackUrl={themePackUrl} />
              <aside className="border-t border-white/10 p-5 lg:border-l lg:border-t-0 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">Selected Theme</p>
                <h3 className="mt-2 text-xl font-semibold">{selected.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {selected.description || "Published platform World Theme."}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Catalog" value={`#${selected.catalog_order ?? "—"}`} />
                  <Stat label="Version" value={String(selected.theme_version ?? "—")} />
                  <Stat label="3D assets" value={assetCount === null ? "—" : String(assetCount)} />
                  <Stat label="Binary pack" value={themePackUrl ? "Verified" : "Pending"} />
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Runtime contract</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {mode === "3d"
                      ? themePackUrl
                        ? "The published 3D asset is delivered through the authoritative signed Storage manifest."
                        : "The canonical renderer uses the validated World schema procedurally until a verified binary 3D asset is published."
                      : mode === "2.5d"
                        ? "Spatial depth is progressive presentation over the same World schema."
                        : "2D is the accessible baseline and does not require WebGL."}
                  </p>
                </div>
                <p className="mt-4 text-[10px] text-slate-600">{themes.length} published platform themes</p>
              </aside>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function ThemeStage({
  scene,
  theme,
  mode,
  themePackUrl,
}: {
  scene: WorldScene | null;
  theme: Theme;
  mode: Mode;
  themePackUrl: string | null;
}) {
  if (!scene) {
    return <div className="flex min-h-[420px] items-center justify-center bg-black/30 p-8 text-center text-sm text-amber-200">SCENE_INVALID — canonical renderer refused this Theme/World configuration.</div>;
  }

  return (
    <div className="relative min-h-[420px] bg-black sm:min-h-[520px]" aria-label={`${theme.name} ${mode} preview`}>
      {mode === "2d" ? (
        <div className="flex min-h-[420px] flex-col justify-between bg-[var(--allpha-space)] p-6 sm:min-h-[520px] sm:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">World Schema</p>
            <h3 className="mt-2 text-2xl font-semibold">{theme.name}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {theme.world_schema ? "Validated Scene Schema ready for spatial enhancement." : "No validated Scene Schema available."}
            </p>
          </div>
          <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {scene.zones.map((zone) => (
              <div key={zone.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Zone</p>
                <p className="mt-1 text-sm text-white">{zone.id}</p>
                <p className="mt-1 text-xs text-slate-500">{zone.type ?? "world zone"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AllphaWorldRenderer
          scene={scene}
          tokens={theme.tokens}
          lowPower={mode === "2.5d"}
          themePackUrl={themePackUrl}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className="mt-1 truncate text-xs text-slate-300">{value}</p>
    </div>
  );
}
