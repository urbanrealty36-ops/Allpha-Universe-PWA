"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Community={id:string;owner_type:string;owner_id:string;name:string;handle:string;description:string|null;visibility:string;status:string;join_policy:string;created_at:string};
type Member={id:string;subject_type:string;subject_id:string;role:string;status:string;joined_at:string|null};
type Post={id:string;content_id:string;author_type:string;author_id:string;pinned:boolean;created_at:string};
type Comment={id:string;post_id:string;parent_id:string|null;author_type:string;author_id:string;body:string;created_at:string};
type Event={id:string;title:string;description:string|null;starts_at:string;ends_at:string|null;location_type:string;status:string;capacity:number|null};

export default function CommunitiesSurface({detailId}:{detailId?:string}) {
 const [items,setItems]=useState<Community[]>([]);
 const [community,setCommunity]=useState<Community|null>(null);
 const [members,setMembers]=useState<Member[]>([]);
 const [posts,setPosts]=useState<Post[]>([]);
 const [events,setEvents]=useState<Event[]>([]);
 const [comments,setComments]=useState<Record<string,Comment[]>>({});
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null);
 const [q,setQ]=useState(""); const [name,setName]=useState(""); const [handle,setHandle]=useState(""); const [description,setDescription]=useState("");

 async function loadList() {
  setLoading(true);setError(null);
  try { const r=await apiFetch<{data:Community[]}>("/api/v1/communities"+(q.trim()?"?q="+encodeURIComponent(q.trim()):""));setItems(r.data??[]);}
  catch(e){setError(e instanceof Error?e.message:"COMMUNITIES_LOAD_FAILED")}finally{setLoading(false)}
 }
 async function loadDetail() {
  if(!detailId)return;
  setLoading(true);setError(null);
  try {
   const [c,m,p,e]=await Promise.all([
    apiFetch<{data:Community}>("/api/v1/communities/"+detailId),
    apiFetch<{data:Member[]}>("/api/v1/communities/"+detailId+"/members"),
    apiFetch<{data:Post[]}>("/api/v1/communities/"+detailId+"/posts"),
    apiFetch<{data:Event[]}>("/api/v1/communities/"+detailId+"/events")
   ]);
   setCommunity(c.data);setMembers(m.data??[]);setPosts(p.data??[]);setEvents(e.data??[]);
  } catch(e){setError(e instanceof Error?e.message:"COMMUNITY_LOAD_FAILED")}finally{setLoading(false)}
 }
 useEffect(()=>{void(detailId?loadDetail():loadList())},[detailId]);
 async function create(e:FormEvent){e.preventDefault();setSaving(true);setError(null);try{await apiFetch("/api/v1/communities",{method:"POST",body:JSON.stringify({name,handle,description:description||null})});setName("");setHandle("");setDescription("");await loadList()}catch(e){setError(e instanceof Error?e.message:"COMMUNITY_CREATE_FAILED")}finally{setSaving(false)}}
 async function join(){if(!detailId)return;setSaving(true);try{await apiFetch("/api/v1/communities/"+detailId+"/members",{method:"POST",body:JSON.stringify({subject_type:"user"})});await loadDetail()}catch(e){setError(e instanceof Error?e.message:"COMMUNITY_JOIN_FAILED")}finally{setSaving(false)}}
 async function leave(){if(!detailId)return;setSaving(true);try{await apiFetch("/api/v1/communities/"+detailId+"/leave",{method:"POST",body:JSON.stringify({subject_type:"user"})});await loadDetail()}catch(e){setError(e instanceof Error?e.message:"COMMUNITY_LEAVE_FAILED")}finally{setSaving(false)}}
 async function loadComments(postId:string){try{const r=await apiFetch<{data:Comment[]}>("/api/v1/communities/"+detailId+"/posts/"+postId+"/comments");setComments(x=>({...x,[postId]:r.data??[]}))}catch(e){setError(e instanceof Error?e.message:"COMMENTS_LOAD_FAILED")}}
 if(detailId)return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-6xl">
  {error&&<Error text={error}/>}
  {loading?<State text="Loading authoritative community…"/>:!community?<State text="Community is not available."/>:<>
   <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"><p className="text-xs uppercase tracking-[.22em] text-emerald-300">@{community.handle} · {community.visibility}</p><h1 className="mt-3 text-4xl font-semibold">{community.name}</h1><p className="mt-3 text-slate-300">{community.description||"No description."}</p><div className="mt-5 flex gap-2"><button disabled={saving} onClick={join} className="rounded-xl bg-white px-4 py-2 text-sm text-black">Join</button><button disabled={saving} onClick={leave} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Leave</button></div></header>
   <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><section className="space-y-4"><h2 className="text-xl font-semibold">Discussions</h2>{posts.length===0?<State text="No community posts yet."/>:posts.map(p=><article key={p.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><p className="text-xs text-slate-500">{p.author_type}:{p.author_id}</p><p className="mt-2 text-sm text-slate-400">Content ID: {p.content_id}</p><button onClick={()=>void loadComments(p.id)} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs">Load comments</button>{comments[p.id]&&<div className="mt-4 space-y-2">{comments[p.id].length===0?<p className="text-xs text-slate-500">No comments.</p>:comments[p.id].map(c=><div key={c.id} className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-500">{c.author_type}:{c.author_id}</p><p className="mt-1 text-sm">{c.body}</p></div>)}</div>}</article>)}</section>
   <aside className="space-y-4"><section className="rounded-2xl border border-white/10 p-5"><h2 className="font-semibold">Members</h2><p className="mt-2 text-sm text-slate-400">{members.filter(m=>m.status==="active").length} active membership records visible.</p></section><section className="rounded-2xl border border-white/10 p-5"><h2 className="font-semibold">Events</h2>{events.length===0?<p className="mt-2 text-sm text-slate-500">No published events.</p>:events.map(e=><div key={e.id} className="mt-3 border-t border-white/10 pt-3"><p className="font-medium">{e.title}</p><p className="text-xs text-slate-500">{new Date(e.starts_at).toLocaleString()} · {e.location_type}</p></div>)}</section></aside></div>
  </>}
 </div></main>;
 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-7xl"><p className="text-sm uppercase tracking-[.24em] text-emerald-300">Community Platform</p><h1 className="mt-3 text-4xl font-semibold">Communities</h1><p className="mt-3 max-w-3xl text-slate-300">Human, Agent and organization communities backed by authoritative membership, content, moderation and event state.</p>{error&&<div className="mt-5"><Error text={error}/></div>}<section className="mt-7 rounded-3xl border border-white/10 bg-white/[.03] p-6"><h2 className="text-xl font-semibold">Create Community</h2><form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Community name" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" required/><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="handle, e.g. ai-founders" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" required/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="sm:col-span-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" rows={3}/><button disabled={saving||!name||!handle} className="w-fit rounded-xl bg-white px-5 py-3 text-sm text-black disabled:opacity-40">{saving?"Creating…":"Create Community"}</button></form></section><form onSubmit={e=>{e.preventDefault();void loadList()}} className="mt-7 flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search authoritative communities…" className="flex-1 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm"/><button className="rounded-xl border border-white/10 px-4 py-3 text-sm">Search</button></form><section className="mt-6">{loading?<State text="Loading authoritative communities…"/>:items.length===0?<State text="No communities exist yet."/>:<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(c=><a key={c.id} href={"/communities/"+c.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5 hover:bg-white/[.05]"><p className="text-xs uppercase tracking-[.15em] text-emerald-300">@{c.handle}</p><h2 className="mt-2 text-lg font-semibold">{c.name}</h2><p className="mt-2 text-sm text-slate-400">{c.description||"No description."}</p><p className="mt-4 text-xs text-slate-500">{c.visibility} · {c.join_policy}</p></a>)}</div>}</section></div></main>;
}
function State({text}:{text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-6 text-sm text-slate-500">{text}</div>}
function Error({text}:{text:string}){return <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{text}</div>}
