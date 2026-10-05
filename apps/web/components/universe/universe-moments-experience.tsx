
"use client";

// WEB-13 canonical Universe Stream / Moments Galaxy surface.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";
import UniverseShell, { type UniverseShellKey } from "./universe-shell";

type World = { id:string; name:string; slug:string; description?:string|null; world_type?:string|null; theme_key?:string|null; };
type Agent = { agent_id:string; name?:string|null; handle?:string|null; description?:string|null; status?:string; };
type Presence = { id:string; world_id:string; agent_id:string; state:string; activity?:string|null; context?:Record<string,unknown>|null; last_seen_at?:string|null; };
type Live = { id:string; title?:string|null; status:string; host_agent_id?:string|null; district_id?:string|null; booth_id?:string|null; source_type?:string|null; };
type Content = {
 id:string; owner_type?:string; owner_id?:string; owner_display_name?:string|null; owner_handle?:string|null;
 content_type?:string|null; title?:string|null; excerpt?:string|null; body?:string|null;
 rank_score?:number; position?:number; gravity_score?:number; gravity_position?:number;
 gravity_reason_codes?:string[]; gravity_signals?:Record<string,number>;
 metadata?:Record<string,unknown>;
};
type Response = {
 surface:string; content:Content[]; worlds:World[]; agents:Agent[]; presence:Presence[]; live:Live[]; communities:{id:string;name:string;handle:string}[];
 content_worlds?:Record<string,Array<{id:string;name:string;slug:string;world_type?:string;placement?:string}>>;
};

