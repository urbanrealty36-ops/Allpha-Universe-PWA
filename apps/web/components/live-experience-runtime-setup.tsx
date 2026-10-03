"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

type Session = {
  id: string;
  title: string | null;
  status: string;
  experience_template_id: string | null;
  experience_template_version_id: string | null;
  live_experience_templates?: { name: string; category: string; slug: string } | null;
};

type Theme = { id: string; name: string; slug: string; category?: string | null };

type Collaboration = {
  id: string;
  agent_id: string;
  mode: string;
  status: string;
  consent_status: string;
  risk_decision: string;
};

type StageRuntime = {
  active: boolean;
  reason?: string;
  stage?: {
    signed_url: string | null;
    component: string;
    renderer: string;
    presentation_only: boolean;
    binding: Record<string, any>;
    asset: Record<string, any>;
  } | null;
};

type CameraSource = {
  id: string;
  permission_status: string;
  status: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  facing_mode: string | null;
};

type PresenceCheck = {
  id: string;
  verification_status: string;
  face_present: boolean;
  body_present: boolean;
  liveness_passed: boolean;
  face_quality: number | null;
  body_quality: number | null;
  expires_at: string | null;
};

type Costume = {
  id: string;
  name: string;
  category?: string;
  uniform_key?: string;
  description?: string | null;
  status?: string;
  moderation_status?: string;
};

const card = "rounded-[var(--allpha-radius-lg)] border border-white/10 bg-[var(--allpha-surface)]";
const input = "w-full rounded-[var(--allpha-radius-md)] border border-white/10 bg-[var(--allpha-space-elevated)] px-3 py-2 text-sm text-[var(--allpha-text)] outline-none focus:border-[var(--allpha-cyan)]";
const button = "rounded-[var(--allpha-radius-md)] border border-white/10 bg-[var(--allpha-space-elevated)] px-3 py-2 text-sm font-medium text-[var(--allpha-text)] hover:border-[var(--allpha-cyan)] disabled:cursor-not-allowed disabled:opacity-40";

