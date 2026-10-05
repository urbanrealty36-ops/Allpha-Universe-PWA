"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import UniverseShell, { type UniverseShellKey } from "../universe/universe-shell";
import styles from "./ask-content-experience.module.css";

type Content={id:string;title:string|null;excerpt:string|null;content_type:string;owner_type:string;owner_id:string};
type Topic={id:string;topic_id:string;content_topics?:{name?:string;slug?:string}|null};
type Agent={id:string;name?:string|null;description?:string|null};
type World={id:string;name:string;slug:string};
type Live={id:string;title:string|null;status:string};
type Experience={content:Content;topics:Topic[];ai_summary:{summary:string;key_points?:unknown[]}|null;discussion:{id:string;community_id:string}[];communities:{id:string;name:string;handle:string}[];related_content:{id:string;title:string|null;content_type:string}[];world:{world_id:string}[];worlds:World[];live_experience:Live[];agent:Agent|null;path:{key:string;available:boolean}[]};
type AskResult={answer:string;answer_mode?:string;grounding?:{content:boolean;topic_count:number;media_count:number;private_rag:boolean;memory_count:number;knowledge_count:number;scope:string};rag?:{status:string;memory_count:number;knowledge_count:number};action_handoff?:{required:boolean;status:string;agent_id:string;action_request:string;next_endpoint:string}|null;ai?:{provider_id?:string;model_id?:string;latency_ms?:number;estimated_cost_usd?:number}};
type Turn={id:string;question:string;result:AskResult};

function errorText(value:unknown){return value instanceof Error?value.message:"ASK_CONTENT_FAILED"}

