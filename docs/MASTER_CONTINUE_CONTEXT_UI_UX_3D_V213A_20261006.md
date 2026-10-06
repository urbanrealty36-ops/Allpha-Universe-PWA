# ALLPHA UNIVERSE — MASTER CONTINUE CONTEXT
## UI/UX REFACTOR + 3D THEME V2 / V2.13A GOLDEN PRODUCTION
### Canonical continuation handoff — 2026-10-06

> **Purpose:** Master handoff for a new AI Agent Code conversation. Read this file first, then reconcile it with `main`, live Supabase and Railway. Do not guess project state.

---

## 0. START COMMAND FOR THE NEW CHAT

> **CONTINUE ALLPHA UNIVERSE FROM CANONICAL REPOSITORY STATE.**
>
> Repository: `urbanrealty36-ops/Allpha-Universe-PWA`, branch `main`. Supabase: `AllphaDb-Universe` / `qltbacemtvnuzqkterly`.
>
> Before implementation:
> 1. Read `AGENTS.md`.
> 2. Read this file.
> 3. Read `docs/MASTER_CONTINUATION_CONTEXT.md`.
> 4. Read `docs/IMPLEMENTATION_PHASES.md`.
> 5. Read the Master PRD under `docs/PRD/`.
> 6. Read the 3D audit chain and WEB/UI audit chain listed below.
> 7. Inspect current `apps/web`, `apps/api`, migrations, tests and workflows.
> 8. Inspect live Supabase schema/data/storage and Railway runtime.
> 9. Reconcile actual state before mutation.
>
> **Do not restart completed phases. Do not create duplicate engines, renderers, wallets, payment systems, Memory/RAG, AI Gateway, Agent Runtime, Messaging, Feed/Content or Live engines.**
>
> **Current strategic work: Full UI/UX Refactor + realistic 3D Theme V2 reconstruction. Current 3D gate: 3D-V2.13A — Golden Production Theme: Crystal AI City.**
>
> Immediate gate:
> **Blender production render → 14-category visual evidence → visual QA against supplied UI/UX reference → refinement if still flat → browser/runtime QA → mobile QA → only then V2.13A GREEN.**
>
> Do not call V2.13A GREEN merely because Blender exports GLBs or browser loads them.

---

# 1. CANONICAL BINDING

- GitHub: `urbanrealty36-ops/Allpha-Universe-PWA`
- Branch: `main`
- Supabase: AllphaDb-Universe / `qltbacemtvnuzqkterly`
- Supabase region: `ap-south-1`
- Railway Web: `allphaweb-production.up.railway.app`
- Railway API: `allpha-api-production.up.railway.app`
- Web: `apps/web`
- Admin: `apps/admin`
- API: `apps/api`
- Canonical renderer: **`AllphaWorldRenderer`**

Stack:
Next.js / React / TypeScript / Tailwind / PWA; FastAPI / Python / Pydantic; Supabase PostgreSQL / pgvector / Auth / Storage / Realtime; AI Gateway + Model Router; Three.js / React Three Fiber / WebGL.

---

# 2. NON-NEGOTIABLE RULES

1. READ → UNDERSTAND → INSPECT REPO → INSPECT SUPABASE → RECONCILE → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT.
2. Never guess phase status.
3. No fake/mock/dummy/scenario/placeholder business data.
4. No fake API responses.
5. No SQLite.
6. No privileged frontend DB access.
7. No service-role/provider secrets in browser.
8. FastAPI is the privileged application boundary.
9. Supabase RLS + backend authorization are authoritative.
10. Server-side ownership verification is mandatory.
11. Theme/3D/presentation can never grant authority, permission, capability, entitlement, approval, risk clearance, billing authority or execution.
12. No second renderer.
13. No second Message/Ask/Generate engine.
14. No second Memory/RAG engine.
15. No second Agent Runtime.
16. No second AI Gateway.
17. No second Feed/Content engine.
18. No second Live/AI Live engine.
19. No second wallet/credit ledger.
20. No second payment gateway.
21. Never fabricate Storage URLs/assets/payment/payout data.
22. Code existence is not completion.
23. GREEN requires evidence across relevant PRD + DB + API + auth + security + engine/workflow + UI/UX + telemetry + tests + integration + runtime.
24. Final E2E/CI/CD/runtime/staging/production gates remain separate.
25. Update the continuation/report docs after every verified increment.
26. Every completed phase/subphase must state the next exact phase.

