"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Graph={subject:{type:string;id:string};interests:Array<any>;passions:Array<any>;habits:Array<any>;goals:Array<any>};

export default function AgentPersonalizationSurface({agentId}:{agentId:string}){
 const [graph,setGraph]=useState<Graph|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 async function load(){setError(null);try{setGraph(await apiFetch<Graph>(`/api/v1/personalization/agents/${agentId}`))}catch(e){setError(e instanceof Error?e.message:"AGENT_PERSONALIZATION_LOAD_FAILED")}}
 useEffect(()=>{void load()},[agentId]);
 async function refresh(){setBusy(true);setError(null);try{await apiFetch("/api/v1/personalization/refresh",{method:"POST",body:JSON.stringify({subject_type:"agent",subject_id:agentId})});await load()}catch(e){setError(e instanceof Error?e.message:"AGENT_PERSONALIZATION_REFRESH_FAILED")}finally{setBusy(false)}}
 return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-7xl">
  <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] uppercase tracking-[.28em] text-cyan-300">Phase 08 · Agent Context</p><h1 className="mt-2 text-4xl font-semibold">Agent Personalization Graph</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Agent-owned personalization is isolated from the human graph. It can inform context and discovery, but never grants authority.</p></div><button onClick={()=>void refresh()} disabled={busy} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy?"Refreshing…":"Refresh Agent Intelligence"}</button></header>
  {error&&<div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
  {!graph?<p className="mt-8 text-sm text-slate-500">Loading authoritative Agent personalization…</p>:<div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
   {[["Interests",graph.interests],["Passions",graph.passions],["Habits",graph.habits],["Goals",graph.goals]].map(([name,items])=><section key={String(name)} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">{String(name)}</h2><p className="mt-1 text-xs text-slate-500">{(items as any[]).length} authoritative records</p><div className="mt-4 space-y-2">{(items as any[]).slice(0,8).map((item:any)=><article key={item.id} className="rounded-xl border border-white/10 p-3"><p className="text-sm text-slate-200">{item.interest?.name||item.name||item.title||item.pattern_key||"Record"}</p><p className="mt-1 text-[10px] text-slate-500">{item.confidence !== undefined ? `confidence ${Number(item.confidence).toFixed(2)}` : item.status || ""}</p></article>)}{!(items as any[]).length&&<p className="text-sm text-slate-600">No records yet.</p>}</div></section>)}
  </div>}
 </div></main>
}