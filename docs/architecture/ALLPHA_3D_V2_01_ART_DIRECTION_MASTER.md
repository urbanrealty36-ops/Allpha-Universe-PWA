# Allpha Universe — 3D-V2.01 Art Direction & Master Visual Language

Date: 2026-10-05
Status: IMPLEMENTED — 3D FOUNDATION REBUILD / VISUAL ASSET V2
Track: 3D-V2
Phase: 3D-V2.01 — Art Direction & Master Visual Language

## 1. Purpose

3D-V2.01 establishes the single visual language that every future Allpha spatial asset must follow before geometry is generated or activated.

This is not a second renderer, theme engine, asset authority layer, or runtime. It is the art-direction contract consumed by the existing AllphaWorldRenderer, existing Theme/World runtime, existing Live Character Runtime, and existing asset lifecycle.

The current V1 25-theme GLB pack remains a compatibility/rollback baseline. It is not the visual target.

## 2. North Star

Allpha must read immediately as:

**A living AI Social Universe — cinematic, spatial, intelligent, premium, human-centered, and explorable.**

The visual hierarchy is:

```
COSMIC FIELD
   ↓
UNIVERSE CORE
   ↓
GALAXY / ORBITAL SYSTEM
   ↓
WORLD
   ↓
DISTRICT / ZONE
   ↓
BOOTH / PLACE
   ↓
AI AGENT / HUMAN PRESENCE
   ↓
CONTENT CAPSULE
   ↓
LIVE EXPERIENCE
```

The hierarchy must be readable even before labels are opened.

## 3. Master visual language

### 3.1 Form language

Primary forms:
- spheres
- rings
- arcs
- capsules
- platforms
- towers
- floating islands
- gateways
- faceted landmarks
- layered architectural silhouettes

Secondary forms:
- hexagonal/triangular technical facets
- holographic panels
- energy ribbons
- beacon cones
- floating particles

Avoid:
- generic primitive-only scenes
- flat icon-only worlds
- identical buildings across themes
- excessive cubes/spheres used as final landmarks
- noisy detail without hierarchy

A primitive may be used as a construction primitive, but the final asset must have a recognizable silhouette and a deliberate material/lighting treatment.

### 3.2 Material language

The master material family is:

1. **Deep Space** — matte/dark environment surfaces.
2. **Luminous Core** — emissive energy sources.
3. **Holographic Glass** — translucent UI/spatial panels.
4. **Architectural Metal** — controlled metallic structures.
5. **World Organic** — vegetation, terrain, water, stone, fabric.
6. **Character Surface** — skin, hair, wardrobe and accessories.
7. **Signal FX** — particles, beams, portal energy and interaction feedback.

Rules:
- emissive materials communicate energy or active state, never arbitrary decoration;
- glass remains readable against the background;
- metallic surfaces require a visible light source/reflection;
- transparent layers are budgeted carefully for mobile;
- materials must support theme tokens without changing semantic roles.

### 3.3 Lighting language

Every scene has a three-level lighting hierarchy:

**Key**
- establishes the primary readable silhouette.

**Fill**
- separates foreground objects from the cosmic environment.

**Accent**
- communicates theme, active state, portal, Agent presence, Content or Live.

Default Allpha spectral family:
- cyan / sky for system energy
- blue for navigation and World structure
- violet for intelligence / AI
- magenta for social/live emphasis
- aurora/green for organic/living systems

Theme accents may shift the palette, but semantic contrast must remain intact.

### 3.4 Atmosphere

Every spatial scene should contain controlled depth cues:
- star field or environmental particles
- distant haze
- local volumetric suggestion
- foreground/midground/background separation
- subtle bloom-like emissive hierarchy
- orbital depth

Atmosphere must never obscure labels or interaction targets.

## 4. Spatial composition rules

### Universe

The Universe is a large negative-space field with a clear central gravitational identity.

Required:
- central Universe identity/core
- distant stars/particles
- orbital or constellation structure
- readable World/Galaxy nodes
- transition/gateway language

### Galaxy

A Galaxy is a clustered system, not a flat grid.

Required:
- central gravitational field
- primary orbit
- secondary orbit/cluster
- World nodes with depth
- relationship lines/trails only when meaningful

### World

A World must have a recognizable environmental identity.

Required:
- ground/platform/island silhouette
- World landmark
- district grouping
- World portal/gateway
- sky/atmosphere treatment
- Agent/content/live spatial anchors where authoritative state exists

### District

A District must read as a place inside a World.

Required:
- terrain/ground hierarchy
- landmark/building set
- street/path/zone language
- booth anchors
- zone markers
- readable entry/exit

### Booth

A Booth is a place, not a card.

Required:
- shell/architecture
- signage or identity marker
- entrance/portal
- interior/display treatment
- optional Agent host location
- optional commerce/content/live surfaces

### Content Capsule

