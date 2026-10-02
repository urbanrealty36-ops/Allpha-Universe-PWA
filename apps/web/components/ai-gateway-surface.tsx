"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Model = { id:string; provider_id:string; model_key:string; model_identifier:string; display_name:string; context_window_tokens:number; max_output_tokens:number|null; capabilities:string[]; ai_providers?:{id:string;provider_key:string;display_name:string;adapter:string} };
type Usage = { id:string; event_type:string; model_id:string|null; total_tokens:number|null; estimated_cost_usd:number|null; latency_ms:number|null; created_at:string };
type Health = { status:string; provider_count:number; enabled_model_count:number; routing_policy_count:number; credential_ready:boolean; model_ready:boolean; routing_ready:boolean; providers:Array<{provider_key:string;display_name:string;adapter:string;credential_env_var:string|null;credential_configured:boolean}> };

export default function AIGatewaySurface(){
 const [models,setModels]=useState<Model[]>([]);
 const [usage,setUsage]=useState<Usage[]>([]);\n const [health,setHealth]=useState<Health|null>(null);
 const [prompt,setPrompt]=useState("");
 const [reply,setReply]=useState("");
 const [loading,setLoading]=useState(true);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState<string|null>(null);

 async function load(){
  setLoading(true);setError(null);
  try{
   const [config,events]=await Promise.all([
    apiFetch<{data:Model[]}>("/api/v1/ai/config"),
    apiFetch<{data:Usage[]}>("/api/v1/ai/usage?limit=20")
   ]);
   setModels(config.data??[]);setUsage(events.data??[]);
  }catch(e){setError(e instanceof Error?e.message:"AI_GATEWAY_LOAD_FAILED")}finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);

 async function submit(e:FormEvent){
  e.preventDefault(); if(!prompt.trim()) return;
  setSending(true);setError(null);setReply("");
  try{
   const r=await apiFetch<{data:{text:string}}>("/api/v1/ai/generate",{
    method:"POST",body:JSON.stringify({messages:[{role:"user",content:prompt}]})
   });
   setReply(r.data.text);
   await load();
  }catch(e){setError(e instanceof Error?e.message:"AI_GENERATION_FAILED")}finally{setSending(false)}
 }
 return <main className="min-h-screen p-4 sm:p-8"><div className="mx-auto max-w-6xl">
  <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[.24em] text-cyan-300">Phase 14</p><h1 className="mt-2 text-4xl font-semibold">AI Gateway &amp; Model Router</h1><p className="mt-3 max-w-3xl text-slate-400">Provider-agnostic generation with server-side routing, context budgets, retries, fallback, cost/latency telemetry and policy-aware safety gates.</p></div><button onClick={()=>void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Refresh</button></div>
  {error&&<div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Gateway Readiness</h2><p className="mt-1 text-sm text-slate-500">Server-side diagnostics only; secret values are never returned.</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs">{health?.status??"Loading…"}</span></div>{health&&<div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-500">Credential</p><p className="mt-1 text-sm">{health.credential_ready?"Configured":"Not configured"}</p></div><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-500">Models</p><p className="mt-1 text-sm">{health.enabled_model_count} enabled</p></div><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-500">Routing</p><p className="mt-1 text-sm">{health.routing_policy_count} active policy</p></div></div>}</section>
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Configured Models</h2><p className="mt-1 text-sm text-slate-500">Only authoritative enabled providers/models are shown.</p></div><span className="text-sm text-slate-400">{loading ? "Loading…" : String(models.length) + " configured"}</span></div>{!loading&&models.length===0?<div className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-500">No AI provider/model is configured yet. This is a legitimate not-configured state; no synthetic model is shown.</div>:<div className="mt-4 grid gap-3 md:grid-cols-2">{models.map(m=><div key={m.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{m.display_name}</p><p className="mt-1 text-xs text-slate-500">{m.ai_providers?.display_name??m.provider_id} · {m.model_identifier}</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-[10px]">{m.capabilities?.join(", ")||"no capability metadata"}</span></div><p className="mt-3 text-xs text-slate-500">Context {m.context_window_tokens.toLocaleString()} tokens · Output {m.max_output_tokens?.toLocaleString()??"provider-defined"}</p></div>)}</div>}</section>
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Gateway</h2><form onSubmit={submit} className="mt-4"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="min-h-36 w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm" placeholder={models.length?"Ask through the configured AI Gateway…":"Configure an enabled provider/model before sending a request."} disabled={!models.length||sending}/><div className="mt-3 flex justify-end"><button disabled={!models.length||sending||!prompt.trim()} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{sending?"Routing…":"Generate"}</button></div></form>{reply&&<div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Gateway response</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{reply}</p></div>}</section>
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Recent Usage</h2>{usage.length===0?<p className="mt-3 text-sm text-slate-500">No AI gateway usage recorded yet.</p>:<div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="py-2">Event</th><th>Tokens</th><th>Cost</th><th>Latency</th><th>Time</th></tr></thead><tbody>{usage.map(u=><tr key={u.id} className="border-t border-white/5"><td className="py-2">{u.event_type}</td><td>{u.total_tokens??"—"}</td><td>{u.estimated_cost_usd==null?"—":u.estimated_cost_usd}</td><td>{u.latency_ms==null?"—":String(u.latency_ms) + " ms"}</td><td className="text-xs text-slate-500">{new Date(u.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
 </div></main>
}
