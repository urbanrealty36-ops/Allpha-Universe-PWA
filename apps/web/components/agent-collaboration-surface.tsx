"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Agent={id:string;name:string;handle:string|null};
type Candidate={agent_id:string;name:string;handle:string|null;description:string|null;verification_status:string;capabilities:string[]};
type RequestRow={id:string;purpose:string;status:string;requester_agent_id:string;target_agent_id:string};
type Negotiation={id:string;collaboration_request_id:string;conversation_id:string|null;state:string};
type NegotiationEvent={id:string;actor_agent_id:string;event_type:string;message_id:string|null;created_at:string};

export default function AgentCollaborationSurface(){
 const [agents,setAgents]=useState<Agent[]>([]);
 const [candidates,setCandidates]=useState<Candidate[]>([]);
 const [requests,setRequests]=useState<RequestRow[]>([]);
 const [agentId,setAgentId]=useState("");
 const [purpose,setPurpose]=useState("");
 const [query,setQuery]=useState("");
 const [capability,setCapability]=useState("");
 const [target,setTarget]=useState<Candidate|null>(null);
 const [error,setError]=useState<string|null>(null),[negotiations,setNegotiations]=useState<Negotiation[]>([]),[selectedNegotiation,setSelectedNegotiation]=useState<Negotiation|null>(null),[negotiationEvents,setNegotiationEvents]=useState<NegotiationEvent[]>([]),[negotiationBody,setNegotiationBody]=useState('');

 async function load(){
  try{
   const a=await apiFetch<{data:Agent[]}>("/api/v1/agents/me");
   const r=await apiFetch<{data:RequestRow[]}>("/api/v1/agent-collaboration/requests?limit=50");
   const n=await apiFetch<{data:Negotiation[]}>("/api/v1/agent-collaboration/negotiations?limit=50");
   setAgents(a.data||[]);setRequests(r.data||[]);setNegotiations(n.data||[]);
   if(!agentId&&a.data?.[0])setAgentId(a.data[0].id);
  }catch(e){setError(e instanceof Error?e.message:"COLLABORATION_LOAD_FAILED")}
 }
 async function discover(){
  try{
   const p=new URLSearchParams();if(query)p.set("q",query);if(capability)p.set("capability",capability);
   const r=await apiFetch<{data:Candidate[]}>("/api/v1/agent-collaboration/discover?"+p.toString());
   setCandidates(r.data||[]);
  }catch(e){setError(e instanceof Error?e.message:"COLLABORATION_DISCOVERY_FAILED")}
 }
 async function request(){
  if(!target||!agentId||!purpose.trim())return;
  try{
   await apiFetch("/api/v1/agent-collaboration/requests",{method:"POST",body:JSON.stringify({requester_agent_id:agentId,target_agent_id:target.agent_id,purpose:purpose.trim(),requested_capabilities:capability?[capability]:[],proposed_scope:{}})});
   setPurpose("");setTarget(null);await load();
  }catch(e){setError(e instanceof Error?e.message:"COLLABORATION_REQUEST_FAILED")}
 }
 async function decide(id:string,decision:"accepted"|"rejected"|"cancelled"){
  try{await apiFetch("/api/v1/agent-collaboration/requests/"+id+"/decision",{method:"POST",body:JSON.stringify({decision})});await load()}
  catch(e){setError(e instanceof Error?e.message:"COLLABORATION_DECISION_FAILED")}
 }
 useEffect(()=>{void load()},[]);
 return <main className="mx-auto max-w-6xl space-y-6 p-6 text-[var(--allpha-text)]">
  <header><p className="text-xs uppercase tracking-[.2em] text-[var(--allpha-cyan)]">Phase 23A</p><h1 className="mt-2 text-3xl font-semibold">AI-to-AI Collaboration</h1><p className="mt-2 text-sm text-white/60">Discovery and collaboration requests using real Agent state. Negotiation, approval and execution are later increments.</p></header>
  {error&&<div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
  <section className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4">
    <h2 className="font-medium">Discover Agents</h2>
    <div className="mt-3 flex gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/><input value={capability} onChange={e=>setCapability(e.target.value)} placeholder="Capability" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/><button onClick={()=>void discover()} className="rounded-lg bg-[var(--allpha-cyan)] px-3 py-2 text-sm text-black">Search</button></div>
    <div className="mt-4 space-y-2">{candidates.length===0?<p className="text-sm text-white/50">No eligible public Agents.</p>:candidates.map(c=><button key={c.agent_id} onClick={()=>setTarget(c)} className="w-full rounded-xl border border-white/10 p-3 text-left hover:bg-white/5"><div className="flex justify-between"><b>{c.name}</b><span className="text-xs text-white/45">{c.verification_status}</span></div>{c.handle&&<div className="text-xs text-white/45">@{c.handle}</div>}{c.description&&<p className="mt-1 text-sm text-white/60">{c.description}</p>}<div className="mt-2 text-xs text-white/45">{c.capabilities.join(" · ")}</div></button>)}</div>
   </div>
   <div className="space-y-4">
    <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4"><h2 className="font-medium">Create Request</h2><select value={agentId} onChange={e=>setAgentId(e.target.value)} className="mt-3 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"><option value="">Select your Agent</option>{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><div className="mt-2 text-sm text-white/60">Target: {target?.name||"select from discovery"}</div><textarea value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Purpose" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/><button disabled={!target||!agentId||!purpose.trim()} onClick={()=>void request()} className="mt-2 rounded-lg border border-[var(--allpha-cyan)]/30 px-3 py-2 text-sm disabled:opacity-40">Send Request</button></div>
    <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4"><h2 className="font-medium">Requests</h2><div className="mt-3 space-y-2">{requests.length===0?<p className="text-sm text-white/50">No requests.</p>:requests.map(r=><div key={r.id} className="rounded-xl border border-white/10 p-3 text-sm"><div className="flex justify-between"><span>{r.purpose}</span><span className="text-white/45">{r.status}</span></div>{r.status==="pending"&&<div className="mt-2 flex gap-2"><button onClick={()=>void decide(r.id,"accepted")} className="rounded border border-white/10 px-2 py-1 text-xs">Accept</button><button onClick={()=>void decide(r.id,"rejected")} className="rounded border border-white/10 px-2 py-1 text-xs">Reject</button></div>}</div>)}</div></div>
   </div>
  </section>
 </main>;
}
