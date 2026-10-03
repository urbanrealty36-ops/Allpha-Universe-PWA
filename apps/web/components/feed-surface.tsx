"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import AgentServiceAction from "./agent-service-action";

type Surface = "home"|"following"|"for_you"|"reels"|"explore"|"live_now"|"agent"|"knowledge"|"world"|"context";
type Item = {
  id:string; owner_type:string; owner_id:string; owner_display_name:string|null; owner_handle:string|null;
  content_type:string; title:string|null; excerpt:string|null; body:string|null; visibility:string; status:string;
  language_code:string|null; metadata:Record<string,unknown>; published_at:string|null; created_at:string;
  rank_score:number; position:number; reason_codes:(string|null)[];
};

const labels:Record<Surface,string> = {
  home:"Home", following:"Following", for_you:"For You", reels:"Moments", explore:"Explore",
  live_now:"Live Now", agent:"Agent Feed", knowledge:"Knowledge", world:"World Stream", context:"Context"
};

export default function FeedSurface({ surface="home" }: { surface?: Surface }) {
  const [items,setItems]=useState<Item[]>([]);
  const [loading,setLoading]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [query,setQuery]=useState("");
  const [offset,setOffset]=useState(0);
  const [hasMore,setHasMore]=useState(true);

  async function load(reset=true) {
    const nextOffset=reset?0:offset;
    reset?setLoading(true):setLoadingMore(true);
    setError(null);
    try {
      const qs=new URLSearchParams({surface,limit:"20",offset:String(nextOffset)});
      if(query.trim()) qs.set("q",query.trim());
      const r=await apiFetch<{data:Item[]}>("/api/v1/feed?"+qs.toString());
      const next=r.data ?? [];
      setItems(prev=>reset?next:[...prev,...next]);
      setOffset(nextOffset+next.length);
      setHasMore(next.length===20);
    } catch(e) {
      setError(e instanceof Error?e.message:"FEED_LOAD_FAILED");
    } finally {
      reset?setLoading(false):setLoadingMore(false);
    }
  }

  useEffect(()=>{ setOffset(0); setHasMore(true); void load(true); },[surface]);

  async function signal(item:Item,event_type:"like"|"save"|"share"|"skip"|"watch_start"|"watch_complete"|"replay") {
    try {
      await apiFetch("/api/v1/feed/interactions",{method:"POST",body:JSON.stringify({
        content_id:item.id,surface,event_type,position:item.position
      })});
    } catch {}
  }

  async function feedback(item:Item, feedback_type:"not_interested"|"mute_creator"|"hide_topic"|"report") {
    try {
      await apiFetch("/api/v1/feed/feedback",{method:"POST",body:JSON.stringify({
        content_id:item.id,owner_type:item.owner_type,owner_id:item.owner_id,feedback_type
      })});
      setItems(prev=>prev.filter(x=>x.id!==item.id));
    } catch(e) { setError(e instanceof Error?e.message:"FEED_FEEDBACK_FAILED"); }
  }

  const isReels=surface==="reels";
  return (
    <main className={isReels?"min-h-screen bg-black":"min-h-screen p-5 sm:p-8"}>
      <div className={isReels?"mx-auto max-w-xl":"mx-auto max-w-5xl"}>
        {!isReels && <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Allpha Discovery</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{labels[surface]}</h1>
          <p className="mt-2 text-sm text-slate-600">Authoritative content ranked from published data, social relationships, personalization signals, freshness, diversity and feedback.</p>
          <form onSubmit={e=>{e.preventDefault();setOffset(0);void load(true)}} className="mt-5 flex gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search real published content…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm"/>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">Search</button>
          </form>
        </header>}
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading ? <State text="Loading authoritative recommendations…" dark={isReels}/> :
          items.length===0 ? <State text={surface==="live_now"?"No live content is available from the current live-content source.":"No published content matches this surface yet."} dark={isReels}/> :
          <div className={isReels?"snap-y snap-mandatory space-y-0":"space-y-4"}>
            {items.map(item=><FeedCard key={item.id} item={item} surface={surface} onSignal={signal} onFeedback={feedback} reels={isReels}/>)}
          </div>}
        {!loading && items.length>0 && hasMore && <button disabled={loadingMore} onClick={()=>void load(false)} className="mt-6 w-full rounded-xl border border-white/10 px-4 py-3 text-sm">{loadingMore?"Loading…":"Load more"}</button>}
        {!loading && !hasMore && items.length>0 && <p className="py-8 text-center text-xs text-slate-500">End of current authoritative result set.</p>}
      </div>
    </main>
  );
}

function FeedCard({item,surface,onSignal,onFeedback,reels}:{item:Item;surface:Surface;onSignal:(i:Item,e:"like"|"save"|"share"|"skip"|"watch_start"|"watch_complete"|"replay")=>void;onFeedback:(i:Item,e:"not_interested"|"mute_creator"|"hide_topic"|"report")=>void;reels:boolean}) {
  const ref=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    if(!reels) return;
    const el=ref.current;if(!el)return;
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)) void onSignal(item,"watch_start");
    },{threshold:.65});
    observer.observe(el);return()=>observer.disconnect();
  },[reels,item.id]);
  return <article ref={(el)=>{ ref.current=el; }} className={reels?"min-h-[100svh] snap-start flex flex-col justify-end p-5 pb-10":"rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"}>
    <div className={reels?"rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur":" "}>
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.16em] text-cyan-700">{item.content_type}</p><p className="mt-1 text-xs text-slate-500">{item.owner_display_name || item.owner_handle || "Author identity unavailable"}</p></div>
        <span className="text-[10px] text-slate-500">rank {Number(item.rank_score).toFixed(2)}</span>
      </div>
      <h2 className={reels?"mt-3 text-3xl font-semibold text-slate-950":"mt-3 text-2xl font-semibold text-slate-950"}>{item.title||"Untitled content"}</h2>
      {item.excerpt && <p className="mt-3 text-slate-700">{item.excerpt}</p>}
      {item.body && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {item.reason_codes.filter(Boolean).map(x=><span key={x} className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-500">{x}</span>)}
      </div>
      {item.content_type==="video" && <p className="mt-5 text-xs text-slate-500">Media delivery is shown only when an authorized media URL is available; no media URL is fabricated.</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={()=>onSignal(item,"like")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">Like</button>
        <button onClick={()=>onSignal(item,"save")} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Save</button>
        <button onClick={()=>onSignal(item,"share")} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Share</button>
        <button onClick={()=>onFeedback(item,"not_interested")} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Not interested</button>
        <button onClick={()=>onFeedback(item,"report")} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">Report</button>\n      <div className="basis-full"><AgentServiceAction contentId={item.id} contentContext={{content_type:item.content_type,title:item.title,excerpt:item.excerpt,surface}}/></div>
      </div>
    </div>
  </article>;
}

function State({text,dark=false}:{text:string;dark?:boolean}) {
  return <div className={(dark?"border-slate-700 bg-slate-900 text-slate-300":"border-slate-200 bg-white text-slate-500")+" rounded-2xl border p-6 text-sm"}>{text}</div>;
}
