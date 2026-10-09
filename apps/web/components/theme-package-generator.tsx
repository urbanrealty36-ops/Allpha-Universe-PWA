"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type AssetTask = { key: string; label: string; prompt: string; taskId?: string; status: string; progress?: number; modelUrl?: string; previewUrl?: string; error?: string };
type ApiResponse = { data?: { task_id?: string; status?: string; progress?: number; output?: { model_url?: string; rendered_image_url?: string; [key: string]: unknown }; credits_consumed?: number } };
type PackageResponse = { package?: { id: string; status: string; metadata?: Record<string, unknown> }; items?: Array<{ asset_key: string; provider_task_id?: string; status: string; progress?: number; model_url?: string; preview_url?: string; error_message?: string }> };
type PricingResponse = { data?: { enabled: boolean; credits_per_asset: number; max_assets_per_package: number } };

const packageParts = [
  { key: "universe", label: "Universe / Galaxy", prompt: "Cinematic premium 3D universe environment, monumental luminous galaxy architecture, layered nebula, physically based materials, refined sci-fi worldbuilding, strong composition, optimized clean topology." },
  { key: "world", label: "World / District", prompt: "Premium architectural 3D world district environment, coherent streetscape, landmark buildings, detailed facades, landscape elements, realistic scale, cinematic natural lighting, physically based materials." },
  { key: "booth", label: "Booth / Portal", prompt: "High-end futuristic modular 3D booth and portal, premium brushed metal, glass, subtle emissive accents, realistic construction details, clean topology, PBR materials, suitable for a social virtual world." },
  { key: "content", label: "Content Capsule", prompt: "Distinctive premium 3D content capsule object, sculptural compact silhouette, glass and brushed metal, subtle cyan-violet luminous details, high quality PBR, clear readable shape." },
  { key: "stage", label: "Live Experience Stage", prompt: "Photorealistic premium live broadcast stage, cinematic key and rim lighting, acoustic panels, stage floor, professional cameras, seating, large abstract display, physically based materials, realistic proportions, no text." },
  { key: "character", label: "AI Character", prompt: "Stylized-realistic premium humanoid AI character, neutral A-pose, full body visible, symmetrical anatomy, clean silhouette, detailed modern futuristic outfit, realistic hands and feet, studio lighting, rig-friendly pose, no weapon, no text." },
  { key: "uniform", label: "Human Character / Uniform", prompt: "Premium full-body futuristic human avatar uniform on a neutral mannequin in A-pose, tailored technical fabric, detailed seams and trims, realistic cloth material, front-facing, isolated studio presentation, no logo, no text." },
  { key: "spatial", label: "Spatial FX / Navigation", prompt: "Premium 3D spatial navigation artifact for a futuristic social universe, elegant floating wayfinding ring, portal markers, luminous but restrained cyan and violet energy, clean mesh and PBR materials." },
  { key: "social", label: "Social 3D / Sticker", prompt: "Premium expressive 3D social reaction emblem, sculpted translucent glass and soft metallic finish, distinctive friendly silhouette, clean topology, studio render, no lettering." },
];

