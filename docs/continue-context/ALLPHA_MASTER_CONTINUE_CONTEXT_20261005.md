# ALLPHA UNIVERSE — MASTER CONTINUE CONTEXT
## Master Handoff Prompt for New Chat / Coding Agent
### Canonical state: 2026-10-05

> **Purpose:** This document is the canonical handoff prompt for continuing Allpha Universe work in a new ChatGPT/Coding-Agent conversation.  
> The next agent MUST study the repository artifacts listed below before proposing or implementing anything.

---

# 1. MASTER INSTRUCTION

You are continuing development of **Allpha Universe**, not starting a new project.

Your job is to:
1. READ the canonical repository documentation and relevant source code.
2. UNDERSTAND the current architecture and completed work.
3. INSPECT the actual repository implementation before making assumptions.
4. RECONCILE documentation, source code, APIs, Supabase contracts and existing runtime behavior.
5. IDENTIFY what is implemented, partially implemented, foundation-only, pending, blocked or awaiting visual/runtime QA.
6. IMPLEMENT the next required phase directly into the canonical repository.
7. Reuse existing engines, contracts and authority boundaries.
8. Never create duplicate engines because a UI surface needs a feature.
9. After implementation, update the canonical audit / phase / continue-context documentation.
10. Build/test/deploy when applicable and report the exact evidence.
11. Never claim Browser Visual QA, Production GREEN or runtime validation unless it was actually performed.

**Do not restart architecture. Do not rewrite the system from a generic PRD. The repository is the source of implementation truth.**

---

# 2. CANONICAL PROJECT BINDING

- Repository: `urbanrealty36-ops/Allpha-Universe-PWA`
- Branch: `main`
- GitHub account/link: **Allpha Universe**
- Railway workspace: `urbanrealty36-ops's Projects`
- Railway project: `serene-youth`
- Production environment: `7055a4ea-dfa3-47da-8fc1-435e579dbf4d`
- Web service: `@allpha/web`
- API service: `allpha-api`
- Admin service: `@allpha/admin`
- Supabase: **AllphaDb-Universe**
- Supabase project ref: `qltbacemtvnuzqkterly`
- Supabase region: `ap-south-1`

Treat these bindings as canonical unless the repository/runtime explicitly proves they changed.

---

# 3. CURRENT MASTER MISSION

Allpha Universe is being transformed into a **spatial, AI-native Universe experience** where:

**Human → Identity → Universe → Galaxy → World → District → Zone → Booth → Agent → Content → Community → Live → Interaction**

The Web UI is no longer treated as a collection of conventional 2D pages.

The target is a progressive spatial product:

**2D → 2.5D → Spatial → 3D**

3D is an enhancement, not a hard dependency for core functionality.

The current major transformation has two parallel tracks:

### Track A — Full Web UI/UX Refactoring
The Web/PWA experience is being rebuilt to match the supplied visual references:
- cinematic Universe
- mobile-first spatial navigation
- premium dark/cosmic visual hierarchy
- glass/holographic surfaces
- Universe/Galaxy/World/District/Booth spatial continuity
- Agent Character experience
- Universe Stream / Moments Galaxy
- Content Capsule
- Ask the Content
- Live transitions
- Create experience

### Track B — 3D Foundation Rebuild / Visual Asset V2
The previous 25-theme GLB pack is treated as V1 placeholder/proof-of-contract geometry.

The target is:

**25 themes × 14 canonical visual categories = 350 theme-aware real 3D visual templates**

The supplied 25-theme GLB pack is classified as legacy blockout/prototype geometry. The current implementation now contains a real theme-aware procedural 3D realization layer for all 350 combinations. Do not claim that 350 binary production GLBs are already stored/activated; binary export and manifest activation remain a later lifecycle step.

---

# 4. NON-NEGOTIABLE ARCHITECTURE RULES

## 4.1 Never duplicate canonical engines

Do NOT create:
- second renderer
- second Feed/Discovery engine
- second Recommendation engine
- second Agent Runtime
- second AI Gateway / Model Router
- second Theme engine
- second World engine
- second Spatial Runtime
- second Live Runtime
- second Character Runtime
- second Messaging/Conversation engine
- second Community engine
- second Commerce/Marketplace engine
- second authority/permission layer
- duplicate asset activation/manifest lifecycle

### Canonical renderer
**AllphaWorldRenderer**

### Canonical authority chain
**Human → Identity → Agent → Capability → Policy → Permission → Risk → Approval → Runtime → Audit**

Frontend never decides:
- identity
- ownership
- permission
- policy
- risk
- approval
- billing
- payment
- entitlement
- execution result
- authoritative presence

### Canonical intelligence path

Use the existing:
- Agent Runtime
- AI Gateway / Model Router
- Agent Memory
- Agent Knowledge
- RAG
- Agent Context
- existing conversation/messaging contracts

