"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Asset={id:string;name:string;storage_path:string;status:string;moderation_status:string;content_size_bytes?:number|null;checksum_sha256?:string|null;agent_id:string;agents?:{id:string;name:string;handle?:string|null;status:string}|null};

export default function Page(){
  const [assets,setAssets]=useState<Asset[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState<string|null>(null);

  async function load(){
    setLoading(true);setError(null);
    try{
      const r=await apiFetch<{data:{assets:Asset[]}}>("/api/v1/live-assets/characters/manage");
      setAssets(r.data.assets??[]);
    }catch(e){setError(e instanceof Error?e.message:"CHARACTER_ASSET_ADMIN_LOAD_FAILED")}
    finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[]);

  async function moderate(id:string,decision:"approved"|"restricted"|"rejected"){
    setBusy(id);setError(null);
    try{
      await apiFetch(`/api/v1/live-assets/characters/${id}/moderation`,{method:"POST",body:JSON.stringify({decision})});
      await load();
    }catch(e){setError(e instanceof Error?e.message:"CHARACTER_ASSET_MODERATION_FAILED")}
    finally{setBusy(null)}
  }

  return <main className="min-h-screen bg-[var(--allpha-space)] p-6 text-[var(--allpha-text)] sm:p-10">
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--allpha-cyan)]">Universe · AI Character 3D</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">AI Character Asset Moderation</h1>
      <p className="mt-4 max-w-3xl text-[var(--allpha-text-secondary)]">Only Storage-verified active character assets can be moderated. Runtime rendering requires active + approved + active Agent.</p>
      {error&&<div className="mt-5 rounded-[var(--allpha-radius-md)] border border-[var(--allpha-danger)]/30 bg-[var(--allpha-danger)]/10 p-4 text-sm">{error}</div>}
      <section className="mt-8 rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)] p-6">
        {loading?<p className="text-sm text-[var(--allpha-text-muted)]">Loading character asset queue…</p>:assets.length===0?<p className="text-sm text-[var(--allpha-text-muted)]">No AI Character 3D assets have been uploaded.</p>:<div className="space-y-3">{assets.map(a=><article key={a.id} className="rounded-[var(--allpha-radius-md)] border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{a.name}</p><p className="mt-1 text-[10px] text-[var(--allpha-text-muted)]">{a.agents?.name??a.agent_id} · {a.status} · {a.moderation_status} · {a.content_size_bytes??0} bytes</p></div><div className="flex gap-2">{a.status==="active"&&<><button disabled={busy===a.id} onClick={()=>void moderate(a.id,"approved")} className="rounded-lg border border-[var(--allpha-success)]/40 px-3 py-2 text-[10px]">Approve</button><button disabled={busy===a.id} onClick={()=>void moderate(a.id,"restricted")} className="rounded-lg border border-[var(--allpha-warning)]/40 px-3 py-2 text-[10px]">Restrict</button><button disabled={busy===a.id} onClick={()=>void moderate(a.id,"rejected")} className="rounded-lg border border-[var(--allpha-danger)]/40 px-3 py-2 text-[10px]">Reject</button></>}</div></div><p className="mt-2 break-all text-[9px] text-[var(--allpha-text-muted)]">{a.storage_path}</p></article>)}</div>}
      </section>
    </div>
  </main>
}