---

# 3. REQUIRED DOCUMENTS TO STUDY

## Tier A — mandatory
- `AGENTS.md`
- `docs/MASTER_CONTINUE_CONTEXT_UI_UX_3D_V213A_20261006.md`
- `docs/MASTER_CONTINUATION_CONTEXT.md`
- `docs/IMPLEMENTATION_PHASES.md`
- Master PRD under `docs/PRD/`
- `docs/UI_UX_SURFACE_INVENTORY.md`

## Tier B — 3D
- `docs/audits/3D_V2_01_ART_DIRECTION_20261005.md`
- `docs/audits/3D_V2_02_UNIVERSE_GALAXY_ORBIT_20261005.md`
- `docs/audits/3D_V2_03_GEOMETRY_MATERIAL_FACTORY_20261005.md`
- `docs/audits/3D_V2_04_CHARACTER_LIVE_V2_20261005.md`
- `docs/audits/3D_V2_05_UNIVERSE_GALAXY_ORBIT_20261005.md`
- `docs/audits/3D_V2_06_WORLD_DISTRICT_BOOTH_20261005.md`
- `docs/audits/3D_V2_07_CAPSULE_CONTENT_FEED_UNIVERSE_20261005.md`
- `docs/audits/3D_V2_08_LIVE_HUMAN_AI_COLLABORATION_STAGE_20261005.md`
- `docs/audits/3D_V2_09_THEME_V2_350_VISUAL_REALIZATION_20261005.md`
- `docs/audits/3D_V2_09_A_PRODUCTION_3D_ART_ASSET_PIPELINE_20261005.md`
- `docs/audits/3D_V2_09_B_CINEMATIC_3D_RENDERING_LIGHTING_MATERIAL_REALISM_20261005.md`
- `docs/audits/3D_V2_09_C_ADVANCED_ENVIRONMENT_DETAIL_SHADERS_ATMOSPHERE_THEME_POLISH_20261005.md`
- `docs/audits/3D_V2_09_D_REAL_TIME_SPATIAL_MOTION_CAMERA_INTERACTION_20261005.md`
- `docs/audits/3D_V2_10_PORTAL_NAVIGATION_SPATIAL_FX_20261005.md`
- `docs/audits/3D_V2_11_PRODUCTION_3D_ASSET_ACTIVATION_RENDERER_CUTOVER_20261005.md`
- `docs/audits/3D_V2_12_FULL_THEME_V2_RUNTIME_VISUAL_QA_20261005.md`
- `docs/audits/3D_V2_13_PRODUCTION_REALISTIC_ART_RECONSTRUCTION_20261006.md`
- `docs/audits/3D_V2_REAL_3D_ASSET_GENERATION_REALIZATION_20261005.md`
- `docs/MASTER_CONTINUATION_CONTEXT_PHASE23_ENGINE_3D.md`

