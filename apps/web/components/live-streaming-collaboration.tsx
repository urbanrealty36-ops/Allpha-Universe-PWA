"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type Template = {
  id: string; name: string; slug: string; category: string; description: string | null;
  catalog_order: number | null; source: "platform" | "creator"; status: string;
};
type Version = {
  id: string; version: number; template_schema: Record<string, any>;
  performance_budget: Record<string, any>; accessibility_constraints: Record<string, any>;
};

const card = "rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)]";
const input = "rounded-[var(--allpha-radius-md)] border border-white/10 bg-[var(--allpha-space-elevated)] px-3 py-2 text-sm text-[var(--allpha-text)] outline-none focus:border-[var(--allpha-cyan)]";

function Preview({ schema }: { schema: Record<string, any> | null }) {
  const stage = schema?.stage ?? {};
  const roles = Array.isArray(schema?.roles) ? schema.roles : [];
  const overlays = schema?.overlays ?? {};
  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-space)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(99,102,241,.28),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,.18),transparent_30%)]" />
      <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[9px] uppercase tracking-[.18em] text-[var(--allpha-cyan)]">
        {stage.layout ?? "live_stage"}
      </div>
      <div className="absolute right-3 top-3 flex gap-1">
        <span className="rounded-full bg-red-500/80 px-2 py-1 text-[9px]">LIVE</span>
        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[9px]">AI COLLAB</span>
      </div>
      <div className="absolute inset-x-5 bottom-9 top-12 grid min-h-0 gap-2" style={{ gridTemplateColumns: roles.length > 2 ? "repeat(3,minmax(0,1fr))" : "repeat(2,minmax(0,1fr))" }}>
        {roles.map((role: any, i: number) => (
          <div key={role.slot ?? i} className="relative min-h-0 rounded-xl border border-white/10 bg-white/[.06] p-2 backdrop-blur">
            <div className="absolute bottom-2 left-2 right-2 rounded-md bg-black/45 px-2 py-1 text-[9px] text-white/80">
              {role.slot ?? "participant"}
            </div>
            <div className="flex h-full items-center justify-center text-xl text-white/25">{role.slot?.startsWith("ai_") || role.slot?.startsWith("agent_") ? "✦" : "●"}</div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[8px] uppercase tracking-wider text-white/50">
        <span>{overlays.primary ?? "overlay"}</span><span>captions · audience · owner control</span>
      </div>
    </div>
  );
}

export default function LiveStreamingCollaboration() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: Template[] }>("/api/v1/live/templates?source=platform&limit=100");
      const rows = r.data ?? [];
      setTemplates(rows);
      if (!selected && rows[0]) setSelected(rows[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_TEMPLATE_LOAD_FAILED");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!selected) { setVersion(null); return; }
    void apiFetch<{ data: Version[] }>(`/api/v1/live/templates/${selected.id}/versions`)
      .then(r => setVersion(r.data?.[0] ?? null))
      .catch(e => setError(e instanceof Error ? e.message : "LIVE_TEMPLATE_VERSION_LOAD_FAILED"));
  }, [selected]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(templates.map(t => t.category)))], [templates]);
  const visible = category === "all" ? templates : templates.filter(t => t.category === category);
  const schema = version?.template_schema ?? null;

  return (
    <main className="min-h-screen bg-[var(--allpha-space)] px-5 py-7 text-[var(--allpha-text)] sm:px-9">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-xs font-medium uppercase tracking-[.25em] text-[var(--allpha-cyan)]">Phase 22 · Live Stories / Streaming / Experiences</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Live Streaming Collaboration</h1>
          <p className="mt-3 max-w-3xl text-[var(--allpha-text-secondary)]">
            Human Owner + owned AI Agent dalam satu Live Session. Template mengatur panggung, role, overlay, audience surface dan presentasi — bukan ownership, permission, policy atau risk authority.
          </p>
        </header>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
          <div className={card + " p-5"}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Allpha Live Collection</h2>
                <p className="mt-1 text-sm text-[var(--allpha-text-muted)]">{loading ? "Loading catalog…" : `${templates.length} built-in collaboration templates`}</p>
              </div>
              <select className={input} value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c === "all" ? "All formats" : c}</option>)}
              </select>
            </div>

            {error && <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm">{error}</div>}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map(t => (
                <button key={t.id} onClick={() => setSelected(t)} className={`text-left rounded-[var(--allpha-radius-lg)] border p-4 transition ${selected?.id === t.id ? "border-[var(--allpha-cyan)] bg-[var(--allpha-cyan)]/5" : "border-white/10 hover:border-white/20"}`}>
                  <div className="mb-3 aspect-[16/9] overflow-hidden rounded-lg bg-[var(--allpha-space-elevated)]">
                    <Preview schema={selected?.id === t.id ? schema : null} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{t.name}</h3>
                    <span className="text-[9px] uppercase tracking-wider text-[var(--allpha-cyan)]">{t.category}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--allpha-text-secondary)]">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <aside className={card + " h-fit p-5 lg:sticky lg:top-5"}>
            {selected ? <>
              <p className="text-xs uppercase tracking-[.2em] text-[var(--allpha-cyan)]">Selected Template</p>
              <h2 className="mt-2 text-2xl font-semibold">{selected.name}</h2>
              <p className="mt-2 text-sm text-[var(--allpha-text-secondary)]">{selected.description}</p>
              <div className="mt-5"><Preview schema={schema} /></div>
              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-lg border border-white/10 p-3"><span className="text-xs text-[var(--allpha-text-muted)]">Stage</span><div className="mt-1">{schema?.stage?.layout ?? "Loading…"}</div></div>
                <div className="rounded-lg border border-white/10 p-3"><span className="text-xs text-[var(--allpha-text-muted)]">Collaboration</span><div className="mt-1">Human Owner + {schema?.ai_collaboration?.suggested_role_slots?.length ?? 0} AI role slot(s)</div></div>
                <div className="rounded-lg border border-white/10 p-3"><span className="text-xs text-[var(--allpha-text-muted)]">Audience</span><div className="mt-1">Chat · Questions · Reactions · Participant Requests</div></div>
                <div className="rounded-lg border border-white/10 p-3"><span className="text-xs text-[var(--allpha-text-muted)]">Accessibility</span><div className="mt-1">Captions · Reduced Motion · Keyboard · AA</div></div>
              </div>
              <div className="mt-5 rounded-lg border border-[var(--allpha-cyan)]/20 bg-[var(--allpha-cyan)]/5 p-3 text-xs leading-5 text-[var(--allpha-text-secondary)]">
                Template is presentation configuration only. Actual Live Session activation still resolves owner, Agent ownership/capability, consent, policy, risk, AI Gateway, Agent Runtime, media transport and Realtime authorization server-side.
              </div>
            </> : <p className="text-sm text-[var(--allpha-text-muted)]">{loading ? "Loading…" : "No published platform templates available."}</p>}
          </aside>
        </section>
      </div>
    </main>
  );
}
