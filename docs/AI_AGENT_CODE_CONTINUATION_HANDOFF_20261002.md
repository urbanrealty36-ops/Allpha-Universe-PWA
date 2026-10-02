# ALLPHA UNIVERSE — AI AGENT CODE CONTINUATION HANDOFF
## Canonical handoff for new ChatGPT / AI Agent Code conversations
**Snapshot:** 2026-10-02  
**Repository:** urbanrealty36-ops/Allpha-Universe-PWA  
**Branch:** main  
**Supabase:** AllphaDb-Universe / qltbacemtvnuzqkterly  
**Purpose:** Continue implementation without restarting, re-architecting, fabricating data, bypassing the backend, or losing the established PRD/design/engine/security contracts.

---

# 1. START HERE — REQUIRED READING ORDER

A new AI Agent Code conversation MUST read these repository files before modifying code or database:

1. `AGENTS.md` — binding engineering/security governance.
2. `docs/MASTER_CONTINUATION_CONTEXT.md` — cross-conversation state.
3. `docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md` — canonical Product + UX/UI + Design System + Design Tokens + Architecture + Engines SSOT. Current document version is **1.1.0**.
4. `docs/IMPLEMENTATION_PHASES.md` — canonical Phase 00–38 delivery sequence.
5. Relevant phase architecture/schema-contract documents under `docs/architecture/` and `docs/database/`.
6. Current repository implementation under `apps/web`, `apps/admin`, `apps/api`, `database/`, and shared packages.
7. Before any database change, inspect the live Supabase migration/schema state. Do not assume repository migrations are the same as live state.

Do not infer missing implementation from memory. Inspect the repository and live database.

---

# 2. PRODUCT IDENTITY

Product: **Allpha — The Social Network for Humans & AI Agents**

Allpha is a separate product from **Allpha AI**.

Core principle:

> Human owns the Agent. Agent represents the Human. Agent interacts with Humans and Agents. Agent acts only within human-defined authority.

Product principle:

> **Unlimited creativity, bounded authority.**

Allpha combines:
- Social Network
- AI Agents
- Content Discovery
- Interest / Passion / Habit / Goal intelligence
- Communities
- Messaging
- AI Universe / Living Virtual World
- Galaxy / World / District / Booth spatial hierarchy
- Creator Economy
- Marketplace / Commerce
- Events & Experiences
- AI-to-AI collaboration
- AI Workforce-style Agent execution boundaries
- Governance / Trust / Security
- Analytics / Observability
- Super Admin Control Plane

Economy is a domain, not the sole identity of the product.

---

# 3. ARCHITECTURE

One monorepo with three independently deployable applications:

- `apps/web` — User PWA — local port 3000
- `apps/admin` — Super Admin — local port 3001
- `apps/api` — Python/FastAPI backend — local port 8000

Future production boundaries:
- allpha.com
- admin.allpha.com
- api.allpha.com

Authoritative application boundary:

> Web/Admin → FastAPI → Supabase PostgreSQL / Storage / Realtime / AI Gateway

Web/Admin must NOT bypass FastAPI for privileged business operations.

Business source of truth:
> Backend API + Supabase PostgreSQL

Redis, browser state, caches and generated UI state are non-authoritative.

SQLite is prohibited.

---

# 4. TECHNOLOGY BASELINE

Frontend:
- Next.js
- React
- TypeScript
- Tailwind
- PWA
- responsive mobile/desktop
- light/dark/system where implemented by the Design System

Backend:
- Python
- FastAPI
- Pydantic
- async PostgreSQL access

Data:
- Supabase PostgreSQL
- pgvector
- Supabase Auth
- Supabase Storage
- Supabase Realtime

AI:
- AI Gateway
- Model Router
- provider-agnostic architecture
- Agent Runtime is the execution authority

Spatial:
- Three.js
- React Three Fiber
- WebGL
- progressive 2D → 2.5D → spatial → 3D
- future AR/VR/WebGPU compatibility

---

# 5. DESIGN SYSTEM / DESIGN TOKENS

The Master PRD is also the canonical UX/UI and Design System source.

Do NOT invent a second design system.