### Canonical spatial hierarchy

**Universe → Galaxy → World → District → Zone → Booth**

### Canonical live hierarchy

**Live Experience → Character → Voice → Animation → Realtime/WebRTC**

### Canonical discovery hierarchy

**Feed → Discovery → Recommendation/Gravity → Content Capsule → Relationships**

---

# 5. CURRENT WEB PHASE STATUS

## WEB-01 — Baseline & Frontend Reconciliation
**STATUS: CLOSED**

Mission:
- reconcile existing frontend against actual architecture;
- establish baseline;
- prevent duplicate engines.

## WEB-02 — Design System Foundation
**STATUS: CLOSED**

Mission:
- establish Allpha visual foundation;
- Ambient / Spatial / Universe / Experience modes;
- responsive/mobile rules;
- 44px touch target;
- safe area;
- focus states;
- reduced motion;
- progressive 2D → 3D.

## WEB-03 — PWA Foundation
**STATUS: CLOSED / FOUNDATION IMPLEMENTED**

Mission:
- installable PWA;
- manifest;
- root service worker;
- offline shell;
- safe network/cache boundaries;
- no offline authority.

## WEB-04 — Mobile Navigation
**STATUS: CLOSED**

Canonical IA:
- Universe
- Explore
- Create
- Messages
- My Agent

Mission:
- one canonical mobile navigation;
- no duplicated navigation systems.

## WEB-05 — Universe Shell
**STATUS: IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING**

Mission:
- canonical shell;
- persistent Universe context;
- existing navigation/engines preserved.

## WEB-06 — Splash + Identity
**STATUS: IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING**

Mission:
- Splash;
- Public Universe entry;
- Human Identity;
- Sign in / Sign up;
- existing Supabase Auth boundary;
- no fake wallet/auth engine.

3D public entry visual refactor has also been implemented:
- cinematic splash
- public Universe visual
- Human Identity visual
- procedural 3D presentation layer

## WEB-07 — Universe Home
**STATUS: IMPLEMENTED / VALIDATION PENDING**

Mission:
- first authenticated Universe destination;
- Universe / Live / For You;
- featured Worlds;
- Stream;
- Agents;
- Live;
- Feature Constellation;
- mobile-first.

## WEB-08 — Galaxy Navigator
**STATUS: IMPLEMENTED / VALIDATION PENDING**

Mission:
- Universe → Galaxy → World discovery;
- authoritative Galaxy/World data;
- progressive spatial preview;
- now integrated with 3D-V2 Golden Galaxy presentation.

## WEB-09 — World Experience
**STATUS: IMPLEMENTED / BUILD VERIFIED / BROWSER QA PENDING**

Mission:
- World-level spatial experience;
- World Scene;
- Theme;
- District composition;
- Agent presence;
- 3D where authoritative.

## WEB-10 — District Experience
**STATUS: IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING**

Mission:
- World → District;
- Zone;
- Spatial Object;
- Booth;
- Agent Presence;
- access/join/request;
- existing Spatial Runtime.

## WEB-11 — Booth / Tenant
**STATUS: IMPLEMENTED / RAILWAY VERIFIED / BROWSER QA PENDING**

Mission:
- Booth identity;
- District/Zone/World context;
- Branding/Theme;
- Marketplace Catalog;
- AI Host;
- tenancy/lease;
- 3D assets;
- display slots;
- Live Entry.

## WEB-12 — Agent Experience
**STATUS: IMPLEMENTED / RAILWAY VERIFIED / BROWSER QA PENDING**

Mission:
- Agent is an in-Universe spatial experience, not a profile page.
- AI Character;
- Agent Space;
- HUD;
- Passport;
- Skills;
- Presence;
- Conversation;
- Collaboration;
- Negotiation.

## WEB-13 — Universe Feed / Moments
**STATUS: IMPLEMENTED / RAILWAY VERIFIED / BROWSER QA PENDING**

Mission:
- not a conventional social feed.
- Universe Stream;
- Content Gravity;
- Moments Galaxy;
- Content Capsules;
- orbit/constellation discovery;
- World relationship;
- Agent presence;
- Live transition;
- Ask the Content.

## WEB-14 — Content Capsule
**STATUS: IMPLEMENTED / RAILWAY VERIFIED / BROWSER QA PENDING**

Canonical journey:

**Original → AI Summary → Discussion → Community → Agent → Ask → Related Content → Live → World**

Mission:
- turn Content into a Universe node;
- expose relationships instead of generic article UI.

## WEB-15 — Ask the Content
**STATUS: IMPLEMENTED / RAILWAY VERIFIED / BROWSER QA PENDING**

Mission:
- deepen existing Ask Content;
- content-grounded AI;
- existing AI Gateway;
- optional permission-scoped RAG;
- visible grounding;
- follow-up conversation;
- no new Q&A engine.

