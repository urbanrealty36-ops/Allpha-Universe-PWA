"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });

    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Complete the Supabase email verification flow before signing in.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    router.replace(safeNext(params.get("next")));
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03050b] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,.16),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(34,211,238,.08),transparent_28%)]" />
      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <a href="/" className="text-[10px] uppercase tracking-[0.34em] text-cyan-300/80">
          ← Allpha Universe
        </a>
        <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-white/35">Human Identity Gateway</p>
        <h1 className="mt-3 text-3xl font-semibold">{mode === "signin" ? "Enter your Universe" : "Create your identity"}</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">
          Sign in only when you are ready to enter an authenticated Universe. Ownership, permissions and Agent authority remain server-side.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm">
            <span className="mb-2 block text-white/65">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none transition focus:border-cyan-300/50"
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
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none transition focus:border-cyan-300/50"
            />
          </label>

          {message ? <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/60">{message}</p> : null}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
          >
            {busy ? "Opening…" : mode === "signin" ? "Enter Universe" : "Create Identity"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage("");
          }}
          className="mt-5 text-sm text-cyan-200/75 hover:text-cyan-100"
        >
          {mode === "signin" ? "New here? Create a Human Identity" : "Already have an identity? Sign in"}
        </button>
      </section>
    </main>
  );
}
