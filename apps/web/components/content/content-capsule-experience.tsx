"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import UniverseShell, { type UniverseShellKey } from "../universe/universe-shell";
import styles from "./content-capsule-experience.module.css";

type Content={id:string;owner_type:string;owner_id:string;content_type:string;title:string|null;body:string|null;excerpt:string|null;visibility:string;status:string;language_code?:string|null;metadata?:Record<string,unknown>|null;published_at?:string|null};
type TopicLink={id:string;topic_id:string;content_topics?:{id:string;name:string;slug:string;description?:string|null;status?:string|null}|null};
type Media={id:string;media_asset_id:string;slot_type:string;position:number;caption?:string|null;alt_text?:string|null;metadata?:Record<string,unknown>|null};
type Capsule={id:string;summary:string;key_points?:unknown[];generated_by?:string|null;model_reference?:string|null;provenance?:Record<string,unknown>|null;confidence?:number|null;review_status?:string|null;created_at?:string};
type Discussion={id:string;community_id:string;content_id:string;author_type:string;author_id:string;status:string;pinned:boolean;created_at:string};
type Comment={id:string;community_id:string;post_id:string;parent_id:string|null;author_type:string;author_id:string;body:string;status:string;created_at:string};
type Community={id:string;name:string;handle:string;description?:string|null;visibility:string;join_policy:string};
type RelatedContent={id:string;owner_type:string;owner_id:string;content_type:string;title:string|null;excerpt:string|null;published_at?:string|null};
type WorldLink={world_id:string;content_id:string;placement?:string|null;sort_order?:number|null};
type World={id:string;name:string;slug:string;description?:string|null;world_type?:string|null;theme_key?:string|null};
type Live={id:string;title:string|null;source_type?:string|null;status:string;scheduled_at?:string|null;started_at?:string|null;district_id?:string|null;booth_id?:string|null};
type Agent={id:string;name?:string|null;description?:string|null;status?:string|null};
type Experience={content:Content;path:Array<{key:string;available:boolean;target_type:string;target_id?:string|null;target_count?:number}>;topics:TopicLink[];media:Media[];ai_summary:Capsule|null;discussion:Discussion[];discussion_comments:Comment[];communities:Community[];related_content:RelatedContent[];live_experience:Live[];world:WorldLink[];worlds:World[];agent:Agent|null;availability:Record<string,unknown>};

