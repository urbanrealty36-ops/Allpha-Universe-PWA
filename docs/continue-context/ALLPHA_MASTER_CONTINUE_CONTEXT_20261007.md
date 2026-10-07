# ALLPHA UNIVERSE — MASTER CONTINUE CONTEXT / MASTER HANDOFF
## 2026-10-07 — Full UI/UX Refactor + Theme V2 / 350 Assets + Runtime Continuation

> **Purpose:** This document is the canonical prompt/handoff for a NEW ChatGPT/AI Coding Agent conversation continuing the Allpha Universe project.
>
> **Important:** Read this document first, then inspect the canonical repository documents and actual source code listed below. Do not restart architecture discovery and do not invent missing implementation state.

---

# 1. CANONICAL PROJECT BINDING

## GitHub
- Account/link: **Allpha Universe / urbanrealty36-ops**
- Repository: **urbanrealty36-ops/Allpha-Universe-PWA**
- Branch: **main**
- Repo ID: `1400534480`

## Supabase
- Account/project: **AllphaDb-Universe**
- Project ref: `qltbacemtvnuzqkterly`
- Region: `ap-south-1`
- PostgreSQL 17

## Production / Railway
- Web: `https://allphaweb-production.up.railway.app`
- API: `https://allpha-api-production.up.railway.app`

## Canonical architecture
`apps/web` = PWA
`apps/admin` = Super Admin
`apps/api` = FastAPI backend

Canonical stack:
- Next.js / React / TypeScript / Tailwind / PWA
- Python FastAPI
- Supabase PostgreSQL / pgvector / Auth / Storage / Realtime
- AI Gateway + Model Router
- Three.js / React Three Fiber
- Blender for production 3D authoring/export

---

# 2. NON-NEGOTIABLE OPERATING RULES

1. **READ → UNDERSTAND → INSPECT REPO → INSPECT SUPABASE → MAP TO MASTER PRD → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → API VERIFY → PWA/Admin VERIFY → INTEGRATION CHECK → UPDATE DOCS → REPORT.**
2. Do not create a new architecture when an existing canonical engine already exists.
3. Do not create a duplicate database/table/engine/service merely to solve a UI problem.
4. No SQLite.
5. No fake/mock/dummy/scenario business data.
6. No fabricated production IDs.
7. No fake API responses.
8. FastAPI is the authoritative application boundary.
9. Supabase PostgreSQL is the business-data source of truth.
10. Frontend/Admin must not perform privileged DB mutations.
11. Never expose service-role secrets to browser/frontend.
12. Auth, ownership, permissions, policy, risk, approval, entitlement, billing and transaction state are server authoritative.
13. Existing GREEN evidence is **LOCKED**.
14. If a phase/check is RED, **FIX ONLY THE RED SCOPE**.
15. Do not combine a RED fix with previously GREEN phases.
16. Do not rerun the 350-asset matrix because a downstream verification is broken.
17. Never lower a validation threshold merely to obtain GREEN.
18. Never claim GREEN without real evidence.
19. Empty production data is a legitimate state; never create fake records to make a UI appear populated.
20. Every completed implementation must update the appropriate repository documentation and implementation report.
21. Every AI Coding Agent must leave a machine-readable or structured evidence record where the phase requires it.
22. Production mutation phases must have explicit approval boundaries.
23. 3D Blender assets are presentation assets only; runtime authority remains outside Blender.
24. The canonical renderer is **AllphaWorldRenderer**.
25. Runtime 3D asset lifecycle is:
   **Design → Generate → Validate → Moderate → Store → Manifest → Signed URL → FastAPI → AllphaWorldRenderer → Browser Runtime QA**.

---

# 3. CURRENT STRATEGIC STATE

The project is **NOT starting from Phase 00**.

The strategic work is now in a combined:
- **Full Web App UI/UX refactor**
- **Theme V2 / 25-theme / 14-category / 350-asset realization**
- **runtime activation and production verification**
- **Completion Wave closure**

The current 3D activation chain reached:
- V2.13D.4 — Production Promotion / Storage
- V2.13D.5 — Runtime Asset Consumption Verification — **GREEN / LOCKED**
- V2.13D.6 — Production PWA Browser Runtime Verification — **CURRENT / RED**

## Current V2.13D.6 evidence

The latest browser evidence shows:

### Universe
- mobile `/universe`: HTTP 200
- canvas: 1
- WebGL: true
- console errors: 0
- page errors: 0
- desktop `/universe`: HTTP 200
- canvas: 1
- WebGL: true
- console errors: 0
- page errors: 0

### Production World
Authoritative URL:
`https://allphaweb-production.up.railway.app/world?world_id=b97e25db-54ac-472d-92ed-e4a8eac85a0e`

- HTTP: 200
- canvas: 0
- WebGL: false
- browser GLB responses: 0
- browser runtime therefore fails the World rendering gate.

This is the current RED. Do **not** mark V2.13D.6 GREEN.

The World ID was taken from the production Supabase `public.universe_worlds` data:
`b97e25db-54ac-472d-92ed-e4a8eac85a0e`
for Crystal AI City World.

The next agent must inspect why the authoritative `/world?world_id=...` route reaches HTTP 200 but does not mount `AllphaWorldRenderer` in the production browser.

Do not invent another World ID merely to bypass this failure.

---

# 4. 3D THEME MASTER TARGET

## Canonical matrix

**25 Themes × 14 Categories = 350 Theme V2 production assets/templates**

### 25 themes
1. aurora-kingdom
2. celestial-samurai
3. chronos-realm
4. coral-metropolis
5. crystal-ai-city
6. desert-starfall
7. dragon-dominion
8. dream-carnival
9. emerald-rainforest
10. floating-garden
11. galactic-frontier
12. heroic-nexus
13. kingdom-of-aether
14. lunar-frontier
15. mars-frontier
16. mystic-academy
17. neo-jakarta-2099
18. neon-tokyo
19. nusantara-raya
20. oceanic-atlantis
21. pharaoh-eternal
22. quantum-city
23. savanna-spirit
24. skyforge-empire
25. viking-fjord

### 14 canonical categories
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

Do not silently change the 25×14 contract.

---

# 5. 3D RENDERER / BLENDER PATTERN

## Blender
Blender is the deterministic authoring/export layer.

Its responsibility:
- geometry
- material/PBR-like structure
- environment
- landmarks
- camera
- lighting
- animation assets
- GLB export
- preview evidence
- metadata

Blender is NOT the runtime authority.

## Runtime
The production chain is:

**Supabase Theme / Theme Version / Theme Asset**
→ **FastAPI public runtime manifest**
→ **signed Storage URL**
→ **ThemeV2ProductionAssetScene**
→ **useGLTF(signed_url)**
→ **AllphaWorldRenderer**
→ **Three.js / React Three Fiber browser runtime**

The renderer must not invent asset records.

## Theme identity
Theme differentiation must affect real geometry/spatial grammar, not only palette.

Crystal AI City is the Golden Benchmark.

