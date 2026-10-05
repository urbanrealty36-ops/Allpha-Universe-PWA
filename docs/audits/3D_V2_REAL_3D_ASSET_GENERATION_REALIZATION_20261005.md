# 3D-V2 REAL 3D ASSET GENERATION & REALIZATION
## Allpha Universe — 2026-10-05

## Decision

The supplied `allpha-25-theme-3d-asset-pack(1).zip` is **not accepted as the Theme V2 production visual source**.

Audit conclusion:
- the pack contains 25 valid GLB files;
- the files are very small blockout/prototype assets;
- the 25 themes share the same basic geometry structure and differ primarily by material/palette;
- the pack therefore cannot satisfy the Theme V2 requirement of theme-specific spatial identity.

The old pack remains retained only as a historical/reference asset.

## New phase objective

Build a real 3D realization layer for:

**25 canonical themes × 14 canonical categories = 350 theme-aware visual templates**

The target is not “a 3D background”.

Each realization must express:
- real geometry;
- spatial depth;
- foreground / midground / background;
- landmark silhouette;
- theme-specific architectural language;
- material identity;
- orbit / portal / transition geometry where applicable;
- category-specific composition;
- motion that belongs to the world;
- mobile-aware detail reduction.

## Implemented

### Canonical renderer boundary

No second renderer was created.

The canonical path remains:

**AllphaWorldRenderer → Theme V2 Real 3D Asset Layer**

The legacy `ThemeV2SpatialScene` API is preserved as a compatibility wrapper but now delegates to:

`apps/web/components/world/theme-v2-real-3d-asset.tsx`

### 25 theme motifs

The new realization layer maps all canonical themes to distinct geometry families:

1. Aurora Kingdom — crystalline fantasy
2. Celestial Samurai — pagoda / torii
3. Chronos Realm — clockwork rings
4. Coral Metropolis — coral / underwater arcology
5. Crystal AI City — faceted cyber towers
6. Desert Starfall — dunes / obelisks / solar rings
7. Dragon Dominion — cliffs / dragon rings
8. Dream Carnival — luminous tents / carnival rings
9. Emerald Rainforest — canopy / living structures
10. Floating Garden — suspended gardens
11. Galactic Frontier — orbital stations
12. Heroic Nexus — monumental hero structures
13. Kingdom of Aether — floating palaces
14. Lunar Frontier — lunar domes
15. Mars Frontier — colony domes / reactor forms
16. Mystic Academy — academy towers / rune rings
17. Neo Jakarta 2099 — vertical megacity / transit rings
18. Neon Tokyo — dense neon towers / signage
19. Nusantara Raya — traditional-futurist structures
20. Oceanic Atlantis — underwater domes / columns
21. Pharaoh Eternal — pyramids / solar structures
22. Quantum City — impossible frames / grids
23. Savanna Spirit — rock / canopy structures
24. Skyforge Empire — forge towers / bridges
25. Viking Fjord — cliffs / longhouses

## 14 category realization

The same canonical 14 categories remain:

1. Universe
2. Galaxy
3. World
4. Orbit
5. Capsule
6. District
7. Booth
8. Content / Feed Universe
9. AI Agent Character
10. Live Stage
11. Human Live / Uniform
12. Sticker / Social 3D
13. Animation
14. Navigation / Spatial FX

Every combination is deterministic from:

**themeKey + category**

This yields 350 reproducible realizations.

## Public entry

The public Universe 3D hero no longer fetches the legacy Supabase GLB manifest as its primary visual source.

It now renders the real Theme V2 realization directly.

This is intentional:
- legacy placeholder geometry cannot silently override the new visual source;
- the public hero must visibly demonstrate the new V2 direction;
- the binary asset lifecycle remains available for later promotion.

## Asset lifecycle boundary

The complete binary lifecycle remains:

**Design → Generate → Validate → Moderate → Store → Manifest → Signed URL → AllphaWorldRenderer → Runtime QA**

This phase implements **Generate + Realize**.

The next binary activation phase must still perform:
- export;
- binary validation;
- moderation/performance validation;
- Supabase storage;
- manifest activation;
- signed URL consumption;
- rollback/cutover.

## Validation status

### Source implementation
**IMPLEMENTED**

### 350 matrix
**IMPLEMENTED**

25 × 14 = 350.

### Real geometry
**IMPLEMENTED**

The new renderer uses actual Three.js geometry with theme-specific structural motifs rather than the old box/cone placeholder world.

### Railway build
**PENDING OBSERVATION AFTER THIS CHANGE**

### Browser/device visual QA
**PENDING**

### Production GREEN
**NOT CLAIMED**

## Acceptance rule

The phase cannot be marked GREEN until runtime evidence demonstrates that:
- the public Universe is visibly spatial;
- the world has meaningful depth;
- the scene is not a flat wireframe globe;
- changing theme changes geometry identity, not only color;
- World / District / Booth hierarchy remains visually coherent;
- mobile presentation remains usable;
- reduced motion preserves spatial state.

