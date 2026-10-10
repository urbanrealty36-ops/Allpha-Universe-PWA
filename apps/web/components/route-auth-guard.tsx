"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

// Public discovery and identity routes intentionally remain available without a session.
// Private product surfaces are guarded centrally so links and direct URL entry behave alike.
const PUBLIC_EXACT = new Set(["/", "/agents", "/auth", "/auth/callback", "/blocked", "/offline", "/terms", "/privacy"]);
const PUBLIC_PREFIXES = ["/worlds", "/universe", "/world/", "/districts", "/booths", "/agents/discover", "/agent/catalog", "/communities", "/events", "/explore", "/content", "/themes", "/reels", "/moments"];

function isPublicPath(path: string) {
  return PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

export default function RouteAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (isPublicPath(pathname)) {
      setCheckedPath(pathname);
      return () => { active = false; };
    }
    setCheckedPath(null);
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setCheckedPath(pathname);
        return;
      }
      const next = pathname + (search.size ? "?" + search.toString() : "");
      router.replace("/auth?mode=signin&next=" + encodeURIComponent(next));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) setCheckedPath(pathname);
      else if (!isPublicPath(pathname)) router.replace("/auth?mode=signin&next=" + encodeURIComponent(pathname));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, search, router, supabase]);

  if (!isPublicPath(pathname) && checkedPath !== pathname) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#03050b] px-6 text-center text-white">
        <div>
          <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(103,232,249,.8)]" />
          <p className="mt-5 text-xs uppercase tracking-[.22em] text-cyan-100/70">Verifying your Allpha identity</p>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
