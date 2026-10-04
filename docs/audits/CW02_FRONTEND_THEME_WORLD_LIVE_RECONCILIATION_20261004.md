# CW-02 Frontend + Theme/World/Live Reconciliation — 2026-10-04

Status: RECONCILIATION COMPLETE / CW-02 OPEN / NOT GREEN

## Scope

This reconciliation covers the current Web App Universe entry, canonical spatial renderer, Theme/World presentation surfaces, and Live Experience vertical slice. It does not create a new completion wave and does not change canonical engine boundaries.

## Canonical boundaries confirmed

- `AllphaWorldRenderer` remains the single canonical 3D renderer.
- `UniverseEntrySurface` is the current root entry and converges authenticated users into `ImmersiveUniverseShell`.
- Theme catalog/runtime uses `/api/v1/themes/world-runtime/catalog` and the canonical Theme asset manifest.
- Spatial traversal is Galaxy → World → District → Booth.
- Live Experience reuses `AllphaWorldRenderer` and passes Theme scene/tokens plus Live Stage and Agent Character asset URLs.
- Theme remains presentation/configuration only; it must not become an authority, permission, billing, risk, approval, identity, or ownership engine.

## Current frontend finding

The current implementation is architecturally aligned but is still an implementation-oriented vertical slice rather than the full product UX represented by the Project reference images.

The root surface is Universe-first, but the authenticated experience currently exposes:
- a procedural/renderer-driven spatial shell,
- compact HUD/breadcrumb controls,
- Theme/World runtime status,
- Theme Studio and vertical-slice controls.

It does not yet realize the full reference UX system as a coherent product surface:
- Discover/Home Universe Feed,
- World Navigator with visual destination rail,
- District discovery and themed district cards,
- spatial Booth/Tenant presentation,
- Agent Factory step flow,
- Character selection/preview,
- Universe Context + Experience Mode,
- Authority & Policy configuration,
- Preview/Create Agent,
- My Agents / Agent Detail command console,
- mobile-first navigation patterns shown in the reference set.

These are UX realization gaps, not reasons to create new backend engines.

## Theme / 3D finding

Live Supabase currently contains:
- 25 themes
- 25 theme versions
- 25 active theme assets
- 25 world templates
- 25 world template versions
- 25 live experience templates
- 25 live experience template versions

The Web renderer already supports:
- verified Theme GLB environment loading,
- BoothTemplate extraction,
- LiveExperienceStage extraction,
- Agent/Character presentation,
- procedural fallback,
- 2D / 2.5D / 3D progressive modes.

Therefore the missing product step is not a second renderer. It is the product UX and runtime binding that makes the existing canonical assets and contracts visible as an actual Universe experience.

## Live Experience finding

Live Experience has a canonical Web vertical slice that:
- selects published Live Template,
- selects published version,
- resolves Live Stage asset through `/api/v1/live-assets/templates/{version_id}/stage`,
- resolves Agent Character asset through `/api/v1/live-assets/agents/{agent_id}/character`,
- creates Live Session,
- transitions draft → scheduled → live → ended,
- requests Agent collaboration,
- passes consent/capability/policy/risk gates,
- can create/plan Agent Runtime commands,
- renders the stage and character through `AllphaWorldRenderer`.

Current live Supabase runtime state:
- 0 live stage assets
- 34 active live character assets
- 34 active live character asset contracts
- 0 live sessions
- 0 stage bindings
- 0 character bindings
- 0 camera sources
- 0 human presentations
- 0 voice bindings
- 0 Agents

Conclusion: Live Experience is structurally wired but cannot yet be called runtime-proven or visually complete. The zero Live Stage asset count is a concrete activation boundary.

## Important UI/UX interpretation

The Project reference images are treated as product UX references, not as literal data or a request for fake records.

The intended visual language is:
- immersive spatial/cosmic Universe,
- dark premium presentation,
- strong visual destination imagery,
- floating HUD rather than dashboard-first layout,
- contextual side/bottom panels,
- visual navigation,
- Agent/Character as first-class entities,
- 3D stage templates for Live Experience,
- mobile and desktop variants.

The reference UX must be implemented over the canonical existing engines and APIs.

## Next implementation increment inside CW-02

Do not create a new wave/phase.

The next increment should be a **Frontend Product UX Realization increment** inside CW-02, after this reconciliation, with these boundaries:

1. Recompose authenticated Universe Home/Discover into the reference information architecture.
2. Add visual World/Theme destination navigation using the existing Theme catalog and signed asset manifest.
3. Add District discovery presentation using existing District/Zone data and APIs.
4. Add Booth/Tenant spatial detail surface using existing Booth and spatial composition contracts.
5. Add Agent Factory UI flow using existing Agent Type, Skills, Character, Universe Context, Policy/Authority and Agent creation contracts.
6. Add Character selection/preview using existing Character Catalog and Live Character contracts.
7. Add My Agent detail/command surface using existing Agent Runtime contracts.
8. Add a Live Stage Template picker and 3D preview that reuses `AllphaWorldRenderer` and existing Live Template/Version contracts.
9. Keep 2D/2.5D/3D fallback and mobile/low-power behavior.
10. Do not seed Agents, Content, Live Sessions, Stage Bindings, or fake business activity merely to make the UI look populated.
11. Keep all authority and business mutations server-authoritative.
12. After implementation, run build + authenticated runtime/browser evidence before changing CW-02 status.

## Explicit non-goals

- No second renderer.
- No second Theme Engine.
- No second World Engine.
- No second Live/Voice/Character engine.
- No second Agent Runtime.
- No duplicate Feed/Recommendation engine.
- No fake Agent/Live/Commerce data.
- No CW-02 GREEN claim.
- No production GREEN claim.

## Evidence basis

This document reflects the current repository main branch and live Supabase state observed during the 2026-10-04 reconciliation. The canonical Project context already defines Theme as a presentation contract spanning Galaxy → World → District → Zone → Booth → Agent/Character → Portal → Content/AI Capsule → Live Experience Stage, with `AllphaWorldRenderer` as the canonical renderer.