export default function ThemePackageGenerator() {
  const [themeName, setThemeName] = useState("Crystal AI City");
  const [themeDirection, setThemeDirection] = useState("Photorealistic cinematic sci-fi, premium architectural visualization, physically based materials, refined cyan and violet accents, consistent material language, no text or watermark.");
  const [selected, setSelected] = useState<string[]>(["universe"]);
  const [faceLimit, setFaceLimit] = useState(50000);
  const [tasks, setTasks] = useState<AssetTask[]>([]);
  const [packageId, setPackageId] = useState("");
  const [packageStatus, setPackageStatus] = useState("");
  const [pricing, setPricing] = useState<PricingResponse["data"] | null>(null);
  const [pricingError, setPricingError] = useState("");
  const [pricingSaving, setPricingSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [validationStatus, setValidationStatus] = useState("");
  const [validationPassed, setValidationPassed] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("");
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [creditsPerAsset, setCreditsPerAsset] = useState(1);
  const [generationEnabled, setGenerationEnabled] = useState(true);
  const [maxAssets, setMaxAssets] = useState(25);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState("");
  const [rigCheckId, setRigCheckId] = useState("");
  const [rigCheckResult, setRigCheckResult] = useState<{ status?: string; riggable?: boolean; rig_type?: string } | null>(null);
  const [rigTaskId, setRigTaskId] = useState("");
  const [rigTaskStatus, setRigTaskStatus] = useState("");
  const [animationTaskId, setAnimationTaskId] = useState("");
  const [animationTaskStatus, setAnimationTaskStatus] = useState("");
  const [error, setError] = useState("");

  const finished = useMemo(() => tasks.filter((task) => task.status === "success").length, [tasks]);
  useEffect(() => {
    let mounted = true;
    void apiFetch<PricingResponse>("/api/v1/theme-generation/pricing")
      .then((response) => { if (mounted) { setPricing(response.data ?? null); setCreditsPerAsset(response.data?.credits_per_asset ?? 1); setGenerationEnabled(response.data?.enabled ?? false); setMaxAssets(response.data?.max_assets_per_package ?? 25); } })
      .catch((cause) => { if (mounted) setPricingError(cause instanceof Error ? cause.message : "THEME_PRICING_LOAD_FAILED"); });
    return () => { mounted = false; };
  }, []);

  async function savePricing() {
    if (pricingSaving) return;
    setPricingSaving(true);
    setPricingError("");
    try {
      const response = await apiFetch<PricingResponse>("/api/v1/theme-generation/pricing", {
        method: "PUT",
        body: JSON.stringify({ enabled: generationEnabled, credits_per_asset: creditsPerAsset, max_assets_per_package: maxAssets }),
      });
      setPricing(response.data ?? null);
    } catch (cause) {
      setPricingError(cause instanceof Error ? cause.message : "THEME_PRICING_UPDATE_FAILED");
    } finally {
      setPricingSaving(false);
    }
  }

  const toggle = (key: string) => { if (key !== "universe") return; setSelected(["universe"]); };

  async function generatePackage() {
    if (!selected.length || busy) return;
    setBusy(true);
    setError("");
    const chosen = packageParts.filter((part) => selected.includes(part.key));
    setTasks(chosen.map((part) => ({ ...part, status: "queued" })));
    setCurrent("Theme Package Orchestrator");
    try {
      const response = await apiFetch<PackageResponse>("/api/v1/theme-generation/packages", {
        method: "POST",
        body: JSON.stringify({
          theme_name: themeName.trim(),
          theme_direction: themeDirection,
          idempotency_key: globalThis.crypto.randomUUID(),
          face_limit: faceLimit,
          assets: chosen.map((part) => ({
            key: part.key,
            label: part.label,
            prompt: `${themeName}: ${part.label}. ${themeDirection} Asset-specific brief: ${part.prompt}`.slice(0, 1024),
          })),
        }),
      });
      const pkg = response.package;
      if (!pkg?.id) throw new Error("THEME_PACKAGE_ID_MISSING");
      setPackageId(pkg.id);
      setPackageStatus(pkg.status);
      const items = response.items ?? [];
      setTasks(chosen.map((part) => {
        const item = items.find((candidate) => candidate.asset_key === part.key);
        return { ...part, taskId: item?.provider_task_id, status: item?.status ?? "queued", progress: item?.progress, modelUrl: item?.model_url, previewUrl: item?.preview_url, error: item?.error_message };
      }));
      if (items.some((item) => item.status === "failed")) setError("Sebagian aset gagal dikirim. Periksa provider lalu retry aset gagal.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "THEME_PACKAGE_CREATE_FAILED");
    } finally {
      setCurrent("");
      setBusy(false);
    }
  }
  async function providerTask(taskId: string) {
    const response = await apiFetch<ApiResponse>(`/api/v1/3d-generation/tasks/${encodeURIComponent(taskId)}`);
    return response.data;
  }

  async function runRigCheck() {
    const character = tasks.find((task) => task.key === "character");
    if (!character?.taskId || character.status !== "success") {
      setError("Generate AI Character and refresh its task until status success before rig-check.");
      return;
    }
    setError("");
    try {
      const response = await apiFetch<ApiResponse>("/api/v1/3d-generation/animations/rig-check", {
        method: "POST",
        body: JSON.stringify({ input: character.taskId }),
      });
      setRigCheckId(response.data?.task_id ?? "");
      setRigCheckResult({ status: "queued" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_RIG_CHECK_FAILED");
    }
  }

  async function refreshRigCheck() {
    if (!rigCheckId) return;
    try {
      const data = await providerTask(rigCheckId);
      setRigCheckResult({ status: data?.status, riggable: data?.output?.riggable === true, rig_type: typeof data?.output?.rig_type === "string" ? data.output.rig_type : undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_RIG_CHECK_QUERY_FAILED");
    }
  }

  async function runRig() {
    const character = tasks.find((task) => task.key === "character");
    if (!character?.taskId || rigCheckResult?.status !== "success" || rigCheckResult.riggable !== true) return;
    try {
      const response = await apiFetch<ApiResponse>("/api/v1/3d-generation/animations/rig", {
        method: "POST",
        body: JSON.stringify({ input: character.taskId, rig_type: rigCheckResult.rig_type ?? "biped", spec: "mixamo", out_format: "glb" }),
      });
      setRigTaskId(response.data?.task_id ?? "");
      setRigTaskStatus(response.data?.task_id ? "queued" : "error");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_RIG_FAILED");
    }
  }

  async function refreshRigTask() {
    if (!rigTaskId) return;
    try {
      const data = await providerTask(rigTaskId);
      setRigTaskStatus(data?.status ?? "unknown");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_RIG_QUERY_FAILED");
    }
  }

  async function runRetarget() {
    if (!rigTaskId || rigTaskStatus !== "success") return;
    try {
      const response = await apiFetch<ApiResponse>("/api/v1/3d-generation/animations/retarget", {
        method: "POST",
        body: JSON.stringify({ input: rigTaskId, animations: ["preset:idle", "preset:walk", "preset:run"] }),
      });
      setAnimationTaskId(response.data?.task_id ?? "");
      setAnimationTaskStatus(response.data?.task_id ? "queued" : "error");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_RETARGET_FAILED");
    }
  }

  async function refreshAnimationTask() {
    if (!animationTaskId) return;
    try {
      const data = await providerTask(animationTaskId);
      setAnimationTaskStatus(data?.status ?? "unknown");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_ANIMATION_QUERY_FAILED");
    }
  }

  async function validatePackage() {
    if (!packageId || lifecycleBusy) return;
    setLifecycleBusy(true);
    setError("");
    try {
      const response = await apiFetch<{ data?: { validation?: unknown } }>("/api/v1/theme-generation/packages/" + packageId + "/validate", { method: "POST" });
      const result = response.data?.validation ?? { status: "submitted" };
      const serialized = JSON.stringify(result);
      setValidationStatus(serialized);
      setValidationPassed(/"validation_status"\s*:\s*"passed"/i.test(serialized) || /"status"\s*:\s*"passed"/i.test(serialized));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "THEME_VALIDATION_FAILED");
      setValidationStatus("failed");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function submitForReview() {
    if (!packageId || lifecycleBusy || !validationPassed) return;
    setLifecycleBusy(true);
    setError("");
    try {
      const response = await apiFetch<{ data?: { submission?: unknown } }>("/api/v1/theme-generation/packages/" + packageId + "/submit-review", { method: "POST" });
      setReviewStatus(JSON.stringify(response.data?.submission ?? { status: "submitted" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "THEME_REVIEW_SUBMISSION_FAILED");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function retryFailedAssets() {
    if (!packageId || retrying) return;
    setRetrying(true);
    setError("");
    try {
      const response = await apiFetch<{ data?: PackageResponse }>("/api/v1/theme-generation/packages/" + packageId + "/retry", { method: "POST" });
      const items = response.data?.items ?? [];
      setTasks((currentItems) => currentItems.map((part) => {
        const item = items.find((candidate) => candidate.asset_key === part.key);
        return item ? { ...part, taskId: item.provider_task_id, status: item.status, progress: item.progress, modelUrl: item.model_url, previewUrl: item.preview_url, error: item.error_message } : part;
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "THEME_PACKAGE_RETRY_FAILED");
    } finally {
      setRetrying(false);
    }
  }

  async function refreshOne(key: string) {
    if (!packageId) return;
    const task = tasks.find((item) => item.key === key);
    if (!task) return;
    setTasks((items) => items.map((item) => item.key === key ? { ...item, status: "checking" } : item));
    try {
      const response = await apiFetch<{ data?: PackageResponse }>(`/api/v1/theme-generation/packages/${packageId}`);
      const items = response.data?.items ?? [];
      setPackageStatus(response.data?.package?.status ?? packageStatus);
      const item = items.find((candidate) => candidate.asset_key === key);
      if (!item) throw new Error("THEME_ASSET_NOT_FOUND");
      setTasks((currentItems) => currentItems.map((currentItem) => currentItem.key === key ? {
        ...currentItem, taskId: item.provider_task_id, status: item.status, progress: item.progress,
        modelUrl: item.model_url, previewUrl: item.preview_url, error: item.error_message,
      } : currentItem));
    } catch (cause) {
      setTasks((items) => items.map((item) => item.key === key ? { ...item, status: "error", error: cause instanceof Error ? cause.message : "THEME_PACKAGE_REFRESH_FAILED" } : item));
    }
  }
  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-7 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <a href="/theme-studio" className="text-xs text-cyan-200 hover:text-cyan-100">← Back to Theme Studio</a>
        <header className="mt-5 rounded-[2rem] border border-cyan-200/15 bg-gradient-to-br from-[#142536] via-[#0b111e] to-[#080a11] p-6 sm:p-9">
          <p className="text-[10px] uppercase tracking-[.32em] text-cyan-200">Allpha Universe · Theme Package Lab</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Generate one golden Theme V2 model</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">Mulai dari satu golden asset untuk Allpha Web App: Crystal AI City — Universe / Galaxy. Validasi kualitas visual, GLB, signed URL, registrasi theme_assets, dan render di AllphaWorldRenderer sebelum memperluas ke model berikutnya.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Selected assets</p><p className="mt-2 text-2xl font-semibold">{selected.length}<span className="text-sm text-slate-500"> / {packageParts.length}</span></p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Successful tasks</p><p className="mt-2 text-2xl font-semibold">{finished}</p></div>
            <div className="rounded-2xl border border-amber-200/20 bg-amber-300/5 p-4"><p className="text-[10px] uppercase tracking-widest text-amber-200">Lifecycle</p><p className="mt-2 text-sm font-medium">Draft only · no production promotion</p></div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">1. Theme direction</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-slate-400">Theme template name<input value={themeName} onChange={(event) => setThemeName(event.target.value)} maxLength={100} required className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50" /></label>
              <label className="text-xs text-slate-400">Geometry budget · faces<span className="mt-2 block text-sm text-cyan-200">{faceLimit.toLocaleString("en-US")}</span><input type="range" min={10000} max={100000} step={10000} value={faceLimit} onChange={(event) => setFaceLimit(Number(event.target.value))} className="mt-3 w-full accent-cyan-300" /></label>
            </div>
            <label className="mt-4 block text-xs text-slate-400">Shared art direction<textarea value={themeDirection} onChange={(event) => setThemeDirection(event.target.value)} maxLength={600} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50" /></label>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Super Admin · AI Credits Policy</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs text-slate-400">Credits / asset<input type="number" min={1} max={100000} value={creditsPerAsset} onChange={(event) => setCreditsPerAsset(Math.max(1, Number(event.target.value) || 1))} className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" /></label><label className="text-xs text-slate-400">Max assets / package<input type="number" min={1} max={25} value={maxAssets} onChange={(event) => setMaxAssets(Math.max(1, Math.min(25, Number(event.target.value) || 1)))} className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" /></label><label className="flex items-center gap-2 pt-5 text-xs text-slate-300"><input type="checkbox" checked={generationEnabled} onChange={(event) => setGenerationEnabled(event.target.checked)} className="accent-cyan-300" /> Enable generation</label></div><p className="mt-3 text-xs text-slate-400">Estimated reservation: {generationEnabled ? selected.length * creditsPerAsset : 0} credits</p><button type="button" onClick={() => void savePricing()} disabled={pricingSaving} className="mt-3 rounded-lg border border-cyan-200/20 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50">{pricingSaving ? "Saving policy…" : "Save pricing policy"}</button>{pricingError && <p className="mt-2 text-xs text-amber-200">{pricingError}</p>}</div>
            <h2 className="mt-7 text-lg font-semibold">2. Package components</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Fokus awal hanya satu model. Universe / Galaxy dipilih sebagai golden asset; jangan pilih komponen lain sampai model pertama lolos visual dan runtime QA.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {packageParts.filter((part) => part.key === "universe").map((part, index) => {
                const chosen = selected.includes(part.key);
                return <button key={part.key} type="button" onClick={() => toggle(part.key)} className={`rounded-2xl border p-4 text-left transition ${chosen ? "border-cyan-300/50 bg-cyan-300/[.06]" : "border-white/10 bg-black/20 hover:border-white/20"}`}><div className="flex items-start justify-between gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-xs text-cyan-200">{String(index + 1).padStart(2, "0")}</span><span className={`rounded-full px-2 py-1 text-[9px] ${chosen ? "bg-cyan-300 text-slate-950" : "bg-white/5 text-slate-500"}`}>{chosen ? "IN PACKAGE" : "OPTIONAL"}</span></div><p className="mt-4 text-sm font-medium">{part.label}</p><p className="mt-2 text-[11px] leading-5 text-slate-500">{part.prompt}</p></button>;
              })}
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-200">{error}</p>}
            <button type="button" onClick={() => void generatePackage()} disabled={busy || !selected.length || !themeName.trim() || !pricing?.enabled || selected.length > (pricing?.max_assets_per_package ?? 0)} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-50">{busy ? `Submitting ${current}…` : `Generate ${selected.length} golden model ↗`}</button>
            <p className="mt-3 text-[10px] leading-5 text-amber-100/70">Admin-only: satu task 3D dikirim melalui Theme Package Orchestrator dan Tripo. AI Credits direservasi sebelum generasi, diselesaikan sesuai hasil aset, dan GLB masuk sebagai draft; tidak ada auto-promotion.</p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
              <h2 className="font-semibold">3. Task monitor</h2>{packageId && <p className="mt-2 break-all font-mono text-[10px] text-cyan-200">Package ID: {packageId}</p>}
              <p className="mt-1 text-xs leading-5 text-slate-500">Persisted task and workflow status from the backend Theme Package Orchestrator.</p>{tasks.some((task) => task.status === "failed" || task.status === "error") && packageId && !["succeeded", "partial", "failed", "cancelled"].includes(packageStatus) && <button type="button" onClick={() => void retryFailedAssets()} disabled={retrying} className="mt-3 w-full rounded-lg border border-amber-200/20 px-3 py-2 text-xs text-amber-100 disabled:opacity-50">{retrying ? "Retrying failed assets…" : "Retry failed assets"}</button>}
              <div className="mt-4 space-y-3">
                {tasks.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-600">Belum ada task package.</p> : tasks.map((task) => <div key={task.key} className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-medium">{task.label}</p><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-slate-400">{task.status}</span></div>{typeof task.progress === "number" && <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300" style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} /></div>}{task.taskId && <p className="mt-2 break-all font-mono text-[9px] text-slate-600">{task.taskId}</p>}{task.error && <p className="mt-2 text-[10px] text-rose-200">{task.error}</p>}{task.taskId && <button type="button" onClick={() => void refreshOne(task.key)} disabled={busy} className="mt-3 w-full rounded-lg border border-cyan-300/20 px-3 py-2 text-[10px] text-cyan-100 disabled:opacity-50">Refresh status</button>}{task.previewUrl && <a href={task.previewUrl} target="_blank" rel="noreferrer" className="mt-2 block text-[10px] text-cyan-200">Open preview ↗</a>}{task.modelUrl && <a href={task.modelUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-[10px] text-emerald-200">Open GLB model ↗</a>}</div>)}
              </div>
            </section>
            <section className="rounded-3xl border border-violet-200/15 bg-violet-300/[.04] p-5">
              <h2 className="font-semibold">4. Character animation</h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">Character asset is generated in this package. Rig-check → rig → retarget animation presets is the next provider pipeline step; it must run only after the character generation task reports success.</p>
              <div className="mt-4 space-y-3 text-[10px] text-slate-500">
                <p>01 · Character mesh: refresh AI Character task until status is success.</p>
                <button type="button" onClick={() => void runRigCheck()} disabled={busy} className="w-full rounded-lg border border-violet-200/20 px-3 py-2 text-left text-[10px] text-violet-100 disabled:opacity-50">02 · Run rig compatibility check</button>
                {rigCheckId && <div className="rounded-xl border border-white/10 p-3"><p className="break-all font-mono">Rig-check task: {rigCheckId}</p><p className="mt-1">Status: {rigCheckResult?.status ?? "queued"} {rigCheckResult?.rig_type ? `· type: ${rigCheckResult.rig_type}` : ""}</p><button type="button" onClick={() => void refreshRigCheck()} className="mt-2 rounded-lg border border-white/10 px-3 py-2">Refresh rig-check</button></div>}
                {rigCheckResult?.status === "success" && rigCheckResult.riggable === true && <button type="button" onClick={() => void runRig()} className="w-full rounded-lg border border-violet-200/20 px-3 py-2 text-left text-[10px] text-violet-100">03 · Create humanoid rig (Mixamo GLB)</button>}
                {rigTaskId && <div className="rounded-xl border border-white/10 p-3"><p className="break-all font-mono">Rig task: {rigTaskId}</p><p className="mt-1">Status: {rigTaskStatus}</p><button type="button" onClick={() => void refreshRigTask()} className="mt-2 rounded-lg border border-white/10 px-3 py-2">Refresh rig task</button></div>}
                {rigTaskStatus === "success" && <button type="button" onClick={() => void runRetarget()} className="w-full rounded-lg border border-violet-200/20 px-3 py-2 text-left text-[10px] text-violet-100">04 · Generate idle / walk / run</button>}
                {animationTaskId && <div className="rounded-xl border border-white/10 p-3"><p className="break-all font-mono">Animation task: {animationTaskId}</p><p className="mt-1">Status: {animationTaskStatus}</p><button type="button" onClick={() => void refreshAnimationTask()} className="mt-2 rounded-lg border border-white/10 px-3 py-2">Refresh animation task</button></div>}
                <p>05 · Blender + AllphaWorldRenderer QA and manual asset registration.</p>
              </div>
            </section>
            <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
              <h2 className="font-semibold">5. Validation & review gate</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">GLB tersimpan di allpha-world-assets dan terdaftar sebagai draft theme_assets. Jalankan validator canonical Theme Version sebelum mengajukan review. Publish tetap membutuhkan moderation/visual approval; tidak ada auto-promotion.</p>
              {packageId && <button type="button" onClick={() => void validatePackage()} disabled={lifecycleBusy || !["succeeded", "partial"].includes(packageStatus)} className="mt-4 w-full rounded-lg border border-cyan-200/20 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50">{lifecycleBusy ? "Processing…" : "Run Theme Version validation"}</button>}
              {validationStatus && <p className="mt-2 break-words text-[10px] text-slate-400">Validation: {validationStatus}</p>}
              {packageId && validationPassed && <button type="button" onClick={() => void submitForReview()} disabled={lifecycleBusy} className="mt-3 w-full rounded-lg border border-violet-200/20 px-3 py-2 text-xs text-violet-100 disabled:opacity-50">Submit draft for review</button>}
              {reviewStatus && <p className="mt-2 break-words text-[10px] text-slate-400">Review submission: {reviewStatus}</p>}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
