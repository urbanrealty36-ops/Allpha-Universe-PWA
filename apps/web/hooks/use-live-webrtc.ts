"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type Role = "publisher" | "viewer";
type Signal = {
  type: "offer" | "answer" | "ice" | "leave" | "ready";
  sender: string;
  target?: string;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

export type LiveWebRTCOptions = {
  sessionId: string;
  role: Role;
  video?: boolean;
  audio?: boolean;
  localStream?: MediaStream | null;
};

export function useLiveWebRTC({
  sessionId,
  role,
  video = true,
  audio = true,
  localStream: providedLocalStream = null,
}: LiveWebRTCOptions) {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const senderIdRef = useRef<string>(crypto.randomUUID());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseRef.current;
    const senderId = senderIdRef.current;

    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
    ];
    if (process.env.NEXT_PUBLIC_WEBRTC_TURN_URL) {
      iceServers.push({
        urls: process.env.NEXT_PUBLIC_WEBRTC_TURN_URL,
        username: process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME ?? "",
        credential: process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL ?? "",
      });
    }

    const send = async (signal: Omit<Signal, "sender">) => {
      const channel = channelRef.current;
      if (!channel) throw new Error("LIVE_WEBRTC_CHANNEL_NOT_READY");
      await channel.send({
        type: "broadcast",
        event: "webrtc-signal",
        payload: { ...signal, sender: senderId },
      });
    };

    const createPeer = (remoteId: string) => {
      const existing = peersRef.current.get(remoteId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers });
      peersRef.current.set(remoteId, pc);

      const stream = localStreamRef.current;
      if (role === "publisher" && stream) {
        for (const track of stream.getTracks()) pc.addTrack(track, stream);
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream || !mounted) return;
        setRemoteStreams((current) => ({ ...current, [remoteId]: stream }));
      };

      pc.onconnectionstatechange = () => {
        if (!mounted) return;
        const states = [...peersRef.current.values()].map((peer) => peer.connectionState);
        setConnected(states.some((state) => state === "connected"));
        if (["failed", "closed"].includes(pc.connectionState)) {
          peersRef.current.delete(remoteId);
          setRemoteStreams((current) => {
            const next = { ...current };
            delete next[remoteId];
            return next;
          });
        }
      };

      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;
        try {
          await send({
            type: "ice",
            target: remoteId,
            payload: event.candidate.toJSON(),
          });
        } catch (e) {
          if (mounted) setError(e instanceof Error ? e.message : "WEBRTC_ICE_SEND_FAILED");
        }
      };

      return pc;
    };

    const run = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("AUTH_REQUIRED");

        if (role === "publisher") {
          const stream =
            providedLocalStream ??
            (await navigator.mediaDevices.getUserMedia({
              video,
              audio,
            }));
          localStreamRef.current = stream;
          if (mounted) setLocalStream(stream);
        }

        const channel = supabase.channel(`live-webrtc:${sessionId}`, {
          config: {
            private: true,
            broadcast: { self: false },
          },
        });
        channelRef.current = channel;

        channel.on("broadcast", { event: "webrtc-signal" }, async ({ payload }) => {
          const signal = payload as Signal;
          if (!signal || signal.sender === senderId) return;
          if (signal.target && signal.target !== senderId) return;

          try {
            if (signal.type === "ready" && role === "publisher") {
              const pc = createPeer(signal.sender);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await send({
                type: "offer",
                target: signal.sender,
                payload: offer,
              });
              return;
            }

            if (signal.type === "offer" && role === "viewer") {
              const pc = createPeer(signal.sender);
              await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
              for (const candidate of pendingIceRef.current.get(signal.sender) ?? []) {
                await pc.addIceCandidate(candidate);
              }
              pendingIceRef.current.delete(signal.sender);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await send({
                type: "answer",
                target: signal.sender,
                payload: answer,
              });
              return;
            }

            if (signal.type === "answer" && role === "publisher") {
              const pc = peersRef.current.get(signal.sender);
              if (!pc) return;
              await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
              for (const candidate of pendingIceRef.current.get(signal.sender) ?? []) {
                await pc.addIceCandidate(candidate);
              }
              pendingIceRef.current.delete(signal.sender);
              return;
            }

            if (signal.type === "ice") {
              const pc = peersRef.current.get(signal.sender);
              const candidate = signal.payload as RTCIceCandidateInit;
              if (!pc || !candidate) return;

              if (pc.remoteDescription) {
                await pc.addIceCandidate(candidate);
              } else {
                const queue = pendingIceRef.current.get(signal.sender) ?? [];
                queue.push(candidate);
                pendingIceRef.current.set(signal.sender, queue);
              }
            }
          } catch (e) {
            if (mounted) setError(e instanceof Error ? e.message : "WEBRTC_SIGNAL_ERROR");
          }
        });

        const status = await channel.subscribe();
        if (status !== "SUBSCRIBED") {
          throw new Error(`REALTIME_SUBSCRIBE_${status}`);
        }

        if (role === "viewer") {
          await send({ type: "ready" });
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "WEBRTC_INIT_FAILED");
      }
    };

    void run();

    return () => {
      mounted = false;
      for (const pc of peersRef.current.values()) pc.close();
      peersRef.current.clear();
      pendingIceRef.current.clear();
      if (!providedLocalStream) {
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = null;
      if (channelRef.current) void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [sessionId, role, video, audio, providedLocalStream]);

  return {
    localStream,
    remoteStream: remoteStreams[Object.keys(remoteStreams)[0]] ?? null,
    remoteStreams,
    connected,
    error,
  };
}
