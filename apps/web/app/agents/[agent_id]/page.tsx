"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";

export default function AgentDetailPage(){
  const params=useParams<{agent_id:string}>(); const [data,setData]=useState<any>(null); const [error,setError]=useState<string|null>(null); const [command,setCommand]=useState(""); const [running,setRunning]=useState(false); const [runtime,setRuntime]=useState<any>(null);
  useEffect(()=>{if(!params?.agent_id)return;void (async()=>{try{const r=await apiFetch<any>("/api/v1/agents/"+params.agent_id);setData(r)}catch(e){setError(e instanceof Error?e.message:"AGENT_LOAD_FAILED")}})()},[params?.agent_id]);
  if(error)return <main className="min-h-screen bg-slate-950 p-8 text-red-200">{error}</main>;
  if(!data)return <main className="min-h-screen bg-slate-950 p-8 text-slate-400">Memuat Agent…</main>;
  const a=data.agent||{};
  const factory=data.identity?.metadata?.factory_config||{};
  async function runCommand(){
    if(!command.trim()||running)return;
    setRunning(true);setError(null);setRuntime(null);
    try{
      const r=await apiFetch<any>("/api/v1/agents/"+params.agent_id+"/command",{method:"POST",body:JSON.stringify({command:command.trim(),requested_capabilities:[],idempotency_key:crypto.randomUUID()})});
      setRuntime(r);
    }catch(e){setError(e instanceof Error?e.message:"AGENT_RUNTIME_FAILED")}finally{setRunning(false)}
  }
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
    <a href="/agents" className="text-sm text-cyan-300">← My Agents</a>
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8"><p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">AI Agent</p><h1 className="mt-3 text-4xl font-semibold">{a.name}</h1><p className="mt-3 text-slate-400">{a.description||"No description"}</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Type",factory.agent_type_key||"—"],["Character",factory.character_key||"—"],["Mode",factory.experience_mode||"—"],["Context",factory.universe_context?.scope||"—"],["Status",a.status],["Runtime",a.runtime_state],["Visibility",a.visibility],["Authority Policy",a.authority_policy_version]].map(x=><div key={x[0]} className="rounded-xl bg-white/[0.04] p-4"><div className="text-xs uppercase tracking-widest text-slate-500">{x[0]}</div><div className="mt-2 text-sm">{String(x[1])}</div></div>)}</div>
      <section className="mt-7 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5"><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Agent Runtime</p><h2 className="mt-2 text-xl font-semibold">Command Console</h2><p className="mt-2 text-sm text-slate-400">Command dikirim melalui Agent Runtime → Policy/Risk/Approval → AI Gateway. Tidak ada eksekusi langsung dari browser ke OpenAI.</p><textarea className="mt-4 min-h-28 w-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm outline-none focus:border-cyan-400/40" placeholder="Tulis command untuk Agent…" value={command} onChange={e=>setCommand(e.target.value)}/><div className="mt-3 flex items-center gap-3"><button disabled={running||!command.trim()} onClick={()=>void runCommand()} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{running?"Running…":"Run Agent"}</button><span className="text-xs text-slate-500">Real Agent only · no synthetic execution</span></div>{runtime&&<pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-black/30 p-4 text-xs text-slate-400">{JSON.stringify(runtime,null,2)}</pre>}</section>
      <div className="mt-7 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-white/10 p-5"><h2 className="font-semibold">Policy</h2><pre className="mt-3 overflow-auto text-xs text-slate-400">{JSON.stringify(data.policy,null,2)}</pre></section><section className="rounded-2xl border border-white/10 p-5"><h2 className="font-semibold">Character / Persona</h2><pre className="mt-3 overflow-auto text-xs text-slate-400">{JSON.stringify(data.persona,null,2)}</pre></section></div>
    </div>
  </div></main>;
}
