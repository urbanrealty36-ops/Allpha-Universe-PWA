"use client";

import type { ReactNode } from "react";

export type MobileNavigationKey = "universe" | "explore" | "create" | "messages" | "my-agent";

type Item = {
  key: Exclude<MobileNavigationKey, "create">;
  label: string;
  href?: string;
  icon: ReactNode;
};

const items: Item[] = [
  { key: "universe", label: "Universe", icon: <span aria-hidden="true">✦</span> },
  { key: "explore", label: "Explore", icon: <span aria-hidden="true">⌕</span> },
  { key: "messages", label: "Messages", href: "/messages", icon: <span aria-hidden="true">◌</span> },
  { key: "my-agent", label: "My Agent", href: "/agents", icon: <span aria-hidden="true">◈</span> },
];

export function MobileNavigation({
  active,
  onNavigate,
  onCreate,
}: {
  active: MobileNavigationKey;
  onNavigate: (key: Exclude<MobileNavigationKey, "create">) => void;
  onCreate: () => void;
}) {
  return (
    <nav className="allpha-mobile-nav" aria-label="Primary mobile navigation">
      <div className="allpha-mobile-nav-inner">
        <NavItem item={items[0]} active={active === items[0].key} onClick={() => onNavigate(items[0].key)} />
        <NavItem item={items[1]} active={active === items[1].key} onClick={() => onNavigate(items[1].key)} />

        <button
          type="button"
          className="allpha-mobile-nav-create"
          aria-label="Create"
          onClick={onCreate}
        >
          <span className="allpha-mobile-nav-create-icon" aria-hidden="true">+</span>
          <span>Create</span>
        </button>

        <NavItem item={items[2]} active={active === items[2].key} onClick={() => onNavigate(items[2].key)} />
        <NavItem item={items[3]} active={active === items[3].key} onClick={() => onNavigate(items[3].key)} />
      </div>
    </nav>
  );
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: Item;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`allpha-mobile-nav-item ${active ? "is-active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <span className="allpha-mobile-nav-icon">{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}
