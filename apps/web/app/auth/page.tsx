"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

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

    router.replace("/universe");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-7 shadow-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">Allpha Auth</p>
        <h1 className="mt-3 text-3xl font-semibold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Authentication is handled by Supabase Auth. All privileged authorization remains server-side.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-300"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Password</span>
            <input
              required
              minLength={8}
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-300"
            />
          </label>

          {message ? <p className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">{message}</p> : null}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {busy ? "Processing…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage("");
          }}
          className="mt-5 text-sm text-cyan-300"
        >
          {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
