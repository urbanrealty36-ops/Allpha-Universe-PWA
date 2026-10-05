export type LiveStageActorRole = "human" | "ai-agent";
export type LiveStageActorState = "idle" | "presenting" | "listening" | "speaking" | "collaborating";

export type LiveStageActor = {
  id: string;
  role: LiveStageActorRole;
  state: LiveStageActorState;
  position: { x: number; y: number; z: number };
  presentationOnly: true;
};

export type LiveStageV208Composition = {
  schema: "live-stage-v2.08";
  stage: {
    active: boolean;
    source: "dedicated_stage_asset" | "theme_stage";
    presentationOnly: true;
  };
  actors: LiveStageActor[];
  collaboration: {
    active: boolean;
    consentApproved: boolean;
    riskAllowed: boolean;
    presentationOnly: true;
  };
  progressiveEnhancement: "2d-2.5d-spatial-3d";
  presentationOnly: true;
};

export function createLiveStageV208Composition(input: {
  stageActive: boolean;
  stageSource?: "dedicated_stage_asset" | "theme_stage";
  humanPresentationActive: boolean;
  humanPresentationStatus?: string | null;
  collaborationActive: boolean;
  consentApproved: boolean;
  riskAllowed: boolean;
  agentId?: string | null;
  humanId?: string | null;
  humanState?: LiveStageActorState;
  agentState?: LiveStageActorState;
}): LiveStageV208Composition {
  const actors: LiveStageActor[] = [];

  if (input.humanPresentationActive) {
    actors.push({
      id: input.humanId || "human-presenter",
      role: "human",
      state: input.humanState || (input.collaborationActive ? "collaborating" : "presenting"),
      position: [-1.45, 0.05, 0],
      presentationOnly: true,
    });
  }

  if (input.collaborationActive && input.agentId) {
    actors.push({
      id: input.agentId,
      role: "ai-agent",
      state: input.agentState || "collaborating",
      position: [1.45, 0.05, 0],
      presentationOnly: true,
    });
  }

  return {
    schema: "live-stage-v2.08",
    stage: {
      active: input.stageActive,
      source: input.stageSource || "theme_stage",
      presentationOnly: true,
    },
    actors,
    collaboration: {
      active: input.collaborationActive,
      consentApproved: input.consentApproved,
      riskAllowed: input.riskAllowed,
      presentationOnly: true,
    },
    progressiveEnhancement: "2d-2.5d-spatial-3d",
    presentationOnly: true,
  };
}

export function validateLiveStageV208Composition(
  composition: LiveStageV208Composition,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (composition.schema !== "live-stage-v2.08") errors.push("LIVE_STAGE_V208_SCHEMA_UNSUPPORTED");
  if (composition.presentationOnly !== true) errors.push("LIVE_STAGE_V208_AUTHORITY_BOUNDARY_INVALID");
  if (composition.stage.presentationOnly !== true) errors.push("LIVE_STAGE_V208_STAGE_AUTHORITY_INVALID");
  if (composition.actors.some((actor) => actor.presentationOnly !== true)) errors.push("LIVE_STAGE_V208_ACTOR_AUTHORITY_INVALID");
  if (composition.actors.length > 2) errors.push("LIVE_STAGE_V208_ACTOR_BUDGET_EXCEEDED");
  if (composition.collaboration.presentationOnly !== true) errors.push("LIVE_STAGE_V208_COLLAB_AUTHORITY_INVALID");
  return errors.length ? { ok: false, errors } : { ok: true };
}
