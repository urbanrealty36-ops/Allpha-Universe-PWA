# ALLPHA UNIVERSE — MASTER CONTINUE CONTEXT / NEW AI CODE AGENT PROMPT
## Canonical continuation handoff — 2026-10-08
## Full Web UI/UX Refactor + Theme V2 25×14=350 + Runtime Activation + Completion Waves

> COPY THIS DOCUMENT AS THE FIRST PROMPT IN A NEW ALLPHA UNIVERSE CHAT / AI CODING AGENT CONVERSATION.
> This is a continuation, not a restart. The agent MUST study the repository documents listed below before changing code, database, UI/UX, 3D assets, workflows, or production configuration.

---

# 0. EXECUTIVE DIRECTIVE

Continue the canonical **Allpha Universe** project. Do not restart architecture discovery, invent missing implementation, create a parallel architecture, duplicate an existing engine, fabricate business data, or claim GREEN without evidence.

Current strategic work:
1. Full Web App UI/UX refactor toward the Allpha Universe / Galaxy / World / District / Booth / Agent spatial experience.
2. Theme V2 production realization: **25 themes × 14 categories = 350 3D assets/templates**.
3. Production 3D runtime activation and visual QA through FastAPI → signed URL → AllphaWorldRenderer.
4. Completion Wave closure for the 82-domain Master PRD.
5. Activation of Agent, Content, Live, AI Character, GPT-Live, Animation, Economy, Commerce, Security, Observability and E2E surfaces without duplicate engines.

## Current exact state
- **V2.13D.6.4 — Production Visual Fidelity / Brand QA: GREEN** according to the latest GitHub Actions evidence shown by the project owner.
- **V2.13D.6.5 — Desktop + Mobile Production Visual QA: RED / FAILURE** in the latest GitHub Actions evidence.
- Therefore the **current immediate gate is V2.13D.6.5**.
- Do NOT advance to World → District → Booth reconciliation until D6.5 is repaired and proven GREEN.
- **CW-02.WEB remains OPEN / ACTIVATING / NOT GREEN.**
- The 350-asset Theme V2 contract remains canonical and must not be reduced because one downstream QA gate is RED.

Latest D6.5 Actions artifact:
`allpha-d6-5-desktop-mobile-production-visual-qa-evidence`

Previous D6.4 artifact:
`allpha-d6-4-production-visual-fidelity-evidence`

These are GitHub Actions artifacts, not source files. Inspect the actual run artifact/trace/screenshots before deciding a D6.5 root cause.

---

# 1. CANONICAL BINDING

## GitHub
- Account: **urbanrealty36-ops / Allpha Universe**
- Repository: `urbanrealty36-ops/Allpha-Universe-PWA`
- Branch: `main`
- Repo ID: `1400534480`

## Supabase
- Project: **AllphaDb-Universe**
- Ref: `qltbacemtvnuzqkterly`
- Region: `ap-south-1`
- PostgreSQL 17

## Railway
- Workspace: `urbanrealty36-ops`
- Project: `serene-youth`
- Environment: `production`
- Web service: `@allpha/web`
- Web: `https://allphaweb-production.up.railway.app`
- API: `https://allpha-api-production.up.railway.app`

## Monorepo
- `apps/web` — User PWA
- `apps/admin` — Super Admin
- `apps/api` — FastAPI

## Canonical stack
Next.js, React, TypeScript, Tailwind, PWA, Python FastAPI, Supabase PostgreSQL/pgvector/Auth/Storage/Realtime, AI Gateway + Model Router, Three.js/React Three Fiber, Blender.

## Canonical renderer
**AllphaWorldRenderer**

Never create a second renderer to solve a visual/runtime issue.

---

# 2. REQUIRED READING ORDER