When implementing UI:
- inspect existing tokens/components first
- reuse existing primitives
- preserve responsive behavior
- preserve accessibility
- preserve light/dark/system behavior where already supported
- preserve navigation and information architecture
- use real API state
- provide legitimate loading / empty / error / permission-denied / not-configured states
- never use fake cards/metrics/users/Agents/content merely to make a screen look populated

Visual richness must come from the real domain model and real configuration, not fabricated business records.

Theme/visual customization must NEVER alter:
- identity ownership
- Agent ownership
- permissions
- entitlement
- billing
- reputation integrity
- ABAC
- risk
- approval
- audit
- security
- governance

---

# 6. NON-NEGOTIABLE ENGINEERING RULES

1. No hardcoded business data.
2. No fake/mock/dummy/scenario/placeholder business data.
3. No fake API responses.
4. No SQLite.
5. No frontend privileged DB access.
6. No service-role/secret credentials in browser.
7. Backend authorization + Supabase RLS are authoritative.
8. Ownership is verified server-side.
9. Client-supplied owner/role/enterprise/entitlement flags are never trusted.
10. High-risk Agent actions use policy/risk/approval where configured.
11. Never expose private chain-of-thought.
12. Sensitive inferred attributes must not be presented as definitive facts.
13. No fabricated users, Agents, content, signals, communities, Worlds, Districts, Booths, Live sessions or viewers.
14. A feature is not complete merely because code exists.
15. Relevant DB + API + authorization + security + workflow/engine + UI/UX + telemetry + tests + integration are required for implementation completion.
16. Final runtime/CI/CD/production/Green gates are separate.
17. Do not silently change the Master PRD.
18. Do not create a parallel architecture/database.
19. Do not replace Supabase.
20. Do not bypass FastAPI.
21. Do not claim GREEN without evidence.

Allowed:
- loading state
- empty state
- error state
- not configured state
- permission denied
- unavailable dependency
These are legitimate product states.

---

# 7. CANONICAL EXECUTION MODE

Every implementation task follows:

READ
→ UNDERSTAND
→ INSPECT
→ PLAN
→ VERIFY ARCHITECTURE
→ IMPLEMENT
→ APPLY MIGRATION IF REQUIRED
→ TEST
→ SECURITY CHECK
→ REVIEW
→ SELF-CHECK
→ REPORT

For database work:
1. inspect repository migration
2. inspect live migration list
3. inspect relevant live tables/RLS/grants
4. implement migration in repository
5. apply to correct Supabase project
6. run invariant/pgTAP tests
7. verify RLS/security/performance
8. verify zero fabricated business data
9. update continuation/docs

---

# 8. PHASE STATUS — IMPORTANT CURRENT TRUTH

Phases 04–20 have implementation foundations in the repository.

Phases 09–20 are implementation foundations, not final Production Green unless explicitly verified by their required E2E/build/runtime gates.

Implemented foundations include:

- Phase 04 — Supabase PostgreSQL
- Phase 05 — Auth/RBAC
- Phase 06 — Human & AI Identity
- Phase 07 — Agent Memory & Knowledge
- Phase 08 — Interest / Passion / Habit / Goal
- Phase 09 — Social Graph
- Phase 10 — Content Platform
- Phase 11 — Feed / Reels / Discovery
- Phase 12 — Communities
- Phase 13 — Messaging
- Phase 14 — AI Gateway / Model Router
- Phase 15 — Agent Runtime
- Phase 16 — Workflow / Mission
- Phase 17 — AI Universe
- Phase 18 — Agent Simulation / Spatial Runtime
- Phase 19 — Districts
- **Phase 20 — Booth / Tenant Platform**

### CRITICAL RECONCILIATION

The earlier conversation target was:

> Next implementation target: Phase 20 — Booth / Tenant Platform.

However, the current GitHub repository **already contains Phase 20 implementation**, including the final hardening migration:

`20261002030200_phase_20_agent_tier_entitlement_hardening`

Therefore a new Agent MUST NOT blindly re-implement Phase 20.

The first action in a new conversation is to inspect the current `main` state and confirm whether Phase 20 remains complete, partially changed, or has new blockers.

If Phase 20 is intact, the next domain target is:

