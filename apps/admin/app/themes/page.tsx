"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Theme={id:string;name:string;status:string;moderation_status:string};
type Version={id:string;version:number;status:string;validation_status:string;performance_status:string;moderation_status:string};

export default function Page(){
  const[themes,setThemes]=useState<Theme[]>([]),[versions,setVersions]=useState<Record<string,Version[]>>({}),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState<string|null>(null);
  async function load(){
    setLoading(true);setError(null);
    try{
      const r=await apiFetch<{data:Theme[]}>("/api/v1/themes");
      setThemes(r.data||[]);
      const entries=await Promise.all((r.data||[]).map(async t=>[t.id,(await apiFetch<{data:Version[]}>(`/api/v1/themes/${t.id}/versions`)).data||[]] as const));
      setVersions(Object.fromEntries(entries));
    }catch(e){setError(e instanceof Error?e.message:"THEME_ADMIN_LOAD_FAILED")}finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[]);
  async function moderate(theme:Theme,v:Version,decision:"approved"|"restricted"|"removed"){
    setBusy(v.id);setError(null);
    try{await apiFetch(`/api/v1/themes/${theme.id}/versions/${v.id}/moderation`,{method:"POST",body:JSON.stringify({decision})});await load()}catch(e){setError(e instanceof Error?e.message:"THEME_MODERATION_FAILED")}finally{setBusy(null)}
  }
  return <main className="min-h-screen bg-[var(--allpha-space)] p-6 text-[var(--allpha-text)] sm:p-10">
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--allpha-cyan)]">Universe · Phase 21</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Theme Moderation</h1>
      <p className="mt-4 max-w-3xl text-[var(--allpha-text-secondary)]">Platform moderation is authoritative and permission-gated. Approval here does not bypass validation, performance or publication gates.</p>
      {error&&<div className="mt-5 rounded-[var(--allpha-radius-md)] border border-[var(--allpha-danger)]/30 bg-[var(--allpha-danger)]/10 p-4 text-sm">{error}</div>}
      <section className="mt-8 rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)] p-6">
        {themes.length===0?<p className="text-sm text-[var(--allpha-text-muted)]">{loading?"Loading authoritative themes…":"No themes are available to this moderator."}</p>:<div className="space-y-5">{themes.map(t=><article key={t.id} className="rounded-[var(--allpha-radius-md)] border border-white/10 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{t.name}</h2><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">Theme: {t.status} · moderation: {t.moderation_status}</p></div></div><div className="mt-4 space-y-2">{(versions[t.id]||[]).map(v=><div key={v.id} className="rounded-[var(--allpha-radius-sm)] border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm">Version {v.version}</span><span className="text-xs text-[var(--allpha-text-muted)]">{v.status} · validation {v.validation_status} · performance {v.performance_status} · moderation {v.moderation_status}</span></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy===v.id} onClick={()=>void moderate(t,v,"approved")} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-success)]/40 px-3 py-2 text-xs">Approve</button><button disabled={busy===v.id} onClick={()=>void moderate(t,v,"restricted")} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-warning)]/40 px-3 py-2 text-xs">Restrict</button><button disabled={busy===v.id} onClick={()=>void moderate(t,v,"removed")} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-danger)]/40 px-3 py-2 text-xs">Remove</button></div></div>)}</div></article>)}</div>}
      </section>
    </div>
  </main>;
}
