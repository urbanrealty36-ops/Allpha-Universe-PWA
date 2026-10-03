"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

type Props = {
  sessionId: string;
  collaborationId: string;
  onPerformance?: (signal: { speaking: boolean; level: number; userSpeaking: boolean }) => void;
};

type VoiceBinding = { id: string; model: string; voice: string; status: string };

export default function LiveRealtimeVoice({ sessionId, collaborationId, onPerformance }: Props) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const bindingRef = useRef<VoiceBinding | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { void stop(); }, []);

  function startMeter(stream: MediaStream) {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      const a = analyserRef.current;
      if (!a) return;
      a.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      const level = Math.min(1, Math.sqrt(sum / data.length) * 4);
      onPerformance?.({ speaking: false, level, userSpeaking: level > 0.045 });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function start() {
    if (!sessionId || !collaborationId) return;
    setStatus("connecting"); setError(null);
    try {
      const token = await apiFetch<{ data: { client_secret: string; binding: VoiceBinding } }>(
        "/api/v1/live/sessions/" + sessionId + "/voice/token",
        { method: "POST", body: JSON.stringify({ collaboration_id: collaborationId, voice: "marin" }) }
      );
      bindingRef.current = token.data.binding;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const audio = new Audio();
      audio.autoplay = true;
      remoteAudioRef.current = audio;
      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        try {
          const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextCtor) return;
          const ctx = new AudioContextCtor();
          const source = ctx.createMediaStreamSource(event.streams[0]);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          analyserRef.current = analyser;
          const data = new Uint8Array(analyser.fftSize);
          const tick = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteTimeDomainData(data);
            let sum = 0;
            for (const value of data) {
              const normalized = (value - 128) / 128;
              sum += normalized * normalized;
            }
            const level = Math.min(1, Math.sqrt(sum / data.length) * 5);
            onPerformance?.({ speaking: level > 0.035, level, userSpeaking: false });
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        } catch {}
      };

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = mic;
      pc.addTrack(mic.getAudioTracks()[0], mic);

      const dc = pc.createDataChannel("oai-events");
      dc.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          const type = String(message?.type ?? "");
          if (type.includes("speech_started")) onPerformance?.({ speaking: false, level: 0, userSpeaking: true });
          if (type.includes("speech_stopped")) onPerformance?.({ speaking: false, level: 0, userSpeaking: false });
        } catch {}
      });

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("connected");
          void apiFetch("/api/v1/live/sessions/" + sessionId + "/voice/state", {
            method: "POST",
            body: JSON.stringify({ binding_id: token.data.binding.id, target: "active" }),
          }).catch(() => {});
        }
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) setStatus("error");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: { Authorization: "Bearer " + token.data.client_secret, "Content-Type": "application/sdp" },
      });
      if (!response.ok) throw new Error("OPENAI_REALTIME_WEBRTC_NEGOTIATION_FAILED");
      await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "LIVE_REALTIME_VOICE_FAILED");
      setStatus("error");
      await stop();
    }
  }

  async function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    micRef.current?.getTracks().forEach((track) => track.stop());
    micRef.current = null;
    const binding = bindingRef.current;
    bindingRef.current = null;
    if (binding && sessionId) {
      await apiFetch("/api/v1/live/sessions/" + sessionId + "/voice/state", {
        method: "POST",
        body: JSON.stringify({ binding_id: binding.id, target: "stopped" }),
      }).catch(() => {});
    }
    pcRef.current?.close();
    pcRef.current = null;
    remoteAudioRef.current?.pause();
    remoteAudioRef.current = null;
    onPerformance?.({ speaking: false, level: 0, userSpeaking: false });
    setStatus("idle");
  }

  return (
    <div className="rounded-[var(--allpha-radius-lg)] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">OpenAI Realtime Voice</div>
          <div className="mt-1 text-xs text-white/45">WebRTC · gpt-realtime-2.1 · speech-to-speech · governed by Live Collaboration</div>
        </div>
        <div className="flex gap-2">
          {status === "connected" ? (
            <button className="rounded-[var(--allpha-radius-md)] border border-white/10 px-3 py-2 text-sm" onClick={() => void stop()}>Stop Voice</button>
          ) : (
            <button className="rounded-[var(--allpha-radius-md)] bg-[var(--allpha-cyan)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-40" disabled={!sessionId || !collaborationId || status === "connecting"} onClick={() => void start()}>
              {status === "connecting" ? "Connecting…" : "Start Voice"}
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 text-xs text-white/50">Status: <b>{status}</b></div>
      {error && <div className="mt-2 rounded-lg border border-red-300/20 bg-red-300/10 p-2 text-xs text-red-200">{error}</div>}
    </div>
  );
}
