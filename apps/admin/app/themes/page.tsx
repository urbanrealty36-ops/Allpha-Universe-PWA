"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

type Theme={id:string;name:string;status:string;moderation_status:string};
type Version={id:string;version:number;status:string;validation_status:string;performance_status:string;moderation_status:string};
type UploadResponse={data:{asset:{id:string;storage_bucket:string;storage_path:string};upload:{path:string;token:string}}};

async function sha256(file:File){
  const buffer=await file.arrayBuffer();
  const digest=await crypto.subtle.digest("SHA-256",buffer);
  return Array.from(new Uint8Array(digest)).map((b)=>b.toString(16).padStart(2,"0")).join("");
}

export default function Page(){
  const[themes,setThemes]=useState<Theme[]>([]),[versions,setVersions]=useState<Record<string,Version[]>>({}),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState<string|null>(null);
  async function load(){
    setLoading(true);setError(null);
    try{
      const r=await apiFetch<{data:Theme[]}>("/api/v1/themes");
      setThemes(r.data||[]);
      const entries=await Promise.all((r.data||[]).map(async t=>[t.id,(await apiFetch<{data:Version[]}>(`/api/v1/themes/${t.id}/versions`)).data||[]] as const));
      setVersions(Object.fromEntries(entries));
    }catch(e){setError(e instanceof Error?e.message:"THEME_ADMIN_LOAD_FAILED")}finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[]);
  async function moderate(theme:Theme,v:Version,decision:"approved"|"restricted"|"removed"){
    setBusy(v.id);setError(null);
    try{await apiFetch(`/api/v1/themes/${theme.id}/versions/${v.id}/moderation`,{method:"POST",body:JSON.stringify({decision})});await load()}catch(e){setError(e instanceof Error?e.message:"THEME_MODERATION_FAILED")}finally{setBusy(null)}
  }
  async function upload3D(v:Version,file:File){
    const key=`upload:${v.id}`;
    setBusy(key);setError(null);
    try{
      if(file.type!=="model/gltf-binary"&&!file.name.toLowerCase().endsWith(".glb")) throw new Error("THEME_3D_GLB_REQUIRED");
      const prepared=await apiFetch<UploadResponse>(`/api/v1/themes/platform-assets/${v.id}/3d/upload-url`,{method:"POST"});
      const {asset,upload}=prepared.data;
      const supabase=createSupabaseBrowserClient();
      const result=await supabase.storage.from(asset.storage_bucket).uploadToSignedUrl(upload.path,upload.token,file);
      if(result.error) throw new Error(result.error.message);
      const checksum=await sha256(file);
      await apiFetch(`/api/v1/themes/platform-assets/${v.id}/3d/${asset.id}/finalize?checksum_sha256=${encodeURIComponent(checksum)}`,{method:"POST"});
      await load();
    }catch(e){setError(e instanceof Error?e.message:"THEME_3D_UPLOAD_FAILED")}finally{setBusy(null)}
  }
  return <main className="min-h-screen bg-[var(--allpha-space)] p-6 text-[var(--allpha-text)] sm:p-10">
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--allpha-cyan)]">Universe · Phase 21A / 21.5</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Theme Moderation & 3D Assets</h1>
      <p className="mt-4 max-w-3xl text-[var(--allpha-text-secondary)]">Platform moderation and GLB activation use the existing authoritative Theme lifecycle. Uploads use short-lived signed Storage access; the browser never receives service-role credentials.</p>
      {error&&<div className="mt-5 rounded-[var(--allpha-radius-md)] border border-[var(--allpha-danger)]/30 bg-[var(--allpha-danger)]/10 p-4 text-sm">{error}</div>}
      <section className="mt-8 rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)] p-6">
        {themes.length===0?<p className="text-sm text-[var(--allpha-text-muted)]">{loading?"Loading authoritative themes…":"No themes are available to this moderator."}</p>:<div className="space-y-5">{themes.map(t=><article key={t.id} className="rounded-[var(--allpha-radius-md)] border border-white/10 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{t.name}</h2><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">Theme: {t.status} · moderation: {t.moderation_status}</p></div></div><div className="mt-4 space-y-2">{(versions[t.id]||[]).map(v=><div key={v.id} className="rounded-[var(--allpha-radius-sm)] border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm">Version {v.version}</span><span className="text-xs text-[var(--allpha-text-muted)]">{v.status} · validation {v.validation_status} · performance {v.performance_status} · moderation {v.moderation_status}</span></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy===v.id} onClick={()=>void moderate(t,v,"approved")} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-success)]/40 px-3 py-2 text-xs">Approve</button><button disabled={busy===v.id} onClick={()=>void moderate(t,v,"restricted")} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-warning)]/40 px-3 py-2 text-xs">Restrict</button><button disabled={busy===v.id} onClick={()=>void moderate(t,v,"removed")} className="rounded-[var(--allpha-radius-sm)] border border-[var(--allpha-danger)]/40 px-3 py-2 text-xs">Remove</button><label className="cursor-pointer rounded-[var(--allpha-radius-sm)] border border-cyan-300/40 px-3 py-2 text-xs hover:bg-cyan-300/10">{busy===`upload:${v.id}`?"Uploading…":"Upload GLB"}<input type="file" accept=".glb,model/gltf-binary" className="hidden" disabled={busy!==null} onChange={(e)=>{const file=e.target.files?.[0];e.currentTarget.value="";if(file)void upload3D(v,file)}} /></label></div></div>)}</div></article>)}</div>}
      </section>
    </div>
  </main>;
}
