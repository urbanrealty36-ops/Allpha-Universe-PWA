"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { isPublicWebPath } from "../lib/auth/route-access";

// Client guard mirrors the server-side proxy as a responsive navigation fallback.

export default function RouteAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (isPublicWebPath(pathname)) {
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
      const currentSearch = typeof window !== "undefined" ? window.location.search : "";
      const next = pathname + currentSearch;
      router.replace("/auth?mode=signin&next=" + encodeURIComponent(next));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) setCheckedPath(pathname);
      else if (!isPublicWebPath(pathname)) router.replace("/auth?mode=signin&next=" + encodeURIComponent(pathname));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  if (!isPublicWebPath(pathname) && checkedPath !== pathname) {
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