Before implementation, read:
1. `AGENTS.md`
2. `docs/continue-context/ALLPHA_MASTER_CONTINUE_CONTEXT_20261007.md`
3. `docs/MASTER_CONTINUE_CONTEXT_UI_UX_3D_V213A_20261006.md`
4. `docs/MASTER_CONTINUATION_CONTEXT.md`
5. `docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md`
6. `docs/IMPLEMENTATION_PHASES.md`
7. `docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md`
8. `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
9. `docs/UI_UX_SURFACE_INVENTORY.md`
10. `docs/AI_AGENT_CODE_CONTINUATION_HANDOFF_20261002.md`
11. `docs/AI_AGENT_IMPLEMENTATION_REPORT.md`
12. Relevant phase architecture/database/security contracts.
13. Relevant `tests/`, `.github/workflows/`, `apps/`, `packages/`, `scripts/`.
14. Before database changes: inspect live Supabase schema/migrations/RLS/grants.

Current 3D gate documents:
- `docs/3d/V2.13D.4-EXPLICIT-PRODUCTION-PROMOTION-STORAGE-GATE.md`
- `docs/3d/V2.13D.5-RUNTIME-ASSET-ACTIVATION-VERIFICATION.md`
- `docs/3d/V2.13D.6-PRODUCTION-PWA-BROWSER-RUNTIME-VERIFICATION.md`
- `docs/3d/V2.13D.6.3-PRODUCTION-3D-VISUAL-RENDER-VERIFICATION.md`
- `docs/3d/V2.13D.6.4-PRODUCTION-VISUAL-FIDELITY-BRAND-QA.md`
- `tests/d6-3-production-3d-visual-render.spec.ts`
- `tests/d6-4-production-visual-fidelity.spec.ts`
- `tests/d6-5-desktop-mobile-production-visual-qa.spec.ts`
- `.github/workflows/v2-13d6-4-production-visual-fidelity.yml`
- `.github/workflows/v2-13d6-5-desktop-mobile-production-visual-qa.yml`

---

# 3. NON-NEGOTIABLE RULES

1. READ → UNDERSTAND → INSPECT REPO → INSPECT SUPABASE → MAP TO MASTER PRD → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → API VERIFY → PWA/Admin VERIFY → INTEGRATION CHECK → UPDATE DOCS → REPORT.
2. No new architecture if a canonical engine exists.
3. No duplicate database/table/service/renderer/Feed/Recommendation/Agent Runtime/AI Gateway/Theme engine.
4. No SQLite.
5. No fake/mock/dummy/scenario/placeholder business data.
6. No fabricated production IDs.
7. No fake API responses.
8. FastAPI is the authoritative application boundary.
9. Supabase PostgreSQL is the business-data source of truth.
10. Frontend/Admin never perform privileged DB mutations.
11. Service-role secrets never reach the browser.
12. Auth, ownership, permissions, policy, risk, approval, entitlement, billing and transaction state are server authoritative.
13. Human owns the Agent; Agent represents the Human; Agent acts only within Human-defined authority.
14. Product principle: **Unlimited creativity, bounded authority.**
15. Blender assets are presentation assets; Blender is not an authority engine.
16. Theme customization must never alter authority/security/business state.
17. Never lower a validation threshold to obtain GREEN.
18. If a phase is RED, fix only the proven RED scope.
19. Do not combine unrelated improvements with a RED remediation.
20. Do not rerun/rebuild the entire 350 matrix because a downstream browser gate is broken.
21. Empty/loading/error/not-configured/permission-denied states are legitimate.
22. Never claim GREEN without evidence.
23. Every implementation must update repository documentation.
24. Every AI Coding Agent must append a structured report to `docs/AI_AGENT_IMPLEMENTATION_REPORT.md`.
25. Never claim a source, database, artifact, deployment or runtime was inspected unless it actually was.

---

# 4. MANDATORY AI AGENT REPORT

Before declaring any task complete, append to:
`docs/AI_AGENT_IMPLEMENTATION_REPORT.md`

Use:

### YYYY-MM-DD — <PHASE / SUBPHASE>
**Agent/task:**  
**Objective:**  
**Commit SHA:**  
**Files changed:**  
**Database migrations:**  
**Supabase live verification:**  
**API changes:**  
**UI/UX changes:**  
**3D / Blender changes:**  
**Tests executed:**  
**Browser/runtime QA:**  
**Security checks:**  
**Evidence/artifacts:**  
**Status:**  
**Known gaps:**  
**Next exact phase/subphase:**

For every 3D task additionally record:
Theme, Category, Asset path, Blender source/script, geometry/polygon quality, PBR material/texture state, lighting, atmosphere, character presence, animation, LOD, render preview, GLB validation, Storage path, manifest, signed URL, AllphaWorldRenderer evidence, browser evidence, mobile evidence and visual-fidelity verdict.

---

# 5. PRODUCT VISION

**Allpha — The Social Network for Humans & AI Agents**

Allpha combines:
- Human Identity
- AI Identity
- Agent Passport
- Persona
- Memory / Knowledge / RAG
- Interest / Passion / Habit / Goal intelligence
- Content
- Feed / Reels / Discovery
- AI Capsule
- Social Graph
- Communities
- Messaging
- AI Universe
- Galaxy / World / District / Zone / Booth
- Agent World
- World Builder / Theme Builder
- Live Stories / Live Experiences
- AI Character
- GPT-Live voice
- WebRTC
- AI-to-AI collaboration
- Marketplace / Commerce
- AI Credits / Economy / Billing
- Creator Economy
- Reputation / Moderation / Fraud & Abuse
- Security / Governance / Trust
- Analytics / Observability / AI Evaluation
- Super Admin Control Plane

Spatial hierarchy:
**Universe → Galaxy → World → District → Zone → Booth/Tenant → Agent/Presence → Content/Capsule → Live/Experience**

Progressive experience:
**2D → 2.5D → Spatial → 3D**

---

# 6. COMPLETE MASTER PRD DOMAIN INDEX

The canonical Master PRD contains these numbered domains:

1 Product Identity
2 Core Product Philosophy
3 Product Loop
4 Product Domains
5 Human Identity
6 AI Agent Identity
7 Agent Passport
8 Persona Engine
9 Memory Engine
10 Interest / Passion / Habit System
11 Content System
12 Feed Engine
13 Reels Engine
14 Recommendation Engine
15 AI Capsule
16 Social Graph
17 Community Engine
18 AI Universe
19 Virtual Districts
20 Booth / Tenant Engine
21 Tenant Leasing
22 Agent World
23 World Builder
24 Theme Universe
25 World Engine
26 Agent Simulation Engine
27 Encounter Engine
28 Realtime World Engine
29 World Stream
30 Human Control Modes
31 Agent Command System
32 Human-in-the-Loop
33 High-Risk Actions
34 Approval Center
35 Autonomy Budgets
36 Security Architecture
37 Zero Trust
38 Security Boundaries
39 Supabase Architecture
40 Database Domain Groups
41 Core Database Principles
42 Vector / Semantic Search
43 Backend Architecture
44 Domain Service Pattern
45 AI Gateway
46 AI Usage Principle
47 Content Understanding Engine
48 Design System
49 Color Tokens
50 Typography Tokens
51 Spacing Tokens
52 Radius Tokens
53 Elevation
54 Glass System
55 Icon System
56 Motion System
57 Core UI Components
58 Mobile Navigation
59 Desktop Navigation
60 Mobile UX Rule
61 Responsive Model
62 Accessibility
63 Revenue Model
64 Free Tier
65 Paid Subscription Tiers
66 Entitlement Engine
67 Usage Metering
68 Booth Revenue
69 Marketplace Revenue
70 Creator Economy
71 Sponsored Experience
72 Super Admin Control Plane
73 Super Admin CRUD
74 Configuration Lifecycle
75 CRUD — Plans
76 CRUD — Features
77 CRUD — Entitlements
78 CRUD — District
79 CRUD — District Pricing
80 CRUD — Booth Policy
81 CRUD — Theme
82 CRUD — AI Model Router
83 CRUD — AI Policy
84 CRUD — Recommendation
85 CRUD — Revenue Rules
86 CRUD — Feature Flags
87 User Integration
88 User Settings
89 Personalization Control
90 Analytics
91 Reputation Engine
92 Moderation
93 Fraud / Abuse
94 Agent Interoperability
95 API Architecture
96 API Authorization
97 Event Architecture
98 Audit Ledger
99 Observability
100 E2E Test Strategy
101 E2E — Account
102 E2E — Feed
103 E2E — Reels
104 E2E — Agent
105 E2E — High Risk
106 E2E — Booth
107 E2E — Marketplace
108 E2E — Super Admin
109 E2E — Plan Change
110 E2E — Feature Flag
111 Test Layers
112 AI Evaluation
113 Performance Budget
114 PWA Architecture
115 Frontend Architecture
116 Admin Frontend
117 Design System Implementation
118 Theme Engine Implementation
119 Configuration Versioning
120 Rollback

Important subcontracts in the PRD include Feed surfaces (Home, Following, For You, Reels, Explore, Live Now, World Stream, Community Feed, Agent Feed, Knowledge Feed, Context Feed), Human Control Modes (Agent/Co-Pilot/Human/Return to Agent), Human-in-the-Loop levels 0–5, Social/Financial/Data autonomy budgets, Free/Plus/Pro/Business/Enterprise tiers, CRUD Create/Read/Update/Delete/Publish/Rollback/Audit, and Unit/Integration/Contract/Security/E2E/Load/AI Evaluation/Visual Regression/Accessibility test layers.

---

# 7. NEW / EXPANDED MASTER PRD CAPABILITIES

These additions must compose canonical engines; never create parallel engines.

## Discovery / Content intelligence
- Allpha Universe Discovery Engine
- Universe Scroll
- Moments
- Content Gravity Engine
- Ask the Content
- Content Evolution
- Agent Intelligence on Content
- Optional Agent Companion
- Original → AI Summary → Discussion → Related Content → Live Experience → World
- Content Context → Owned Agent Context → reviewed AI Capsule/Topics → optional Memory/Knowledge → AI Gateway → Agent Insight

## Agent expansion
- Universal Allpha Agent Catalog
- Agent Skill / Type / Character Catalog
- Allpha Agent Factory
- Real Agent Activation E2E
- Real Runtime Activation / Completion
- Agent Passport / Capability / Permission / Policy / Risk / Approval / Audit
- Embedding / Hybrid Retrieval / Authorized Context / Personalization Context
- Agent Service / Skill Challenge / Reward
- AI-to-AI Collaboration / Negotiation / Human Approval / Agreement / Execution / Review / Reputation / History

## Spatial expansion
- Living Universe
- Galaxy Navigator
- World Experience
- District Experience
- Booth/Tenant Experience
- Zone / Spatial Object / Portal / Presence
- World Stream
- Universe Map
- 82-Domain Experience Map
- Theme Builder / World Builder
- Real Storage 3D Asset Lifecycle
- AllphaWorldRenderer

## AI Content / Message actions
- AI Content generation
- AI Agent Generate
- Ask on Message
- Ask on Content
- governed action handoff to Agent Runtime
- AI Credits accounting for eligible AI operations
- Content/Message telemetry and authorization

## Live / AI Character
- Live Session Core
- Human Owner → Owned Agent Collaboration
- Live Agent Runtime
- Realtime Audience/Conversation
- 3D Live Stage
- Human Presentation
- Human Uniform catalog
- AI Character catalog/assets
- GPT-Live voice
- WebRTC
- Character Animation Contract
- CharacterAnimationSignal
- voice amplitude → mouth/jaw/viseme presentation
- idle/listening/thinking/speaking/emphasis/greeting/acknowledge/farewell
- Live overlays / presence / moderation / participant authorization
- anti-impersonation

## Economy / Commerce
- AI Credits
- credit ledger/products/purchases
- billing plans/subscriptions/invoices
- settlement events
- Commerce Orders/Payments/Entitlements
- Marketplace
- seller payouts
- Creator Economy
- Sponsored Experience
- usage metering
- Midtrans payment boundary

## Governance / Security
- RBAC / ABAC
- RLS
- IDOR/BOLA
- Security Advisor
- SECURITY DEFINER audit
- anti-impersonation
- ownership/capability/policy/risk/approval
- audit ledger
- moderation
- fraud/abuse
- Live authorization
- signed asset URL boundary
- service-role isolation
- security E2E

---

# 8. COMPLETE PHASE MAP — PHASE 00–38

## PHASE 00 — Governance & Repository Foundation
Mission: monorepo boundaries, engineering rules, source-of-truth governance and deployable apps.
Status: FOUNDATION / baseline implemented.

## PHASE 01 — Design System & UI Foundation
Mission: tokens, typography, spacing, responsive/accessibility, PWA shell, navigation and command surfaces.
Status: FOUNDATION / implemented; continued through WEB refactor.

## PHASE 02 — Complete UI/UX Information Architecture
Mission: route/screen inventory and product information architecture.
Status: FOUNDATION / progressively realized by WEB track.

## PHASE 03 — API Contract Layer
Mission: OpenAPI, schemas, errors, pagination/filter/sort, idempotency, versioning and shared contracts.
Status: FOUNDATION / canonical boundary in use.

## PHASE 04 — Supabase PostgreSQL Data Foundation
Status: IMPLEMENTED.
Mission: PostgreSQL, pgvector, Storage, Realtime, constraints, indexes, grants and RLS.

## PHASE 05 — Identity, Authentication & Authorization
Status: IMPLEMENTED.
Mission: Auth, sessions, profiles, RBAC/permissions, JWT/JWKS, SSR auth and RLS.

## PHASE 06 — Human & AI Identity Foundation
Status: IMPLEMENTED.
Mission: Human/AI identity, Agent lifecycle, Passport, Persona, verification, capabilities, skills, policies, autonomy, credentials, reputation.

## PHASE 07 — Agent Memory & Knowledge
Status: IMPLEMENTED.
Mission: memory, knowledge, chunks, provenance, embeddings, semantic retrieval, retention and access audit.

## PHASE 08 — Interest / Passion / Habit / Goal / Personalization
Status: WEB ACTIVATED / IMPLEMENTED.
Mission: canonical interest graph, signals, affinity, passion, habits, goals and personalization context.

## CROSS-DOMAIN ARCHITECTURE AMENDMENT v1.1
Status: SCHEMA FOUNDATION IMPLEMENTED.
Mission: tiered Booth/Tenant, 3D Booth Display, Enterprise District ABAC/isolation and Story/Live AI Character collaboration.

## PHASE 09 — Social Graph & Relationship Engine
Status: WEB ACTIVATED / IMPLEMENTED; runtime gates remain.
Mission: relationships, follow/friend/mentor/partner/client/supplier/collaborator/trusted_agent, mentions and notifications.

## PHASE 10 — Content Platform
Status: WEB ACTIVATED / IMPLEMENTED; runtime gates remain.
Mission: authoritative content/media/revision/moderation/AI Capsule lifecycle.

## PHASE 11 — Feed, Reels & Discovery
Status: WEB ACTIVATED / IMPLEMENTED; runtime/evaluation gates remain.
Mission: Home, Following, For You, Reels, Explore, Live Now, Agent Feed, Knowledge Feed, World Stream and Context.

## PHASE 11A — Allpha Universe Discovery Engine & Feed Experience
Status: WEB ACTIVATED / IMPLEMENTED; completion OPEN.
Mission: Universe Scroll, Moments, discovery orchestration over existing engines.

### 11A.4 — Content Gravity Engine
Status: IMPLEMENTED FOUNDATION.
Mission: enrich authoritative Feed ranking using personalization/topic/World context.

### 11A.5 — Ask the Content
Status: IMPLEMENTED FOUNDATION.
Mission: authorized Content context + Memory/Knowledge + AI Gateway; action requests hand off only.

### 11A.6 — Content Evolution
Status: IMPLEMENTED FOUNDATION.
Mission: Original → AI Summary → Discussion → Related Content → Live → World.

### 11A.7 — Agent Intelligence Layer on Content
Status: IMPLEMENTED FOUNDATION.
Mission: Content + owned Agent + reviewed evidence + optional RAG → AI Gateway → Agent Insight.

### 11A.8 — Optional Agent Companion
Status: IMPLEMENTED FOUNDATION.

### 11A.10 — Agent Skill / Type / Character Catalog
Status: IMPLEMENTED FOUNDATION.

### 11A.11 — Universal Allpha Agent Catalog Expansion
Status: IMPLEMENTED FOUNDATION.

### 11A.12 — Allpha Agent Factory
Status: IMPLEMENTED FOUNDATION.

### 11A.13 — Real Agent Activation E2E
Status: IMPLEMENTED FOUNDATION.

### 11A.14 — Real Runtime Activation & Completion
Status: IMPLEMENTED FOUNDATION.

## PHASE 12 — Community Platform
Status: WEB COMPLETED / IMPLEMENTED FOUNDATION; runtime gate deferred.
Mission: communities, membership, posts, moderation, discovery.

## PHASE 13 — Messaging & Social Communication
Status: WEB ACTIVATED / IMPLEMENTED FOUNDATION.
Mission: messages, conversations, Agent messaging, notifications, collaboration communication.

### Cross-owner AI Agent Service / Skill Economy
Status: IMPLEMENTED FOUNDATION.
Mission: governed Agent-to-owner services/skills.

## PHASE 14 — AI Gateway & Model Router
Status: IMPLEMENTED.
Mission: provider-agnostic gateway/model routing and usage/policy boundary.

### 14A — AI Provider Activation & Runtime Readiness
Status: IMPLEMENTED.

## PHASE 15 — Agent Runtime & Command System
Status: IMPLEMENTED.
Mission: bounded Agent execution authority.

## PHASE 16 — Workflow & Mission Engine
Status: IMPLEMENTED FOUNDATION / WEB ACTIVATED / NOT GREEN.
Mission: workflows, missions, dependencies, execution state and governed actions.

## PHASE 17 — AI Universe
Status: WEB/UI ACTIVATED / IMPLEMENTED / runtime E2E pending.
Mission: Universe/Galaxy/World product layer.

### 17.1 — Living Universe 3D Experience
Status: WEB/UI ACTIVATED / runtime E2E pending.

## PHASE 18 — Agent Simulation & Spatial Runtime
Status: IMPLEMENTED FOUNDATION / DB verified.
Mission: spatial presence, simulation and interactions.

## PHASE 19 — Districts
Status: IMPLEMENTED FOUNDATION / spatial layer activated.
Mission: District → Zone → Spatial Object → Booth → Agent Presence, access and ABAC.

## PHASE 20 — Booth / Tenant Platform
Status: IMPLEMENTED FOUNDATION.
Mission: Booth identity, lease, assets, displays, Marketplace and spatial presence.

## PHASE 21 — Theme & World Builder
Status: IMPLEMENTED FOUNDATION + lifecycle hardening.
Mission: Theme/Theme Version/World schema, builder and publish/rollback lifecycle.

### 21.5 — ALLPHA 25 THEME 3D ASSET PACK
Status: IMPLEMENTED FOUNDATION; evolved into Theme V2/V2.13 production lifecycle.
Mission: canonical 25-theme spatial asset catalog.

## PHASE 22 — Live Stories / Streaming / Experiences
Status: template catalog implemented; runtime dependency-gated.
Mission: Live sessions, stages, stories, streaming, audience and collaboration.

### 22A — Live Session Core
Status: IMPLEMENTED FOUNDATION.

### 22B — Human Owner → Owned AI Agent Collaboration
Status: IMPLEMENTED FOUNDATION.

### 22C — Live Agent Runtime / AI Gateway Activation
Status: IMPLEMENTED FOUNDATION.

### 22D — Realtime Live Conversation / Audience Runtime
Status: IMPLEMENTED FOUNDATION.

### 22G — Live Experience 3D Stage + Human Presentation Runtime
Status: IMPLEMENTED FOUNDATION.

### 22H — Platform Human Uniforms + GPT-Live Character Voice Runtime
Status: IMPLEMENTED FOUNDATION / runtime E2E pending.

### 22I — AI Character Asset + Animation Contract
Status: IMPLEMENTED FOUNDATION / runtime quality gates pending.

## PHASE 23 — AI-to-AI Collaboration
Status: IMPLEMENTED FOUNDATION family.
Mission: discovery, eligibility, request, negotiation, approval, agreement, execution, review and reputation.

### 23A — Discovery + Eligibility + Collaboration Request
Status: IMPLEMENTED FOUNDATION.

### 23B — Agent DM + Negotiation
Status: IMPLEMENTED FOUNDATION.

### 23C — Human Approval + Collaboration Agreement
Status: IMPLEMENTED FOUNDATION.

### 23D — Execution
Status: IMPLEMENTED FOUNDATION.

### 23E — Review + Reputation + History
Mission: post-collaboration review, reputation and history.

## PHASE 24 — Marketplace & Commerce
Status: IMPLEMENTED FOUNDATION / payment E2E pending.
Mission: listings, orders, payments, entitlements, seller/payout lifecycle.

## PHASE 25 — Economy, Credits & Billing
Status: IMPLEMENTED FOUNDATION / Midtrans E2E pending.
Mission: AI Credits, purchases, subscriptions, invoices, settlement and metering.

## PHASE 26 — Security, Governance & Trust
Status: OPEN / hardening and final gates required.
Mission: Zero Trust, RLS, RBAC/ABAC, IDOR/BOLA, Security Advisor, SECURITY DEFINER audit, anti-impersonation, risk/approval and security E2E.

## PHASE 27A — Super Admin Control Plane Foundation
Status: IMPLEMENTED FOUNDATION.

## PHASE 27B — Super Admin Analytics + Master Data
Status: IMPLEMENTED FOUNDATION.

## PHASE 27C — Super Admin Domain Operations / Transaction Explorer / Master Data
Status: implemented operational foundation; overall completion governed by Completion Waves.
Mission: domain operations, transaction explorer, master data and governance.

## PHASE 27D — Completion Wave Checkpoint
Status: CHECKPOINT.
Mission: evidence reconciliation.

## PHASE 28 — Analytics, Observability & Operational Intelligence
Status: COMPLETION WAVE ACTIVE.

## PHASE 29 — API Integration & Local End-to-End Wiring
Status: COMPLETION WAVE ACTIVE.

## PHASE 30 — Full Feature Activation
Status: COMPLETION WAVE ACTIVE.
Mission: real data, real authority, real integrations and runtime evidence across implemented features.

## PHASE 31 — End-to-End QA & Security Verification
Status: DOWNSTREAM / PENDING.
Mission: complete E2E and security journeys.

## PHASE 32 — CI/CD
Status: DOWNSTREAM / PENDING.
Mission: reliable CI/CD gates and evidence.

## PHASE 33 — Runtime Verification
Status: DOWNSTREAM / PENDING.
Mission: production browser/device/runtime verification.

## PHASE 34 — Staging / Production Readiness
Status: DOWNSTREAM / PENDING.

## PHASE 35 — Production Deployment & Final Green Gate
Status: DOWNSTREAM / PENDING.
Mission: final release, verification and rollback readiness.

## PHASE 36 — Reserved Product Expansion
Status: RESERVED.

## PHASE 37 — Reserved Product Expansion
Status: RESERVED.

## PHASE 38 — Reserved Product Expansion
Status: RESERVED.

---

# 9. WEB UI/UX REFACTOR — FULL SEQUENCE

The Web track is the canonical product realization, not a second architecture.

- **WEB-01 — Baseline & Frontend Reconciliation** — CLOSED / BASELINE LOCKED.
- **WEB-02 — Design System Foundation** — CLOSED / FOUNDATION IMPLEMENTED.
- **WEB-03 — PWA Foundation** — CLOSED / FOUNDATION IMPLEMENTED.
- **WEB-04 — Mobile Navigation** — CLOSED / IMPLEMENTED.
- **WEB-05 — Universe Shell** — IMPLEMENTED; browser QA pending.
- **WEB-06 — Splash + Identity** — IMPLEMENTED; browser QA pending.
- **WEB-07 — Universe Home** — IMPLEMENTED; runtime/browser gates pending.
- **WEB-08 — Galaxy Navigator** — IMPLEMENTED; runtime/browser gates pending.
- **WEB-09 — World Experience** — IMPLEMENTED; runtime/browser gates pending.
- **WEB-10 — District Experience** — IMPLEMENTED; runtime/browser gates pending.
- **WEB-11 — Booth / Tenant** — IMPLEMENTED; browser/device QA pending.
- **WEB-12 — Agent Experience** — IMPLEMENTED FOUNDATION; runtime gates pending.
- **WEB-13 — Universe Moments** — IMPLEMENTED FOUNDATION.
- **WEB-14 — Content Capsule** — IMPLEMENTED FOUNDATION.
- **WEB-15 — Ask Content** — IMPLEMENTED FOUNDATION.
- **WEB-16 — Create Experience** — IMPLEMENTED FOUNDATION / runtime pending.
- **WEB-17 — My Agent** — next/verify latest plan before implementation.
- **WEB-18 — Social**
- **WEB-19 — Community**
- **WEB-20 — Messages / Collaboration**
- **WEB-21 — Agent Live Monitor / Live Experience**
- **WEB-22 — Theme Builder**
- **WEB-23 — Human Control Center**
- **WEB-24 — Universe Map**
- **WEB-25 — 82-Domain Experience Map**
- **WEB-26 — Responsive Engineering**
- **WEB-27 — Performance**
- **WEB-28 — Accessibility**
- **WEB-29 — PWA Install QA**
- **WEB-30 — E2E Journeys**
- **WEB-31 — Security / Authority QA**
- **WEB-32 — Visual QA**
- **WEB-33 — Runtime Validation**
- **WEB-34 — CW-02 Closure Evidence**

Mission of WEB track: transform the existing product into a premium, mobile-first, installable, spatial/cinematic Allpha experience rather than a dashboard, while preserving all canonical API, authority, engine and security boundaries.

---

# 10. 3D V2 MASTER SEQUENCE

## V2.01
Art Direction & Master Visual Language.

## V2.02
Golden Theme / Golden Scene.

## V2.03
Geometry & Material Asset Factory.

## V2.04
Character / Live Character V2.

## V2.05
Universe / Galaxy / Orbit V2.

## V2.06
World / District / Booth V2.

## V2.07
Capsule / Content / Feed Universe V2.

## V2.08
Live / Human Live / Stage V2.

## V2.09
Production 3D Art & Asset Pipeline.
- V2.09-B Cinematic 3D Rendering, Lighting & Material Realism.
- V2.09-C Advanced Environment Detail, Shaders, Atmosphere & Theme-Specific Polish.
- V2.09-D Real-Time Spatial Motion, Camera & Interaction Polish.

## V2.11
Production 3D Asset Activation & Canonical Renderer Cutover.
- V2.11-A Signed URL & Production Asset Manifest Verification.

## V2.12
Full Theme V2 Runtime Visual QA.

## V2.13
Production Theme / Golden Production Art.

### V2.13A
Crystal AI City Golden Production Theme.

### V2.13B
Golden Validation.

### V2.13C
Theme Factory.

### V2.13D
Theme Production / Promotion / Runtime / Visual QA.

Subsequence:
- D.1 / D.1A — production build/contract preparation
- D.2 — production asset validation
- D.3 — production visual/asset verification
- D.3A / D3C / D3D — production visual/contract/runtime hardening
- D.4 — Explicit Production Promotion / Storage Gate — GREEN/LOCKED
- D.5 — Runtime Asset Activation / Consumption Verification — GREEN/LOCKED
- D.6 — Production PWA / Browser Runtime Verification — historical RED remediated by downstream gates
- D.6.3 — Production 3D Visual Render Verification — prerequisite evidence closed for D6.4
- D.6.4 — Production Visual Fidelity / Camera / Lighting / Material QA — **GREEN**
- **D.6.5 — Desktop + Mobile Production Visual QA — CURRENT RED**
- D.7 — World → District → Booth Production Visual/Runtime Reconciliation — next after D6.5 GREEN

---

# 11. THE 350 THEME V2 CONTRACT

**25 themes × 14 categories = 350 production assets/templates**

25 themes:
1 aurora-kingdom
2 celestial-samurai
3 chronos-realm
4 coral-metropolis
5 crystal-ai-city
6 desert-starfall
7 dragon-dominion
8 dream-carnival
9 emerald-rainforest
10 floating-garden
11 galactic-frontier
12 heroic-nexus
13 kingdom-of-aether
14 lunar-frontier
15 mars-frontier
16 mystic-academy
17 neo-jakarta-2099
18 neon-tokyo
19 nusantara-raya
20 oceanic-atlantis
21 pharaoh-eternal
22 quantum-city
23 savanna-spirit
24 skyforge-empire
25 viking-fjord

14 canonical categories:
1 Universe
2 Galaxy
3 World
4 Orbit
5 Capsule
6 District
7 Booth
8 Content / Feed Universe
9 AI Agent Character
10 Live Stage
11 Human Live / Uniform
12 Sticker / Social 3D
13 Animation
14 Navigation / Spatial FX

The expanded product language may also refer to:
Portal, Feed Universe, Content Capsule, AI Character, CharacterAnimationSignal, Voice/realtime, WebRTC, GPT-Live boundary, Sticker/Social 3D, AI Credits, AI Content, AI Agent Generate, Ask on Message, Ask on Content, Community, Marketplace, Collaboration, Negotiation, Theme Builder, Human Control Center, Universe Map, Performance, Accessibility, E2E, Security and Visual QA.

Do not create extra asset categories unless the canonical matrix is explicitly amended. Map additional product terminology to the canonical category/engine.

Theme differentiation must affect real geometry/spatial grammar, landmark silhouettes, district/booth/capsule/live-stage language, materials, atmosphere, lighting, camera, character/wardrobe, portals and FX — not only color palette.

---

# 12. LIVE / AI CHARACTER / GPT-LIVE / ANIMATION

Phase 22H and 22I extend the canonical Live stack without creating a second Live or Agent engine.

Human Live chain:
Human Live Session → Human Camera/Presence → Owned Agent Collaboration → GPT-Live voice → client delegation → Allpha Live Conversation → Agent Runtime → AI Gateway/model routing → governed result → GPT-Live commentary → AI Character performance → AllphaWorldRenderer.

Platform Human Uniform catalog includes:
- Allpha Classic White
- Allpha Business Navy
- Allpha Suit & Tie
- Allpha Formal Black
- Allpha Nusantara Batik
- Allpha Nusantara Modern
- Allpha Creator Street
- Allpha Future Tech

AI Character Animation Contract includes:
- full-body channels
- face channels
- voice→viseme amplitude proxy
- idle/listening/thinking/speaking/emphasis/greeting/acknowledge/farewell
- deterministic gesture priorities
- no per-frame animation persistence

Security:
- authenticated Human owns Live Session
- collaboration must be active/consent approved/risk allow/capability verified/policy verified
- no secret leakage
- presentation never grants authority
- no biometric templates/face embeddings persisted by this workflow.

---

# 13. ECONOMY / COMMERCE

Canonical:
AI Credits → existing ai_credit_ledger → Economy products/purchases → Commerce payment boundary → Midtrans → verified settlement → Order/Entitlement/Billing.

Also:
- subscriptions
- invoices
- settlement events
- Marketplace
- seller payouts
- Creator Economy
- Sponsored Experience
- usage metering
- pricing
- entitlements

Midtrans Server Key and Supabase Service Role remain backend-only.

---

# 14. SECURITY / GOVERNANCE

Must preserve:
RBAC, ABAC, RLS, IDOR/BOLA defense, Security Advisor, SECURITY DEFINER audit, anti-impersonation, ownership, capabilities, policies, risk, approval, audit ledger, moderation, fraud/abuse, Live participant authorization, signed URL boundaries and service-role isolation.

Never weaken security to make a workflow pass.

---

# 15. CURRENT 3D PRODUCTION WORLD

Canonical World:
**Crystal AI City World**

World ID:
`b97e25db-54ac-472d-92ed-e4a8eac85a0e`

Theme:
`crystal-ai-city`

Production URL:
`https://allphaweb-production.up.railway.app/world?world_id=b97e25db-54ac-472d-92ed-e4a8eac85a0e`

