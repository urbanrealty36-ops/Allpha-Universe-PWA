"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Workflow={id:string;name:string;slug:string;description:string|null;status:string;trigger_type:string};
type Mission={id:string;name:string;status:string;visibility:string;join_policy:string;workflow_id:string};
type Run={id:string;status:string;command_id:string|null;error_code?:string|null};
type Agent={id:string;name:string;status:string};

const inputClass="rounded-xl border border-white/10 bg-black/20 p-3 text-sm";
const cardClass="rounded-2xl border border-white/10 bg-white/[.03] p-5";

export default function WorkflowMissionSurface(){
 const [workflows,setWorkflows]=useState<Workflow[]>([]),[missions,setMissions]=useState<Mission[]>([]),[runs,setRuns]=useState<Run[]>([]),[agents,setAgents]=useState<Agent[]>([]);
 const [selected,setSelected]=useState<Workflow|null>(null),[versionId,setVersionId]=useState(""),[steps,setSteps]=useState<any[]>([]),[agentId,setAgentId]=useState("");
 const [name,setName]=useState(""),[slug,setSlug]=useState(""),[description,setDescription]=useState("");
 const [stepKey,setStepKey]=useState(""),[stepTitle,setStepTitle]=useState(""),[stepArgs,setStepArgs]=useState('{"messages":[{"role":"user","content":"{{input.prompt}}"}]}');
 const [condition,setCondition]=useState("{}"),[retry,setRetry]=useState('{"max_attempts":1,"backoff_ms":250,"retryable_codes":[]}');
 const [missionName,setMissionName]=useState(""),[missionWorkflowId,setMissionWorkflowId]=useState("");
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);

 async function load(){
  setLoading(true);setError(null);
  try{
   const [w,m,r,a]=await Promise.all([
    apiFetch<{data:Workflow[]}>("/api/v1/workflows"),
    apiFetch<{data:Mission[]}>("/api/v1/workflows/missions"),
    apiFetch<{data:Run[]}>("/api/v1/workflows/runs"),
    apiFetch<{data:Agent[]}>("/api/v1/agents/me")
   ]);
   setWorkflows(w.data||[]);setMissions(m.data||[]);setRuns(r.data||[]);setAgents(a.data||[]);
   if(!agentId && a.data?.length) setAgentId(a.data[0].id);
  }catch(e){setError(e instanceof Error?e.message:"LOAD_FAILED")}finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);

 async function action(fn:()=>Promise<void>){setBusy(true);setError(null);try{await fn();}catch(e){setError(e instanceof Error?e.message:"ACTION_FAILED")}finally{setBusy(false)}}
 async function createWorkflow(e:FormEvent){e.preventDefault();await action(async()=>{const r=await apiFetch<{data:Workflow}>("/api/v1/workflows",{method:"POST",body:JSON.stringify({name,slug,description:description||null})});setName("");setSlug("");setDescription("");setSelected(r.data);await load()})}
 async function newVersion(){if(!selected)return;await action(async()=>{const r=await apiFetch<{data:any}>("/api/v1/workflows/"+selected.id+"/versions",{method:"POST",body:"{}"});setVersionId(r.data.id);setSteps([])})}
 async function addStep(e:FormEvent){e.preventDefault();if(!versionId)return;await action(async()=>{const r=await apiFetch<{data:any}>("/api/v1/workflows/versions/"+versionId+"/steps",{method:"POST",body:JSON.stringify({step_key:stepKey,title:stepTitle,sequence_no:steps.length+1,tool_key:"ai.generate",arguments:JSON.parse(stepArgs),condition:JSON.parse(condition),retry_policy:JSON.parse(retry)})});setSteps(x=>[...x,r.data]);setStepKey("");setStepTitle("")})}
 async function publish(){if(!versionId)return;await action(async()=>{await apiFetch("/api/v1/workflows/versions/"+versionId+"/publish",{method:"POST"});await load()})}
 async function run(){if(!versionId||!agentId)return;await action(async()=>{const r=await apiFetch<{data:any}>("/api/v1/workflows/runs",{method:"POST",body:JSON.stringify({workflow_version_id:versionId,agent_id:agentId,input:{}})});await apiFetch("/api/v1/workflows/runs/"+r.data.id+"/execute",{method:"POST"});await load()})}
 async function trigger(w:Workflow){await action(async()=>{const r=await apiFetch<{data:any}>("/api/v1/workflows/"+w.id+"/trigger",{method:"POST",body:JSON.stringify({trigger_type:w.trigger_type,input:{}})});await apiFetch("/api/v1/workflows/runs/"+r.data.id+"/execute",{method:"POST"});await load()})}
 async function createMission(e:FormEvent){e.preventDefault();await action(async()=>{await apiFetch("/api/v1/workflows/missions",{method:"POST",body:JSON.stringify({name:missionName,workflow_id:missionWorkflowId})});setMissionName("");await load()})}
 async function missionAction(id:string,kind:"publish"|"join"){await action(async()=>{await apiFetch("/api/v1/workflows/missions/"+id+"/"+kind,{method:"POST",body:kind==="join"?JSON.stringify({subject_type:"user"}):undefined});await load()})}

 return <main className="min-h-screen p-5 sm:p-9"><div className="mx-auto max-w-7xl">
  <header className="flex flex-wrap items-end justify-between gap-4">
   <div><p className="text-xs uppercase tracking-[.25em] text-cyan-300">Phase 16</p><h1 className="mt-2 text-4xl font-semibold">Workflow & Mission Engine</h1><p className="mt-3 max-w-3xl text-slate-400">Reusable orchestration above the canonical Phase 15 Agent Runtime. Conditions, bounded retries, approvals and triggers never bypass Agent Policy, Capability, Risk or AI Gateway.</p></div>
   <button onClick={()=>void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Refresh</button>
  </header>
  {error&&<div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
  <div className="mt-7 grid gap-6 lg:grid-cols-2">
   <section className="space-y-6">
    <div className={cardClass}><h2 className="font-semibold">Create Workflow</h2><form onSubmit={createWorkflow} className="mt-4 grid gap-3"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Workflow name" className={inputClass} required/><input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="workflow-slug" className={inputClass} required/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className={inputClass}/><select className={inputClass} disabled><option>Manual / Event / Schedule / Webhook via API trigger</option></select><button disabled={busy} className="rounded-xl bg-white px-4 py-3 text-sm text-black disabled:opacity-40">Create</button></form></div>
    <div className={cardClass}><div className="flex justify-between"><h2 className="font-semibold">Workflows</h2><span className="text-xs text-slate-500">{loading?"Loading…":workflows.length}</span></div><div className="mt-4 space-y-2">{workflows.length===0?<p className="text-sm text-slate-500">No workflow definitions exist.</p>:workflows.map(w=><div key={w.id} className="rounded-xl border border-white/10 p-4"><button onClick={()=>{setSelected(w);setVersionId("");setSteps([])}} className="w-full text-left"><div className="flex justify-between"><span>{w.name}</span><span className="text-xs uppercase text-slate-500">{w.status}</span></div><p className="mt-1 text-xs text-slate-500">{w.trigger_type} · {w.slug}</p></button>{w.status==="active"&&<button onClick={()=>void trigger(w)} disabled={busy} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-40">Trigger & Execute</button>}</div>)}</div></div>
   </section>
   <section className="space-y-6">
    <div className={cardClass}><div className="flex justify-between gap-3"><div><h2 className="font-semibold">Workflow Builder</h2><p className="mt-1 text-sm text-slate-500">{selected?selected.name:"Select a workflow."}</p></div>{selected&&<button onClick={()=>void newVersion()} disabled={busy} className="rounded-xl border border-white/10 px-3 py-2 text-xs">New Version</button>}</div>
    {versionId&&<div className="mt-5 space-y-4"><p className="break-all text-xs text-slate-500">Version: {versionId}</p><form onSubmit={addStep} className="grid gap-3"><input value={stepKey} onChange={e=>setStepKey(e.target.value)} placeholder="Step key" className={inputClass} required/><input value={stepTitle} onChange={e=>setStepTitle(e.target.value)} placeholder="Step title" className={inputClass} required/><textarea value={stepArgs} onChange={e=>setStepArgs(e.target.value)} className="min-h-24 rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-xs" aria-label="Step arguments"/><textarea value={condition} onChange={e=>setCondition(e.target.value)} className="min-h-20 rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-xs" aria-label="Step condition" placeholder='{"path":"step_key.result.text","operator":"contains","value":"approved"}'/><textarea value={retry} onChange={e=>setRetry(e.target.value)} className="min-h-20 rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-xs" aria-label="Retry policy" placeholder='{"max_attempts":2,"backoff_ms":500,"retryable_codes":["AI_PROVIDER_TIMEOUT"]}'/><button disabled={busy} className="rounded-xl border border-white/10 px-4 py-3 text-sm">Add ai.generate Step</button></form><div className="space-y-2">{steps.map(s=><div key={s.id} className="rounded-xl border border-white/10 p-3 text-sm"><div>{s.sequence_no}. {s.title} · {s.tool_key}</div><div className="mt-1 text-xs text-slate-500">Condition + retry policy persisted</div></div>)}</div><button onClick={()=>void publish()} disabled={busy||steps.length===0} className="rounded-xl bg-white px-4 py-3 text-sm text-black disabled:opacity-40">Publish Version</button></div>}</div>
    <div className={cardClass}><h2 className="font-semibold">Run Workflow</h2><div className="mt-4 grid gap-3"><select value={agentId} onChange={e=>setAgentId(e.target.value)} className={inputClass}><option value="">Select owned Agent</option>{agents.filter(a=>!["archived","deleted"].includes(a.status)).map(a=><option key={a.id} value={a.id}>{a.name} · {a.status}</option>)}</select><button onClick={()=>void run()} disabled={busy||!versionId||!agentId} className="rounded-xl bg-white px-4 py-3 text-sm text-black disabled:opacity-40">Prepare & Execute via Agent Runtime</button>{agents.length===0&&<p className="text-xs text-slate-500">No owned Agent is available. The empty state is authoritative; no Agent is fabricated.</p>}</div></div>
    <div className={cardClass}><h2 className="font-semibold">Missions</h2><form onSubmit={createMission} className="mt-4 grid gap-3"><input value={missionName} onChange={e=>setMissionName(e.target.value)} placeholder="Mission name" className={inputClass} required/><select value={missionWorkflowId} onChange={e=>setMissionWorkflowId(e.target.value)} className={inputClass}><option value="">Select active workflow</option>{workflows.filter(w=>w.status==="active").map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select><button disabled={busy||!missionWorkflowId} className="rounded-xl border border-white/10 px-4 py-3 text-sm">Create Mission</button></form><div className="mt-4 space-y-2">{missions.length===0?<p className="text-sm text-slate-500">No missions exist.</p>:missions.map(m=><div key={m.id} className="rounded-xl border border-white/10 p-3"><div className="flex justify-between"><span>{m.name}</span><span className="text-xs uppercase text-slate-500">{m.status}</span></div><div className="mt-2 flex gap-2"><button onClick={()=>void missionAction(m.id,"join")} disabled={busy||m.status!=="open"} className="rounded-lg border border-white/10 px-2 py-1 text-xs">Join</button><button onClick={()=>void missionAction(m.id,"publish")} disabled={busy||m.status!=="draft"} className="rounded-lg border border-white/10 px-2 py-1 text-xs">Publish</button></div></div>)}</div></div>
    <div className={cardClass}><h2 className="font-semibold">Recent Workflow Runs</h2>{runs.length===0?<p className="mt-4 text-sm text-slate-500">No workflow runs exist.</p>:runs.map(r=><div key={r.id} className="mt-2 rounded-xl border border-white/10 p-3 text-xs"><div className="flex justify-between"><span className="break-all">{r.id}</span><span className="uppercase text-slate-500">{r.status}</span></div>{r.error_code&&<p className="mt-1 text-red-300">{r.error_code}</p>}</div>)}</div>
   </section>
  </div>
 </div></main>
}