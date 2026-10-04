"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export type UniverseIdentityMode = "signin" | "signup";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function UniverseSplash({ onComplete }: { onComplete: () => void }) {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#02030b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(69,115,255,.22),transparent_20%),radial-gradient(circle_at_18%_30%,rgba(0,214,255,.12),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(137,67,255,.14),transparent_28%),linear-gradient(180deg,#03091b_0%,#02030b_75%,#010207_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,.9)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_18%,rgba(255,255,255,.75)_0_1px,transparent_1.5px),radial-gradient(circle_at_82%_72%,rgba(255,255,255,.7)_0_1px,transparent_1.5px)] [background-size:190px_170px,230px_210px,210px_190px]" />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 text-center">
        <div className="relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
          <div className="absolute inset-[16%] rounded-full border border-cyan-200/20 shadow-[0_0_80px_rgba(34,211,238,.12)]" />
          <div className="absolute inset-[7%] rounded-full border border-violet-300/10 [transform:rotate(25deg)_scaleX(.72)]" />
          <div className="absolute inset-[2%] rounded-full border border-white/[0.05] [transform:rotate(-32deg)_scaleX(.58)]" />
          <div className="h-24 w-24 rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#70e8ff_10%,#536dff_30%,#5b2bc0_54%,#070b27_76%,transparent_78%)] shadow-[0_0_90px_rgba(68,182,255,.5),0_0_150px_rgba(113,52,255,.2)] sm:h-32 sm:w-32" />
          <span className="absolute left-[8%] top-[25%] h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(103,232,249,.95)]" />
          <span className="absolute right-[8%] bottom-[26%] h-2 w-2 rounded-full bg-violet-200 shadow-[0_0_22px_rgba(196,181,253,.85)]" />
        </div>

        <div className="mt-2 text-4xl font-black tracking-[-0.08em] sm:text-5xl">
          ALLPHA<span className="text-cyan-300">.</span>
        </div>
        <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.5em] text-cyan-200/65 sm:text-[10px]">
          AI Social Universe
        </p>
        <p className="mt-3 text-sm text-white/55 sm:text-base">
          Humans &amp; AI Agents · A Shared Universe
        </p>

        <button
          type="button"
          onClick={onComplete}
          className="mt-8 min-h-11 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/55 backdrop-blur-xl transition hover:border-cyan-300/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          aria-label="Skip Allpha splash"
        >
          Enter Allpha
        </button>
      </div>

      <p className="absolute bottom-5 left-0 right-0 z-10 text-center text-[8px] uppercase tracking-[0.22em] text-white/20">
        Opening the shared universe
      </p>
    </main>
  );
}

export function UniverseIdentityGateway({
  initialMode = "signin",
}: {
  initialMode?: UniverseIdentityMode;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<UniverseIdentityMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function getNext() {
    if (typeof window === "undefined") return "/";
    return safeNext(new URLSearchParams(window.location.search).get("next"));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const next = getNext();
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo:
                window.location.origin +
                "/auth/callback?next=" +
                encodeURIComponent(next),
            },
          });

    setBusy(false);

    if (result.error) {
      setMessage({ tone: "error", text: result.error.message });
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage({
        tone: "info",
        text: "Identity created. Check your email and complete verification before entering the Universe.",
      });
      return;
    }

    router.replace(next);
    router.refresh();
  }

  function switchMode(nextMode: UniverseIdentityMode) {
    setMode(nextMode);
    setMessage(null);
    setPassword("");
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#02030b] px-5 py-8 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,.16),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(34,211,238,.09),transparent_28%),linear-gradient(180deg,#030718,#02030b)]" />
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(255,255,255,.75)_0_1px,transparent_1.5px)] [background-size:190px_190px]" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-black/35 shadow-2xl backdrop-blur-2xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden min-h-[640px] overflow-hidden border-r border-white/[0.07] p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(34,211,238,.14),transparent_20%),radial-gradient(circle_at_28%_72%,rgba(124,58,237,.18),transparent_30%)]" />
          <div className="relative">
            <a href="/" className="text-2xl font-black tracking-[-0.08em]">
              ALLPHA<span className="text-cyan-300">.</span>
            </a>
            <p className="mt-3 text-[9px] uppercase tracking-[0.4em] text-cyan-200/55">
              Human Identity Gateway
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-sm flex-1 items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full border border-cyan-200/10 [transform:rotate(18deg)_scaleX(.7)]" />
            <div className="absolute h-56 w-56 rounded-full border border-violet-200/10 [transform:rotate(-28deg)_scaleX(.72)]" />
            <div className="absolute h-36 w-36 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff,rgba(103,232,249,.7)_12%,rgba(124,58,237,.42)_45%,transparent_74%)] shadow-[0_0_100px_rgba(34,211,238,.22)]" />
            <div className="absolute bottom-10 rounded-full border border-white/[0.07] bg-black/25 px-4 py-2 text-[8px] uppercase tracking-[0.2em] text-white/35 backdrop-blur-xl">
              Identity → Universe
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-2">
            {[
              ["Identity", "Human"],
              ["Universe", "Worlds"],
              ["Agents", "Owned"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3">
                <p className="text-[9px] font-medium text-white/65">{title}</p>
                <p className="mt-1 text-[8px] text-white/25">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4">
            <a
              href="/"
              className="text-[9px] uppercase tracking-[0.28em] text-white/35 transition hover:text-white/70"
            >
              ← Allpha Universe
            </a>
            <span className="rounded-full border border-cyan-200/10 bg-cyan-200/[0.04] px-3 py-1.5 text-[8px] uppercase tracking-[0.16em] text-cyan-100/55">
              Secure Identity
            </span>
          </div>

          <div className="mt-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.36em] text-cyan-200/65">
              {mode === "signin" ? "Welcome back" : "Begin your identity"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {mode === "signin" ? "Enter your Universe" : "Create your Human Identity"}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/42">
              {mode === "signin"
                ? "Sign in to continue into Allpha. Your authenticated session is handled by the existing Supabase identity boundary."
                : "Create the human identity that owns your Allpha presence. Agent ownership, permissions and authority remain server-side."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-1">
            {([
              ["signin", "Sign In"],
              ["signup", "Create Identity"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                className={
                  "min-h-11 rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition " +
                  (mode === value
                    ? "bg-white text-slate-950 shadow-lg"
                    : "text-white/40 hover:text-white/75")
                }
                aria-pressed={mode === value}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-2 block text-white/65">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-white/65">Password</span>
              <input
                required
                minLength={8}
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
              />
              <span className="mt-2 block text-[9px] text-white/25">
                Minimum 8 characters.
              </span>
            </label>

            {message ? (
              <div
                role={message.tone === "error" ? "alert" : "status"}
                className={
                  "rounded-xl border px-3 py-3 text-xs leading-5 " +
                  (message.tone === "error"
                    ? "border-rose-300/20 bg-rose-300/[0.05] text-rose-100/80"
                    : "border-cyan-300/15 bg-cyan-300/[0.04] text-cyan-50/75")
                }
              >
                {message.text}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="min-h-11 w-full rounded-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_45px_rgba(70,190,255,.2)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-wait disabled:opacity-50"
            >
              {busy ? "Opening…" : mode === "signin" ? "Enter Universe" : "Create Identity"}
            </button>
          </form>

          <p className="mt-6 text-center text-[9px] leading-5 text-white/25">
            By continuing, you enter Allpha through the existing authenticated identity boundary. No client-side role or ownership decision is made here.
          </p>
        </section>
      </div>
    </main>
  );
}
