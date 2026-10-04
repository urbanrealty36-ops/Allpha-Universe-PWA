"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { apiFetch } from "../lib/api";

const AllphaWorldRenderer = dynamic(() => import("./world/allpha-world-renderer"), { ssr: false });

type District = { id:string; world_id:string; name:string; slug:string; district_type:string; visibility:string; status:string; theme_key?:string|null };
type Theme = { id:string; slug:string; catalog_key?:string|null; world_schema:any; tokens?:Record<string,unknown>; name:string };
type Zone = { id:string; name:string; zone_key:string; zone_type:string; status:string };
type Booth = { id:string; name:string; slug:string; booth_type:string; tier:string; status:string; moderation_status:string; district_id:string; district_zone_id?:string|null; theme_key?:string|null; host_agent_id?:string|null; scene_config?:Record<string,unknown>; display_config?:Record<string,unknown> };
type Presence = { id:string; world_id:string; agent_id:string; movement_state:string; position?:{x:number;y:number;z:number}; rotation?:{x:number;y:number;z:number}; zone_key?:string|null };
type Agent = { id?:string; agent_id?:string; name:string; handle?:string|null; description?:string|null; status?:string; runtime_state?:string };
type Composition = { district:District; zones:Zone[]; booths:Booth[]; spatial_presence:Presence[] };

