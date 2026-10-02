"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Theme={id:string;name:string;slug:string;category:string;status:string;moderation_status:string};
type Version={id:string;version:number;status:string;validation_status:string;performance_status:string;moderation_status:string};

const inputClass="w-full rounded-[var(--allpha-radius-md)] border border-white/10 bg-[var(--allpha-space-elevated)] p-3 text-sm text-[var(--allpha-text)] outline-none transition focus:border-[var(--allpha-cyan)]";
const cardClass="rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)] p-5";

export default function ThemeBuilderSurface(){
  const[themes,setThemes]=useState<Theme[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  const[name,setName]=useState(""),[slug,setSlug]=useState(""),[category,setCategory]=useState("");
  const[selected,setSelected]=useState<Theme|null>(null),[versions,setVersions]=useState<Version[]>([]);
  const[tokens,setTokens]=useState('{"theme.color.primary":"var(--allpha-primary)","theme.color.accent":"var(--allpha-cyan)","theme.radius.md":"var(--allpha-radius-md)"}');
  const[componentConfig,setComponentConfig]=useState("{}"),[worldSchema,setWorldSchema]=useState('{"type":"world","nodes":[]}'),[performance,setPerformance]=useState('{"mode":"progressive"}'),[accessibility,setAccessibility]=useState('{"reduced_motion":"supported","contrast":"AA"}');

  async function load(){setLoading(true);setError(null);try{const r=await apiFetch<{data:Theme[]}>("/api/v1/themes");setThemes(r.data||[])}catch(e){setError(e instanceof Error?e.message:"THEME_LOAD_FAILED")}finally{setLoading(false)}}
  async function openTheme(t:Theme){setSelected(t);setError(null);try{const r=await apiFetch<{data:Version[]}>(`/api/v1/themes/${t.id}/versions`);setVersions(r.data||[])}catch(e){setError(e instanceof Error?e.message:"THEME_VERSION_LOAD_FAILED")}}
  useEffect(()=>{void load()},[]);

  async function create(e:FormEvent){e.preventDefault();setBusy(true);setError(null);try{await apiFetch("/api/v1/themes",{method:"POST",body:JSON.stringify({name,slug,category})});setName("");setSlug("");setCategory("");await load()}catch(e){setError(e instanceof Error?e.message:"THEME_CREATE_FAILED")}finally{setBusy(false)}}
  async function createVersion(e:FormEvent){e.preventDefault();if(!selected)return;setBusy(true);setError(null);try{await apiFetch(`/api/v1/themes/${selected.id}/versions`,{method:"POST",body:JSON.stringify({tokens:JSON.parse(tokens),component_config:JSON.parse(componentConfig),world_schema:JSON.parse(worldSchema),performance_budget:JSON.parse(performance),accessibility_constraints:JSON.parse(accessibility)})});await openTheme(selected)}catch(e){setError(e instanceof Error?e.message:"THEME_VERSION_CREATE_FAILED")}finally{setBusy(false)}}
  async function versionAction(id:string,action:"validate"){if(!selected)return;setBusy(true);setError(null);try{await apiFetch(`/api/v1/themes/versions/${id}/${action}`,{method:"POST"});await openTheme(selected)}catch(e){setError(e instanceof Error?e.message:"THEME_VERSION_ACTION_FAILED")}finally{setBusy(false)}}
  async function submit(){if(!selected)return;setBusy(true);setError(null);try{await apiFetch(`/api/v1/themes/${selected.id}/submit`,{method:"POST"});await load();await openTheme(selected)}catch(e){setError(e instanceof Error?e.message:"THEME_SUBMIT_FAILED")}finally{setBusy(false)}}

  return <main className="min-h-screen bg-[var(--allpha-space)] px-5 py-7 text-[var(--allpha-text)] sm:px-9">
    <div className="mx-auto max-w-7xl">
      <header>
        <p className="text-xs font-medium uppercase tracking-[.25em] text-[var(--allpha-cyan)]">Phase 21 · Theme & World Builder</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Theme Builder</h1>
        <p className="mt-3 max-w-3xl text-[var(--allpha-text-secondary)]">Create governed presentation themes and immutable versions. Theme configuration never changes identity, ownership, permission, entitlement, risk, approval, audit or security authority.</p>
      </header>
      {error&&<div className="mt-5 rounded-[var(--allpha-radius-md)] border border-[var(--allpha-danger)]/30 bg-[var(--allpha-danger)]/10 p-4 text-sm">{error}</div>}
      <div className="mt-7 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className={cardClass}>
          <h2 className="font-semibold">Create Theme Draft</h2>
          <p className="mt-1 text-xs text-[var(--allpha-text-muted)]">Only real owner-created records are persisted.</p>
          <form onSubmit={create} className="mt-4 grid gap-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Theme name" required className={inputClass}/>
            <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="theme-slug" required className={inputClass}/>
            <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" required className={inputClass}/>
            <button disabled={busy} className="rounded-[var(--allpha-radius-md)] bg-[var(--allpha-primary)] px-4 py-3 text-sm font-medium text-white disabled:opacity-40">{busy?"Saving…":"Create draft"}</button>
          </form>
        </section>
        <section className={cardClass}>
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">My & Published Themes</h2><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">Authoritative API state only.</p></div><button onClick={()=>void load()} className="rounded-[var(--allpha-radius-sm)] border border-white/10 px-3 py-2 text-xs">Refresh</button></div>
          {themes.length===0?<p className="mt-5 text-sm text-[var(--allpha-text-muted)]">{loading?"Loading…":"No authoritative themes yet."}</p>:<div className="mt-4 space-y-2">{themes.map(t=><button key={t.id} onClick={()=>void openTheme(t)} className="block w-full rounded-[var(--allpha-radius-md)] border border-white/10 p-4 text-left transition hover:border-[var(--allpha-cyan)]/40"><div className="flex justify-between gap-4"><span>{t.name}</span><span className="text-xs text-[var(--allpha-text-muted)]">{t.status}</span></div><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">{t.category} · moderation: {t.moderation_status}</p></button>)}</div>}
        </section>
      </div>
      {selected&&<section className={`${cardClass} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{selected.name} · Versions</h2><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">Version must validate before submission and moderation.</p></div><button disabled={busy} onClick={()=>void submit()} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-cyan)]/40 px-3 py-2 text-xs disabled:opacity-40">Submit for review</button></div>
        <form onSubmit={createVersion} className="mt-5 grid gap-3">
          {[["tokens",tokens,setTokens],["component_config",componentConfig,setComponentConfig],["world_schema",worldSchema,setWorldSchema],["performance_budget",performance,setPerformance],["accessibility_constraints",accessibility,setAccessibility]].map(([label,value,setter])=><label key={label as string} className="grid gap-1 text-xs text-[var(--allpha-text-secondary)]"><span>{label as string}</span><textarea rows={label==="tokens"?3:4} value={value as string} onChange={e=>(setter as (v:string)=>void)(e.target.value)} className={inputClass}/></label>)}
          <button disabled={busy} className="rounded-[var(--allpha-radius-md)] bg-[var(--allpha-surface-strong)] px-4 py-3 text-sm disabled:opacity-40">{busy?"Saving…":"Create version"}</button>
        </form>
        <div className="mt-6 space-y-2">{versions.length===0?<p className="text-sm text-[var(--allpha-text-muted)]">No versions exist for this Theme.</p>:versions.map(v=><article key={v.id} className="rounded-[var(--allpha-radius-md)] border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span>Version {v.version}</span><span>{v.status}</span></div><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">validation: {v.validation_status} · performance: {v.performance_status} · moderation: {v.moderation_status}</p>{v.status==="draft"&&<button disabled={busy} onClick={()=>void versionAction(v.id,"validate")} className="mt-3 rounded-[var(--allpha-radius-sm)] border border-white/10 px-3 py-2 text-xs">Validate</button>}</article>)}</div>
      </section>}
    </div>
  </main>;
}