World asset:
`theme-v2-real-3d/v2.13/crystal-ai-city/world.glb`

Never substitute another World ID to bypass a failed gate.

---

# 16. CURRENT D6.5 EXECUTION PROTOCOL

The latest D6.5 GitHub Actions run is RED. The correct sequence is:

1. Inspect latest D6.5 workflow run and job.
2. Download `allpha-d6-5-desktop-mobile-production-visual-qa-evidence`.
3. Inspect error-context, trace, screenshots, test output and network/GLB evidence.
4. Determine **one proven root cause**.
5. Fix only that root cause.
6. Commit to `main`.
7. Deploy the exact commit to Railway `@allpha/web`.
8. Verify Railway deployment SUCCESS and exact commit SHA.
9. Rerun D6.5.
10. Inspect the new artifact/trace/screenshots.
11. Only if desktop + mobile pass: D6.5 = GREEN/LOCKED.
12. Then execute D6.7 World → District → Booth reconciliation.

Never obtain GREEN by:
- weakening assertions
- lowering luminance/variance thresholds without evidence
- hiding browser errors
- fabricating screenshots
- using a different World ID
- fake GLB
- bypassing FastAPI
- replacing AllphaWorldRenderer
- deleting browser checks.

---

# 17. UI/UX REFACTOR VISION