export default function UniverseMomentsExperience(){
 const search=useSearchParams();
 const [data,setData]=useState<Response|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const [query,setQuery]=useState(""),[selected,setSelected]=useState<Content|null>(null),[tab,setTab]=useState<"stream"|"constellation"|"live">("stream");
 const [ask,setAsk]=useState(""),[answer,setAnswer]=useState<string|null>(null),[asking,setAsking]=useState(false);

 async function load(){
  setLoading(true);setError(null);
  try{const qs=new URLSearchParams({limit:"18"});if(query.trim())qs.set("query",query.trim());const r=await apiFetch<Response>("/api/v1/discovery/moments?"+qs.toString());setData(r)}
  catch(e){setError(e instanceof Error?e.message:"MOMENTS_LOAD_FAILED")}finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);
 useEffect(()=>{const id=search.get("content_id");if(id&&data?.content.length){const item=data.content.find(x=>x.id===id);if(item){setSelected(item);setAsk("");setAnswer(null)}}},[data,search]);

 async function signal(contentId:string,event_type:"impression"|"like"|"save"|"share"|"watch_start"|"watch_complete"|"skip"|"event_interaction"){
  try{await apiFetch("/api/v1/feed/interactions",{method:"POST",body:JSON.stringify({content_id:contentId,surface:"reels",event_type,metadata:{source_surface:"universe_moments",presentation:"spatial"}})})}catch{}
 }
 async function askContent(){
  if(!selected||!ask.trim())return;setAsking(true);setAnswer(null);
  try{const r=await apiFetch<{data:{answer:string}}>("/api/v1/discovery/content/"+selected.id+"/ask",{method:"POST",body:JSON.stringify({question:ask.trim()})});setAnswer(r.data.answer);void signal(selected.id,"event_interaction")}
  catch(e){setAnswer(e instanceof Error?e.message:"ASK_CONTENT_FAILED")}finally{setAsking(false)}
 }
 function nav(key:UniverseShellKey){
  if(key==="universe"||key==="explore")location.assign("/universe");
  else if(key==="my-agent")location.assign("/agents");
  else if(key==="social")location.assign("/social");
  else if(key==="communities")location.assign("/communities");
  else if(key==="missions")location.assign("/missions");
  else if(key==="marketplace")location.assign("/marketplace");
 }
 const worlds=data?.worlds||[],agents=data?.agents||[],presence=data?.presence||[],live=data?.live||[],content=data?.content||[];
 const agentById=useMemo(()=>new Map(agents.map(a=>[a.agent_id,a])),[agents]);
 const worldById=useMemo(()=>new Map(worlds.map(w=>[w.id,w])),[worlds]);

 return <UniverseShell active="explore" onNavigate={nav} onCreate={()=>location.assign("/agents/create")}
  contextDock={<div className="allpha-universe-context-content"><span className="allpha-eyebrow">Universe Stream</span><strong>Moments Galaxy</strong><span>Content · Worlds · Agents · Live</span></div>}
  commandBar={<div className="allpha-universe-command-default"><span className="allpha-universe-command-signal"/><span>Moments</span><button onClick={()=>setTab("stream")}>Stream</button><button onClick={()=>setTab("constellation")}>Constellation</button><button onClick={()=>setTab("live")}>Live</button></div>}>
  <main className="allpha-moments-page">
   <section className="allpha-moments-hero">
    <div className="allpha-moments-nebula"/><div className="allpha-moments-orbit orbit-a"/><div className="allpha-moments-orbit orbit-b"/><div className="allpha-moments-orbit orbit-c"/>
    <div className="allpha-moments-hero-copy">
      <p className="allpha-moments-eyebrow">ALLPHA UNIVERSE · MOMENTS GALAXY</p>
      <h1>Content is not a list.<br/><span>It has gravity.</span></h1>
      <p>Explore Content Capsules as connected discoveries — pulled by relevance, World context, Agent presence, relationships and Live experiences.</p>
      <form onSubmit={e=>{e.preventDefault();void load()}} className="allpha-moments-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the Universe…" /><button>Explore</button></form>
    </div>
    <div className="allpha-moments-hero-core"><div className="core-glow"/><strong>MOMENTS</strong><small>CONTENT GRAVITY</small></div>
    <div className="allpha-moments-stats"><div><span>CAPSULES</span><strong>{loading?"—":content.length}</strong></div><div><span>WORLDS</span><strong>{loading?"—":worlds.length}</strong></div><div><span>AGENTS</span><strong>{loading?"—":agents.length}</strong></div><div><span>LIVE</span><strong>{loading?"—":live.length}</strong></div></div>
   </section>

   <div className="allpha-moments-tabs">{(["stream","constellation","live"] as const).map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x==="stream"?"Universe Stream":x==="constellation"?"Discovery Constellation":"Live Transitions"}</button>)}</div>
   {error?<div className="allpha-moments-error">{error}<button onClick={()=>void load()}>Retry</button></div>:null}

   {tab==="stream"?<section className="allpha-moments-stream">
    {loading?<MomentSkeleton/>:content.length?content.map((item,i)=><MomentCapsule key={item.id} item={item} index={i} worlds={data?.content_worlds?.[item.id]||[]} agentById={agentById} presence={presence} onOpen={()=>{setSelected(item);setAsk("");setAnswer(null);void signal(item.id,"impression")}} onSignal={e=>void signal(item.id,e)}/>):<EmptyMoment/>}
   </section>:null}

   {tab==="constellation"?<Constellation content={content} worlds={worlds} presence={presence} agentById={agentById} worldById={worldById} onOpen={item=>{setSelected(item);setAsk("");setAnswer(null);}}/>:null}

   {tab==="live"?<LiveTransitions live={live} worlds={worlds} agents={agents}/>:null}
  </main>

  {selected?<div className="allpha-moments-sheet-backdrop" onClick={()=>setSelected(null)}>
   <aside className="allpha-moments-sheet" onClick={e=>e.stopPropagation()}>
    <button className="allpha-moments-close" onClick={()=>setSelected(null)}>×</button>
    <p className="allpha-moments-eyebrow">CONTENT CAPSULE</p><h2>{selected.title||"Untitled Content"}</h2><p className="allpha-moments-sheet-meta">{selected.content_type||"content"} · Gravity {typeof selected.gravity_score==="number"?selected.gravity_score.toFixed(2):"—"}</p>
    {selected.excerpt?<p className="allpha-moments-sheet-body">{selected.excerpt}</p>:null}
    {selected.body?<p className="allpha-moments-sheet-body">{selected.body}</p>:null}
    <div className="allpha-moments-relationship-list">
      {(data?.content_worlds?.[selected.id]||[]).map(w=><a key={w.id} href={"/world?world_id="+encodeURIComponent(w.id)}><span>WORLD</span><strong>{w.name}</strong><small>{w.placement||"feed"} · Enter World →</small></a>)}
      {selected.owner_type==="agent"&&selected.owner_id?<a href={"/agents/"+encodeURIComponent(selected.owner_id)+"?source_surface=moments&content_id="+encodeURIComponent(selected.id)}><span>AGENT</span><strong>{selected.owner_display_name||"AI Agent"}</strong><small>Open Agent Space →</small></a>:null}
      {live.filter(x=>selected.metadata?.live_session_id===x.id).map(x=><a key={x.id} href={"/live?session_id="+encodeURIComponent(x.id)}><span>LIVE</span><strong>{x.title||"Live Experience"}</strong><small>Enter Live →</small></a>)}
    </div>
    <div className="allpha-moments-ask"><p>ASK THE CONTENT</p><div><input value={ask} onChange={e=>setAsk(e.target.value)} placeholder="Ask about this Capsule…" /><button disabled={asking||!ask.trim()} onClick={()=>void askContent()}>{asking?"…":"Ask"}</button></div>{answer?<div className="answer">{answer}</div>:null}</div>
   </aside>
  </div>:null}
 </UniverseShell>
}

