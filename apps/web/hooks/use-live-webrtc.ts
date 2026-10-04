"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type Role = "publisher" | "viewer";

type Signal = {
  type: "offer" | "answer" | "ice" | "leave";
  sender: string;
  target?: string;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

export type LiveWebRTCOptions = {
  sessionId: string;
  role: Role;
  video?: boolean;
  audio?: boolean;
};

export function useLiveWebRTC({ sessionId, role, video = true, audio = true }: LiveWebRTCOptions) {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishSignal = useCallback(async (signal: Omit<Signal, "sender">) => {
    const channel = channelRef.current;
    if (!channel) throw new Error("LIVE_WEBRTC_CHANNEL_NOT_READY");
    await channel.send({ type: "broadcast", event: "webrtc-signal", payload: { ...signal, sender: crypto.randomUUID() } });
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseRef.current;
    const senderId = crypto.randomUUID();
    let pc: RTCPeerConnection | null = null;

    const run = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) throw new Error("AUTH_REQUIRED");

        pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            ...(process.env.NEXT_PUBLIC_WEBRTC_TURN_URL
              ? [{ urls: process.env.NEXT_PUBLIC_WEBRTC_TURN_URL, username: process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME ?? "", credential: process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL ?? "" }]
              : []),
          ],
        });
        peerRef.current = pc;

        pc.ontrack = (event) => {
          if (mounted && event.streams[0]) setRemoteStream(event.streams[0]);
        };
        pc.onconnectionstatechange = () => {
          if (!mounted) return;
          setConnected(pc?.connectionState === "connected");
        };

        if (role === "publisher") {
          const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
          localStreamRef.current = stream;
          if (mounted) setLocalStream(stream);
          stream.getTracks().forEach((track) => pc?.addTrack(track, stream));
        }

        const channel = supabase.channel(`live-webrtc:${sessionId}`, { config: { broadcast: { self: false } } });
        channelRef.current = channel;

        channel.on("broadcast", { event: "webrtc-signal" }, async ({ payload }) => {
          const signal = payload as Signal;
          if (!signal || signal.sender === senderId || (signal.target && signal.target !== senderId)) return;
          try {
            if (signal.type === "offer" && role === "viewer") {
              await pc?.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
              const answer = await pc?.createAnswer();
              if (!answer) return;
              await pc.setLocalDescription(answer);
              await channel.send({ type: "broadcast", event: "webrtc-signal", payload: { type: "answer", sender: senderId, target: signal.sender, payload: answer } });
            } else if (signal.type === "answer" && role === "publisher") {
              await pc?.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
            } else if (signal.type === "ice") {
              await pc?.addIceCandidate(signal.payload as RTCIceCandidateInit);
            }
          } catch (e) {
            if (mounted) setError(e instanceof Error ? e.message : "WEBRTC_SIGNAL_ERROR");
          }
        });

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await channel.send({ type: "broadcast", event: "webrtc-signal", payload: { type: "ice", sender: senderId, payload: event.candidate.toJSON() } });
          }
        };

        const status = await channel.subscribe();
        if (status !== "SUBSCRIBED") throw new Error(`REALTIME_SUBSCRIBE_${status}`);

        if (role === "publisher") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await channel.send({ type: "broadcast", event: "webrtc-signal", payload: { type: "offer", sender: senderId, payload: offer } });
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "WEBRTC_INIT_FAILED");
      }
    };

    void run();

    return () => {
      mounted = false;
      pc?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (channelRef.current) void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      peerRef.current = null;
    };
  }, [sessionId, role, video, audio]);

  return { localStream, remoteStream, connected, error };
}
