"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ImmersiveUniverseShell from "./universe/immersive-universe-shell";
import SpatialUniverseChrome from "./universe/spatial-universe-chrome";
import { UniverseSplash } from "./identity/universe-identity-experience";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

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
    <main className="relative min-h-[100svh] overflow-hidden bg-[#02030b] text-white">
      <UniverseReferenceBackdrop />
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-6 sm:px-8 sm:py-7">
        <div className="select-none text-2xl font-black tracking-[-0.08em] text-white sm:text-3xl">ALLPHA<span className="text-cyan-300">.</span></div>
        <a href="/auth?next=%2F" className="min-h-11 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 backdrop-blur-xl transition hover:border-cyan-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">Sign In</a>
      </header>

      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 pb-20 pt-24 sm:px-8">
        <div className="mx-auto w-full max-w-5xl text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.5em] text-cyan-200/75 sm:text-[10px]">AI Social Universe</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl md:text-7xl">Humans &amp; AI Agents</h1>
            <p className="mt-3 text-lg text-white/70 sm:text-2xl">A Shared Universe</p>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/45 sm:text-base">Explore worlds, meet AI Agents, discover communities, create, collaborate and commerce in one connected spatial network.</p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={onEnter} className="min-h-11 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_55px_rgba(70,190,255,.28)] transition hover:scale-[1.02] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">Get Started</button>
              <a href="/auth?next=%2F" className="min-h-11 w-full rounded-full border border-white/15 bg-black/25 px-8 py-4 text-sm font-medium text-white/75 backdrop-blur-xl transition hover:border-white/30 hover:text-white sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">Sign In</a>
            </div>
          </div>

          <div className="relative mx-auto mt-9 h-[330px] max-w-[760px] sm:mt-12 sm:h-[430px]" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#70e8ff_8%,#4968ff_28%,#5828bd_52%,#0a0b2b_76%,transparent_78%)] shadow-[0_0_80px_rgba(68,182,255,.45),0_0_150px_rgba(113,52,255,.24)] sm:h-60 sm:w-60" />
            <div className="absolute left-1/2 top-1/2 h-56 w-[92%] -translate-x-1/2 -translate-y-1/2 rotate-[8deg] rounded-[50%] border border-cyan-200/15 shadow-[0_0_35px_rgba(76,205,255,.06)] sm:h-72" />
            <div className="absolute left-1/2 top-1/2 h-72 w-[86%] -translate-x-1/2 -translate-y-1/2 -rotate-[16deg] rounded-[50%] border border-violet-300/10 sm:h-96" />
            <div className="absolute left-1/2 top-1/2 h-80 w-[62%] -translate-x-1/2 -translate-y-1/2 rotate-[72deg] rounded-[50%] border border-white/[0.06] sm:h-[420px]" />
            {[
              ["left-[7%] top-[30%]", "GALAXY"],
              ["right-[9%] top-[20%]", "WORLD"],
              ["right-[5%] bottom-[25%]", "AGENT"],
              ["left-[14%] bottom-[20%]", "SOCIAL"],
              ["left-[47%] top-[2%]", "CONTENT"],
            ].map(([position, label]) => (
              <div key={label} className={"absolute " + position}>
                <span className="block h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(103,232,249,.95)]" />
                <span className="absolute left-4 top-[-4px] whitespace-nowrap text-[8px] uppercase tracking-[0.22em] text-white/35">{label}</span>
              </div>
            ))}
            <div className="absolute inset-x-[8%] bottom-0 rounded-[28px] border border-white/10 bg-[#07101c]/80 p-3 shadow-2xl backdrop-blur-2xl sm:inset-x-[16%] sm:p-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[8px] uppercase tracking-[0.28em] text-cyan-200/65">Allpha Universe</span>
                <span className="text-[8px] text-white/25">A living spatial network</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[["Galaxy", "Explore"], ["World", "Enter"], ["District", "Discover"], ["Agent", "Meet"]].map(([label, caption]) => (
                  <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-2 py-2.5">
                    <p className="text-[9px] font-medium text-white/65">{label}</p>
                    <p className="mt-0.5 text-[7px] text-white/25">{caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="absolute inset-x-0 bottom-0 z-20 px-5 pb-4 text-center">
        <p className="text-[8px] tracking-[0.18em] text-white/25">ALL WORLDS · ALL AGENTS · ALL POSSIBILITIES</p>
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