export default function AskContentExperience({contentId}:{contentId:string}){
 const [experience,setExperience]=useState<Experience|null>(null);
 const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState<string|null>(null);
 const [question,setQuestion]=useState(""),[turns,setTurns]=useState<Turn[]>([]),[asking,setAsking]=useState(false),[askError,setAskError]=useState<string|null>(null);

 useEffect(()=>{let alive=true;setLoading(true);setLoadError(null);apiFetch<{data:Experience}>("/api/v1/discovery/content/"+encodeURIComponent(contentId)+"/evolution?related_limit=8").then(r=>{if(alive)setExperience(r.data)}).catch(e=>{if(alive)setLoadError(errorText(e))}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[contentId]);

 async function submit(value?:string){
  const prompt=(value??question).trim();if(!prompt||asking)return;
  setAsking(true);setAskError(null);
  try{
   const r=await apiFetch<{data:AskResult}>("/api/v1/discovery/content/"+encodeURIComponent(contentId)+"/ask",{method:"POST",body:JSON.stringify({question:prompt})});
   setTurns(current=>[...current,{id:crypto.randomUUID(),question:prompt,result:r.data}]);setQuestion("");
  }catch(e){setAskError(errorText(e))}finally{setAsking(false)}
 }
 function nav(key:UniverseShellKey){if(key==="universe"||key==="explore")location.assign("/universe");else if(key==="my-agent")location.assign("/agents");else if(key==="social")location.assign("/social");else if(key==="communities")location.assign("/communities");else if(key==="missions")location.assign("/missions");else if(key==="marketplace")location.assign("/marketplace")}
 const shellProps={active:"explore" as const,onNavigate:nav,onCreate:()=>location.assign("/agents/create")};

 if(loading)return <UniverseShell {...shellProps}><main className={styles.page}><div className={styles.loading}><i/><i/><i/></div></main></UniverseShell>;
 if(loadError||!experience)return <UniverseShell {...shellProps}><main className={styles.page}><section className={styles.error}><span>ASK THE CONTENT</span><h1>Content context is unavailable.</h1><p>{loadError??"The authoritative Content source returned no available context."}</p><a href={"/content/"+encodeURIComponent(contentId)}>Back to Content Capsule</a></section></main></UniverseShell>;

 const {content,topics,ai_summary,discussion,communities,related_content,world,worlds,live_experience,agent}=experience;
 const worldNames=useMemo(()=>world.map(link=>worlds.find(item=>item.id===link.world_id)?.name).filter(Boolean) as string[],[world,worlds]);

 return <UniverseShell {...shellProps} contextDock={<div className="allpha-universe-context-content"><span className="allpha-eyebrow">Ask the Content</span><strong>{content.title||"Content Capsule"}</strong><span>Permission-scoped · Content-grounded · AI Gateway</span></div>} commandBar={<div className="allpha-universe-command-default"><span className="allpha-universe-command-signal"/><span>Ask</span><span className={styles.commandMeta}>{content.content_type}</span></div>}>
  <main className={styles.page}>
   <div className={styles.field} aria-hidden="true"><i/><i/><b/></div>
   <section className={styles.header}>
    <div><div className={styles.kicker}><span/> ASK THE CONTENT · CANONICAL AI GATEWAY</div><h1>Talk to the <em>Content</em></h1><p>Ask questions about this Content Capsule. Answers are grounded in the permission-scoped Content context and existing AI Gateway.</p>
     <div className={styles.contextLine}><span>{content.content_type}</span>{topics.slice(0,5).map(t=>t.content_topics?.name?<span key={t.id}>{t.content_topics.name}</span>:null)}{agent?<a href={"/agents/"+encodeURIComponent(agent.id)}>Agent · {agent.name||"Open Agent"}</a>:null}{worldNames.slice(0,2).map(name=><a key={name} href="/worlds">World · {name}</a>)}</div>
    </div>
    <div className={styles.core}><div/><span>?</span><small>CONTENT<br/>CONTEXT</small></div>
   </section>

   <section className={styles.workspace}>
    <div className={styles.chat}>
     <div className={styles.chatTop}><div><span>CONTENT-BOUNDED SESSION</span><strong>{turns.length?String(turns.length)+" question"+(turns.length>1?"s":""):"Ready for your first question"}</strong></div><a href={"/content/"+encodeURIComponent(contentId)}>Open Capsule ↗</a></div>
     {!turns.length?<div className={styles.empty}><div className={styles.emptyCore}>✦</div><h2>What do you want to understand?</h2><p>Ask for an explanation, implications, evidence from the provided Content, or a connection to its Universe context.</p><div className={styles.prompts}>{["Explain this Content in simple terms","What are the key implications?","What should I pay attention to?","How does this connect to the Universe?"].map(prompt=><button key={prompt} onClick={()=>void submit(prompt)}>{prompt}<span>→</span></button>)}</div></div>:
      <div className={styles.turns}>{turns.map(turn=><article key={turn.id} className={styles.turn}><div className={styles.question}><span>YOU</span><p>{turn.question}</p></div><div className={styles.answer}><div className={styles.answerHead}><span>ALLPHA AI · CONTENT GROUNDED</span><small>{turn.result.ai?.model_id||"Gateway model"}</small></div><p>{turn.result.answer}</p><div className={styles.grounding}><span>Content ✓</span><span>{turn.result.grounding?.topic_count??0} Topics</span><span>{turn.result.grounding?.media_count??0} Media</span>{turn.result.grounding?.private_rag?<span>Private RAG ✓</span>:null}{turn.result.action_handoff?.required?<span>Action handoff · not executed</span>:null}</div></div></article>)}{asking?<div className={styles.thinking}><i/><span>Reading the existing Content context…</span></div>:null}</div>}
     {askError?<div className={styles.askError}>{askError}</div>:null}
     <div className={styles.composer}><textarea value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void submit()}}} placeholder="Ask something about this Content…" rows={3} aria-label="Question about Content"/><button disabled={!question.trim()||asking} onClick={()=>void submit()}>{asking?"Thinking…":"Ask"}</button></div>
     <p className={styles.notice}>This session keeps follow-up turns in the current interface only. It does not create a new memory or conversation engine.</p>
    </div>

    <aside className={styles.context}>
     <section className={styles.panel}><span className={styles.panelLabel}>GROUNDING</span><h2>What Ask can see</h2><div className={styles.signalList}><div><b>CONTENT</b><span>✓</span></div><div><b>TOPICS</b><span>{topics.length}</span></div><div><b>AI SUMMARY</b><span>{ai_summary?"REVIEWED":"—"}</span></div><div><b>DISCUSSION</b><span>{discussion.length}</span></div><div><b>COMMUNITY</b><span>{communities.length}</span></div><div><b>RELATED</b><span>{related_content.length}</span></div><div><b>AGENT</b><span>{agent?"LINKED":"—"}</span></div><div><b>WORLD</b><span>{worldNames.length}</span></div><div><b>LIVE</b><span>{live_experience.length}</span></div></div><p className={styles.scope}>Authorization remains server-side. Vector similarity never grants access.</p></section>
     <section className={styles.panel}><span className={styles.panelLabel}>CONTENT CONTEXT</span><h2>{content.title||"Untitled Content"}</h2><p>{content.excerpt||"No excerpt is available."}</p><a href={"/content/"+encodeURIComponent(contentId)}>Return to Content Experience →</a></section>
     <section className={styles.panel}><span className={styles.panelLabel}>NEXT UNIVERSE MOVES</span><div className={styles.links}>{communities.slice(0,2).map(item=><a key={item.id} href={"/communities/"+encodeURIComponent(item.id)}><span>COMMUNITY</span>{item.name} →</a>)}{agent?<a href={"/agents/"+encodeURIComponent(agent.id)}><span>AGENT</span>{agent.name||"Agent"} →</a>:null}{live_experience.slice(0,1).map(item=><a key={item.id} href={"/live?session_id="+encodeURIComponent(item.id)}><span>LIVE</span>{item.title||"Live Experience"} →</a>)}{worldNames.slice(0,1).map(name=><a key={name} href="/worlds"><span>WORLD</span>{name} →</a>)}{!communities.length&&!agent&&!live_experience.length&&!worldNames.length?<small>No linked Universe transition is currently available.</small>:null}</div></section>
    </aside>
   </section>
  </main>
 </UniverseShell>
}
