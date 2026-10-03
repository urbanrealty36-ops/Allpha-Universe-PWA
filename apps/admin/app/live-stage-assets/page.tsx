"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

type Template = { id: string; name: string; slug: string; category: string };
type Version = { id: string; version: number; status: string; validation_status: string; moderation_status: string };
type UploadResponse = { data: { asset: { id: string; storage_bucket: string; storage_path: string }; upload: { path: string; token: string } } };

async function sha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function Page() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [versions, setVersions] = useState<Record<string, Version[]>>({});
  const [assets, setAssets] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const r = await apiFetch<{ data: Template[] }>("/api/v1/live/templates");
      const list = r.data ?? [];
      setTemplates(list);
      const rows = await Promise.all(list.map(async t => {
        const v = await Promise.all((await apiFetch<{ data: Version[] }>(`/api/v1/live/templates/${t.id}/versions`)).data.map(async x => {
          const a = await apiFetch<{ data: { assets: any[] } }>(`/api/v1/live-assets/templates/${x.id}/stage/manage`);
          return [x, a.data.assets ?? []] as const;
        }));
        return [t.id, v] as const;
      }));
      setVersions(Object.fromEntries(rows.map(([id, entries]) => [id, entries.map(([v]) => v)])));
      setAssets(Object.fromEntries(rows.map(([id, entries]) => [id, entries.flatMap(([, a]) => a)])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_STAGE_ADMIN_LOAD_FAILED");
    } finally { setLoading(false); }
  }

  async function upload(version: Version, file: File) {
    const key = `upload:${version.id}`;
    setBusy(key); setError(null);
    try {
      if (file.type !== "model/gltf-binary" && !file.name.toLowerCase().endsWith(".glb")) throw new Error("LIVE_STAGE_3D_GLB_REQUIRED");
      const prepared = await apiFetch<UploadResponse>(`/api/v1/live-assets/templates/${version.id}/stage/upload-url`, { method: "POST" });
      const { asset, upload } = prepared.data;
      const supabase = createSupabaseBrowserClient();
      const result = await supabase.storage.from(asset.storage_bucket).uploadToSignedUrl(upload.path, upload.token, file);
      if (result.error) throw new Error(result.error.message);
      await apiFetch(`/api/v1/live-assets/templates/${version.id}/stage/${asset.id}/finalize`, {
        method: "POST",
        body: JSON.stringify({ checksum_sha256: await sha256(file) }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_STAGE_UPLOAD_FAILED");
    } finally { setBusy(null); }
  }

  async function moderate(assetId: string, decision: "approved" | "restricted" | "rejected") {
    setBusy(assetId); setError(null);
    try {
      await apiFetch(`/api/v1/live-assets/stage/${assetId}/moderation`, { method: "POST", body: JSON.stringify({ decision }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_STAGE_MODERATION_FAILED");
    } finally { setBusy(null); }
  }

  return <main className="min-h-screen bg-[var(--allpha-space)] p-6 text-[var(--allpha-text)] sm:p-10">
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--allpha-cyan)]">Universe · Live Stage 3D</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Live Experience Stage Assets</h1>
      <p className="mt-4 max-w-3xl text-[var(--allpha-text-secondary)]">GLB lifecycle: prepare → signed upload → Storage verification → active → moderation. Runtime hanya menggunakan asset active + approved.</p>
      {error && <div className="mt-5 rounded-[var(--allpha-radius-md)] border border-[var(--allpha-danger)]/30 bg-[var(--allpha-danger)]/10 p-4 text-sm">{error}</div>}
      <section className="mt-8 rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)] p-6">
        {loading ? <p className="text-sm text-[var(--allpha-text-muted)]">Loading authoritative live templates…</p> : templates.length === 0 ? <p className="text-sm text-[var(--allpha-text-muted)]">No live templates are available.</p> : <div className="space-y-5">
          {templates.map(t => <article key={t.id} className="rounded-[var(--allpha-radius-md)] border border-white/10 p-5">
            <h2 className="font-semibold">{t.name}</h2><p className="mt-1 text-xs text-[var(--allpha-text-muted)]">{t.category} · {t.slug}</p>
            <div className="mt-4 space-y-3">{(versions[t.id] ?? []).map(v => {
              const versionAssets = (assets[t.id] ?? []).filter(a => a.template_version_id === v.id);
              return <div key={v.id} className="rounded-[var(--allpha-radius-sm)] border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm">Version {v.version}</span><span className="text-xs text-[var(--allpha-text-muted)]">{v.status} · validation {v.validation_status} · moderation {v.moderation_status}</span></div>
                <div className="mt-3 space-y-2">{versionAssets.length === 0 ? <p className="text-xs text-[var(--allpha-text-muted)]">No 3D Stage asset activated.</p> : versionAssets.map(a => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><div><p className="text-xs">{a.storage_path}</p><p className="text-[10px] text-[var(--allpha-text-muted)]">{a.status} · {a.moderation_status} · {a.content_size_bytes ?? 0} bytes</p></div><div className="flex gap-2">{a.status === "active" && <><button disabled={busy===a.id} onClick={() => void moderate(a.id,"approved")} className="rounded-lg border border-[var(--allpha-success)]/40 px-3 py-2 text-[10px]">Approve</button><button disabled={busy===a.id} onClick={() => void moderate(a.id,"restricted")} className="rounded-lg border border-[var(--allpha-warning)]/40 px-3 py-2 text-[10px]">Restrict</button><button disabled={busy===a.id} onClick={() => void moderate(a.id,"rejected")} className="rounded-lg border border-[var(--allpha-danger)]/40 px-3 py-2 text-[10px]">Reject</button></>}</div></div>)}</div>
                <label className="mt-3 inline-flex cursor-pointer rounded-lg border border-cyan-300/40 px-3 py-2 text-[10px]">{busy===`upload:${v.id}`?"Uploading…":"Upload GLB"}<input type="file" accept=".glb,model/gltf-binary" className="hidden" disabled={busy!==null} onChange={e => { const f=e.target.files?.[0]; e.currentTarget.value=""; if(f) void upload(v,f); }} /></label>
              </div>;
            })}</div>
          </article>)}
        </div>}
      </section>
    </div>
  </main>;
}