## WEB-16 — Create Experience
**STATUS: SOURCE IMPLEMENTED / V2 VISUAL REVALIDATION REQUIRED / BROWSER QA PENDING**

Mission:
Create is a single hub for existing canonical builders:
- Agent
- Content
- Live
- World
- Theme
- Booth
- Community
- Workflow/Mission

Important:
WEB-16 source exists, but its final spatial/3D visual realization must be revalidated after the 3D-V2 asset track.

## WEB-17 — My Agent
**STATUS: PENDING**

Mission:
- personal Agent control and experience;
- identity/context;
- Agent memory/knowledge;
- capabilities;
- activity;
- conversations;
- missions/workflows;
- Live;
- controls.

## WEB-18 — Agent Live Monitor
**STATUS: PENDING**

Mission:
- monitor live Agent execution/presence;
- Character state;
- Voice;
- Animation;
- realtime;
- execution observability;
- existing runtime only.

## WEB-19 — Marketplace
**STATUS: PENDING**

Mission:
- spatial marketplace;
- Booth listings;
- products/services;
- Agent-mediated discovery;
- commerce remains authoritative in existing Commerce engine.

## WEB-20 — Communities
**STATUS: PENDING**

Mission:
- Community as spatial/social relationship layer;
- Content ↔ Community ↔ Agent ↔ World;
- existing community contracts.

## WEB-21 — Messages & Collaboration
**STATUS: PENDING**

Mission:
- Human ↔ Human;
- Human ↔ Agent;
- Agent ↔ Agent;
- collaboration;
- negotiation;
- contextual Universe relationships;
- existing Messaging/Conversation runtime.

## WEB-22 — Theme Builder
**STATUS: PENDING**

Mission:
- Theme creation/editing;
- semantic visual system;
- World/District/Booth/Character/Content/Live/Portal theme bindings;
- must feed the canonical Theme lifecycle.

## WEB-23 — Human Control Center
**STATUS: PENDING**

Mission:
- identity;
- privacy;
- Agents;
- permissions;
- approvals;
- memory;
- notifications;
- security;
- billing/entitlements where applicable.

## WEB-24 — Universe Map
**STATUS: PENDING**

Mission:
- authoritative Universe spatial/navigation map;
- Galaxy → World → District → Zone → Booth relationships;
- 2D/2.5D/3D progressive presentation.

## WEB-25 — 82-Domain Experience Map
**STATUS: PENDING**

Mission:
- expose the full Allpha domain universe without creating 82 unrelated menus/engines.
- 82 domains are an experience map / capability map, not 82 navigation silos.

The exact canonical 82-domain taxonomy MUST be read from the latest repository/PRD artifacts before implementation. Do not invent missing domain names.

## WEB-26 — Responsive Engineering
**STATUS: PENDING**

Mission:
- phone/tablet/desktop;
- spatial UI scaling;
- touch;
- safe-area;
- keyboard;
- WebGL fallback.

## WEB-27 — Performance
**STATUS: PENDING**

Mission:
- mobile 3D budgets;
- lazy loading;
- asset streaming;
- LOD;
- low-power mode;
- render budgets;
- memory discipline.

## WEB-28 — Accessibility
**STATUS: PENDING**

Mission:
- reduced motion;
- keyboard;
- screen-reader labels;
- focus;
- color-independent state;
- touch targets.

## WEB-29 — PWA Install QA
**STATUS: PENDING**

Mission:
- install;
- update;
- offline;
- iOS/Android behavior;
- icons;
- manifest;
- service worker.

## WEB-30 — E2E Journeys
**STATUS: PENDING**

Mission:
Validate critical journeys:
- public entry → identity → Universe
- Universe → Galaxy → World
- World → District → Booth
- Booth → Agent
- Moments → Content → Ask
- Content → Community/Agent/Live/World
- Create → existing builders
- Message → Agent
- Live → Character.

## WEB-31 — Security / Authority QA
**STATUS: PENDING**

Mission:
- authority boundary validation;
- permission;
- policy;
- risk;
- approval;
- server-side enforcement;
- no frontend trust.

## WEB-32 — Visual QA
**STATUS: PENDING**

Mission:
- compare against supplied reference images;
- mobile visual fidelity;
- 3D visual fidelity;
- spacing;
- hierarchy;
- animation;
- depth.

## WEB-33 — Runtime Validation
**STATUS: PENDING**

Mission:
- actual production/runtime state;
- APIs;
- Supabase;
- realtime;
- assets;
- signed URLs;
- model/AI paths;
- 3D rendering.

## WEB-34 — CW-02 Closure Evidence
**STATUS: PENDING**

Mission:
- aggregate implementation;
- deployment;
- security;
- runtime;
- E2E;
- visual QA evidence;
- close CW-02 only when evidence is real.

