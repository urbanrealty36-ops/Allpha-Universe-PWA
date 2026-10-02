"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { apiFetch } from "../lib/api";

type Theme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  catalog_key?: string | null;
  catalog_order?: number | null;
  tokens?: Record<string, unknown>;
  world_schema?: {
    zones?: Array<{ id: string; type?: string; capacity?: number }>;
    camera?: { fov?: number; max_distance?: number; min_distance?: number };
    environment?: { biome?: string; architecture?: string; weather?: string };
    renderer?: string;
    lighting?: Record<string, unknown>;
    atmosphere?: Record<string, unknown>;
    characters?: Array<{ id: string; name?: string; role?: string; presentation_only?: boolean }>;
    interaction_points?: Array<{ id: string; zone?: string; interaction?: string }>;
  } | null;
  performance_budget?: Record<string, unknown>;
  accessibility_constraints?: Record<string, unknown>;
  theme_version_id?: string | null;
  theme_version?: number | null;
  world_template_id?: string | null;
  world_template_version_id?: string | null;
};

type Mode = "2d" | "2.5d" | "3d";

function tokenString(tokens: Record<string, unknown> | undefined, key: string, fallback: string) {
  const value = tokens?.[key];
  return typeof value === "string" ? value : fallback;
}

function normalizeHex(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function hexToRgb(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function tint(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export default function UniverseThemeNavigator() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selected, setSelected] = useState<Theme | null>(null);
  const [mode, setMode] = useState<Mode>("2d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
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
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIndex = selected?.catalog_order ?? 1;
  const progress = themes.length ? `${themes.length} platform themes` : "No published platform themes";

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-violet-300">Universe Navigator</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Explore Allpha Worlds visually</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Real published platform Theme schemas drive the presentation. 3D is progressive enhancement; authority,
              ownership and permissions remain server-side.
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
              const primary = normalizeHex(
                tokenString(theme.tokens, "theme.color.primary", "#7C3AED"),
                "#7C3AED",
              );
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelected(theme)}
                  className={
                    active
                      ? "min-w-[180px] rounded-2xl border p-4 text-left"
                      : "min-w-[180px] rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left hover:border-white/20"
                  }
                  style={active ? { borderColor: primary, background: `${primary}18` } : undefined}
                  aria-pressed={active}
                >
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    #{String(theme.catalog_order ?? 0).padStart(2, "0")}
                  </span>
                  <span className="mt-2 block text-sm font-medium text-white">{theme.name}</span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">
                    {theme.world_schema?.environment?.biome ?? theme.category ?? "Universe"}
                  </span>
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
              <ThemeStage theme={selected} mode={mode} />
              <aside className="border-t border-white/10 p-5 lg:border-l lg:border-t-0 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">Selected Theme</p>
                <h3 className="mt-2 text-xl font-semibold">{selected.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {selected.description || selected.world_schema?.environment?.architecture || "Published platform World Theme."}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Catalog" value={`#${selectedIndex}`} />
                  <Stat label="Version" value={String(selected.theme_version ?? "—")} />
                  <Stat label="Zones" value={String(selected.world_schema?.zones?.length ?? 0)} />
                  <Stat label="Characters" value={String(selected.world_schema?.characters?.length ?? 0)} />
                  <Stat label="Interactions" value={String(selected.world_schema?.interaction_points?.length ?? 0)} />
                  <Stat label="Renderer" value={selected.world_schema?.renderer ?? "—"} />
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Runtime contract</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {mode === "3d"
                      ? "Procedural 3D preview uses the published Scene/World schema. Binary 3D asset manifests remain empty until real assets are published."
                      : mode === "2.5d"
                        ? "Depth presentation is derived from the published World schema without changing domain authority."
                        : "2D presentation is the accessible baseline and does not require WebGL."}
                  </p>
                </div>
                <p className="mt-4 text-[10px] text-slate-600">{progress}</p>
              </aside>
            </div>
          ) : null}
        </>
      )}
    </section>
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

