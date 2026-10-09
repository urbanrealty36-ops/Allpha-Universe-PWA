"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type TripoTask = {
  task_id?: string;
  status?: string;
  progress?: number;
  output?: { rendered_image_url?: string; model_url?: string; rendered_image?: string; pbr_model?: string; model?: string; [key: string]: unknown };
  credits_consumed?: number;
  [key: string]: unknown;
};
type ApiResponse = { data?: TripoTask; provider?: string; status?: string };

const categories = ["Universe", "Galaxy", "World", "District", "Booth", "Content Capsule", "Live Stage", "AI Character", "Uniform"];

export default function TripoGenerationPanel() {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [category, setCategory] = useState("Live Stage");
  const [theme, setTheme] = useState("Crystal AI City");
  const [prompt, setPrompt] = useState("Photorealistic premium AI broadcast studio, warm cinematic key lighting, realistic walnut wood floor, acoustic wall panels, shelves with detailed props, professional broadcast cameras, large high-resolution display with abstract blue city skyline, brushed metal trim, physically based materials, realistic proportions, architectural visualization, clean composition, no text, no watermark.");
  const [imageUrl, setImageUrl] = useState("");
  const [faceLimit, setFaceLimit] = useState(50000);
  const [taskId, setTaskId] = useState("");
  const [task, setTask] = useState<TripoTask | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    setTask(null);
    setTaskId("");
    try {
      const path = mode === "text" ? "/api/v1/3d-generation/text-to-model" : "/api/v1/3d-generation/image-to-model";
      const body = mode === "text"
        ? {
            prompt: `${theme} ${category} 3D asset. ${prompt}`,
            negative_prompt: "low quality, blurry, primitive placeholder geometry, text, watermark, broken topology",
            face_limit: faceLimit,
            texture: true,
            pbr: true,
            texture_quality: "detailed",
          }
        : { image_url: imageUrl, face_limit: faceLimit, texture: true, pbr: true, texture_quality: "detailed" };
      const response = await apiFetch<ApiResponse>(path, { method: "POST", body: JSON.stringify(body) });
      const id = response.data?.task_id;
      if (id) {
        setTaskId(id);
        setTask(response.data ?? null);
        setNotice("Task berhasil dikirim ke Tripo. Periksa status untuk mengambil hasil terbaru.");
      } else {
        setTask(response.data ?? null);
        setNotice("Tripo menerima respons tetapi tidak mengembalikan task_id.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_GENERATION_FAILED");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!taskId || busy || task?.status === "success" || task?.status === "failed" || task?.status === "cancelled") return;
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch<ApiResponse>(`/api/v1/3d-generation/tasks/${encodeURIComponent(taskId)}`);
        setTask(response.data ?? null);
        if (response.data?.status === "success") setNotice("Tripo selesai. Model GLB tersedia dari output provider.");
        else if (response.data?.status === "failed" || response.data?.status === "cancelled") setError("Tripo generation task did not complete.");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "TRIPO_TASK_QUERY_FAILED");
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [taskId, task?.status, busy]);

  async function refreshTask() {
    if (!taskId) return;
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch<ApiResponse>(`/api/v1/3d-generation/tasks/${encodeURIComponent(taskId)}`);
      setTask(response.data ?? null);
      setNotice(`Status task: ${response.data?.status ?? "unknown"}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TRIPO_TASK_QUERY_FAILED");
    } finally {
      setBusy(false);
    }
  }

  const output = task?.output;
  const preview = [output?.rendered_image_url, output?.rendered_image].find((value): value is string => typeof value === "string") ?? null;
  const model = [output?.model_url, output?.pbr_model, output?.model].find((value): value is string => typeof value === "string") ?? null;
  const isComplete = task?.status === "success";
  const isFailed = task?.status === "failed" || task?.status === "cancelled";

  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-[#0d1825] via-[#0a0d17] to-[#090b12]">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[.28em] text-cyan-300">Tripo AI · Draft asset workflow</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Generate 3D draft</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">API Tripo berjalan otomatis di Railway. Task akan dipantau sampai selesai; output provider belum dianggap aktif di Storage/manifest produksi.</p>
          </div>
          <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1.5 text-[10px] text-emerald-200">API key server-side</span>
        </div>
      </div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)]">
        <form onSubmit={generate} className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1">
            <button type="button" onClick={() => setMode("text")} className={`rounded-lg px-3 py-2.5 text-xs font-medium ${mode === "text" ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`}>Text to 3D</button>
            <button type="button" onClick={() => setMode("image")} className={`rounded-lg px-3 py-2.5 text-xs font-medium ${mode === "image" ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`}>Image to 3D</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">Theme name
              <input value={theme} onChange={(event) => setTheme(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50" />
            </label>
            <label className="text-xs text-slate-400">Asset category
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50">
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
          {mode === "text" ? (
            <label className="block text-xs text-slate-400">Detailed visual prompt
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required minLength={8} maxLength={850} rows={6} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50" />
            </label>
          ) : (
            <label className="block text-xs text-slate-400">Reference image URL (public HTTPS)
              <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} required placeholder="https://..." className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50" />
              <span className="mt-1 block text-[10px] text-slate-600">Direct upload belum tersedia; Tripo harus dapat mengakses URL ini.</span>
            </label>
          )}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400"><label htmlFor="tripo-face-limit">Face budget</label><span className="font-mono text-cyan-200">{faceLimit.toLocaleString("en-US")}</span></div>
            <input id="tripo-face-limit" type="range" min={10000} max={100000} step={10000} value={faceLimit} onChange={(event) => setFaceLimit(Number(event.target.value))} className="mt-3 w-full accent-cyan-300" />
          </div>
          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-200">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-xs text-cyan-100">{notice}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-50">{busy ? "Processing…" : "Generate 3D draft ↗"}</button>
          <p className="text-[10px] leading-4 text-slate-600">Mode generasi internal tanpa login user untuk tahap REBUILD-03. Setiap request menggunakan kredit Tripo dari API key server-side di Railway; jangan pasang panel ini pada route publik umum.</p>
        </form>
        <div className="border-t border-white/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Task preview</h3>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] ${isComplete ? "border-emerald-300/30 text-emerald-200" : isFailed ? "border-rose-300/30 text-rose-200" : "border-white/10 text-slate-400"}`}>{String(task?.status ?? "Waiting")}</span>
          </div>
          {typeof task?.progress === "number" && <div className="mt-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Provider progress</span><span>{task.progress}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} /></div></div>}
          <div className="mt-4 flex min-h-[210px] items-center justify-center rounded-2xl border border-white/10 bg-black/25 p-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Tripo generated asset preview" className="max-h-[300px] w-full rounded-xl object-contain" />
            ) : <div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-200/20 bg-cyan-300/5 text-3xl text-cyan-200">✧</div><p className="mt-4 text-xs text-slate-400">Preview muncul saat task sukses.</p><p className="mt-1 text-[10px] text-slate-600">Tidak ada aset placeholder yang dipromosikan.</p></div>}
          </div>
          {taskId && <div className="mt-3 rounded-xl border border-white/10 p-3"><p className="break-all font-mono text-[10px] text-slate-500">Task ID: {taskId}</p><button type="button" onClick={() => void refreshTask()} disabled={busy} className="mt-3 w-full rounded-lg border border-cyan-300/30 px-3 py-2.5 text-xs text-cyan-100 disabled:opacity-50">{busy ? "Checking…" : "Check status now"}</button></div>}
          {model && <a href={model} target="_blank" rel="noreferrer" className="mt-3 block break-all rounded-xl border border-emerald-300/20 p-3 text-xs text-emerald-200">Open generated model ↗</a>}
          {typeof task?.credits_consumed === "number" && <p className="mt-3 text-[10px] text-slate-500">Tripo credits consumed: {task.credits_consumed.toFixed(2)}</p>}
          {task && <details className="mt-3 rounded-xl border border-white/10 p-3"><summary className="cursor-pointer text-xs text-slate-400">Raw task response</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px] text-slate-500">{JSON.stringify(task, null, 2)}</pre></details>}
          <div className="mt-5 space-y-2">{["Tripo generation + auto polling", "Blender geometry/material QA", "Storage + theme_assets registration", "Manifest + signed URL verification", "Visual QA before production activation"].map((step, index) => <div key={step} className="flex items-center gap-3 text-xs"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-[9px] text-cyan-200">{String(index + 1).padStart(2, "0")}</span><span className="text-slate-400">{step}</span></div>)}</div>
        </div>
      </div>
    </section>
  );
}