The 25 themes must have meaningful differences in:
- geometry language
- spatial hierarchy
- landmark silhouettes
- district grammar
- materials
- atmosphere
- lighting
- camera
- character/wardrobe
- portals
- booth language
- capsule language
- live-stage language
- FX

---

# 6. FULL IMPLEMENTATION PHASE MAP

The following is the canonical delivery sequence from `docs/IMPLEMENTATION_PHASES.md`. Statuses must always be reconciled against the latest repository audit before claiming completion.

## PHASE 00 — Governance & Repository Foundation
Mission:
- AGENTS.md
- monorepo boundaries
- three independently deployable applications
- source-of-truth rules
- engineering documentation

Status: implemented foundation / governance baseline.

## PHASE 01 — Design System & UI Foundation
Mission:
- design tokens
- typography
- spacing
- responsive system
- accessibility
- light/dark/system
- PWA shell
- navigation
- command surfaces

Status: foundation implemented; later UI/UX refactor extends this.

## PHASE 02 — Complete UI/UX Information Architecture
Mission:
- route/screen inventory
- page states
- forms/tables/cards
- feed/reels
- profile
- Agent
- World
- Booth
- Admin control-plane surfaces

Status: foundation / expanded through WEB refactor.

## PHASE 03 — API Contract Layer
Mission:
- OpenAPI
- schemas
- errors
- pagination/filter/sort
- idempotency
- versioning
- Web/Admin boundaries
- shared contracts

Status: implemented foundation; runtime integration continues through later phases.

## PHASE 04 — Supabase PostgreSQL Data Foundation
Status: **IMPLEMENTED**
Mission:
- PostgreSQL
- migrations
- pgvector
- storage
- realtime
- grants/RLS
- constraints/indexes
- audit primitives

## PHASE 05 — Identity, Authentication & Authorization
Status: **IMPLEMENTED**
Mission:
- Auth
- sessions
- profiles
- RBAC
- permissions
- organization authorization
- JWT/JWKS
- Web/Admin SSR auth
- RLS alignment

## PHASE 06 — Human & AI Identity Foundation
Status: **IMPLEMENTED**
Mission:
- Human Identity
- AI Identity
- Agent lifecycle
- persona
- Passport
- verification
- capabilities
- skills
- permissions
- autonomy
- budget
- credentials
- reputation read model

## PHASE 07 — Agent Memory & Knowledge
Status: **IMPLEMENTED**
Mission:
- memory lifecycle
- knowledge/chunks/provenance
- embeddings
- semantic retrieval
- retention
- review/delete
- access audit
- ownership/RLS

## PHASE 08 — Personalization Intelligence
Status: **WEB ACTIVATED / IMPLEMENTED**
Mission:
- interests
- passions
- habits
- goals
- affinity
- personalization signals
- Agent-scoped context
- discovery relevance

## PHASE 09 — Social Graph & Relationship Engine
Status: **WEB ACTIVATED / IMPLEMENTED**
Mission:
- Human↔Human
- Human↔Agent
- Agent↔Human/Agent
- follow
- friend
- mentor
- partner
- client
- supplier
- collaborator
- trusted_agent
- requests
- blocks
- notifications
- activity

## PHASE 10 — Content Platform
Status: **WEB ACTIVATED / IMPLEMENTED**
Mission:
- Post
- Image
- Video
- Carousel
- Article
- Document
- Presentation
- Podcast
- Audio
- Tutorial
- Infographic
- Research
- AI Capsule
- revisions
- media
- moderation
- telemetry

## PHASE 11 — Feed, Reels & Discovery
Status: **WEB ACTIVATED / IMPLEMENTED**
Mission:
- Home
- Following
- For You
- Reels
- Explore
- ranking
- exposure
- novelty
- diversity
- feedback
- telemetry

### PHASE 11A — Allpha Universe Discovery Engine & Feed Experience
Status: **WEB ACTIVATED / IMPLEMENTED; full completion remains in progress**
Mission:
- Universe discovery
- Universe Scroll
- Moments
- Worlds
- Live Now
- Content Gravity
- search
- spatial/2D progressive presentation

### PHASE 11A.4 — Content Gravity Engine
Status: **IMPLEMENTED FOUNDATION**
Mission:
- relevance layer over canonical Feed
- personalization affinity
- topic/world context
- reason codes
- no duplicate recommendation engine

### PHASE 11A.5 — Ask the Content
Status: **IMPLEMENTED FOUNDATION**
Mission:
**Content → authorized context → optional Agent Memory/Knowledge → AI Gateway → answer**
- no direct Agent action
- action is Agent Runtime handoff

### PHASE 11A.6 — Content Evolution
Status: **IMPLEMENTED FOUNDATION**
Mission:
**Original → AI Summary → Discussion → Related Content → Live Experience → World**

### PHASE 11A.7 — Agent Intelligence Layer on Content
Status: **IMPLEMENTED FOUNDATION**
Mission:
**Content Context → owned Agent → reviewed evidence → optional Memory/Knowledge → AI Gateway → Agent Insight**

### PHASE 11A.8 — Optional Agent Companion
Status: **IMPLEMENTED FOUNDATION**
Mission:
- contextual Agent companion
- reuse Agent Intelligence
- no second conversational engine
- actions remain Agent Runtime

### PHASE 11A.10 — Agent Skill / Type / Character Catalog
Status: **IMPLEMENTED FOUNDATION**
Mission:
- canonical Agent skill/type/character catalog
- runtime-ready character relationships

### PHASE 11A.11 — Universal Allpha Agent Catalog Expansion
Status: **IMPLEMENTED FOUNDATION**
Mission:
- expand canonical Agent catalog without duplicate Agent engines.

### PHASE 11A.12 — Allpha Agent Factory
Status: **IMPLEMENTED FOUNDATION**
Mission:
- canonical Agent creation/factory boundary.

### PHASE 11A.13 — Real Agent Activation E2E
Status: **IMPLEMENTED FOUNDATION**
Mission:
- real owned Agent activation
- runtime lifecycle
- authority

### PHASE 11A.14 — Real Runtime Activation & Completion
Status: **IMPLEMENTED FOUNDATION**
Mission:
- complete Agent runtime activation
- real data and runtime gates.

## PHASE 12 — Community Platform
Status: **WEB COMPLETED / RUNTIME GATE DEFERRED**
Mission:
- community
- members
- posts
- spatial/social relationships
- Community↔Content↔Agent↔World

## PHASE 13 — Messaging & Social Communication
Status: **WEB ACTIVATED / IMPLEMENTED; runtime completion gates remain**
Mission:
- Human↔Human messaging
- Human↔Agent
- Agent↔Agent
- conversations
- contextual communication
- social notifications

## PHASE 14 — AI Gateway & Model Router
Status: **IMPLEMENTED**

## PHASE 14A — AI Provider Activation & Runtime Readiness
Status: **IMPLEMENTED**
Mission:
- provider configuration
- model routing
- runtime readiness
- cost/latency boundaries

