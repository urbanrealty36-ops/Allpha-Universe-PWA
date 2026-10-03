"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../lib/api";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { normalizeWorldScene, type WorldScene } from "../lib/world-engine/scene-schema";

const AllphaWorldRenderer = dynamic(() => import("./world/allpha-world-renderer"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[420px] items-center justify-center rounded-3xl bg-black text-sm text-slate-500">Preparing spatial runtime…</div>,
});

type Theme = { id: string; name: string; slug: string; tokens?: Record<string, unknown>; world_schema?: unknown };
type Galaxy = { id: string; name: string; slug: string; status: string };
type World = { id: string; galaxy_id: string; name: string; slug: string; status: string; theme_key?: string | null; world_type?: string };
type District = { id: string; world_id: string; name: string; slug: string; status: string; theme_key?: string | null };
type Zone = { id: string; district_id: string; zone_key: string; name: string; zone_type: string; status: string };
type Booth = { id: string; district_id: string; district_zone_id?: string | null; name: string; slug: string; status: string; theme_key?: string | null; booth_type: string };\ntype Content = { id: string; title: string | null; content_type: string; status: string };
type Manifest = { binary_3d_assets?: Array<{ id: string; signed_url?: string | null }> };

export default function ThemeSpatialSlice({ theme }: { theme: Theme | null }) {
  const [galaxies, setGalaxies] = useState<Galaxy[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState("");
  const [boothAssetUrls, setBoothAssetUrls] = useState<Record<string,string>>({});\n  const [content, setContent] = useState<Content[]>([]);
  const [galaxyId, setGalaxyId] = useState("");
  const [worldId, setWorldId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [binaryUrl, setBinaryUrl] = useState<string | null>(null);

  const [galaxyName, setGalaxyName] = useState("");
  const [worldName, setWorldName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [boothName, setBoothName] = useState("");\n  const [contentTitle, setContentTitle] = useState("");\n  const [contentBody, setContentBody] = useState("");

  const scene = useMemo<WorldScene | null>(() => theme ? normalizeWorldScene(theme.world_schema) : null, [theme]);

  async function loadGalaxies() {
    const r = await apiFetch<{ data: Galaxy[] }>("/api/v1/universe/galaxies");
    setGalaxies(r.data ?? []);
  }
  async function loadWorlds(gid?: string) {
    const r = await apiFetch<{ data: World[] }>(gid ? `/api/v1/universe/worlds?galaxy_id=${encodeURIComponent(gid)}` : "/api/v1/universe/worlds");
    setWorlds(r.data ?? []);
  }
  async function loadDistricts(wid: string) {
    const r = await apiFetch<{ data: District[] }>(`/api/v1/districts?world_id=${encodeURIComponent(wid)}`);
    setDistricts(r.data ?? []);
  }
  async function loadZones(did: string) {
    const r = await apiFetch<{ data: Zone[] }>(`/api/v1/districts/${did}/zones`);
    setZones(r.data ?? []);
  }
  async function loadBooths(did: string) {
    const r = await apiFetch<{ data: Booth[] }>(`/api/v1/booths?district_id=${did}`);
    const next = r.data ?? [];
    setBooths(next);
    const assets = await Promise.all(next.map(async b => {
      try {
        const a = await apiFetch<{ data: Array<{ signed_url?: string | null }> }>(`/api/v1/booths/${b.id}/assets/3d`);
        return [b.id, a.data?.[0]?.signed_url ?? null] as const;
      } catch {
        return [b.id, null] as const;
      }
    }));
    setBoothAssetUrls(Object.fromEntries(assets.filter(([,url]) => Boolean(url)) as Array<[string,string]>));
  }

  useEffect(() => { void Promise.all([loadGalaxies(), loadContent()]).catch(e => setError(e instanceof Error ? e.message : "SPATIAL_BOOTSTRAP_FAILED")); }, []);
  useEffect(() => {
    if (!galaxyId) return;
    void loadWorlds(galaxyId).catch(e => setError(e instanceof Error ? e.message : "WORLD_LOAD_FAILED"));
  }, [galaxyId]);
  useEffect(() => {
    if (!worldId) return;
    void loadDistricts(worldId).catch(e => setError(e instanceof Error ? e.message : "DISTRICT_LOAD_FAILED"));
    if (theme?.id) {
      void apiFetch<{ data: Manifest }>(`/api/v1/themes/world-runtime/themes/${theme.id}/asset-manifest`)
        .then(r => setBinaryUrl(r.data?.binary_3d_assets?.find(a => a.signed_url)?.signed_url ?? null))
        .catch(() => setBinaryUrl(null));
    }
  }, [worldId, theme?.id]);
  useEffect(() => {
    if (!districtId) return;
    void Promise.all([loadZones(districtId), loadBooths(districtId)])
      .catch(e => setError(e instanceof Error ? e.message : "DISTRICT_COMPOSITION_LOAD_FAILED"));
  }, [districtId]);

  async function createGalaxy(e: FormEvent) {
    e.preventDefault(); if (!galaxyName.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch("/api/v1/universe/galaxies", {
        method: "POST",
        body: JSON.stringify({ name: galaxyName.trim(), slug: slugify(galaxyName), visibility: "public", metadata: { presentation_theme: theme?.slug ?? null } }),
      });
      setGalaxyName(""); await loadGalaxies(); const created = (await apiFetch<{ data: Galaxy[] }>("/api/v1/universe/galaxies")).data?.find(x => x.slug === slugify(galaxyName)); if (created) setGalaxyId(created.id);
    } catch (e) { setError(e instanceof Error ? e.message : "GALAXY_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function createWorld(e: FormEvent) {
    e.preventDefault(); if (!galaxyId || !worldName.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch("/api/v1/universe/worlds", {
        method: "POST",
        body: JSON.stringify({
          galaxy_id: galaxyId, name: worldName.trim(), slug: slugify(worldName),
          world_type: "social", visibility: "public", theme_key: theme?.slug ?? null,
          spatial_config: { presentation_only: true, theme_id: theme?.id ?? null },
          metadata: { created_from: "theme-studio" },
        }),
      });
      const createdName = worldName.trim(); setWorldName(""); await loadWorlds(galaxyId); const created = (await apiFetch<{ data: World[] }>(`/api/v1/universe/worlds?galaxy_id=${encodeURIComponent(galaxyId)}`)).data?.find(x => x.slug === slugify(createdName)); if (created) setWorldId(created.id);
    } catch (e) { setError(e instanceof Error ? e.message : "WORLD_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function createDistrict(e: FormEvent) {
    e.preventDefault(); if (!worldId || !districtName.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch("/api/v1/districts", {
        method: "POST",
        body: JSON.stringify({
          world_id: worldId, name: districtName.trim(), slug: slugify(districtName),
          district_type: "general", visibility: "public", theme_key: theme?.slug ?? null,
          spatial_config: { presentation_only: true, theme_id: theme?.id ?? null },
          metadata: { created_from: "theme-studio" },
        }),
      });
      const createdName = districtName.trim(); setDistrictName(""); await loadDistricts(worldId); const created = (await apiFetch<{ data: District[] }>(`/api/v1/districts?world_id=${encodeURIComponent(worldId)}`)).data?.find(x => x.slug === slugify(createdName)); if (created) setDistrictId(created.id);
    } catch (e) { setError(e instanceof Error ? e.message : "DISTRICT_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function createZone(e: FormEvent) {
    e.preventDefault(); if (!districtId || !zoneName.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch(` /api/v1/districts/${districtId}/zones`.trim(), {
        method: "POST",
        body: JSON.stringify({
          zone_key: slugify(zoneName), name: zoneName.trim(), zone_type: "public",
          spatial_config: { presentation_only: true }, metadata: { created_from: "theme-studio" },
        }),
      });
      const createdName = zoneName.trim(); setZoneName(""); await loadZones(districtId); const created = (await apiFetch<{ data: Zone[] }>(`/api/v1/districts/${districtId}/zones`)).data?.find(x => x.zone_key === slugify(createdName)); if (created) setZoneId(created.id);
    } catch (e) { setError(e instanceof Error ? e.message : "ZONE_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  async function createContent(e: FormEvent) {
    e.preventDefault(); if (!worldId || !contentTitle.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch("/api/v1/content", {
        method: "POST",
        body: JSON.stringify({
          content_type: "post", title: contentTitle.trim(), body: contentBody.trim() || null,
          visibility: "public", metadata: { presentation_only: true, theme_id: theme?.id ?? null, created_from: "theme-studio" },
        }),
      });
      const createdTitle = contentTitle.trim();
      setContentTitle(""); setContentBody("");
      const r = await apiFetch<{ data: Content[] }>("/api/v1/content?mine=true&limit=100");
      setContent(r.data ?? []);
      const created = (r.data ?? []).find(x => x.title === createdTitle && x.status === "draft");
      if (created) {
        await apiFetch(`/api/v1/universe/worlds/${worldId}/content`, {
          method: "POST",
          body: JSON.stringify({ content_id: created.id, placement: "spatial", sort_order: r.data?.length ?? 0 }),
        });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "CONTENT_CREATE_OR_LINK_FAILED"); }
    finally { setBusy(false); }
  }


  async function uploadBooth3D(file: File) {
    if (!selectedBoothId) return;
    setBusy(true); setError(null);
    try {
      if (file.type !== "model/gltf-binary" && !file.name.toLowerCase().endsWith(".glb")) throw new Error("BOOTH_3D_GLB_REQUIRED");
      const prepared = await apiFetch<{ data: { asset: { id:string; storage_bucket:string }; upload:{path:string;token:string} } }>(`/api/v1/booths/${selectedBoothId}/assets/3d/upload-url`, { method:"POST" });
      const supabase = createSupabaseBrowserClient();
      const uploaded = await supabase.storage.from(prepared.data.asset.storage_bucket).uploadToSignedUrl(prepared.data.upload.path, prepared.data.upload.token, file);
      if (uploaded.error) throw new Error(uploaded.error.message);
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const checksum = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
      await apiFetch(`/api/v1/booths/${selectedBoothId}/assets/${prepared.data.asset.id}/3d/finalize?checksum_sha256=${encodeURIComponent(checksum)}`, { method:"POST" });
      await loadBooths(districtId);
    } catch (e) { setError(e instanceof Error ? e.message : "BOOTH_3D_UPLOAD_FAILED"); }
    finally { setBusy(false); }
  }

  async function createBooth(e: FormEvent) {
    e.preventDefault(); if (!districtId || !boothName.trim()) return;
    setBusy(true); setError(null);
    try {
      await apiFetch("/api/v1/booths", {
        method: "POST",
        body: JSON.stringify({
          district_id: districtId, district_zone_id: zoneId || null,
          name: boothName.trim(), slug: slugify(boothName),
          booth_type: "personal", tier: "free", theme_key: theme?.slug ?? null,
          scene_config: { presentation_only: true, theme_id: theme?.id ?? null },
          display_config: { presentation_only: true }, catalog_config: {}, live_entry_config: {},
        }),
      });
      setBoothName(""); await loadBooths(districtId);
    } catch (e) { setError(e instanceof Error ? e.message : "BOOTH_CREATE_FAILED"); }
    finally { setBusy(false); }
  }

  const renderContent = content.slice(0, 16).map((item, i) => ({\n    id: item.id, title: item.title, position: { x: (i % 4) * 2.4 - 3.6, y: 2 + (i % 2) * 0.4, z: -1 + Math.floor(i / 4) * 2.2 },\n  }));\n\n  const renderBooths = booths.map((b, i) => ({
    id: b.id, kind: "booth" as const, label: b.name,
    position: { x: (i % 4) * 3 - 4.5, y: 0, z: Math.floor(i / 4) * 3 - 3 },
    metadata: { booth_id: b.id, district_id: b.district_id, zone_id: b.district_zone_id ?? null, status: b.status, model_url: boothAssetUrls[b.id] ?? null },
  }));

  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 p-5">
        <p className="text-[9px] uppercase tracking-[0.25em] text-cyan-300">Vertical Slice · Spatial Runtime</p>
        <h2 className="mt-1 text-xl font-semibold">Theme → Galaxy → World → District → Zone → Booth</h2>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
          Ini bukan data demo. Setiap create memakai endpoint FastAPI authoritative dan hanya membuat record saat user benar-benar menekan Create.
        </p>
      </div>
      {error && <div className="m-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100">{error}</div>}
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <FlowCard step="01" title="Galaxy" selected={galaxyId}>
            <select value={galaxyId} onChange={e => setGalaxyId(e.target.value)} className={inputClass}><option value="">Select existing Galaxy</option>{galaxies.map(g => <option key={g.id} value={g.id}>{g.name} · {g.status}</option>)}</select>
            <form onSubmit={createGalaxy} className="mt-2 flex gap-2"><input value={galaxyName} onChange={e => setGalaxyName(e.target.value)} placeholder="New Galaxy name" className={inputClass}/><button disabled={busy || !galaxyName.trim()} className={buttonClass}>Create</button></form>
          </FlowCard>
          <FlowCard step="02" title="World" selected={worldId}>
            <select value={worldId} onChange={e => setWorldId(e.target.value)} disabled={!galaxyId} className={inputClass}><option value="">Select World</option>{worlds.map(w => <option key={w.id} value={w.id}>{w.name} · {w.status}</option>)}</select>
            <form onSubmit={createWorld} className="mt-2 flex gap-2"><input value={worldName} onChange={e => setWorldName(e.target.value)} placeholder="New World name" className={inputClass}/><button disabled={busy || !galaxyId || !worldName.trim()} className={buttonClass}>Create</button></form>
          </FlowCard>
          <FlowCard step="03" title="District" selected={districtId}>
            <select value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!worldId} className={inputClass}><option value="">Select District</option>{districts.map(d => <option key={d.id} value={d.id}>{d.name} · {d.status}</option>)}</select>
            <form onSubmit={createDistrict} className="mt-2 flex gap-2"><input value={districtName} onChange={e => setDistrictName(e.target.value)} placeholder="New District name" className={inputClass}/><button disabled={busy || !worldId || !districtName.trim()} className={buttonClass}>Create</button></form>
          </FlowCard>
          <FlowCard step="04" title="Zone" selected={zoneId}>
            <select value={zoneId} onChange={e => setZoneId(e.target.value)} disabled={!districtId} className={inputClass}><option value="">Select Zone</option>{zones.map(z => <option key={z.id} value={z.id}>{z.name} · {z.status}</option>)}</select>
            <form onSubmit={createZone} className="mt-2 flex gap-2"><input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="New Zone name" className={inputClass}/><button disabled={busy || !districtId || !zoneName.trim()} className={buttonClass}>Create</button></form>
          </FlowCard>
          <FlowCard step="05" title="Booth" selected={booths.length > 0}>
            <div className="mb-2 text-[10px] text-slate-500">{booths.length} Booth tersimpan pada District aktif.</div>
            <select value={selectedBoothId} onChange={e => setSelectedBoothId(e.target.value)} disabled={!districtId} className={inputClass}><option value="">Select Booth for 3D asset</option>{booths.map(b => <option key={b.id} value={b.id}>{b.name} · {b.status}</option>)}</select>
            {selectedBoothId && <label className="inline-flex cursor-pointer rounded-xl border border-cyan-300/40 px-3 py-2 text-[10px]">{busy ? "Uploading…" : boothAssetUrls[selectedBoothId] ? "Replace Booth GLB" : "Upload Booth GLB"}<input type="file" accept=".glb,model/gltf-binary" className="hidden" disabled={busy} onChange={e => { const f=e.target.files?.[0]; e.currentTarget.value=""; if(f) void uploadBooth3D(f); }} /></label>}
            <p className="text-[9px] text-slate-600">{selectedBoothId && boothAssetUrls[selectedBoothId] ? "REAL BOOTH GLB ACTIVE" : "Belum ada Booth GLB active untuk Booth terpilih."}</p>
            <form onSubmit={createBooth className="flex gap-2"><input value={boothName} onChange={e => setBoothName(e.target.value)} placeholder="New Booth name" className={inputClass}/><button disabled={busy || !districtId || !boothName.trim()} className={buttonClass}>Create</button></form>
          </FlowCard>
        </div>
          <FlowCard step="06" title="Feed / Content Universe" selected={content.length > 0}>
            <div className="mb-2 text-[10px] text-slate-500">{content.length} content milik user tersedia. Create akan mencoba menempatkan Content ke World sebagai spatial discovery.</div>
            <form onSubmit={createContent} className="space-y-2">
              <input value={contentTitle} onChange={e => setContentTitle(e.target.value)} placeholder="Content title" className={inputClass}/>
              <textarea value={contentBody} onChange={e => setContentBody(e.target.value)} placeholder="Content body (optional)" rows={3} className={inputClass}/>
              <button disabled={busy || !worldId || !contentTitle.trim()} className={buttonClass}>Create & Link to World</button>
            </form>
          </FlowCard>
        <div className="min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-black">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div><p className="text-[9px] uppercase tracking-[0.2em] text-violet-300">Canonical Renderer</p><p className="mt-1 text-xs text-white/70">{theme?.name ?? "Theme"} · {worldId ? "World selected" : "Select World"}</p></div>
            <span className={binaryUrl ? "rounded-full border border-emerald-300/20 px-2 py-1 text-[9px] text-emerald-200" : "rounded-full border border-amber-300/20 px-2 py-1 text-[9px] text-amber-200"}>{binaryUrl ? "REAL GLB" : "PROCEDURAL"}</span>
          </div>
          <div className="h-[470px]">
            {scene && worldId ? <AllphaWorldRenderer scene={scene} tokens={theme?.tokens} themePackUrl={binaryUrl} booths={renderBooths} content={renderContent} selectedDistrictId={districtId} /> : <div className="flex h-full items-center justify-center px-8 text-center text-sm text-slate-500">Buat/pilih World untuk mengaktifkan spatial vertical slice.</div>}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3 text-[9px] text-slate-500 sm:grid-cols-4">
            <Stat label="World" value={worldId ? "1" : "0"} />
            <Stat label="District" value={districtId ? "1" : "0"} />
            <Stat label="Zone" value={zones.length.toString()} />
            <Stat label="Booth" value={booths.length.toString()} />
            <Stat label="Content" value={content.length.toString()} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowCard({ step, title, selected, children }: { step: string; title: string; selected: string | boolean; children: ReactNode }) {
  return <div className={`rounded-2xl border p-3 ${selected ? "border-cyan-300/30 bg-cyan-300/[0.025]" : "border-white/10 bg-black/10"}`}><div className="mb-2 flex items-center gap-2"><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-slate-500">{step}</span><span className="text-xs font-semibold">{title}</span></div>{children}</div>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2"><p className="text-[8px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-xs text-white/70">{value}</p></div>; }
const inputClass = "w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white outline-none focus:border-cyan-300/40";
const buttonClass = "shrink-0 rounded-xl bg-cyan-300 px-3 py-2 text-[10px] font-semibold text-slate-950 disabled:opacity-30";
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160) || `item-${Date.now()}`; }
