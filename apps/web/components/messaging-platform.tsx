"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type Conversation={id:string;conversation_type:string;status:string;created_by_type:string;created_by_id:string;title:string|null;metadata:Record<string,unknown>;created_at:string;updated_at:string};
type ConversationControl={is_agent_conversation:boolean;agent_id?:string;agent_owner_user_id?:string;is_agent_owner:boolean;human_takeover_active:boolean};
type Message={id:string;conversation_id:string;sender_type:string;sender_id:string;body:string;message_type:string;reply_to_message_id:string|null;status:string;client_message_id:string|null;metadata:Record<string,unknown>;created_at:string;updated_at:string};
type Request={id:string;conversation_id:string;requester_type:string;requester_id:string;recipient_type:string;recipient_id:string;status:string;requested_at:string};
type Preference={id:string;subject_type:string;subject_id:string;dm_policy:"open"|"relationships"|"approval"|"invite_only";allow_human_messages:boolean;allow_agent_messages:boolean};
type AgentService={agent_id:string;agent_name:string;agent_handle:string|null;owner_user_id:string;skill_name:string;skill_description:string|null;skill_configuration:Record<string,unknown>;skill_risk_level:string};

const button="rounded-xl border border-white/10 px-3 py-2 text-xs transition hover:bg-white/[.06] disabled:opacity-40";
const input="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/40";