## PHASE 15 — Agent Runtime & Command System / Execution
Status: **IMPLEMENTED**
Mission:
- Agent command lifecycle
- capability
- permission
- policy
- risk
- approval
- execution
- audit
- re-check

## PHASE 16 — Workflow & Mission Engine
Status: **IMPLEMENTED FOUNDATION / WEB ACTIVATED**
Mission:
- workflows
- missions
- execution
- Agent orchestration

## PHASE 17 — AI Universe
Status: **WEB/UI ACTIVATED / IMPLEMENTED / RUNTIME E2E PENDING**
Mission:
- Galaxy/World/Agent spatial universe
- AI Universe presentation

## PHASE 17.1 — Living Universe 3D Experience
Status: **WEB/UI ACTIVATED / RUNTIME E2E PENDING**
Mission:
- living spatial environment
- Agent presence
- real-time spatial behavior

## PHASE 18 — Agent Simulation & Spatial Runtime
Status: **IMPLEMENTED FOUNDATION / DATABASE VERIFIED; runtime completion required**
Mission:
- spatial simulation
- Agent presence
- movement
- state
- spatial runtime.

## PHASE 19 — Districts
Status: **IMPLEMENTED FOUNDATION / SPATIAL LAYER ACTIVATED**
Mission:
- Districts
- Zones
- Buildings
- Roads
- coworking
- meeting rooms
- events
- marketplace/Agent/community zones
- pricing
- availability
- realtime presence

## PHASE 20 — Booth / Tenant Platform
Status: **IMPLEMENTED FOUNDATION**
Mission:
- Personal/Creator/Agent/Business Booths
- Store
- Office
- Studio
- Community Space
- Event Venue
- Collaboration Space
- members
- catalogs
- visitors
- events
- leases
- availability
- pricing
- billing
- AI host
- reputation

## PHASE 21 — Theme & World Builder
Status: **IMPLEMENTED FOUNDATION + lifecycle hardening**
Mission:
- Theme
- Theme Version
- Theme Asset
- World Template
- Builder State
- publishing
- moderation
- performance
- safety
- governance

## PHASE 21.5 — Allpha 25 Theme 3D Asset Pack
Status: **IMPLEMENTED FOUNDATION / original storage activation was pending; V2.13D.4 later promoted the approved macro subset**
Mission:
- canonical 25 platform Themes
- 25 published Theme Versions
- 3D asset catalog
- no duplicate Theme records.

## PHASE 22 — Live Stories / Streaming / Experiences
Status: **template catalog implemented; runtime subphases are foundation**

### 22A — Live Session Core
Status: **IMPLEMENTED FOUNDATION**

### 22B — Human Owner → Owned AI Agent Collaboration
Status: **IMPLEMENTED FOUNDATION**

### 22C — Live Agent Runtime / AI Gateway Activation
Status: **IMPLEMENTED FOUNDATION**

### 22D — Realtime Live Conversation / Audience Runtime
Status: **IMPLEMENTED FOUNDATION**

### 22G — Live Experience 3D Stage + Human Presentation Runtime
Status: **IMPLEMENTED FOUNDATION**
Mission:
Human Live Session → Live Template → Theme 3D Stage → optional Stage asset → Owned Agent Collaboration → camera → human verification → uniform → presentation binding → Live activation.

### 22H — Platform Uniforms / GPT-Live Character Runtime
Status: foundation / runtime E2E pending.
Mission:
- Human uniform/costume
- AI character
- realtime voice
- GPT-Live/realtime model path through canonical AI Gateway
- presence

### 22I — AI Character Asset + Animation Contract
Status: **IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**
Mission:
- AI Character runtime catalog
- CharacterAnimationSignal
- idle/listening/thinking/speaking/emphasis/greeting/farewell
- animation contract
- asset binding
- runtime orchestration

## PHASE 23 — AI-to-AI Collaboration
Status: **foundation increments implemented**

### 23A — Discovery + Eligibility + Collaboration Request
Status: **IMPLEMENTED FOUNDATION**

### 23B — Agent DM + Negotiation
Status: **IMPLEMENTED FOUNDATION**

### 23C — Human Approval + Collaboration Agreement
Status: **IMPLEMENTED FOUNDATION**

### 23D — Execution
Status: **IMPLEMENTED FOUNDATION**

### 23E — Review + Reputation + History
Status: **IMPLEMENTED FOUNDATION / REAL COLLABORATION E2E PENDING**

Mission:
- execution results
- review
- reputation
- history

## PHASE 24 — Marketplace & Commerce
Status: **IMPLEMENTED FOUNDATION / PAYMENT PROVIDER E2E PENDING**
Mission:
- marketplace listings
- Human/Agent/Organization/Booth seller bindings
- orders
- payment
- commerce events
- seller/service relationships

## PHASE 25 — Economy, Credits & Billing
Status: **IMPLEMENTED FOUNDATION / Midtrans E2E configuration pending**
Mission:
- plans
- subscriptions
- features
- entitlements
- usage
- invoices
- billing events
- AI Credits
- consumption
- pricing/revenue
- district pricing

Authoritative AI credit ledger remains the existing canonical ledger. Never create a second wallet/credit engine.

## PHASE 26 — Security, Governance & Trust
Status: **OPEN**
Current blocker from repository:
- Security Advisor has remaining Auth finding: `auth_leaked_password_protection`.

Already implemented/revalidated areas include:
- SECURITY DEFINER audit
- anonymous EXECUTE hardening
- RLS coverage
- IDOR/BOLA regression
- session revocation
- distributed rate limiting
- CSP baseline
- CI secret/dependency gates
- live security checks

**Do not advance as fully closed until the Auth finding is resolved and Security Advisor is clean.**

## PHASE 27A — Super Admin Control Plane Foundation
Status: **IMPLEMENTED FOUNDATION**

## PHASE 27B — Super Admin Analytics + Master Data
Status: **IMPLEMENTED FOUNDATION**

## PHASE 27C — Super Admin Domain Operations / Transaction Explorer / Master Data
Status: **IMPLEMENTED FOUNDATION / NOT GREEN**
Mission:
- domain operations
- transaction explorer
- commerce/payment/billing/credit drilldown
- master data governance
- authoritative admin operations

## PHASE 27D — Completion Wave Checkpoint
Mission:
- reconcile admin domain evidence
- completion checkpoint.

## PHASE 28 — Analytics, Observability & Operational Intelligence
Status: **COMPLETION WAVE ACTIVE**
Mission:
- product/Agent/content/recommendation events
- AI usage/cost/latency/errors
- audit telemetry
- business metrics
- health signals
- trace correlation
- dashboards

## PHASE 29 — API Integration & Local E2E Wiring
Status: **COMPLETION WAVE ACTIVE**
Mission:
- Web→API
- Admin→API
- API→Supabase
- AI Gateway
- workflows
- storage
- realtime
- auth
- authorization
- errors
- idempotency
- local contracts

## PHASE 30 — Full Feature Activation
Status: **COMPLETION WAVE ACTIVE**
Mission:
Every UI surface must be connected to:
- API
- persistence
- workflow
- realtime
- authorization
- audit
- analytics

