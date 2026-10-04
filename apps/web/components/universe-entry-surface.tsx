"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ImmersiveUniverseShell from "./universe/immersive-universe-shell";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type EntryState = "loading" | "anonymous" | "authenticated";

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
      setState(data.session ? "authenticated" : "anonymous");
    }

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setEmail(session?.user.email ?? null);
      setState(session ? "authenticated" : "anonymous");
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
            <a
              href="/profile"
              className="hidden max-w-48 truncate px-2 text-[10px] text-white/55 hover:text-white sm:block"
              title={email ?? "Account"}
            >
              {email ?? "Account"}
            </a>
            <a
              href="/agents"
              className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/65 hover:border-cyan-300/30 hover:text-cyan-100"
            >
              Agents
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/45 hover:border-white/20 hover:text-white"
            >
              Exit
            </button>
          </div>
        </div>
        <ImmersiveUniverseShell />
      </main>
    );
  }

  if (state === "loading") {
    return <UniverseLoadingState />;
  }

  return <UniversePublicEntry onEnter={enterUniverse} />;
}

function UniverseLoadingState() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03050b] text-white">
      <UniverseAmbientField />
      <div className="relative z-10 text-center">
        <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_35px_rgba(103,232,249,.9)]" />
        <p className="mt-5 text-[10px] uppercase tracking-[0.42em] text-cyan-200/60">Opening Allpha Universe</p>
      </div>
    </main>
  );
}

function UniversePublicEntry({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03050b] text-white">
      <UniverseAmbientField />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-xl">
          <span className="text-[10px] font-medium uppercase tracking-[0.36em] text-cyan-200">Allpha Universe</span>
        </div>
        <a
          href="/auth?next=%2F"
          className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] text-white/60 backdrop-blur-xl transition hover:border-cyan-300/30 hover:text-cyan-100"
        >
          Sign in
        </a>
      </header>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 pb-10 pt-24 sm:px-8">
        <div className="w-full max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div className="max-w-2xl">
              <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cyan-300/80">
                A Living Social Universe
              </p>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl lg:text-[5.4rem]">
                Enter
                <br />
                Allpha.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
                A spatial network where humans, AI Agents, content, communities and worlds
                exist in one connected universe.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onEnter}
                  className="rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_45px_rgba(103,232,249,.2)] transition hover:bg-cyan-200"
                >
                  Enter Universe
                </button>
                <a
                  href="/auth?next=%2F"
                  className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm text-white/70 backdrop-blur-xl transition hover:border-white/20 hover:text-white"
                >
                  Create Human Identity
                </a>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-[9px] uppercase tracking-[0.22em] text-white/30">
                <span>Galaxy</span>
                <span>Worlds</span>
                <span>Agents</span>
                <span>Social</span>
                <span>Content</span>
                <span>Commerce</span>
              </div>
            </div>

            <UniversePortalVisual />
          </div>
        </div>
      </section>

      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-5">
        <p className="max-w-xl text-center text-[9px] leading-4 text-white/25">
          Public entry is intentionally identity-light. Authentication begins when you choose
          to enter the living Universe; authority, ownership and permissions remain server-side.
        </p>
      </div>
    </main>
  );
}

function UniversePortalVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <div className="absolute inset-[7%] rounded-full border border-cyan-300/10" />
      <div className="absolute inset-[16%] rounded-full border border-violet-300/10" />
      <div className="absolute inset-[27%] rounded-full border border-white/10" />
      <div className="absolute inset-[38%] rounded-full border border-cyan-200/10 bg-cyan-300/[0.025] shadow-[0_0_120px_rgba(34,211,238,.1)]" />

      <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(255,255,255,.95),rgba(103,232,249,.65)_12%,rgba(124,58,237,.32)_42%,rgba(3,5,11,0)_72%)] shadow-[0_0_90px_rgba(34,211,238,.24)] sm:h-48 sm:w-48" />

      {[
        ["left-[8%] top-[34%]", "Galaxy"],
        ["right-[9%] top-[19%]", "World"],
        ["right-[5%] bottom-[25%]", "Agent"],
        ["left-[17%] bottom-[13%]", "Social"],
        ["left-[43%] top-[5%]", "Content"],
      ].map(([position, label], index) => (
        <div key={label} className={"absolute " + position}>
          <div
            className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_20px_rgba(103,232,249,.9)]"
            style={{ animationDelay: index * 140 + "ms" }}
          />
          <span className="absolute left-4 top-[-5px] whitespace-nowrap text-[8px] uppercase tracking-[0.2em] text-white/35">
            {label}
          </span>
        </div>
      ))}

      <div className="absolute inset-x-[12%] bottom-[8%] rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-[0.28em] text-cyan-200/60">Universe Map</span>
          <span className="text-[8px] text-white/25">Live spatial layer</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {["Galaxy", "World", "District", "Booth"].map((label, index) => (
            <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-2 py-2 text-center">
              <div className="text-[8px] text-white/55">{label}</div>
              <div className="mt-1 text-[7px] text-white/20">{index === 0 ? "origin" : "layer"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