The Web app must NOT become a conventional dashboard.

Visual/product language:
- Universe
- Galaxy
- Orbit
- World
- District
- Booth
- Agent
- Content
- Live Experience

Experience requirements:
- mobile-first installable PWA
- responsive desktop
- premium
- spatial
- cinematic
- deep-space/universe visual language
- progressive 2D → 2.5D → spatial → 3D
- readable
- accessible
- performant
- real-data driven
- legitimate loading/empty/error/permission states

Reference documents:
- `docs/ux/references/README.md`
- `docs/ux/references/ALLPHA_MOBILE_FIRST_PWA_REFERENCE_BOARD.svg`
- `docs/audits/WEB*.md`
- `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
- `docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md`

Reference images are design direction, not permission to fabricate data.

---

# 18. USER + ADMIN SURFACE INVENTORY

User:
Universe, Social Feed, Reels, Explore, Following, For You, Live, Communities, Community Detail, Create, Messages, Notifications, Missions, Marketplace, My Agent, Agent World, Agent Mind, Agent Studio, Agent Network, Agent Knowledge, Agent Skills, Agent Catalog, Agent Collaboration, Agent Reputation, Agent Activity, Agent Passport, AI Capsule, Worlds, World Detail, Districts, District Detail, Booths, Booth Detail, Theme Builder, World Builder, Events, Profile, Settings, Billing, Security and Approvals.

Admin:
Overview, Users, Agents, Content, Communities, Universe, Galaxies, Worlds, Districts, Booths, Themes, Marketplace, Missions, Events, Plans, Features, Entitlements, Pricing, Revenue, Billing, Credits, AI Providers, Model Router, AI Policies, Agent Policies, Security, Risk, Moderation, Reports, Audit Logs, Feature Flags, System Settings, Localization, Notifications, Analytics, Observability, E2E/QA, Configuration Versions.

---

# 19. 3D ASSET LIFECYCLE

**Design → Generate → Validate → Moderate → Store → Manifest → Signed URL → FastAPI → AllphaWorldRenderer → Browser QA → Mobile QA → Visual Fidelity QA → Activation**

Storage root:
`allpha-world-assets/theme-v2-real-3d/`

V2.13 path:
`theme-v2-real-3d/v2.13/{themeKey}/{category}.glb`

Supabase `theme_assets` is authoritative.
Frontend does not invent asset records or sign URLs.
Service-role never enters frontend.

---

# 20. REPOSITORY DOCUMENTS THAT MUST BE STUDIED

## Master context / PRD
- `docs/continue-context/ALLPHA_MASTER_CONTINUE_CONTEXT_20261007.md`
- `docs/MASTER_CONTINUE_CONTEXT_UI_UX_3D_V213A_20261006.md`
- `docs/MASTER_CONTINUATION_CONTEXT.md`
- `docs/MASTER_CONTINUE_CONTEXT_PHASE27C_20261004.md`
- `docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md`
- `docs/IMPLEMENTATION_PHASES.md`
- `docs/AI_AGENT_CODE_CONTINUATION_HANDOFF_20261002.md`
- `docs/AI_AGENT_IMPLEMENTATION_REPORT.md`

## Web/UI/UX
- `docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md`
- `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
- `docs/UI_UX_SURFACE_INVENTORY.md`
- `docs/ux/references/README.md`
- `docs/ux/references/ALLPHA_MOBILE_FIRST_PWA_REFERENCE_BOARD.svg`
- `docs/audits/ALLPHA_WEB_APP_DOMAIN_PHASE_COVERAGE_AUDIT_20261003.md`
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