## Tier C — UI/UX
- `docs/audits/WEB01_BASELINE_FRONTEND_RECONCILIATION_20261005.md`
- `docs/audits/WEB02_DESIGN_SYSTEM_FOUNDATION_20261005.md`
- `docs/audits/WEB03_PWA_FOUNDATION_20261005.md`
- `docs/audits/WEB04_MOBILE_NAVIGATION_20261005.md`
- `docs/audits/WEB05_UNIVERSE_SHELL_20261005.md`
- `docs/audits/WEB06_SPLASH_IDENTITY_20261005.md`
- `docs/audits/WEB07_UNIVERSE_HOME_20261005.md`
- `docs/audits/WEB08_GALAXY_NAVIGATOR_20261005.md`
- `docs/audits/WEB09_WORLD_EXPERIENCE_20261005.md`
- `docs/audits/WEB10_DISTRICT_EXPERIENCE_20261005.md`
- `docs/audits/WEB11_BOOTH_TENANT_20261005.md`
- `docs/audits/WEB12_AGENT_EXPERIENCE_20261005.md`
- `docs/audits/WEB13_UNIVERSE_MOMENTS_20261005.md`
- `docs/audits/WEB14_CONTENT_CAPSULE_20261005.md`
- `docs/audits/WEB15_ASK_CONTENT_20261005.md`
- `docs/audits/WEB16_CREATE_EXPERIENCE_20261005.md`
- `docs/audits/WEB_IDENTITY_ONBOARDING_SPATIAL_20261005.md`

## Tier D — Completion Waves
- `docs/audits/CW01_FINAL_82_DOMAIN_EVIDENCE_LOCK_REGISTER_20261004.md`
- `docs/audits/CW02R_RUNTIME_REPAIR_ACTIVATION_STABILIZATION_20261004.md`
- `docs/audits/CW02_FRONTEND_THEME_WORLD_LIVE_RECONCILIATION_20261004.md`
- `docs/audits/CW02_REAL_AGENT_CONTENT_ACTIVATION_CHECKPOINT_20261004.md`
- `docs/audits/CW02_WEB_UNIVERSE_ENTRY_AUTHENTICATED_UX_20261004.md`

Also inspect the architecture/database/security documents referenced by the Master Continuation Context.

---

# 4. 3D THEME V2 — CANONICAL MODEL

## 4.1 Asset matrix

**25 Themes × 14 Categories = 350 Theme V2 assets.**

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

Runtime storage root:
`allpha-world-assets/theme-v2-real-3d/`

Public asset manifest is FastAPI-controlled. Signed URLs are generated server-side. Service-role never reaches the browser.

## 4.2 V2.12 result

V2.12 proved:
**Railway endpoint → 25 themes → V2 manifest → signed URL → real GLB → AllphaWorldRenderer → browser → mobile.**

Evidence included:
- 25 themes / 350 signed V2 assets
- signed URL fetch for all themes
- real GLB load through canonical renderer for every theme
- mobile real GLB renderer load

This is runtime evidence, not production-art fidelity.

## 4.3 Critical distinction

Do not confuse **GLB/runtime validity** with **realistic production art**.

The current work exists because the visual target is cinematic, mature and reference-driven, not procedural/flat.

---

# 5. BLENDER → GLB → RUNTIME PATTERN

Canonical pattern:

**UI/UX Reference**
→ Art Direction
→ Blender production scene
→ geometry modeling
→ bevel/edge quality
→ UV/material authoring
→ PBR materials/textures
→ cinematic lighting
→ atmosphere/depth
→ camera composition
→ character presence
→ animation
→ LOD/performance preparation
→ GLB/GLTF export
→ staged asset lifecycle
→ Supabase Storage
→ FastAPI manifest
→ signed URL
→ AllphaWorldRenderer
→ browser visual QA
→ mobile visual QA
→ activation

Blender is the production-art source of truth for mature assets. Three.js/R3F is the runtime renderer, not a replacement for production modeling.

### Realistic acceptance

Every production scene must show:
- real geometry, not primitive-only blockout
- foreground/midground/background
- architectural silhouette and verticality
- believable scale and occlusion
- PBR material identity
- reflections/specular response where appropriate
- controlled emissive detail
- cinematic key/fill/rim lighting
- atmospheric perspective/fog
- volumetric-style depth where appropriate
- AI/human character presence
- environmental context
- strong visual hierarchy
- mobile-aware composition
- LOD/performance readiness
- theme-specific identity
- no flat wireframe globe
- no 3D-background-only composition
- no theme differentiation by color alone

