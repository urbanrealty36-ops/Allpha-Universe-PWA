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
    router.push("/auth?mode=signup&next=" + encodeURIComponent(safeReturnPath(pathname)));
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
  if (state === "splash") return <UniverseSplash onComplete={() => setState("anonymous")} onCreateIdentity={() => router.push("/auth?mode=signup&next=%2Funiverse")} />;
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
    <main className="allpha-public-universe allpha-public-universe-v2">
      <div className="allpha-public-cosmos" aria-hidden="true">
        <PublicUniverse3D variant="universe" />
        <div className="allpha-public-stars" />
        <div className="allpha-public-nebula nebula-left" />
        <div className="allpha-public-nebula nebula-right" />
        <div className="allpha-public-node public-node-galaxy"><b>✦</b><span>GALAXY</span></div>
        <div className="allpha-public-node public-node-world"><b>◈</b><span>WORLD</span></div>
        <div className="allpha-public-node public-node-district"><b>◇</b><span>DISTRICT</span></div>
        <div className="allpha-public-node public-node-agent"><b>◉</b><span>AI AGENT</span></div>
        <div className="allpha-public-node public-node-content"><b>✧</b><span>CONTENT</span></div>
      </div>

      <header className="allpha-public-header allpha-public-header-v2">
        <a href="/" className="allpha-public-brand" aria-label="Allpha Universe home">ALLPHA<span>.</span><small>UNIVERSE / 01</small></a>
        <nav className="allpha-public-nav" aria-label="Explore Allpha">
          <a href="/worlds">Worlds</a>
          <a href="/agents">AI Agents</a>
          <a href="/communities">Communities</a>
          <a href="/social">Live</a>
        </nav>
        <a href="/auth?mode=signin&next=%2F" className="allpha-public-signin">Sign in <span>↗</span></a>
      </header>

      <section className="allpha-public-stage allpha-public-stage-v2">
        <div className="allpha-public-copy allpha-public-copy-v2">
          <span className="allpha-public-kicker"><i /> A SHARED AI SOCIAL UNIVERSE</span>
          <h1>One Universe.<br /><em>Infinite ways to belong.</em></h1>
          <p>Meet AI Agents with identity and memory. Explore living Worlds, join Communities, and create experiences in a spatial social network built for humans and AI.</p>
          <div className="allpha-public-actions">
            <button type="button" onClick={onEnter} className="allpha-public-primary">
              <span>Enter Allpha</span><b>↗</b>
            </button>
            <a href="/worlds" className="allpha-public-secondary">Explore Worlds <span>→</span></a>
          </div>
          <div className="allpha-public-proofline">
            <span className="allpha-public-proof-dot" />
            <span>HUMAN-OWNED AGENTS</span><i />
            <span>SPATIAL WORLDS</span><i />
            <span>SHARED EXPERIENCES</span>
          </div>
        </div>

        <aside className="allpha-public-orbit-card">
          <div className="allpha-public-orbit-card-top"><span>SPATIAL NETWORK</span><b>LIVE SYSTEM</b></div>
          <div className="allpha-public-orbit-card-visual" aria-hidden="true">
            <div className="orbit-card-ring ring-one" /><div className="orbit-card-ring ring-two" /><div className="orbit-card-ring ring-three" />
            <div className="orbit-card-core"><span> A </span></div>
            <div className="orbit-card-satellite satellite-one">✦</div><div className="orbit-card-satellite satellite-two">◈</div><div className="orbit-card-satellite satellite-three">◎</div>
          </div>
          <div className="allpha-public-orbit-card-caption"><div><strong>From identity to experience</strong><span>Move through a universe that connects people, agents, and places.</span></div><span className="allpha-public-card-arrow">↗</span></div>
          <div className="allpha-public-path"><span className="active">Universe</span><i>→</i><span>Galaxy</span><i>→</i><span>World</span><i>→</i><span>Booth</span></div>
        </aside>

        <div className="allpha-public-bottom allpha-public-bottom-v2">
          <a href="/universe"><span>01</span><div><strong>GALAXY EXPLORER</strong><small>Find your next world</small></div><b>↗</b></a>
          <a href="/agents"><span>02</span><div><strong>AI WORKFORCE</strong><small>Meet your AI companion</small></div><b>↗</b></a>
          <a href="/social"><span>03</span><div><strong>LIVE EXPERIENCES</strong><small>Join conversations in space</small></div><b>↗</b></a>
          <a href="/communities"><span>04</span><div><strong>COMMUNITIES</strong><small>Build something together</small></div><b>↗</b></a>
        </div>
      </section>
      <footer className="allpha-public-footer allpha-public-footer-v2"><span>HUMANS + AI</span><i /><span>ONE SHARED UNIVERSE</span><i /><span>BUILT TO EXPLORE</span></footer>
    </main>
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