Remove non-functional stubs and reconcile cross-domain state/navigation.

## PHASE 31 — End-to-End QA & Security Verification
Status: pending/future gate
Mission:
- unit
- integration
- API contract
- DB/RLS
- Auth/Authz
- Agent commands
- approvals
- commerce idempotency
- security
- prompt injection
- abuse/moderation
- accessibility
- visual regression
- mobile/desktop
- critical E2E

## PHASE 32 — CI/CD
Mission:
- lint
- typecheck
- Python checks
- tests
- migrations
- RLS tests
- builds
- artifact generation
- dependency/security scanning
- environment separation
- deployment pipelines

## PHASE 33 — Runtime Verification
Mission:
- Web
- Admin
- API
- Supabase
- Auth
- RLS
- realtime
- storage
- AI Gateway
- Model Router
- workflows
- Agent commands
- approvals
- commerce
- admin CRUD
- audit
- observability
- real-data smoke tests

## PHASE 34 — Staging / Production Readiness
Mission:
- staging/production environments
- secrets
- migrations
- backup/recovery
- rollback
- capacity
- domains/SSL
- monitoring
- alerts
- incidents
- privacy/compliance

## PHASE 35 — Production Deployment & Final Green Gate
Mission:
- production deployment
- migration
- smoke tests
- critical E2E
- Security Advisor
- RLS
- runtime/monitoring
- rollback
- architecture audit
- prohibited-data audit
- accessibility
- final build/deployment verification

## PHASE 36–38 — Reserved Product Expansion
Future owner-approved expansion only after current canonical delivery sequence.

---

# 7. WEB UI/UX REFACTOR TRACK

The Web App is being fully redesigned/reconciled against the supplied visual references.

The target is NOT a generic dashboard.

The target is:
- cinematic
- spatial
- Universe/Galaxy/World oriented
- mobile-first
- premium
- layered
- responsive
- AI-native
- 3D-aware
- progressive 2D/2.5D/3D
- consistent with Crystal AI City visual language.

