"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Community={id:string;owner_type:string;owner_id:string;name:string;handle:string;description:string|null;visibility:string;status:string;join_policy:string;created_at:string};
type Member={id:string;subject_type:string;subject_id:string;role:string;status:string;joined_at:string|null};
type Post={id:string;content_id:string;author_type:string;author_id:string;pinned:boolean;created_at:string};
type Comment={id:string;post_id:string;parent_id:string|null;author_type:string;author_id:string;body:string;created_at:string};
type Event={id:string;title:string;description:string|null;starts_at:string;ends_at:string|null;location_type:string;status:string;capacity:number|null};
type ContentItem={id:string;title:string|null;content_type:string;status:string};
type Topic={id:string;name:string;slug:string;description:string|null;interest_id:string|null;status:string};
type WorldLink={world_id:string;community_id:string;placement:string;created_at:string};
type ModerationCase={id:string;report_id:string|null;target_type:string;target_id:string;decision:string|null;notes:string|null;created_at:string;decided_at:string|null};

const button="rounded-xl border border-white/10 px-3 py-2 text-xs transition hover:bg-white/[.06] disabled:opacity-40";
const input="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-emerald-300/40";

export default function CommunitiesSurface({detailId}:{detailId?:string}) {
 const [items,setItems]=useState<Community[]>([]);
 const [community,setCommunity]=useState<Community|null>(null);
 const [members,setMembers]=useState<Member[]>([]);
 const [posts,setPosts]=useState<Post[]>([]);
 const [events,setEvents]=useState<Event[]>([]);
 const [topics,setTopics]=useState<Topic[]>([]);
 const [worldLinks,setWorldLinks]=useState<WorldLink[]>([]);
 const [cases,setCases]=useState<ModerationCase[]>([]);
 const [comments,setComments]=useState<Record<string,Comment[]>>({});
 const [content,setContent]=useState<ContentItem[]>([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null);
 const [q,setQ]=useState(""),[name,setName]=useState(""),[handle,setHandle]=useState(""),[description,setDescription]=useState("");
 const [postContentId,setPostContentId]=useState(""),[commentBody,setCommentBody]=useState<Record<string,string>>({});
 const [eventTitle,setEventTitle]=useState(""),[eventDescription,setEventDescription]=useState(""),[eventStarts,setEventStarts]=useState("");
 const [topicName,setTopicName]=useState(""),[topicSlug,setTopicSlug]=useState(""),[topicDescription,setTopicDescription]=useState("");
 const [worldId,setWorldId]=useState(""),[worldPlacement,setWorldPlacement]=useState("community");
 const [report,setReport]=useState<{type:string;id:string}|null>(null),[reportReason,setReportReason]=useState(""),[reportNotes,setReportNotes]=useState("");

 async function loadList(){
  setLoading(true);setError(null);
  try{const r=await apiFetch<{data:Community[]}>("/api/v1/communities"+(q.trim()?"?q="+encodeURIComponent(q.trim()):""));setItems(r.data??[]);}
  catch(e){setError(e instanceof Error?e.message:"COMMUNITIES_LOAD_FAILED")}finally{setLoading(false)}
 }
 async function loadDetail(){
  if(!detailId)return;
  setLoading(true);setError(null);
  try{
   const [c,m,p,e,content,t,w]=await Promise.all([
    apiFetch<{data:Community}>("/api/v1/communities/"+detailId),
    apiFetch<{data:Member[]}>("/api/v1/communities/"+detailId+"/members"),
    apiFetch<{data:Post[]}>("/api/v1/communities/"+detailId+"/posts"),
    apiFetch<{data:Event[]}>("/api/v1/communities/"+detailId+"/events"),
    apiFetch<{data:ContentItem[]}>("/api/v1/content?status=published&limit=100"),
    apiFetch<{data:Topic[]}>("/api/v1/communities/"+detailId+"/topics"),
    apiFetch<{data:WorldLink[]}>("/api/v1/communities/"+detailId+"/world-links")
   ]);
   setCommunity(c.data);setMembers(m.data??[]);setPosts(p.data??[]);setEvents(e.data??[]);setContent(content.data??[]);setTopics(t.data??[]);setWorldLinks(w.data??[]);
   try {
    const mc=await apiFetch<{data:ModerationCase[]}>("/api/v1/communities/"+detailId+"/moderation/cases");
    setCases(mc.data??[]);
   } catch {
    setCases([]);
   }
  }catch(e){setError(e instanceof Error?e.message:"COMMUNITY_LOAD_FAILED")}finally{setLoading(false)}
 }
 useEffect(()=>{void(detailId?loadDetail():loadList())},[detailId]);

 async function create(e:FormEvent){
  e.preventDefault();setSaving(true);setError(null);
  try{await apiFetch("/api/v1/communities",{method:"POST",body:JSON.stringify({name,handle,description:description||null})});setName("");setHandle("");setDescription("");await loadList();}
  catch(e){setError(e instanceof Error?e.message:"COMMUNITY_CREATE_FAILED")}finally{setSaving(false)}
 }
 async function action(path:string,body?:unknown){
  setSaving(true);setError(null);
  try{await apiFetch(path,{method:"POST",body:body===undefined?undefined:JSON.stringify(body)});await loadDetail();}
  catch(e){setError(e instanceof Error?e.message:"COMMUNITY_ACTION_FAILED")}finally{setSaving(false)}
 }
 async function createPost(e:FormEvent){
  e.preventDefault();if(!detailId||!postContentId)return;
  await action("/api/v1/communities/"+detailId+"/posts",{content_id:postContentId,author_type:"user"});
  setPostContentId("");
 }
 async function createComment(e:FormEvent,postId:string){
  e.preventDefault();const body=commentBody[postId]?.trim();if(!detailId||!body)return;
  await action("/api/v1/communities/"+detailId+"/posts/"+postId+"/comments",{post_id:postId,author_type:"user",body});
  setCommentBody(x=>({...x,[postId]:""}));
 }
 async function createEvent(e:FormEvent){
  e.preventDefault();if(!detailId||!eventTitle||!eventStarts)return;
  await action("/api/v1/communities/"+detailId+"/events",{created_by_type:"user",title:eventTitle,description:eventDescription||null,starts_at:new Date(eventStarts).toISOString(),location_type:"online"});
  setEventTitle("");setEventDescription("");setEventStarts("");
 }
 async function createTopic(e:FormEvent){
  e.preventDefault();if(!detailId||!topicName||!topicSlug)return;
  await action("/api/v1/communities/"+detailId+"/topics",{name:topicName,slug:topicSlug,description:topicDescription||null});
  setTopicName("");setTopicSlug("");setTopicDescription("");
 }
 async function linkWorld(e:FormEvent){
  e.preventDefault();if(!detailId||!worldId)return;
  await action("/api/v1/communities/"+detailId+"/world-links",{world_id:worldId,placement:worldPlacement});
  setWorldId("");
 }
 async function decideCase(caseId:string,decision:string){
  if(!detailId)return;
  await action("/api/v1/communities/"+detailId+"/moderation/cases/"+caseId+"/decision",{decision});
 }

 async function submitReport(e:FormEvent){
  e.preventDefault();if(!detailId||!report)return;
  await action("/api/v1/communities/"+detailId+"/reports",{target_type:report.type,target_id:report.id,reason_code:reportReason.trim()||"other",notes:reportNotes||null});
  setReport(null);setReportReason("");setReportNotes("");
 }
 async function loadComments(postId:string){
  if(!detailId)return;
  try{const r=await apiFetch<{data:Comment[]}>("/api/v1/communities/"+detailId+"/posts/"+postId+"/comments");setComments(x=>({...x,[postId]:r.data??[]}));}
  catch(e){setError(e instanceof Error?e.message:"COMMENTS_LOAD_FAILED")}
 }

 if(detailId)return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-7xl">
  {error&&<Error text={error}/>}
  {loading?<State text="Loading authoritative community…"/>:!community?<State text="Community is not available."/>:<>
   <header className="rounded-3xl border border-white/10 bg-white/[.03] p-7">
    <p className="text-xs uppercase tracking-[.22em] text-emerald-300">@{community.handle} · {community.visibility} · {community.join_policy}</p>
    <h1 className="mt-3 text-4xl font-semibold">{community.name}</h1>
    <p className="mt-3 max-w-3xl text-slate-300">{community.description||"No description."}</p>
    <div className="mt-5 flex flex-wrap gap-2">
      <button disabled={saving} onClick={()=>void action("/api/v1/communities/"+detailId+"/members",{subject_type:"user"})} className="rounded-xl bg-white px-4 py-2 text-sm text-black disabled:opacity-40">Join</button>
      <button disabled={saving} onClick={()=>void action("/api/v1/communities/"+detailId+"/leave",{subject_type:"user"})} className={button}>Leave</button>
      <a href="/communities" className={button}>All Communities</a>
    </div>
   </header>

   <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
    <section className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
       <h2 className="font-semibold">Publish existing Content</h2>
       <p className="mt-1 text-xs text-slate-500">Community posts reference canonical Phase 10 Content; this surface never creates a second content source.</p>
       {content.length===0?<State text="No published Content is available yet."/>:<form onSubmit={createPost} className="mt-4 flex flex-col gap-2 sm:flex-row"><select value={postContentId} onChange={e=>setPostContentId(e.target.value)} className={input+" flex-1"}><option value="">Select published Content</option>{content.map(c=><option key={c.id} value={c.id}>{c.title||c.content_type} · {c.id.slice(0,8)}</option>)}</select><button disabled={saving||!postContentId} className="rounded-xl bg-white px-4 py-3 text-sm text-black disabled:opacity-40">Post to Community</button></form>}
      </section>

      <section>
       <h2 className="text-xl font-semibold">Discussions</h2>
       <div className="mt-4 space-y-4">{posts.length===0?<State text="No community posts yet."/>:posts.map(p=><article key={p.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{p.author_type}:{p.author_id}</p><p className="mt-2 text-sm text-slate-400">Canonical Content: {p.content_id}</p></div><button className={button} onClick={()=>setReport({type:"post",id:p.id})}>Report</button></div>
        <button onClick={()=>void loadComments(p.id)} className={"mt-4 "+button}>Load comments</button>
        {comments[p.id]&&<div className="mt-4 space-y-2">{comments[p.id].length===0?<p className="text-xs text-slate-500">No comments.</p>:comments[p.id].map(c=><div key={c.id} className="rounded-xl bg-black/20 p-3"><div className="flex justify-between gap-2"><p className="text-xs text-slate-500">{c.author_type}:{c.author_id}</p><button className="text-[11px] text-slate-500 hover:text-slate-200" onClick={()=>setReport({type:"comment",id:c.id})}>Report</button></div><p className="mt-1 text-sm">{c.body}</p></div>)}</div>}
        <form onSubmit={e=>void createComment(e,p.id)} className="mt-4 flex gap-2"><input value={commentBody[p.id]||""} onChange={e=>setCommentBody(x=>({...x,[p.id]:e.target.value}))} placeholder="Join the discussion…" className={input+" min-w-0 flex-1"}/><button disabled={saving||!(commentBody[p.id]||"").trim()} className={button}>Comment</button></form>
       </article>)}</div>
      </section>
    </section>

    <aside className="space-y-5">
      <section className="rounded-2xl border border-white/10 p-5">
       <h2 className="font-semibold">Topics</h2>
       {topics.length===0?<p className="mt-2 text-sm text-slate-500">No community topics yet.</p>:<div className="mt-3 flex flex-wrap gap-2">{topics.map(t=><span key={t.id} className="rounded-full border border-white/10 px-3 py-1 text-xs">{t.name}</span>)}</div>}
       <form onSubmit={createTopic} className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <input value={topicName} onChange={e=>setTopicName(e.target.value)} placeholder="Topic name" className={"w-full "+input} required/>
        <input value={topicSlug} onChange={e=>setTopicSlug(e.target.value)} placeholder="topic-slug" className={"w-full "+input} required/>
        <textarea value={topicDescription} onChange={e=>setTopicDescription(e.target.value)} placeholder="Description" rows={2} className={"w-full "+input}/>
        <button disabled={saving||!topicName||!topicSlug} className={button}>Create topic</button>
       </form>
      </section>

      <section className="rounded-2xl border border-white/10 p-5">
       <h2 className="font-semibold">World Connection</h2>
       {worldLinks.length===0?<p className="mt-2 text-sm text-slate-500">Community belum terhubung ke World.</p>:<div className="mt-3 space-y-2">{worldLinks.map(w=><div key={w.world_id+"-"+w.placement} className="rounded-xl bg-black/20 p-3 text-xs"><p>World: {w.world_id}</p><p className="text-slate-500">Placement: {w.placement}</p></div>)}</div>}
       <form onSubmit={linkWorld} className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <input value={worldId} onChange={e=>setWorldId(e.target.value)} placeholder="Existing World ID" className={"w-full "+input} required/>
        <input value={worldPlacement} onChange={e=>setWorldPlacement(e.target.value)} placeholder="community" className={"w-full "+input}/>
        <button disabled={saving||!worldId} className={button}>Connect to World</button>
       </form>
      </section>

      <section className="rounded-2xl border border-white/10 p-5">
       <h2 className="font-semibold">Moderation</h2>
       {cases.length===0?<p className="mt-2 text-sm text-slate-500">No moderation cases.</p>:<div className="mt-3 space-y-3">{cases.map(x=><div key={x.id} className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-500">{x.target_type}:{x.target_id}</p><p className="mt-1 text-xs">{x.decision||"open"}</p>{!x.decision&&<div className="mt-2 flex flex-wrap gap-2">{["dismissed","resolved","remove","suspend_member","ban_member","escalated"].map(d=><button key={d} disabled={saving} className={button} onClick={()=>void decideCase(x.id,d)}>{d}</button>)}</div>}</div>)}</div>}
      </section>

      <section className="rounded-2xl border border-white/10 p-5"><h2 className="font-semibold">Members</h2><p className="mt-2 text-sm text-slate-400">{members.filter(m=>m.status==="active").length} active · {members.filter(m=>m.status==="pending").length} pending</p><div className="mt-4 space-y-2">{members.filter(m=>m.status==="pending").map(m=><div key={m.id} className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-400">{m.subject_type}:{m.subject_id}</p><div className="mt-2 flex flex-wrap gap-2">{["approve","reject","suspend","ban"].map(a=><button key={a} disabled={saving} className={button} onClick={()=>void action("/api/v1/communities/"+detailId+"/members/"+m.id+"/action",{action:a})}>{a}</button>)}</div></div>)}</div></section>

      <section className="rounded-2xl border border-white/10 p-5">
       <h2 className="font-semibold">Events</h2>
       {events.length===0?<p className="mt-2 text-sm text-slate-500">No published events.</p>:<div className="mt-3 space-y-3">{events.map(e=><div key={e.id} className="rounded-xl bg-black/20 p-3"><p className="font-medium">{e.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(e.starts_at).toLocaleString()} · {e.location_type}</p>{e.description&&<p className="mt-2 text-sm text-slate-400">{e.description}</p>}<button disabled={saving} className={"mt-3 "+button} onClick={()=>void action("/api/v1/communities/"+detailId+"/events/"+e.id+"/rsvp",{subject_type:"user"})}>RSVP</button><button className={"ml-2 mt-3 "+button} onClick={()=>setReport({type:"event",id:e.id})}>Report</button></div>)}</div>}
       <form onSubmit={createEvent} className="mt-5 space-y-2 border-t border-white/10 pt-4"><p className="text-xs uppercase tracking-[.18em] text-slate-500">Create event</p><input value={eventTitle} onChange={e=>setEventTitle(e.target.value)} placeholder="Event title" className={"w-full "+input} required/><textarea value={eventDescription} onChange={e=>setEventDescription(e.target.value)} placeholder="Description" rows={2} className={"w-full "+input}/><input type="datetime-local" value={eventStarts} onChange={e=>setEventStarts(e.target.value)} className={"w-full "+input} required/><button disabled={saving||!eventTitle||!eventStarts} className="w-full rounded-xl bg-white px-4 py-3 text-sm text-black disabled:opacity-40">Create Event</button></form>
      </section>
    </aside>
   </div>
  </>}
  {report&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={submitReport} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-5"><h2 className="text-lg font-semibold">Report {report.type}</h2><p className="mt-1 text-xs text-slate-500">Target: {report.id}</p><input value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Reason code" className={"mt-4 w-full "+input} required/><textarea value={reportNotes} onChange={e=>setReportNotes(e.target.value)} placeholder="Optional notes" rows={4} className={"mt-2 w-full "+input}/><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={()=>setReport(null)} className={button}>Cancel</button><button disabled={saving} className="rounded-xl bg-white px-4 py-2 text-sm text-black">Submit report</button></div></form></div>}
 </div></main>;

 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-7xl">
  <p className="text-sm uppercase tracking-[.24em] text-emerald-300">Community Platform</p><h1 className="mt-3 text-4xl font-semibold">Communities</h1>
  <p className="mt-3 max-w-3xl text-slate-300">Human, Agent and organization communities backed by authoritative membership, Content, moderation and event state.</p>
  {error&&<div className="mt-5"><Error text={error}/></div>}
  <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.03] p-6"><h2 className="text-xl font-semibold">Create Community</h2><p className="mt-1 text-xs text-slate-500">Creation is server-authorized. No demo community is generated when the database is empty.</p><form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Community name" className={input} required/><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="handle, e.g. ai-founders" className={input} required/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className={"sm:col-span-2 "+input} rows={3}/><button disabled={saving||!name||!handle} className="w-fit rounded-xl bg-white px-5 py-3 text-sm text-black disabled:opacity-40">{saving?"Creating…":"Create Community"}</button></form></section>
  <form onSubmit={e=>{e.preventDefault();void loadList()}} className="mt-7 flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search authoritative communities…" className={"flex-1 "+input}/><button className={button}>Search</button></form>
  <section className="mt-6">{loading?<State text="Loading authoritative communities…"/>:items.length===0?<State text="No communities exist yet."/>:<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(c=><a key={c.id} href={"/communities/"+c.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5 hover:bg-white/[.05]"><p className="text-xs uppercase tracking-[.15em] text-emerald-300">@{c.handle}</p><h2 className="mt-2 text-lg font-semibold">{c.name}</h2><p className="mt-2 text-sm text-slate-400">{c.description||"No description."}</p><p className="mt-4 text-xs text-slate-500">{c.visibility} · {c.join_policy}</p></a>)}</div>}</section>
 </div></main>;
}
function State({text}:{text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-6 text-sm text-slate-500">{text}</div>}
function Error({text}:{text:string}){return <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{text}</div>}