> **PHASE 21 — Theme & World Builder**

---

# 9. LIVE SUPABASE CONNECTION

Canonical Supabase project:

- Project name: **AllphaDb-Universe**
- Project ref: `qltbacemtvnuzqkterly`
- Region: `ap-south-1`
- PostgreSQL: 17
- Supabase connector: **AllphaDb-Universe**
- Connector link id: `link_6abea4a1d170819192c3a190f3e2df4a`

Use the existing connected Supabase project. Do not create a new project.

Current live migration chain includes through Phase 20, including:

- `20261002014924` — Phase 17 AI Universe
- `20261002015308` — Phase 18 Agent Simulation / Spatial Runtime
- `20261002015537` — Phase 18 subject-owner hardening
- `20261002020600` — Phase 19 Districts
- `20261002023135` — Phase 20 Booth/Tenant
- `20261002023158` — Phase 20 Booth FK hardening
- `20261002023456` — Phase 20 Agent tier entitlement hardening

Live public tables are RLS-enabled.

Current live business data is intentionally empty across the product domains. This is expected and must not be "fixed" by seeding fake records.

Small authoritative configuration data exists where required by the platform foundation (for example platform roles/permissions and the canonical Agent tool definition). Do not treat these as business/demo seed data.

---

# 10. CURRENT DOMAIN HIERARCHY

Canonical spatial/product hierarchy:

Universe
→ Galaxy
→ World
→ District
→ Booth / Tenant
→ Theme / Scene
→ Catalog / Presentation / Media
→ Live Experience entry point

Agent-related execution:

Human
→ AI Identity
→ Agent
→ Passport / Persona / Skills / Capabilities
→ Policy / Permissions / Budget
→ Agent Runtime
→ Workflow / Mission
→ Spatial / World presence
→ Collaboration / Commerce

AI execution:

UI/API
→ AI Gateway
→ Model Router
→ provider/model
→ normalized result
→ Agent Runtime / downstream engine

Do not create a second AI execution path.

---

# 11. PHASE 17 — AI UNIVERSE

Canonical:
Galaxy → World → Interest / Content / Community / Agent / Portal / Presence

Worlds reference upstream authoritative objects rather than duplicating their source of truth.

Agent Presence is a projection and cannot grant authority.

Implemented:
- Universe Galaxy
- Universe World
- memberships
- world interests
- world content
- world communities
- world Agents
- portals
- Agent presence

Live invariant suite previously verified: 32/32.

Not final Green:
- authenticated E2E
- ownership/presence E2E
- portal/visibility E2E
- realtime runtime
- build/CI

---

# 12. PHASE 18 — AGENT SIMULATION / SPATIAL RUNTIME

Implemented:
- agent_spatial_states
- spatial_interactions
- simulation_sessions
- simulation_ticks
- spatial_runtime_events

Spatial Runtime is NOT Agent authority.

Actual Agent action remains:
Phase 15 Agent Runtime
+ Agent Policy
+ Capability
+ Risk
+ Approval
+ Budget
+ Kill Switch

Simulation must be deterministic where possible.

Principle:
> Simulation is deterministic; intelligence is selective.

Live invariant suite previously verified: 44/44.

No synthetic simulation records.

---

# 13. PHASE 19 — DISTRICTS

District is the authorization/spatial-business boundary between World and Booth.

Implemented:
- districts
- district_memberships
- district_entitlements
- district_zones
- district_access_requests
- district_activity_events
- district_access_policies
- district_access_grants

Enterprise District access:
Subject
→ authoritative attributes
→ entitlement
→ District policy
→ optional organization allowlist/grant
→ Permit/Deny
→ Audit

Fail closed.

Never trust `enterprise=true` from client.

Live invariant suite previously verified: 26/26.

---

# 14. PHASE 20 — BOOTH / TENANT PLATFORM

Current repository state: **IMPLEMENTED FOUNDATION**.

Canonical docs:
- `docs/architecture/BOOTH_TENANT_PLATFORM_ARCHITECTURE_v1.0.md`
- `docs/database/PHASE_20_BOOTH_TENANT_SCHEMA_CONTRACT_v1.0.md`
- `docs/MASTER_CONTINUATION_CONTEXT.md`
- `docs/IMPLEMENTATION_PHASES.md`
- Master PRD v1.1.0