Canonical Web refactor documents:
- `docs/architecture/ALLPHA_WEB_UI_UX_ARCHITECTURE_V2.md`
- `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
- `docs/architecture/ALLPHA_WEB_DESIGN_SYSTEM_FOUNDATION.md`
- `docs/architecture/ALLPHA_WEB_PWA_FOUNDATION.md`
- `docs/architecture/allpha-web-ui-ux-baseline.json`

## WEB phases

### WEB-01 — Baseline & Frontend Reconciliation
Mission:
- inspect existing Web
- remove obsolete assumptions
- reconcile routes/components/API
- establish canonical UI baseline.

### WEB-02 — Design System Foundation
Mission:
- typography
- tokens
- surfaces
- buttons
- cards
- spacing
- responsive rules
- motion
- accessibility.

### WEB-03 — PWA Foundation
Mission:
- installability
- manifest
- service worker
- offline
- update behavior
- mobile shell.

### WEB-04 — Mobile Navigation
Mission:
- mobile-first navigation
- safe area
- touch
- Universe-oriented navigation.

### WEB-05 — Universe Shell
Mission:
- global spatial shell
- layered Universe navigation
- top/bottom control model
- responsive shell.

### WEB-06 — Splash + Identity
Mission:
- public entry
- splash
- Allpha identity
- transition into Universe.

### WEB-07 — Universe Home
Mission:
- Universe entry
- cosmic/spatial hero
- navigation into Galaxy
- real Theme V2 visual identity.

### WEB-08 — Galaxy Navigator
Mission:
- Galaxy presentation
- orbital/constellation navigation
- World discovery
- spatial hierarchy.

### WEB-09 — World Experience
Mission:
- actual World environment
- District anchors
- World renderer
- theme asset consumption
- presence/content/portal relationships.

### WEB-10 — District Experience
Mission:
- District environment
- Zones
- Booth clusters
- paths
- spatial interactions.

### WEB-11 — Booth / Tenant
Mission:
- Booth as spatial/social/commerce presence
- tenant identity
- Content Capsule anchors
- Agent/Host relationship
- portal.

### WEB-12 — Agent Experience
Mission:
- Agent as inhabitant/presence
- Passport
- Character
- skills
- authority
- memory/knowledge
- contextual actions.

### WEB-13 — Universe Moments
Mission:
- spatial/social moments
- live/content relationships
- discovery.

### WEB-14 — Content Capsule
Mission:
- Content as spatial Capsule
- Content/Feed Universe
- topic/gravity relationships
- media
- Agent
- World
- Community
- Live links.

### WEB-15 — Ask Content
Mission:
- contextual AI interaction
- authorized Content context
- optional Agent intelligence
- AI Gateway
- no direct action execution.

### WEB-16 — Create Experience
Mission:
- content creation
- Agent creation
- World/Theme creation
- spatial creation flows
- V2 visual reconciliation.

### WEB-17+ onward
Read the latest `ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md` before implementing later surfaces. The repository may contain additional WEB phases for social, community, messages, theme builder, control center, map, 82-domain map, responsive, performance, accessibility, PWA QA, E2E, security, visual QA, runtime validation and CW-02 closure.

These later phases include the documented:
- WEB-18 Social
- WEB-19 Community
- WEB-20 Messages/Collaboration
- WEB-22 Theme Builder
- WEB-23 Human Control Center
- WEB-24 Universe Map
- WEB-25 82-Domain Experience Map
- WEB-26 Responsive Engineering
- WEB-27 Performance
- WEB-28 Accessibility
- WEB-29 PWA Install QA
- WEB-30 E2E Journeys
- WEB-31 Security/Authority QA
- WEB-32 Visual QA
- WEB-33 Runtime Validation
- WEB-34 CW-02 Closure Evidence

Exact current status for each must be reconciled from the repository before claiming GREEN.

---

# 8. 3D-V2 PHASE MAP

The repository's 3D audit track includes:
- V2.01 Art Direction
- V2.02 Universe/Galaxy/Orbit
- V2.03 Geometry/Material Factory
- V2.04 Character/Live V2
- V2.05 Universe/Galaxy/Orbit composition
- V2.06 World/District/Booth
- V2.07 Capsule/Content/Feed Universe
- V2.08 Live/Human AI Collaboration Stage
- V2.09A Production 3D Art Asset Pipeline
- V2.09B Cinematic Rendering / Lighting / Material Realism
- V2.09C Environment Detail / Shaders / Atmosphere / Theme Polish
- V2.09D Real-time Spatial Motion / Camera / Interaction
- V2.09 Theme V2 350 Visual Realization
- V2.10 Portal / Navigation / Spatial FX
- V2.11 Production Asset Activation / Renderer Cutover
- V2.12 Full Theme V2 Runtime Visual QA
- V2.13 Production Realistic Art Reconstruction
- V2.13A/B/C/D and subsequent promotion/runtime gates.

## V2.13A
Production-realistic Golden art generator.
Golden reference: Crystal AI City.
14 categories.
Presentation-only Blender output.

## V2.13B
Golden validation / guarded Storage activation foundation.
Promotion approval required.
No automatic production mutation.

## V2.13C
25-theme deterministic factory:
**25 × 14 = 350**
12 theme dimensions:
- geometry
- material
- atmosphere
- architecture
- landmark
- district
- character
- portal
- lighting
- camera
- motion
- FX

## V2.13D
Production expansion + human visual fidelity pipeline.

### V2.13D.1 / D.1A
Production evidence/review / R3 golden gate.
25 themes × 14 categories.

### V2.13D.2
Storage activation preflight.
Status: **GREEN / LOCKED**.

### V2.13D.3
Human Visual Fidelity Review.
Initial review:
**REJECTED / remediation required.**
Reason: world-scale structural grammar too similar.

### V2.13D.3A
Structural Theme Fidelity Remediation.
Scope:
**100 macro assets only = 25 themes × Universe/Galaxy/World/District.**
Automated structural gate became GREEN.
Status: **GREEN / LOCKED**.

### V2.13D.3B
Human Visual Fidelity Re-Review.
Result:
**REJECTED / remediation required.**
Automated D3A was not enough for human visual benchmark.

### V2.13D.3C
Cinematic Visual Fidelity Remediation.
Scope:
**100 macro assets only.**
Removed common city grammar for the four macro categories.
25 themes × 4 categories.
Automated gate:
**GREEN / LOCKED**.

### V2.13D.3D
Human Visual Fidelity Re-Review.
User-confirmed review record:
**APPROVED**
10 criteria PASS:
- Theme identity
- Geometry/spatial hierarchy
- Silhouette/massing
- Negative space/composition
- Category fidelity
- Material/PBR
- Lighting/atmosphere
- Camera/cinematic framing
- Mobile/browser plausibility
- Cross-theme differentiation

Important: the user confirmed the contact-sheet review. Do not claim the AI itself visually inspected the binary artifact unless it actually did.

### V2.13D.4
Explicit Production Promotion & Storage Gate.
Status: **GREEN / LOCKED** according to user-confirmed production run.
Scope:
**100 macro assets**
- 25 themes
- Universe
- Galaxy
- World
- District

Bucket:
`allpha-world-assets`

Root:
`theme-v2-real-3d/v2.13`

Promotion registers:
`public.theme_assets`

### V2.13D.5
Runtime Asset Activation / Consumption Verification.
Status: **GREEN / LOCKED**.

Verified:
- FastAPI public manifest
- 25 themes
- 4 active assets/theme
- 100 assets
- signed URLs
- 206 range responses
- GLB `glTF` header
- canonical renderer source consumption
- V2.13D.4 metadata/path binding.

### V2.13D.6
Production PWA / Browser Runtime Verification.
**CURRENT PHASE — RED / NOT GREEN.**

Goal:
Prove actual browser runtime:
- mobile Universe
- desktop Universe
- Production World
- WebGL
- browser GLB consumption
- no console/page errors.

Current observed:
- Universe mobile: PASS
- Universe desktop: PASS
- Production World HTTP 200 but:
  - canvas 0
  - WebGL false
  - GLB browser responses 0
  - therefore World runtime gate fails.

Next exact objective:
**repair the production World browser runtime mounting/renderer path, without changing already-GREEN D5/D4/D3C assets.**

---

# 9. COMPLETION WAVES

Read:
`docs/architecture/ALLPHA_FULL_COMPLETION_WAVE_EXECUTION_REGISTER.md`

## CW-01 — Evidence Lock & Domain Completion
Status: **CLOSED**

## CW-02 — Agent + Content Activation
Status: **ACTIVE**
Includes:
- runtime repair
- real Agent activation
- Web Universe entry
- frontend UX realization
- runtime reconciliation

## CW-03 — Messaging / Agent Service / Skill Challenge
Mission:
- messaging
- Agent service
- skills
- challenge/activation.

## CW-04 — World / Theme / 3D Activation
Mission:
- World
- Theme
- 3D
- renderer
- asset activation
- runtime visual verification.

## CW-05 — Live / AI Character Runtime
Mission:
- Live
- AI Character
- realtime voice
- animation contract
- runtime.

## CW-06 — Commerce / Billing / Creator Economy
Mission:
- marketplace
- payments
- AI credits
- billing
- creator economy
- payout.

## CW-07 — Observability / Evaluation / Security
Mission:
- telemetry
- evaluation
- security
- trust
- governance.

## CW-08 — E2E / CI / Staging / Production Green Gate
Mission:
- E2E
- CI
- staging
- production
- final green gate.

---

# 10. NEW / EXPANDED PRODUCT DOMAINS IN MASTER PRD

These must be treated as first-class product/domain concerns and mapped to existing engines.

## Spatial Universe
- Universe
- Galaxy
- Orbit
- World
- District
- Zone
- Booth
- Portal
- Spatial Map
- Spatial Navigation
- Presence

## Theme / World
- Theme Catalog
- Theme Version
- Theme Assets
- Theme Builder
- World Template
- World Builder
- Theme/World publishing
- moderation
- performance validation
- asset lifecycle

## 3D Template System
The Theme V2 target includes:
- Galaxy 3D templates
- World 3D templates
- District 3D templates
- Booth 3D templates
- Agent Character templates
- Content/Feed Universe templates
- Capsule templates
- Portal templates
- Live Stage templates
- Human Live/Uniform templates
- Sticker/Social 3D templates
- Animation contracts/assets
- Navigation FX.

## Content / Feed Universe
- Content Capsule
- Feed Universe
- Galaxy Content
- Content Gravity
- Topics
- AI Summary
- Related Content
- Content Evolution
- World relationship
- Agent relationship
- Community relationship
- Live relationship
- Ask Content.

## AI Agent
- Human-owned Agent
- Agent Passport
- Agent Identity
- Agent Character
- Agent Skills
- Agent Capabilities
- Agent Permissions
- Agent Policy
- Agent Risk
- Agent Approval
- Agent Memory
- Agent Knowledge
- Agent Context
- Agent Intelligence
- Agent Companion
- Agent Presence
- Agent Collaboration
- Agent Negotiation
- Agent Generate
- Agent Ask
- Agent Live
- Agent reputation
- Agent history.

## AI Agent Generate / Ask
The intended experience includes:
- Message → Ask Agent
- Message → Generate with Agent
- Content → Ask Agent
- Content → Generate
- Content → Agent Intelligence
- Content → Agent Companion
- contextual follow-up
- grounded evidence
- optional Memory/Knowledge
- AI Gateway
- Agent Runtime handoff for actions.

Never create a second AI chat engine.

## AI Credits / AI Content
- AI Credits
- AI usage
- generation cost
- AI Content generation
- Agent generation
- Live AI usage
- entitlements
- limits
- billing
- transaction/ledger
- creator economy.

Use the existing Phase 25 economy/credit ledger and Midtrans path.

## Live Experience
- Live Theme Template
- Live Stage
- Podcast
- Talkshow
- Interview
- Product Show
- News/Discussion
- Webinar
- Conference
- Investor Pitch
- Product Launch
- AMA
- Debate
- Education
- Research
- Community
- Creator
- Shopping
- Concert
- Music
- Gaming
- Workshop
- Demo Day
- Town Hall
- Roundtable
- Coaching
- Agent-to-Agent.

## AI Live
- Human Live
- AI Character
- realtime voice
- GPT-Live/realtime model integration where supported
- audience
- presence
- WebRTC
- STUN/TURN
- moderation
- permission
- animation
- camera/face/body verification.

## AI Character / Animation
- AI Character asset
- full-body character
- face/gaze
- viseme
- idle
- listening
- thinking
- speaking
- emphasis
- greeting
- acknowledgement
- farewell
- reduced motion
- CharacterAnimationSignal
- animation contract
- theme wardrobe/uniform.

## Social 3D
- Sticker
- social 3D
- reactions
- spatial social signals
- animated social objects.

## Commerce / Economy
- Marketplace
- Booth commerce
- Agent service
- orders
- payments
- billing
- AI Credits
- creator economy
- seller payouts
- entitlements.

## Governance / Trust
- Super Admin
- transaction explorer
- master data
- security advisor
- RLS
- IDOR/BOLA
- audit
- moderation
- risk
- approval
- payout governance.

---

# 11. REPOSITORY DOCUMENTS THE NEW AI AGENT MUST STUDY

Read these before implementation.

## Highest priority — Master Context / PRD
1. `docs/continue-context/ALLPHA_MASTER_CONTINUE_CONTEXT_20261007.md` — THIS DOCUMENT
2. `docs/continue-context/ALLPHA_MASTER_CONTINUE_CONTEXT_20261005.md`
3. `docs/MASTER_CONTINUATION_CONTEXT.md`
4. `docs/MASTER_CONTINUATION_CONTEXT_PHASE23_ENGINE_3D.md`
5. `docs/MASTER_CONTINUE_CONTEXT_PHASE27C_20261004.md`
6. `docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md`
7. `docs/IMPLEMENTATION_PHASES.md`

## Architecture locks
8. `docs/architecture/ALLPHA_CANONICAL_ARCHITECTURE_BASELINE_LOCK_v1.0.0.md`
9. `docs/architecture/allpha-canonical-architecture-baseline.json`
10. `docs/architecture/ALLPHA_WEB_UI_UX_ARCHITECTURE_V2.md`
11. `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
12. `docs/architecture/ALLPHA_3D_THEME_SYSTEM_V2_MASTER.md`
13. `docs/architecture/ALLPHA_3D_V2_01_ART_DIRECTION_MASTER.md`
14. `docs/architecture/ALLPHA_WORLD_ENGINE_v1.0.md`
15. `docs/architecture/THEME_WORLD_BUILDER_ARCHITECTURE_v1.0.md`
16. `docs/architecture/AI_UNIVERSE_ARCHITECTURE_v1.0.md`
17. `docs/architecture/AI_GATEWAY_MODEL_ROUTER_v1.0.md`
18. `docs/architecture/AGENT_RUNTIME_COMMAND_SYSTEM_v1.0.md`