**Canonical renderer remains `AllphaWorldRenderer`. Never introduce another renderer.**

---

# 6. 3D-V2.13 / V2.13A CURRENT STATUS

## 3D-V2.13 — Production Realistic Art Reconstruction
Status: **IMPLEMENTED / GOLDEN ASSET GATE OPEN**

Purpose: close the visual-quality gap between V2.12 runtime validation and the supplied Allpha UI/UX reference.

## 3D-V2.13A — Golden Production Theme: Crystal AI City
Current work.

Golden scope:
- 1 theme: Crystal AI City
- 14 categories
- 14 GLBs
- 14 Blender render previews
- visual evidence
- browser runtime evidence
- mobile evidence

The scene must be the **focal point of the UI**, not decorative background.

Required character:
- cinematic sci-fi city
- believable architecture
- large-scale spatial environment
- layered depth
- atmosphere
- realistic materials
- cinematic lighting
- AI/human character presence
- orbital/spatial systems
- portal/navigation cues
- mobile-first framing

### V2.13A gate
**Blender render → inspect 14 previews → compare to reference → refine if flat → GLB validation → staged storage → signed URL → AllphaWorldRenderer browser QA → mobile QA → V2.13A GREEN.**

Do not activate all 350 assets until the golden visual standard is accepted.

---

# 7. UI/UX REFACTOR CURRENT STATE

Product identity:
**ALLPHA = Spatial Social Universe for Humans + AI Agents**

Spatial hierarchy:
**Universe → Galaxy → World → District → Booth → Agent → Content/Capsule → Live Experience**

## UI/UX-01 — Visual Foundation
Implemented:
- cosmic/deep-space visual language
- glass/holographic surfaces
- luminous borders
- cyan/blue/violet gradient
- typography hierarchy
- chips/buttons/avatar treatment
- responsive sections
- mobile safe-area behavior

## UI/UX-02 — Entry & Identity
Scope:
- Splash/Landing
- Explore/Introduction
- Sign Up/Human Identity

Source implementation exists:
- real 3D hero/focal scene
- ALLPHA branding
- Enter the Universe
- Create Identity / Sign In
- Human Identity gateway
- Google/email/wallet presentation
- terms/consent
- mobile-first layout

**Visual completion remains coupled to the realistic 3D focal-point gate.**

## Next UI/UX phases

### UI/UX-03 — Universe Navigation
Universe/Galaxy/World navigator, spatial hierarchy, portals, transitions, mobile navigation.

### UI/UX-04 — World / District
World, District, Zone, Booth composition and spatial entry.

### UI/UX-05 — Social Universe
Feed, Moments, Content Capsule, Communities, Messages, Collaboration.

### UI/UX-06 — AI Agent Experience
Agent identity, Passport, Character, Skills, Presence, Factory, Runtime.

### UI/UX-07 — Live Experience
Live Stage, AI Character, GPT-Live voice, Animation, WebRTC.

### UI/UX-08 — Commerce / Control
Marketplace, Economy, Credits, Billing, Theme/World Builder, Human Control.

---

# 8. COMPLETE PHASE ROADMAP + STATUS

Use live reconciliation for final status; this is the continuation map.

