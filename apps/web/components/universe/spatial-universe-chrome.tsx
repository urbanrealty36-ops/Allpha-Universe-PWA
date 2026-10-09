"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  email?: string | null;
  onSignOut: () => void;
};

export default function SpatialUniverseChrome({ email, onSignOut }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="allpha-spatial-chrome-top">
        <div className="allpha-spatial-chrome-brand" aria-label="Allpha Universe">
          <span className="allpha-spatial-logo-mark">A</span>
          <span>
            <strong>ALLPHA<span>.</span></strong>
            <small>AI SOCIAL UNIVERSE</small>
          </span>
        </div>

        <nav className="allpha-spatial-chrome-nav" aria-label="Spatial Universe navigation">
          <a className={isActive("/") ? "is-active" : undefined} aria-current={isActive("/") ? "page" : undefined} href="/">Universe</a>
          <a className={isActive("/social") ? "is-active" : undefined} aria-current={isActive("/social") ? "page" : undefined} href="/social">Live</a>
          <a className={isActive("/universe") ? "is-active" : undefined} aria-current={isActive("/universe") ? "page" : undefined} href="/universe">Galaxy</a>
          <a className={isActive("/communities") ? "is-active" : undefined} aria-current={isActive("/communities") ? "page" : undefined} href="/communities">Communities</a>
          <button type="button" onClick={() => setCreateOpen(true)}>Create</button>
        </nav>

        <div className="allpha-spatial-chrome-actions">
          <a href="/messages" aria-label="Messages" aria-current={isActive("/messages") ? "page" : undefined}>⌁</a>
          <a href="/notifications" aria-label="Notifications" aria-current={isActive("/notifications") ? "page" : undefined}>◌</a>
          <a href="/profile" aria-label={email ?? "Profile"} aria-current={isActive("/profile") ? "page" : undefined}>◉</a>
        </div>
      </header>

      <div className="allpha-spatial-chrome-hint" aria-hidden="true">
        <span>DRAG</span><i /><span>ORBIT</span><i /><span>TAP TO ENTER</span>
      </div>

      <nav className="allpha-spatial-mobile-nav" aria-label="Mobile Universe navigation">
        <a className={isActive("/") ? "is-active" : undefined} aria-current={isActive("/") ? "page" : undefined} href="/"><span>◉</span><small>Universe</small></a>
        <a className={isActive("/universe") ? "is-active" : undefined} aria-current={isActive("/universe") ? "page" : undefined} href="/universe"><span>✦</span><small>Explore</small></a>
        <button type="button" className="create" onClick={() => setCreateOpen(true)} aria-label="Create"><span>+</span><small>Create</small></button>
        <a className={isActive("/messages") ? "is-active" : undefined} aria-current={isActive("/messages") ? "page" : undefined} href="/messages"><span>⌁</span><small>Messages</small></a>
        <a className={isActive("/agents") ? "is-active" : undefined} aria-current={isActive("/agents") ? "page" : undefined} href="/agents"><span>◎</span><small>My Agent</small></a>
      </nav>

      <nav className="allpha-spatial-product-rail" aria-label="Explore Allpha spaces">
        <a className={isActive("/universe") ? "is-active" : undefined} href="/universe"><span>✦</span> Galaxy</a>
        <a className={isActive("/worlds") ? "is-active" : undefined} href="/worlds"><span>◈</span> Worlds</a>
        <a className={isActive("/districts") ? "is-active" : undefined} href="/districts"><span>⌘</span> Districts</a>
        <a className={isActive("/booths") ? "is-active" : undefined} href="/booths"><span>▣</span> Booths</a>
        <a className={isActive("/content") ? "is-active" : undefined} href="/content"><span>✧</span> Capsules</a>
        <a className={isActive("/social") ? "is-active" : undefined} href="/social"><span>◉</span> Live</a>
      </nav>

      <div className="allpha-spatial-layer-legend" aria-label="Spatial hierarchy">
        <span className="is-active">Universe</span><b>→</b><span>Galaxy</span><b>→</b><span>World</span><b>→</b><span>District</span><b>→</b><span>Booth</span>
      </div>

      <div className="allpha-spatial-account">
        <span className="allpha-spatial-account-email">{email ?? "Human Identity"}</span>
        <a href="/agents">Agents</a>
        <button type="button" onClick={onSignOut}>Exit</button>
      </div>

      {createOpen && (
        <div className="allpha-spatial-create-backdrop" role="presentation" onClick={() => setCreateOpen(false)}>
          <section className="allpha-spatial-create-sheet" role="dialog" aria-modal="true" aria-labelledby="spatial-create-title" onClick={(event) => event.stopPropagation()}>
            <div className="allpha-spatial-create-handle" aria-hidden="true" />
            <div className="allpha-spatial-create-head">
              <div>
                <p className="allpha-eyebrow">Create in Allpha</p>
                <h2 id="spatial-create-title">Build something that lives in the Universe</h2>
                <p>Start with an owner-owned AI Agent. Experience, World and Theme creation continue through their canonical flows.</p>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="allpha-spatial-create-grid">
              <a href="/agents/create"><strong>AI Agent</strong><span>Persona · Skills · Memory</span><b>→</b></a>
              <a href="/theme-studio"><strong>World Theme</strong><span>Theme · Spatial presentation</span><b>→</b></a>
              <a href="/booths"><strong>Booth / Tenant</strong><span>Presence · Catalog · Space</span><b>→</b></a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