Repository:
- `database/migrations/20261002030000_phase_20_booth_tenant_platform.sql`
- `database/migrations/20261002030100_phase_20_booth_fk_hardening.sql`
- `database/migrations/20261002030200_phase_20_agent_tier_entitlement_hardening.sql`
- `database/tests/phase_20_booth_tenant_invariants.sql`
- `apps/api/app/api/booths.py`
- `apps/web/components/booths-surface.tsx`
- PWA route: `/booths`

## Booth meaning

Booth is a spatial tenant / venue inside a District.

It is:
- not a profile-page substitute
- not the Live engine
- not an authorization bypass
- not an independent identity system

Boundary:

World
→ District
→ Booth/Tenant
→ Theme/Scene
→ Catalog/Presentation/Media
→ Phase 22 Live Experience

## Owner

Exactly one authoritative owner:
- Human
- Organization
- owned AI Agent acting under Human ownership

Agent ownership must always resolve to current Human ownership.

## Booth tiers

Current tier contract:
- Free
- Standard
- Creator
- Business
- Prime
- Event
- Enterprise

Tier is an entitlement input.

Tier is NOT authorization.

Billing/Entitlement Engine remains authoritative in later phases.

## Booth lifecycle

Create Draft
→ District Access / Entitlement
→ Theme Compatibility
→ Asset Binding
→ Submit Moderation
→ Published / Active
→ Suspend / Archive

## Booth display

Declarative scene/display supports:
- identity
- District Zone placement
- theme_key
- scene_config
- 2D
- 2.5D
- Spatial
- 3D
- catalog_config
- presentation
- image
- video
- document
- 3D scene
- display slots
- Phase 22 live_entry_config

No fake media URL may be created.

## Storage

Phase 20 registers already-owned Storage paths.

Asset registration must enforce owner-scoped Storage path prefixes.

Binary upload/storage lifecycle remains a Storage/runtime integration concern.

Assets begin pending and cannot be bound to display slots until active.

## Moderation

Booth cannot become active unless:
- moderation_status is approved
- at least one active display asset exists

Final moderation authority is not the Booth owner.

Later Super Admin / Moderation engine owns authoritative moderation decisions.

## Leasing

Phase 20 contains leasing foundation.

Do not fabricate:
- prices
- payments
- invoices
- transaction outcomes
- billing state

Commercial synchronization belongs to later Billing/Entitlement/Commerce phases.

## Phase 22 integration

`live_entry_config` is **declarative integration metadata only**.

Phase 20 does NOT implement:
- streaming engine
- camera runtime
- TTS
- AI Character runtime
- audience runtime
- realtime live media
- live collaboration execution

Those belong to Phase 22.

## Phase 20 verification

Live invariant suite:
- 25/25 passed previously.

Business records remain empty by design.

Not final Green:
- authenticated multi-user Booth E2E
- real Storage upload
- moderation decision runtime
- entitlement/billing synchronization
- lease/payment runtime
- realtime runtime
- API/PWA build
- CI
- production/runtime Green

---

# 15. PHASE 21 — NEXT DOMAIN

If Phase 20 remains intact, implement:

> **PHASE 21 — Theme & World Builder**

Implemented on main and live Supabase.

Database:
- themes
- theme_versions
- theme_assets
- world_templates
- world_template_versions
- world_builder_states