---

# 6. 3D-V2 MASTER PHASES

The project is CURRENTLY at:

# **3D-V2.09 — THEME V2 VISUAL REALIZATION / 25 THEMES × 14 CATEGORIES × 350 3D TEMPLATES**

Status:
**IMPLEMENTED / SPATIAL HIERARCHY V2 FOUNDATION / RUNTIME VISUAL QA PENDING**

## 3D-V2.01 — Art Direction & Master Visual Language
**IMPLEMENTED / FOUNDATION LOCKED / RUNTIME VISUAL QA PENDING**

Mission:
Lock one coherent Allpha 3D visual language.

Includes:
- cinematic cosmic depth
- luminous glass/holographic
- orbital/constellation
- recognizable spatial silhouettes
- full-body AI Characters
- Content Capsules
- Live Stage
- Portals
- animation vocabulary
- mobile-first depth/performance.

## 3D-V2.02 — Reference Theme / Golden Scene
**IMPLEMENTED / CANONICAL RENDERER INTEGRATED / RUNTIME VISUAL QA PENDING**

Golden Theme:
**Crystal AI City**

Mission:
Create the visual reference scene for Universe/Galaxy/Orbit while retaining presentation-only boundaries.

## 3D-V2.03 — Geometry & Material Asset Factory
**IMPLEMENTED / FACTORY FOUNDATION / RUNTIME VISUAL QA PENDING**

Mission:
Create deterministic recipes for:

**25 Themes × 14 Categories = 350 baseline templates/recipes**

Canonical categories:
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

Important:
The factory does NOT mean 350 final production GLBs already exist.

## 3D-V2.04 — Character / Live Character V2
**IMPLEMENTED / CHARACTER V2 FOUNDATION / RUNTIME VISUAL QA PENDING**

Mission:
- theme-aware AI Character;
- silhouette;
- wardrobe;
- face;
- gaze;
- viseme capability;
- speaking/listening/thinking/greeting/etc.;
- reduced motion;
- mobile performance.

Canonical animation boundary:
**CharacterAnimationSignal**

Canonical asset authority:
existing Live Character Runtime catalog.

## 3D-V2.05 — Universe / Galaxy / Orbit V2
**IMPLEMENTED / SPATIAL COMPOSITION V2 FOUNDATION / RUNTIME VISUAL QA PENDING**

Mission:
- Universe gravitational identity;
- Galaxy clustering;
- World depth;
- Orbit layers;
- near/far rings;
- foreground/midground/background;
- mobile particle budgets;
- spatial camera framing.

## 3D-V2.06 — World / District / Booth V2
**CURRENT PHASE — IMPLEMENTATION COMPLETE / RAILWAY BUILD VERIFICATION IN PROGRESS / RUNTIME VISUAL QA PENDING**

Mission:
Transform spatial presentation into:

**World → District → Booth**

World:
- central identity;
- District anchors;
- landmark/environment depth.

District:
- District identity;
- Booth cluster;
- paths;
- zones;
- spatial objects.

Booth:
- tenant identity;
- portal;
- Content Capsule anchors;
- Agent/Host relationship;
- existing Booth assets.

Canonical file:
`apps/web/lib/world-engine/world-district-booth-v2.ts`

Canonical renderer:
`apps/web/components/world/allpha-world-renderer.tsx`

## 3D-V2.07 — Capsule / Content / Feed Universe V2
**NEXT**

Mission:
Turn Content into a genuine spatial object.

Target:

**Content → Capsule → Gravity → Orbit → World → Agent → Community → Ask → Live**

Must include:
- spatial Content Capsule;
- Content/Feed Universe nodes;
- Galaxy Content relationships;
- gravity;
- topic/relationship signals;
- AI Summary visual treatment;
- Ask entry;
- Agent relationship;
- World relationship;
- Community relationship;
- Live relationship;
- Content media;
- no fabricated content.

## 3D-V2.08 — Live / Human Live / Stage V2
**PENDING**

Mission:
Create the spatial Live experience.

Must cover:
- Live Theme Template;
- Stage;
- Human Live;
- Uniform;
- AI Character;
- Voice;
- animation;
- audience/presence;
- realtime/WebRTC presentation;
- transition from Content/World/Agent into Live.

Use existing:
- Live Runtime;
- Character Runtime;
- WebRTC/realtime contracts;
- CharacterAnimationSignal.

Do NOT create a second Live engine.

## 3D-V2.10R — REAL 3D ASSET GENERATION & REALIZATION
**IMPLEMENTED / RUNTIME VISUAL QA PENDING**

Mission:
Replace the legacy flat/blockout GLB source with a genuine theme-aware 3D realization layer before binary asset activation.

