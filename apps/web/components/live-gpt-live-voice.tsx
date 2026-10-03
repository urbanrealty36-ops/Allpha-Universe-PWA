"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

type Props = {
  sessionId: string;
  collaborationId: string;
  onPerformance?: (signal: { speaking: boolean; level: number; userSpeaking: boolean }) => void;
};

type LiveSessionResult = {
  data: {
    binding: { id: string; model: string; voice: string; status: string };
    session: { id: string };
    transport: { type: string; sdp: string };
  };
};

function extractAgentText(result: any): string {
  const candidates = [
    result?.data?.assistant_message?.content,
    result?.data?.message?.content,
    result?.data?.content,
    result?.data?.output?.content,
    result?.assistant_message?.content,
  ];
  const value = candidates.find((item) => typeof item === "string" && item.trim());
  return value ? value.trim() : "The backend completed the request. Continue the conversation using the verified result already recorded in Allpha.";
}

export default function LiveRealtimeVoice({ sessionId, collaborationId, onPerformance }: Props) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const bindingIdRef = useRef<string | null>(null);
  const liveSessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { void stop(); }, []);

  function attachRemoteMeter(stream: MediaStream) {
    try {
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
        const level = Math.min(1, Math.sqrt(sum / data.length) * 5);
        onPerformance?.({ speaking: level > 0.035, level, userSpeaking: false });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {}
  }

  async function delegateToAllpha(delegationId: string) {
    const transcript = transcriptRef.current.trim();
    if (!transcript) return;
    try {
      const result = await apiFetch<any>(
        "/api/v1/live/sessions/" + sessionId + "/conversation?collaboration_id=" + collaborationId,
        { method: "POST", body: JSON.stringify({ content: transcript }) }
      );
      const pc = pcRef.current;
      const channel = pc?.getSenders ? (pc as any).__allphaLiveEvents as RTCDataChannel | undefined : undefined;
      if (channel?.readyState === "open") {
        channel.send(JSON.stringify({
          type: "session.commentary.append",
          event_id: "allpha_result_" + Date.now(),
          delegation_id: delegationId,
          content: extractAgentText(result).slice(0, 1800),
        }));
      }
      transcriptRef.current = "";
    } catch (e) {
      const pc = pcRef.current;
      const channel = (pc as any)?.__allphaLiveEvents as RTCDataChannel | undefined;
      if (channel?.readyState === "open") {
        channel.send(JSON.stringify({
          type: "session.commentary.append",
          event_id: "allpha_error_" + Date.now(),
          delegation_id: delegationId,
          content: "I could not complete the governed backend request. Please try again.",
        }));
      }
      setError(e instanceof Error ? e.message : "ALLPHA_LIVE_DELEGATION_FAILED");
    }
  }

  async function start() {
    if (!sessionId || !collaborationId) return;
    setStatus("connecting"); setError(null); transcriptRef.current = "";
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const audio = new Audio();
      audio.autoplay = true;
      remoteAudioRef.current = audio;
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        audio.srcObject = stream;
        attachRemoteMeter(stream);
        void audio.play().catch(() => {});
      };

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = mic;
      for (const track of mic.getAudioTracks()) pc.addTrack(track, mic);

      const events = pc.createDataChannel("oai-events");
      (pc as any).__allphaLiveEvents = events;
      events.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          const type = String(message?.type ?? "");
          if (type === "session.started") {
            setStatus("connected");
            liveSessionIdRef.current = message?.session?.id ?? null;
            void apiFetch("/api/v1/live/sessions/" + sessionId + "/voice/state", {
              method: "POST",
              body: JSON.stringify({ binding_id: bindingIdRef.current, target: "active" }),
            }).catch(() => {});
          }
          if (type === "session.input_transcript.delta") transcriptRef.current += String(message?.delta ?? "");
          if (type === "session.delegation.created" && message?.delegation?.target === "client") {
            void delegateToAllpha(String(message.delegation.id));
          }
          if (type === "input_audio_buffer.speech_started" || type === "session.input_audio.speech_started") {
            onPerformance?.({ speaking: false, level: 0, userSpeaking: true });
          }
          if (type === "input_audio_buffer.speech_stopped" || type === "session.input_audio.speech_stopped") {
            onPerformance?.({ speaking: false, level: 0, userSpeaking: false });
          }
          if (type === "session.closed") {
            void stop();
          }
        } catch {}
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (pc.iceGatheringState !== "complete") {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error("LIVE_WEBRTC_ICE_TIMEOUT")), 10000);
          const onState = () => {
            if (pc.iceGatheringState !== "complete") return;
            window.clearTimeout(timeout);
            pc.removeEventListener("icegatheringstatechange", onState);
            resolve();
          };
          pc.addEventListener("icegatheringstatechange", onState);
          onState();
        });
      }

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("LIVE_WEBRTC_MISSING_SDP");
      const result = await apiFetch<LiveSessionResult>(
        "/api/v1/live/sessions/" + sessionId + "/voice/session",
        { method: "POST", body: JSON.stringify({ collaboration_id: collaborationId, sdp }) }
      );
      bindingIdRef.current = result.data.binding.id;
      await pc.setRemoteDescription({ type: "answer", sdp: result.data.transport.sdp });
    } catch (e) {
      setError(e instanceof Error ? e.message : "OPENAI_GPT_LIVE_SESSION_FAILED");
      setStatus("error");
      await stop();
    }
  }

  async function stop() {
    const bindingId = bindingIdRef.current;
    bindingIdRef.current = null;
    if (bindingId && sessionId) {
      await apiFetch("/api/v1/live/sessions/" + sessionId + "/voice/state", {
        method: "POST",
        body: JSON.stringify({ binding_id: bindingId, target: "stopped" }),
      }).catch(() => {});
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    micRef.current?.getTracks().forEach((track) => track.stop());
    micRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    remoteAudioRef.current?.pause();
    remoteAudioRef.current = null;
    liveSessionIdRef.current = null;
    transcriptRef.current = "";
    onPerformance?.({ speaking: false, level: 0, userSpeaking: false });
    setStatus("idle");
  }

  return (
    <div className="rounded-[var(--allpha-radius-lg)] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">OpenAI GPT-Live Voice</div>
          <div className="mt-1 text-xs text-white/45">WebRTC · full duplex · client delegation → Allpha Agent Runtime · voice: marin</div>
        </div>
        {status === "connected" ? (
          <button className="rounded-[var(--allpha-radius-md)] border border-white/10 px-3 py-2 text-sm" onClick={() => void stop()}>Stop Voice</button>
        ) : (
          <button className="rounded-[var(--allpha-radius-md)] bg-[var(--allpha-cyan)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-40" disabled={status === "connecting"} onClick={() => void start()}>
            {status === "connecting" ? "Connecting…" : "Start Voice"}
          </button>
        )}
      </div>
      <div className="mt-3 text-xs text-white/50">Status: <b>{status}</b></div>
      {error && <div className="mt-2 rounded-lg border border-red-300/20 bg-red-300/10 p-2 text-xs text-red-200">{error}</div>}
    </div>
  );
}
