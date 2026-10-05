"use client";

import { useEffect, useMemo, useState } from "react";

type ContextKey = "universe" | "world" | "district" | "booth" | "content" | "live" | "personal";

const contexts: Array<{key:ContextKey;label:string;description:string}> = [
  {key:"universe",label:"Universe",description:"Start from the global Universe layer."},
  {key:"world",label:"World",description:"Create for an existing or planned World."},
  {key:"district",label:"District",description:"Create for a spatial District context."},
  {key:"booth",label:"Booth / Tenant",description:"Create a tenant, venue or spatial presence."},
  {key:"content",label:"Content",description:"Create authoritative Content."},
  {key:"live",label:"Live",description:"Start from the existing Live runtime."},
  {key:"personal",label:"Personal",description:"Create for your own personal/private space."},
];

const options = [
  ["agent","Intelligence","AI Agent","Create an owner-owned Agent with Type, Skills, Character, Context, Policy and Budget.","Agent Factory","/agents/create"],
  ["content","Knowledge & Discovery","Content","Create authoritative Content that can evolve into Capsule, Discussion, Community, Agent, Live and World relationships.","Content Platform","/content"],
  ["live","Experience","Live Experience","Enter the existing Live Streaming and Live Experience Runtime setup.","Live Studio","/live"],
  ["world","Spatial","World","Create through the canonical World Builder and spatial runtime contracts.","World Builder","/world-builder"],
  ["theme","Spatial Foundation","Theme","Create or configure a World Theme through the existing Theme Builder.","Theme Builder","/theme-builder"],
  ["booth","Spatial Commerce","Booth / Tenant","Provision a real Booth draft with existing tenancy, asset, catalog and Agent Host contracts.","Booth Builder","/booths"],
  ["community","Social Graph","Community","Create a real Community through the canonical Community API.","Community Surface","/communities"],
  ["workflow","Orchestration","Workflow / Mission","Continue into the existing governed Workflow and Mission surfaces.","Workflow Surface","/workflows"],
] as const;

const optionClasses = [
  "border-cyan-300/20 bg-cyan-300/[.035] hover:border-cyan-300/40",
  "border-violet-300/20 bg-violet-300/[.035] hover:border-violet-300/40",
  "border-rose-300/20 bg-rose-300/[.035] hover:border-rose-300/40",
  "border-blue-300/20 bg-blue-300/[.035] hover:border-blue-300/40",
  "border-indigo-300/20 bg-indigo-300/[.035] hover:border-indigo-300/40",
  "border-amber-300/20 bg-amber-300/[.035] hover:border-amber-300/40",
  "border-emerald-300/20 bg-emerald-300/[.035] hover:border-emerald-300/40",
  "border-purple-300/20 bg-purple-300/[.035] hover:border-purple-300/40",
];