Implemented:
- canonical renderer continues through AllphaWorldRenderer;
- `apps/web/components/world/theme-v2-real-3d-asset.tsx` provides real Three.js geometry realization;
- all 25 canonical themes have distinct geometry motifs;
- all 14 canonical categories are realized;
- 25 × 14 = 350 deterministic theme/category combinations;
- public Universe hero no longer uses the legacy GLB pack as its primary visual source;
- reduced motion and low-power paths are preserved;
- legacy ThemeV2SpatialScene remains only as a compatibility wrapper.

Boundary:
This phase implements Generate + Realize. It does not claim 350 binary GLBs have been stored in Supabase. Binary export, validation, moderation, storage, manifest activation and runtime QA remain required before final V2 cutover.

Acceptance:
No flat wireframe globe, no color-only theme variation, real depth, theme-specific geometry, spatial hierarchy and mobile-safe composition.

## 3D-V2.09 — Portal / Navigation / Spatial FX V2
**PENDING**

Mission:
Create spatial transitions:
- Universe portal;
- Galaxy portal;
- World portal;
- District portal;
- Booth portal;
- Content portal;
- Live portal;
- Agent transition.

Include:
- portal geometry;
- glow;
- transition animation;
- destination preview;
- navigation FX;
- reduced-motion fallback.

Navigation/FX must remain presentation-only; authorization stays server-side.

## 3D-V2.10 — 25 Theme Expansion / 350 Template Matrix
**PENDING**

Mission:
Expand the V2 art direction across all 25 existing themes.

25 canonical themes:
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

Each theme must influence:
- geometry language;
- materials;
- lighting;
- atmosphere;
- color tokens;
- landmark silhouettes;
- District architecture;
- Booth treatment;
- Portal;
- Capsule;
- Character wardrobe;
- Live Stage;
- particles/FX.

The 350 matrix is the **current Theme V2 realization target**, not a future optional expansion. The 350 matrix is:

**25 themes × 14 categories**

Do not silently add a 15th category without reconciling the master specification.

## 3D-V2.11 — Manifest / Renderer Activation
**PENDING**

Mission:
Move from recipes/factory to real runtime asset activation.

Lifecycle:

**Design → Generate → Validate → Moderate → Store → Manifest → Signed URL → AllphaWorldRenderer → Runtime QA**

Rules:
- authoritative signed URLs;
- server-side asset activation;
- no frontend asset authority;
- V1 rollback retained until V2 green.

## 3D-V2.12 — Mobile Performance + Accessibility
**PENDING**

Mission:
Make 3D usable on real mobile devices.

Must cover:
- LOD;
- lazy asset loading;
- geometry budgets;
- texture budgets;
- transparency budgets;
- draw calls;
- low-power mode;
- reduced motion;
- 44px touch targets;
- safe areas;
- 2D fallback.

## 3D-V2.13 — Visual QA / Runtime Validation
**PENDING**

Mission:
Validate actual visual output against the supplied reference images.

Must test:
- Splash
- Public Universe
- Identity
- Universe
- Galaxy
- World
- District
- Booth
- Agent
- Content/Moments
- Capsule
- Live
- Portal
- Character
- Animation.

Important:
Source/build success is NOT visual QA.

## 3D-V2.14 — V1 → V2 Canonical Cutover
**PENDING**

Mission:
Switch the canonical asset manifest from V1 to V2 only after:
- runtime validation;
- performance;
- accessibility;
- visual QA;
- security/authority checks.

V1 remains rollback/archive until V2 is proven.

## WEB-16 V2 Revalidation
**PENDING AFTER 3D-V2 TRACK**

WEB-16 source already exists, but Create Experience must be visually revalidated against the finished V2 asset system.

---

# 7. REQUIRED NEW / EXPANDED EXPERIENCE DOMAINS

The following are part of the current Allpha product direction and MUST be reconciled with the latest Master PRD/repository artifacts before implementation.

## Spatial Universe
- Universe
- Galaxy
- World
- District
- Zone
- Booth
- Portal
- Spatial Navigation
- Spatial Map

## Discovery / Content
- Universe Stream
- Moments Galaxy
- Content Gravity
- Content Capsule
- Content Evolution
- Related Content
- Topics
- Media
- Community relationship
- Agent relationship
- World relationship
- Live relationship
- Ask the Content

## AI Agent
- Agent Passport
- Agent Character
- Agent Space
- Agent Presence
- Agent Skills
- Agent Memory
- Agent Knowledge
- Agent Context
- Agent Conversation
- Agent Collaboration
- Agent Negotiation
- Agent Generate
- Agent Ask
- Agent Live
- Agent animation
- Agent voice

## AI in Messages and Content
The future/full experience must support, through existing canonical AI infrastructure:
- AI Agent Generate from Message context
- AI Agent Ask from Message context
- AI Agent Generate from Content context
- AI Agent Ask from Content context
- grounded Content Ask
- Agent-context Ask
- conversation follow-up
- AI Summary
- related-content reasoning
- Agent/Community/World/Live contextual handoff

