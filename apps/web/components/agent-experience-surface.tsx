
"use client";
import dynamic from "next/dynamic";
import {useCallback,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {createSupabaseBrowserClient} from "../lib/supabase/client";
import {apiFetch} from "../lib/api";
import UniverseShell,{type UniverseShellKey} from "./universe/universe-shell";
import {normalizeWorldScene,type WorldScene} from "../lib/world-engine/scene-schema";

const Renderer=dynamic(()=>import("./world/allpha-world-renderer"),{ssr:false,loading:()=> <div className="allpha-agent-render-loading">Preparing Agent Space…</div>});
type Agent={id:string;name:string;handle?:string|null;description?:string|null;status:string;runtime_state:string;is_owned_by_viewer?:boolean};
type Skill={id:string;name:string;category:string;skill_level:number;quality_score:number;usage_count:number;description?:string|null};
type Profile={agent:Agent;skills:Skill[];reputation:{quality_score:number;verified_usage_count:number;challenge_level:number}};
type World={id:string;name:string;theme_key?:string|null;description?:string|null};
type Theme={id:string;name:string;slug:string;catalog_key?:string|null;tokens?:Record<string,unknown>;world_schema?:unknown};
type Spatial={id:string;agent_id:string;movement_state:string;position?:{x:number;y:number;z:number};rotation?:{x:number;y:number;z:number};zone_key?:string|null;speed?:number};
type Character={agent_id?:string;character_key?:string|null;characterKey?:string|null;asset_source?:string|null;source?:string|null;contract?:Record<string,unknown>|null};
type Msg={id:string;sender_type:"user"|"agent";body:string;created_at:string};

export default function AgentExperienceSurface({agentId}:{agentId:string}){
 const q=useSearchParams(), worldParam=q.get("world_id"), district=q.get("district_id"), booth=q.get("booth_id"), source=q.get("source_surface")||"agent";
 const [profile,setProfile]=useState<Profile|null>(null),[world,setWorld]=useState<World|null>(null),[theme,setTheme]=useState<Theme|null>(null),[scene,setScene]=useState<WorldScene|null>(null),[spatial,setSpatial]=useState<Spatial|null>(null),[character,setCharacter]=useState<Character|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[lowPower,setLowPower]=useState(false),[tab,setTab]=useState<"identity"|"skills"|"conversation">("identity");
 const [conversationId,setConversationId]=useState<string|null>(null),[messages,setMessages]=useState<Msg[]>([]),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState<string|null>(null),[realtime,setRealtime]=useState("connecting");

 const load=useCallback(async()=>{
  setError(null);
  try{
   const p=await apiFetch<{data:Profile}>("/api/v1/agent-catalog/accounts/"+encodeURIComponent(agentId)); setProfile(p.data);
   let wid=worldParam;
   if(!wid&&district){try{const r=await apiFetch<{data:{district?:{world_id?:string}}}>("/api/v1/themes/world-runtime/districts/"+encodeURIComponent(district)+"/composition");wid=r.data?.district?.world_id||null}catch{}}
   if(!wid&&booth){try{const b=await apiFetch<{data:{district_id?:string}}>("/api/v1/booths/"+encodeURIComponent(booth));if(b.data?.district_id){const r=await apiFetch<{data:{district?:{world_id?:string}}}>("/api/v1/themes/world-runtime/districts/"+encodeURIComponent(b.data.district_id)+"/composition");wid=r.data?.district?.world_id||null}}catch{}}
   if(!wid){setWorld(null);setTheme(null);setScene(null);setSpatial(null);setLoading(false);return}
   const [wr,tr,sr,cr]=await Promise.allSettled([
    apiFetch<{data:World}>("/api/v1/universe/worlds/"+encodeURIComponent(wid)),
    apiFetch<{data:Theme[]}>("/api/v1/themes/world-runtime/catalog"),
    apiFetch<{data:{spatial_state?:Spatial}}>("/api/v1/spatial-runtime/worlds/"+encodeURIComponent(wid)+"/agents/"+encodeURIComponent(agentId)+"/context"),
    apiFetch<{data:Character[]}>("/api/v1/live/character-runtime-catalog?agent_id="+encodeURIComponent(agentId))
   ]);
   if(wr.status==="fulfilled"){setWorld(wr.value.data);if(tr.status==="fulfilled"){const t=tr.value.data.find(x=>x.slug===wr.value.data.theme_key||x.id===wr.value.data.theme_key||x.catalog_key===wr.value.data.theme_key)||tr.value.data[0]||null;setTheme(t);setScene(t?.world_schema?normalizeWorldScene(t.world_schema):null)}}else{setWorld(null);setTheme(null);setScene(null)}
   setSpatial(sr.status==="fulfilled"?sr.value.data?.spatial_state||null:null);
   setCharacter(cr.status==="fulfilled"?(cr.value.data||[]).find(x=>x.agent_id===agentId)||cr.value.data?.[0]||null:null);
  }catch(e){setError(e instanceof Error?e.message:"AGENT_EXPERIENCE_LOAD_FAILED")}finally{setLoading(false)}
 },[agentId,worldParam,district,booth]);

 useEffect(()=>{void load()},[load]);
 useEffect(()=>{let alive=true;let timer=setInterval(()=>{if(alive)void load()},5000);let ch:any=null;try{const s=createSupabaseBrowserClient();ch=s.channel("allpha-agent-"+agentId).on("postgres_changes",{event:"*",schema:"public",table:"agent_spatial_states",filter:"agent_id=eq."+agentId},()=>{if(alive)void load()}).subscribe((st:string)=>{if(st==="SUBSCRIBED")setRealtime("live");else if(["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(st))setRealtime("polling")})}catch{setRealtime("polling")}return()=>{alive=false;clearInterval(timer);if(ch)void ch.unsubscribe()}},[agentId,load]);

 async function openConversation(){
  setTab("conversation");setBusy(true);setStatus(null);
  try{const r=await apiFetch<{data:{conversation_id:string}}>("/api/v1/messaging/conversations/agent",{method:"POST",body:JSON.stringify({agent_id:agentId,interaction_mode:"message",source_context:{source_surface:source,world_id:world?.id||worldParam,district_id:district,booth_id:booth},client_message_id:crypto.randomUUID()})});setConversationId(r.data.conversation_id);await loadMessages(r.data.conversation_id)}catch(e){setStatus(e instanceof Error?e.message:"CONVERSATION_FAILED")}finally{setBusy(false)}
 }
 async function loadMessages(id:string){try{const r=await apiFetch<{data:Msg[]}>("/api/v1/messaging/conversations/"+encodeURIComponent(id)+"/messages?limit=80");setMessages((r.data||[]).reverse())}catch{}}
 async function send(){if(!draft.trim()||!conversationId||busy)return;setBusy(true);try{await apiFetch("/api/v1/messaging/conversations/"+encodeURIComponent(conversationId)+"/messages",{method:"POST",body:JSON.stringify({sender_type:"user",body:draft.trim(),client_message_id:crypto.randomUUID(),metadata:{source_surface:source,world_id:world?.id||worldParam,district_id:district,booth_id:booth}})});setDraft("");await loadMessages(conversationId)}catch(e){setStatus(e instanceof Error?e.message:"MESSAGE_FAILED")}finally{setBusy(false)}}
 async function interact(kind:"collaboration"|"negotiation"){
  if(!world?.id){setStatus("No active World context for this Agent.");return}
  try{const s=createSupabaseBrowserClient(),session=(await s.auth.getSession()).data.session;if(!session?.user?.id)throw new Error("AUTH_SESSION_REQUIRED");await apiFetch("/api/v1/spatial-runtime/worlds/"+encodeURIComponent(world.id)+"/interactions",{method:"POST",body:JSON.stringify({initiator_type:"user",initiator_id:session.user.id,target_type:"agent",target_id:agentId,interaction_type:kind,payload:{source_surface:source,district_id:district,booth_id:booth}})});setStatus(kind+" intent recorded by Spatial Runtime; authority remains server-side")}catch(e){setStatus(e instanceof Error?e.message:"SPATIAL_INTERACTION_FAILED")}
 }
 function nav(k:UniverseShellKey){if(k==="universe"||k==="explore")location.assign("/universe");else if(k==="my-agent")location.assign("/agents");else if(k==="social")location.assign("/social");else if(k==="communities")location.assign("/communities");else if(k==="missions")location.assign("/missions");else if(k==="marketplace")location.assign("/marketplace")}
 if(loading&&!profile)return <AgentLoading/>;
 if(!profile)return <UniverseShell active="explore" onNavigate={nav} onCreate={()=>location.assign("/agents/create")}><div className="p-10 pt-28 text-center"><h1>Agent unavailable</h1><p>{error||"Public Agent Account unavailable."}</p></div></UniverseShell>;
 const a=profile.agent, online=!!spatial&&spatial.movement_state!=="sleeping";
 const presence=spatial?[{id:spatial.id,agent_id:spatial.agent_id,movement_state:spatial.movement_state,position:spatial.position,rotation:spatial.rotation,zone_key:spatial.zone_key}]:[];
 const char=character?{source:character.source??character.asset_source??null,characterKey:character.characterKey??character.character_key??null,contract:character.contract??null}:undefined;
 return <UniverseShell active="explore" onNavigate={nav} onCreate={()=>location.assign("/agents/create")} contextDock={<div className="allpha-universe-context-content"><span className="allpha-eyebrow">Agent Space</span><strong>{a.name}</strong><span>{world?"World · "+world.name:"Universe · roaming"}</span></div>} commandBar={<div className="allpha-universe-command-default"><span className="allpha-universe-command-signal"/><span>Agent HUD</span><button onClick={()=>setTab("identity")}>Passport</button><button onClick={()=>setTab("skills")}>Skills</button><button onClick={()=>void openConversation()}>Conversation</button><button onClick={()=>setLowPower(v=>!v)}>{lowPower?"Spatial quality":"Low power"}</button></div>}>
  <main className="allpha-agent-experience">
   {error?<div className="allpha-agent-notice">{error}<button onClick={()=>void load()}>Retry</button></div>:null}
   <section className="allpha-agent-stage">
    <div className="allpha-agent-stage-bg"/>
    <div className="allpha-agent-render">{scene?<Renderer scene={scene} tokens={theme?.tokens} lowPower={lowPower} presence={presence} agentCharacterAsset={char}/>:<OrbitalFallback name={a.name} online={online} character={char?.characterKey}/>}</div>
    <div className="allpha-agent-hud-top"><div className="allpha-agent-identity-chip"><i className={online?"presence-dot online":"presence-dot"}/><div><strong>{a.name}</strong><small>{a.handle?"@"+a.handle:"AI Agent"}</small></div></div><div className="allpha-agent-context-chip"><span>{world?"WORLD · "+world.name:"UNIVERSE · ROAMING"}</span><small>{spatial?.zone_key?"ZONE · "+spatial.zone_key:"AGENT PRESENCE"}</small></div></div>
    <div className="allpha-agent-orbit-actions"><button onClick={()=>setTab("identity")}><b>◉</b><span>Passport</span></button><button onClick={()=>void openConversation()}><b>◌</b><span>Talk</span></button><button onClick={()=>void interact("collaboration")}><b>✦</b><span>Collaborate</span></button><button onClick={()=>void interact("negotiation")}><b>◇</b><span>Negotiate</span></button></div>
    <div className="allpha-agent-presence-hud"><span>AGENT PRESENCE</span><strong>{online?(spatial?.movement_state||"present").replaceAll("_"," "):"Not currently present"}</strong><small>{spatial?.speed?"Speed "+spatial.speed.toFixed(1)+" · ":""}{spatial?.zone_key||"Universe-level Agent Space"}</small><i className={realtime==="live"?"live":""}/><em>{realtime==="live"?"LIVE":"SYNCING"}</em></div>
    <div className="allpha-agent-stage-label"><span>UNIVERSE → WORLD → AGENT</span><strong>AI CHARACTER SPACE</strong><small>{theme?.name||"Ambient Universe Space"}</small></div>
   </section>
   <section className="allpha-agent-panel"><div className="allpha-agent-panel-tabs">{(["identity","skills","conversation"] as const).map(x=><button key={x} onClick={()=>setTab(x)} className={tab===x?"active":""}>{x}</button>)}</div>
    {tab==="identity"?<div className="allpha-agent-panel-grid"><div><p className="allpha-agent-eyebrow">Agent Identity</p><h1>{a.name}</h1><p>{a.description||"AI Agent inside the Allpha Universe."}</p><div className="allpha-agent-metrics"><Metric label="Quality" value={profile.reputation.quality_score.toFixed(1)}/><Metric label="Verified" value={String(profile.reputation.verified_usage_count)}/><Metric label="Challenge" value={"L"+profile.reputation.challenge_level}/></div></div><div className="allpha-agent-passport"><span>AGENT PASSPORT</span><strong>{a.runtime_state}</strong><small>{a.status} · {a.is_owned_by_viewer?"Owned by you":"Public Agent"}</small></div></div>:null}
    {tab==="skills"?<div><p className="allpha-agent-eyebrow">Published Skills</p><h2>Capabilities in orbit</h2><div className="allpha-agent-skills">{profile.skills.length?profile.skills.map(s=><div key={s.id}><span>{s.category}</span><strong>{s.name}</strong><small>Level {s.skill_level} · {Number(s.quality_score).toFixed(1)} quality · {s.usage_count} usage</small></div>):<p>No published Skills.</p>}</div></div>:null}
    {tab==="conversation"?<div className="allpha-agent-conversation"><div className="allpha-agent-conversation-head"><div><p className="allpha-agent-eyebrow">Direct Conversation</p><strong>{a.name}</strong></div><span>{conversationId?"ACTIVE":"NOT OPENED"}</span></div>{!conversationId?<div className="allpha-agent-empty-chat"><p>Enter this Agent's conversational space.</p><button onClick={()=>void openConversation()} disabled={busy}>Enter Conversation</button></div>:<><div className="allpha-agent-messages">{messages.length?messages.map(m=><div key={m.id} className={"message "+(m.sender_type==="user"?"human":"agent")}><span>{m.sender_type==="user"?"YOU":a.name}</span><p>{m.body}</p></div>):<p className="empty">Conversation ready.</p>}</div><div className="allpha-agent-compose"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send()}} placeholder="Talk to this Agent…" disabled={busy}/><button onClick={()=>void send()} disabled={busy||!draft.trim()}>Send</button></div></>}{status?<p className="allpha-agent-status">{status}</p>:null}</div>:null}
   </section>
  </main>
 </UniverseShell>
}
function OrbitalFallback({name,online,character}:{name:string;online:boolean;character?:string|null}){return <div className="allpha-agent-fallback"><div className="agent-fallback-orbit orbit-1"/><div className="agent-fallback-orbit orbit-2"/><div className="agent-fallback-orbit orbit-3"/><div className="allpha-agent-fallback-core"><span>{character?character.slice(0,1).toUpperCase():"A"}</span></div><strong><i className={online?"live":""}/>{name}</strong><small>2D spatial fallback · no validated World Scene</small></div>}
function Metric({label,value}:{label:string;value:string}){return <div><span>{label}</span><strong>{value}</strong></div>}
function AgentLoading(){return <main className="min-h-screen bg-[#02040b] p-5"><div className="mx-auto max-w-7xl animate-pulse pt-20"><div className="h-[72vh] rounded-[32px] bg-white/[.04]"/></div></main>}
