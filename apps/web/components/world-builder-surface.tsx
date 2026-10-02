"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type State={id:string;status:string;world_id:string|null;theme_id:string|null;theme_version_id:string|null;world_template_id:string|null;world_template_version_id:string|null;scene_schema:Record<string,unknown>};
type Theme={id:string;name:string;status:string;moderation_status:string};
type Template={id:string;name:string;status:string;moderation_status:string};

const inputClass="w-full rounded-[var(--allpha-radius-md)] border border-white/10 bg-[var(--allpha-space-elevated)] p-3 text-sm text-[var(--allpha-text)] outline-none focus:border-[var(--allpha-cyan)]";
const cardClass="rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)] p-5";

export default function WorldBuilderSurface(){
  const[states,setStates]=useState<State[]>([]),[themes,setThemes]=useState<Theme[]>([]),[templates,setTemplates]=useState<Template[]>([]);
  const[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  const[worldId,setWorldId]=useState(""),[themeId,setThemeId]=useState(""),[themeVersionId,setThemeVersionId]=useState(""),[templateId,setTemplateId]=useState(""),[templateVersionId,setTemplateVersionId]=useState("");
  const[schema,setSchema]=useState('{"type":"world","zones":[],"objects":[],"events":[],"spawn_points":[],"rules":{}}');

  async function load(){
    setLoading(true);setError(null);
    try{
      const [s,t,wt]=await Promise.all([
        apiFetch<{data:State[]}>("/api/v1/world-builder"),
        apiFetch<{data:Theme[]}>("/api/v1/themes?status=published"),
        apiFetch<{data:Template[]}>("/api/v1/themes/world-templates")
      ]);
      setStates(s.data||[]);setThemes(t.data||[]);setTemplates(wt.data||[]);
    }catch(e){setError(e instanceof Error?e.message:"WORLD_BUILDER_LOAD_FAILED")}finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[]);

  async function save(e:FormEvent){
    e.preventDefault();setBusy(true);setError(null);
    try{
      const scene_schema=JSON.parse(schema);
      await apiFetch("/api/v1/world-builder",{method:"POST",body:JSON.stringify({world_id:worldId||null,theme_id:themeId||null,theme_version_id:themeVersionId||null,world_template_id:templateId||null,world_template_version_id:templateVersionId||null,scene_schema})});
      await load();
    }catch(e){setError(e instanceof Error?e.message:"WORLD_BUILDER_SAVE_FAILED")}finally{setBusy(false)}
  }
  async function action(id:string,action:"validate"|"submit"){
    setBusy(true);setError(null);
    try{await apiFetch(`/api/v1/world-builder/${id}/${action}`,{method:"POST"});await load()}catch(e){setError(e instanceof Error?e.message:`WORLD_BUILDER_${action.toUpperCase()}_FAILED`)}finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-[var(--allpha-space)] px-5 py-7 text-[var(--allpha-text)] sm:px-9">
    <div className="mx-auto max-w-7xl">
      <header><p className="text-xs font-medium uppercase tracking-[.25em] text-[var(--allpha-cyan)]">Phase 21 · Theme & World Builder</p><h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">World Builder</h1><p className="mt-3 max-w-3xl text-[var(--allpha-text-secondary)]">Persistent scene configuration using real Worlds, published Themes and governed Templates. Scene JSON is declarative; arbitrary code/scripts and protected authority namespaces are rejected server-side.</p></header>
      {error&&<div className="mt-5 rounded-[var(--allpha-radius-md)] border border-[var(--allpha-danger)]/30 bg-[var(--allpha-danger)]/10 p-4 text-sm">{error}</div>}
      <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className={cardClass}>
          <h2 className="font-semibold">Builder Configuration</h2>
          <p className="mt-1 text-xs text-[var(--allpha-text-muted)]">References must resolve to authoritative objects; no business records are fabricated.</p>
          <form onSubmit={save} className="mt-5 grid gap-3">
            <input value={worldId} onChange={e=>setWorldId(e.target.value)} placeholder="World UUID (optional)" className={inputClass}/>
            <select value={themeId} onChange={e=>setThemeId(e.target.value)} className={inputClass}><option value="">No Theme selected</option>{themes.map(t=><option key={t.id} value={t.id}>{t.name} · {t.status}</option>)}</select>
            <input value={themeVersionId} onChange={e=>setThemeVersionId(e.target.value)} placeholder="Published Theme Version UUID (optional)" className={inputClass}/>
            <select value={templateId} onChange={e=>setTemplateId(e.target.value)} className={inputClass}><option value="">No World Template selected</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name} · {t.status}</option>)}</select>
            <input value={templateVersionId} onChange={e=>setTemplateVersionId(e.target.value)} placeholder="World Template Version UUID (optional)" className={inputClass}/>
            <label className="grid gap-1 text-xs text-[var(--allpha-text-secondary)]"><span>World Scene Schema</span><textarea value={schema} onChange={e=>setSchema(e.target.value)} rows={15} className={`${inputClass} font-mono text-xs`}/></label>
            <button disabled={busy} className="rounded-[var(--allpha-radius-md)] bg-[var(--allpha-primary)] px-4 py-3 text-sm font-medium disabled:opacity-40">{busy?"Saving…":"Save builder state"}</button>
          </form>
        </section>
        <section className={cardClass}>
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">My Builder States</h2><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">Draft → validated → submitted.</p></div><button onClick={()=>void load()} className="rounded-[var(--allpha-radius-sm)] border border-white/10 px-3 py-2 text-xs">Refresh</button></div>
          {states.length===0?<p className="mt-5 text-sm text-[var(--allpha-text-muted)]">{loading?"Loading…":"No builder states yet."}</p>:<div className="mt-4 space-y-2">{states.map(s=><article key={s.id} className="rounded-[var(--allpha-radius-md)] border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-sm">{s.status}</span><span className="max-w-[14rem] truncate text-xs text-[var(--allpha-text-muted)]">{s.id}</span></div><p className="mt-2 text-xs text-[var(--allpha-text-muted)]">World: {s.world_id||"not attached"} · Theme: {s.theme_id||"not selected"} · Template: {s.world_template_id||"not selected"}</p><div className="mt-3 flex gap-2">{s.status==="draft"&&<button disabled={busy} onClick={()=>void action(s.id,"validate")} className="rounded-[var(--allpha-radius-sm)] border border-white/10 px-3 py-2 text-xs">Validate</button>}{s.status==="validated"&&<button disabled={busy} onClick={()=>void action(s.id,"submit")} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-cyan)]/40 px-3 py-2 text-xs">Submit</button>}</div></article>)}</div>}
        </section>
      </div>
    </div>
  </main>;
}
