"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ImmersiveUniverseShell from "./universe/immersive-universe-shell";
import SpatialUniverseChrome from "./universe/spatial-universe-chrome";
import { UniverseSplash } from "./identity/universe-identity-experience";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import PublicUniverse3D from "./public-universe-3d";

type EntryState = "loading" | "splash" | "anonymous" | "authenticated";

function safeReturnPath(pathname: string) {
  return pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
}

export default function UniverseEntrySurface() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [state, setState] = useState<EntryState>("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      setEmail(data.session?.user.email ?? null);

      if (data.session) {
        setState("authenticated");
        return;
      }

      setState("splash");
    }

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setEmail(session?.user.email ?? null);
      if (session) setState("authenticated");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  function enterUniverse() {
    router.push("/auth?next=" + encodeURIComponent(safeReturnPath(pathname)));
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    setState("anonymous");
    router.refresh();
  }

  if (state === "authenticated") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#03050b] text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex justify-end p-3 sm:p-5">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
            <a href="/profile" className="hidden max-w-48 truncate px-2 text-[10px] text-white/55 hover:text-white" title={email ?? "Account"}>
              {email ?? "Account"}
            </a>
            <a href="/agents" className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/65 hover:border-cyan-300/30 hover:text-cyan-100">
              Agents
            </a>
            <button type="button" onClick={() => void signOut()} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/45 hover:border-white/20 hover:text-white">
              Exit
            </button>
          </div>
        </div>
        <div className="relative min-h-[100svh] overflow-hidden bg-[#03050b] text-white">
          <ImmersiveUniverseShell />
          <SpatialUniverseChrome email={email} onSignOut={() => void signOut()} />
        </div>
      </main>
    );
  }

  if (state === "loading") return <UniverseLoadingState />;
  if (state === "splash") return <UniverseSplash onComplete={() => setState("anonymous")} />;
  return <UniversePublicEntry onEnter={enterUniverse} />;
}

function UniverseLoadingState() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#03050b] text-white">
      <UniverseAmbientField />
      <div className="relative z-10 text-center">
        <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_35px_rgba(103,232,249,.9)]" aria-hidden="true" />
        <p className="mt-5 text-[10px] uppercase tracking-[0.42em] text-cyan-200/60">Checking your Allpha identity</p>
      </div>
    </main>
  );
}

function UniversePublicEntry({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="allpha-public-universe">
      <div className="allpha-public-cosmos" aria-hidden="true"><PublicUniverse3D variant="universe"/>
        <div className="allpha-public-stars" />
        <div className="allpha-public-nebula nebula-left" />
        <div className="allpha-public-nebula nebula-right" />
        {/* Theme V2 owns the spatial 3D scene. CSS orbit/core placeholders are intentionally removed. */}
        <div className="allpha-public-node public-node-galaxy"><b>✦</b><span>GALAXY</span></div>
        <div className="allpha-public-node public-node-world"><b>◈</b><span>WORLD</span></div>
        <div className="allpha-public-node public-node-district"><b>◇</b><span>DISTRICT</span></div>
        <div className="allpha-public-node public-node-agent"><b>◉</b><span>AI AGENT</span></div>
        <div className="allpha-public-node public-node-content"><b>✧</b><span>CONTENT</span></div>
      </div>

      <header className="allpha-public-header">
        <div className="allpha-public-brand">ALLPHA<span>.</span><small>UNIVERSE</small></div>
        <div className="allpha-public-status"><i /> SPATIAL NETWORK · ONLINE</div>
        <a href="/auth?next=%2F" className="allpha-public-signin">Sign In</a>
      </header>

      <section className="allpha-public-stage">
        <div className="allpha-public-copy">
          <span className="allpha-public-kicker"><i /> A SHARED AI SOCIAL UNIVERSE</span>
          <h1>Enter the<br /><em>Universe.</em></h1>
          <p>Explore worlds, meet AI Agents, discover communities and move through a living spatial network.</p>
          <div className="allpha-public-actions">
            <button type="button" onClick={onEnter} className="allpha-public-primary">
              <span>Get Started</span><b>↗</b>
            </button>
            <a href="/auth?next=%2F" className="allpha-public-secondary">Sign In <span>→</span></a>
          </div>
        </div>

        <div className="allpha-public-orbit-label">
          <span>YOU ARE APPROACHING</span>
          <strong>ALLPHA UNIVERSE</strong>
          <small>GALAXY · WORLD · DISTRICT · AGENT</small>
        </div>

        <div className="allpha-public-bottom">
          <div><span>01</span><strong>GALAXIES</strong><small>Discover worlds</small></div>
          <div><span>02</span><strong>AI AGENTS</strong><small>Meet intelligence</small></div>
          <div><span>03</span><strong>EXPERIENCES</strong><small>Live & spatial</small></div>
          <div><span>04</span><strong>COMMUNITIES</strong><small>Connect & collaborate</small></div>
        </div>
      </section>

      <footer className="allpha-public-footer">
        <span>ALL WORLDS</span><i /> <span>ALL AGENTS</span><i /> <span>ALL POSSIBILITIES</span>
      </footer>
    </main>
  );
}

function UniverseReferenceBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(76,89,255,.18),transparent_22%),radial-gradient(circle_at_18%_35%,rgba(0,208,255,.12),transparent_25%),radial-gradient(circle_at_84%_18%,rgba(137,67,255,.13),transparent_28%),linear-gradient(180deg,#030718_0%,#02030b_72%,#010207_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,.9)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_18%,rgba(255,255,255,.8)_0_1px,transparent_1.5px),radial-gradient(circle_at_85%_65%,rgba(255,255,255,.75)_0_1px,transparent_1.5px),radial-gradient(circle_at_35%_78%,rgba(255,255,255,.65)_0_1px,transparent_1.5px)] [background-size:190px_170px,240px_210px,210px_190px,260px_230px]" />
      <div className="pointer-events-none absolute left-1/2 top-[55%] h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.035] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
    </>
  );
}

function UniverseAmbientField() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(124,58,237,.16),transparent_26%),radial-gradient(circle_at_75%_22%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_18%_80%,rgba(59,130,246,.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[55vw] w-[55vw] max-h-[720px] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035] shadow-[0_0_180px_rgba(124,58,237,.08)]" />
    </>
  );
}