| Phase | Name | Current status / mission |
|---|---|---|
| 00 | Governance & Repository Foundation | IMPLEMENTED — canonical governance |
| 01 | Design System & UI Foundation | IMPLEMENTED FOUNDATION — being visually re-realized |
| 02 | Complete UI/UX Information Architecture | IMPLEMENTED FOUNDATION — web realization continues |
| 03 | API Contract Layer | IMPLEMENTED — FastAPI boundary |
| 04 | Supabase PostgreSQL Data Foundation | IMPLEMENTED |
| 05 | Identity, Authentication & Authorization | IMPLEMENTED |
| 06 | Human & AI Identity Foundation | IMPLEMENTED FOUNDATION |
| 07 | Agent Memory & Knowledge | IMPLEMENTED FOUNDATION |
| 08 | Interest/Passion/Habit/Goal/Personalization | WEB ACTIVATED / IMPLEMENTED; completion evidence continues |
| 09 | Social Graph & Relationship | WEB ACTIVATED / IMPLEMENTED; completion evidence continues |
| 10 | Content Platform | WEB ACTIVATED / IMPLEMENTED |
| 11 | Feed/Reels/Discovery | WEB ACTIVATED / IMPLEMENTED; gates remain |
| 11A | Discovery / Content Evolution / Agent Intelligence / Factory | IN PROGRESS / FOUNDATION |
| 12 | Community | IMPLEMENTED FOUNDATION; runtime E2E deferred |
| 13 | Messaging & Social Communication | IMPLEMENTED FOUNDATION; runtime completion continues |
| 14 | AI Gateway & Model Router | IMPLEMENTED |
| 14A | AI Provider Activation | IMPLEMENTED FOUNDATION |
| 15 | Agent Runtime & Command | IMPLEMENTED FOUNDATION |
| 16 | Workflow & Mission | IMPLEMENTED FOUNDATION / NOT GREEN |
| 17 | AI Universe | WEB/UI ACTIVATED / RUNTIME E2E PENDING |
| 17.1 | Living Universe 3D Experience | FOUNDATION / RUNTIME E2E PENDING |
| 18 | Agent Simulation & Spatial Runtime | IMPLEMENTED FOUNDATION / DB VERIFIED |
| 19 | Districts | IMPLEMENTED FOUNDATION / spatial activated |
| 20 | Booth/Tenant + 3D Asset Lifecycle | IMPLEMENTED FOUNDATION |
| 21 | Theme & World Builder | IMPLEMENTED FOUNDATION + lifecycle hardening |
| 21.5 | Platform Universe / 25 Theme Pack | IMPLEMENTED FOUNDATION; V2 runtime/art continuation |
| 21C–21E | Agent Skill / Challenge / Cross-Surface | FOUNDATION |
| 22 | Live Stories/Streaming/Experiences | FOUNDATION / runtime E2E pending |
| 22A | Live Session Core | FOUNDATION |
| 22B | Human Owner → Owned Agent Collaboration | FOUNDATION |
| 22C | Live Agent Runtime / AI Gateway | FOUNDATION |
| 22D | Realtime Live Conversation | FOUNDATION |
| 22F | Live Integration | FOUNDATION |
| 22G | Live 3D Stage / Human Presentation | FOUNDATION |
| 22H | Platform Uniforms + GPT-Live Character | FOUNDATION |
| 22I | AI Character Asset + Animation Contract | FOUNDATION / runtime E2E pending |
| 23 | AI-to-AI Collaboration | FOUNDATION / multi-user E2E pending |
| 23A | Discovery/Eligibility/Request | FOUNDATION |
| 23B | Agent DM/Negotiation | FOUNDATION |
| 23C | Human Approval/Agreement | FOUNDATION |
| 23D | Execution | FOUNDATION |
| 23E | Review/Reputation/History | FOUNDATION |
| 24 | Marketplace & Commerce | FOUNDATION / payment E2E pending |
| 25 | Economy/Credits/Billing/Midtrans | FOUNDATION / E2E config pending |
| 26 | Security/Governance/Trust + Payouts | FOUNDATION / real-money/security E2E pending |
| 27A | Super Admin Control Plane | FOUNDATION / NOT GREEN |
| 27B | Super Admin Analytics/Master Data | FOUNDATION / NOT GREEN |
| 27C | Domain Operations/Transactions/Master Data | **CURRENT CANONICAL DOMAIN — FOUNDATION / NOT GREEN** |
| 28 | Analytics/Observability | COMPLETION WAVE ACTIVE |
| 29 | API Integration/Local E2E | COMPLETION WAVE ACTIVE |
| 30 | Full Feature Activation | STRATEGIC TARGET / COMPLETION WAVE ACTIVE |
| 31 | E2E QA/Security Verification | PENDING FINAL GATE |
| 32 | CI/CD | PENDING FINAL GATE |
| 33 | Runtime Verification | PENDING FINAL GATE |
| 34 | Staging/Production Readiness | PENDING |
| 35 | Production Deployment/Final Green | PENDING |
| 36–38 | Reserved Product Expansion | RESERVED |