These are NOT permission to create separate Q&A/AI engines.

## AI Credits / AI Content
The product direction includes an AI credit/token economy for AI-powered creation/interaction.

Any implementation must first inspect the current canonical billing/credit/token/entitlement contracts.

Never invent a wallet, credit balance or transaction source in frontend.

Potential experience domains:
- AI Credits
- AI usage
- AI generation
- AI Agent generation
- AI Content generation
- AI Live usage
- entitlement
- usage limits
- billing/payment relationship.

## Live Experience
- Live Theme Template
- Live Stage
- Human Live
- Human Live Uniform
- AI Character Live
- Voice
- GPT-Live / realtime model integration where supported by the existing architecture
- WebRTC/realtime
- audience presence
- speaking/listening animation
- lip/viseme capability
- facial state
- gaze
- emotion state
- Live transition from Content/Agent/World.

Any GPT-Live/model integration MUST use the existing AI Gateway/model routing and existing Live Runtime boundary.

## Character / Animation
- AI Character
- Human Live Character
- theme wardrobe
- face
- gaze
- viseme
- idle
- listening
- thinking
- speaking
- emphasis
- greeting
- acknowledge
- farewell
- reduced-motion state
- animation contracts
- CharacterAnimationSignal
- theme-specific animation language.

## Social / Spatial Content
- Sticker / Social 3D
- Content/Feed Universe
- Content Galaxy
- social 3D elements
- reactions
- spatial relationship signals
- community interaction.

## 3D Asset Categories
The canonical baseline is:
- Universe
- Galaxy
- World
- Orbit
- Capsule
- District
- Booth
- Content / Feed Universe
- AI Agent Character
- Live Stage
- Human Live / Uniform
- Sticker / Social 3D
- Animation
- Navigation / Spatial FX

---

# 8. MASTER PRD EXPANSION RULE

The user has requested that the Master PRD continuously include new product capabilities.

However:

**Do not fabricate that a capability is already implemented merely because it appears in this handoff.**

Every future capability must have one of these states:

- IMPLEMENTED
- PARTIAL
- FOUNDATION
- CONTRACT ONLY
- PLANNED
- BLOCKED
- VALIDATION PENDING
- VISUAL QA PENDING
- RUNTIME QA PENDING

When a new domain/feature is introduced:
1. identify the canonical existing engine;
2. define its UX role;
3. define API/data dependencies;
4. define authority boundary;
5. define spatial/3D presentation requirement;
6. define mobile/accessibility behavior;
7. implement;
8. test;
9. update audit;
10. update phase plan;
11. update this continue context.

---

# 9. CURRENT ARTIFACTS THAT MUST BE STUDIED FIRST

Before implementing the next phase, read these repository documents:

## Master architecture
- `docs/architecture/ALLPHA_WEB_UI_UX_ARCHITECTURE_V2.md`
- `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
- `docs/architecture/ALLPHA_3D_THEME_SYSTEM_V2_MASTER.md`
- `docs/architecture/ALLPHA_3D_V2_01_ART_DIRECTION_MASTER.md`

## Master continuation
- `docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md`
- THIS FILE:
  `docs/continue-context/ALLPHA_MASTER_CONTINUE_CONTEXT_20261005.md`

## 3D implementation records
- `docs/audits/3D_V2_01_ART_DIRECTION_20261005.md`
- `docs/audits/3D_V2_02_UNIVERSE_GALAXY_ORBIT_20261005.md` if present
- `docs/audits/3D_V2_03_GEOMETRY_MATERIAL_FACTORY_20261005.md`
- `docs/audits/3D_V2_04_CHARACTER_LIVE_V2_20261005.md`
- `docs/audits/3D_V2_05_UNIVERSE_GALAXY_ORBIT_20261005.md`
- `docs/audits/3D_V2_06_WORLD_DISTRICT_BOOTH_20261005.md`

## Web UI/UX implementation audits
Read all existing:
- `docs/audits/WEB05_*.md`
- `docs/audits/WEB06_*.md`
- `docs/audits/WEB07_*.md`
- `docs/audits/WEB08_*.md`
- `docs/audits/WEB09_*.md`
- `docs/audits/WEB10_*.md`
- `docs/audits/WEB11_*.md`
- `docs/audits/WEB12_*.md`
- `docs/audits/WEB13_*.md`
- `docs/audits/WEB14_*.md`
- `docs/audits/WEB15_*.md`
- `docs/audits/PUBLIC_ENTRY_UI_UX_REFACTOR_20261005.md`

## Reference / visual system
- `docs/ux/references/README.md`
- existing reference files under `docs/ux/references/`
- current design tokens
- current 3D visual language.

---

# 10. CURRENT SOURCE ARTIFACTS THAT MUST BE INSPECTED

For 3D work:

- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/lib/world-engine/scene-schema.ts`
- `apps/web/lib/world-engine/golden-scene.ts`
- `apps/web/lib/world-engine/spatial-composition-v2.ts`
- `apps/web/lib/world-engine/world-district-booth-v2.ts`
- `apps/web/lib/world-engine/asset-factory.ts`
- `apps/web/lib/live-character-v2.ts`
- `packages/design-tokens/3d-visual-language.ts`
- `packages/design-tokens/tokens.css`

