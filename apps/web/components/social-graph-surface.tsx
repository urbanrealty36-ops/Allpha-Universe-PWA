"use client";

import UniversePrimaryNavigation from "./universe/universe-primary-navigation";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Subject={subject_type:"user"|"agent";subject_id:string;display_name:string;handle?:string|null;description?:string|null};
type Relation={id:string;source_type:string;source_id:string;target_type:string;target_id:string;relationship_type:string;status:string;updated_at:string};
type Block={id:string;blocked_type:string;blocked_id:string};

export default function SocialGraphSurface(){
 const [subjects,setSubjects]=useState<Subject[]>([]),[relations,setRelations]=useState<Relation[]>([]),[blocks,setBlocks]=useState<Block[]>([]),[notifications,setNotifications]=useState<any[]>([]),[mentions,setMentions]=useState<any[]>([]);
 const [query,setQuery]=useState(""),[tab,setTab]=useState("discover"),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(true);
 const key=(t:string,id:string)=>t+":"+id;
 async function load(search=query){
  setLoading(true);setError(null);
  try{
   const suffix=search.trim()?"?query="+encodeURIComponent(search.trim()):"";
   const [d,r,b,n,m]=await Promise.all([
    apiFetch<{data:Subject[]}>("/api/v1/social/discover"+suffix),
    apiFetch<{data:Relation[]}>("/api/v1/social/relationships"),
    apiFetch<{data:Block[]}>("/api/v1/social/blocks"),
    apiFetch<{data:any[]}>("/api/v1/social/notifications?unread_only=true"),
    apiFetch<{data:any[]}>("/api/v1/social/mentions")
   ]);
   setSubjects(d.data||[]);setRelations(r.data||[]);setBlocks(b.data||[]);setNotifications(n.data||[]);setMentions(m.data||[]);
  }catch(e){setError(e instanceof Error?e.message:"SOCIAL_GRAPH_LOAD_FAILED")}finally{setLoading(false)}
 }
 useEffect(()=>{void load("")},[]);
 async function action(path:string,init?:RequestInit){
  try{await apiFetch(path,init);await load()}catch(e){setError(e instanceof Error?e.message:"SOCIAL_OPERATION_FAILED")}finally{setBusy(null)}
 }
 async function follow(s:Subject){
  const k=key(s.subject_type,s.subject_id);setBusy(k);
  await action("/api/v1/social/relationships",{method:"POST",body:JSON.stringify({source_type:"user",target_type:s.subject_type,target_id:s.subject_id,relationship_type:"follow",context:{source:"social_graph"}})});
 }
 async function block(s:Subject){
  const k=key(s.subject_type,s.subject_id);setBusy(k);
  await action("/api/v1/social/blocks",{method:"POST",body:JSON.stringify({blocker_type:"user",blocked_type:s.subject_type,blocked_id:s.subject_id})});
 }
 async function respond(id:string,a:"accept"|"reject"){setBusy(id);await action("/api/v1/social/relationships/"+id+"/"+a,{method:"POST"})}
 async function readNotification(id:string){try{await apiFetch("/api/v1/social/notifications/"+id+"/read",{method:"POST"});setNotifications(x=>x.filter(n=>n.id!==id))}catch(e){setError(e instanceof Error?e.message:"SOCIAL_NOTIFICATION_FAILED")}}
 const active=relations.filter(r=>r.status==="active"),requests=relations.filter(r=>r.status==="pending");
 return <main className="allpha-product-surface allpha-social-shell min-h-screen text-white">
  <UniversePrimaryNavigation /><div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
  <header className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
   <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">Phase 09 · Social Graph</p>
   <h1 className="mt-3 text-4xl font-semibold">People, Agents & Relationships</h1>
   <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Discover public Humans and AI Agents, follow them, manage relationship requests, and control your social graph.</p>
   <form className="mt-6 flex gap-2" onSubmit={(e:FormEvent)=>{e.preventDefault();void load(query)}}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari manusia atau AI Agent…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none"/><button className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">Search</button></form>
  </header>
  {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
  <div className="mt-6 flex flex-wrap gap-2">{[["discover","Discover"],["network","My Network"],["requests","Requests · "+requests.length],["mentions","Mentions · "+mentions.length],["blocked","Blocked"]].map(([v,l])=><button key={v} onClick={()=>setTab(v)} className={"rounded-xl border px-4 py-2 text-sm "+(tab===v?"border-cyan-300/40 bg-cyan-300/10 text-cyan-200":"border-white/10 text-slate-400")}>{l}</button>)}</div>
  {notifications.length>0&&<section className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Notifications</h2><span className="text-xs text-cyan-200">{notifications.length} unread</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{notifications.slice(0,6).map(n=><button key={n.id} onClick={()=>void readNotification(n.id)} className="rounded-xl border border-white/10 p-3 text-left text-sm">{String(n.notification_type).replaceAll("_"," ")}<span className="mt-1 block text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</span></button>)}</div></section>}
  {loading?<p className="mt-8 text-slate-400">Memuat Social Graph…</p>:tab==="discover"?<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.length===0?<div className="rounded-2xl border border-white/10 p-7 text-sm text-slate-400">Tidak ada subject publik yang cocok.</div>:subjects.map(s=>{const k=key(s.subject_type,s.subject_id),rel=relations.find(r=>r.target_type===s.subject_type&&r.target_id===s.subject_id),isBlocked=blocks.some(b=>key(b.blocked_type,b.blocked_id)===k);return <article key={k} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{s.subject_type==="agent"?"AI Agent":"Human"}</span><h2 className="mt-2 font-semibold">{s.display_name}</h2><p className="text-xs text-slate-500">{s.handle?"@"+s.handle:s.subject_id}</p><p className="mt-4 min-h-10 text-sm text-slate-400">{s.description||"Public Allpha subject."}</p><div className="mt-5 flex flex-wrap gap-2">{!isBlocked&&!rel&&<button disabled={busy===k} onClick={()=>void follow(s)} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950">{busy===k?"…":"Follow"}</button>}{!isBlocked&&rel?.status==="active"&&<button disabled={busy===rel.id} onClick={()=>{setBusy(rel.id);void action("/api/v1/social/relationships/"+rel.id+"/revoke",{method:"POST"})}} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Unfollow</button>}{!isBlocked&&<button disabled={busy===k} onClick={()=>void block(s)} className="rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-200">Block</button>}{isBlocked&&<span className="text-xs text-red-200">Blocked</span>}</div></article>})}</section>:tab==="mentions"?<section className="mt-8 grid gap-3">{mentions.length===0?<div className="rounded-2xl border border-white/10 p-7 text-sm text-slate-400">Belum ada mention untuk akun ini.</div>:mentions.map(m=><div key={m.id} className="rounded-2xl border border-white/10 p-5"><div className="text-[10px] uppercase tracking-widest text-cyan-300">Mention</div><div className="mt-2 text-sm">{m.source_type} · {m.source_id}</div><div className="mt-1 text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</div></div>)}</section>:tab==="blocked"?<section className="mt-8 grid gap-3">{blocks.length===0?<div className="rounded-2xl border border-white/10 p-7 text-sm text-slate-400">Belum ada subject yang diblokir.</div>:blocks.map(b=><div key={b.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-4"><span className="text-sm">{b.blocked_type} · {b.blocked_id}</span><button disabled={busy===b.id} onClick={()=>{setBusy(b.id);void action("/api/v1/social/blocks/"+b.blocked_type+"/"+b.blocked_id,{method:"DELETE"})}} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Unblock</button></div>)}</section>:<section className="mt-8 grid gap-3">{(tab==="requests"?requests:active).length===0?<div className="rounded-2xl border border-white/10 p-7 text-sm text-slate-400">Belum ada relationship pada tab ini.</div>:(tab==="requests"?requests:active).map(r=><div key={r.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><span className="text-[10px] uppercase tracking-widest text-cyan-300">{r.relationship_type}</span><div className="mt-1 text-sm">{r.target_type} · {r.target_id}</div><div className="mt-1 text-xs text-slate-500">{r.status} · {new Date(r.updated_at).toLocaleString()}</div></div>{tab==="requests"?<div className="flex gap-2"><button onClick={()=>void respond(r.id,"accept")} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950">Accept</button><button onClick={()=>void respond(r.id,"reject")} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Reject</button></div>:<button onClick={()=>{setBusy(r.id);void action("/api/v1/social/relationships/"+r.id+"/revoke",{method:"POST"})}} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Remove</button>}</div>)}</section>}
  <footer className="mt-8 rounded-2xl border border-white/10 p-5 text-xs leading-5 text-slate-500">Canonical flow: Web → FastAPI → Supabase Social Graph. Follow is an explicit personalization signal. Presentation state never changes identity, authority, permissions, risk, ownership, or billing.</footer>
 </div></main>
}
