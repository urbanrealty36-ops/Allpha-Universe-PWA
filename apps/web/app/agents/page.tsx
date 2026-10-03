"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Agent={id:string;name:string;handle?:string|null;status:string;runtime_state:string;description?:string|null;visibility:string};

export default function AgentsPage(){
  const [agents,setAgents]=useState<Agent[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  useEffect(()=>{void (async()=>{try{const r=await apiFetch<{data:Agent[]}>("/api/v1/agents/me");setAgents(r.data||[])}catch(e){setError(e instanceof Error?e.message:"AGENTS_LOAD_FAILED")}finally{setLoading(false)}})()},[]);
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">My Agents</p><h1 className="mt-3 text-4xl font-semibold">AI Agents</h1><p className="mt-2 text-sm text-slate-400">Agent yang benar-benar dimiliki akun Anda.</p></div><a href="/agents/create" className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">＋ Create Agent</a></div>
    {error&&<div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
    {loading?<p className="mt-8 text-slate-400">Memuat…</p>:agents.length===0?<div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-8"><h2 className="text-xl font-semibold">Belum ada Agent</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Buat Agent pertama Anda melalui Agent Factory. Tidak ada Agent sintetis yang ditampilkan.</p><a href="/agents/create" className="mt-5 inline-block rounded-xl border border-cyan-400/30 px-5 py-3 text-sm text-cyan-200">Open Agent Factory</a></div>:<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{agents.map(a=><a key={a.id} href={"/agents/"+a.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-400/30"><div className="flex items-center justify-between"><span className="font-medium">{a.name}</span><span className="text-xs text-slate-500">{a.status}</span></div><p className="mt-2 text-sm text-slate-400">{a.description||"No description"}</p><div className="mt-4 text-xs text-slate-500">{a.visibility} · {a.runtime_state}</div><div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex rounded-lg border border-cyan-300/20 px-3 py-2 text-[10px] text-cyan-200">Memory & Knowledge →</span><a href={"/agents/"+a.id+"/control"} onClick={(e)=>e.stopPropagation()} className="inline-flex rounded-lg border border-white/10 px-3 py-2 text-[10px] text-slate-300">Passport & Authority →</a></div></a>)}</div>}
  </div></main>;
}