For Web UI:

- Universe Shell
- Universe Home
- Galaxy Navigator
- World Experience
- District Experience
- Booth Experience
- Agent Experience
- Universe Moments
- Content Capsule
- Ask Content
- Create Experience
- public entry / identity.

For backend:
- discovery
- content evolution
- Ask Content
- Universe/World/Galaxy APIs
- District APIs
- Booth APIs
- Spatial Runtime
- Agent catalog
- Live Runtime
- Messaging
- Theme/World runtime
- asset manifest/storage/signed URL lifecycle.

---

# 11. 3D REFERENCE / VISUAL REBUILD RULE

The supplied visual references are the UX direction.

The current visual goal is NOT:
- generic SaaS dashboard;
- generic social media feed;
- flat card grid;
- the current Railway flat globe as a final Universe;
- primitive character as final AI Character;
- flat orbit borders;
- placeholder GLB appearance.

The target is:
- cinematic;
- spatial;
- layered;
- recognizable;
- premium;
- mobile-first;
- animated;
- coherent across Universe → Galaxy → World → District → Booth;
- AI-native;
- relationship-driven.

The 3D assets must visibly communicate their role.

Examples:
- Universe must read as a Universe.
- Galaxy must read as a Galaxy.
- World must read as an actual place.
- District must read as an environment/subdivision.
- Booth must read as a tenant/space.
- Agent must read as a Character.
- Content must read as a spatial Capsule.
- Live must read as a Stage.
- Portal must read as a transition.
- Sticker must read as a social 3D element.

---

# 12. AI IMAGE / 3D GENERATION RULE

AI image generation can be used for:
- visual concepts;
- moodboards;
- reference sheets;
- art direction;
- character concept;
- environment concept.

A generated image is NOT automatically a production GLB.

Production lifecycle remains:

**Concept → 3D geometry/material generation → GLB/GLTF → validation → moderation → storage → manifest → signed URL → AllphaWorldRenderer → runtime QA**

If a future tool/agent can operate Blender or an equivalent 3D pipeline, it may be used to generate/export production assets, but the output must still pass the canonical asset lifecycle.

---

# 13. AGENT CODE IMPLEMENTATION RULES

Every AI Coding Agent working on Allpha Universe MUST follow this sequence:

## BEFORE IMPLEMENTATION

1. Read this document.
2. Read the relevant phase plan.
3. Read the architecture document.
4. Read the relevant audit.
5. Inspect actual source files.
6. Inspect existing API/data contracts.
7. Search for existing engine/service before creating anything.
8. Identify the canonical integration point.
9. Identify authority boundaries.
10. Identify mobile/fallback behavior.

## DURING IMPLEMENTATION

- Reuse canonical components.
- Reuse canonical APIs.
- Reuse canonical runtime.
- Reuse canonical renderer.
- Reuse canonical theme contracts.
- Reuse canonical animation signals.
- Do not create fake data.
- Do not create fake signed URLs.
- Do not create frontend authority.
- Do not create duplicate engines.
- Do not silently change architecture.

## AFTER IMPLEMENTATION — MANDATORY

The agent MUST update the repository documentation.

