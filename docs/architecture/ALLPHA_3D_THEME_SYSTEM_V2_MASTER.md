# ALLPHA 3D THEME SYSTEM V2 — MASTER ASSET REFACTOR
Date: 2026-10-05

## Decision

The current 25-theme GLB pack must be treated as V1 placeholder geometry, not the final visual system.

Evidence from the supplied pack:
- 25 GLB files
- each is approximately 14 KB
- the manifest assigns the same component list to every theme
- components are declared as WorldGround, District_A/B/C/D, WorldLandmark, BoothTemplate, AgentCharacterTemplate, PortalGateway, ContentAICapsule and LiveExperienceStage

This structure is useful as a contract, but it is not sufficient to produce the visual fidelity shown in the supplied mobile references.

## Target

Replace the V1 presentation assets with a coherent V2 visual system that makes Allpha visibly spatial and 3D:

Reference language:
- cinematic cosmic depth
- luminous glass / holographic UI
- floating World/Galaxy nodes
- layered orbital systems
- recognizable 3D World landmarks
- 3D Agent Characters
- spatial Content Capsules
- portal transitions
- Live stages
- animated micro-elements
- premium blue/cyan/violet lighting
- strong depth hierarchy on mobile
- progressive enhancement from 2D → 2.5D → Spatial → 3D

## Asset Matrix

Baseline: 25 themes × 14 visual categories = 350 theme-aware templates.

### 01 Universe
Universe Core, Universe Gateway, Universe Background, Universe Energy Field

### 02 Galaxy
Galaxy Core, Galaxy Ring, Galaxy Cluster, Galaxy Node, Galaxy Nebula

### 03 World
World Ground, World Landmark, World Sky/Atmosphere, World Portal

### 04 Orbit
Primary Orbit, Secondary Orbit, World Orbit, Agent Orbit, Content Orbit

### 05 Capsule
Content Capsule, AI Capsule, Discovery Capsule, Notification/Signal Capsule

### 06 District
District Ground, District Landmark, District Building Set, District Street Set, District Zone Marker

### 07 Booth
Booth Shell, Booth Signage, Booth Portal, Booth Interior, Booth Display

### 08 Content / Feed Universe
Content Node, Feed Node, AI Summary Node, Media Node, Relationship Link

### 09 AI Agent Character
Base Character, Character Idle, Character Speaking, Character Listening, Character Thinking, Character Greeting

### 10 Live Stage
Live Stage, Stage Ring, Stage Screen, Stage Portal, Stage Audience Field

### 11 Human Live / Uniform
Human Presenter, Uniform Set, Live Presenter Silhouette, Camera Presence, Audience Avatar

### 12 Sticker / Social 3D
AI Sticker, Reaction Object, Badge, Emoji Orb, Achievement Token

### 13 Animation
Idle, Float, Orbit, Pulse, Speaking, Listening, Thinking, Greeting, Portal Transition, Live Entrance, Live Exit

### 14 Navigation / Spatial FX
Portal Gateway, Teleport Beam, Breadcrumb Orbit, World Connection, District Connection, Spatial Pointer

## Theme Families

The existing 25 themes remain the initial semantic catalog:

Aurora Kingdom
Celestial Samurai
Chronos Realm
Coral Metropolis
Crystal AI City
Desert Starfall
Dragon Dominion
Dream Carnival
Emerald Rainforest
Floating Garden
Galactic Frontier
Heroic Nexus
Kingdom of Aether
Lunar Frontier
Mars Frontier
Mystic Academy
Neo Jakarta 2099
Neon Tokyo
Nusantara Raya
Oceanic Atlantis
Pharaoh Eternal
Quantum City
Savanna Spirit
Skyforge Empire
Viking Fjord

Each theme must affect:
- geometry language
- material language
- lighting
- atmosphere
- color tokens
- landmark silhouettes
- district architecture
- booth treatment
- portal treatment
- capsule treatment
- character wardrobe accents
- Live stage treatment
- particle/FX language

## Character Quality Requirement

The current procedural character is a functional fallback, not the final reference quality.

V2 must support:
- full-body stylized 3D character
- facial presentation
- idle animation
- listening animation
- thinking animation
- speaking animation
- greeting / farewell
- gaze direction
- emotion state
- theme wardrobe
- Agent identity skin
- Human Live uniform
- reduced-motion fallback

Existing CharacterAnimationSignal and Live Character Runtime remain canonical.

## Renderer Rule

All visual assets must continue through the existing AllphaWorldRenderer.

Do not create:
- a second renderer
- a second spatial engine
- a second Agent Character runtime
- a second Live engine
- a second Feed/Content engine
- a second Theme authority layer

The renderer consumes authoritative scene/theme/asset state. Presentation never grants authority.

## Asset Lifecycle

Design → Generate → Validate → Moderate → Store → Asset Manifest → Signed URL → Renderer → Runtime QA

For generated theme assets, procedural generation is allowed as a production asset factory, but generated geometry must still pass the existing asset lifecycle before becoming authoritative.

## Generation Strategy

AI image generation is used for visual direction and concept references, not as a substitute for GLB geometry.

Recommended workflow:
1. Generate visual concept boards for each theme/component family.
2. Lock the Allpha 3D art direction.
3. Generate deterministic 3D geometry/materials from the approved specifications.
4. Export GLB/GLTF.
5. Validate geometry, bounds, material budget, naming contract and mobile performance.
6. Register asset in the existing asset manifest/storage lifecycle.
7. Activate only after server-side validation.

GPT-6 Astra is suitable for the complex design/engineering orchestration and can use image generation, code, and computer-use capabilities, but an image itself is not a GLB. OpenAI documents Astra as supporting image generation and professional engineering workflows.

## Replacement Strategy

Do NOT delete V1 assets first.

Phase A:
- create V2 asset contract
- create V2 generator
- create 1 reference theme at production quality
- validate renderer and mobile performance

Phase B:
- generate all 25 theme families
- activate all 14 categories
- register assets

Phase C:
- switch canonical theme manifest from V1 → V2
- keep V1 only as rollback/archive

Phase D:
- visual QA across Splash, Public Universe, Galaxy, World, District, Booth, Content, Agent and Live

Phase E:
- remove V1 references only after V2 is green

## Acceptance Criteria

The work is not considered complete merely because GLB files exist.

A theme is GREEN only when:
- it visibly reads as 3D on mobile
- geometry has meaningful silhouettes
- lighting creates depth
- World/District/Booth hierarchy is recognizable
- Agent Character is visibly 3D
- Content Capsule is spatial
- Portal has spatial transition treatment
- Live Stage has depth
- animation signals are visible
- no fake authority/data is introduced
- mobile performance remains acceptable
- reduced motion remains usable
- the existing authoritative asset lifecycle is respected

## Status

V2 master specification created.
V1 assets should not be considered final.
Browser/device visual QA remains required before claiming production visual completion.


## 3D-V2.01 activation

The art-direction foundation is now locked in:
- `docs/architecture/ALLPHA_3D_V2_01_ART_DIRECTION_MASTER.md`
- `packages/design-tokens/3d-visual-language.ts`
- 3D semantic CSS tokens in `packages/design-tokens/tokens.css`

3D-V2.01 is the prerequisite visual contract for all subsequent V2 geometry/material/character/portal/live asset work. It does not activate V2 assets yet.
