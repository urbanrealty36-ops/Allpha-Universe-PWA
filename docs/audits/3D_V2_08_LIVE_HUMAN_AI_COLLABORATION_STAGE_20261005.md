# Allpha Universe — 3D-V2.08 Live / Human Live / Stage V2 Audit

Date: 2026-10-05
Phase: **3D-V2.08 — Live / Human Live / Stage V2 / Human + AI Agent Collaboration Stage**
Status: **IMPLEMENTATION COMPLETE / RAILWAY BUILD VERIFICATION IN PROGRESS / RUNTIME VISUAL QA PENDING**

## Objective

Extend the canonical 3D Live Experience presentation so a Human presenter and an owned AI Agent can appear together on the same Live Collaboration Stage.

This phase does not create a second Live engine, Character Runtime, Voice engine, WebRTC transport, Agent Runtime, AI Gateway, policy engine, risk engine or approval engine.

## Implemented

### 1. Live Collaboration Stage V2 contract

Added:

- `apps/web/lib/world-engine/live-stage-v2.ts`

Contract:

- schema `live-stage-v2.08`;
- Human actor;
- AI Agent actor;
- collaboration state;
- consent/risk state as presentation inputs only;
- deterministic actor positions;
- maximum two stage actors;
- presentation-only validation;
- progressive 2D → 2.5D → Spatial → 3D boundary.

### 2. Canonical AllphaWorldRenderer integration

Updated:

- `apps/web/components/world/allpha-world-renderer.tsx`

The existing **AllphaWorldRenderer** remains canonical.

The new stage presentation can render:

- approved Live Stage asset;
- Human presentation proxy;
- AI Agent character;
- Human ↔ AI Agent collaboration ring/state;
- existing CharacterAnimationSignal-driven AI character performance;
- theme-aware AI character styling.

No new renderer was introduced.

### 3. Existing Live Runtime binding

Updated:

- `apps/web/components/live-experience-runtime-setup.tsx`

The existing authoritative runtime state now feeds the stage presentation:

- Human Presentation runtime;
- active collaboration;
- collaboration consent status;
- collaboration risk decision;
- Agent ID;
- Character Animation Signal state.

The browser UI does not infer authority.

### 4. Existing Live / Voice / WebRTC boundaries preserved

The existing components remain authoritative for their respective concerns:

- `live-gpt-live-voice.tsx`
- `live-webrtc-stage.tsx`
- `use-live-webrtc.ts`
- Live API endpoints / RPC contracts.

WebRTC remains transport-only.

GPT-Live remains behind the existing Live/AI boundary.

CharacterAnimationSignal remains the animation presentation boundary.

## Human + AI Collaboration Stage

Canonical experience:

```
Human
  ↓
Presence / Consent
  ↓
Human Presentation
  ↓
Live Stage
  ↔
AI Agent
  ↓
Agent Passport
  ↓
Capability
  ↓
Policy
  ↓
Consent
  ↓
Risk
  ↓
Approval
  ↓
Agent Runtime
```

The 3D layer only presents the resulting authorized runtime state.

## Validation boundary

The phase explicitly does NOT claim:

- legal identity/KYC verification;
- Agent authority from camera presence;
- permission from UI state;
- execution authority from 3D state;
- billing entitlement from presentation;
- raw camera persistence;
- biometric embedding persistence.

## Current verification

Railway deployment was triggered automatically from canonical `main`.

The initial V2.08 deployment attempts exposed TypeScript issues in the new integration. These were corrected:

- canonical vector position typing;
- WorldObjects live-stage prop typing.

The latest Railway builds are currently **BUILDING**, with no new TypeScript error reported in the latest log sample.

Therefore:

**Implementation = COMPLETE**

**Build/Deployment verification = IN PROGRESS**

**Browser/device visual QA = PENDING**

**Production GREEN = NOT CLAIMED**

## Next phase after verification

# 3D-V2.09 — Portal / Navigation / Spatial FX V2

Target:

```
Universe
 ↓
Galaxy
 ↓
World
 ↓
District
 ↓
Portal
 ↓
Navigation
 ↓
Spatial FX
 ↓
Transition
 ↓
Destination World
```

The existing Universe/World navigation contracts remain authoritative. The phase should add spatial presentation and transitions, not a second navigation engine.