export default function CreateExperience(){
  const [context,setContext]=useState<ContextKey>("universe");
  useEffect(()=>{
    const requested=new URLSearchParams(window.location.search).get("context") as ContextKey|null;
    if(requested && contexts.some(x=>x.key===requested)) setContext(requested);
  },[]);
  const active=useMemo(()=>contexts.find(x=>x.key===context)??contexts[0],[context]);
  const withContext=(href:string)=>href+(href.includes("?")?"&":"?")+"context="+encodeURIComponent(context);

  return <main className="min-h-screen bg-[#02040b] text-white">
    <div className="mx-auto max-w-[1480px] px-4 pb-24 pt-8 sm:px-8 sm:pt-12 lg:px-10">
      <header className="relative overflow-hidden rounded-[34px] border border-white/[.09] bg-[radial-gradient(circle_at_70%_25%,rgba(103,232,249,.13),transparent_26%),radial-gradient(circle_at_25%_70%,rgba(124,58,237,.14),transparent_30%),linear-gradient(145deg,#081326,#03050c)] p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,.7)_0_1px,transparent_1.5px)] [background-size:150px_150px]"/>
        <div className="relative max-w-4xl">
          <a href="/" className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-4 text-[10px] uppercase tracking-[.22em] text-white/45">← Allpha Universe</a>
          <p className="mt-8 text-[9px] uppercase tracking-[.34em] text-cyan-200/65">WEB-16 · CREATE EXPERIENCE</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Bring something to life in the Universe.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-white/45 sm:text-base">One Create surface, many canonical builders. Choose what you want to create, choose its Universe context, then continue into the existing server-authorized flow.</p>
          <div className="mt-7 flex flex-wrap gap-2 text-[9px] text-white/35">{["Intent","Context","Canonical Builder","Authority","Publish / Activate"].map((x,i)=><span key={x} className="rounded-full border border-white/[.08] bg-black/20 px-3 py-2">{String(i+1).padStart(2,"0")} · {x}</span>)}</div>
        </div>
      </header>

      <section className="mt-8">
        <p className="text-[9px] uppercase tracking-[.3em] text-cyan-200/55">01 · Context</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold">Where should this creation live?</h2><p className="mt-2 text-xs text-white/35">Context is navigation/input state only. It never grants ownership, permission, entitlement or Agent authority.</p></div><span className="rounded-full border border-white/[.08] px-3 py-2 text-[9px] text-white/35">Selected: <b className="text-cyan-100/75">{active.label}</b></span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{contexts.map(x=><button key={x.key} type="button" onClick={()=>setContext(x.key)} className={["min-h-20 rounded-2xl border p-4 text-left transition",context===x.key?"border-cyan-300/40 bg-cyan-300/[.08]":"border-white/[.08] bg-white/[.02] hover:border-white/[.16]"].join(" ")}><span className="block text-sm font-medium">{x.label}</span><span className="mt-1 block text-[9px] leading-4 text-white/30">{x.description}</span></button>)}</div>
      </section>

      <section className="mt-10">
        <p className="text-[9px] uppercase tracking-[.3em] text-violet-200/55">02 · Experience</p>
        <h2 className="mt-2 text-2xl font-semibold">What do you want to create?</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-white/35">These cards enter capabilities that already exist. Create Experience does not duplicate Content, Agent, Live, World, Theme, Booth, Community or Workflow engines.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{options.map((o,i)=><a key={o[0]} href={withContext(o[6])} className={`group min-h-[235px] rounded-[28px] border p-5 transition hover:-translate-y-0.5 ${optionClasses[i]}`}><div className="flex items-center justify-between"><span className="rounded-full border border-white/[.08] px-2.5 py-1.5 text-[8px] uppercase tracking-[.16em] text-white/40">{o[1]}</span><span className="text-white/25 group-hover:text-white/70">↗</span></div><h3 className="mt-7 text-xl font-semibold">{o[2]}</h3><p className="mt-3 text-xs leading-5 text-white/38">{o[3]}</p><div className="mt-7 flex items-center justify-between border-t border-white/[.07] pt-4"><span className="text-[9px] uppercase tracking-[.16em] text-white/25">{o[5]}</span><span className="text-[9px] text-cyan-100/55">Open builder →</span></div></a>)}</div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-[28px] border border-white/[.08] bg-white/[.025] p-5 sm:p-7"><p className="text-[9px] uppercase tracking-[.3em] text-cyan-200/55">03 · Canonical creation contract</p><h2 className="mt-2 text-2xl font-semibold">Create is a doorway, not a new engine.</h2><div className="mt-6 space-y-3">{[["Intent","Presentation chooses the desired creation surface."],["Context","The selected Universe context is carried as navigation context."],["Builder","The existing domain builder owns the actual creation form and API contract."],["Authority","FastAPI + Supabase + Policy/Permission/Risk/Approval boundaries remain authoritative."],["Runtime","Agent execution, Live runtime, spatial runtime and publishing stay inside canonical engines."]].map(([a,b])=><div key={a} className="rounded-2xl border border-white/[.07] bg-black/15 p-4"><div className="text-xs font-medium text-white/75">{a}</div><div className="mt-1 text-[10px] leading-5 text-white/32">{b}</div></div>)}</div></div>
        <aside className="rounded-[28px] border border-cyan-300/10 bg-cyan-300/[.035] p-5 sm:p-7"><p className="text-[9px] uppercase tracking-[.3em] text-cyan-200/55">Selected context</p><h2 className="mt-2 text-2xl font-semibold">{active.label}</h2><p className="mt-3 text-xs leading-5 text-white/35">{active.description}</p><div className="mt-6 rounded-2xl border border-white/[.07] bg-black/15 p-4"><p className="text-[9px] uppercase tracking-[.18em] text-white/25">Authority reminder</p><p className="mt-2 text-xs leading-5 text-white/45">This selection does not create a record and does not bypass destination validation, ownership, permission, moderation, policy, risk or approval checks.</p></div></aside>
      </section>

      <section className="mt-10 rounded-[28px] border border-white/[.08] bg-white/[.025] p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] uppercase tracking-[.3em] text-white/25">Creation surfaces remain canonical</p><p className="mt-2 text-sm text-white/55">No synthetic records are generated by this hub. Empty states belong to the destination surface.</p></div><a href={withContext("/agents/create")} className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-xs font-semibold text-slate-950">Start with Agent →</a></div></section>
    </div>
  </main>;
}
