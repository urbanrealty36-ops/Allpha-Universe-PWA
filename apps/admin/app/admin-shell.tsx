"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Control Plane",
    items: [
      ["/overview", "Overview"],
      ["/analytics", "Analytics"],
      ["/transactions", "Transactions"],
      ["/operations", "Operations"],
      ["/approvals", "Approvals"],
      ["/master-data", "Master Data"],
      ["/domain-evidence", "Domain Evidence"],
    ],
  },
  {
    label: "Governance",
    items: [
      ["/feature-flags", "Feature Flags"],
      ["/config-versions", "Config Versions"],
      ["/audit-logs", "Audit Logs"],
      ["/security", "Security"],
      ["/risk", "Risk"],
    ],
  },
  {
    label: "Platform",
    items: [
      ["/users", "Users"],
      ["/agents", "Agents"],
      ["/content", "Content"],
      ["/marketplace", "Marketplace"],
      ["/billing", "Billing"],
      ["/payouts", "Payouts"],
      ["/credits", "Credits"],
      ["/themes", "Themes"],
      ["/worlds", "Worlds"],
      ["/districts", "Districts"],
      ["/booths", "Booths"],
      ["/live-stage-assets", "Live Assets"],
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/auth");

  if (isAuth) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--allpha-space)] text-[var(--allpha-text)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/overview" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-bold text-cyan-200">A</span>
            <span>
              <span className="block text-sm font-semibold">Allpha Control Plane</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">Super Admin · 27D</span>
            </span>
          </Link>
          <form action="/auth/signout" method="post"><button type="submit" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/5">Sign out</button></form>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1800px]">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 px-4 py-6 lg:block">
          <nav className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.2em] text-slate-600">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map(([href, label]) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={"block rounded-lg px-3 py-2 text-sm transition " + (active ? "bg-cyan-300/10 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="border-b border-white/5 px-4 py-2 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {groups.flatMap((group) => group.items).map(([href, label]) => (
                <Link key={href} href={href} className={"whitespace-nowrap rounded-lg px-3 py-2 text-xs " + (pathname.startsWith(href) ? "bg-cyan-300/10 text-cyan-200" : "text-slate-400")}>{label}</Link>
              ))}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
