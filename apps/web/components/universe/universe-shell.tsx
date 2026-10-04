"use client";

import type { ReactNode } from "react";
import { MobileNavigation, type MobileNavigationKey } from "../navigation/mobile-navigation";

export type UniverseShellKey =
  | "universe"
  | "social"
  | "explore"
  | "communities"
  | "create"
  | "missions"
  | "marketplace"
  | "my-agent";

type Props = {
  active: UniverseShellKey;
  onNavigate: (key: UniverseShellKey) => void;
  onCreate: () => void;
  children: ReactNode;
  overlay?: ReactNode;
  contextDock?: ReactNode;
  commandBar?: ReactNode;
};

const desktopItems: Array<{ key: Exclude<UniverseShellKey, "create">; label: string }> = [
  { key: "universe", label: "Universe" },
  { key: "social", label: "Social" },
  { key: "explore", label: "Explore" },
  { key: "communities", label: "Communities" },
  { key: "missions", label: "Missions" },
  { key: "marketplace", label: "Marketplace" },
  { key: "my-agent", label: "My Agent" },
];

export default function UniverseShell({
  active,
  onNavigate,
  onCreate,
  children,
  overlay,
  contextDock,
  commandBar,
}: Props) {
  const mobileActive: MobileNavigationKey =
    active === "universe" ? "universe" :
    active === "explore" || active === "social" || active === "communities" || active === "missions" || active === "marketplace" ? "explore" :
    active === "my-agent" ? "my-agent" :
    "universe";

  return (
    <main className="allpha-universe-shell min-h-screen bg-[#02040b] text-white">
      <header className="allpha-universe-topbar">
        <div className="allpha-universe-topbar-inner">
          <button
            type="button"
            className="allpha-universe-brand"
            onClick={() => onNavigate("universe")}
            aria-label="Open Allpha Universe"
          >
            ALLPHA<span>.</span>
          </button>

          <nav className="allpha-universe-desktop-nav" aria-label="Universe navigation">
            {desktopItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`allpha-universe-nav-item ${active === item.key ? "is-active" : ""}`}
                aria-current={active === item.key ? "page" : undefined}
                onClick={() => onNavigate(item.key)}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className={`allpha-universe-nav-item allpha-universe-nav-create ${active === "create" ? "is-active" : ""}`}
              onClick={onCreate}
            >
              Create
            </button>
          </nav>

          <div className="allpha-universe-global-actions">
            <a href="/messages" aria-label="Messages">Messages</a>
            <a href="/notifications" aria-label="Notifications">Notifications</a>
            <a href="/profile" aria-label="Profile">Profile</a>
          </div>
        </div>
      </header>

      <div className="allpha-universe-canvas">
        {children}
      </div>

      {overlay ? <div className="allpha-universe-overlay">{overlay}</div> : null}

      {contextDock ? (
        <aside className="allpha-universe-context-dock" aria-label="Universe context">
          {contextDock}
        </aside>
      ) : null}

      <div className="allpha-universe-command-bar">
        {commandBar ?? (
          <div className="allpha-universe-command-default">
            <span className="allpha-universe-command-signal" aria-hidden="true" />
            <span>Universe Command</span>
            <button type="button" onClick={() => onNavigate("explore")}>Explore</button>
            <button type="button" onClick={() => onNavigate("my-agent")}>My Agent</button>
            <a href="/agent-runtime">Command Center</a>
          </div>
        )}
      </div>

      <MobileNavigation
        active={mobileActive}
        onNavigate={(key) => {
          if (key === "universe") onNavigate("universe");
          if (key === "explore") onNavigate("explore");
          if (key === "messages") window.location.assign("/messages");
          if (key === "my-agent") onNavigate("my-agent");
        }}
        onCreate={onCreate}
      />
    </main>
  );
}
