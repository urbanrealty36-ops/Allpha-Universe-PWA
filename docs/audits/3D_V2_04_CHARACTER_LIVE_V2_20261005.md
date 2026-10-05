# Allpha Universe — 3D-V2.04 Character / Live Character V2 Audit

Date: 2026-10-05
Status: IMPLEMENTED / CHARACTER V2 FOUNDATION / RUNTIME VISUAL QA PENDING
Track: 3D-V2
Phase: 3D-V2.04 — Character / Live Character V2

## Scope

3D-V2.04 upgrades the existing Agent/Live Character presentation contract without creating a second character runtime. The implementation consumes the existing CharacterAnimationSignal and existing live character runtime catalog.

## Implemented

- `apps/web/lib/live-character-v2.ts`
- Existing `CharacterAnimationSignal` remains the canonical animation signal.
- Existing `AllphaWorldRenderer` remains the canonical renderer.
- Theme-aware Character V2 profiles derive from the existing 25 `ALLPHA_3D_THEME_PROFILES`.
- Character profiles define silhouette, theme wardrobe/material language, face capability, gaze capability, viseme capability, animation states/intents and mobile performance budget.
- Existing platform character presentation is upgraded to use theme-aware V2 wardrobe, silhouette and facial/gesture presentation.
- Existing GLB character path continues to use authoritative signed/runtime catalog URLs when available.
- Reduced-motion preserves semantic character state rather than continuous decoration.

## Live animation contract

The V2 character layer recognizes the existing states:
idle, listening, thinking, speaking, emphasis, greeting, acknowledge, farewell.

Existing intents remain canonical:
greet, acknowledge, explain, emphasize, ask, answer, think, agree, disagree, apologize, celebrate, caution, wait, listen, invite.

No new AI/voice/agent runtime is created.

## Authority boundary

Character V2 is presentation-only:
- no agent identity decision;
- no ownership decision;
- no permission/policy/risk/approval decision;
- no live-session state fabrication;
- no synthetic presence;
- no database writes.

A runtime signal is only animated when supplied by the existing canonical runtime/parent.

## Character hierarchy

Theme → Character Profile → Silhouette/Wardrobe → CharacterAnimationSignal → AllphaWorldRenderer

When an authoritative GLB exists, the existing GLB path remains preferred. Platform procedural character is the V2 fallback/reference implementation.

## Acceptance target

- recognizable full-body character silhouette;
- theme-specific wardrobe language;
- facial presentation;
- gaze;
- speaking/listening/thinking/greeting behavior;
- spatial presence ring;
- mobile-safe quality reduction;
- reduced-motion semantic fallback.

## Explicit non-goals

- 25 final production character GLBs;
- facial capture system;
- new Live/Voice engine;
- new Agent Runtime;
- browser/device visual QA;
- V2 canonical asset cutover;
- Production GREEN.

Next: **3D-V2.05 — Universe / Galaxy / Orbit V2**.