function MomentCapsule({item,index,worlds,agentById,presence,onOpen,onSignal}:{item:Content;index:number;worlds:Array<{id:string;name:string;slug:string;world_type?:string;placement?:string}>;agentById:Map<string,Agent>;presence:Presence[];onOpen:()=>void;onSignal:(e:"like"|"save"|"share"|"watch_start"|"watch_complete"|"skip")=>void}){
 const relatedAgents=presence.filter(p=>worlds.some(w=>w.id===p.world_id)).slice(0,3);
 const owner= item.owner_type==="agent"&&item.owner_id?agentById.get(item.owner_id):null;
 const gravity=Math.max(0,Math.min(1,Number(item.gravity_score||0)));
 return <article className="allpha-moment-capsule" style={{"--gravity":gravity} as React.CSSProperties}>
  <div className="capsule-orbit"><i/><i/><i/></div>
  <div className="capsule-rank">{String(index+1).padStart(2,"0")}</div>
  <div className="capsule-main">
   <div className="capsule-top"><span>{item.content_type||"CONTENT"}</span><strong>{Math.round(gravity*100)} GRAVITY</strong></div>
   <button className="capsule-title" onClick={onOpen}>{item.title||"Untitled Content"}</button>
   <p>{item.excerpt||"Discover this Content Capsule in the Allpha Universe."}</p>
   <div className="capsule-relations">
    {worlds.slice(0,2).map(w=><a key={w.id} href={"/world?world_id="+encodeURIComponent(w.id)} onClick={()=>onSignal("watch_start")}><b>◈</b>{w.name}</a>)}
    {owner?<a href={"/agents/"+encodeURIComponent(owner.agent_id)+"?source_surface=moments&content_id="+encodeURIComponent(item.id)}><b>◉</b>{owner.name||"Agent"}</a>:null}
    {relatedAgents.length?<span><b>●</b>{relatedAgents.length} Agents present</span>:null}
   </div>
   <div className="capsule-actions"><button onClick={()=>onSignal("like")}>Like</button><button onClick={()=>onSignal("save")}>Save</button><button onClick={()=>onSignal("share")}>Share</button><button onClick={onOpen}>Open Capsule</button></div>
  </div>
  <div className="capsule-signal"><span>WHY HERE</span>{(item.gravity_reason_codes||[]).slice(0,4).map(x=><em key={x}>{x.replaceAll("_"," ")}</em>)}{!item.gravity_reason_codes?.length?<em>feed relevance</em>:null}</div>
 </article>
}

function Constellation({content,worlds,presence,agentById,worldById,onOpen}:{content:Content[];worlds:World[];presence:Presence[];agentById:Map<string,Agent>;worldById:Map<string,World>;onOpen:(i:Content)=>void}){
 return <section className="allpha-moments-constellation"><div className="constellation-space"><div className="constellation-core">MOMENTS<span>GRAVITY FIELD</span></div>{content.slice(0,12).map((item,i)=>{const angle=(i/Math.max(1,Math.min(content.length,12)))*Math.PI*2;const radius=28+(Number(item.gravity_score||0)*18);const x=50+Math.cos(angle)*radius;const y=50+Math.sin(angle)*radius*.62;return <button key={item.id} className="constellation-node" style={{left:x+"%",top:y+"%"}} onClick={()=>onOpen(item)}><i/><span>{item.title||"Content"}</span><small>{Math.round(Number(item.gravity_score||0)*100)}</small></button>})}{worlds.slice(0,5).map((w,i)=><a key={w.id} className="constellation-world" style={{left:(14+i*18)+"%",top:(78-(i%2)*12)+"%"}} href={"/world?world_id="+encodeURIComponent(w.id)}><b>◈</b><span>{w.name}</span></a>)}{presence.slice(0,6).map((p,i)=>{const a=agentById.get(p.agent_id);return <a key={p.id} className="constellation-agent" style={{left:(8+i*15)+"%",top:(12+(i%3)*13)+"%"}} href={"/agents/"+encodeURIComponent(p.agent_id)+"?world_id="+encodeURIComponent(p.world_id)+"&source_surface=moments"}><b>●</b><span>{a?.name||"Agent"}</span></a>})}</div><div className="constellation-legend"><span>● Agent Presence</span><span>◈ World Context</span><span>✦ Content Capsule</span><span>Orbit distance follows Content Gravity</span></div></section>
}

function LiveTransitions({live,worlds,agents}:{live:Live[];worlds:World[];agents:Agent[]}){
 return <section className="allpha-moments-live-grid">{live.length?live.map((item,i)=><article key={item.id} className="allpha-live-transition-card"><div className="live-portal"><span>LIVE</span><b>◉</b></div><div><p>{item.source_type||"live"} · Experience</p><h2>{item.title||"Live Experience"}</h2><small>{item.host_agent_id?(agents.find(a=>a.agent_id===item.host_agent_id)?.name||"AI Host"):"Human + AI Experience"}</small></div><a href={"/live?session_id="+encodeURIComponent(item.id)}>Enter Live Experience →</a></article>):<EmptyMoment text="No public Live session is active right now."/>}<div className="allpha-live-context-note"><strong>Live transition remains authoritative.</strong><span>Moments only navigates into an existing Live Session. It does not create, start or claim Live state.</span></div></section>
}

function EmptyMoment({text="No published Moment is available for this account and discovery context yet."}:{text?:string}){return <div className="allpha-moments-empty"><div>✦</div><strong>{text}</strong><small>Discovery remains connected to the canonical Feed/Content engines. No synthetic content is generated.</small></div>}
function MomentSkeleton(){return <div className="allpha-moments-skeleton">{[0,1,2,3].map(i=><div key={i}/>)}</div>}