export default function ContentCapsuleExperience({contentId}:{contentId:string}){
 const [data,setData]=useState<Experience|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const [ask,setAsk]=useState(""),[answer,setAnswer]=useState<string|null>(null),[asking,setAsking]=useState(false);
 async function load(){setLoading(true);setError(null);try{const r=await apiFetch<{data:Experience}>("/api/v1/discovery/content/"+encodeURIComponent(contentId)+"/evolution?related_limit=8");setData(r.data)}catch(e){setError(e instanceof Error?e.message:"CONTENT_CAPSULE_LOAD_FAILED")}finally{setLoading(false)}}
 useEffect(()=>{void load()},[contentId]);
 async function record(event_type:"opened"|"saved"|"shared"){try{await apiFetch("/api/v1/content/"+encodeURIComponent(contentId)+"/events",{method:"POST",body:JSON.stringify({event_type,metadata:{source_surface:"content_capsule"}})})}catch{}}
 async function askContent(){if(!ask.trim())return;setAsking(true);setAnswer(null);try{const r=await apiFetch<{data:{answer:string}}>("/api/v1/discovery/content/"+encodeURIComponent(contentId)+"/ask",{method:"POST",body:JSON.stringify({question:ask.trim()})});setAnswer(r.data.answer);await record("opened")}catch(e){setAnswer(e instanceof Error?e.message:"ASK_CONTENT_FAILED")}finally{setAsking(false)}}
 function nav(key:UniverseShellKey){if(key==="universe"||key==="explore")location.assign("/universe");else if(key==="my-agent")location.assign("/agents");else if(key==="social")location.assign("/social");else if(key==="communities")location.assign("/communities");else if(key==="missions")location.assign("/missions");else if(key==="marketplace")location.assign("/marketplace")}
 const shellProps={active:"explore" as const,onNavigate:nav,onCreate:()=>location.assign("/agents/create")};
 if(loading)return <UniverseShell {...shellProps}><main className={styles.page}><LoadingState/></main></UniverseShell>;
 if(error||!data)return <UniverseShell {...shellProps}><main className={styles.page}><section className={styles.errorState}><span>CONTENT CAPSULE</span><h1>Content is not available in this context.</h1><p>{error??"The authoritative Content source returned no available record."}</p><button onClick={()=>void load()}>Retry</button></section></main></UniverseShell>;
 const {content,topics,media,ai_summary,discussion,discussion_comments,communities,related_content,live_experience,world,worlds,agent,path}=data;
 const worldById=useMemo(()=>new Map(worlds.map(x=>[x.id,x])),[worlds]);
 const communityById=useMemo(()=>new Map(communities.map(x=>[x.id,x])),[communities]);
 const commentsByPost=useMemo(()=>{const m=new Map<string,Comment[]>();discussion_comments.forEach(c=>m.set(c.post_id,[...(m.get(c.post_id)??[]),c]));return m},[discussion_comments]);
 return <UniverseShell {...shellProps} contextDock={<div className="allpha-universe-context-content"><span className="allpha-eyebrow">Content Experience</span><strong>Capsule · Connected Context</strong><span>AI · Discussion · Community · Agent · Live · World</span></div>} commandBar={<div className="allpha-universe-command-default"><span className="allpha-universe-command-signal"/><span>Content Capsule</span><span className={styles.commandMeta}>{content.content_type}</span></div>}>
  <main className={styles.page}>
   <div className={styles.orbitBackdrop} aria-hidden="true"><i/><i/><i/><b/></div>
   <section className={styles.hero}>
    <div className={styles.heroCopy}>
     <div className={styles.kicker}><span/> CONTENT CAPSULE · {content.content_type.toUpperCase()}</div>
     <div className={styles.heroTitleRow}><h1>{content.title||"Untitled Content"}</h1><span className={styles.gravityBadge}>CAPSULE</span></div>
     <p className={styles.excerpt}>{content.excerpt||"A Content Capsule inside the connected Allpha Universe."}</p>
     <div className={styles.ownerLine}><span>{content.owner_type==="agent"?"AI AGENT":"HUMAN CREATOR"}</span>{agent?<a href={"/agents/"+encodeURIComponent(agent.id)+"?source_surface=content&content_id="+encodeURIComponent(content.id)}>{agent.name||"Agent"} ↗</a>:<span>{content.owner_id}</span>}{content.language_code?<em>{content.language_code}</em>:null}</div>
     <div className={styles.actions}><button onClick={()=>void record("opened")}>Open Source</button><button onClick={()=>void record("saved")}>Save</button><button onClick={()=>void record("shared")}>Share</button></div>
    </div>
    <div className={styles.capsuleCore}><div className={styles.coreGlow}/><div className={styles.coreRing}><span>✦</span></div><small>CONTENT<br/>GRAVITY</small></div>
   </section>

   <nav className={styles.path} aria-label="Content evolution path">{path.map((step,index)=><div key={step.key} className={step.available?styles.pathItemActive:styles.pathItem}><span>{String(index+1).padStart(2,"0")}</span><strong>{step.key.replaceAll("_"," ")}</strong><em>{step.available?"connected":"not available"}</em></div>)}</nav>

   <div className={styles.layout}>
    <div className={styles.mainColumn}>
     <section className={styles.panel}><PanelHeading eyebrow="Original" title="The Content" meta={content.status}/><div className={styles.body}>{content.body||content.excerpt||"No body text is available for this Content Capsule."}</div>{topics.length?<div className={styles.topicRow}>{topics.map(t=>t.content_topics?<span key={t.id}>{t.content_topics.name}</span>:null)}</div>:null}{media.length?<div className={styles.mediaStrip}>{media.map(m=><div key={m.id}><span>{m.slot_type.toUpperCase()}</span><strong>{m.alt_text||m.caption||"Media asset"}</strong><small>Authoritative asset reference · {m.media_asset_id.slice(0,8)}…</small></div>)}</div>:null}</section>

     <section className={styles.panel}><PanelHeading eyebrow="AI Summary" title="Understand it faster" meta={ai_summary?"REVIEWED":"NOT AVAILABLE"}/>{ai_summary?<div className={styles.summary}><p>{ai_summary.summary}</p>{ai_summary.key_points?.length?<ul>{ai_summary.key_points.slice(0,8).map((p,i)=><li key={i}>{String(p)}</li>)}</ul>:null}<div className={styles.provenance}><span>{ai_summary.generated_by||"Canonical AI Capsule"}</span>{ai_summary.model_reference?<span>{ai_summary.model_reference}</span>:null}{typeof ai_summary.confidence==="number"?<span>{Math.round(ai_summary.confidence*100)}% confidence</span>:null}</div></div>:<AvailabilityState text="A reviewed AI Summary does not exist for this Content yet. No synthetic summary is generated by the UI."/>}</section>

     <section className={styles.panel}><PanelHeading eyebrow="Ask" title="Ask the Content" meta="AI GATEWAY"/><div className={styles.askBox}><textarea value={ask} onChange={e=>setAsk(e.target.value)} placeholder="Ask a question about this Content…" rows={3}/><button disabled={asking||!ask.trim()} onClick={()=>void askContent()}>{asking?"Thinking…":"Ask"}</button></div>{answer?<div className={styles.answer}>{answer}</div>:null}<small className={styles.disclaimer}>Answers use the existing permission-scoped Content + AI Gateway boundary. Ask never executes Agent actions.</small></section>

     <section className={styles.panel}><PanelHeading eyebrow="Discussion" title="Where the Content continues" meta={discussion.length+" threads"}/>{discussion.length?<div className={styles.discussionList}>{discussion.map(post=>{const c=communityById.get(post.community_id),comments=commentsByPost.get(post.id)??[];return <article key={post.id} className={styles.discussionCard}><div className={styles.cardTop}><span>{post.pinned?"PINNED":"DISCUSSION"}</span><time>{new Date(post.created_at).toLocaleDateString()}</time></div><strong>{c?.name||"Community discussion"}</strong><p>{post.author_type}:{post.author_id}</p>{comments.length?<div className={styles.commentStack}>{comments.slice(0,4).map(x=><div key={x.id}><span>{x.author_type}:{x.author_id}</span><p>{x.body}</p></div>)}</div>:null}<a href={"/communities/"+encodeURIComponent(post.community_id)}>Open Community ↗</a></article>})}</div>:<AvailabilityState text="No active Community discussion is linked to this Content yet."/>}</section>
    </div>

    <aside className={styles.sideColumn}>
     <section className={styles.panel}><PanelHeading eyebrow="Relationships" title="Connected Universe"/><div className={styles.relationships}>{agent?<a href={"/agents/"+encodeURIComponent(agent.id)+"?source_surface=content&content_id="+encodeURIComponent(content.id)}><span>AGENT</span><strong>{agent.name||"AI Agent"}</strong><small>{agent.description||"Open Agent Space"}</small></a>:null}{world.map(w=>{const item=worldById.get(w.world_id);return item?<a key={w.world_id} href={"/world?world_id="+encodeURIComponent(item.id)}><span>WORLD</span><strong>{item.name}</strong><small>{w.placement||"Content placement"} · Enter World ↗</small></a>:null})}{live_experience.map(l=><a key={l.id} href={"/live?session_id="+encodeURIComponent(l.id)}><span>LIVE</span><strong>{l.title||"Live Experience"}</strong><small>{l.status} · Enter Live ↗</small></a>)}{communities.map(c=><a key={c.id} href={"/communities/"+encodeURIComponent(c.id)}><span>COMMUNITY</span><strong>{c.name}</strong><small>@{c.handle} · Join discussion ↗</small></a>)}{!agent&&!world.length&&!live_experience.length&&!communities.length?<AvailabilityState text="No linked Agent, World, Live or Community relationship is available."/>:null}</div></section>

     <section className={styles.panel}><PanelHeading eyebrow="Related Content" title="Continue the discovery" meta={related_content.length+" links"}/>{related_content.length?<div className={styles.relatedList}>{related_content.map(x=><a key={x.id} href={"/content/"+encodeURIComponent(x.id)}><span>{x.content_type}</span><strong>{x.title||"Untitled Content"}</strong><small>{x.excerpt||"Open the next connected Content Capsule."}</small></a>)}</div>:<AvailabilityState text="No related published Content is available through the current topic relationship."/>}</section>

     <section className={styles.panel}><PanelHeading eyebrow="Media" title="Presentation assets" meta={media.length+" assets"}/>{media.length?<div className={styles.assetList}>{media.map(x=><div key={x.id}><strong>{x.slot_type}</strong><span>{x.caption||x.alt_text||"Asset reference available."}</span></div>)}</div>:<AvailabilityState text="No Content media is attached."/>}</section>
    </aside>
   </div>
  </main>
 </UniverseShell>
}

function PanelHeading({eyebrow,title,meta}:{eyebrow:string;title:string;meta?:string}){return <div className={styles.panelHeading}><div><span>{eyebrow}</span><h2>{title}</h2></div>{meta?<em>{meta}</em>:null}</div>}
function AvailabilityState({text}:{text:string}){return <div className={styles.availability}><span>○</span><p>{text}</p></div>}
function LoadingState(){return <section className={styles.loading}><div/><div/><div/><div/></section>}
