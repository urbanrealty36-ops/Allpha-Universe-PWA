"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Conversation={id:string;conversation_type:string;status:string;created_by_type:string;created_by_id:string;title:string|null;created_at:string;updated_at:string};
type Message={id:string;conversation_id:string;sender_type:string;sender_id:string;body:string;message_type:string;reply_to_message_id:string|null;status:string;created_at:string;updated_at:string};
type Request={id:string;conversation_id:string;requester_type:string;requester_id:string;recipient_type:string;recipient_id:string;status:string;requested_at:string};

export default function MessagingSurface(){
 const [conversations,setConversations]=useState<Conversation[]>([]);
 const [requests,setRequests]=useState<Request[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [targetType,setTargetType]=useState<"user"|"agent">("user");
 const [targetId,setTargetId]=useState("");
 const [newMessage,setNewMessage]=useState("");
 const [error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(true); const [sending,setSending]=useState(false);

 async function load(){
  setLoading(true);setError(null);
  try{
   const [c,r]=await Promise.all([
    apiFetch<{data:Conversation[]}>("/api/v1/messaging/conversations"),
    apiFetch<{data:Request[]}>("/api/v1/messaging/requests")
   ]);
   setConversations(c.data??[]);setRequests(r.data??[]);
   if(!selected && c.data?.[0]) setSelected(c.data[0].id);
  }catch(e){setError(e instanceof Error?e.message:"MESSAGING_LOAD_FAILED")}finally{setLoading(false)}
 }
 async function loadMessages(id:string){
  setSelected(id);setError(null);
  try{const r=await apiFetch<{data:Message[]}>("/api/v1/messaging/conversations/"+id+"/messages?limit=100");setMessages((r.data??[]).reverse());}
  catch(e){setError(e instanceof Error?e.message:"MESSAGES_LOAD_FAILED")}
 }
 useEffect(()=>{void load()},[]);
 useEffect(()=>{if(selected) void loadMessages(selected)},[selected]);
 async function create(e:FormEvent){
  e.preventDefault();if(!targetId.trim())return;setSending(true);setError(null);
  try{
   const r=await apiFetch<{conversation_id:string}>("/api/v1/messaging/conversations/direct",{method:"POST",body:JSON.stringify({target_type:targetType,target_id:targetId.trim(),message:newMessage.trim()||null})});
   setTargetId("");setNewMessage("");await load();await loadMessages(r.conversation_id);
  }catch(e){setError(e instanceof Error?e.message:"CONVERSATION_CREATE_FAILED")}finally{setSending(false)}
 }
 async function send(e:FormEvent){
  e.preventDefault();if(!selected||!newMessage.trim())return;setSending(true);setError(null);
  try{await apiFetch("/api/v1/messaging/conversations/"+selected+"/messages",{method:"POST",body:JSON.stringify({body:newMessage})});setNewMessage("");await loadMessages(selected);await load()}catch(e){setError(e instanceof Error?e.message:"MESSAGE_SEND_FAILED")}finally{setSending(false)}
 }
 async function respond(id:string,action:"accept"|"reject"){
  try{await apiFetch("/api/v1/messaging/requests/"+id+"/respond",{method:"POST",body:JSON.stringify({action})});await load()}catch(e){setError(e instanceof Error?e.message:"REQUEST_RESPONSE_FAILED")}
 }

 return <main className="min-h-screen p-4 sm:p-8"><div className="mx-auto max-w-7xl">
  <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[.24em] text-cyan-300">Messaging & Social Communication</p><h1 className="mt-2 text-4xl font-semibold">Messages</h1><p className="mt-3 text-slate-400">Human ↔ Human, Human ↔ Agent and owned-Agent communication through the authoritative messaging API.</p></div><button onClick={()=>void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Refresh</button></div>
  {error&&<div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Start Direct Conversation</h2><form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_1fr_auto]"><select value={targetType} onChange={e=>setTargetType(e.target.value as "user"|"agent")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"><option value="user">User</option><option value="agent">Agent</option></select><input value={targetId} onChange={e=>setTargetId(e.target.value)} placeholder="Authoritative target UUID" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm" required/><input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Optional first message" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"/><button disabled={sending} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40">Start</button></form><p className="mt-2 text-xs text-slate-500">No target identities are fabricated or suggested. Privacy policy, relationship state and blocks are evaluated server-side.</p></section>

  {requests.length>0&&<section className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-semibold">Conversation Requests</h2><div className="mt-3 space-y-2">{requests.filter(r=>r.status==="pending").map(r=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><span className="text-sm">{r.requester_type}:{r.requester_id}</span><div className="flex gap-2"><button onClick={()=>void respond(r.id,"accept")} className="rounded-lg bg-white px-3 py-2 text-xs text-black">Accept</button><button onClick={()=>void respond(r.id,"reject")} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Reject</button></div></div>)}</div></section>}

  <div className="mt-6 grid min-h-[520px] gap-4 lg:grid-cols-[320px_1fr]">
   <aside className="rounded-2xl border border-white/10 bg-white/[.03] p-3"><h2 className="px-3 py-2 font-semibold">Conversations</h2>{loading?<p className="p-3 text-sm text-slate-500">Loading authoritative conversations…</p>:conversations.length===0?<p className="p-3 text-sm text-slate-500">No conversations yet.</p>:conversations.map(c=><button key={c.id} onClick={()=>void loadMessages(c.id)} className={"mt-1 w-full rounded-xl p-3 text-left "+(selected===c.id?"bg-white/10":"hover:bg-white/5")}><p className="text-sm font-medium">{c.title||c.conversation_type}</p><p className="mt-1 text-xs text-slate-500">{c.status} · {c.id}</p></button>)}</aside>
   <section className="flex min-h-[520px] flex-col rounded-2xl border border-white/10 bg-white/[.03]">
    {!selected?<div className="m-auto text-sm text-slate-500">Select a conversation.</div>:<><div className="border-b border-white/10 p-4"><p className="font-semibold">Conversation</p><p className="text-xs text-slate-500">{selected}</p></div><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.length===0?<p className="text-sm text-slate-500">No messages yet.</p>:messages.map(m=><div key={m.id} className={"max-w-[80%] rounded-2xl p-3 "+(m.status==="deleted"?"opacity-50":"bg-black/20")}><p className="text-[11px] text-slate-500">{m.sender_type}:{m.sender_id} · {m.status}</p><p className="mt-1 whitespace-pre-wrap text-sm">{m.status==="deleted"?"Message deleted":m.body}</p><p className="mt-2 text-[10px] text-slate-600">{new Date(m.created_at).toLocaleString()}</p></div>)}</div><form onSubmit={send} className="border-t border-white/10 p-3"><div className="flex gap-2"><input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Write a message…" className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" disabled={sending}/><button disabled={sending||!newMessage.trim()} className="rounded-xl bg-white px-4 py-3 text-sm text-black disabled:opacity-40">Send</button></div></form></>}
   </section>
  </div>
 </div></main>
}