export default function DistrictExperienceSurface({ districtId }: { districtId:string }) {
  const [district,setDistrict]=useState<District|null>(null);
  const [themes,setThemes]=useState<Theme[]>([]);
  const [zones,setZones]=useState<Zone[]>([]);
  const [booths,setBooths]=useState<Booth[]>([]);
  const [presence,setPresence]=useState<Presence[]>([]);
  const [agents,setAgents]=useState<Agent[]>([]);
  const [selectedBooth,setSelectedBooth]=useState<Booth|null>(null);
  const [selectedAgent,setSelectedAgent]=useState<Agent|null>(null);
  const [interactionStatus,setInteractionStatus]=useState<string|null>(null);
  const [realtime,setRealtime]=useState("connecting");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  const load=useCallback(async(quiet=false)=>{
    if(!quiet)setLoading(true);
    try{
      const [composition,catalog]=await Promise.all([
        apiFetch<{data:Composition}>("/api/v1/themes/world-runtime/districts/"+districtId+"/composition"),
        apiFetch<{data:Theme[]}>("/api/v1/themes/world-runtime/catalog")
      ]);
      const c=composition.data;
      setDistrict(c?.district??null);
      setZones(c?.zones??[]);
      setBooths(c?.booths??[]);
      setPresence(c?.spatial_presence??[]);
      setThemes(catalog.data??[]);
      const a=await apiFetch<{data:Agent[]}>("/api/v1/agent-catalog/accounts?district_id="+encodeURIComponent(districtId)+"&limit=24");
      setAgents(a.data??[]);
      setError(null);
    }catch(e){setError(e instanceof Error?e.message:"DISTRICT_EXPERIENCE_LOAD_FAILED");}
    finally{if(!quiet)setLoading(false);}
  },[districtId]);

  useEffect(()=>{void load();},[load]);

  useEffect(()=>{
    let active=true;
    let timer:ReturnType<typeof setInterval>|null=null;
    let channel:any=null;
    try{
      const supabase=createSupabaseBrowserClient();
      channel=supabase.channel("allpha-district-"+districtId)
        .on("postgres_changes",{event:"*",schema:"public",table:"agent_spatial_states"},()=>{if(active)void load(true);})
        .on("postgres_changes",{event:"*",schema:"public",table:"booths",filter:"district_id=eq."+districtId},()=>{if(active)void load(true);})
        .subscribe((status:string)=>{
          if(!active)return;
          if(status==="SUBSCRIBED")setRealtime("connected");
          if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")setRealtime("polling");
        });
    }catch{setRealtime("polling");}
    timer=setInterval(()=>{if(active)void load(true);},5000);
    return()=>{active=false;if(timer)clearInterval(timer);if(channel)void channel.unsubscribe();};
  },[districtId,load]);

  const activeTheme=useMemo(()=>{
    const key=district?.theme_key;
    return themes.find(t=>t.slug===key||t.id===key||t.catalog_key===key)??themes[0]??null;
  },[district,themes]);

  const boothNodes=useMemo(()=>booths.map((b,i)=>({
    id:b.id,kind:"booth",name:b.name,
    position:(b.scene_config?.position as {x:number;y:number;z:number}|undefined)??{x:(i%4)*2.8-4.2,y:0,z:Math.floor(i/4)*2.8-2.8},
    scale:{x:1,y:1,z:1},
    metadata:{booth_id:b.id,booth_type:b.booth_type,tier:b.tier}
  } as any)),[booths]);

  async function interact(kind:"conversation"|"collaboration"|"shopping"|"negotiation"){
    const id=selectedAgent?.agent_id||selectedAgent?.id;
    if(!id||!district)return;
    setInteractionStatus("Authorizing "+kind+"…");
    try{
      const supabase=createSupabaseBrowserClient();
      const session=(await supabase.auth.getSession()).data.session;
      if(!session?.user?.id)throw new Error("AUTH_SESSION_REQUIRED");
      await apiFetch("/api/v1/spatial-runtime/worlds/"+district.world_id+"/interactions",{
        method:"POST",
        body:JSON.stringify({
          initiator_type:"user",initiator_id:session.user.id,
          target_type:"agent",target_id:id,
          interaction_type:kind,payload:{source_surface:"district",district_id:district.id}
        })
      });
      setInteractionStatus("Recorded by Spatial Runtime. Policy/Risk/Approval remain authoritative.");
    }catch(e){setInteractionStatus(e instanceof Error?e.message:"AGENT_INTERACTION_FAILED");}
  }

  if(loading)return <main className="min-h-screen bg-[#02040b] text-white flex items-center justify-center"><div className="text-sm text-white/40">Opening District spatial context…</div></main>;
  if(!district)return <main className="min-h-screen bg-[#02040b] text-white flex items-center justify-center"><div className="text-center"><p className="text-sm text-red-200">{error??"District unavailable."}</p><a href="/districts" className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs">Back to Districts</a></div></main>;

  return <main className="min-h-screen bg-[#02040b] text-white">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.08] bg-[#02040b]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <a href="/" className="text-xl font-black tracking-[-.08em]">ALLPHA<span className="text-cyan-300">.</span></a>
        <div className="hidden h-5 w-px bg-white/10 sm:block"/>
        <div><p className="text-[8px] uppercase tracking-[.3em] text-cyan-200/55">Living District</p><p className="text-xs text-white/70">{district.name}</p></div>
        <div className="ml-auto flex items-center gap-2"><span className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-white/45">{realtime==="connected"?"● Realtime":"◌ Syncing"}</span><a href="/districts" className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-white/55">Districts</a></div>
      </div>
    </header>

    <section className="relative min-h-screen overflow-hidden pt-16">
      <div className="absolute inset-0">
        {activeTheme?.world_schema?<AllphaWorldRenderer
          scene={activeTheme.world_schema}
          tokens={activeTheme.tokens}
          lowPower={false}
          booths={boothNodes}
          presence={presence.map(p=>({id:p.id,agent_id:p.agent_id,movement_state:p.movement_state,position:p.position,zone_key:p.zone_key}))}
          spatialObjects={[]}
          selectedDistrictId={district.id}
          selectedBoothId={selectedBooth?.id}
          onHotspot={node=>{
            if(node.kind==="booth"){const b=booths.find(x=>x.id===node.id);if(b)setSelectedBooth(b);}
            if(node.kind==="character"){const a=agents.find(x=>(x.agent_id||x.id)===String(node.metadata?.agent_id));if(a)setSelectedAgent(a);}
          }}
        />:<div className="h-full min-h-[760px] bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.18),transparent_22%),radial-gradient(circle_at_75%_25%,rgba(124,58,237,.24),transparent_30%),#02040b]"/>}
      </div>

      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col justify-between px-4 py-5 sm:px-7">
        <div className="pointer-events-auto max-w-xl rounded-[28px] border border-white/10 bg-[#02040b]/68 p-5 backdrop-blur-xl">
          <p className="text-[8px] uppercase tracking-[.35em] text-cyan-200/60">District · Zone · Booth · Presence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{district.name}</h1>
          <p className="mt-2 text-xs leading-5 text-white/45">A living spatial layer backed by the canonical Universe → District → Booth → Presence path. The renderer is presentation-only; authority stays server-side.</p>
          <div className="mt-4 grid grid-cols-4 gap-2"><Stat label="Zones" value={zones.length}/><Stat label="Booths" value={booths.length}/><Stat label="Agents" value={agents.length}/><Stat label="Live" value={presence.length}/></div>
        </div>

        <div className="pointer-events-auto grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl rounded-[26px] border border-white/10 bg-[#02040b]/75 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between"><div><p className="text-[8px] uppercase tracking-[.3em] text-violet-200/55">Realtime District</p><h2 className="mt-1 text-sm font-semibold">Presence & Zones</h2></div><button onClick={()=>void load()} className="rounded-lg border border-white/10 px-3 py-1.5 text-[9px] text-white/50">Refresh</button></div>
            <div className="mt-3 flex gap-2 overflow-x-auto">{zones.map(z=><span key={z.id} className="shrink-0 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[9px] text-white/50">{z.name}</span>)}</div>
            <div className="mt-3 grid max-h-32 gap-2 overflow-auto sm:grid-cols-2">{presence.length?presence.map(p=><button key={p.id} onClick={()=>{const a=agents.find(x=>(x.agent_id||x.id)===p.agent_id);if(a)setSelectedAgent(a);}} className="rounded-xl border border-white/[.08] bg-black/20 p-2 text-left"><div className="flex justify-between"><span className="text-[10px] text-white/70">{agents.find(x=>(x.agent_id||x.id)===p.agent_id)?.name??"Agent"}</span><span className="text-[8px] text-cyan-200/55">{p.movement_state}</span></div><p className="mt-1 text-[8px] text-white/25">{p.zone_key??"District"} · {p.position?String(p.position.x.toFixed(1))+", "+String(p.position.z.toFixed(1)):"position pending"}</p></button>):<p className="text-[10px] text-white/30">No active Agent Presence in this District yet.</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-2"><Quick label="Booths" value={booths.length} onClick={()=>setSelectedBooth(booths[0]??null)}/><Quick label="Agents" value={agents.length} onClick={()=>setSelectedAgent(agents[0]??null)}/></div>
        </div>
      </div>
    </section>

    {selectedBooth&&<aside className="fixed inset-x-0 bottom-0 z-[70] max-h-[60vh] overflow-auto border-t border-white/10 bg-[#050812]/97 p-5 backdrop-blur-2xl sm:inset-y-20 sm:right-5 sm:left-auto sm:w-[420px] sm:rounded-3xl sm:border">
      <button onClick={()=>setSelectedBooth(null)} className="float-right rounded-full border border-white/10 px-3 py-1 text-[9px]">Close</button>
      <p className="text-[8px] uppercase tracking-[.28em] text-cyan-200/55">Booth / Tenant</p><h2 className="mt-2 text-2xl font-semibold">{selectedBooth.name}</h2>
      <p className="mt-1 text-xs text-white/40">{selectedBooth.booth_type} · {selectedBooth.tier} · {selectedBooth.status}</p>
      <div className="mt-5 grid gap-2"><Info label="Moderation" value={selectedBooth.moderation_status}/><Info label="Zone" value={selectedBooth.district_zone_id?"Zone bound":"District level"}/><Info label="Host Agent" value={selectedBooth.host_agent_id?"Assigned":"Not assigned"}/></div>
      <a href="/booths" className="mt-5 inline-flex rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60">Open Booth / Tenant Management</a>
    </aside>}

    {selectedAgent&&<aside className="fixed inset-x-0 bottom-0 z-[75] max-h-[70vh] overflow-auto border-t border-cyan-200/15 bg-[#050812]/97 p-5 backdrop-blur-2xl sm:inset-y-20 sm:right-5 sm:left-auto sm:w-[440px] sm:rounded-3xl sm:border">
      <button onClick={()=>setSelectedAgent(null)} className="float-right rounded-full border border-white/10 px-3 py-1 text-[9px]">Close</button>
      <p className="text-[8px] uppercase tracking-[.28em] text-cyan-200/55">Agent Interaction</p><h2 className="mt-2 text-2xl font-semibold">{selectedAgent.name}</h2>
      <p className="mt-1 text-xs text-white/40">{selectedAgent.handle?"@"+selectedAgent.handle:"AI Agent"} · {selectedAgent.status??"active"}</p>
      <p className="mt-4 text-xs leading-5 text-white/45">{selectedAgent.description??"Public Agent Account. Interaction remains subject to Passport, Capability, Policy, Permission, Risk and Approval."}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">{(["conversation","collaboration","shopping","negotiation"] as const).map(k=><button key={k} onClick={()=>void interact(k)} className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 text-[10px] text-white/65">{k}</button>)}</div>
      {interactionStatus&&<div className="mt-4 rounded-xl border border-cyan-200/15 bg-cyan-300/[.05] p-3 text-[10px] text-cyan-50">{interactionStatus}</div>}
      <div className="mt-5 grid grid-cols-2 gap-2"><a href="/messages" className="rounded-xl bg-white px-3 py-2.5 text-center text-[10px] font-semibold text-slate-950">Open Messages</a><a href={"/agents/"+(selectedAgent.agent_id||selectedAgent.id)} className="rounded-xl border border-white/10 px-3 py-2.5 text-center text-[10px] text-white/60">Agent Profile</a></div>
    </aside>}
  </main>;
}

function Stat({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-white/[.07] bg-black/20 px-3 py-2"><p className="text-[8px] uppercase tracking-[.18em] text-white/25">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
function Quick({label,value,onClick}:{label:string;value:number;onClick:()=>void}){return <button onClick={onClick} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left hover:border-cyan-300/25"><p className="text-[8px] uppercase tracking-[.18em] text-white/25">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></button>}
function Info({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between rounded-xl border border-white/[.07] px-3 py-2 text-xs"><span className="text-white/30">{label}</span><span className="text-white/70">{value}</span></div>}