## Web UI / UX
19. `docs/architecture/ALLPHA_WEB_DESIGN_SYSTEM_FOUNDATION.md`
20. `docs/architecture/ALLPHA_WEB_PWA_FOUNDATION.md`
21. `docs/architecture/allpha-web-ui-ux-baseline.json`
22. `docs/UI_UX_SURFACE_INVENTORY.md`
23. all WEB audit documents under `docs/audits/WEB*.md`
24. `docs/audits/PUBLIC_ENTRY_UI_UX_REFACTOR_20261005.md`
25. `docs/audits/SPATIAL_UNIVERSE_VISUAL_ACTIVATION_20261005.md`
26. `docs/audits/THEME_V2_3D_UIUX_REFERENCE_FIDELITY_20261005.md`

## 3D audits
27. all `docs/audits/3D_V2_*.md`
28. `docs/assets/ALLPHA_25_THEME_3D_PACK_MANIFEST.json`
29. `docs/architecture/PHASE_20_REAL_STORAGE_3D_ASSET_LIFECYCLE_v1.0.md`
30. `docs/architecture/PHASE_21_5_PLATFORM_UNIVERSE_INSTANCE_PROVISIONING_v1.0.md`
31. `docs/architecture/PHASE_21_BUILTIN_PLATFORM_THEME_CATALOG_v1.0.md`
32. `docs/architecture/PHASE_22I_AI_CHARACTER_ASSET_ANIMATION_CONTRACT_v1.0.md`

## Current V2.13D evidence
33. `docs/3d/V2.13D.4-EXPLICIT-PRODUCTION-PROMOTION-STORAGE-GATE.md`
34. `docs/3d/V2.13D.5-RUNTIME-ASSET-ACTIVATION-CONSUMPTION-VERIFICATION.md`
35. `docs/3d/V2.13D.6-PRODUCTION-PWA-BROWSER-RUNTIME-VERIFICATION.md`

## Completion waves
36. `docs/architecture/ALLPHA_FULL_COMPLETION_WAVE_EXECUTION_REGISTER.md`
37. `docs/audits/CW01_FINAL_82_DOMAIN_EVIDENCE_LOCK_REGISTER_20261004.md`
38. `docs/audits/CW02R_RUNTIME_REPAIR_ACTIVATION_STABILIZATION_20261004.md`
39. `docs/audits/CW02_FRONTEND_THEME_WORLD_LIVE_RECONCILIATION_20261004.md`
40. `docs/audits/CW02_REAL_AGENT_CONTENT_ACTIVATION_CHECKPOINT_20261004.md`
41. `docs/audits/CW02_WEB_UNIVERSE_ENTRY_AUTHENTICATED_UX_20261004.md`

## AI Agent reporting
42. `docs/AI_AGENT_CODE_CONTINUATION_HANDOFF_20261002.md`
43. `docs/AI_AGENT_IMPLEMENTATION_REPORT.md`

---

# 12. SOURCE FILES THE NEXT AGENT MUST INSPECT