**Important:** The current strategic visual work is a cross-cutting completion stream layered over the canonical phase sequence. It does not erase Phase 27C.

---

# 9. COMPLETION WAVES

Completion Waves close evidence/activation gaps and do not restart earlier phases.

- **CW-01 — Evidence Lock & Domain Completion:** close evidence for all 82 domains.
- **CW-02 — Agent + Content Activation:** real Agent/Content lifecycle and authenticated Universe UX.
  - CW-02.R Runtime Repair & Activation Stabilization
  - CW-02.A Real Agent Runtime Activation
  - Web Universe Entry / Authenticated UX
  - Frontend Product UX Realization
  - Runtime Activation / E2E Reconciliation
- **CW-03 — Messaging / Agent Service / Skill Challenge:** canonical messaging + Agent Service + Skill Challenge.
- **CW-04 — World / Theme / 3D Activation:** Theme → World → District → Booth → real 3D activation.
- **CW-05 — Live / AI Character Runtime:** Character Asset → Animation → Presence → GPT-Live → Stage → WebRTC.
- **CW-06 — Commerce / Billing / Creator Economy:** Marketplace → Payment → Settlement → Credits → Billing → Creator Economy.
- **CW-07 — Observability / Evaluation / Security:** telemetry, evaluation and security/governance evidence.
- **CW-08 — E2E / CI / Staging / Production Green:** authenticated E2E, CI/CD, runtime, staging and final production gate.

---

# 10. 82 MASTER PRD DOMAINS

1 Human Identity
2 AI Agent Identity
3 Agent Persona
4 Agent Memory
5 Agent Skills
6 Agent Capability
7 Agent Passport
8 Interest Ontology
9 Interest Graph
10 Passion Graph
11 Habit Graph
12 Goal Graph
13 Context Graph
14 Social Graph
15 Relationship Graph
16 Community Graph
17 Content Graph
18 Knowledge Graph
19 Reputation Graph
20 Agent Discovery
21 Content Ingestion
22 Feed Engine
23 Reels Engine
24 Stories Engine
25 Live Engine
26 AI Live Engine
27 AI Capsule Engine
28 Recommendation Engine
29 Personalization Engine
30 Search / Explore Engine
31 Trend Engine
32 Social Interaction
33 Messaging / DM
34 Community Engine
35 Collaboration Engine
36 Mission Engine
37 Agent Catalog
38 Marketplace
39 Commerce Engine
40 Economy
41 Creator Economy
42 Event Engine
43 Agent World
44 Universe Engine
45 District Engine
46 Booth / Tenant Engine
47 Tenant Leasing & Billing
48 World / Scene Schema
49 Theme Engine
50 World Builder
51 Theme Marketplace
52 Agent Simulation Engine
53 Encounter Engine
54 Presence Engine
55 Realtime World Engine
56 World Stream
57 Notification Engine
58 Analytics
59 Policy Engine
60 Permission Engine
61 Risk Engine
62 Human Approval Engine
63 Audit Ledger
64 Trust & Safety
65 Moderation
66 Privacy
67 Security
68 Identity Verification
69 Anti-Impersonation
70 Anti-Fraud
71 Agent Interoperability
72 Agent API / Protocol
73 Subscription / Billing
74 Revenue Engine
75 Entitlement Engine
76 Feature Flag Engine
77 Configuration Engine
78 Super Admin Control Plane
79 Developer Platform
80 Observability
81 Evaluation Engine
82 E2E Test / QA Engine