Content is spatialized through a recognizable capsule language:
- floating core
- outer shell/ring
- content/media signal
- relationship orbit
- state glow

Content must never become an unreadable decorative orb.

### Agent Character

Agent Characters are full-body spatial entities, not floating profile icons.

Required:
- head / face presentation
- torso / limbs
- readable silhouette
- wardrobe identity
- theme accent
- idle motion
- listening / thinking / speaking / greeting states
- gaze direction when runtime provides it
- optional aura/role marker

The existing CharacterAnimationSignal and Live Character Runtime remain canonical.

### Live Stage

Live is a spatial destination:
- stage platform
- backdrop/screen
- energy ring
- audience/presence field
- entrance/exit treatment
- camera-readable focal point

### Portal

A portal communicates transition between authoritative locations.
It must have:
- gateway silhouette
- core energy
- depth layer
- directional cue
- transition animation

The portal visual itself never grants access.

## 5. Character art direction

Character target:
- stylized premium 3D
- friendly and intelligent
- human-readable proportions
- expressive face
- theme-aware wardrobe
- controlled emissive accents
- mobile-readable silhouette

Performance states:

| State | Visual signal |
|---|---|
| idle | breathing + subtle weight shift |
| listening | gaze toward human/context + attentive posture |
| thinking | small gaze/head/hand change |
| speaking | mouth + head/hand micro-motion |
| greeting | clear wave/gesture |
| farewell | short exit gesture |
| live | stronger stage-aware performance |
| reduced motion | static pose + state badge |

No animation state may imply an authority decision.

## 6. Animation language

Master motion vocabulary:
- Float
- Orbit
- Pulse
- Drift
- Glow
- Reveal
- Assemble
- Speak
- Listen
- Think
- Greet
- Portal Enter
- Portal Exit
- Live Entrance
- Live Exit

Motion principles:
- spatial motion is slow and intentional;
- interaction feedback is fast and localized;
- camera motion must not induce discomfort;
- reduced-motion mode removes continuous decorative motion while preserving state communication.

## 7. Camera language

### Mobile
- portrait-first composition
- focal subject within central safe region
- strong foreground/midground/background separation
- UI overlays remain readable
- no mandatory camera interaction

### Desktop
- wider spatial field
- optional orbit/pan
- contextual side rails
- larger relationship field

Camera defaults must remain compatible with progressive enhancement:

2D → 2.5D → Spatial → 3D

## 8. Mobile performance art direction

V2 is designed for mobile first.

Targets:
- compact draw complexity
- controlled transparency
- limited simultaneous emissive surfaces
- baked/cheap secondary detail where possible
- lazy-load heavy 3D
- low-power mode
- reduced motion
- graceful 2D fallback

Visual richness must come from silhouette, depth, lighting and composition before polygon count.

## 9. Theme system rule

The 25 existing semantic themes remain canonical:

1. Aurora Kingdom
2. Celestial Samurai
3. Chronos Realm
4. Coral Metropolis
5. Crystal AI City
6. Desert Starfall
7. Dragon Dominion
8. Dream Carnival
9. Emerald Rainforest
10. Floating Garden
11. Galactic Frontier
12. Heroic Nexus
13. Kingdom of Aether
14. Lunar Frontier
15. Mars Frontier
16. Mystic Academy
17. Neo Jakarta 2099
18. Neon Tokyo
19. Nusantara Raya
20. Oceanic Atlantis
21. Pharaoh Eternal
22. Quantum City
23. Savanna Spirit
24. Skyforge Empire
25. Viking Fjord

A theme changes the visual expression, not the product semantics.

Each theme controls:
- geometry language
- palette/accent
- material treatment
- lighting
- atmosphere
- landmark silhouette
- district architecture
- booth treatment
- portal treatment
- capsule treatment
- character wardrobe accents
- Live stage treatment
- particle/FX language

It must not create a new runtime, renderer or authority model.

## 10. Asset category matrix

The V2 baseline remains:

25 themes × 14 categories = 350 theme-aware visual templates.

Categories:
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

3D-V2.01 defines the language for these categories. Geometry generation and replacement are subsequent phases.

## 11. Visual state semantics

The visual system uses semantic state, not arbitrary color:

- neutral → system surface
- selected → cyan/blue focus
- active → luminous accent
- AI/intelligence → violet
- social/live → magenta
- organic/living → aurora/green
- warning → amber
- error → red
- unavailable → muted

The renderer and UI may render these states, but the server remains authoritative.

## 12. Accessibility

Required:
- reduced motion
- visible focus
- readable contrast
- labels independent from color
- 44px minimum touch target
- no critical information encoded only in glow/animation
- explicit loading/empty/error/unavailable states

## 13. Asset quality gate

A V2 asset is not accepted because it exists.

Minimum gate:
- recognizable silhouette
- deliberate material hierarchy
- visible depth
- correct scale
- theme identity
- mobile readability
- animation compatibility
- naming contract
- no unnecessary transparency
- no prohibited authority semantics
- renderer compatibility
- asset lifecycle compatibility