## 3D / production
- `docs/3d/V2.13D.4-EXPLICIT-PRODUCTION-PROMOTION-STORAGE-GATE.md`
- `docs/3d/V2.13D.5-RUNTIME-ASSET-ACTIVATION-VERIFICATION.md`
- `docs/3d/V2.13D.6-PRODUCTION-PWA-BROWSER-RUNTIME-VERIFICATION.md`
- `docs/3d/V2.13D.6.3-PRODUCTION-3D-VISUAL-RENDER-VERIFICATION.md`
- `docs/3d/V2.13D.6.4-PRODUCTION-VISUAL-FIDELITY-BRAND-QA.md`
- `tests/d6-3-production-3d-visual-render.spec.ts`
- `tests/d6-4-production-visual-fidelity.spec.ts`
- `tests/d6-5-desktop-mobile-production-visual-qa.spec.ts`
- `.github/workflows/v2-13d6-3-production-3d-visual-render.yml`
- `.github/workflows/v2-13d6-4-production-visual-fidelity.yml`
- `.github/workflows/v2-13d6-5-desktop-mobile-production-visual-qa.yml`
- `.github/workflows/v2-13d7-world-district-booth-production-reconciliation.yml`
- `packages/design-tokens/3d-golden-theme-factory.ts`
- `packages/design-tokens/3d-visual-language.ts`
- `scripts/3d/blender/build_v2_13_production_art.py`
- `scripts/3d/blender/build_v2_13d_theme_production.py`
- `scripts/3d/generate-v2-13c-theme-factory-manifest.mjs`
- `scripts/3d/production-asset-pipeline.mjs`
- `scripts/3d/v2-13d4-storage-promotion.mjs`
- `scripts/3d/v2-13d5-runtime-asset-activation-verification.mjs`
- `scripts/3d/v2-13d6-production-pwa-browser-runtime-verification.mjs`
- `tools/theme_assets/generate_allpha_25_theme_3d_pack.py`

