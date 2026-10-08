"use client";

import { useEffect, useState } from "react";
import PublicUniverse3D from "./public-universe-3d";
import { publicApiFetch } from "../lib/api";

type PublicTheme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  catalog_key?: string | null;
  theme_version?: number | null;
};

export default function PublicWorldsGallery() {
  const [themes, setThemes] = useState<PublicTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await publicApiFetch<{ data: PublicTheme[] }>(
        "/api/v1/themes/world-runtime/catalog",
      );
      setThemes(Array.isArray(response.data) ? response.data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PUBLIC_THEME_CATALOG_UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#02040d] text-white">
      <div className="absolute inset-0">
        <PublicUniverse3D variant="universe" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,transparent_0_24%,rgba(2,4,13,.18)_46%,rgba(2,4,13,.82)_100%),linear-gradient(180deg,rgba(2,4,13,.3),rgba(2,4,13,.92))]" />
      </div>

      <header className="relative z-20 flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#02040d]/55 px-4 py-4 backdrop-blur-2xl sm:px-8">
        <a href="/" className="text-xl font-black tracking-[-0.08em] text-white">
          ALLPHA<span className="text-cyan-300">.</span>
          <small className="ml-2 text-[7px] font-bold tracking-[0.28em] text-cyan-100/45">UNIVERSE</small>
        </a>
        <nav className="hidden items-center gap-2 sm:flex" aria-label="Public navigation">
          <a href="/" className="rounded-full border border-white/10 px-4 py-2 text-[10px] text-white/55 hover:border-cyan-200/25 hover:text-white">Universe</a>
          <a href="/worlds" className="rounded-full border border-cyan-200/20 bg-cyan-300/[0.07] px-4 py-2 text-[10px] text-cyan-50">Worlds</a>
          <a href="/auth?mode=signup&next=%2F" className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold text-slate-950">Create Identity</a>
        </nav>
        <a href="/auth?mode=signin&next=%2F" className="rounded-full border border-white/10 px-4 py-2 text-[10px] text-white/55 sm:hidden">Sign In</a>
      </header>

      <section className="relative z-10 mx-auto max-w-[1500px] px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="max-w-3xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-cyan-200/70">Public Universe Gateway</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Explore the <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">World layer.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/48">
            Browse published Allpha Theme V2 environments before creating an identity. This public surface reads the canonical theme catalog; it never fabricates Worlds or bypasses the backend authority boundary.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="/auth?mode=signup&next=%2Funiverse" className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-[0_16px_60px_rgba(34,211,238,.18)]">
              Enter the Universe →
            </a>
            <a href="/" className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-xs text-white/65 backdrop-blur-xl">
              Back to Splash
            </a>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-amber-200/15 bg-amber-300/[0.05] p-4 text-xs text-amber-100/70">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="ml-3 underline">Retry</button>
          </div>
        ) : null}

        <section className="mt-10" aria-labelledby="published-world-themes">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[8px] uppercase tracking-[0.28em] text-violet-200/55">Published Theme Catalog</p>
              <h2 id="published-world-themes" className="mt-2 text-2xl font-semibold">World environments</h2>
            </div>
            <span className="text-[9px] text-white/30">{loading ? "Loading…" : themes.length + " published themes"}</span>
          </div>

          {loading ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-[26px] border border-white/10 bg-white/[0.025]" />
              ))}
            </div>
          ) : themes.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {themes.map((theme) => (
                <article key={theme.id} className="group rounded-[26px] border border-white/10 bg-[#030712]/62 p-5 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200/25">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-cyan-200/10 bg-cyan-300/[0.05] px-2.5 py-1 text-[7px] uppercase tracking-[0.16em] text-cyan-100/65">
                      {theme.category ?? "World"}
                    </span>
                    <span className="text-[8px] text-white/25">V2</span>
                  </div>
                  <div className="mt-7">
                    <h3 className="text-lg font-semibold tracking-tight">{theme.name}</h3>
                    <p className="mt-2 line-clamp-3 text-[10px] leading-5 text-white/35">
                      {theme.description ?? "Published Allpha spatial environment."}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <span className="text-[8px] uppercase tracking-[0.16em] text-white/25">{theme.catalog_key ?? theme.slug}</span>
                    <a href="/auth?mode=signup&next=%2Funiverse" className="rounded-full border border-white/10 px-3 py-2 text-[9px] text-white/55 group-hover:border-cyan-200/20 group-hover:text-cyan-50">
                      Enter
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[26px] border border-dashed border-white/10 bg-black/20 p-8 text-sm text-white/35">
              No published Theme V2 environments are currently available. The public surface does not create synthetic records.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
