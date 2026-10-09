"use client";

import { FormEvent, useEffect, useState } from "react";


type GenerationItem = {
  id?: string;
  asset_key?: string;
  asset_label?: string;
  status?: string;
  progress?: number;
  provider_task_id?: string;
  storage_bucket?: string;
  storage_path?: string;
  sha256?: string;
  byte_size?: number;
  model_url?: string | null;
  preview_url?: string | null;
  theme_asset_id?: string;
  error_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
};
type GenerationPackage = { id: string; status?: string; theme_name?: string; theme_id?: string; theme_version_id?: string };
type PackageResponse = { data?: { package?: GenerationPackage; items?: GenerationItem[] } };
type PricingResponse = { data?: { enabled?: boolean; credits_per_asset?: number; max_assets_per_package?: number } };

const categories = ["Universe", "Galaxy", "World", "District", "Booth", "Content Capsule", "Live Stage", "AI Character", "Uniform"];

export default function TripoGenerationPanel() {
  const [ownerKey, setOwnerKey] = useState("");
  const [category, setCategory] = useState("Universe");
  const [theme, setTheme] = useState("Crystal AI City");
  const [direction, setDirection] = useState("Cosmic blue-violet universe environment, cinematic realistic PBR materials, premium architectural visualization, atmospheric depth, elegant cyan-violet emissive accents, detailed physically plausible geometry, coherent scale and lighting. Must be a real scene asset suitable for AllphaWorldRenderer, not a primitive placeholder.");
  const [prompt, setPrompt] = useState("Create a complete premium futuristic AI city landmark environment: a monumental crystalline central tower, surrounding varied architectural buildings, connected roads and platforms, believable structural detail, realistic metallic and glass PBR materials, subtle cyan and violet emissive lighting, cinematic global illumination, atmospheric depth, clear silhouette, clean topology, no text, no logos, no watermark. Deliver a detailed 3D scene, not a single primitive.");
  const [faceLimit, setFaceLimit] = useState(50000);
  const [packageId, setPackageId] = useState("");
  const [pkg, setPkg] = useState<GenerationPackage | null>(null);
  const [item, setItem] = useState<GenerationItem | null>(null);
  const [pricing, setPricing] = useState<PricingResponse["data"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function ownerFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    const response = await fetch(baseUrl.replace(/\\/$/, "") + path, { ...init, headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}), "X-Allpha-Owner-Studio-Key": ownerKey, ...(init?.headers ?? {}) }, cache: "no-store" });
    if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.detail?.code ?? "API_" + response.status); }
    return response.json() as Promise<T>;
  }

  async function refreshPackage(id: string, quiet = false) {
    const result = await ownerFetch<PackageResponse>("/api/v1/theme-generation/owner/packages/" + encodeURIComponent(id));
    const nextPackage = result.data?.package ?? null;
    const nextItem = result.data?.items?.[0] ?? null;
    setPkg(nextPackage);
    setItem(nextItem);
    if (!quiet) setNotice(`Status pipeline: ${nextPackage?.status ?? "unknown"} · asset: ${nextItem?.status ?? "unknown"}`);
    return { nextPackage, nextItem };
  }

  useEffect(() => {
    if (!packageId || ["succeeded", "partial", "failed", "cancelled"].includes(pkg?.status ?? "")) return;
    const timer = setInterval(() => {
      void refreshPackage(packageId, true).catch((cause) => setError(cause instanceof Error ? cause.message : "THEME_PACKAGE_REFRESH_FAILED"));
    }, 5000);
    return () => clearInterval(timer);
  }, [packageId, pkg?.status]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice(""); setError(""); setPkg(null); setItem(null); setPackageId("");
    try {
      const key = `theme-studio-${crypto.randomUUID()}`;
      const result = await ownerFetch<PackageResponse>("/api/v1/theme-generation/owner/packages", {
        method: "POST",
        body: JSON.stringify({
          theme_name: theme.trim(),
          theme_direction: direction.trim(),
          face_limit: faceLimit,
          idempotency_key: key,
          assets: [{ key: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: category, prompt: prompt.trim() }],
        }),
      });
      const nextPackage = result.data?.package ?? null;
      const nextItem = result.data?.items?.[0] ?? null;
      if (!nextPackage?.id) throw new Error("THEME_PACKAGE_ID_MISSING");
      setPackageId(nextPackage.id); setPkg(nextPackage); setItem(nextItem);
      setNotice("Task dikirim melalui Theme Generation Orchestrator. Pipeline akan polling dan melakukan ingestion GLB ke Supabase Storage.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "THEME_GENERATION_FAILED");
    } finally { setBusy(false); }
  }

  async function checkNow() {
    if (!packageId) return;
    setBusy(true); setError("");
    try { await refreshPackage(packageId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "THEME_PACKAGE_REFRESH_FAILED"); }
    finally { setBusy(false); }
  }

  const completed = item?.status === "success";
  const failed = item?.status === "failed" || item?.status === "cancelled";
  const terminal = ["succeeded", "partial", "failed", "cancelled"].includes(pkg?.status ?? "");
  const preview = item?.preview_url;
  const model = item?.model_url;

  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-[#10172a] via-[#0a0d17] to-[#090b12] text-white shadow-2xl shadow-cyan-950/20">
      <header className="border-b border-white/10 p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[.28em] text-cyan-300">ALLPHA THEME STUDIO · TRIPO V3</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-2xl font-semibold">Generate 3D Theme</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">Jalur kanonis: Owner bypass (no user session/AI Credits) → Tripo task → GLB validation → Supabase Storage → theme_assets draft → signed URL. Aset tetap draft sampai moderation, validation, dan publish gates lolos.</p></div>
          <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-[10px] text-cyan-100">TRIPO_API_KEY server-side</span>
        </div>
      </header>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)]">
        <form onSubmit={generate} className="space-y-4 p-5 sm:p-6">
          <label className="block text-xs text-slate-400">Owner Studio access key<input type="password" value={ownerKey} onChange={(e) => setOwnerKey(e.target.value)} required autoComplete="off" placeholder="Owner-only key · no user session or AI Credits" className="mt-2 w-full rounded-xl border border-cyan-300/20 bg-black/30 px-3 py-3 font-mono text-sm text-white outline-none focus:border-cyan-300/50" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">Theme name<input value={theme} onChange={(e) => setTheme(e.target.value)} required maxLength={160} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50" /></label>
            <label className="text-xs text-slate-400">3D asset category<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50">{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <label className="block text-xs text-slate-400">Art direction<textarea value={direction} onChange={(e) => setDirection(e.target.value)} required minLength={8} maxLength={2000} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50" /></label>
          <label className="block text-xs text-slate-400">Detailed Tripo prompt<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required minLength={8} maxLength={850} rows={6} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50" /></label>
          <div><div className="flex items-center justify-between text-xs text-slate-400"><label htmlFor="tripo-face-limit">Face budget</label><span className="font-mono text-cyan-200">{faceLimit.toLocaleString("en-US")}</span></div><input id="tripo-face-limit" type="range" min={10000} max={100000} step={10000} value={faceLimit} onChange={(e) => setFaceLimit(Number(e.target.value))} className="mt-3 w-full accent-cyan-300" /></div>
          {pricing && <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-slate-400">Billing policy: {pricing.enabled ? "enabled" : "disabled"} · {pricing.credits_per_asset ?? "—"} AI Credits / asset · max {pricing.max_assets_per_package ?? "—"} assets/package. Satu aset akan dikirim pada eksekusi ini.</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-200">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-xs text-cyan-100">{notice}</p>}
          <button disabled={busy || !ownerKey.trim()} className="w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-50">{busy ? "Processing canonical pipeline…" : "Generate 3D Theme ↗"}</button>
          <p className="text-[10px] leading-4 text-slate-500">Owner-only pipeline melewati autentikasi user dan AI Credits; workflow, validasi, moderasi, serta publish gates tetap wajib.</p>
        </form>
        <aside className="border-t border-white/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Pipeline evidence</h3><span className={`rounded-full border px-2.5 py-1 text-[10px] ${completed ? "border-emerald-300/30 text-emerald-200" : failed ? "border-rose-300/30 text-rose-200" : "border-white/10 text-slate-400"}`}>{item?.status ?? pkg?.status ?? "Waiting"}</span></div>
          {typeof item?.progress === "number" && <div className="mt-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Tripo progress</span><span>{item.progress}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} /></div></div>}
          <div className="mt-4 flex min-h-[210px] items-center justify-center rounded-2xl border border-white/10 bg-black/25 p-3">{preview ? <img src={preview} alt="Preview hasil generasi Tripo" className="max-h-[300px] w-full rounded-xl object-contain" /> : <div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-200/20 bg-cyan-300/5 text-3xl text-cyan-200">✧</div><p className="mt-4 text-xs text-slate-400">Preview asli muncul setelah Tripo selesai.</p><p className="mt-1 text-[10px] text-slate-600">Tidak ada placeholder yang dipromosikan.</p></div>}</div>
          {packageId && <div className="mt-3 space-y-2 rounded-xl border border-white/10 p-3"><p className="break-all font-mono text-[10px] text-slate-500">Package: {packageId}</p>{item?.provider_task_id && <p className="break-all font-mono text-[10px] text-slate-500">Tripo task: {item.provider_task_id}</p>}<button type="button" onClick={() => void checkNow()} disabled={busy || terminal} className="w-full rounded-lg border border-cyan-300/30 px-3 py-2.5 text-xs text-cyan-100 disabled:opacity-50">{busy ? "Checking…" : "Refresh pipeline evidence"}</button></div>}
          {model && <a href={model} target="_blank" rel="noreferrer" className="mt-3 block break-all rounded-xl border border-emerald-300/20 p-3 text-xs text-emerald-200">Open signed Storage GLB ↗</a>}
          {item && <dl className="mt-3 space-y-2 rounded-xl border border-white/10 p-3 text-[10px]"><div className="flex justify-between gap-3"><dt className="text-slate-500">Storage bucket</dt><dd className="break-all text-right text-slate-300">{item.storage_bucket ?? "Not ingested"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Storage path</dt><dd className="break-all text-right text-slate-300">{item.storage_path ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">SHA-256</dt><dd className="break-all text-right text-slate-300">{item.sha256 ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Byte size</dt><dd className="text-right text-slate-300">{item.byte_size?.toLocaleString() ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Theme asset ID</dt><dd className="break-all text-right text-slate-300">{item.theme_asset_id ?? "—"}</dd></div></dl>}
          {item?.error_code && <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-200">{item.error_code}: {item.error_message}</p>}
          <div className="mt-5 space-y-2">{["Real Tripo provider task", "GLB validation + SHA-256", "Supabase Storage + theme_assets", "Signed URL verification", "Moderation / validation / publish gates", "Canonical manifest + AllphaWorldRenderer"].map((step, index) => <div key={step} className="flex items-center gap-3 text-xs"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-[9px] text-cyan-200">{String(index + 1).padStart(2, "0")}</span><span className="text-slate-400">{step}</span></div>)}</div>
        </aside>
      </div>
    </section>
  );
}