## Live / AI Character
- `docs/architecture/PHASE_22A_LIVE_SESSION_CORE_v1.0.md`
- `docs/architecture/PHASE_22B_LIVE_AGENT_COLLABORATION_v1.0.md`
- `docs/architecture/PHASE_22C_LIVE_AGENT_RUNTIME_GATEWAY_v1.0.md`
- `docs/architecture/PHASE_22D_REALTIME_LIVE_CONVERSATION_AUDIENCE_RUNTIME_v1.0.md`
- `docs/architecture/PHASE_22G_LIVE_EXPERIENCE_3D_STAGE_HUMAN_PRESENTATION_v1.0.md`
- `docs/architecture/PHASE_22H_PLATFORM_UNIFORMS_GPT_LIVE_CHARACTER_RUNTIME_v1.0.md`
- `docs/architecture/PHASE_22I_AI_CHARACTER_ASSET_ANIMATION_CONTRACT_v1.0.md`

## Security
- `docs/architecture/PHASE_26_DEFENSE_IN_DEPTH_SECURITY_BLUEPRINT_v1.0.md`
- `docs/architecture/PHASE_26_SECURITY_ADVISOR_IDOR_HARDENING_v1.0.md`
- `docs/security/PHASE_26_SECURITY_RELEASE_GATE_v1.1.md`

