"use client";

import { useEffect, useRef } from "react";
import { useLiveWebRTC } from "../hooks/use-live-webrtc";

export default function LiveWebRTCStage({
  sessionId,
  role,
  localStream,
  enabled = true,
  authorized = false,
}: {
  sessionId: string;
  role: "publisher" | "viewer";
  localStream?: MediaStream | null;
  enabled?: boolean;
}) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const { localStream: transportLocal, remoteStream, connected, error } = useLiveWebRTC({
    sessionId,
    role,
    localStream,
    authorized,
  });

  const activeLocal = localStream ?? transportLocal;

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = activeLocal ?? null;
  }, [activeLocal]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream ?? null;
  }, [remoteStream]);

  if (!enabled || !authorized) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-white/80">WebRTC Live Transport</div>
          <div className="text-[10px] text-white/40">
            Browser-to-browser media · private Supabase Realtime signaling
          </div>
        </div>
        <span className={"rounded-full px-2 py-1 text-[9px] " + (connected ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300")}>
          {connected ? "CONNECTED" : "CONNECTING"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
          <video ref={localRef} muted playsInline autoPlay className="aspect-video w-full object-cover" />
          <div className="px-2 py-1 text-[9px] text-white/40">LOCAL · {role}</div>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
          <video ref={remoteRef} playsInline autoPlay controls={false} className="aspect-video w-full object-cover" />
          <div className="px-2 py-1 text-[9px] text-white/40">REMOTE · WebRTC</div>
        </div>
      </div>

      {error && <div className="mt-2 text-xs text-red-300">{error}</div>}
      <div className="mt-2 text-[10px] text-white/35">
        Production NAT traversal requires TURN credentials; STUN is included as the default discovery path.
      </div>
    </div>
  );
}
