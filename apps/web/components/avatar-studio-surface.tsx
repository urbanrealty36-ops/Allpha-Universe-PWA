"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "../lib/api";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type Character = { id:string; character_key:string; name:string; archetype:string; description?:string|null; visual_profile?:Record<string,unknown> };
type UserCharacter = { id:string; character_key:string; display_name?:string|null; equipped:boolean; appearance:Record<string,unknown> };
type Catalog = { id:string; name:string; description?:string|null; status:string; moderation_status:string; theme_compatibility?:Record<string,unknown> };
type Agent = { id:string; name:string; status:string };

export default function AvatarStudioSurface() {
  const [characters,setCharacters]=useState<Character[]>([]);
  const [ownedCharacters,setOwnedCharacters]=useState<UserCharacter[]>([]);
  const [uniforms,setUniforms]=useState<Catalog[]>([]);
  const [stickers,setStickers]=useState<Catalog[]>([]);
  const [cosmetics,setCosmetics]=useState<Catalog[]>([]);
  const [agents,setAgents]=useState<Agent[]>([]);
  const [selectedAgentId,setSelectedAgentId]=useState("");
  const [characterAsset,setCharacterAsset]=useState<any|null>(null);
  const [selectedKey,setSelectedKey]=useState("");
  const [displayName,setDisplayName]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);

  async function load() {
    const [catalog,chars,uni,sti,cos,agentList]=await Promise.all([
      apiFetch<{data:{characters:Character[]}}>("/api/v1/agent-catalog"),
      apiFetch<{data:UserCharacter[]}>("/api/v1/avatar/characters"),
      apiFetch<{data:Catalog[]}>("/api/v1/avatar/uniforms/catalog"),
      apiFetch<{data:Catalog[]}>("/api/v1/avatar/stickers/catalog"),
      apiFetch<{data:Catalog[]}>("/api/v1/avatar/cosmetics/catalog"),
      apiFetch<{data:Agent[]}>("/api/v1/agents/me"),
    ]);
    setCharacters(catalog.data?.characters??[]);
    setOwnedCharacters(chars.data??[]);
    setUniforms(uni.data??[]);
    setStickers(sti.data??[]);
    setCosmetics(cos.data??[]);
    setAgents(agentList.data??[]);
  }

  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"AVATAR_STUDIO_LOAD_FAILED"));},[]);

  useEffect(()=>{
    setCharacterAsset(null);
    if(!selectedAgentId)return;
    void apiFetch<{data:{active?:any}}>(`/api/v1/live-assets/agents/${selectedAgentId}/character`)
      .then(r=>setCharacterAsset(r.data?.active??null))
      .catch(()=>setCharacterAsset(null));
  },[selectedAgentId]);

  async function uploadAgentCharacter(file:File) {
    if(!selectedAgentId)return;
    setBusy(true);setError(null);
    try {
      if(file.type!=="model/gltf-binary"&&!file.name.toLowerCase().endsWith(".glb"))throw new Error("AGENT_CHARACTER_GLB_REQUIRED");
      const prepared=await apiFetch<{data:{asset:{id:string;storage_bucket:string};upload:{path:string;token:string}}}>(
        `/api/v1/live-assets/agents/${selectedAgentId}/character/upload-url`,
        {method:"POST",body:JSON.stringify({name:file.name.replace(/\.glb$/i,""),metadata:{format:"glb",source:"avatar-studio"}})}
      );
      const supabase=createSupabaseBrowserClient();
      const result=await supabase.storage.from(prepared.data.asset.storage_bucket).uploadToSignedUrl(prepared.data.upload.path,prepared.data.upload.token,file);
      if(result.error)throw new Error(result.error.message);
      const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
      const checksum=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
      await apiFetch(`/api/v1/live-assets/agents/${selectedAgentId}/character/${prepared.data.asset.id}/finalize`,{method:"POST",body:JSON.stringify({checksum_sha256:checksum})});
      const r=await apiFetch<{data:{active?:any}}>(`/api/v1/live-assets/agents/${selectedAgentId}/character`);
      setCharacterAsset(r.data?.active??null);
    } catch(e) {
      setError(e instanceof Error?e.message:"AGENT_CHARACTER_UPLOAD_FAILED");
    } finally { setBusy(false); }
  }

  async function createCharacter(e:FormEvent) {
    e.preventDefault();if(!selectedKey)return;
    setBusy(true);setError(null);
    try {
      await apiFetch("/api/v1/avatar/characters",{method:"POST",body:JSON.stringify({
        character_key:selectedKey,display_name:displayName.trim()||null,
        appearance:{source:"platform_character_catalog"},metadata:{created_from:"avatar-studio"}
      })});
      setDisplayName("");await load();
    } catch(e) { setError(e instanceof Error?e.message:"USER_CHARACTER_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function equipCharacter(id:string) {
    setBusy(true);setError(null);
    try { await apiFetch(`/api/v1/avatar/characters/${id}/equip`,{method:"POST",body:JSON.stringify({equipped:true})});await load(); }
    catch(e) { setError(e instanceof Error?e.message:"USER_CHARACTER_EQUIP_FAILED"); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#03050b] px-4 py-6 text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Allpha Avatar Studio</p>
        <h1 className="mt-2 text-4xl font-semibold">Character · Uniform · Sticker · Cosmetics</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Domain nyata dengan ownership dan equipped state. Visual assets tetap tunduk pada Theme compatibility dan tidak mengubah authority, identity policy, risk, consent atau billing.</p>
      </header>
      {error&&<div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel title="Create User Character">
          <form onSubmit={createCharacter} className="space-y-3">
            <select value={selectedKey} onChange={e=>setSelectedKey(e.target.value)} className={input}><option value="">Select platform AI Character archetype</option>{characters.map(x=><option key={x.id} value={x.character_key}>{x.name} · {x.archetype}</option>)}</select>
            <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Optional display name" className={input}/>
            <button disabled={busy||!selectedKey} className={button}>Create owned User Character</button>
          </form>
          <div className="mt-5 space-y-2">
            {ownedCharacters.length===0?<Empty text="Belum ada User Character milik user ini."/>:ownedCharacters.map(x=><div key={x.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><div><p className="text-xs font-semibold">{x.display_name||x.character_key}</p><p className="text-[10px] text-slate-500">{x.character_key}</p></div>{x.equipped?<span className="rounded-full border border-emerald-300/20 px-2 py-1 text-[9px] text-emerald-200">EQUIPPED</span>:<button disabled={busy} onClick={()=>void equipCharacter(x.id)} className={smallButton}>Equip</button>}</div>)}
          </div>
        </Panel>

        <Panel title="AI Character 3D Asset">
          <select value={selectedAgentId} onChange={e=>setSelectedAgentId(e.target.value)} className={input}><option value="">Select owned Agent</option>{agents.map(x=><option key={x.id} value={x.id}>{x.name} · {x.status}</option>)}</select>
          {selectedAgentId&&<label className="mt-3 inline-flex cursor-pointer rounded-lg border border-cyan-300/40 px-3 py-2 text-[10px]">{busy?"Uploading…":"Upload Character GLB"}<input type="file" accept=".glb,model/gltf-binary" className="hidden" disabled={busy} onChange={e=>{const f=e.target.files?.[0];e.currentTarget.value="";if(f)void uploadAgentCharacter(f)}}/></label>}
          <p className="mt-3 text-[10px] text-slate-500">{characterAsset?"Asset active; runtime tetap menunggu moderation approved.":"Belum ada AI Character 3D asset active + approved untuk Agent ini."}</p>
        </Panel>

        <Panel title="Uniform Catalog / Ownership">
          <CatalogState items={uniforms} empty="Belum ada Uniform yang published + approved."/>
          <p className="mt-4 text-[10px] text-slate-600">Ownership hanya dapat berasal dari entitlement/acquisition lifecycle. UI ini tidak memberikan item gratis secara diam-diam.</p>
        </Panel>
        <Panel title="AI Sticker Catalog / Ownership">
          <CatalogState items={stickers} empty="Belum ada Sticker yang published + approved."/>
          <p className="mt-4 text-[10px] text-slate-600">Sticker memiliki catalog, moderation, asset reference, ownership dan entitlement boundary.</p>
        </Panel>
        <Panel title="AI Cosmetics Catalog / Ownership">
          <CatalogState items={cosmetics} empty="Belum ada Cosmetic yang published + approved."/>
          <p className="mt-4 text-[10px] text-slate-600">Cosmetic menggunakan slot equipped dan theme compatibility; runtime presentation tidak mengubah authority.</p>
        </Panel>
      </section>
    </div>
  </main>;
}

function Panel({title,children}:{title:string;children:ReactNode}){return <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-4">{children}</div></section>}
function CatalogState({items,empty}:{items:Catalog[];empty:string}){return items.length===0?<Empty text={empty}/>:<div className="space-y-2">{items.map(x=><div key={x.id} className="rounded-xl border border-white/10 p-3"><p className="text-xs font-medium">{x.name}</p><p className="mt-1 text-[10px] text-slate-500">{x.status} · {x.moderation_status}</p></div>)}</div>}
function Empty({text}:{text:string}){return <div className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-500">{text}</div>}
const input="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white outline-none";
const button="w-full rounded-xl bg-cyan-300 px-4 py-3 text-xs font-semibold text-slate-950 disabled:opacity-30";
const smallButton="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-slate-300 disabled:opacity-30";