## Completion Waves
- `docs/audits/CW01_FINAL_82_DOMAIN_EVIDENCE_LOCK_REGISTER_20261004.md`
- `docs/audits/CW02R_RUNTIME_REPAIR_ACTIVATION_STABILIZATION_20261004.md`
- `docs/audits/CW02_FRONTEND_THEME_WORLD_LIVE_RECONCILIATION_20261004.md`
- `docs/audits/CW02_REAL_AGENT_CONTENT_ACTIVATION_CHECKPOINT_20261004.md`
- `docs/audits/CW02_WEB_UNIVERSE_ENTRY_AUTHENTICATED_UX_20261004.md`
- `docs/architecture/PHASE_27D_COMPLETION_WAVE_CHECKPOINT.md`
- `docs/architecture/PHASE_28_30_COMPLETION_WAVE_CHECKPOINT.md`

---

# 21. FINAL DIRECTIVE

You are inheriting an existing product, not starting a new project.

Your job is:
**RECONCILE → IMPLEMENT → VERIFY → DOCUMENT → REPORT**

The current exact next action is:

## V2.13D.6.5 — Desktop + Mobile Production Visual QA
**Status: RED**

First action:
**Inspect the latest D6.5 GitHub Actions artifact/trace and determine the proven root cause before changing code.**

After D6.5 GREEN:
**V2.13D.7 — World → District → Booth Production Visual/Runtime Reconciliation**

In parallel, continue the **CW-02 Web UI/UX refactor** according to the latest Web phase plan while preserving the 350 Theme V2 matrix.

Every completed implementation MUST append evidence to:
`docs/AI_AGENT_IMPLEMENTATION_REPORT.md`

Never claim GREEN without proof.