API/PWA:
- FastAPI /api/v1/themes/*
- FastAPI /api/v1/world-builder/*
- PWA /theme-builder
- PWA /world-builder

Verification:
- live migration phase_21_theme_world_builder present
- six Phase 21 tables with RLS
- eleven SECURITY DEFINER mutation/validation RPCs with empty search_path
- no Theme/Template/Builder business records seeded

Not GREEN:
- authenticated multi-user E2E
- moderation decision runtime
- real Storage/safety/performance/accessibility validation
- publication runtime
- API/PWA build and CI
- final production/runtime gates

Next: PHASE 22 — Events & Experiences / Live Stories & Streaming.

Phase 21 must consume Booth/District/World contracts already established.

Do not move Live implementation into Phase 21.

---

# 16. PHASE 22 — LIVE STORIES / STREAMING / EXPERIENCES

This is the domain previously discussed as Human ↔ AI Agent Story/Live collaboration.

Phase 22 is intended to cover:
- Live Stories
- Streaming
- Experiences
- Human ↔ AI Agent collaboration
- AI Character live presentation
- realtime audience
- camera
- voice
- TTS
- overlays
- costume/uniform/sticker/icon/animation
- interactive podcast
- talkshow
- interview
- product show
- AI newsroom
- webinar
- conference
- product launch
- AMA
- debate
- education/class
- gaming/entertainment
- virtual concert
- community show
- creator show
- shopping live
- Agent-to-Agent show where authorized

Canonical flow:

Human
→ Create Live Story
→ Select Experience Template
→ Select Participants
→ Ownership / Permission
→ Capability Check
→ Consent / Live Policy
→ Risk Check
→ AI Gateway + Agent Runtime
→ Live Session
→ Camera / Voice / AI Character / Costume / Animation / Overlay / Caption / Audience
→ Audience
→ Stop / Pause
→ Audit

Human + own Agent podcast co-host belongs to Phase 22.

AI Marketing Agent ↔ AI Research Agent collaboration is primarily Phase 23, with resulting output potentially published through Phase 22.

Character is presentation layer, never identity.

---

# 17. PHASE 23–35 ROADMAP

Phase 23 — AI-to-AI Collaboration
- discover
- evaluate
- Agent DM
- negotiate
- human approval
- agreement
- execute
- review
- reputation/history

Phase 24 — Marketplace & Commerce
- catalog
- products/services
- orders
- transactions
- payouts
- commissions
- refunds
- Agent commerce
- approval policies

Phase 25 — Economy / Credits / Billing
- plans
- subscriptions
- features
- entitlements
- usage
- invoices
- billing events
- AI credits
- consumption
- pricing/revenue
- District pricing

Phase 26 — Security / Governance / Trust
- Zero Trust
- policy/risk/approval
- audit
- moderation
- anti-impersonation
- anti-scam
- prompt-injection defense
- reputation protection
- rate limits
- kill switch
- secrets

Phase 27 — Super Admin Control Plane
- users
- Agents
- content
- communities
- Universe
- Worlds
- Districts
- Booths
- Themes
- Marketplace
- Missions
- Events
- Plans
- Features
- Entitlements
- Pricing
- Revenue
- Billing
- Credits
- AI providers/models
- policies
- security/risk
- moderation
- reports
- audit
- feature flags
- configuration
- analytics
- observability
- QA

Phase 28 — Analytics / Observability / Operational Intelligence

Phase 29 — API Integration & Local E2E Wiring

Phase 30 — Full Feature Activation

Phase 31 — E2E QA & Security Verification

Phase 32 — CI/CD

Phase 33 — Runtime Verification

Phase 34 — Staging / Production Readiness

Phase 35 — Production Deployment & Final Green Gate

Phases 36–38 are reserved for owner-approved future expansion.

---

# 18. ENGINE DEPENDENCY GRAPH

Core identity:
Human / Organization
→ Agent Identity
→ Agent Passport
→ Persona / Memory / Skills / Capabilities
→ Policy / Permission / Budget

Intelligence:
Interest
→ Passion
→ Habit
→ Goal
→ Context
→ Recommendation

Social:
Social Graph
→ Community
→ Messaging
→ Collaboration

Content:
Content
→ Feed
→ Reels
→ Discovery
→ AI Capsule

AI execution:
AI Gateway
→ Model Router
→ Agent Runtime
→ Tool Runtime
→ Workflow
→ Mission

Spatial:
Universe
→ Galaxy
→ World
→ District
→ Booth
→ Theme / Scene
→ Simulation / Presence

Experiences:
Booth / World / Community
→ Event / Experience
→ Phase 22 Live
→ Phase 23 AI-to-AI Collaboration

Commerce:
Booth / Catalog
→ Marketplace
→ Commerce
→ Billing / Entitlements
→ Economy

Governance:
All domains
→ Policy
→ Risk
→ Approval
→ Audit
→ Moderation
→ Security
→ Super Admin

No downstream domain may bypass upstream authority.

---

# 19. DATABASE / RLS RULES

All business tables must:
- use deliberate grants
- use RLS
- have server-authoritative ownership
- avoid client-trusted role/entitlement flags
- have FK/index hardening where applicable
- expose mutation through approved API/RPC boundary
- be auditable where security-sensitive
- be idempotent where required

SECURITY DEFINER functions:
- pin `search_path` safely
- minimize privileges
- revoke public/anonymous execution when not intended
- verify ownership/authorization internally
- never trust client authorization fields

Realtime:
- projection/transport only
- never authorization
- private channels require authorization-aware subscription design

---

# 20. DATA INTEGRITY RULE

The development database intentionally contains no fabricated business universe.

Do NOT insert:
- demo users
- fake Agents
- fake content
- fake communities
- fake Districts
- fake Booths
- fake viewers
- fake Live sessions
- fake recommendation signals
- fake commerce
- fake revenue
- fake payments
- fake AI outputs

If a feature has no real records, show the proper empty state.

Tests must use legitimate fixtures/test isolation only and must not pollute authoritative business state.

---

# 21. AUTHORITY BOUNDARIES

### Human
Owns Agent and defines authority.

### Agent
Represents Human and acts only within:
- capabilities
- permissions
- policies
- autonomy
- risk
- approval
- budget
- kill switch

### Agent Runtime
Owns executable Agent command lifecycle.

### AI Gateway
Owns provider/model execution boundary.

### Workflow Engine
Orchestrates; does not become a second Agent executor.

### World / Spatial Runtime
Owns spatial projection/simulation; does not grant Agent authority.

### District
Owns spatial-business access/ABAC boundary.

### Booth
Owns tenant/venue configuration; does not own identity/security/authority.

### Theme
Owns presentation/scene configuration; cannot alter authority.

### Live
Owns realtime experience/session behavior when Phase 22 is implemented.

### Commerce/Billing
Owns money/entitlement state.

### Super Admin
Owns authoritative platform configuration/moderation/governance where applicable.

---

# 22. REQUIRED REPORTING FORMAT AFTER IMPLEMENTATION

Every implementation response should report:

1. What was inspected.
2. What was implemented.
3. Files changed.
4. Database migrations created/applied.
5. API endpoints.
6. PWA/Admin surfaces.
7. Security/RLS behavior.
8. Tests/invariant results.
9. Live Supabase verification.
10. Build/runtime status.
11. Remaining blockers.
12. Exact next phase.

Never call a foundation GREEN if runtime/CI/E2E gates are pending.

Never invent commit hashes.

---

# 23. IMMEDIATE HANDOFF INSTRUCTION

When this file is read in a new conversation:

**DO NOT restart Phase 00.**

First inspect:
- `AGENTS.md`
- `docs/MASTER_CONTINUATION_CONTEXT.md`
- `docs/IMPLEMENTATION_PHASES.md`
- Master PRD
- current `main`
- current live Supabase migrations
- current relevant tables/RLS/RPCs

Then reconcile repository vs live database.

At this snapshot, Phase 20 is already present in `main` and live Supabase. Therefore:

**If Phase 20 is verified intact → continue with Phase 21 Theme & World Builder.**

If Phase 20 has changed or is incomplete, fix the actual blocker first rather than creating duplicate Booth architecture.

The previous user-facing target was Phase 20, but the repository itself is the latest authoritative state.

---

# 24. FINAL PRINCIPLE

The AI Agent Code is not being asked to merely generate code.

It is responsible for continuing a long-running product implementation while preserving:

- Product vision
- Master PRD
- UX/UI architecture
- Design System
- Design Tokens
- Domain boundaries
- Database contracts
- API contracts
- Agent Runtime
- Workflow/Mission Engine
- AI Gateway / Model Router
- Universe / World / District / Booth architecture
- Security / RLS / ABAC
- Realtime boundaries
- Auditability
- No-fake-data policy
- Phase dependencies
- Final Green gates

**Preserve architecture first. Implement second. Verify third. Claim completion only with evidence.**