export default function LiveExperienceRuntimeSetup() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [themeId, setThemeId] = useState("");
  const [stage, setStage] = useState<StageRuntime | null>(null);
  const [camera, setCamera] = useState<CameraSource | null>(null);
  const [presence, setPresence] = useState<PresenceCheck | null>(null);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [collaborationId, setCollaborationId] = useState("");
  const [costumes, setCostumes] = useState<{ platform_uniforms: Costume[]; owned_uniforms: any[]; custom_costumes: Costume[] }>({ platform_uniforms: [], owned_uniforms: [], custom_costumes: [] });
  const [selectedCostume, setSelectedCostume] = useState("");
  const [costumeKind, setCostumeKind] = useState<"uniform" | "custom">("uniform");
  const [cameraReady, setCameraReady] = useState(false);
  const [bodyFramingConfirmed, setBodyFramingConfirmed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedSession = useMemo(() => sessions.find((s) => s.id === sessionId) ?? null, [sessions, sessionId]);
  const activeCollaboration = collaborations.find((c) => c.status === "active" && c.consent_status === "approved" && c.risk_decision === "allow");

  useEffect(() => {
    void loadBase();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (sessionId) void loadSessionRuntime(sessionId);
  }, [sessionId]);

  async function loadBase() {
    try {
      const [sessionResponse, themeResponse, costumeResponse] = await Promise.all([
        apiFetch<{ data: Session[] }>("/api/v1/live/sessions?limit=100"),
        apiFetch<{ data: Theme[] }>("/api/v1/themes?source=platform&limit=100"),
        apiFetch<{ data: typeof costumes }>("/api/v1/live/costumes/catalog"),
      ]);
      const nextSessions = sessionResponse.data ?? [];
      setSessions(nextSessions);
      setThemes(themeResponse.data ?? []);
      setCostumes(costumeResponse.data ?? { platform_uniforms: [], owned_uniforms: [], custom_costumes: [] });
      if (!sessionId && nextSessions[0]) setSessionId(nextSessions[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_22G_LOAD_FAILED");
    }
  }

  async function loadSessionRuntime(id: string) {
    setError(null);
    try {
      const [stageResponse, cameraResponse, presenceResponse, collabResponse] = await Promise.all([
        apiFetch<{ data: StageRuntime }>(`/api/v1/live/sessions/${id}/stage-runtime`),
        apiFetch<{ data: CameraSource | null }>(`/api/v1/live/sessions/${id}/camera`),
        apiFetch<{ data: PresenceCheck | null }>(`/api/v1/live/sessions/${id}/presence-check`),
        apiFetch<{ data: Collaboration[] }>(`/api/v1/live/sessions/${id}/collaborations`),
      ]);
      setStage(stageResponse.data ?? null);
      setCamera(cameraResponse.data ?? null);
      setPresence(presenceResponse.data ?? null);
      setCollaborations(collabResponse.data ?? []);
      const active = (collabResponse.data ?? []).find((c) => c.status === "active" && c.consent_status === "approved" && c.risk_decision === "allow");
      setCollaborationId(active?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_22G_RUNTIME_LOAD_FAILED");
    }
  }

  async function bindStage() {
    if (!sessionId || !themeId) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiFetch(`/api/v1/live/sessions/${sessionId}/stage`, {
        method: "POST",
        body: JSON.stringify({ theme_id: themeId, composition: { source: "phase_22g", live_stage_component: "LiveExperienceStage" } }),
      });
      const r = await apiFetch<{ data: StageRuntime }>(`/api/v1/live/sessions/${sessionId}/stage-runtime`);
      setStage(r.data);
      setMessage("Stage 3D berhasil di-bind ke Live Session.");
    } catch (e) { setError(e instanceof Error ? e.message : "LIVE_STAGE_BIND_FAILED"); }
    finally { setBusy(false); }
  }

  async function startCamera() {
    setError(null); setMessage(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      const r = await apiFetch<{ data: CameraSource }>(`/api/v1/live/sessions/${sessionId}/camera`, {
        method: "POST",
        body: JSON.stringify({
          source_type: "webcam",
          facing_mode: settings.facingMode === "environment" ? "environment" : "user",
          width: settings.width ?? null,
          height: settings.height ?? null,
          fps: settings.frameRate ?? null,
          permission_status: "granted",
          metadata: { browser_camera: true, local_capture_only: true },
        }),
      });
      setCamera(r.data);
      setMessage("Kamera perangkat Human aktif. Tidak ada frame kamera yang disimpan oleh Allpha.");
    } catch (e) {
      setCameraReady(false);
      setError(e instanceof Error ? e.message : "LIVE_CAMERA_PERMISSION_FAILED");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }

  async function runPresenceCheck() {
    if (!camera || !cameraReady || !consent) {
      setError("Aktifkan kamera dan berikan consent sebelum Presence Check.");
      return;
    }
    if (!bodyFramingConfirmed) {
      setError("Konfirmasi bahwa tubuh Human berada di dalam framing kamera.");
      return;
    }
    setBusy(true); setError(null); setMessage(null);
    try {
      const faceDetector = (window as any).FaceDetector;
      let facePresent = true;
      let faceQuality = 75;
      if (faceDetector && videoRef.current) {
        const detector = new faceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(videoRef.current);
        facePresent = faces.length > 0;
        faceQuality = facePresent ? 90 : 0;
      }
      const r = await apiFetch<{ data: PresenceCheck }>(`/api/v1/live/sessions/${sessionId}/presence-check`, {
        method: "POST",
        body: JSON.stringify({
          camera_source_id: camera.id,
          verification_method: faceDetector ? "on_device_face_presence_plus_owner_body_frame_v1" : "owner_presence_attestation_v1",
          consent: true,
          face_present: facePresent,
          body_present: bodyFramingConfirmed,
          liveness_passed: streamRef.current?.getVideoTracks()[0]?.readyState === "live",
          face_quality: faceQuality,
          body_quality: bodyFramingConfirmed ? 75 : 0,
          evidence_metadata: {
            raw_frames_stored: false,
            biometric_template_stored: false,
            identity_verification: false,
            body_check: faceDetector ? "owner_confirmed_frame" : "owner_attested",
          },
        }),
      });
      setPresence(r.data);
      setMessage(r.data.verification_status === "verified"
        ? "Face/body presence check lulus untuk presentation runtime. Ini bukan verifikasi identitas legal/KYC."
        : "Presence check belum lulus.");
    } catch (e) { setError(e instanceof Error ? e.message : "LIVE_PRESENCE_CHECK_FAILED"); }
    finally { setBusy(false); }
  }

  async function bindPresentation() {
    if (!camera || !presence || presence.verification_status !== "verified") {
      setError("Luluskan Face/Body Presence Check terlebih dahulu.");
      return;
    }
    setBusy(true); setError(null); setMessage(null);
    try {
      const payload: any = {
        camera_source_id: camera.id,
        presence_verification_id: presence.id,
        appearance_config: { presentation_mode: "human_camera_plus_3d_stage", body_tracking: "runtime_provider_boundary_v1", face_tracking: "runtime_provider_boundary_v1" },
      };
      if (costumeKind === "custom") payload.custom_costume_id = selectedCostume || null;
      else if (selectedCostume) payload.user_uniform_id = selectedCostume;
      const r = await apiFetch<{ data: any }>(`/api/v1/live/sessions/${sessionId}/human-presentation`, {
        method: "POST", body: JSON.stringify(payload),
      });
      setMessage(`Human presentation siap: ${r.data.status}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "LIVE_HUMAN_PRESENTATION_BIND_FAILED"); }
    finally { setBusy(false); }
  }

  async function activate() {
    if (!sessionId) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const r = await apiFetch<{ data: any }>(`/api/v1/live/sessions/${sessionId}/activate-experience${collaborationId ? `?collaboration_id=${encodeURIComponent(collaborationId)}` : ""}`, { method: "POST" });
      setMessage(`Live Experience runtime aktif: ${r.data.status}.`);
      await loadSessionRuntime(sessionId);
    } catch (e) { setError(e instanceof Error ? e.message : "LIVE_EXPERIENCE_ACTIVATION_FAILED"); }
    finally { setBusy(false); }
  }

  async function createCustomCostume(file: File) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const created = await apiFetch<{ data: any }>("/api/v1/live/costumes/custom", {
        method: "POST",
        body: JSON.stringify({
          name: file.name.replace(/\.[^.]+$/, ""),
          category: "custom",
          mime_type: file.type || "model/gltf-binary",
          metadata: { user_authored: true },
        }),
      });
      await fetch(created.data.upload.signed_url, { method: "PUT", headers: { "Content-Type": file.type || "model/gltf-binary" }, body: file });
      const finalized = await apiFetch<{ data: Costume }>(`/api/v1/live/costumes/custom/${created.data.id}/finalize`, {
        method: "POST", body: JSON.stringify({}),
      });
      setCostumes((x) => ({ ...x, custom_costumes: [finalized.data, ...x.custom_costumes] }));
      setCostumeKind("custom");
      setSelectedCostume(finalized.data.id);
      setMessage("Custom costume tersimpan dan menunggu moderation sebelum dapat dipakai.");
    } catch (e) { setError(e instanceof Error ? e.message : "LIVE_CUSTOM_COSTUME_UPLOAD_FAILED"); }
    finally { setBusy(false); }
  }

  const platformOptions = costumes.platform_uniforms.map((u) => ({ id: u.id, name: u.name, type: "uniform" }));
  const ownedOptions = costumes.owned_uniforms.map((u: any) => {
    const catalog = costumes.platform_uniforms.find((x) => x.id === u.uniform_id);
    return { id: u.id, name: catalog?.name ?? `Uniform ${u.uniform_id.slice(0, 8)}`, type: "owned" };
  });
  const customOptions = costumes.custom_costumes.map((x) => ({ id: x.id, name: x.name, type: "custom" }));

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4">
      <div className={card + " p-5"}>
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[.22em] text-[var(--allpha-cyan)]">PHASE 22G · LIVE EXPERIENCE RUNTIME</div>
          <h2 className="mt-1 text-xl font-semibold text-[var(--allpha-text)]">Human → Collaboration → 3D Stage → Camera → Presence → Costume → Live</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--allpha-text-muted)]">
            Stage dan Human presentation adalah presentation/runtime state. Authority tetap mengikuti Agent Passport → Capability → Policy → Consent → Risk → Approval → Agent Runtime.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs text-white/55">Live Session</label>
            <select className={input} value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              <option value="">Pilih Live Session</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.title || s.live_experience_templates?.name || s.id}</option>)}
            </select>
            {selectedSession && <div className="mt-2 text-xs text-white/45">{selectedSession.live_experience_templates?.name} · {selectedSession.status}</div>}
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs text-white/55">3D Theme / Stage Environment</label>
            <div className="flex gap-2">
              <select className={input} value={themeId} onChange={(e) => setThemeId(e.target.value)}>
                <option value="">Pilih platform Theme</option>
                {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className={button} disabled={!sessionId || !themeId || busy} onClick={bindStage}>Bind 3D Stage</button>
            </div>
            {stage?.active && (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
                <div className="font-medium text-[var(--allpha-cyan)]">LiveExperienceStage active</div>
                <div className="mt-1 text-white/55">Renderer: {stage.stage?.renderer} · source: {stage.stage?.binding?.stage_source}</div>
                {stage.stage?.signed_url && <a className="mt-2 inline-block underline text-white/70" href={stage.stage.signed_url} target="_blank" rel="noreferrer">Open signed 3D asset</a>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className={card + " p-4"}>
            <div className="mb-3 font-medium">1 · Real Camera Perangkat Human</div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
              <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
            </div>
            <div className="mt-3 flex gap-2">
              <button className={button} onClick={startCamera} disabled={!sessionId || busy}>Aktifkan Camera</button>
              <button className={button} onClick={stopCamera} disabled={!cameraReady}>Stop</button>
            </div>
            {camera && <div className="mt-2 text-xs text-white/45">{camera.width}×{camera.height} · {camera.fps ?? "?"}fps · permission {camera.permission_status}</div>}
          </div>

          <div className={card + " p-4"}>
            <div className="mb-3 font-medium">2 · Face + Body Presence Check</div>
            <label className="flex gap-2 text-sm text-white/70">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              Saya menyetujui camera presence check untuk Live presentation.
            </label>
            <label className="mt-3 flex gap-2 text-sm text-white/70">
              <input type="checkbox" checked={bodyFramingConfirmed} onChange={(e) => setBodyFramingConfirmed(e.target.checked)} />
              Tubuh Human terlihat sesuai framing Stage.
            </label>
            <button className={button + " mt-3 w-full"} onClick={runPresenceCheck} disabled={!cameraReady || !camera || busy}>Run Presence Check</button>
            {presence && <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
              <div>Status: <b>{presence.verification_status}</b></div>
              <div>Face: {presence.face_present ? "pass" : "fail"} · Body: {presence.body_present ? "pass" : "fail"} · Stream: {presence.liveness_passed ? "live" : "fail"}</div>
              <div className="mt-1 text-white/45">Tidak menyimpan raw frame/face embedding. Bukan KYC/identity verification.</div>
            </div>}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className={card + " p-4"}>
            <div className="mb-3 font-medium">3 · Human Custom Uniform / Costume</div>
            <div className="flex flex-wrap gap-2">
              {["superhero","business_shirt","suit_tie","formal","nusantara","traditional","cultural","uniform","fantasy","sci_fi","creator","custom"].map((category) => (
                <span key={category} className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/50">{category}</span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <select className={input} value={costumeKind + ":" + selectedCostume} onChange={(e) => {
                const [kind, id] = e.target.value.split(":");
                setCostumeKind(kind as "uniform" | "custom"); setSelectedCostume(id);
              }}>
                <option value="uniform:">No costume / default Human</option>
                {platformOptions.map((x) => <option key={"p"+x.id} value={"uniform:"+x.id}>Platform · {x.name}</option>)}
                {ownedOptions.map((x) => <option key={"o"+x.id} value={"uniform:"+x.id}>Owned · {x.name}</option>)}
                {customOptions.map((x) => <option key={"c"+x.id} value={"custom:"+x.id}>Custom · {x.name}</option>)}
              </select>
              <label className={button + " cursor-pointer whitespace-nowrap"}>
                Upload Custom
                <input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="hidden" onChange={(e) => e.target.files?.[0] && void createCustomCostume(e.target.files[0])} />
              </label>
            </div>
            <p className="mt-2 text-xs text-white/40">Kategori global dapat diperluas. Kostum berlisensi seperti Avengers hanya boleh digunakan bila Human memiliki hak/lisensi yang sesuai.</p>
          </div>

          <div className={card + " p-4"}>
            <div className="mb-3 font-medium">4 · Collaboration + Human Presentation</div>
            <div className="text-xs text-white/45">
              Active collaboration: {activeCollaboration ? activeCollaboration.id.slice(0, 8) : "belum ada"}
            </div>
            <select className={input + " mt-2"} value={collaborationId} onChange={(e) => setCollaborationId(e.target.value)}>
              <option value="">Tanpa collaboration</option>
              {collaborations.map((c) => <option key={c.id} value={c.id}>{c.mode} · {c.status} · {c.risk_decision}</option>)}
            </select>
            <button className={button + " mt-3 w-full"} disabled={!camera || !presence || presence.verification_status !== "verified" || busy} onClick={bindPresentation}>Bind Human Presentation</button>
            <button className="mt-2 w-full rounded-[var(--allpha-radius-md)] bg-[var(--allpha-cyan)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-40" disabled={!stage?.active || !camera || !presence || presence.verification_status !== "verified" || busy} onClick={activate}>Activate Live Experience</button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-200">{error}</div>}
        {message && <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-200">{message}</div>}

        <div className="mt-5 rounded-xl border border-white/10 bg-black/15 p-4 text-xs text-white/45">
          <b className="text-white/70">Runtime boundary:</b> the browser camera is a media source only. Face/body presence does not grant Agent authority, ownership, capability, permission, billing entitlement or execution rights. Raw camera frames and biometric embeddings are not persisted by this workflow.
        </div>
      </div>
    </section>
  );
}
