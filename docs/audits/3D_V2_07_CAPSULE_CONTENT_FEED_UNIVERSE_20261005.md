# Allpha Universe — 3D-V2.07 Capsule / Content / Feed Universe V2 Audit

Date: 2026-10-05
Phase: **3D-V2.07 — Capsule / Content / Feed Universe V2**
Status: **IMPLEMENTED / BUILD VERIFICATION PENDING / RUNTIME VISUAL QA PENDING**

## Scope

3D-V2.07 upgrades the canonical spatial presentation so authoritative Content records can be represented as spatial Content Capsules / Feed Universe nodes.

This phase is presentation-only. It does not create a second Content engine, Feed engine, Discovery engine, Gravity engine, AI Gateway, Agent Runtime, World engine, or renderer.

## Implemented

### 1. Canonical Content spatial composition

Added:

- `apps/web/lib/world-engine/content-spatial-v2.ts`

Contract:

- schema `3d-v2.07`;
- deterministic spatial composition;
- mobile node budget;
- progressive 2D → 2.5D → Spatial → 3D;
- optional authoritative gravity signal;
- optional authoritative relationship metadata;
- related-content links only when an explicit related relationship exists;
- `presentationOnly: true`;
- validation gate.

### 2. Canonical renderer integration

Updated:

- `apps/web/components/world/allpha-world-renderer.tsx`

The existing **AllphaWorldRenderer** remains the only spatial renderer.

The renderer now presents:

- Content Capsule geometry;
- Content Gravity field;
- optional gravity-weighted prominence;
- explicit related-content spatial links;
- relationship-count signal;
- Content hotspot metadata;
- reduced-motion behavior;
- low-power node budget.

No Content authority is inferred by the renderer.

### 3. World → Content binding

Updated:

- `apps/web/components/world/world-experience.tsx`

The existing authoritative World Content response is now passed into the canonical renderer as spatial Content input.

The UI does not fabricate Content records. If authoritative title, excerpt, gravity, position or relationship data is unavailable, the renderer uses presentation-only fallback geometry while preserving the source identity.

## Canonical experience mapping

```
Universe Stream
    ↓
Content Gravity
    ↓
Content Capsule
    ↓
World Context
    ↓
Agent / Community / Live relationships
    ↓
Ask the Content
```

The existing Content Capsule / Ask surfaces remain canonical:

- `apps/web/components/content/content-capsule-experience.tsx`
- `apps/web/components/content/ask-content-experience.tsx`
- existing Discovery / Content Evolution API contracts.

3D-V2.07 does not replace those experiences.

## Architecture boundary

The V2 spatial layer does NOT:

- create Content;
- publish Content;
- calculate authorization;
- calculate ownership;
- decide recommendation eligibility;
- execute Agent actions;
- invoke the AI Gateway directly;
- mutate Supabase;
- create a second Feed / Discovery engine;
- create a second Content Gravity engine;
- replace AllphaWorldRenderer.

## Golden Scene reconciliation

During implementation, the canonical renderer build blocker was also reconciled:

`GoldenSpatialLayerView` was referenced by `AllphaWorldRenderer` but was missing from the source.

The implementation restores that presentation component using the existing `createSpatialCompositionV205` contract.

This does not introduce a second renderer.

## Validation

### Source-level

- Content spatial composition schema implemented.
- Presentation-only boundary implemented.
- Existing authoritative Content input preserved.
- Existing AllphaWorldRenderer preserved.
- Golden Scene remains presentation-only.

### Railway

A new `@allpha/web` deployment was triggered from the canonical `main` branch.

Current verification state at audit creation:

**BUILD VERIFICATION PENDING**

Earlier build attempts exposed and were corrected for:
- missing `GoldenSpatialLayerView`;
- Content spatial node depth type narrowing.

The latest deployment is being used as the verification run.

### Not claimed complete

- Browser/device visual QA;
- authenticated E2E;
- Production GREEN;
- final 350 production GLBs;
- V1 → V2 asset manifest cutover;
- final visual acceptance across all 25 themes.

## Next phase

# 3D-V2.08 — Live / Human Live / Stage V2

Target:

```
Live Experience
    ↓
Live Theme
    ↓
Stage
    ↓
Human Live
    ↓
Uniform / Costume
    ↓
AI Character
    ↓
CharacterAnimationSignal
    ↓
Voice / Realtime / WebRTC
```

The existing Live Runtime, Character Runtime, Voice boundary and AI Gateway remain authoritative.