function ThemeStage({ theme, mode }: { theme: Theme; mode: Mode }) {
  const primary = normalizeHex(tokenString(theme.tokens, "theme.color.primary", "#7C3AED"), "#7C3AED");
  const secondary = normalizeHex(tokenString(theme.tokens, "theme.color.secondary", "#0EA5E9"), "#0EA5E9");
  const accent = normalizeHex(tokenString(theme.tokens, "theme.color.accent", "#F43F5E"), "#F43F5E");
  const zones = theme.world_schema?.zones ?? [];
  const environment = theme.world_schema?.environment;

  if (mode === "3d") {
    return (
      <div className="h-[420px] min-h-[360px] bg-black sm:h-[520px]" aria-label={`${theme.name} 3D preview`}>
        <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <PerspectiveCamera makeDefault fov={theme.world_schema?.camera?.fov ?? 58} position={[7, 6, 9]} />
          <color attach="background" args={["#05050a"]} />
          <fog attach="fog" args={["#05050a", 10, 24]} />
          <ambientLight intensity={0.8} color={secondary} />
          <directionalLight position={[5, 10, 4]} intensity={2.2} color={primary} />
          <pointLight position={[-5, 4, 2]} intensity={18} distance={18} color={accent} />
          <Suspense fallback={null}>
            <ProceduralWorld theme={theme} primary={primary} secondary={secondary} accent={accent} />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={theme.world_schema?.camera?.min_distance ?? 2.5} maxDistance={theme.world_schema?.camera?.max_distance ?? 18} />
        </Canvas>
      </div>
    );
  }

  return (
    <div
      className={mode === "2.5d" ? "relative h-[420px] overflow-hidden sm:h-[520px]" : "relative h-[420px] overflow-hidden sm:h-[520px]"}
      style={{
        background: `radial-gradient(circle at 50% 20%, ${secondary}55, transparent 45%), linear-gradient(145deg, ${primary}, #070711 68%, ${accent}66)`,
      }}
    >
      <div className={mode === "2.5d" ? "absolute inset-10 rotate-x-[38deg] rotate-z-[-2deg] rounded-[3rem] border border-white/20 shadow-2xl" : "absolute inset-8 rounded-[3rem] border border-white/15"}>
        <div className="absolute inset-0 bg-black/15" />
        {zones.map((zone, index) => (
          <div
            key={zone.id}
            className="absolute rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur"
            style={{
              left: `${18 + (index % 2) * 42}%`,
              top: `${18 + Math.floor(index / 2) * 30}%`,
              transform: mode === "2.5d" ? `translateZ(${index * 12}px)` : undefined,
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">{zone.type ?? "zone"}</p>
            <p className="mt-1 text-xs font-medium text-white">{zone.id}</p>
            <p className="mt-1 text-[10px] text-white/50">{zone.capacity ?? 0} capacity</p>
          </div>
        ))}
        <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/70">
          {environment?.biome ?? "Universe"} · {environment?.architecture ?? theme.name}
        </div>
      </div>
    </div>
  );
}

function ProceduralWorld({
  theme,
  primary,
  secondary,
  accent,
}: {
  theme: Theme;
  primary: string;
  secondary: string;
  accent: string;
}) {
  const zones = theme.world_schema?.zones ?? [];
  const seed = theme.catalog_order ?? 1;
  const positions = useMemo(
    () =>
      zones.map((_, index) => {
        const angle = (index / Math.max(zones.length, 1)) * Math.PI * 2 + seed * 0.35;
        const radius = 2.4 + (index % 2) * 0.8;
        return [Math.cos(angle) * radius, 0.55, Math.sin(angle) * radius] as [number, number, number];
      }),
    [zones, seed],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color={tint(primary, 0.72)} metalness={0.15} roughness={0.82} />
      </mesh>

      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.45, 1.9, 8]} />
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.22} metalness={0.45} roughness={0.32} />
      </mesh>

      <mesh position={[0, 2.3, 0]} castShadow>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.65} metalness={0.2} roughness={0.22} />
      </mesh>

      {positions.map((position, index) => (
        <group key={zones[index]?.id ?? index} position={position}>
          <mesh castShadow>
            <boxGeometry args={[1.3 + (index % 2) * 0.35, 1.1 + (index % 3) * 0.45, 1.3]} />
            <meshStandardMaterial
              color={index % 2 ? secondary : primary}
              emissive={index % 2 ? secondary : primary}
              emissiveIntensity={0.1}
              metalness={0.25}
              roughness={0.55}
            />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <coneGeometry args={[0.55, 0.8, 6]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.0, 2.08, 64]} />
        <meshBasicMaterial color={secondary} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
