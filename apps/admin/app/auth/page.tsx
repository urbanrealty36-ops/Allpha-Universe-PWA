"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function AdminAuthPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error || !result.data.session) {
      setBusy(false);
      setMessage(result.error?.message ?? "Authentication did not create a session.");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      setBusy(false);
      setMessage("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/auth/permissions`, {
      headers: {
        Authorization: `Bearer ${result.data.session.access_token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      await supabase.auth.signOut();
      setBusy(false);
      setMessage("The authenticated account is not authorized for the Allpha Control Plane.");
      return;
    }

    const permissions = (await response.json()) as { roles: string[]; permissions: string[] };
    const isAdmin =
      permissions.roles.includes("platform_admin") || permissions.roles.includes("super_admin");

    if (!isAdmin) {
      await supabase.auth.signOut();
      setBusy(false);
      setMessage("The authenticated account does not have a platform administration role.");
      return;
    }

    setBusy(false);
    router.replace("/overview");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-7 shadow-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">Allpha Control Plane</p>
        <h1 className="mt-3 text-3xl font-semibold">Administrator sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Admin access is granted only by backend authorization. Client-side role state is never trusted.
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
              type="password"
              autoComplete="current-password"
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
            {busy ? "Authenticating…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