---

# 11. NEW / EXPANDED FEATURES THAT MUST NOT BE LOST

## 3D / Spatial
- 25 Themes
- 25 World Templates
- 25 Live Experience Templates
- Universe / Galaxy / World / Orbit
- District / Zone / Booth anchors
- Portal / Gateway
- Navigation / Spatial FX
- Content / AI Capsule spatial presentation
- Feed / Universe / Galaxy presentation
- Live Stage Theme Templates
- Human Live / Uniform
- AI Character
- Sticker / Social 3D
- Animation Contract
- Character Asset Contract
- spatial navigation
- theme-specific scene identity
- 2D/2.5D/3D fallback
- mobile-aware quality tiers
- cinematic atmosphere/material realism
- Blender production-art pipeline
- GLB/GLTF production export
- signed asset manifest
- staged → validated → moderated → stored → manifest-ready → active lifecycle

## AI / Agent
- Agent Passport / Capability / Permission / Risk / Approval / Authority
- Agent Memory / Knowledge / RAG
- Agent Intelligence
- Agent Companion
- Agent Catalog
- Agent Factory
- Skill Catalog
- Skill Challenge
- Real Agent Activation
- Runtime Activation
- Human Owner Takeover
- Agent Service
- Skill Resolution

## Content / Feed / Ask / Generate
- Content Gravity
- Ask the Content
- Content Evolution:
  Original → AI Summary → Discussion → Related Content → Live Experience → World
- Agent Intelligence on Content
- AI Capsule
- Content/Feed Universe/Galaxy presentation
- AI Agent Generate/Ask from Message
- AI Agent Generate/Ask from Content
- AI Credit reservation where required
- Agent Owner reward
- Policy/Permission/Risk/Approval before privileged action

## Live / AI Character
- Live Session Core
- Human Owner → Owned Agent collaboration
- Live Agent Runtime
- Realtime Live Conversation
- Live 3D Stage
- Human Presentation
- Platform Uniforms
- GPT-Live
- Character Asset Contract
- Animation Contract
- body/face/gaze/lip/gesture states
- AI Character presence
- stage/participant/audience layout
- WebRTC / STUN / TURN
- human verification / participant authorization

## Economy / Commerce
- Marketplace
- Commerce Orders / Payments / Entitlements
- Economy
- AI Credits / Ledger
- Billing / Subscriptions / Invoices
- Midtrans
- Settlement
- Seller Payouts
- Creator Economy
- Revenue
- Feature Flags / Configuration

## Governance / Admin
- Super Admin Control Plane
- Transaction Explorer
- Domain Operations
- Master Data Management
- Master Data History
- Controlled Rollback
- Governance / Audit
- Security / Risk / Approval
- Analytics / KPI
- Observability
- Evaluation
- E2E / QA

---

# 12. UI/UX SURFACE INVENTORY

## User PWA
Universe, Social Feed, Reels, Explore, Following, For You, Live, Communities, Community Detail, Create, Messages, Notifications, Missions, Marketplace, My Agent, Agent World, Agent Mind, Agent Studio, Agent Network, Agent Knowledge, Agent Skills, Agent Catalog, Agent Collaboration, Agent Reputation, Agent Activity, Agent Passport, AI Capsule, Worlds, World Detail, Districts, District Detail, Booths, Booth Detail, Theme Builder, World Builder, Events, Profile, Settings, Billing, Security and Approvals.

## Super Admin
Overview, Users, Agents, Content, Communities, Universe, Galaxies, Worlds, Districts, Booths, Themes, Marketplace, Missions, Events, Plans, Features, Entitlements, Pricing, Revenue, Billing, Credits, AI Providers, Model Router, AI Policies, Agent Policies, Security, Risk, Moderation, Reports, Audit Logs, Feature Flags, System Settings, Localization, Notifications, Analytics, Observability, E2E/QA, Configuration Versions.

