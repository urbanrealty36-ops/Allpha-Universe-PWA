# Allpha Universe — 3D-V2.09 Theme V2 Visual Realization Audit

Date: 2026-10-05
Phase: **3D-V2.09 — Theme V2 Visual Realization / 25 Themes × 14 Categories × 350 3D Templates**
Status: **IMPLEMENTED VISUAL FOUNDATION / RAILWAY VERIFICATION + VISUAL QA PENDING**

## Objective

Refactor the Allpha spatial visual system from the flat/foundation presentation visible in the current Railway screenshots toward the supplied Allpha mobile UI/UX reference language.

The target is not a generic 3D background. The target is a living spatial hierarchy:

**Universe → Galaxy → World → District → Booth → Human / AI Agent / Content / Live / Community / Marketplace**

## Implementation

### Theme V2 reusable scene

File:
- `apps/web/components/world/theme-v2-spatial-scene.tsx`

Provides:
- cinematic deep-space depth;
- animated celestial core;
- orbital rings;
- floating world nodes;
- energy links;
- floating landmarks;
- World city composition;
- District composition;
- Booth cluster composition;
- Content Capsule composition;
- Live Stage composition;
- theme-aware geometry/material language;
- reduced-motion behavior;
- low-power particle/detail budget.

### 350 visual template matrix

File:
- `apps/web/lib/world-engine/theme-v2-visual-matrix.ts`

Contract:

**25 themes × 14 canonical categories = 350 visual templates**

Every template is generated from the canonical Theme Profile + Asset Factory and carries:
- spatial grammar;
- camera/depth contract;
- orbit/parallax contract;
- animation vocabulary;
- mobile/low-power contract;
- presentation-only authority boundary.

### Canonical renderer

File:
- `apps/web/components/world/allpha-world-renderer.tsx`

The existing AllphaWorldRenderer remains canonical.

Theme V2 is integrated into:
- Universe;
- Galaxy;
- Orbit;
- World;
- District;
- Booth;
- Content;
- Live.

No second spatial renderer was introduced.

### Public entry

Files:
- `apps/web/components/public-universe-3d.tsx`
- `apps/web/components/universe-entry-surface.tsx`

The public landing/splash/identity experience no longer relies on the previous flat CSS core/globe as the primary spatial visual.

Theme V2 now supplies the spatial 3D composition.

## 25 Themes

The existing canonical design-token profiles remain authoritative. Theme V2 derives its visual identity from those profiles rather than inventing a parallel theme catalog.

Examples include:
- Crystal AI City
- Quantum City
- Neo Jakarta 2099
- Galactic Frontier
- Aurora Kingdom
- Celestial Samurai
- Emerald Rainforest
- Oceanic Atlantis
- Mars Frontier
- Lunar Frontier
- Nusantara Raya
- and the remaining canonical themes.

## 14 Categories

The existing canonical categories remain:

1. Universe
2. Galaxy
3. World
4. Orbit
5. Capsule
6. District
7. Booth
8. Content / Feed
9. AI Agent Character
10. Live Stage
11. Human Live
12. Sticker / Social
13. Animation
14. Navigation FX

## Important asset boundary

The supplied `allpha-25-theme-3d-asset-pack(1).zip` contains 25 GLB theme scene files and a manifest describing reusable components including:

- WorldGround
- District_A/B/C/D
- WorldLandmark
- BoothTemplate
- AgentCharacterTemplate
- PortalGateway
- ContentAICapsule
- LiveExperienceStage

Those binaries are an asset-pack source. They are **not claimed as 350 unique production GLBs**.

The executable Theme V2 visual matrix therefore bridges the 25 canonical themes and 14 categories procedurally while the binary asset lifecycle remains:

Concept → 3D asset → validation → storage → manifest → signed URL → renderer → runtime QA.

## Architecture boundary

No new:
- Agent Runtime
- AI Gateway
- Feed engine
- Discovery engine
- policy engine
- risk engine
- approval engine
- authority layer
- billing engine
- navigation authority
- second renderer

was introduced.

3D remains presentation-only.

## Animation

Theme V2 includes:
- orbit;
- float;
- drift;
- pulse;
- glow;
- reveal;
- live stage motion;
- content capsule motion;
- theme-specific landmark movement.

Reduced motion removes continuous decorative movement while preserving semantic spatial state.

## Mobile

Low-power mode reduces:
- star count;
- landmark count;
- geometry detail;
- transparent effects.

The UI remains mobile-first and the spatial layer is progressively enhanced.

## Railway

The first deployment after the visual integration failed because the existing V2.08 Live Stage props were duplicated in `allpha-world-renderer.tsx`.

That issue has been corrected.

Current Railway state at audit update:
- Service: `@allpha/web`
- Environment: production
- Service ID: `ec936cce-d2fe-4202-83dd-e9646400f28f`
- Deployment queue active
- Latest settlement not yet verified

Therefore:
**Production GREEN is NOT claimed.**

## Browser / device QA

**PENDING**

The supplied Railway screenshots establish the baseline mismatch, but final acceptance requires checking the running V2 scene on:
- Android mobile;
- desktop browser;
- low-power mode;
- reduced-motion mode;
- authenticated spatial navigation.

## Documentation updated

- `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
- `docs/continue-context/ALLPHA_MASTER_CONTINUE_CONTEXT_20261005.md`
- `docs/audits/THEME_V2_3D_UIUX_REFERENCE_FIDELITY_20261005.md`
- this audit.

## Next Phase

After Theme V2 build and visual QA gates are green:

**3D-V2.10 — Portal / Navigation / Spatial FX V2**

Portal/navigation should be implemented on top of the realized Theme V2 spatial foundation, not used as a substitute for it.
