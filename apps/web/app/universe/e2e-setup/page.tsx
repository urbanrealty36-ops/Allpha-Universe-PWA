"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Galaxy={id:string;name:string;slug:string;description?:string|null;visibility?:string};
type World={id:string;galaxy_id:string;name:string;slug:string;world_type:string;visibility:string;status?:string};
type Agent={id:string;name:string;handle?:string|null;status:string;runtime_state:string};

const input="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50";
const card="rounded-2xl border border-white/10 bg-white/[0.035] p-5";

export default function UniverseE2ESetup(){
  const [galaxies,setGalaxies]=useState<Galaxy[]>([]);
  const [worlds,setWorlds]=useState<World[]>([]);
  const [agents,setAgents]=useState<Agent[]>([]);
  const [galaxyId,setGalaxyId]=useState("");
  const [selectedGalaxy,setSelectedGalaxy]=useState("");
  const [worldId,setWorldId]=useState("");
  const [agentId,setAgentId]=useState("");
  const [galaxy,setGalaxy]=useState({name:"",slug:"",description:""});
  const [world,setWorld]=useState({name:"",slug:"",description:"",worldType:"social",themeKey:""});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);

  async function load(){
    setError(null);
    try{
      const [g,a]=await Promise.all([
        apiFetch<{data:Galaxy[]}>("/api/v1/universe/galaxies"),
        apiFetch<{data:Agent[]}>("/api/v1/agents/me"),
      ]);
      setGalaxies(g.data||[]);
      setAgents(a.data||[]);
      if(g.data?.[0]){
        setSelectedGalaxy(prev=>prev||g.data[0].id);
        const w=await apiFetch<{data:World[]}>(`/api/v1/universe/worlds?galaxy_id=${g.data[0].id}&limit=100`);
        setWorlds(w.data||[]);
      }
    }catch(e){setError(e instanceof Error?e.message:"UNIVERSE_SETUP_LOAD_FAILED")}
  }
  useEffect(()=>{void load()},[]);

  async function loadWorlds(id:string){
    setSelectedGalaxy(id);
    setWorldId("");
    if(!id){setWorlds([]);return}
    try{
      const r=await apiFetch<{data:World[]}>(`/api/v1/universe/worlds?galaxy_id=${id}&limit=100`);
      setWorlds(r.data||[]);
    }catch(e){setError(e instanceof Error?e.message:"WORLD_LIST_FAILED")}
  }

  async function createGalaxy(){
    setBusy(true);setError(null);setMessage(null);
    try{
      const r=await apiFetch<{data:Galaxy}>("/api/v1/universe/galaxies",{method:"POST",body:JSON.stringify({
        name:galaxy.name.trim(),slug:galaxy.slug.trim(),description:galaxy.description.trim()||null,visibility:"public",metadata:{source:"canonical_universe_e2e_setup"}
      })});
      const created=r.data;
      setGalaxies(prev=>[created,...prev]);
      setSelectedGalaxy(created.id);
      setGalaxyId(created.id);
      setGalaxy({name:"",slug:"",description:""});
      setMessage(`Galaxy created: ${created.name}`);
    }catch(e){setError(e instanceof Error?e.message:"GALAXY_CREATE_FAILED")}finally{setBusy(false)}
  }

  async function createWorld(){
    if(!selectedGalaxy){setError("Pilih Galaxy terlebih dahulu.");return}
    setBusy(true);setError(null);setMessage(null);
    try{
      const r=await apiFetch<{data:World}>("/api/v1/universe/worlds",{method:"POST",body:JSON.stringify({
        galaxy_id:selectedGalaxy,name:world.name.trim(),slug:world.slug.trim(),description:world.description.trim()||null,
        world_type:world.worldType,visibility:"public",theme_key:world.themeKey.trim()||null,spatial_config:{},metadata:{source:"canonical_universe_e2e_setup"}
      })});
      const created=r.data;
      setWorlds(prev=>[created,...prev]);
      setWorldId(created.id);
      setWorld({name:"",slug:"",description:"",worldType:"social",themeKey:""});
      setMessage(`World created: ${created.name}`);
    }catch(e){setError(e instanceof Error?e.message:"WORLD_CREATE_FAILED")}finally{setBusy(false)}
  }

  async function publishWorld(){
    if(!worldId)return;
    setBusy(true);setError(null);setMessage(null);
    try{
      await apiFetch(`/api/v1/universe/worlds/${worldId}/publish`,{method:"POST",body:"{}"});
      setWorlds(prev=>prev.map(w=>w.id===worldId?{...w,status:"published"}:w));
      setMessage("World published.");
    }catch(e){setError(e instanceof Error?e.message:"WORLD_PUBLISH_FAILED")}finally{setBusy(false)}
  }

  async function linkAgent(){
    if(!worldId||!agentId){setError("Pilih World dan Agent terlebih dahulu.");return}
    setBusy(true);setError(null);setMessage(null);
    try{
      await apiFetch(`/api/v1/universe/worlds/${worldId}/agents`,{method:"POST",body:JSON.stringify({agent_id:agentId,presence_role:"resident"})});
      setMessage("Agent linked to World.");
    }catch(e){setError(e instanceof Error?e.message:"AGENT_LINK_FAILED")}finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-slate-950 text-white">
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <header className="mb-8">
        <a href="/universe" className="text-xs text-cyan-300">← Back to Universe</a>
        <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-cyan-300">Canonical E2E Setup</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">Prepare one real Agent + Galaxy + World</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Setup ini hanya memakai API canonical yang sudah ada. Tidak membuat engine, tidak menyuntikkan data sintetis, dan tidak bypass FastAPI.</p>
      </header>

      {error&&<div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {message&&<div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{message}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-xl font-semibold">1. Real Agent</h2>
          <p className="mt-2 text-sm text-slate-400">Gunakan Agent Factory canonical. Agent yang sudah ada akan muncul di sini.</p>
          <a href="/agents/create" className="mt-4 inline-block rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950">Open Agent Factory</a>
          <div className="mt-5 space-y-2">{agents.length?agents.map(a=><button key={a.id} onClick={()=>setAgentId(a.id)} className={`w-full rounded-xl border p-3 text-left ${agentId===a.id?"border-cyan-400/50 bg-cyan-400/10":"border-white/10 bg-white/[0.02]"}`}><div className="font-medium">{a.name}</div><div className="mt-1 text-xs text-slate-500">{a.status} · {a.runtime_state}</div></button>):<p className="text-sm text-slate-500">Belum ada Agent.</p>}</div>
        </section>

        <section className={card}>
          <h2 className="text-xl font-semibold">2. Real Galaxy</h2>
          <div className="mt-4 space-y-3">
            <input className={input} placeholder="Galaxy name" value={galaxy.name} onChange={e=>setGalaxy({...galaxy,name:e.target.value})}/>
            <input className={input} placeholder="galaxy-slug" value={galaxy.slug} onChange={e=>setGalaxy({...galaxy,slug:e.target.value})}/>
            <textarea className={input} placeholder="Description (optional)" value={galaxy.description} onChange={e=>setGalaxy({...galaxy,description:e.target.value})}/>
            <button disabled={busy||!galaxy.name||!galaxy.slug} onClick={()=>void createGalaxy()} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">Create Galaxy</button>
          </div>
          <div className="mt-5 space-y-2">{galaxies.map(g=><button key={g.id} onClick={()=>void loadWorlds(g.id)} className={`w-full rounded-xl border p-3 text-left ${selectedGalaxy===g.id?"border-cyan-400/50 bg-cyan-400/10":"border-white/10 bg-white/[0.02]"}`}><div className="font-medium">{g.name}</div><div className="mt-1 text-xs text-slate-500">{g.slug}</div></button>)}</div>
        </section>

        <section className={`${card} lg:col-span-2`}>
          <h2 className="text-xl font-semibold">3. Real World</h2>
          <p className="mt-2 text-sm text-slate-400">World dibuat di Galaxy terpilih dan dapat dipublish melalui RPC canonical.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="World name" value={world.name} onChange={e=>setWorld({...world,name:e.target.value})}/>
            <input className={input} placeholder="world-slug" value={world.slug} onChange={e=>setWorld({...world,slug:e.target.value})}/>
            <input className={input} placeholder="Theme key (optional)" value={world.themeKey} onChange={e=>setWorld({...world,themeKey:e.target.value})}/>
            <select className={input} value={world.worldType} onChange={e=>setWorld({...world,worldType:e.target.value})}><option value="social">social</option><option value="interest">interest</option><option value="community">community</option><option value="creator">creator</option><option value="enterprise">enterprise</option><option value="event">event</option><option value="private">private</option></select>
            <textarea className={input+" sm:col-span-2"} placeholder="Description (optional)" value={world.description} onChange={e=>setWorld({...world,description:e.target.value})}/>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={busy||!selectedGalaxy||!world.name||!world.slug} onClick={()=>void createWorld()} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">Create World</button>
            <button disabled={busy||!worldId} onClick={()=>void publishWorld()} className="rounded-xl border border-cyan-300/30 px-4 py-3 text-sm text-cyan-200 disabled:opacity-40">Publish Selected World</button>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">{worlds.map(w=><button key={w.id} onClick={()=>setWorldId(w.id)} className={`rounded-xl border p-3 text-left ${worldId===w.id?"border-cyan-400/50 bg-cyan-400/10":"border-white/10 bg-white/[0.02]"}`}><div className="font-medium">{w.name}</div><div className="mt-1 text-xs text-slate-500">{w.world_type} · {w.status||"status managed server-side"}</div></button>)}</div>
        </section>

        <section className={`${card} lg:col-span-2`}>
          <h2 className="text-xl font-semibold">4. Link real Agent → World</h2>
          <p className="mt-2 text-sm text-slate-400">Ini hanya membuat relasi Universe canonical. Spatial Runtime tetap dipicu oleh flow runtime berikutnya.</p>
          <button disabled={busy||!worldId||!agentId} onClick={()=>void linkAgent()} className="mt-4 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">Link Agent to World</button>
        </section>
      </div>
    </div>
  </main>;
}
