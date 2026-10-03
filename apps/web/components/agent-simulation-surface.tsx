"use client";
import {FormEvent,useCallback,useEffect,useState} from "react";
import {apiFetch} from "../lib/api";
import {createSupabaseBrowserClient} from "../lib/supabase/client";

type State={id:string;world_id:string;agent_id:string;movement_state:string;position:Record<string,unknown>;rotation:Record<string,unknown>;zone_key:string|null;speed:number;updated_at:string};
type Session={id:string;world_id:string;status:string;tick_rate_hz:number;current_tick:number;last_tick_at:string|null};

const states=["idle","moving","exploring","interacting","collaborating","shopping","negotiating","awaiting_approval","sleeping"];

export default function AgentSimulationSurface(){
 const[worldId,setWorldId]=useState(""),[agentId,setAgentId]=useState(""),[statesData,setStatesData]=useState<State[]>([]),[sessions,setSessions]=useState<Session[]>([]);
 const[session,setSession]=useState<Session|null>(null),[realtimeStatus,setRealtimeStatus]=useState("disconnected"),[movement,setMovement]=useState("idle"),[zone,setZone]=useState(""),[x,setX]=useState("0"),[y,setY]=useState("0"),[z,setZ]=useState("0"),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null);

 const load=useCallback(async()=>{
  if(!worldId)return;
  setLoading(true);setError(null);
  try{
   const [s,ss]=await Promise.all([
    apiFetch<{data:State[]}>(`/api/v1/spatial-runtime/worlds/${worldId}/states`),
    apiFetch<{data:Session[]}>(`/api/v1/spatial-runtime/worlds/${worldId}/sessions`)
   ]);
   setStatesData(s.data||[]);setSessions(ss.data||[]);
   const active=(ss.data||[]).find(v=>["starting","running","paused"].includes(v.status));setSession(active||null);
  }catch(e){setError(e instanceof Error?e.message:"SPATIAL_RUNTIME_LOAD_FAILED")}finally{setLoading(false)}
 }

 useEffect(()=>{if(worldId)void load()},[worldId,load]);

 useEffect(()=>{
  if(!worldId)return;
  const supabase=createSupabaseBrowserClient();
  const channel=supabase.channel(`spatial-runtime:${worldId}`)
   .on("postgres_changes",{event:"*",schema:"public",table:"simulation_sessions",filter:`world_id=eq.${worldId}`},payload=>{
    if(payload.eventType==="DELETE"){
     const deletedId=String((payload.old as {id?:string}).id||"");
     setSessions(prev=>prev.filter(v=>v.id!==deletedId));
     setSession(prev=>prev?.id===deletedId?null:prev);
     return;
    }
    const next=payload.new as Session;
    setSessions(prev=>prev.some(v=>v.id===next.id)?prev.map(v=>v.id===next.id?next:v):[next,...prev]);
    setSession(prev=>{
     if(prev?.id===next.id)return next.status==="stopped"?null:next;
     return prev||(["starting","running","paused"].includes(next.status)?next:null);
    });
   })
   .on("postgres_changes",{event:"*",schema:"public",table:"agent_spatial_states",filter:`world_id=eq.${worldId}`},payload=>{
    if(payload.eventType==="DELETE"){
     const deletedId=String((payload.old as {id?:string}).id||"");
     setStatesData(prev=>prev.filter(v=>v.id!==deletedId));
     return;
    }
    const next=payload.new as State;
    setStatesData(prev=>prev.some(v=>v.id===next.id)?prev.map(v=>v.id===next.id?next:v):[next,...prev]);
   })
   .subscribe((status,err)=>{
    if(status==="SUBSCRIBED")setRealtimeStatus("connected");
    else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){setRealtimeStatus("error");if(err)console.error("SPATIAL_REALTIME_SUBSCRIPTION_ERROR",err)}
    else if(status==="CLOSED")setRealtimeStatus("disconnected");
   });
  return()=>{setRealtimeStatus("disconnected");void supabase.removeChannel(channel)};
 },[worldId]);

 async function enter(e:FormEvent){e.preventDefault();setBusy(true);setError(null);try{
  await apiFetch(`/api/v1/spatial-runtime/worlds/${worldId}/agents/enter`,{method:"POST",body:JSON.stringify({agent_id:agentId,position:{x:Number(x),y:Number(y),z:Number(z)},rotation:{x:0,y:0,z:0},zone_key:zone||null})});await load();
 }catch(e){setError(e instanceof Error?e.message:"SPATIAL_ENTER_FAILED")}finally{setBusy(false)}}

 async function updateState(){
  if(!agentId)return;setBusy(true);setError(null);try{
   await apiFetch(`/api/v1/spatial-runtime/worlds/${worldId}/agents/${agentId}/state`,{method:"PATCH",body:JSON.stringify({agent_id:agentId,movement_state:movement,position:{x:Number(x),y:Number(y),z:Number(z)},rotation:{x:0,y:0,z:0},zone_key:zone||null,speed:movement==="moving"?1:0,metadata:{}})});await load();
  }catch(e){setError(e instanceof Error?e.message:"SPATIAL_UPDATE_FAILED")}finally{setBusy(false)}
 }

 async function exit(){
  setBusy(true);setError(null);try{await apiFetch(`/api/v1/spatial-runtime/worlds/${worldId}/agents/${agentId}`,{method:"DELETE"});await load()}catch(e){setError(e instanceof Error?e.message:"SPATIAL_EXIT_FAILED")}finally{setBusy(false)}
 }

 async function start(){
  setBusy(true);setError(null);try{const r=await apiFetch<Session>(`/api/v1/spatial-runtime/worlds/${worldId}/sessions`,{method:"POST",body:JSON.stringify({tick_rate_hz:10,metadata:{}})});setSession(r);await load()}catch(e){setError(e instanceof Error?e.message:"SIMULATION_START_FAILED")}finally{setBusy(false)}
 }
 async function advanceTick(){
  if(!session)return;setBusy(true);setError(null);try{await apiFetch(`/api/v1/spatial-runtime/sessions/${session.id}/advance`,{method:"POST"});await load()}catch(e){setError(e instanceof Error?e.message:"SIMULATION_ADVANCE_TICK_FAILED")}finally{setBusy(false)}
 }

 async function control(action:"pause"|"resume"|"stop"){
  if(!session)return;setBusy(true);setError(null);try{const r=await apiFetch<Session>(`/api/v1/spatial-runtime/sessions/${session.id}/${action}`,{method:"POST"});setSession(r.status==="stopped"?null:r);await load()}catch(e){setError(e instanceof Error?e.message:"SIMULATION_CONTROL_FAILED")}finally{setBusy(false)}
 }

 return <main className="min-h-screen p-5 sm:p-9"><div className="mx-auto max-w-7xl">
  <header><p className="text-xs uppercase tracking-[.25em] text-cyan-300">Phase 18</p><h1 className="mt-2 text-4xl font-semibold">Agent Simulation & Spatial Runtime</h1><p className="mt-3 max-w-3xl text-slate-400">Authoritative spatial state, Agent presence, interactions and world simulation controls. No synthetic Agents or Worlds are created by this screen.</p></header>
  <section className="mt-7 rounded-2xl border border-white/10 bg-white/[.03] p-5">
   <div className="grid gap-3 md:grid-cols-2"><input value={worldId} onChange={e=>setWorldId(e.target.value)} placeholder="World UUID" className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/><input value={agentId} onChange={e=>setAgentId(e.target.value)} placeholder="Owned Agent UUID" className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/></div>
   <div className="mt-3 flex items-center gap-3"><button onClick={()=>void load()} disabled={!worldId||loading} className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-sm">{loading?"Loading…":"Load Runtime"}</button><span className="text-xs text-slate-500">Realtime: {realtimeStatus}</span></div>
   {error&&<div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
  </section>
  <div className="mt-6 grid gap-6 lg:grid-cols-2">
   <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Agent Spatial State</h2><form onSubmit={enter} className="mt-4 grid gap-3">
    <div className="grid grid-cols-3 gap-2"><input value={x} onChange={e=>setX(e.target.value)} inputMode="decimal" placeholder="X" className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/><input value={y} onChange={e=>setY(e.target.value)} inputMode="decimal" placeholder="Y" className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/><input value={z} onChange={e=>setZ(e.target.value)} inputMode="decimal" placeholder="Z" className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/></div>
    <input value={zone} onChange={e=>setZone(e.target.value)} placeholder="Zone key (optional)" className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/>
    <select value={movement} onChange={e=>setMovement(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">{states.map(s=><option key={s}>{s}</option>)}</select>
    <div className="flex flex-wrap gap-2"><button disabled={busy||!worldId||!agentId} className="rounded-xl bg-white px-4 py-2 text-sm text-black disabled:opacity-40">Enter / Reset State</button><button type="button" onClick={()=>void updateState()} disabled={busy||!worldId||!agentId} className="rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-40">Update State</button><button type="button" onClick={()=>void exit()} disabled={busy||!worldId||!agentId} className="rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-40">Exit</button></div>
   </form>
   <div className="mt-5 space-y-2">{statesData.length===0?<p className="text-sm text-slate-500">No spatial Agent state is available for this World.</p>:statesData.map(s=><div key={s.id} className="rounded-xl border border-white/10 p-3"><div className="flex justify-between gap-3"><span className="font-medium">{s.agent_id}</span><span className="text-xs uppercase text-slate-500">{s.movement_state}</span></div><p className="mt-1 text-xs text-slate-500">zone: {s.zone_key||"—"} · speed: {s.speed}</p><p className="mt-1 text-xs text-slate-500 break-all">position: {JSON.stringify(s.position)}</p></div>)}</div>
   </section>
   <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">World Simulation</h2><p className="mt-2 text-sm text-slate-400">Simulation controls are authoritative. Each Advance Tick is a real server-side deterministic simulation step; no LLM is called per frame and no synthetic Agent state is created.</p>
    <div className="mt-4 flex flex-wrap gap-2">{!session?<button onClick={()=>void start()} disabled={busy||!worldId} className="rounded-xl bg-white px-4 py-2 text-sm text-black disabled:opacity-40">Start Simulation</button>:<><button onClick={()=>void advanceTick()} disabled={busy||session.status!=="running"} className="rounded-xl bg-white px-4 py-2 text-sm text-black disabled:opacity-40">Advance Tick</button><button onClick={()=>void control(session.status==="running"?"pause":"resume")} disabled={busy} className="rounded-xl border border-white/10 px-4 py-2 text-sm">{session.status==="running"?"Pause":"Resume"}</button><button onClick={()=>void control("stop")} disabled={busy} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Stop</button></>}
    </div>
    {session&&<div className="mt-5 rounded-xl border border-white/10 p-4"><div className="flex justify-between"><span>Session</span><span className="text-xs uppercase text-slate-500">{session.status}</span></div><p className="mt-2 text-sm text-slate-400">tick {session.current_tick} · {session.tick_rate_hz} Hz</p></div>}
    <div className="mt-5 space-y-2">{sessions.length===0?<p className="text-sm text-slate-500">No simulation sessions exist.</p>:sessions.map(s=><div key={s.id} className="rounded-xl border border-white/10 p-3"><div className="flex justify-between"><span className="text-sm">{s.id}</span><span className="text-xs uppercase text-slate-500">{s.status}</span></div><p className="mt-1 text-xs text-slate-500">tick {s.current_tick} · {s.tick_rate_hz} Hz</p></div>)}</div>
   </section>
  </div>
 </div></main>
}
