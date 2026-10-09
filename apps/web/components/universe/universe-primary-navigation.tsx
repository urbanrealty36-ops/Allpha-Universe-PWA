"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Universe", href: "/universe", short: "Explore", glyph: "✧" },
  { label: "Worlds", href: "/worlds", short: "Worlds", glyph: "◉" },
  { label: "Feed", href: "/feed", short: "Feed", glyph: "▤" },
  { label: "Communities", href: "/communities", short: "Groups", glyph: "◎" },
  { label: "Messages", href: "/messages", short: "Messages", glyph: "✉" },
  { label: "Live", href: "/social", short: "Live", glyph: "◌" },
];

export default function UniversePrimaryNavigation({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Allpha primary navigation" className={`allpha-primary-nav ${compact ? "allpha-primary-nav-compact" : ""}`}>
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={`allpha-primary-nav-item ${active ? "is-active" : ""}`}>
              <span className="allpha-primary-nav-glyph" aria-hidden="true">{item.glyph}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Mobile navigation" className="allpha-mobile-nav">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={`allpha-mobile-nav-item ${active ? "is-active" : ""}`}>
              <span aria-hidden="true">{item.glyph}</span><small>{item.short}</small>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
