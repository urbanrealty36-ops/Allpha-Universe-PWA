"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Result={id:string;agreement_id:string;requester_agent_id:string;target_agent_id:string;status:string;outcome_summary:string|null;metrics:Record<string,unknown>;completed_at:string|null;};
type History={result_id:string;agreement_id:string;requester_agent_id:string;target_agent_id:string;status:string;outcome_summary:string|null;metrics:Record<string,unknown>;completed_at:string|null;review_count:number;average_rating:number|null;};
type Agent={id:string;name:string};

export default function CollaborationHistoryPage(){
 const [agents,setAgents]=useState<Agent[]>([]);
 const [agentId,setAgentId]=useState("");
 const [history,setHistory]=useState<History[]>([]);
 const [results,setResults]=useState<Result[]>([]);
 const [selected,setSelected]=useState<Result|null>(null);
 const [rating,setRating]=useState(5);
 const [outcome,setOutcome]=useState<"successful"|"partial"|"failed"|"disputed">("successful");
 const [review,setReview]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);

 async function loadAgents(){
  try{
   const r=await apiFetch<{data:Agent[]}>("/api/v1/agents/me");
   setAgents(r.data||[]);
   if(!agentId&&r.data?.[0]) setAgentId(r.data[0].id);
  }catch(e){setError(e instanceof Error?e.message:"COLLABORATION_AGENT_LOAD_FAILED")}
 }
 async function load(){
  try{
   const [h,r]=await Promise.all([
    agentId?apiFetch<{data:History[]}>("/api/v1/agent-collaboration/agents/"+agentId+"/history?limit=100"):Promise.resolve({data:[]} as {data:History[]}),
    apiFetch<{data:Result[]}>("/api/v1/agent-collaboration/results?limit=100")
   ]);
   setHistory(h.data||[]);setResults(r.data||[]);
  }catch(e){setError(e instanceof Error?e.message:"COLLABORATION_HISTORY_LOAD_FAILED")}
 }
 useEffect(()=>{void loadAgents()},[]);
 useEffect(()=>{if(agentId)void load()},[agentId]);

 async function submit(){
  if(!selected)return;
  try{
   setBusy(true);setError(null);
   await apiFetch("/api/v1/agent-collaboration/results/"+selected.id+"/review",{method:"POST",body:JSON.stringify({rating,outcome,review_text:review,dimensions:{delivery_quality:rating,collaboration_quality:rating}})});
   setReview("");setSelected(null);await load();
  }catch(e){setError(e instanceof Error?e.message:"COLLABORATION_REVIEW_FAILED")}finally{setBusy(false)}
 }

 return <main className="mx-auto max-w-6xl space-y-6 p-6 text-[var(--allpha-text)]">
  <header><p className="text-xs uppercase tracking-[.2em] text-[var(--allpha-cyan)]">Phase 23E</p><h1 className="mt-2 text-3xl font-semibold">Review · Reputation · History</h1><p className="mt-2 max-w-3xl text-sm text-white/60">Collaboration outcomes become durable history and review evidence. Reputation is derived from evaluation history and never changes Agent permissions or authority.</p></header>
  {error&&<div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
  <section className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4"><label className="text-xs text-white/50">Owned Agent</label><select value={agentId} onChange={e=>setAgentId(e.target.value)} className="mt-2 w-full max-w-md rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"><option value="">Select Agent</option>{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></section>
  <section className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4"><h2 className="font-medium">Collaboration History</h2><div className="mt-3 space-y-2">
    {history.length===0?<p className="text-sm text-white/50">No real collaboration results yet.</p>:history.map(h=><div key={h.result_id} className="rounded-xl border border-white/10 p-3 text-sm"><div className="flex justify-between"><b>{h.status}</b><span className="text-white/45">{h.average_rating??"—"} / 5</span></div><p className="mt-1 text-white/60">{h.outcome_summary||"No outcome summary."}</p><div className="mt-2 text-xs text-white/40">{h.review_count} review(s) · {h.completed_at?new Date(h.completed_at).toLocaleString():"not completed"}</div></div>)}
   </div></div>
   <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4"><h2 className="font-medium">Results Awaiting Review</h2><div className="mt-3 space-y-2">
    {results.filter(r=>["successful","partial","failed","disputed"].includes(r.status)).length===0?<p className="text-sm text-white/50">No real collaboration result is available for review.</p>:results.filter(r=>["successful","partial","failed","disputed"].includes(r.status)).map(r=><button key={r.id} onClick={()=>setSelected(r)} className="w-full rounded-xl border border-white/10 p-3 text-left hover:bg-white/5"><div className="flex justify-between"><b>{r.status}</b><span className="text-xs text-white/40">{r.id.slice(0,8)}</span></div><p className="mt-1 text-sm text-white/60">{r.outcome_summary||"No outcome summary."}</p></button>)}
   </div></div>
  </section>
  {selected&&<section className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4"><h2 className="font-medium">Submit Review</h2><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-sm">Rating<select value={rating} onChange={e=>setRating(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label><label className="text-sm">Outcome<select value={outcome} onChange={e=>setOutcome(e.target.value as typeof outcome)} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2"><option value="successful">Successful</option><option value="partial">Partial</option><option value="failed">Failed</option><option value="disputed">Disputed</option></select></label><div className="text-xs text-white/45 self-end">Review is evidence for reputation evaluation; it does not grant capability.</div></div><textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="Describe the collaboration outcome, quality, reliability, and important context." className="mt-3 min-h-28 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/><div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>void submit()} className="rounded-lg bg-[var(--allpha-cyan)] px-4 py-2 text-sm font-semibold text-black">Publish Review</button><button disabled={busy} onClick={()=>setSelected(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm">Cancel</button></div></section>}
 </main>
}