## 3D renderer
- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/components/world/theme-v2-production-asset-scene.tsx`
- `apps/web/lib/world-engine/scene-schema.ts`
- `apps/web/lib/world-engine/golden-scene.ts`
- `apps/web/lib/world-engine/spatial-composition-v2.ts`
- `apps/web/lib/world-engine/world-district-booth-v2.ts`
- `apps/web/lib/world-engine/asset-factory.ts`
- `apps/web/lib/live-character-v2.ts`
- `packages/design-tokens/3d-visual-language.ts`
- `packages/design-tokens/tokens.css`

## Production World route
Inspect:
- `apps/web/app/world/page.tsx`
- `apps/web/components/world/world-experience.tsx`
- `apps/web/proxy.ts`
- relevant API client helpers
- theme/world runtime API calls
- published Theme/Theme Version resolution
- World schema selection
- `AllphaWorldRenderer` conditional mount.

The current D6 RED is specifically here: the production World route returns HTTP 200 but the browser observes no canvas/WebGL/GLB request.

## Universe route
Inspect:
- `apps/web/app/universe/page.tsx`
- `apps/web/components/universe-entry-surface.tsx`
- `ImmersiveUniverseShell`
- public Universe renderer path.

Universe already passes the current D6 browser gate and must not be broken while fixing World.

---

# 13. CURRENT V2.13D.6 FIXING RULE

The next AI agent must NOT blindly add more Playwright flags.

First determine why the World component does not mount.

Required diagnostic order:

1. Open `apps/web/app/world/page.tsx`.
2. Inspect `WorldExperience`.
3. Trace `world_id` query parsing.
4. Trace API calls used to load:
   - World
   - Districts
   - Agents
   - Content
   - Portals
   - Presence
   - Theme catalog
5. Determine the exact condition that gates `AllphaWorldRenderer`.
6. Compare the production World record from Supabase.
7. Compare its `world_schema` against the renderer's required schema.
8. Verify published Theme / Theme Version selection.
9. Verify the FastAPI production responses from the browser path.
10. Check whether an API response is empty, unauthorized, malformed or mapped incorrectly.
11. Check browser network for API calls, not only GLB.
12. Check whether WorldExperience returns a legitimate empty/error state before renderer mount.
13. Only then change code.

Do NOT:
- create a synthetic World
- create a mock World schema
- bypass FastAPI
- hardcode the World
- force canvas rendering regardless of missing authoritative data
- use a different random World ID
- remove authority checks just to pass D6.

---

# 14. AI CODING AGENT IMPLEMENTATION / REPORTING CONTRACT

Every AI Coding Agent must follow this exact workflow.

## Before coding
Report:
- phase/subphase
- objective
- current status
- source evidence
- files inspected
- existing engine reused
- expected mutation boundary
- acceptance criteria
- known risks.

## During coding
Keep commits isolated.

If RED:
- identify exact root cause
- fix only RED
- test only affected scope
- do not touch GREEN history.

## After coding
Update:
1. relevant phase document
2. `docs/AI_AGENT_IMPLEMENTATION_REPORT.md`
3. relevant audit under `docs/audits/`
4. relevant continuation context if the canonical state changes.

Every report must contain:
- Phase
- Subphase
- Date
- Objective
- Scope
- Files changed
- Files not changed / locked scope
- Root cause
- Implementation
- Tests
- CI workflow/run
- Evidence artifact
- Supabase mutation: yes/no
- Storage mutation: yes/no
- Production deployment impact
- Security impact
- Status:
  - GREEN
  - RED
  - FOUNDATION
  - PARTIAL
  - BLOCKED
  - PENDING
- Remaining gaps
- Exact next action.

Never write “GREEN” merely because code compiles.

---

# 15. REQUIRED REPORTING FORMAT FOR FUTURE PHASES

Use this structure:

## Status
**[GREEN / RED / FOUNDATION / PARTIAL / BLOCKED / PENDING]**

## Objective
What this phase is supposed to achieve.

## Evidence
- CI run
- production URL
- database evidence
- Storage evidence
- browser evidence
- artifact
- test output.

## What changed
Exact files and logic.

## What did NOT change
Explicitly list locked scopes.

## Security
Authority, RLS, secrets, IDOR/BOLA, service-role exposure.

## Known gaps
What is still not proven.

## Exact next phase
Name the next phase/subphase and first gate.

---

# 16. VISUAL PRODUCT VISION

Allpha is:

**Social Network for Humans & AI Agents inside a living spatial Universe.**

The experience hierarchy is:

**Universe → Galaxy → World → District → Zone → Booth → Agent → Content/Capsule → Live Experience**

The product should feel like a living digital universe, not a SaaS admin dashboard.

## Core principles
- Human owns the Agent.
- Agent authority is bounded.
- Spatial presentation is progressive.
- Content is spatial/social context.
- Agents are inhabitants/presences.
- Booths are spaces, not profile cards.
- Live belongs to the World.
- AI belongs inside the product relationships, not as a detached chatbot.
- Theme identity must be visually meaningful.

---

# 17. EXACT NEXT EXECUTION OBJECTIVE

## CURRENT PHASE
**V2.13D.6.3 — Production 3D Visual Render Verification**

## CURRENT STATUS
**PENDING — D6.2 is GREEN; D6.3 implementation is deployed, but isolated browser visual evidence is not yet proven GREEN.**

## D6.2 closure
The previous D6.2 RED condition was repaired without changing the World authority/data model:
- canonical World remains `b97e25db-54ac-472d-92ed-e4a8eac85a0e`;
- production World route mounts a visible WebGL canvas;
- production World GLB request is proven;
- D6.2 isolated workflow run `37663320069` was SUCCESS;
- Railway Web deployment on `a71536bae13dbc4e0ada180e46eac750c948f772` was SUCCESS.

D6.2 is therefore LOCKED/GREEN.

## D6.3 objective
Prove the real authoritative V2.13 Crystal AI City World GLB is:
1. fetched through the canonical signed-URL manifest;
2. parsed into a real GLTF scene with real meshes;
3. normalized only through presentation-space framing;
4. inside the production camera viewport;
5. visibly rendered on desktop and mobile;
6. free of page/console errors.

## D6.3 implementation
Changed only the isolated production-render path:
- `apps/web/components/world/theme-v2-production-asset-scene.tsx`
- `apps/web/components/world/allpha-world-renderer.tsx`
- `tests/d6-3-production-3d-visual-render.spec.ts`
- `.github/workflows/v2-13d6-3-production-3d-visual-render.yml`

Latest Railway Web deployment:
- `ae5d2ede-d4a7-482d-b74c-5674aa795366`
- SUCCESS
- commit `3ff96cf37ae42c009bd2312c85ca8b9ab72032f5`

## D6.3 acceptance
D6.3 becomes GREEN only after the isolated browser workflow proves:
- runtime state = `visible`;
- mesh count > 0;
- non-zero bounds;
- V2.13 World GLB HTTP success;
- camera-projected geometry visible;
- WebGL canvas visible;
- desktop screenshot evidence;
- mobile screenshot evidence;
- no page/console errors.

## Separate CI issue
The broader `Allpha Universe CI` remains RED because `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are empty in the GitHub browser build environment. This is a separate CI configuration issue and must not be confused with D6.3 visual evidence.

## Locked scope
Do not modify:
- D3C/D3D/D3D.4/D5 locked evidence;
- V2.13D.4 Storage promotion;
- V2.13D.5 runtime activation;
- Supabase schema;
- World authority/data model;
- FastAPI boundary;
- canonical AllphaWorldRenderer identity;
- frontend privileged mutation/security boundary.

## Exact next action
Observe the isolated D6.3 browser workflow and inspect desktop/mobile screenshot artifacts. If RED, repair only the proven visual-render root cause. If GREEN, lock D6.3 and advance to **D6.4 — Production Visual Fidelity / Camera / Lighting / Material QA**.