At minimum update the relevant:
1. `docs/audits/<PHASE>_<DATE>.md`
2. `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
3. relevant architecture document;
4. `docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md`
5. this Master Continue Context when the phase changes or new major domain/feature is added.

The audit MUST contain:
- date;
- phase;
- status;
- files changed;
- APIs/contracts changed;
- architecture boundary;
- tests/build result;
- deployment result;
- known limitations;
- browser/device QA status;
- next phase.

Never finish an implementation without updating the audit/continue documentation.

---

# 14. REPORT FORMAT REQUIRED FROM EVERY AI CODING AGENT

At completion, report:

## Phase
`<phase>`

## Status
One of:
- IMPLEMENTED
- FOUNDATION
- PARTIAL
- BLOCKED
- VALIDATION PENDING
- RUNTIME QA PENDING
- VISUAL QA PENDING

## Implemented
List concrete files/features.

## Existing Systems Reused
List canonical engines/contracts reused.

## New Architecture
If none:
**No new engine/renderer/authority layer introduced.**

If anything new was introduced, explain why and reconcile the architecture documents.

## Data/API
List endpoints/contracts touched.

## Security/Authority
Explain how authority remains server-side.

## Build/Test
Give exact command/result.

## Railway
Give:
- deployment ID
- commit SHA
- status
- service
- region

Do not say GREEN unless evidence supports it.

## Browser Visual QA
State:
- PASS
- FAIL
- PENDING / NOT AVAILABLE

Never infer browser QA from build success.

## Known Limitations
Explicit list.

## Documentation Updated
List every audit/architecture/continue-context file updated.

## Next Phase
State exact next phase and why.

---

# 15. CURRENT NEXT IMPLEMENTATION ORDER

At the time of this handoff:

### CURRENT
**3D-V2.09 — Theme V2 Visual Realization / 25 Themes × 14 Categories × 350 3D Templates**

Implementation now includes:
- reusable Theme V2 spatial visual scene;
- Universe / Galaxy / World / District / Booth / Content / Live compositions;
- orbit, depth, animation, atmosphere and spatial links;
- canonical 25-theme design-token integration;
- executable **25 × 14 = 350 visual template contract**;
- public landing/splash/identity migration away from the flat CSS globe/core;
- canonical AllphaWorldRenderer integration.

Status:
**IMPLEMENTED VISUAL FOUNDATION / RAILWAY VERIFICATION + RUNTIME VISUAL QA PENDING**

The supplied Allpha reference boards remain the acceptance target. The old flat Railway appearance is not the V2 target.

### NEXT
**3D-V2.10 — Portal / Navigation / Spatial FX V2**

This phase starts only after Theme V2 build/runtime visual validation is accepted.

Then:
1. 3D-V2.10 — Portal / Navigation / Spatial FX V2
2. 3D-V2.11 — Manifest / Renderer Activation
3. 3D-V2.12 — Mobile Performance + Accessibility
4. 3D-V2.13 — Visual QA / Runtime Validation
5. 3D-V2.14 — V1 → V2 Canonical Cutover
6. WEB-16 V2 visual revalidation
7. Continue WEB-17 → WEB-34.

**Theme V2 is not complete when only asset recipes exist. The running product must visibly demonstrate real 3D Universe/Galaxy/World/District composition, depth, orbit, animation, atmosphere, spatial navigation and reference-aligned mobile UI/UX.**

Audit:
`docs/audits/3D_V2_09_THEME_V2_350_VISUAL_REALIZATION_20261005.md`


---

# 16. IMPORTANT STATUS INTERPRETATION

### IMPLEMENTED
Source implementation exists.

### BUILD/DEPLOYMENT VERIFIED
Build/deployment evidence exists.

### FOUNDATION
The architectural or technical foundation exists, but production completeness is not claimed.

### PARTIAL
Some required behavior exists but the full phase scope is incomplete.

### VISUAL QA PENDING
A source/build success does not prove visual fidelity.

### RUNTIME QA PENDING
The actual connected production runtime still needs validation.

### PRODUCTION GREEN
Only claim when the relevant evidence actually exists.

---

# 17. MASTER VISION

Allpha Universe should eventually feel like:

**A living AI-native Universe where Humans, AI Agents, Content, Communities, Worlds, Businesses and Live Experiences exist as connected spatial entities.**

The user should be able to move naturally:

**Enter Universe**
→ **Explore Galaxy**
→ **Enter World**
→ **Visit District**
→ **Enter Booth**
→ **Meet AI Agent**
→ **See Content**
→ **Ask Content**
→ **Discuss with Community**
→ **Open Live**
→ **Interact with AI Character**
→ **Generate / Create**
→ **Return to Universe**

The 3D system is not decoration.

It is the visual language that makes those relationships understandable.

The AI system is not a chatbot bolted onto pages.

It is the intelligence layer connecting:
- Agent
- Content
- World
- Community
- Live
- Messages
- Creation.

The Web UI is not a collection of independent pages.

It is one continuous **Universe Experience**.

---

# 18. FINAL COMMAND TO THE NEXT AI AGENT

**DO NOT START CODING IMMEDIATELY.**

First:

**READ → UNDERSTAND → INSPECT → RECONCILE → PLAN → IMPLEMENT → TEST → SECURITY CHECK → DEPLOY → DOCUMENT → REPORT**

Begin by reading the repository documents listed in this file.

Then verify the actual state of:
- WEB phases;
- 3D-V2 phases;
- current renderer;
- Theme/World asset lifecycle;
- Content/Feed/Ask;
- Agent/Live/Character;
- Message/AI contracts;
- Supabase/API authority.

After reconciliation, continue from:

# **3D-V2.07 — Capsule / Content / Feed Universe V2**

Do not recreate anything that already exists.
Do not replace canonical engines.
Do not fabricate data.
Do not claim validation that was not performed.
Do not leave implementation undocumented.

**The repository and its latest audit/continue-context records are the operational source of truth.**