No fake records to populate a surface. Loading, empty, permission-denied, not-configured and backend-error states are legitimate.

---

# 13. IMMEDIATE EXECUTION ORDER

## Gate A — 3D-V2.13A
1. Inspect Crystal AI City Blender source/render outputs.
2. Verify 14 category GLBs.
3. Verify 14 render previews.
4. Compare to supplied reference.
5. Identify flat/procedural areas.
6. Refine Blender scene.
7. Re-export.
8. Validate geometry/material/performance.
9. Stage assets; do not overwrite V2.12 until QA.
10. Validate manifest/signed URLs.
11. Browser AllphaWorldRenderer QA.
12. Mobile QA.
13. Only then V2.13A GREEN.

## Gate B — UI/UX-02 final visual realization
Use Crystal AI City as the hero/focal scene for Splash, Explore and Human Identity.

## Gate C — UI/UX-03
Universe → Galaxy → World navigation.

## Gate D — UI/UX-04
World → District → Zone → Booth.

## Gate E — UI/UX-05
Social Universe / Feed / Content / Community / Messaging.

## Gate F — UI/UX-06
AI Agent Experience.

## Gate G — UI/UX-07
Live Experience / AI Character / GPT-Live / Animation / WebRTC.

## Gate H — UI/UX-08
Marketplace / Economy / Credits / Billing / Theme/World Builder / Control.

Then:
**CW-05 → CW-06 → CW-07 → CW-08 → Phase 30 Full Feature Activation → Phases 31–35 final gates.**

---

# 14. MANDATORY AI AGENT IMPLEMENTATION REPORTING

After every implementation increment, update:

1. `docs/MASTER_CONTINUE_CONTEXT_UI_UX_3D_V213A_20261006.md`
2. `docs/AI_AGENT_IMPLEMENTATION_REPORT.md`

Every report must contain:
- Date/time
- Agent/task
- Phase/subphase
- Objective
- Commit SHA
- Files changed
- Database migrations
- Supabase verification
- API changes
- UI/UX changes
- 3D/Blender changes
- Tests
- Browser/runtime QA
- Security checks
- Evidence/artifacts
- Status: MISSING / FOUNDATION / PARTIAL / IMPLEMENTED / IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING / GREEN
- Known gaps
- Next exact phase/subphase

Never write “done/complete/green” without evidence.

For 3D specifically report:
- Theme
- Category
- Asset path
- Blender source
- geometry/polygon quality
- material/texture state
- lighting state
- animation state
- LOD state
- render preview evidence
- GLB validation
- signed URL evidence
- browser renderer evidence
- mobile evidence
- visual fidelity verdict

---

# 15. DEFINITION OF DONE

General:
**PRD + DB + API + Authorization + Security + Engine + Workflow + UI/UX + Telemetry + Tests + Integration + Runtime Evidence**

3D:
**Art Direction + Blender Source + Realistic Render + GLB + Manifest + Signed URL + AllphaWorldRenderer + Browser QA + Mobile QA**

Live AI Character:
**Character Asset + Animation Contract + Agent Runtime + GPT-Live + Presence + Live Stage + WebRTC + Authorization**

---

# 16. FINAL DIRECTIVE

This is an existing production system, not a prototype.

Do not rebuild architecture. Do not create duplicate engines. Preserve canonical systems.

The product is being transformed into a mature:

> **ALLPHA — Spatial Social Universe for Humans + AI Agents**

The immediate priority is:

> **3D-V2.13A — Crystal AI City Golden Production Theme**

The objective is not “a GLB that loads”.

The objective is:

> **A believable, cinematic, realistic 3D world that becomes the focal point of the Allpha UI/UX reference.**

After V2.13A GREEN:
**UI/UX-02 final visual realization → UI/UX-03 Universe Navigation.**
