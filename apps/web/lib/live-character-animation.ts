export type CharacterAnimationState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "emphasis"
  | "greeting"
  | "acknowledge"
  | "farewell";

export type CharacterAnimationIntent =
  | "greet"
  | "acknowledge"
  | "explain"
  | "emphasize"
  | "ask"
  | "answer"
  | "think"
  | "agree"
  | "disagree"
  | "apologize"
  | "celebrate"
  | "caution"
  | "wait"
  | "listen"
  | "invite";

export type CharacterGazeTarget = "camera" | "human" | "agent" | "attention" | "neutral";

export type CharacterAnimationSignal = {
  state: CharacterAnimationState;
  intent?: CharacterAnimationIntent;
  facial?: "neutral" | "smile" | "serious" | "concerned" | "surprised" | "confused" | "happy" | "empathetic" | "focused" | "thinking";
  gaze?: CharacterGazeTarget;
  level: number;
  speaking: boolean;
  userSpeaking: boolean;
  interrupted?: boolean;
};

export const DEFAULT_CHARACTER_PRIORITY: Record<CharacterAnimationState, number> = {
  idle: 10,
  acknowledge: 35,
  listening: 40,
  thinking: 50,
  speaking: 60,
  emphasis: 70,
  greeting: 80,
  farewell: 90,
};

export const INTENT_TO_PRESENTATION: Record<CharacterAnimationIntent, Pick<CharacterAnimationSignal, "state" | "facial" | "gaze">> = {
  greet: { state: "greeting", facial: "smile", gaze: "human" },
  acknowledge: { state: "acknowledge", facial: "empathetic", gaze: "human" },
  explain: { state: "speaking", facial: "focused", gaze: "human" },
  emphasize: { state: "emphasis", facial: "focused", gaze: "human" },
  ask: { state: "speaking", facial: "focused", gaze: "human" },
  answer: { state: "speaking", facial: "focused", gaze: "human" },
  think: { state: "thinking", facial: "thinking", gaze: "attention" },
  agree: { state: "acknowledge", facial: "happy", gaze: "human" },
  disagree: { state: "speaking", facial: "serious", gaze: "human" },
  apologize: { state: "acknowledge", facial: "empathetic", gaze: "human" },
  celebrate: { state: "emphasis", facial: "happy", gaze: "human" },
  caution: { state: "emphasis", facial: "concerned", gaze: "human" },
  wait: { state: "idle", facial: "neutral", gaze: "human" },
  listen: { state: "listening", facial: "empathetic", gaze: "human" },
  invite: { state: "greeting", facial: "smile", gaze: "human" },
};

export function normalizeAnimationSignal(
  signal: Partial<CharacterAnimationSignal> & { state?: string },
): CharacterAnimationSignal {
  const state = (Object.keys(DEFAULT_CHARACTER_PRIORITY) as CharacterAnimationState[]).includes(signal.state as CharacterAnimationState)
    ? signal.state as CharacterAnimationState
    : "idle";
  const level = Math.max(0, Math.min(1, Number(signal.level ?? 0)));
  return {
    state,
    intent: signal.intent,
    facial: signal.facial ?? (state === "thinking" ? "thinking" : state === "speaking" ? "focused" : "neutral"),
    gaze: signal.gaze ?? (state === "idle" ? "camera" : "human"),
    level,
    speaking: Boolean(signal.speaking ?? state === "speaking"),
    userSpeaking: Boolean(signal.userSpeaking ?? state === "listening"),
    interrupted: Boolean(signal.interrupted),
  };
}

export function applyAnimationIntent(
  current: CharacterAnimationSignal,
  intent: CharacterAnimationIntent,
  level = current.level,
): CharacterAnimationSignal {
  const presentation = INTENT_TO_PRESENTATION[intent];
  const next = normalizeAnimationSignal({
    ...current,
    ...presentation,
    intent,
    level,
    speaking: presentation.state === "speaking",
    userSpeaking: presentation.state === "listening",
    interrupted: false,
  });
  const currentPriority = DEFAULT_CHARACTER_PRIORITY[current.state];
  const nextPriority = DEFAULT_CHARACTER_PRIORITY[next.state];
  return nextPriority >= currentPriority || current.state === "idle" ? next : current;
}

export function applyVoiceEvent(
  current: CharacterAnimationSignal,
  eventType: string,
  level = current.level,
): CharacterAnimationSignal {
  const type = eventType.toLowerCase();
  if (type.includes("speech_started") || type.includes("input_audio") && type.includes("started")) {
    return normalizeAnimationSignal({ ...current, state: "listening", level: 0, speaking: false, userSpeaking: true, facial: "empathetic", gaze: "human", interrupted: false });
  }
  if (type.includes("speech_stopped") || type.includes("input_audio") && type.includes("stopped")) {
    return normalizeAnimationSignal({ ...current, state: "thinking", level: 0, speaking: false, userSpeaking: false, facial: "thinking", gaze: "attention", interrupted: false });
  }
  if (type.includes("response.created") || type.includes("response.started") || type.includes("output_audio.started")) {
    return normalizeAnimationSignal({ ...current, state: "speaking", level, speaking: true, userSpeaking: false, facial: "focused", gaze: "human", interrupted: false });
  }
  if (type.includes("audio.delta") || type.includes("audio_transcript.delta") || type.includes("response.delta")) {
    return normalizeAnimationSignal({ ...current, state: "speaking", level, speaking: true, userSpeaking: false, facial: "focused", gaze: "human", interrupted: false });
  }
  if (type.includes("response.done") || type.includes("output_audio.done") || type.includes("audio.stopped")) {
    return normalizeAnimationSignal({ ...current, state: "idle", level: 0, speaking: false, userSpeaking: false, facial: "neutral", gaze: "camera", interrupted: false });
  }
  if (type.includes("interrupted") || type.includes("cancelled") || type.includes("canceled")) {
    return normalizeAnimationSignal({ ...current, state: "listening", level: 0, speaking: false, userSpeaking: true, facial: "empathetic", gaze: "human", interrupted: true });
  }
  if (type.includes("error")) {
    return normalizeAnimationSignal({ ...current, state: "idle", level: 0, speaking: false, userSpeaking: false, facial: "concerned", gaze: "camera", interrupted: false });
  }
  if (type.includes("session.closed") || type.includes("session.close")) {
    return normalizeAnimationSignal({ ...current, state: "idle", level: 0, speaking: false, userSpeaking: false, facial: "neutral", gaze: "camera", interrupted: true });
  }
  return normalizeAnimationSignal({ ...current, level });
}