export default function MessagingSurface(){
 const [conversations,setConversations]=useState<Conversation[]>([]),[requests,setRequests]=useState<Request[]>([]),[messages,setMessages]=useState<Message[]>([]);
 const [entryAgentId,setEntryAgentId]=useState<string|null>(null),[entryMode,setEntryMode]=useState<"message"|"ask">("message"),[entryContext,setEntryContext]=useState<Record<string,unknown>>({}),[entrySkill,setEntrySkill]=useState<string|null>(null),[resolvedService,setResolvedService]=useState<Record<string,unknown>|null>(null);
 const entryHandled=useRef(false);
 const [selected,setSelected]=useState<string|null>(null),[targetType,setTargetType]=useState<"user"|"agent">("user"),[targetId,setTargetId]=useState("");
 const [newMessage,setNewMessage]=useState(""),[replyTo,setReplyTo]=useState<Message|null>(null),[editing,setEditing]=useState<Message|null>(null);
 const [error,setError]=useState<string|null>(null),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[conversationControl,setConversationControl]=useState<ConversationControl|null>(null),[takeoverBusy,setTakeoverBusy]=useState(false);
 const [preferences,setPreferences]=useState<Preference[]>([]),[dmPolicy,setDmPolicy]=useState<Preference["dm_policy"]>("open"),[allowHuman,setAllowHuman]=useState(true),[allowAgent,setAllowAgent]=useState(true);
 const [reporting,setReporting]=useState<Message|null>(null),[reportReason,setReportReason]=useState(""),[reportNotes,setReportNotes]=useState("");
 const [agentServices,setAgentServices]=useState<AgentService[]>([]),[serviceSkill,setServiceSkill]=useState(""),[serviceAgent,setServiceAgent]=useState(""),[servicePrompt,setServicePrompt]=useState(""),[serviceMode,setServiceMode]=useState<"answer"|"generate_content">("answer"),[creditBalance,setCreditBalance]=useState(0),[serviceBusy,setServiceBusy]=useState(false),[serviceResult,setServiceResult]=useState<string|null>(null),[serviceStatus,setServiceStatus]=useState<string|null>(null),[serviceContentId,setServiceContentId]=useState<string|null>(null);

 async function loadAgentServices(skill?:string){
  try{
    const r=await apiFetch<{data:AgentService[]}>("/api/v1/messaging/agent-services"+(skill?"?skill="+encodeURIComponent(skill):""));
    setAgentServices(r.data??[]);
    if(!serviceAgent && r.data?.[0]){setServiceAgent(r.data[0].agent_id);setServiceSkill(r.data[0].skill_name);}
  }catch(e){setError(e instanceof Error?e.message:"AGENT_SERVICE_DISCOVERY_FAILED")}
 }
 async function loadCredits(){
  try{const r=await apiFetch<{data:{balance:number}}>("/api/v1/messaging/credits");setCreditBalance(r.data?.balance??0)}catch(e){setError(e instanceof Error?e.message:"AI_CREDIT_LOAD_FAILED")}
 }
 async function runAgentService(e:FormEvent){
  e.preventDefault(); if(!serviceAgent||!serviceSkill||!servicePrompt.trim()) return;
  setServiceBusy(true);setServiceResult(null);setServiceStatus(null);setServiceContentId(null);setError(null);
  try{
    const r=await apiFetch<{data:{conversation_id:string;status:string;message?:string;approval_id?:string;generation?:{text:string};settlement?:{credit_cost:number;generated_content_id?:string|null};content?:{id:string;status:string}|null}}>("/api/v1/messaging/agent-services/generate",{method:"POST",body:JSON.stringify({
      agent_id:serviceAgent,skill_name:serviceSkill,prompt:servicePrompt,mode:serviceMode,
      source_context:{surface:"messaging"},idempotency_key:"msg-"+crypto.randomUUID()
    })});
    setServiceStatus(r.data.status);
    if(r.data.generation?.text) setServiceResult(r.data.generation.text);
    if(r.data.content?.id) setServiceContentId(r.data.content.id);
    setCreditBalance(b=>Math.max(0,b-(r.data.settlement?.credit_cost??0)));
    if(r.data.status==="waiting_approval") setServiceResult(r.data.message||"Menunggu approval dari pemilik Agent sebelum runtime dapat dieksekusi.");
    setServicePrompt("");
    await load(); if(r.data.conversation_id) await loadMessages(r.data.conversation_id);
  }catch(e){setError(e instanceof Error?e.message:"AGENT_SERVICE_GENERATION_FAILED")}finally{setServiceBusy(false)}
 }
 async function load(){
  setLoading(true);setError(null);
  try{
   const [c,r,p]=await Promise.all([
    apiFetch<{data:Conversation[]}>("/api/v1/messaging/conversations"),
    apiFetch<{data:Request[]}>("/api/v1/messaging/requests"),
    apiFetch<{data:Preference[]}>("/api/v1/messaging/preferences")
   ]);
   setConversations(c.data??[]);setRequests(r.data??[]);setPreferences(p.data??[]);
   const own=(p.data??[]).find(x=>x.subject_type==="user");
   if(own){setDmPolicy(own.dm_policy);setAllowHuman(own.allow_human_messages);setAllowAgent(own.allow_agent_messages);}
   if(!selected && c.data?.[0]) setSelected(c.data[0].id);
  }catch(e){setError(e instanceof Error?e.message:"MESSAGING_LOAD_FAILED")}finally{setLoading(false)}
 }
 async function loadMessages(id:string){
  setSelected(id);setError(null);
  try{const r=await apiFetch<{data:Message[]}>("/api/v1/messaging/conversations/"+id+"/messages?limit=100");setMessages((r.data??[]).reverse());}
  catch(e){setError(e instanceof Error?e.message:"MESSAGES_LOAD_FAILED")}
 }
 useEffect(()=>{void load();void loadAgentServices();void loadCredits()},[]);

 useEffect(()=>{
  if(entryHandled.current || typeof window==="undefined") return;
  const params=new URLSearchParams(window.location.search);
  const type=params.get("target_type");
  const id=params.get("target_id");
  if(type!=="agent" || !id) return;
  entryHandled.current=true;
  const mode=params.get("interaction")==="ask" ? "ask" : "message";
  const requestedSkill=params.get("skill");
  const context:Record<string,unknown>={};
  for(const key of ["source_surface","district_id","booth_id","live_session_id","content_id","moment_id"]){
   const value=params.get(key);
   if(value) context[key]=value;
  }
  setEntryAgentId(id);
  setEntryMode(mode);
  setEntryContext(context);
  setEntrySkill(requestedSkill);
  void (async()=>{
   try{
    const r=await apiFetch<{conversation_id:string;status:string}>("/api/v1/messaging/conversations/agent",{
      method:"POST",
      body:JSON.stringify({agent_id:id,interaction_mode:mode,source_context:context}),
    });
    await load();
    if(r.conversation_id) await loadMessages(r.conversation_id);
   }catch(e){
    setError(e instanceof Error?e.message:"AGENT_CONVERSATION_ENTRY_FAILED");
   }
  })();
  if(requestedSkill){
   void apiFetch<{data:Record<string,unknown>}>("/api/v1/messaging/agent-services/resolve?agent_id="+encodeURIComponent(id)+"&skill="+encodeURIComponent(requestedSkill))
    .then(r=>{setResolvedService(r.data);setServiceAgent(id);setServiceSkill(String(r.data.skill_name||requestedSkill));})
    .catch(e=>setError(e instanceof Error?e.message:"AGENT_SKILL_RESOLUTION_FAILED"));
  }
 },[]);
 async function loadConversationControl(id:string){
  try{const r=await apiFetch<{data:ConversationControl}>("/api/v1/messaging/conversations/"+id+"/control");setConversationControl(r.data??null)}
  catch{setConversationControl(null)}
 }
 async function toggleTakeover(){
  if(!selected||!conversationControl?.is_agent_owner)return;
  setTakeoverBusy(true);setError(null);
  try{
   const active=!conversationControl.human_takeover_active;
   const r=await apiFetch<{data:ConversationControl}>("/api/v1/messaging/conversations/"+selected+"/takeover",{method:"POST",body:JSON.stringify({active})});
   setConversationControl(r.data??{...conversationControl,human_takeover_active:active});
  }catch(e){setError(e instanceof Error?e.message:"HUMAN_TAKEOVER_UPDATE_FAILED")}
  finally{setTakeoverBusy(false)}
 }
 useEffect(()=>{if(selected){void loadMessages(selected);void loadConversationControl(selected)}},[selected]);
 useEffect(()=>{
  if(!selected)return;
  const supabase=createSupabaseBrowserClient();
  const channel=supabase.channel("allpha-messages-"+selected)
   .on("postgres_changes",{event:"*",schema:"public",table:"messages",filter:"conversation_id=eq."+selected},()=>void loadMessages(selected))
   .subscribe();
  return()=>{void supabase.removeChannel(channel)};
 },[selected]);

 async function create(e:FormEvent){
  e.preventDefault();if(!targetId.trim())return;setSending(true);setError(null);
  try{
   const r=await apiFetch<{conversation_id:string}>("/api/v1/messaging/conversations/direct",{method:"POST",body:JSON.stringify({target_type:targetType,target_id:targetId.trim(),message:newMessage.trim()||null})});
   setTargetId("");setNewMessage("");await load();await loadMessages(r.conversation_id);
  }catch(e){setError(e instanceof Error?e.message:"CONVERSATION_CREATE_FAILED")}finally{setSending(false)}
 }
 async function send(e:FormEvent){
  e.preventDefault();if(!selected||!newMessage.trim())return;setSending(true);setError(null);
  try{
   if(editing){
    await apiFetch("/api/v1/messaging/messages/"+editing.id,{method:"PATCH",body:JSON.stringify({sender_type:"user",body:newMessage})});
   }else{
    await apiFetch("/api/v1/messaging/conversations/"+selected+"/messages",{method:"POST",body:JSON.stringify({body:newMessage,reply_to:replyTo?.id??null})});
   }
   setNewMessage("");setReplyTo(null);setEditing(null);await loadMessages(selected);await load();
  }catch(e){setError(e instanceof Error?e.message:"MESSAGE_SEND_FAILED")}finally{setSending(false)}
 }
 async function respond(id:string,action:"accept"|"reject"){
  try{await apiFetch("/api/v1/messaging/requests/"+id+"/respond",{method:"POST",body:JSON.stringify({action})});await load()}catch(e){setError(e instanceof Error?e.message:"REQUEST_RESPONSE_FAILED")}
 }
 async function removeMessage(m:Message){
  try{await apiFetch("/api/v1/messaging/messages/"+m.id,{method:"DELETE",body:JSON.stringify({sender_type:"user"})});if(selected)await loadMessages(selected)}catch(e){setError(e instanceof Error?e.message:"MESSAGE_DELETE_FAILED")}
 }
 async function react(m:Message,reaction:string){
  try{await apiFetch("/api/v1/messaging/messages/"+m.id+"/reactions",{method:"POST",body:JSON.stringify({reactor_type:"user",reaction})});}catch(e){setError(e instanceof Error?e.message:"MESSAGE_REACTION_FAILED")}
 }
 async function report(e:FormEvent){
  e.preventDefault();if(!selected||!reporting)return;
  try{await apiFetch("/api/v1/messaging/conversations/"+selected+"/reports",{method:"POST",body:JSON.stringify({message_id:reporting.id,reason_code:reportReason,notes:reportNotes||null})});setReporting(null);setReportReason("");setReportNotes("");}catch(e){setError(e instanceof Error?e.message:"MESSAGE_REPORT_FAILED")}
 }
 async function savePreferences(e:FormEvent){
  e.preventDefault();
  try{await apiFetch("/api/v1/messaging/preferences",{method:"PUT",body:JSON.stringify({subject_type:"user",dm_policy:dmPolicy,allow_human_messages:allowHuman,allow_agent_messages:allowAgent})});await load()}catch(e){setError(e instanceof Error?e.message:"PREFERENCE_UPDATE_FAILED")}
 }
 const activeConversation=useMemo(()=>conversations.find(c=>c.id===selected),[conversations,selected]);

 return <main className="min-h-screen p-4 sm:p-8"><div className="mx-auto max-w-7xl">
  <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[.24em] text-cyan-300">Messaging & Social Communication</p><h1 className="mt-2 text-4xl font-semibold">Messages</h1><p className="mt-3 max-w-3xl text-slate-400">Conversation biasa untuk perkenalan, networking, produk, sales dan negosiasi tidak memanggil Model Router dan tidak memakai AI Credits. AI Credits hanya digunakan saat Human secara eksplisit menjalankan Agent Service untuk tugas AI.</p></div><button onClick={()=>void load()} className={button}>Refresh</button></header>
  {error&&<div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
    <section className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.03] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-cyan-300">AI Services · Paid Boundary</p><h2 className="mt-1 font-semibold">Ask another Human's AI Agent to do a task</h2><p className="mt-2 max-w-3xl text-xs text-slate-400">This path is for research, analytics, design, video, content and other AI work. It enters Agent Runtime → AI Gateway / Model Router and consumes AI Credits. Ordinary conversation below remains free.</p></div><div className="rounded-xl border border-white/10 px-3 py-2 text-xs">AI Credits: <strong>{creditBalance}</strong></div></div><form onSubmit={runAgentService} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]"><select value={serviceSkill} onChange={e=>{setServiceSkill(e.target.value);setServiceAgent("");void loadAgentServices(e.target.value)}} className={input}><option value="">Select Skill</option>{Array.from(new Set(agentServices.map(a=>a.skill_name))).map(s=><option key={s} value={s}>{s}</option>)}</select><select value={serviceAgent} onChange={e=>setServiceAgent(e.target.value)} className={input}><option value="">Select Agent</option>{agentServices.filter(a=>!serviceSkill||a.skill_name===serviceSkill).map(a=><option key={a.agent_id} value={a.agent_id}>{a.agent_name} · {a.skill_name}</option>)}</select><select value={serviceMode} onChange={e=>setServiceMode(e.target.value as "answer"|"generate_content")} className={input}><option value="answer">Ask / Answer</option><option value="generate_content">Generate Content</option></select><textarea value={servicePrompt} onChange={e=>setServicePrompt(e.target.value)} rows={4} placeholder="Contoh: Jelaskan materi kesehatan ini secara edukatif… atau: buatkan content dari video/Content ini…" className={"lg:col-span-3 "+input}/><button disabled={serviceBusy||!serviceAgent||!serviceSkill||!servicePrompt.trim()} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40 lg:col-span-3">{serviceBusy?"Generating…":"Use Agent Service"}</button></form>{(serviceResult||serviceStatus||serviceContentId)&&<div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs uppercase tracking-wider text-slate-500">Agent Service Result</p>{serviceStatus&&<span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">{serviceStatus}</span>}</div>
    {serviceResult&&<p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{serviceResult}</p>}
    {serviceContentId&&<p className="mt-3 text-xs text-cyan-200">Content draft created: {serviceContentId} · edit/review it in Content before publishing.</p>}
  </div>}</section>

 {entryAgentId&&<section className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.03] p-5">
   <p className="text-xs uppercase tracking-[.2em] text-cyan-300">Agent Account · {entryMode.toUpperCase()}</p>
   <h2 className="mt-1 font-semibold">{entryMode==="ask"?"Ask this AI Agent":"Message this AI Agent"}</h2>
   <p className="mt-2 text-xs text-slate-400">Anda masuk dari Agent Account discovery. Ini tetap satu Conversation canonical. Ask biasa tidak memanggil Model Router; AI Service hanya berjalan setelah Human menekan Use Agent Service.</p>{entrySkill&&<div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-900"><strong>Selected Skill:</strong> {entrySkill}{resolvedService&&<> · Level {String(resolvedService.skill_level)} · {String(resolvedService.credit_cost)} AI Credits</>}</div>}
   <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
    <span className="rounded-full border border-white/10 px-2 py-1">Agent: {entryAgentId}</span>
    {Object.entries(entryContext).map(([key,value])=><span key={key} className="rounded-full border border-white/10 px-2 py-1">{key}: {String(value)}</span>)}
   </div>
  </section>}
  <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
   <div>
    <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Start Direct Conversation</h2><form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_1fr_auto]"><select value={targetType} onChange={e=>setTargetType(e.target.value as "user"|"agent")} className={input}><option value="user">User</option><option value="agent">Agent</option></select><input value={targetId} onChange={e=>setTargetId(e.target.value)} placeholder="Authoritative target UUID" className={input} required/><input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Optional first message" className={input}/><button disabled={sending} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40">Start</button></form><p className="mt-2 text-xs text-slate-500">Target identity is never fabricated. Relationship, consent and block rules remain server-authoritative.</p></section>

    {requests.filter(r=>r.status==="pending").length>0&&<section className="mt-5 rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Conversation Requests</h2><div className="mt-3 space-y-2">{requests.filter(r=>r.status==="pending").map(r=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><span className="text-sm">{r.requester_type}:{r.requester_id}</span><div className="flex gap-2"><button onClick={()=>void respond(r.id,"accept")} className="rounded-lg bg-white px-3 py-2 text-xs text-black">Accept</button><button onClick={()=>void respond(r.id,"reject")} className={button}>Reject</button></div></div>)}</div></section>}

    <div className="mt-5 grid min-h-[560px] gap-4 lg:grid-cols-[300px_1fr]">
     <aside className="rounded-2xl border border-white/10 bg-white/[.03] p-3"><h2 className="px-3 py-2 font-semibold">Conversations</h2>{loading?<p className="p-3 text-sm text-slate-500">Loading authoritative conversations…</p>:conversations.length===0?<p className="p-3 text-sm text-slate-500">No conversations yet.</p>:conversations.map(c=><button key={c.id} onClick={()=>void loadMessages(c.id)} className={"mt-1 w-full rounded-xl p-3 text-left "+(selected===c.id?"bg-white/10":"hover:bg-white/5")}><p className="text-sm font-medium">{c.title||c.conversation_type}</p><p className="mt-1 text-xs text-slate-500">{c.status} · {c.id.slice(0,12)}…</p></button>)}</aside>
     <section className="flex min-h-[560px] flex-col rounded-2xl border border-white/10 bg-white/[.03]">
      {!selected?<div className="m-auto text-sm text-slate-500">Select a conversation.</div>:<><div className="border-b border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{activeConversation?.title||"Conversation"}</p><p className="text-xs text-slate-500">{selected} · live updates enabled</p></div>{conversationControl?.is_agent_conversation&&conversationControl.is_agent_owner&&<button onClick={()=>void toggleTakeover()} disabled={takeoverBusy} className={conversationControl.human_takeover_active?"rounded-xl bg-white px-3 py-2 text-xs font-medium text-black":"rounded-xl border border-cyan-300/30 px-3 py-2 text-xs text-cyan-100"}>{takeoverBusy?"Updating…":conversationControl.human_takeover_active?"Release to Agent":"Take over as Human"}</button>}</div><div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">{conversationControl?.human_takeover_active?"Human Owner is handling this conversation. New paid AI Service execution is paused here.":"Conversation mode: free Message / Ask. Sending a message does not call Model Router or consume AI Credits."}</div></div>
       <div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.length===0?<p className="text-sm text-slate-500">No messages yet.</p>:messages.map(m=><div key={m.id} className={"group max-w-[88%] rounded-2xl border border-white/5 p-3 "+(m.status==="deleted"?"opacity-50":"bg-black/20")}>
        <div className="flex items-start justify-between gap-3"><p className="text-[11px] text-slate-500">{m.sender_type}:{m.sender_id.slice(0,10)}… · {m.status}</p><div className="flex gap-1 opacity-0 transition group-hover:opacity-100"><button className={button} onClick={()=>setReplyTo(m)}>Reply</button>{m.sender_type==="user"&&<><button className={button} onClick={()=>{setEditing(m);setNewMessage(m.body)}}>Edit</button><button className={button} onClick={()=>void removeMessage(m)}>Delete</button></>}<button className={button} onClick={()=>void react(m,"like")}>Like</button><button className={button} onClick={()=>setReporting(m)}>Report</button></div></div>
        {m.reply_to_message_id&&<p className="mt-2 text-xs text-cyan-200/70">Reply to message {m.reply_to_message_id.slice(0,10)}…</p>}<p className="mt-1 whitespace-pre-wrap text-sm">{m.status==="deleted"?"Message deleted":m.body}</p><p className="mt-2 text-[10px] text-slate-600">{new Date(m.created_at).toLocaleString()}</p>
       </div>)}</div>
       <form onSubmit={send} className="border-t border-white/10 p-3">{(replyTo||editing)&&<div className="mb-2 flex items-center justify-between rounded-xl bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100"><span>{editing?"Editing":"Replying to"} {editing?.id.slice(0,10)||replyTo?.id.slice(0,10)}…</span><button type="button" onClick={()=>{setReplyTo(null);setEditing(null);setNewMessage("")}} className={button}>Cancel</button></div>}<div className="flex gap-2"><input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder={editing?"Edit message…":replyTo?"Write a reply…":"Write a message…"} className={"flex-1 "+input} disabled={sending}/><button disabled={sending||!newMessage.trim()} className="rounded-xl bg-white px-4 py-3 text-sm text-black disabled:opacity-40">{editing?"Save":replyTo?"Reply":"Send"}</button></div></form></>}
     </section>
    </div>
   </div>

   <aside className="space-y-5">
    <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Communication Privacy</h2><form onSubmit={savePreferences} className="mt-4 space-y-3"><label className="block text-xs text-slate-400">Who can start a conversation</label><select value={dmPolicy} onChange={e=>setDmPolicy(e.target.value as Preference["dm_policy"])} className={"w-full "+input}><option value="open">Open</option><option value="relationships">Relationships</option><option value="approval">Approval required</option><option value="invite_only">Invite only</option></select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowHuman} onChange={e=>setAllowHuman(e.target.checked)}/> Allow Human messages</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowAgent} onChange={e=>setAllowAgent(e.target.checked)}/> Allow Agent messages</label><button className="w-full rounded-xl bg-white px-4 py-3 text-sm text-black">Save Preferences</button></form><p className="mt-3 text-xs text-slate-500">Preferences are enforced by the backend RPC boundary.</p></section>
    <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Communication Boundary</h2><ul className="mt-3 space-y-2 text-xs text-slate-400"><li>• Human owns Agent authority.</li><li>• Realtime does not grant permission.</li><li>• Messages use canonical Conversation state.</li><li>• Reports remain server-authoritative.</li><li>• No synthetic identities or messages.</li></ul></section>
   </aside>
  </div>
 </div>
 {reporting&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={report} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-5"><h2 className="text-lg font-semibold">Report Message</h2><p className="mt-1 text-xs text-slate-500">{reporting.id}</p><input value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Reason code" className={"mt-4 w-full "+input} required/><textarea value={reportNotes} onChange={e=>setReportNotes(e.target.value)} placeholder="Optional notes" rows={4} className={"mt-2 w-full "+input}/><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={()=>setReporting(null)} className={button}>Cancel</button><button className="rounded-xl bg-white px-4 py-2 text-sm text-black">Submit</button></div></form></div>}
 </main>
}