# 18. NEXT PHASES AFTER D6

After D6.3 is genuinely GREEN, continue by dependency/evidence:

1. **D6.4 — Production Visual Fidelity / Camera / Lighting / Material QA**
2. D6.5 — Desktop + Mobile Production Visual QA
3. World → District → Booth visual/runtime reconciliation
4. V2.07 Content / Feed Universe spatial realization
5. V2.08 Live / Human / AI Stage runtime
6. V2.09 Portal / Navigation FX
7. V2.12 mobile performance/accessibility
8. V2.13 visual QA
9. V2.14 V1→V2 canonical cutover
10. CW-04 World/Theme/3D Activation closure
11. CW-05 Live/AI Character Runtime
12. CW-06 Commerce/Billing/Creator Economy
13. CW-07 Observability/Evaluation/Security
14. CW-08 E2E/CI/Staging/Production Green
15. Resolve Phase 26 Security Advisor blocker
16. Phase 30 Full Feature Activation closure
17. Phase 31 E2E/Security QA
18. Phase 32 CI/CD
19. Phase 33 Runtime Verification
20. Phase 34 Production Readiness
21. Phase 35 Final Production Green Gate

Do not treat this list as permission to skip dependencies.

# 19. FINAL INSTRUCTION TO THE NEW AI AGENT

You are continuing an existing production project.

**Do not restart. Do not redesign the architecture. Do not create a parallel engine. Do not invent data.**

Your first response must state:

1. You have read this Master Continue Context.
2. Which repository documents you inspected.
3. Which current phase/subphase you found.
4. What is GREEN and therefore LOCKED.
5. What is currently RED.
6. What exact evidence proves the RED.
7. What files you will inspect first.
8. What exact isolated action you will implement.
9. What you will explicitly NOT touch.
10. What evidence will determine GREEN.

Then execute.

For every implementation:
**READ → INSPECT → MAP → PLAN → IMPLEMENT → TEST → SECURITY CHECK → VERIFY → UPDATE DOCS → REPORT.**

The project's current priority is **Full Web UI/UX Refactor + Theme V2 25×14=350 spatial asset realization + production runtime activation**, with the immediate blocker being **V2.13D.6 Production World browser renderer mounting**.

Never sacrifice architectural correctness or evidence quality merely to obtain a GREEN workflow.


---

# 2026-10-08 — CONTINUATION UPDATE — V2.13D.6.4

## Current status
**V2.13D.6.4 — PENDING / IMPLEMENTED FOUNDATION.**

D6.4 implementation is committed to `main`, but it is **not GREEN** until production browser evidence is observed.

### D6.4 implementation
- Production World camera framing is now derived from the real GLB bounds and responsive viewport orientation.
- Real GLB materials are cloned and receive presentation-only PBR normalization.
- Runtime evidence exposes mesh/object/material counts, camera metrics, `ALLPHA_UNIVERSE_V2`, ACES Filmic, sRGB and exposure markers.
- Existing `Cinematic3DScene` remains the canonical lighting authority.
- Added desktop/mobile Playwright verification and CI workflow.
- No database, storage promotion, authority, or renderer architecture changes.

### D6.4 commits
- `0fc1680ad95693eb9e955af7fc2dc498c149ff78`
- `89e4f50077c1617894691d50552c167b61e8aedf`
- `229ebf7039ae26a7bbe5fe053c334e61eed7e351`
- `5fc8b4eda344479afd22f662ccfcf12436d2ddd0`
- `b69b9ce2ec26b4be663db7a654a8a59bae670ed4`

### D6.4 files
- `apps/web/components/world/theme-v2-production-asset-scene.tsx`
- `tests/d6-4-production-visual-fidelity.spec.ts`
- `.github/workflows/v2-13d6-4-production-visual-fidelity.yml`
- `docs/3d/V2.13D.6.4-PRODUCTION-VISUAL-FIDELITY-BRAND-QA.md`

## Locked scope
No changes to:
- Supabase schema
- V2.13D.4 production promotion
- V2.13D.5 lifecycle
- D3C/D3D/D3D.4/D5
- canonical `AllphaWorldRenderer`
- FastAPI authority boundary
- frontend privileged mutation rules

## Important prerequisite
D6.3 isolated browser evidence is still not observed through the available connector evidence. Therefore D6.4 must be treated as a downstream implementation/pending gate, not as proof that the World visual runtime is GREEN.

## Exact next action
1. Railway must deploy the D6.4 source commits.
2. Run `V2.13D.6.4 Production Visual Fidelity / Brand QA`.
3. Inspect desktop/mobile screenshot artifacts and browser gate logs.
4. If RED, fix only the proven D6.4 visual/runtime root cause.
5. If GREEN, lock D6.4 and advance to **V2.13D.6.5 — Desktop + Mobile Production Visual QA**.


### D6.4 build remediation update — 2026-10-08

Railway deployment `6300173d-f6c1-4788-83c3-c8473a6f0a68` initially failed during TypeScript checking after successful Next.js compilation. The failure was limited to D6.4 evidence metric literal/tuple inference in `theme-v2-production-asset-scene.tsx`.

Remediation commit:
`230645f107390a4b1b5483644998f2077958444d`

Latest deployment after remediation:
`81b83583-03c1-4245-9809-5785ee839802`

Latest deployment status at context update: **BUILDING**.

Therefore:
- D6.4 remains **PENDING / IMPLEMENTED FOUNDATION**.
- No GREEN claim is made.
- Production browser visual evidence remains the required next gate.


### D6.4 RED → isolated root-cause fix — 2026-10-08

D6.4 browser job:
- Run: `37698363804`
- Job: `113055560519`
- Result: **RED**
- Desktop: expected `visible`, received `idle` after 180s.
- Mobile: expected `visible`, received `idle` after 180s.
- Evidence artifact: `allpha-d6-4-production-visual-fidelity-evidence`, artifact ID `11516477509`.

### Proven root cause
The canonical `AllphaWorldRenderer` root declared `data-allpha-3d-asset-state="idle"` as a static React prop while D6.4's `setRuntimeMarker()` also updated that same DOM dataset imperatively. React could reconcile the static prop back to `idle`, preventing the browser gate from observing runtime progression.

### Isolated remediation
Commit:
`4334e8e43756010ac22a2a92d1c9d0e7cbed7da7`

Change:
- removed only the static `data-allpha-3d-asset-state="idle"` attribute;
- retained `data-allpha-3d-runtime="true"`;
- runtime state is now owned by the D6.4 marker lifecycle.

No asset, database, renderer architecture, FastAPI authority, or production promotion changes.

### Exact next action
1. Deploy `4334e8e...` to Railway.
2. Wait for SUCCESS.
3. Observe the new D6.4 browser workflow.
4. Inspect desktop/mobile evidence.
5. If GREEN, lock D6.4 and advance to D6.5.
6. If RED, fix only the next proven D6.4 root cause.