## 14. Asset lifecycle

```
ART DIRECTION
   ↓
CONCEPT
   ↓
GEOMETRY / MATERIAL GENERATION
   ↓
GLB / GLTF
   ↓
VALIDATION
   ↓
MODERATION
   ↓
STORAGE
   ↓
ASSET MANIFEST
   ↓
SIGNED URL
   ↓
AllphaWorldRenderer
   ↓
RUNTIME QA
```

AI image generation may create concept references. It does not become the production GLB by itself.

## 15. Architecture boundary

3D-V2.01 explicitly does NOT create:
- second renderer
- second spatial engine
- second theme authority
- second Agent Runtime
- second Live engine
- second Feed/Discovery engine
- second AI Gateway
- second asset authority

Canonical renderer remains **AllphaWorldRenderer**.

## 16. Implementation status

Completed in 3D-V2.01:
- master visual language
- form language
- material language
- lighting language
- atmosphere language
- spatial composition rules
- character art direction
- animation vocabulary
- camera language
- mobile performance direction
- 25-theme semantic mapping
- 14-category asset matrix
- quality gate
- asset lifecycle boundary
- design-token implementation

Not claimed complete by 3D-V2.01:
- production-quality GLB replacement
- all 350 final assets
- browser/device visual QA
- final renderer validation against every theme
- production visual GREEN

## 17. Next 3D-V2 phases

- 3D-V2.02 — Reference Theme / Golden Scene
- 3D-V2.03 — Geometry & Material Asset Factory
- 3D-V2.04 — Character / Live Character V2
- 3D-V2.05 — Universe / Galaxy / Orbit V2
- 3D-V2.06 — World / District / Booth V2
- 3D-V2.07 — Capsule / Content / Feed Universe V2
- 3D-V2.08 — Live / Human Live / Stage V2
- 3D-V2.09 — Portal / Navigation / Spatial FX V2
- 3D-V2.10 — 25 Theme Expansion / 350 Template Matrix
- 3D-V2.11 — Manifest / Renderer Activation
- 3D-V2.12 — Mobile Performance + Accessibility
- 3D-V2.13 — Visual QA / Runtime Validation
- 3D-V2.14 — V1 → V2 Canonical Cutover
- WEB-16 — Create Experience revalidated against V2 assets

## 18. Governance

This document is the canonical visual language for 3D-V2.

Any future 3D asset or UI spatial treatment that conflicts with this language must be reconciled here before implementation.

CW-02 remains OPEN / ACTIVATING / NOT GREEN until runtime/browser/device validation is complete.


## 3D-V2.02 implementation record

3D-V2.02 now materializes the V2.01 language as a Golden Scene reference through the canonical `AllphaWorldRenderer`.

Golden theme: **Crystal AI City**

Golden layers:
- Universe: central gravitational core, nested orbital fields, Galaxy anchors, deep-space particle field.
- Galaxy: central Galaxy core, primary/secondary orbit systems, World nodes.
- Orbit: orbital core, nested rings, 8 spatial presentation nodes.

Canonical implementation:
- `apps/web/lib/world-engine/golden-scene.ts`
- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/components/universe/galaxy-navigator-experience.tsx`

The Golden Scene is presentation-only and does not replace authoritative Galaxy/World records. The Navigator may use it as a visual reference while real data continues to come from the existing Universe contracts.

## 3D-V2.05 — Universe / Galaxy / Orbit V2

Status: **IMPLEMENTED / SPATIAL COMPOSITION V2 FOUNDATION / RUNTIME VISUAL QA PENDING**

Implementation:
- `apps/web/lib/world-engine/spatial-composition-v2.ts`
- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/lib/world-engine/golden-scene.ts`
- `docs/audits/3D_V2_05_UNIVERSE_GALAXY_ORBIT_20261005.md`

V2.05 upgrades the existing Golden Scene inside the canonical AllphaWorldRenderer with a deterministic spatial composition contract:
- Universe central gravity + Galaxy anchors + deep cosmic field
- Galaxy core + primary/secondary orbit + World nodes
- Orbit core + nested rings + distributed spatial nodes
- foreground / midground / background depth hierarchy
- near/far orbital depth
- semantic core / galaxy / world / orbit roles
- mobile-aware particle budgets and camera composition
- reduced-motion and low-power behavior

The composition factory is presentation-only. It does not create authoritative records or replace Universe/Galaxy/World contracts.

No second renderer, spatial engine, Theme authority, Agent Runtime, Live engine, Feed/Discovery engine or AI Gateway was introduced.

Not claimed complete:
- production GLB replacement
- 25-theme runtime validation
- 350 final assets
- browser/device visual QA
- V1 → V2 canonical cutover

Next: **3D-V2.06 — World / District / Booth V2.**
