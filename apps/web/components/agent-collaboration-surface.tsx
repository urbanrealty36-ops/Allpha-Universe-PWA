"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Agent={id:string;name:string;handle:string|null};
type Candidate={agent_id:string;name:string;handle:string|null;description:string|null;verification_status:string;capabilities:string[]};
type RequestRow={id:string;purpose:string;status:string;requester_agent_id:string;target_agent_id:string;requested_capabilities:string[]};
type Negotiation={id:string;collaboration_request_id:string;conversation_id:string|null;state:string};
type Agreement={id:string;negotiation_id:string;state:string;purpose:string;requested_capabilities:string[];risk_level:string;expires_at:string|null;approved_at:string|null};

function parseObject(value:string,label:string):Record<string,unknown>{
  if(!value.trim()) return {};
  const parsed=JSON.parse(value);
  if(!parsed || Array.isArray(parsed) || typeof parsed!=="object") throw new Error(label+" must be a JSON object.");
  return parsed as Record<string,unknown>;
}

export default function AgentCollaborationSurface(){
 const [agents,setAgents]=useState<Agent[]>([]);
 const [candidates,setCandidates]=useState<Candidate[]>([]);
 const [requests,setRequests]=useState<RequestRow[]>([]);
 const [negotiations,setNegotiations]=useState<Negotiation[]>([]);
 const [agreements,setAgreements]=useState<Agreement[]>([]);
 const [agentId,setAgentId]=useState("");
 const [purpose,setPurpose]=useState("");
 const [query,setQuery]=useState("");
 const [capability,setCapability]=useState("");
 const [target,setTarget]=useState<Candidate|null>(null);
 const [agreementNegotiationId,setAgreementNegotiationId]=useState("");
 const [agreementPurpose,setAgreementPurpose]=useState("");
 const [scopeText,setScopeText]=useState("{}");
 const [constraintsText,setConstraintsText]=useState("{}");
 const [termsText,setTermsText]=useState("{}");
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);

 async function load(){
  try{
   const [a,r,n,g]=await Promise.all([
    apiFetch<{data:Agent[]}>("/api/v1/agents/me"),
    apiFetch<{data:RequestRow[]}>("/api/v1/agent-collaboration/requests?limit=50"),
    apiFetch<{data:Negotiation[]}>("/api/v1/agent-collaboration/negotiations?limit=50"),
    apiFetch<{data:Agreement[]}>("/api/v1/agent-collaboration/agreements?limit=50"),
   ]);
   setAgents(a.data||[]);setRequests(r.data||[]);setNegotiations(n.data||[]);setAgreements(g.data||[]);
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
   setBusy(true);
   await apiFetch("/api/v1/agent-collaboration/requests",{method:"POST",body:JSON.stringify({
    requester_agent_id:agentId,target_agent_id:target.agent_id,purpose:purpose.trim(),
    requested_capabilities:capability?[capability]:[],proposed_scope:{}
   })});
   setPurpose("");setTarget(null);await load();
  }catch(e){setError(e instanceof Error?e.message:"COLLABORATION_REQUEST_FAILED")}finally{setBusy(false)}
 }
 async function decideRequest(id:string,decision:"accepted"|"rejected"|"cancelled"){
  try{setBusy(true);await apiFetch("/api/v1/agent-collaboration/requests/"+id+"/decision",{method:"POST",body:JSON.stringify({decision})});await load()}
  catch(e){setError(e instanceof Error?e.message:"COLLABORATION_DECISION_FAILED")}finally{setBusy(false)}
 }
 async function createAgreement(){
  if(!agreementNegotiationId||!agreementPurpose.trim())return;
  try{
   setBusy(true);setError(null);
   await apiFetch("/api/v1/agent-collaboration/agreements",{method:"POST",body:JSON.stringify({
    negotiation_id:agreementNegotiationId,purpose:agreementPurpose.trim(),
    requested_capabilities:[],agreed_scope:parseObject(scopeText,"Scope"),
    constraints:parseObject(constraintsText,"Constraints"),terms:parseObject(termsText,"Terms")
   })});
   setAgreementPurpose("");setAgreementNegotiationId("");await load();
  }catch(e){setError(e instanceof Error?e.message:"AGREEMENT_CREATE_FAILED")}finally{setBusy(false)}
 }
 async function decideAgreement(id:string,decision:"approved"|"rejected"){
  try{setBusy(true);await apiFetch("/api/v1/agent-collaboration/agreements/"+id+"/approval",{method:"POST",body:JSON.stringify({decision})});await load()}
  catch(e){setError(e instanceof Error?e.message:"AGREEMENT_APPROVAL_FAILED")}finally{setBusy(false)}
 }
 async function cancelAgreement(id:string){
  try{setBusy(true);await apiFetch("/api/v1/agent-collaboration/agreements/"+id+"/cancel",{method:"POST",body:JSON.stringify({})});await load()}
  catch(e){setError(e instanceof Error?e.message:"AGREEMENT_CANCEL_FAILED")}finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);

 const openNegotiations=negotiations.filter(n=>n.state==="open"||n.state==="agreed");

 return <main className="mx-auto max-w-6xl space-y-6 p-6 text-[var(--allpha-text)]">
  <header>
   <p className="text-xs uppercase tracking-[.2em] text-[var(--allpha-cyan)]">Phase 23C</p>
   <h1 className="mt-2 text-3xl font-semibold">AI-to-AI Collaboration</h1>
   <p className="mt-2 text-sm text-white/60">Human approval and declarative collaboration agreements. Authority remains in Agent Policy, Capability and Risk controls.</p>
  </header>
  {error&&<div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}

  <section className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4">
    <h2 className="font-medium">Discover Agents</h2>
    <div className="mt-3 flex gap-2">
     <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/>
     <input value={capability} onChange={e=>setCapability(e.target.value)} placeholder="Capability" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/>
     <button disabled={busy} onClick={()=>void discover()} className="rounded-lg bg-[var(--allpha-cyan)] px-3 py-2 text-sm text-black">Search</button>
    </div>
    <div className="mt-4 space-y-2">
     {candidates.length===0?<p className="text-sm text-white/50">No eligible public Agents.</p>:candidates.map(c=>
      <button key={c.agent_id} onClick={()=>setTarget(c)} className="w-full rounded-xl border border-white/10 p-3 text-left hover:bg-white/5">
       <div className="flex justify-between"><b>{c.name}</b><span className="text-xs text-white/45">{c.verification_status}</span></div>
       {c.handle&&<div className="text-xs text-white/45">@{c.handle}</div>}
       {c.description&&<p className="mt-1 text-sm text-white/60">{c.description}</p>}
       <div className="mt-2 text-xs text-white/45">{c.capabilities.join(" · ")}</div>
      </button>)}
    </div>
   </div>

   <div className="space-y-4">
    <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4">
     <h2 className="font-medium">Create Collaboration Request</h2>
     <select value={agentId} onChange={e=>setAgentId(e.target.value)} className="mt-3 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm">
      <option value="">Select your Agent</option>{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
     </select>
     <div className="mt-2 text-sm text-white/60">Target: {target?.name||"select from discovery"}</div>
     <textarea value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Purpose" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/>
     <button disabled={busy||!target||!agentId||!purpose.trim()} onClick={()=>void request()} className="mt-2 rounded-lg border border-[var(--allpha-cyan)]/30 px-3 py-2 text-sm disabled:opacity-40">Send Request</button>
    </div>

    <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4">
     <h2 className="font-medium">Requests</h2>
     <div className="mt-3 space-y-2">
      {requests.length===0?<p className="text-sm text-white/50">No requests.</p>:requests.map(r=>
       <div key={r.id} className="rounded-xl border border-white/10 p-3 text-sm">
        <div className="flex justify-between gap-3"><span>{r.purpose}</span><span className="text-white/45">{r.status}</span></div>
        {r.status==="pending"&&<div className="mt-2 flex gap-2"><button disabled={busy} onClick={()=>void decideRequest(r.id,"accepted")} className="rounded border border-white/10 px-2 py-1 text-xs">Accept</button><button disabled={busy} onClick={()=>void decideRequest(r.id,"rejected")} className="rounded border border-white/10 px-2 py-1 text-xs">Reject</button></div>}
       </div>)}
     </div>
    </div>
   </div>
  </section>

  <section className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4">
    <h2 className="font-medium">Negotiation → Agreement</h2>
    <p className="mt-1 text-xs text-white/50">Only accepted negotiations can become an agreement. The agreement is declarative; it does not grant authority.</p>
    <select value={agreementNegotiationId} onChange={e=>setAgreementNegotiationId(e.target.value)} className="mt-3 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm">
     <option value="">Select open negotiation</option>{openNegotiations.map(n=><option key={n.id} value={n.id}>{n.id.slice(0,8)} · {n.state}</option>)}
    </select>
    <input value={agreementPurpose} onChange={e=>setAgreementPurpose(e.target.value)} placeholder="Agreement purpose" className="mt-2 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"/>
    <textarea value={scopeText} onChange={e=>setScopeText(e.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs" placeholder='Scope JSON: {"deliverable":"..."}'/>
    <textarea value={constraintsText} onChange={e=>setConstraintsText(e.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs" placeholder='Constraints JSON: {"deadline":"..."}'/>
    <textarea value={termsText} onChange={e=>setTermsText(e.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs" placeholder='Terms JSON: {"financial_commitment":false}'/>
    <button disabled={busy||!agreementNegotiationId||!agreementPurpose.trim()} onClick={()=>void createAgreement()} className="mt-2 rounded-lg bg-[var(--allpha-cyan)] px-3 py-2 text-sm text-black disabled:opacity-40">Create Agreement & Request Approval</button>
   </div>

   <div className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-4">
    <h2 className="font-medium">Collaboration Agreements</h2>
    <div className="mt-3 space-y-2">
     {agreements.length===0?<p className="text-sm text-white/50">No agreements.</p>:agreements.map(a=>
      <div key={a.id} className="rounded-xl border border-white/10 p-3 text-sm">
       <div className="flex justify-between gap-3"><b>{a.purpose}</b><span className="text-white/45">{a.state}</span></div>
       <div className="mt-1 text-xs text-white/45">Risk: {a.risk_level} · Negotiation: {a.negotiation_id.slice(0,8)}</div>
       <div className="mt-2 text-xs text-white/55">Capabilities: {a.requested_capabilities.length? a.requested_capabilities.join(", "):"none declared"}</div>
       {a.state==="pending_approval"&&<div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>void decideAgreement(a.id,"approved")} className="rounded border border-emerald-400/30 px-2 py-1 text-xs">Approve</button><button disabled={busy} onClick={()=>void decideAgreement(a.id,"rejected")} className="rounded border border-red-400/30 px-2 py-1 text-xs">Reject</button><button disabled={busy} onClick={()=>void cancelAgreement(a.id)} className="rounded border border-white/10 px-2 py-1 text-xs">Cancel</button></div>}
       {a.state==="approved"&&<button disabled={busy} onClick={()=>void cancelAgreement(a.id)} className="mt-3 rounded border border-white/10 px-2 py-1 text-xs">Cancel Agreement</button>}
      </div>)}
    </div>
   </div>
  </section>
 </main>;
}
