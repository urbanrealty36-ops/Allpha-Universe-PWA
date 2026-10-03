## 2026-10-02 — Intelligence/Context Reconciliation

World Engine continuation must include the existing AI intelligence stack; do not treat spatial rendering as an isolated feature.

Canonical intelligence path:
Spatial Runtime → bounded Context → Agent Memory / Knowledge RAG → Context Budget → AI Gateway / Model Router → Agent Runtime → Workflow/Mission → Policy/Risk/Approval → Execution.

Verified live foundations:
- agent_memory + agent_memory_embeddings
- knowledge_items + knowledge_chunks
- retrieve_agent_memory(...)
- retrieve_agent_knowledge(...)
- ai_gateway_requests + ai_gateway_attempts
- agent_execution_contexts
- Workflow/Mission run state
- agent_spatial_states

Implemented integration foundation:
- apps/api/app/core/agent_context.py
- apps/api/app/api/agent_context.py
- GET /api/v1/agent-context/{agent_id}
- database/tests/agent_context_learning_invariants.sql

No second Memory Engine, RAG Engine, AI Gateway, Agent Runtime or Orchestrator was created.

LLM usage policy from the source Master:
Deterministic Logic → SQL/Cache/Search/Vector → Small Model → Large Model only when required.
The context assembler itself makes no unnecessary model call.

Learning remains multi-signal:
Content → Interaction → Behavior Signal → Content Understanding → Interest → Passion → Habit → Goal/Context → Recommendation → New Interaction.
Spatial presence is contextual evidence, not authority and not sufficient as an isolated learning fact.

# MASTER CONTINUATION UPDATE — 2026-10-02 — WORLD ENGINE + 23D RECONCILIATION

> This update is authoritative for continuation only after reconciling the latest Master PRD, implementation phases, repository and live Supabase.

## Current verified state

- Phase 23A — IMPLEMENTED FOUNDATION
- Phase 23B — IMPLEMENTED FOUNDATION
- Phase 23C — IMPLEMENTED FOUNDATION
- Phase 23D — IMPLEMENTED FOUNDATION; live objects reconciled into migration history as `20261002125158 / 20261002063000_phase_23d_execution_agreement_binding_reconciliation`
- Phase 23E — remaining increment
- Phase 23 overall — IMPLEMENTED FOUNDATION / NOT GREEN
- Phase 21 Theme/World catalog — 25 platform Themes + 25 World Templates
- Phase 22 Live catalog — 25 platform Live Experience Templates
- World Engine — IMPLEMENTED FOUNDATION / NOT GREEN

## World Engine implementation

Canonical pipeline:
Theme Catalog → Theme Version → World Template → World Template Version → validated Scene Schema → Renderer → Spatial Runtime → District → Booth → Navigation → Phase 23 → Phase 22 → Character.

Implemented:
- deterministic scene schema validator/normalizer
- shared React Three Fiber / Three.js `AllphaWorldRenderer`
- real platform catalog preview at `/world`
- read-only FastAPI runtime catalog aggregation
- authorized District/Zone/Booth composition endpoint
- deterministic navigation graph utilities
- low-power renderer mode
- catalog invariant SQL tests
- no fake Storage/business/District/Booth/Agent records

Live verified:
- 25 platform Themes
- 25 platform World Templates
- 25 platform Live Experience Templates
- 0 platform Theme assets
- 0 Districts
- 0 Booths
- 0 Agent spatial states
- catalog invariants passed

Important reconciliation:
The current platform catalog is the repository/Supabase-provisioned 25-record catalog. Its names/keys are not silently replaced by the illustrative 25-name list in the newer continuation artifact. Runtime binding uses authoritative IDs and `catalog_order`.

## Immediate continuation

1. Real asset manifest/storage lifecycle without fabricated URLs.
2. District scene composition + Zone/Booth anchors.
3. Phase 18 spatial state/realtime adapter.
4. Phase 23 collaboration encounter → request → agreement → execution context.
5. Phase 22 Live entry → character presentation.
6. Mobile/performance/accessibility verification.
7. Engine/API tests and authenticated E2E.
8. Continue updating this context after each verified increment.

## Hard constraints remain unchanged

READ → UNDERSTAND → INSPECT → RECONCILE → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT.

Unlimited creativity, bounded authority. Presentation can never grant ownership, capability, permission, entitlement, approval, risk clearance, billing authority or audit authority.

---
# MASTER CONTINUATION UPDATE — 2026-10-02

> This section supersedes any older continuation state in this file. Canonical planning must reconcile the latest Master PRD, docs/IMPLEMENTATION_PHASES.md, source code, migrations and live AllphaDb-Universe before implementation.

## Canonical current state

- Repository: urbanrealty36-ops/Allpha-Universe-PWA
- Branch: main
- Supabase: AllphaDb-Universe / qltbacemtvnuzqkterly
- Master PRD: v1.1.0
- Product: Allpha — The Social Network for Humans & AI Agents
- Current domain: Phase 23 — AI-to-AI Collaboration
- Current increment: 23C — Human Approval + Collaboration Agreement
- 23A: IMPLEMENTED FOUNDATION
- 23B: IMPLEMENTED FOUNDATION
- 23C: IMPLEMENTED FOUNDATION
- 23D: next — Execution
- 23E: next — Review + Reputation + History
- Phase 23 overall: IMPLEMENTED FOUNDATION, NOT GREEN

## Canonical phase sequence

00 Governance & Repository Foundation
01 Design System & UI Foundation
02 Complete UI/UX Information Architecture
03 API Contract Layer
04 Supabase PostgreSQL Data Foundation
05 Identity, Authentication & Authorization
06 Human & AI Identity Foundation
07 Agent Memory & Knowledge
08 Interest, Passion, Habit & Goal Graph / Personalization Intelligence
09 Social Graph & Relationship Engine
10 Content Platform
11 Feed, Reels & Discovery
12 Community Platform
13 Messaging & Social Communication
14 AI Gateway & Model Router
15 Agent Runtime & Command System
16 Workflow & Mission Engine
17 AI Universe
18 Agent Simulation & Spatial Runtime
19 Districts
20 Booth / Tenant Platform
21 Theme & World Builder
22 Events & Experiences / Live Stories & Streaming
23 AI-to-AI Collaboration
24 Marketplace & Commerce
25 Economy, Credits & Billing
26 Security, Governance & Trust
27 Super Admin Control Plane
28 Analytics, Observability & Operational Intelligence
29 API Integration & Local End-to-End Wiring
30 Full Feature Activation
31 End-to-End QA & Security Verification
32 CI/CD
33 Runtime Verification
34 Staging / Production Readiness
35 Production Deployment & Final Green Gate
36–38 Reserved Product Expansion

## Phase 22 canonical sub-phases

22 template catalog → 22A Live Session Core → 22B Human Owner → Owned AI Agent Collaboration → 22C Live Agent Runtime / AI Gateway Activation → 22D Realtime Live Conversation / Audience Runtime.

Phase 22 remains FOUNDATION, not GREEN.

## Phase 23 canonical dependency map

Human Owner
→ Owned Agent
→ public discovery / eligibility
→ existing Social Graph + Blocks
→ existing Messaging consent / Agent DM
→ collaboration request
→ negotiation
→ Human approval where required
→ declarative collaboration agreement
→ existing Agent Runtime / AI Gateway
→ existing Workflow / Mission
→ review + authoritative reputation event + history

No parallel engine is permitted for Messaging, Approval, Risk, Agent Runtime, AI Gateway, Workflow/Mission or Reputation.

### 23A — Discovery + Eligibility + Collaboration Request
Implemented foundation. Uses existing Agent ownership/state/visibility, Social Blocks, Agent messaging consent and authenticated RPC/API/PWA boundaries.

### 23B — Agent DM + Negotiation
Implemented foundation. Reuses existing create_direct_conversation() and send_message(); adds collaboration negotiation state/events and the messaging-pending → open/declined bridge.

### 23C — Human Approval + Collaboration Agreement
Implemented foundation.

Implemented:
- declarative collaboration agreement and durable agreement events
- one-to-one binding to accepted collaboration request and negotiation
- reuse of existing approval_requests and risk_assessments
- one Human approval request per distinct Agent owner
- policy-version and enabled-capability snapshots for evidence/history
- risk decision approval_required with execution_recheck_required=true
- agreement lifecycle pending_approval → approved/rejected/expired/cancelled
- authenticated RPC-only mutations, participant-scoped RLS SELECT
- FastAPI agreement endpoints and PWA approval/proposal surface
- no capability/policy/permission grant and no executable code/script
- no synthetic business data

Migrations:
- 20261002062253 live: phase_23c_human_approval_collaboration_agreement
- 20261002062516 live: phase_23c_human_approval_collaboration_agreement_fk_indexes
- repository source migrations:
  - database/migrations/20261002062253_phase_23c_human_approval_collaboration_agreement.sql
  - database/migrations/20261002062516_phase_23c_human_approval_collaboration_agreement_fk_indexes.sql

### 23D — Execution
Must translate only an approved agreement into the existing Agent Runtime / AI Gateway / Workflow/Mission primitives. Re-check current ownership, active Agent state, capability, policy, kill switch, risk and approval at execution time. Agreement snapshots never become authority.

### 23E — Review + Reputation + History
Must persist review outcomes and authoritative reputation events. Reputation remains evaluation/history, never an authorization shortcut.

## Global hard constraints

- READ → UNDERSTAND → INSPECT → RECONCILE REPO + SUPABASE → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT
- Do not guess phase or architecture.
- Do not repeat implemented phases.
- No fake/mock/dummy/scenario/placeholder business data.
- No SQLite.
- No frontend bypass of FastAPI for privileged operations.
- No service-role/secret in browser.
- Theme/World presentation configuration never grants authority.
- AI Agent authority remains separate from presentation.
- Agreement data is declarative only; no arbitrary executable code/script.
- Final authenticated E2E, CI/CD, runtime, staging/production and Final Green remain separate gates in Phases 31–35.
- Domain implementation may continue incrementally before final authenticated E2E/Green.

## Final Green rule

A phase is not GREEN merely because code exists. Relevant PRD, DB, API, authorization, security, workflow/engine, UI/UX, telemetry, tests and integration must be implemented and verified. Final runtime, CI/CD, production readiness and deployment remain separate gates.

---

# ALLPHA UNIVERSE — MASTER CONTINUATION CONTEXT


## PHASE 21 — Theme & World Builder — IMPLEMENTED FOUNDATION + RUNTIME LIFECYCLE HARDENING

Implemented on `main` and applied to AllphaDb-Universe.

Database:
- `themes`
- `theme_versions`
- `theme_assets`
- `world_templates`
- `world_template_versions`
- `world_builder_states`

Migrations:
- `20261002033500_phase_21_theme_world_builder`
- `20261002040000_phase_21_theme_world_builder_runtime_hardening`
- `20261002040100_phase_21_theme_world_builder_admin_read`
- `20261002040200_phase_21_theme_world_builder_rls_policy_consolidation`
- `20261002040300_phase_21_theme_world_builder_token_namespace_fix`
- `20261002040200_phase_21_theme_world_builder_rls_policy_consolidation`
- `20261002040300_phase_21_theme_world_builder_token_namespace_fix`
- live migration versions are verified in AllphaDb-Universe.

API:
- `apps/api/app/api/themes.py`
- `apps/api/app/api/world_builder.py`
- Theme version validate/submit/publish contracts
- World Template validate/submit/publish contracts
- Platform moderation endpoints guarded by authoritative `admin.manage` permission

PWA/Admin:
- `/theme-builder`
- `/world-builder`
- `/themes` Super Admin moderation surface
- UI uses Allpha design-token CSS variables and authoritative API state only.

Security:
- Theme tokens recursively reject protected authority namespaces while allowing only `theme.*`.
- World/Builder schemas recursively reject arbitrary `code`/`script` and protected authority namespaces.
- Theme/Template publication remains gated by validation + performance + moderation.
- Platform moderation read is RLS-gated by `private.has_platform_permission('admin.manage')`.
- No frontend privileged DB access and no fabricated Storage/business records.

Lifecycle:
- Theme: Draft → Version Draft → Validation → Review → Moderation → Published/Archived.
- World Template: Draft → Version Draft → Validation → Review → Moderation → Published/Archived.
- Builder State: Draft → Validated → Submitted; it does not become an alternate World authority.

Data:
- Phase 21 business tables remain empty by design unless real users create records.
- No fake Theme, Template, Asset, World Builder, Storage or moderation records are seeded.

Verification status:
- Migration application verified live.
- Remaining final gates: authenticated multi-user E2E, real Storage asset lifecycle, actual renderer performance/accessibility validation, publication E2E, API/PWA/Admin build, CI, realtime/runtime verification where applicable, and production Green gates.

Phase 21 is **implemented foundation with lifecycle hardening**, not final GREEN.

Next implementation target:
**PHASE 22 — Events & Experiences / Live Stories & Streaming**, only after Phase 21 verification gates are explicitly reviewed.
## Purpose
This file is the cross-conversation continuation baseline for AI Agent Code working on Allpha Universe.

When a new conversation starts, read this file first, then:
1. AGENTS.md
2. docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md
3. docs/IMPLEMENTATION_PHASES.md
4. phase-specific implementation records under docs/database/
5. current repository code and live Supabase schema/migration state before changing database behavior

Do not infer missing state from memory or guess.

## Repository
- GitHub: urbanrealty36-ops/Allpha-Universe-PWA
- Account: urbanrealty36-ops
- Active branch: main
- Implementation policy: direct implementation on main
- Baseline commit before the continuation artifact was created: 19b29bca1ff99a3d1da16c10aee90b197cfbad63
- Latest commit message: docs(phase-08): add Supabase migration manifest

## Product identity
Allpha — The Social Network for Humans & AI Agents.

Allpha is distinct from Allpha AI.

Core principle:
> Human owns the Agent. Agent represents the Human. Agent interacts with Humans and Agents. Agent acts only within human-defined authority.

Core product principle:
> Unlimited creativity, bounded authority.

Allpha combines Social Network + AI Agents + Content Discovery + Interest Graph + Living Virtual World + Communities + Creator Economy + Marketplace + AI Commerce Infrastructure.

Economy is one domain, not the entire product identity.

## Architecture
One monorepo, three independently deployable applications:
- apps/web — User PWA — localhost:3000
- apps/admin — Super Admin — localhost:3001
- apps/api — FastAPI backend — localhost:8000

Future production boundaries:
- allpha.com
- admin.allpha.com
- api.allpha.com

The API contract is the application boundary. Frontend/Admin must not bypass Backend API for privileged operations.

Business-data source of truth:
> Backend API + Supabase PostgreSQL.

Redis, browser state, caches and generated UI state are never authoritative. SQLite is prohibited. No service-role/secret credential in frontend.

## Canonical technology
- Next.js / React / TypeScript / Tailwind / PWA
- Python / FastAPI / Pydantic / async PostgreSQL
- Supabase PostgreSQL + pgvector + Auth + Storage + Realtime
- Redis only as non-authoritative acceleration when later required
- AI Gateway + Model Router, provider agnostic
- Three.js / React Three Fiber / WebGL progressive enhancement

## Documentation SSOT
- Master PRD: docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md
- Governance: AGENTS.md
- Phase sequence: docs/IMPLEMENTATION_PHASES.md
- Continuation state: docs/MASTER_CONTINUATION_CONTEXT.md
- Phase 08 record: docs/database/PHASE_08_PERSONALIZATION.md
- Phase 08 migration manifest: database/migrations/PHASE_08_MIGRATION_MANIFEST.md

## Non-negotiable coding rules
1. No hardcoded business data.
2. No fake/mock/dummy/scenario/placeholder business records.
3. No fake API responses.
4. No SQLite.
5. No privileged frontend DB access.
6. No service-role credentials in browser.
7. Backend authorization + Supabase RLS are authoritative.
8. Ownership must be verified server-side.
9. High-risk Agent actions require policy/risk/approval flow where configured.
10. Never expose private chain-of-thought.
11. Sensitive inferred attributes must not be presented as definitive facts.
12. Loading/empty/error/not-configured/permission-denied states are legitimate.
13. Do not create fake users or Agents merely to make tests appear green.
14. A feature is not complete merely because code exists.
15. Completion requires relevant PRD + DB + API + authorization + security + workflow/engine + UI/UX + telemetry + tests + integration.
16. Final runtime/CI/CD/production/Green gates remain separate.

# Current phase state

## PHASE 04 — Supabase PostgreSQL Foundation
IMPLEMENTED. Core schema, pgvector, storage, realtime, grants and RLS.

## PHASE 05 — Identity, Authentication & Authorization
IMPLEMENTED. Supabase Auth, sessions, provisioning, RBAC, permissions, organization authorization foundation, JWT/JWKS, SSR auth and RLS alignment.

## PHASE 06 — Human & AI Identity Foundation
IMPLEMENTED. Human Identity, AI Identity, Agent lifecycle, Persona, Passport, verification, capabilities, skills, permissions, policies/autonomy, budget, credentials and reputation read model. Runtime execution is later.

## PHASE 07 — Agent Memory & Knowledge
IMPLEMENTED. Memory lifecycle, knowledge/chunks/provenance, embedding persistence, semantic retrieval boundary, retention/expiry, review/delete, access audit and ownership/RLS. No seed/demo data.

## PHASE 08 — Interest, Passion, Habit & Goal Graph / Personalization Intelligence
IMPLEMENTED.

### Phase 08 tables
- interest_nodes
- interest_edges
- personalization_signals
- subject_interest_affinities
- passion_clusters
- passion_cluster_interests
- habit_patterns
- personalization_goals
- goal_interest_links

All exposed Phase 08 tables have RLS.

### Interest ontology
Dynamic, versioned ontology with parent hierarchy, canonical key, lifecycle, localization and metadata. No taxonomy seed records exist.

Interest edges support parent, related, synonym, branch, merge, split and localized relationships.

### Real signals
personalization_signals stores real observations with user/Agent subject, optional interest/entity, signal type, strength, occurred_at, context and metadata. No signal records currently exist.

### Interest affinity
subject_interest_affinities stores score, confidence, evidence_count, positive_evidence, negative_evidence and observation timestamps. It changes from explicit interest input or real signals.

### Passion
Derived only from repeated positive evidence across multiple child interests sharing an active parent ontology node. A single action does not create a passion.

### Habit
Derived from repeated observations. Current Phase 08 dimensions: time_of_day and day_of_week. Do not treat habits as sensitive identity facts.

### Goal
Explicit user/Agent intent. The system does not invent goals from behavior.

### Server-authoritative RPCs
- set_subject_interest
- remove_subject_interest
- record_personalization_signal
- refresh_subject_personalization
- create_personalization_goal
- update_personalization_goal

Verified: SECURITY INVOKER; anon execute=false; authenticated execute=true.

### FastAPI
File: apps/api/app/api/personalization.py

Routes:
- GET /api/v1/personalization/ontology/interests
- GET /api/v1/personalization/me
- GET /api/v1/personalization/agents/{agent_id}
- POST /api/v1/personalization/interests
- DELETE /api/v1/personalization/interests/{interest_id}
- POST /api/v1/personalization/signals
- POST /api/v1/personalization/refresh
- POST /api/v1/personalization/goals
- PATCH /api/v1/personalization/goals/{goal_id}

Router is included in apps/api/app/main.py.

### User PWA
Implemented real API-connected routes:
- /personalization
- /interests
- /passions
- /habits
- /goals

Shared component:
apps/web/components/personalization-dashboard.tsx

The UI loads real API state, displays real ontology only, allows real interest add/remove, displays derived passions/habits, allows explicit goal creation, and has honest loading/error/empty states.

### Tests
- apps/api/tests/test_auth_contract.py includes Phase 08 unauthenticated endpoint assertions.
- database/tests/phase_08_personalization_invariants.sql contains 36 pgTAP assertions for schema, keys, RLS, RPCs and zero seed-data counts.
- Full authenticated E2E has not run because no real Auth user/Agent exists. Do not fabricate them.

## Supabase
Project: AllphaDb-Universe
Ref: qltbacemtvnuzqkterly
Region: ap-south-1
PostgreSQL: 17
Last known status: ACTIVE_HEALTHY
Supabase project connector: link_6abea4a1d170819192c3a190f3e2df4a

Phase 08 applied migrations:
- 20261002032000_phase_08_personalization_intelligence
- 20261002032100_phase_08_personalization_derived_intelligence
- 20261002032200_phase_08_fk_indexes
- 20261002032300_phase_08_passion_source_hardening

Last verified Phase 08 counts:
- interest_nodes = 0
- personalization_signals = 0
- subject_interest_affinities = 0
- passion_clusters = 0
- habit_patterns = 0
- personalization_goals = 0

This zero state is intentional.

Advisor state:
- Security: no new Phase 08 security warning. Existing six INFO findings remain on intentional backend-authoritative foundation tables.
- Performance: Phase 08 FK index findings were remediated. Remaining unused-index INFO findings are expected while the development DB is empty.

## PRD-critical personalization rules
- Interest, Passion and Habit are learned from patterns, not a single action.
- Interest ontology is dynamic: topic, merge, split, branch, trend, community emergence, synonym, localization.
- User controls include interests, content preferences, recommendation controls and history.
- User can view/modify/remove interests, reset recommendation signals, manage history, control personalization, mark not interested and control contextual personalization.
- Sensitive inferred attributes must not be presented as definitive facts.
- Later recommendation inputs include Content Graph + Interest Graph + Passion Graph + Habit Graph + Social Graph + Context Graph + Goal Graph + Freshness + Diversity + Safety.

Phase 08 is graph/personalization foundation, not final recommendation ranking.

## What is NOT complete
Do not claim Green.

Pending domains/gates include Social Graph, Content, Feed/Reels/Recommendation, Context Graph, AI Gateway/Model Router, Agent Runtime, Workflow/Mission, Universe, Simulation, Districts, Booth/Tenant, Theme/World Builder, Events, AI-to-AI Collaboration, Marketplace/Commerce, Billing/Entitlements, expanded Security/Governance, Super Admin activation, Analytics/Observability, full API integration, E2E, CI/CD, Runtime Verification, Production Readiness, Deployment and Final Green Gate.

## Phase 09 — Social Graph & Relationship Engine — IMPLEMENTED

Implemented:
- PostgreSQL social_relationships, social_blocks, social_mentions, social_activity_events, social_notifications.
- Follow and typed relationship lifecycle.
- Human/Agent subject ownership enforcement.
- Block/unblock with relationship revocation.
- Mention, activity and recipient-scoped notification flows.
- RLS, least-privilege grants and private security helpers.
- Audit triggers for relationship/block/mention mutations.
- FastAPI /api/v1/social/* endpoints.
- User PWA surfaces /social-graph, /relationships, /following, /notifications, /blocked.
- Database invariant test committed at database/tests/phase_09_social_graph_invariants.sql.
- No social seed data was inserted; current social graph tables remain empty by design.

Verification:
- All five Phase 09 tables exist and have RLS enabled.
- Public social mutation functions are SECURITY INVOKER and executable only by authenticated.
- Private authorization/audit/notification helpers are SECURITY DEFINER with an empty search_path.
- Authenticated two-party E2E has not been executed because no real Auth users/Agents should be fabricated. Therefore Phase 09 is implementation-complete foundation, not final runtime GREEN.

## Phase 10 — Content Platform — IMPLEMENTED FOUNDATION

Implemented:
- content_items
- content_media_assets
- content_media
- content_topics
- content_topic_links
- content_revisions
- content_moderation_cases
- ai_capsules
- content_events
- RLS, least-privilege grants and owner/Agent authorization helpers.
- Content lifecycle: draft → pending_review → published → archived.
- Controlled Storage bucket/path contract with owner-scoped paths.
- Publishing gate for attached media moderation/lifecycle state.
- Topic and revision foundations.
- Moderation submission foundation.
- AI Capsule persistence with provenance/model/confidence fields.
- FastAPI /api/v1/content/*.
- User PWA /content, /content/[id] and /create surfaces.
- Database invariant tests.
- No synthetic content, media, topics, creators or capsules seeded.

Verification boundary:
- Supabase schema/RLS foundation is implemented.
- Final authenticated E2E is not executed without real users/Agents.
- Actual binary Storage upload verification remains a later runtime/integration gate.
- Final moderation decision flow belongs to the later Super Admin/Moderation Engine phase.
- AI Capsule generation execution belongs to Phase 14 AI Gateway/Model Router.
- Therefore Phase 10 is implementation-complete foundation, not final runtime GREEN.

## Next logical phase
PHASE 11 — Feed, Reels & Discovery

Expected next domain:
- Home Feed
- Following Feed
- For You
- Reels
- Explore
- Live Now
- Agent Feed
- Knowledge Feed
- World Stream
- Context Feed
- ranking contracts
- freshness/diversity/novelty
- negative feedback
- recommendation events

Execution rules:
1. Re-read AGENTS.md and Master PRD.
2. Inspect Phase 10 Content Platform schema/API and Phase 09 Social Graph.
3. Do not seed content, creators, recommendations or interaction signals.
4. Feed reads authoritative Content + Social + Personalization state.
5. Ranking is a contract/engine dependency; do not hardcode a fake feed.
6. Add real event/signal persistence with RLS and honest empty states.
7. Do not claim final Green without authenticated E2E evidence.


## Critical continuation instruction
Do not restart the project, create a second architecture/database, rename/reinvent domains without approval, replace Supabase with SQLite, fabricate users/Agents/content/signals, create mock recommendations, silently change the PRD, bypass Backend API, assume code exists without inspection, or claim a phase is GREEN without evidence.

Required operating mode:
READ → UNDERSTAND → INSPECT → PLAN → VERIFY ARCHITECTURE → IMPLEMENT → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT


## Cross-domain architecture amendment v1.1 — IMPLEMENTED FOUNDATION

The Master PRD was upgraded from v1.0.0 to v1.1.0 with three additional product/domain requirements:

1. Tiered Booth/Tenant from Free through Enterprise, District-compatible themes, real image/video/presentation/PPT-compatible assets and progressive 2D/2.5D/3D Booth display.
2. Enterprise-only District isolation using backend ABAC with fail-closed authorization, entitlement, organization and explicit-grant inputs.
3. Story/Live AI Character collaboration where an owner explicitly selects an owned Agent as co-host/character, with consent, policy, risk, character/costume/overlay assets, realtime conversation and audience interaction.

Canonical documents:
- docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md — now v1.1.0
- docs/architecture/CROSS_DOMAIN_ENGINE_ARCHITECTURE_v1.1.md
- docs/database/CROSS_DOMAIN_SCHEMA_CONTRACT_v1.1.md

Supabase foundation migration:
- 20261002040000_cross_domain_booth_district_live_foundation
- 20261002040100_cross_domain_fk_indexes

Foundation tables:
- district_access_policies
- district_access_grants
- booths
- booth_leases
- booth_display_assets
- booth_display_slots
- live_sessions
- live_agent_collaborations
- live_character_assets
- live_session_overlays
- live_session_viewers

Important: this is schema/architecture foundation, NOT full runtime Green. Do not fabricate Districts, Themes, Plans, Subscriptions, Catalogs, Live streams or Agent sessions. Full activation requires the dependent domain engines and real-data E2E.

### Booth workflow
Create Draft → Entitlement Check → District Eligibility → Theme Compatibility → Asset Upload/Validation → Catalog Binding → Moderation → Publish → Active → Suspend/Archive.

### Enterprise District workflow
Subject → authoritative attributes → Enterprise Entitlement → District ABAC Policy → optional organization allowlist/grant → Permit/Deny → Audit. UI hiding is not security.

### AI Live workflow
Human starts Story/Live → selects owned Agent → Ownership/Capability → Live Policy → Consent → Risk → Character/Voice/Costume → Activate → AI Gateway/Model Router → Agent Runtime → Character/Animation → Realtime Media → Audience → Stop/Pause → Audit.

### Character rules
Character is presentation layer, not identity. Costume/uniform/sticker/icon/animation/voice cannot change Agent ownership, Passport, permissions, reputation, policy or authority. Third-party fictional characters require authoritative rights/moderation metadata; no claim of license may be fabricated.

### Next implementation sequencing
The cross-domain schema is ahead of runtime by design. Continue the existing phase order; activate each dependency when its domain arrives. Do not jump directly to production claims.


## PHASE 11 — Feed, Reels & Discovery — IMPLEMENTED FOUNDATION

Implemented on `main`.

### Database
Migration sequence:
- 20261002050000_phase_11_feed_reels_discovery
- 20261002050100_phase_11_feed_ranking_hardening
- 20261002050200_phase_11_feed_rpc_privilege_hardening
- 20261002050300_phase_11_remove_duplicate_indexes
- 20261002050400_phase_11_feed_public_execute_hardening
- 20261002050500_phase_11_dependency_surface_fail_closed

Tables:
- feed_impressions
- feed_interaction_events
- feed_feedback

RLS is enabled on all Phase 11 tables. Direct table mutation is revoked; authenticated writes use security-definer RPCs. Anonymous execution of Phase 11 RPCs is revoked.

### Ranking
`get_feed(surface, limit, offset, query)` ranks only published public content and consumes real:
- Social Graph Follow state
- Interest affinity/topic matches
- content-event engagement
- freshness
- feed exposure/novelty
- creator diversity
- explicit negative feedback

No recommendation/content/creator seed data was inserted.

### RPCs
- get_feed
- record_feed_interaction
- record_feed_feedback

### FastAPI
Added `apps/api/app/api/feed.py`, registered in `apps/api/app/main.py`.
Endpoints:
- GET /api/v1/feed
- POST /api/v1/feed/interactions
- POST /api/v1/feed/feedback

### User PWA
Added `apps/web/components/feed-surface.tsx` and connected:
- /feed → Home
- /following → Following
- /for-you → For You
- /reels → Reels
- /explore → Explore

The same engine supports dependency-aware Live Now, Agent, Knowledge, World and Context surfaces through the API contract. Reels is constrained to video content and records watch-start signals. No media URL is fabricated.

### Tests
`database/tests/phase_11_feed_reels_discovery_invariants.sql` contains 15 passing pgTAP assertions covering tables, RLS, RPC existence/security-definer state and zero seed-data counts.

### Security/performance
- Phase 11 anonymous SECURITY DEFINER execution was explicitly revoked.
- Existing intentional authenticated SECURITY DEFINER RPC warnings from the Content Platform remain; these RPCs are the backend authorization boundary.
- Development DB still reports unused-index INFO findings because the authoritative database is empty.
- Duplicate indexes introduced during Phase 11 were removed; existing equivalent indexes remain authoritative.

### Current data state
Phase 11 feed tables are empty by design. No fake impressions, interactions, feedback, creators or recommendations exist.

### Not GREEN yet
Authenticated multi-user E2E, real Storage media delivery, Live/World/Context engine activation, recommendation quality evaluation, CI/build verification, runtime verification and final production Green remain later gates.

## PHASE 12 — Community Platform — IMPLEMENTED FOUNDATION

Implemented on main.

### Database migration sequence
- 20261002060000_phase_12_community_platform
- 20261002060100_phase_12_community_rls_recursion_hardening
- 20261002060200_phase_12_community_owner_hardening
- 20261002060300_phase_12_community_rpc_privilege_hardening
- 20261002060400_phase_12_community_fk_indexes

### Tables
- communities
- community_memberships
- community_topics
- community_topic_links
- community_posts
- community_comments
- community_events
- community_event_attendees
- community_reports
- community_moderation_cases
- community_activity_events

### Authorization
Community owner can be user, owned Agent or authorized Organization. Membership roles are owner/admin/moderator/member. Join policy is open/approval/invite_only. All mutations are FastAPI + authenticated SECURITY DEFINER RPCs. Anonymous/public RPC execution is revoked.

RLS membership recursion was explicitly hardened with private security-definer helper functions.

### Content integration
Community posts reference Phase 10 content_items by content_id; author ownership and active membership are checked server-side.

### API
Added apps/api/app/api/communities.py and registered it in apps/api/app/main.py.

Endpoints include:
- GET /api/v1/communities
- GET /api/v1/communities/{id}
- POST /api/v1/communities
- GET/POST members
- leave
- membership moderation
- posts
- comments
- events
- RSVP
- reports

### User PWA
Added apps/web/components/communities-platform.tsx.
Connected:
- /communities
- /communities/[id]

UI uses authoritative API state with loading/error/empty states and no fabricated community data.

### Tests
 database/tests/phase_12_community_platform_invariants.sql contains 39 passing pgTAP assertions.

### Current data
All Phase 12 business tables remain empty by design.

### Not GREEN
Authenticated multi-user E2E, real moderation workflows, event runtime integration, community recommendation integration, CI/build verification, runtime verification and final production Green remain pending.

## PHASE 13 — Messaging & Social Communication — IMPLEMENTED FOUNDATION

Implemented on main.

### Database migrations
- 20261002070000_phase_13_messaging_social_communication
- 20261002070100_phase_13_message_notifications
- 20261002070200_phase_13_messaging_fk_indexes

### Tables
- communication_preferences
- conversations
- conversation_participants
- conversation_requests
- messages
- message_delivery_receipts
- message_reactions
- message_reports
- communication_activity_events

### Communication rules
Human↔Human, Human↔Agent, owned-Agent↔Human and owned-Agent↔owned-Agent are supported. Agent identity is always ownership-bound to its Human owner.

Recipient DM policy: open / relationships / approval / invite_only. Human/Agent inbound permission can be disabled. Existing Social Blocks are enforced bidirectionally.

### API
Added `apps/api/app/api/messaging.py` and registered it in `apps/api/app/main.py`.
Endpoints include preferences, conversations, direct conversation creation, requests, participants, messages, delivery updates, edit/delete, reactions and reports.

### User PWA
Added `apps/web/components/messaging-platform.tsx` and connected `/messages`.
The UI only renders authoritative API data and legitimate empty/loading/error states. No target identity or conversation is fabricated.

### Notifications
Message sends and conversation request decisions integrate with the existing `social_notifications` system. Agent recipients resolve to their owning Human for notification delivery.

### Realtime
Supabase Realtime publication includes conversations, conversation_participants, messages and message_delivery_receipts.

### Tests
`database/tests/phase_13_messaging_social_communication_invariants.sql` contains 41 passing pgTAP assertions.

### Current data
All Phase 13 business tables remain empty by design.

### Not GREEN
Authenticated multi-user E2E, realtime subscription runtime verification, abuse/moderation workflow verification, notification delivery verification, CI/build, runtime verification and final production Green remain pending.


## Phase 14 continuation state
Phase 14 AI Gateway & Model Router is implemented as a foundation on main. Supabase contains provider/model/policy registries, request/attempt/usage ledgers and secured RPC boundaries. FastAPI exposes the gateway and the User PWA exposes /ai with authoritative empty/not-configured states. No provider/model/request/usage seed data exists. Next dependency is Phase 15 Agent Runtime; final Phase 14 GREEN remains gated by real provider configuration and authenticated runtime/E2E verification.


## Phase 15 continuation state
Phase 15 Agent Runtime & Command System is implemented as a foundation on main. The runtime now owns command state, planning, tool materialization, risk/approval, execution, spend/rate-limit controls, kill switch and audit events. The canonical built-in ai.generate tool delegates exclusively to Phase 14 AI Gateway. No synthetic runtime records are seeded. Final GREEN requires authenticated E2E with real Agent ownership and AI provider configuration.


## Phase 16 continuation state
Phase 16 Workflow & Mission Engine is implemented as a foundation on main.

### Database
Migration: 20261002100000_phase_16_workflow_mission_engine.sql
Tables:
- workflows
- workflow_versions
- workflow_steps
- workflow_runs
- workflow_run_steps
- workflow_events
- missions
- mission_participants
- mission_runs

All nine tables have RLS. Direct table mutation is revoked from anonymous/authenticated roles. Eleven Phase 16 RPCs are SECURITY DEFINER with pinned empty search_path.

### Runtime boundary
Workflow preparation converts a published workflow version into a deterministic Phase 15 Agent plan and calls the existing Phase 15 materialize_agent_plan RPC. Workflow execution then uses the existing Phase 15 Agent Runtime. Mission runs reference Workflow Runs and never execute tools directly.

### API/UI
- FastAPI: apps/api/app/api/workflows.py, registered in apps/api/app/main.py.
- API prefix: /api/v1/workflows.
- User PWA: /workflows, apps/web/components/workflow-mission-surface.tsx.

### Verification
- database/tests/phase_16_workflow_mission_engine_invariants.sql
- Live pgTAP: 32 assertions passed.
- Live database: 9 Phase 16 tables, all RLS-enabled; 11 RPCs present and SECURITY DEFINER/search_path hardened.
- Phase 16 business tables contain zero records by design.

### Not GREEN
Authenticated real-Agent E2E, real AI provider execution, approval/resume, retry execution, schedule/event/webhook triggers, multi-participant mission runtime, CI/build, runtime verification and final Green remain pending.

### Phase 16 hardening follow-up
Additional migrations applied:
- 20261002100100_phase_16_mission_access_hardening
- 20261002100200_phase_16_mission_agent_participant_hardening
- 20261002100300_phase_16_workflow_visibility_hardening

Mission lifecycle now includes publish/open and participant approve/reject contracts. Shared mission workflow runs use an internal SECURITY DEFINER helper rather than exposing a generic cross-owner workflow-run path. Workflow definitions/versions/steps are owner-visible only; Missions are the sharing surface. Owned-Agent mission participants are supported for run initiation.

Latest live invariant verification remains 35 assertions passed; Phase 16 business data remains empty.


## Phase 17 continuation state
Phase 17 AI Universe is implemented in repository code as a foundation.

### Repository
- Database migration: database/migrations/20261002110000_phase_17_ai_universe.sql
- Invariant test: database/tests/phase_17_ai_universe_invariants.sql
- FastAPI: apps/api/app/api/universe.py, registered in apps/api/app/main.py
- User PWA: /universe via apps/web/components/universe-surface.tsx
- Architecture: docs/architecture/AI_UNIVERSE_ARCHITECTURE_v1.0.md
- Schema contract: docs/database/PHASE_17_AI_UNIVERSE_SCHEMA_CONTRACT_v1.0.md

### Domain
Galaxy → World → Interest / Content / Community / Agent / Portal / Presence.
Worlds do not duplicate upstream source-of-truth data. Agent Presence is a projection and cannot alter Agent authority.

### Security
Nine tables are RLS-protected in the migration. Direct browser mutation is revoked. Mutation RPCs are SECURITY DEFINER with pinned empty search_path and server-side ownership checks.

### Live verification
The Supabase binding is now correctly using AllphaDb-Universe (project qltbacemtvnuzqkterly). Migration 20261002110000_phase_17_ai_universe is applied. The live Phase 17 invariant suite passes 32/32. Nine Phase 17 tables are RLS-enabled and remain empty of business data.

### Phase 18 continuation state
Phase 18 Agent Simulation & Spatial Runtime is implemented on main as a foundation.

Repository:
- Migration: database/migrations/20261002120000_phase_18_agent_simulation_spatial_runtime.sql
- Invariant test: database/tests/phase_18_agent_simulation_spatial_runtime_invariants.sql
- FastAPI: apps/api/app/api/spatial_runtime.py
- User PWA: /agent-simulation via apps/web/components/agent-simulation-surface.tsx
- Architecture: docs/architecture/AGENT_SIMULATION_SPATIAL_RUNTIME_v1.0.md
- Schema contract: docs/database/PHASE_18_AGENT_SIMULATION_SPATIAL_RUNTIME_SCHEMA_CONTRACT_v1.0.md

Database:
- agent_spatial_states
- spatial_interactions
- simulation_sessions
- simulation_ticks
- spatial_runtime_events
All are RLS-enabled. Direct authenticated/anonymous writes are revoked. Mutation RPCs are SECURITY DEFINER with pinned empty search_path.
Realtime publication includes spatial states, interactions, simulation sessions and runtime events.
No synthetic Agent, World, spatial state, interaction, simulation session, tick or runtime event records are seeded.

Live verification:
- Phase 18 invariant suite: 44/44 passed
- Phase 18 business tables: zero records by design

Runtime boundary:
Spatial Runtime does not become an autonomous Agent executor. Agent authority remains Phase 15 Agent Runtime + Phase 14 AI Gateway. Spatial state updates synchronize Phase 17 Agent Presence.

Not GREEN:
- authenticated Agent/World E2E
- interaction authorization E2E
- simulation lifecycle runtime E2E
- monotonic tick runtime E2E
- Realtime subscription runtime verification
- API/PWA build verification
- CI/runtime/production Green gates


## Phase 19 continuation state
Phase 19 Districts is implemented on main as a foundation and applied to AllphaDb-Universe.

Repository:
- Migration: database/migrations/20261002020000_phase_19_districts.sql
- Invariant test: database/tests/phase_19_districts_invariants.sql
- FastAPI: apps/api/app/api/districts.py
- User PWA: /districts via apps/web/components/districts-surface.tsx
- Architecture: docs/architecture/DISTRICTS_ARCHITECTURE_v1.0.md
- Schema contract: docs/database/PHASE_19_DISTRICTS_SCHEMA_CONTRACT_v1.0.md

Database:
- districts
- district_memberships
- district_entitlements
- district_zones
- district_access_requests
- district_activity_events
- existing district_access_policies/district_access_grants FK-bound to districts

Security:
All Phase 19 tables use RLS. Direct anonymous/authenticated writes are revoked. Mutation RPCs are SECURITY DEFINER with empty search_path. Enterprise District access fails closed and requires authoritative entitlement plus organization/grant conditions where policy requires them.

Live verification:
- Phase 19 invariant suite: 26/26 passed
- Phase 19 business tables: zero records by design

Not GREEN:
- authenticated multi-user E2E
- enterprise ABAC runtime E2E
- organization allowlist and explicit grant E2E
- access request/decision runtime E2E
- Realtime runtime verification
- API/PWA build verification
- CI/runtime/production Green gates

Next implementation target: PHASE 20 — Booth / Tenant Platform.


## Phase 20 continuation state
Phase 20 Booth / Tenant Platform is implemented on main as a foundation and applied to AllphaDb-Universe.

Repository:
- Migration: database/migrations/20261002030000_phase_20_booth_tenant_platform.sql
- FK hardening: database/migrations/20261002030100_phase_20_booth_fk_hardening.sql
- Invariant test: database/tests/phase_20_booth_tenant_invariants.sql
- FastAPI: apps/api/app/api/booths.py, registered in apps/api/app/main.py
- User PWA: /booths via apps/web/components/booths-surface.tsx
- Architecture: docs/architecture/BOOTH_TENANT_PLATFORM_ARCHITECTURE_v1.0.md
- Schema contract: docs/database/PHASE_20_BOOTH_TENANT_SCHEMA_CONTRACT_v1.0.md

Domain:
World → District → Booth/Tenant → Theme/Scene → Catalog/Presentation/Media → Phase 22 Live entry point.
Booth is the venue/tenant layer, not the Live engine.

Security:
- Booth ownership is server checked for Human, Organization and owned Agent.
- Booth reads require ownership or an active approved Booth in an accessible District.
- Paid Booth tiers require active District entitlement for the requested tier or Enterprise.
- District theme compatibility is server enforced when a District declares a theme.
- Asset registration requires owner-scoped Storage path prefixes.
- Direct table writes are revoked; mutations use SECURITY DEFINER RPCs with empty search_path.

Live verification:
- Phase 20 invariant suite: 25/25 passed.
- Booth/lease/assets business records: zero by design.

Not GREEN:
- authenticated multi-user E2E
- real Storage upload and moderation runtime
- billing/entitlement synchronization
- lease/payment runtime
- Realtime runtime verification
- API/PWA build verification
- CI/runtime/production Green gates

Next implementation target: PHASE 21 — Theme & World Builder.


## PHASE 21.x — Built-in Platform Theme Catalog — IMPLEMENTED

Implemented on `main` and applied to AllphaDb-Universe.

### Architecture

Phase 21 now has two explicit source lanes:
- `platform`: Allpha developer-provided built-in catalog
- `creator`: user/organization creator marketplace content

The creator lifecycle remains Draft → Version Draft → Validation → Review → Moderation → Published. Platform catalog records do not require or fabricate a user/organization and are delivered as product configuration.

### Database

Migration:
- `20261002040400_phase_21_builtin_platform_theme_catalog`

Registry extensions:
- `themes.source`
- `themes.catalog_key`
- `themes.catalog_order`
- `world_templates.source`
- `world_templates.catalog_key`
- `world_templates.catalog_order`

Platform catalog:
- 25 Themes
- 25 World Templates
- 25 Theme v1 records
- 25 World Template v1 records
- all published
- all validation/performance/moderation gates passed/approved
- no creator user, organization or fake system user attached
- no Storage asset records fabricated

### 25 built-in worlds

Heroic Nexus, Nusantara Raya, Neo Jakarta 2099, Celestial Samurai, Skyforge Empire, Emerald Rainforest, Aurora Kingdom, Desert Starfall, Oceanic Atlantis, Lunar Frontier, Mars Frontier, Neon Tokyo, Pharaoh Eternal, Viking Fjord, Kingdom of Aether, Coral Metropolis, Savanna Spirit, Floating Garden, Dragon Dominion, Quantum City, Crystal AI City, Galactic Frontier, Chronos Realm, Mystic Academy, Dream Carnival.

Each catalog pair contains a declarative 3D World schema with original hero/companion/NPC presentation definitions, zones, spawn points, portals, interaction points, camera and animation configuration, performance budget and accessibility constraints.

### API/PWA

FastAPI:
- `GET /api/v1/themes?source=platform&status=published`
- `GET /api/v1/themes/world-templates?source=platform`

World Builder now presents the platform collection and automatically resolves published Theme/World Template versions instead of requiring manual version UUID entry.

### Security

Platform ownership is excluded from creator owner helpers, so creator mutation RPCs cannot mutate built-in platform records.

Scene schemas remain declarative and are checked against the existing Phase 21 safety contract. Theme tokens remain restricted to `theme.*`.

### Verification

Live Supabase:
- 25 platform Themes
- 25 platform World Templates
- 25 approved/published Theme v1
- 25 approved/published World Template v1
- 0 platform creator ownership fields
- 0 unsafe platform theme schemas
- 0 unsafe platform template schemas
- Phase 21.x invariant SQL executed without exception

### Boundary

Phase 21.x does not implement Phase 22 live camera/streaming/TTS/realtime audience/AI Character execution. It supplies the initial visual/spatial catalog consumed by later runtime phases.

Phase 21 remains **not final GREEN** because authenticated E2E, actual renderer performance/accessibility, real Storage asset lifecycle, API/PWA build/CI and production gates remain pending.


## PHASE 21/21.5 — Platform Universe Instance Provisioning — IMPLEMENTED

Migration: `20261004040000_phase_21_5_platform_universe_instance_provisioning`.

This increment does not replace Phase 17/19/20/21 engines. It activates the existing platform Theme + World Template catalog as canonical public Universe instances.

Live Supabase result:
- 1 platform Galaxy: `Allpha Universe`
- 25 platform World instances
- 100 platform District instances (4 per World, mapped to GLB `District_A` … `District_D`)
- 400 active Zones (4 per District, derived from the published World Template `world_schema.zones`)
- 100 active/approved platform Booth instances (1 per District, bound to the existing `booth` Zone and `BoothTemplate` presentation component)

Each platform World binds to a published platform Theme and verified real `theme_assets` 3D scene. Platform District/Booth spatial configuration carries the existing Theme Asset ID and GLB component reference; binary delivery continues through the existing World Runtime asset manifest and Storage signing path.

Ownership boundary:
- Phase 17 already supported `platform` Galaxy/World ownership at schema level.
- Phase 19 now permits the explicit platform District lane without assigning a Human/Agent/Organization owner.
- Phase 20 now permits explicit `platform_owned` Booth composition while preserving exactly-one-tenant-owner for normal creator/business Booths.
- Platform instances are presentation/product configuration and do not grant authority, permissions, entitlements, billing, risk, approval or transaction state.

Invariant coverage:
`database/tests/phase_21_5_platform_universe_instance_provisioning_invariants.sql`.

Status: **IMPLEMENTED / NOT FINAL GREEN**. Runtime/browser renderer verification, device performance/accessibility, realtime, build/CI and production gates remain later.

Next implementation dependency: **PHASE 22 — Live Stories / Streaming / Experiences**, continuing the existing **Phase 22I** completion contract rather than restarting Phase 22. Phase 22I must continue by reconciling the existing Live Session, Character Asset Contract, Uniform/Costume, Voice/Realtime, Animation/Gesture and AllphaWorldRenderer integrations before any later Phase 23/24 jump.

## PHASE 22 — Live Stories / Streaming / Experiences — TEMPLATE CATALOG IMPLEMENTED

Phase 22 has been reconciled against the Master PRD v1.1, the cross-domain Live/AI Character architecture, and the existing Supabase Live foundation.

### Canonical collaboration model
Human Owner + owned AI Agent can collaborate in one Live Session. The template controls presentation only. Live activation remains server-authoritative through ownership, capability, live policy, consent, risk, character/voice, AI Gateway, Agent Runtime, realtime media, audience and audit.

### Built-in platform catalog
Migration: 20261002050000_phase_22_live_experience_templates

Tables:
- live_experience_templates
- live_experience_template_versions

25 built-in templates:
Podcast Studio, Talkshow Prime, Interview Lab, Product Showcase, News & Discussion, Webinar Vision, Conference Stage, Investor Pitch, Product Launch, AMA Arena, Debate Forum, Education Classroom, Research Panel, Community Show, Creator Show, Shopping Live, Virtual Concert, Music Session, Gaming Live, Workshop Live, Demo Day, Town Hall, Roundtable, Coaching Room, Agent-to-Agent Show.

Each v1 template defines stage layout, participant roles, Human Owner control surface, AI collaboration role suggestions, overlays, audience surfaces, responsive behavior, accessibility and semantic theme.* tokens. Templates reject executable code/script and authority namespaces.

### API/PWA
FastAPI:
- GET /api/v1/live/templates?source=platform
- GET /api/v1/live/templates/{template_id}/versions

PWA:
- /live now renders the Live Streaming Collaboration template studio/catalog instead of the previous Live Now placeholder.

### Verification
Live AllphaDb-Universe:
- 25 platform templates
- 25 published/validated/performance-passed/approved v1 versions
- 0 platform creator ownership fields
- 0 unsafe template schemas
- live_sessions = 0
- live_agent_collaborations = 0
- live_session_viewers = 0
- Phase 22 template invariant SQL passes

### Boundary
This implementation activates the Phase 22 template/presentation catalog only. It does not claim full camera transport, TTS, realtime AI conversation, Character rendering, stream-provider integration, audience runtime or full Live Session activation. Those remain dependent on the existing Live foundation and Agent Runtime/AI Gateway/Realtime/moderation gates.

Phase 22 remains not final GREEN.

## 2026-10-02 — World Engine Asset & Spatial Foundation Increment

Status: IMPLEMENTED FOUNDATION / NOT GREEN.

Implemented:
- Reused canonical theme_assets, booth_display_assets, and booth_display_slots; no parallel asset registry.
- Verified live Supabase Storage bucket allpha-world-assets exists and is private.
- Added read-only FastAPI asset manifest: GET /api/v1/themes/world-runtime/themes/{theme_id}/asset-manifest.
- Asset manifest exposes authoritative storage paths and moderation/safety/performance metadata; no fabricated URL and no frontend service-role access.
- Extended District composition API with Zone/Booth spatial projection plus Booth asset and display-slot manifests.
- Booth position resolution: scene_config.position → display_config.position → Zone spatial_config.booth_anchor.
- PWA World Preview now consumes the authoritative spatial projection.
- Added database invariants for asset paths and spatial JSON contracts.

Live verification:
- theme_assets = 0
- booth_display_assets = 0
- booth_display_slots = 0
- districts = 0
- district_zones = 0
- booths = 0
- asset/spatial invariants passed.
- No synthetic records created.

Still not complete:
- actual authenticated asset upload/signing lifecycle
- real District/Zone/Booth records
- Phase 18 realtime spatial runtime
- full RAG/vector/rerank runtime
- Phase 23 cross-Agent execution E2E
- Phase 22 Live/Character runtime
- device performance/accessibility
- authenticated E2E and final Green gates.

Next integration target:
Phase 18 Spatial Runtime adapter using existing agent_spatial_states + Realtime, with bounded position persistence and spatial context feeding the existing Agent Context/RAG path. No new spatial authorization engine.


## 2026-10-02 — Phase 18 Spatial Runtime Adapter

Status: IMPLEMENTED FOUNDATION / NOT GREEN.

Implemented:
- Existing agent_spatial_states remains authoritative spatial persistence.
- Supabase Realtime publication for agent_spatial_states verified live.
- Existing update_agent_spatial_state remains the only spatial mutation boundary and now enforces bounded speed, XYZ position shape and 100ms persistence floor.
- Existing universe_agent_presence projection remains reused; no second presence engine.
- Added spatial context adapter endpoint: GET /api/v1/spatial-runtime/worlds/{world_id}/agents/{agent_id}/context.
- Added browser Realtime adapter at apps/web/lib/world-engine/spatial-realtime.ts.
- Spatial context composes Agent spatial state with authoritative District → Zone → Booth records and explicitly does not grant permission.
- No per-frame LLM invocation; spatial updates are deterministic and feed the existing Agent Context / Memory / Knowledge path.

Live catalog verification:
- 25 platform Themes
- 25 platform World Templates
- 25 platform Live Experience Templates
- 0 Districts
- 0 Zones
- 0 Booths
- 0 live Character assets
- 0 Sticker-specific tables
- 0 spatial states
- 0 universe agent presences
- 0 agent memory rows
- 0 knowledge rows

Product availability interpretation:
- Theme/World/Live template catalog foundation exists and is exposed through the World PWA catalog.
- District/Zone/Booth/Tenant infrastructure exists at API/DB foundation level, but no real tenant records exist yet.
- Character asset storage/schema foundation exists, but no real character assets/runtime catalog is provisioned.
- Sticker-specific registry was not found in the live schema; do not claim Sticker catalog is implemented.
- 25 World Templates are platform catalog records and should be treated as the initial 3D/presentation template layer, not as 25 uploaded 3D asset packs.


## Latest — Real Spatial Context → Agent Context → Memory/RAG/Knowledge/Learning

Implemented as bounded runtime activation without creating a second engine.

### Runtime adapter
- Added `apps/api/app/core/agent_context_retrieval.py`.
- Added `POST /api/v1/agent-context/{agent_id}/retrieve`.
- Reuses canonical `retrieve_agent_memory` and `retrieve_agent_knowledge` RPCs when a query embedding is supplied.
- Adds bounded lexical retrieval from authorized Agent-owned active Memory and Knowledge when a text query is supplied.
- GET Agent Context now composes spatial state → District → Zone → active Booth context.
- GET Agent Context also exposes existing Interest Affinity, Passion Cluster and Habit Pattern signals as bounded learning context.
- No LLM is called by the retrieval adapter; AI Gateway remains the only model boundary.
- Spatial presence is context only and never grants authority.

### Learning boundary
The runtime reads existing learning signals only. It does not fabricate signals, infer a new permission, or create a parallel learning engine. The canonical learning loop remains Content → Interaction → Behavior Signal → Content Understanding → Interest Affinity → Passion Cluster → Habit Pattern → Goal/Context → Recommendation.

### Verification
Live Supabase invariant check passed for Memory, Knowledge, Interest Affinity, Passion Cluster, Habit Pattern and canonical retrieval RPC foundations. Current live counts remain zero for these business records; no synthetic Agent/Memory/Knowledge/Learning data was created.

Status: IMPLEMENTED FOUNDATION / NOT GREEN. Full vector embedding generation, authenticated end-to-end retrieval with real Agent data, recommendation activation, runtime model calls, mobile verification and final E2E remain downstream gates.


## Latest — District → Zone → Booth Provisioning + Procedural 3D Theme Runtime

Implemented Web App provisioning surfaces without synthetic business records:
- `/districts` now selects an existing authoritative World, creates District through existing FastAPI/RPC, loads Zones and creates Zones through existing `create_district_zone` boundary.
- `/booths` now provisions Booth/Tenant against an existing District/Zone through existing `create_booth`; no direct Supabase browser mutation and no fake records.
- Existing backend District/Booth authorization and RLS remain authoritative.

3D Theme Runtime:
- Existing 25 platform Themes + 25 platform World Templates remain canonical; no duplicate catalog was created.
- Verified all 25 published platform World Template versions use `allpha-3d-progressive` renderer schema.
- Added deterministic procedural 3D style mapping in `apps/web/lib/world-engine/procedural-theme.ts`.
- Updated `AllphaWorldRenderer` to render biome/architecture-specific procedural structures, water/rings, zone platforms and Booth projections.
- This provides real 3D Web App presentation without fabricated GLB/GLTF/Storage assets. Asset lifecycle remains available for future real uploaded assets.

Live verification: platform Themes=25, platform World Templates=25, published 3D World Template versions=25, Districts=0, Zones=0, Booths=0, Theme assets=0, Booth assets=0.
Status: IMPLEMENTED FOUNDATION / NOT GREEN.


## Latest — Real Storage 3D Asset Lifecycle + Booth 3D Composition

Status: **IMPLEMENTED FOUNDATION / NOT GREEN**.

Implemented:
- Reused existing \`allpha-world-assets\` private Storage bucket.
- Extended existing \`booth_display_assets\` metadata with authoritative storage bucket, size, checksum and uploaded timestamp fields.
- Added authenticated lifecycle RPCs:
  - \`prepare_booth_3d_asset\`
  - \`finalize_booth_3d_asset\`
  - \`archive_booth_display_asset\`
- Upload path is generated server-side from Booth ownership and a server-generated asset UUID; clients cannot choose arbitrary Storage paths.
- FastAPI now provides:
  - \`POST /api/v1/booths/{booth_id}/assets/3d/upload-url\`
  - \`POST /api/v1/booths/{booth_id}/assets/{asset_id}/3d/finalize\`
  - \`GET /api/v1/booths/{booth_id}/assets/3d\`
  - \`DELETE /api/v1/booths/{booth_id}/assets/{asset_id}/3d\`
- Browser uploads the real user-provided GLB to a time-limited signed Storage URL; the backend then verifies the Storage object before activating metadata.
- World Runtime now resolves only active Booth 3D assets to time-limited signed read URLs.
- World Preview projects the authoritative signed GLB URL into the existing React Three Fiber/Three.js renderer.
- No second asset registry, Storage engine, renderer, or Booth engine was created.
- No service-role/secret is exposed to the browser.
- No fake GLB/GLTF file, fake Storage URL, Booth record, asset record or Storage object was created.
- Only \`.glb\` is activated in this increment; external \`.gltf\` dependency bundles are intentionally deferred rather than fabricated.
- Added invariant test: \`database/tests/phase_20_real_storage_3d_asset_lifecycle_invariants.sql\`.
- Added architecture record: \`docs/architecture/PHASE_20_REAL_STORAGE_3D_ASSET_LIFECYCLE_v1.0.md\`.
- Migration recorded as \`20261002134712_phase_20_real_storage_3d_asset_lifecycle.sql\`.

Live verification:
- Booths: 0
- Booth display assets: 0
- Booth display slots: 0
- \`allpha-world-assets\` Storage objects: 0
- lifecycle RPCs present
- authenticated execute allowed
- anonymous execute denied
- active Booth 3D Storage read policy present
- invariant assertions passed
- Supabase security/performance advisors reviewed; existing project-wide findings remain and are not reclassified as GREEN.

Not yet proven:
- authenticated real-user GLB upload E2E
- actual user-provided Storage object
- populated District → Zone → Booth → GLB runtime composition
- GLB device/mobile performance
- accessibility, build/CI, runtime and production gates.

Next integration target:
**Real populated District → Zone → Booth runtime + Phase 18 spatial state + Booth 3D composition E2E**, using only records/assets created by an authenticated authorized user.


## Latest — Real District → Zone → Booth → GLB → World Runtime → Phase 18 Spatial Presence

Status: **IMPLEMENTED FOUNDATION / NOT GREEN**.

Implemented:
- World Runtime District composition now derives an authoritative Booth spatial anchor in this order: booths.scene_config.position → booths.display_config.position → district_zones.spatial_config.booth_anchor.
- Anchor values are normalized to numeric XYZ. Missing/invalid anchors remain null; the runtime does not invent a position.
- Active Booth 3D assets continue to resolve through the existing private Storage lifecycle and signed read URL.
- District composition now also returns Phase 18 agent_spatial_states for the same World and Zone context, subject to existing RLS.
- World Preview consumes the authoritative Booth anchor and real signed GLB URL.
- World Preview subscribes to the existing Supabase Realtime agent_spatial_states publication through an extended adapter; no second spatial engine was created.
- Existing Phase 18 update_agent_spatial_state remains the only authoritative spatial mutation boundary.
- Real spatial presence is rendered only when a real Phase 18 position exists. No fallback position is generated for missing Agent spatial state.
- Booth 3D presentation remains presentation-only and cannot grant Agent permission, ownership, capability, entitlement or execution authority.
- Added read-only invariant test: database/tests/phase_20_booth_3d_spatial_composition_invariants.sql.

Live verification:
- Districts: 0
- Zones: 0
- Booths: 0
- Booth 3D assets: 0
- Storage objects in allpha-world-assets: 0
- Agent spatial states: 0
- Phase 18 Realtime publication: present
- Booth Realtime publication: present
- Composition invariants passed
- No synthetic business data or asset was created.

Important boundary:
The runtime path is implemented, but the requested real populated state is not claimed because the live project currently has no authorized District/Zone/Booth/GLB/Agent spatial records. Those must be created by an authenticated authorized user through the existing provisioning/upload flows.

Known global Supabase advisor findings remain; they are not reclassified as GREEN. In particular, the project already has multiple SECURITY DEFINER functions callable by authenticated users and several existing duplicate permissive RLS policies. The current increment did not create a second authorization/spatial engine.

Next integration target:
Authenticated real-data E2E: create one real World-owned District → Zone → Booth → upload a real user-provided GLB → publish/activate → enter Agent into Phase 18 spatial runtime → verify Realtime presence and Booth anchor composition in /world.


# MASTER CONTINUATION CONTEXT — DELIVERY COMPLETION & UNIVERSE DISCOVERY ADDENDUM
## 2026-10-02 — Canonical continuation after chat-limit handoff

This section is authoritative for continuation after the current conversation reaches its message limit. It does not erase historical implementation records above; it reconciles them into one current delivery map. Before any implementation, re-read this section together with AGENTS.md, the Master PRD, docs/IMPLEMENTATION_PHASES.md, relevant architecture/schema/test records, current source and live AllphaDb-Universe.

### A. Current source-of-truth hierarchy

1. AGENTS.md — binding engineering/governance rules.
2. Master PRD — product, UX/UI, design system, architecture, engines, security and domain contract.
3. docs/IMPLEMENTATION_PHASES.md — canonical top-level phase sequence.
4. This Master Continuation Context — current cross-conversation implementation/status/reconciliation record.
5. Phase/domain architecture and schema documents.
6. Repository source, migrations and tests.
7. Live AllphaDb-Universe schema, migration state, RLS, Storage and Realtime state.
8. Uploaded design/UX source documents — incorporated only where their content is explicitly supported and mapped to existing architecture.

No lower-level source may silently override a higher-level authority. When they disagree, stop, inspect, reconcile and document the decision before implementation.

### B. Product direction added from Feed/UI/UX source

The uploaded Feed/UI/UX document defines the Feed not as a TikTok/Instagram clone but as an **Allpha Universe Discovery Engine**. Its central interaction is:

Universe → World → Experience → Content → Agent → Conversation → World.

The Feed is therefore a navigation/presentation layer over existing engines, not an isolated video UI. This is consistent with the existing Phase 08 → 09 → 10 → 11 → 12 → 13 → 15 → 17 → 18 → 19 → 20 → 22 architecture. The source explicitly says the Feed UI should visualize those engines rather than create a separate static Feed system. fileciteturn1196file0L414-L439

#### Canonical Allpha Universe Discovery Engine UX

The Feed/Discovery layer must support, incrementally and without a second recommendation engine:

- **Universe Scroll**: scrolling means discovery through related Universe objects, not merely next-video pagination.
- **Universe Card / Scene**: content is presented with its World, Experience, Agent, context and related exploration path.
- **Content → Understanding → Interaction → Exploration** rather than engagement-only UX.
- **Ask the Content**: contextual AI actions such as explain, summarize, challenge, find related Worlds and ask a question, subject to authorization and context budget.
- **Content Gravity**: relevance graph around the current content using Interest, Passion, Habit, Context, Community, Creator, Agent, World and Related Content.
- **Content Evolution**: Original → AI Summary → Discussion → Community → Related Content → Live Experience → World.
- **Agent as an intelligence layer**: the Human Creator and owned AI Agent are represented distinctly; the Agent can be available for content discussion only within explicit authority.
- **Universe Navigator**: current Universe plus nearby Worlds/Agents/Topics/Experiences.
- **Optional Agent Companion**: opt-in, dismissible, non-intrusive and never based on sensitive inferred attributes.
- **Hybrid rendering**: default premium 2D UI with subtle spatial effects; 2.5D/spatial Explore mode; 3D/WebGL Universe/World mode. Do not force every screen into 3D.
- **World Transition**: movement between related Worlds/Galaxies can progressively use WebGL/Three.js, while preserving normal 2D usability.
- **Five Feed surfaces**: Home/Universe, Following, Moments, Worlds and Live, all using the same underlying Feed/Discovery Engine.
- **Moments** is the preferred internal conceptual name for short-form experience content; the underlying Content Engine remains canonical.
- **Create** expands beyond upload-video to Moment, Story, Post, Video, Podcast, Presentation, World, Community, AI Experience and Live Experience, with AI-assisted creation only through existing Agent Runtime/AI Gateway/Workflow/approval boundaries.
- **Visual identity**: light default, elegant typography, large cinematic media, translucent hierarchy, subtle gradients, orbit/spatial cues, restrained particles/depth and intelligent motion; avoid copying TikTok/Instagram visual identity.
- **Bottom navigation** must make Universe/Discover, Create, Agents, Messages/You and related first-class routes without creating duplicate navigation authorities.

The source also explicitly frames Allpha as a social network plus AI civilization interface rather than a generic SaaS dashboard or video clone. fileciteturn1196file0L388-L413

### C. Engine binding contract for Feed / Discovery

The Discovery Engine is a **composition/orchestration layer over existing authoritative domains**:

Content
→ Social Graph
→ Interest/Passion/Habit/Goal
→ Feed Ranking
→ Universe/World
→ District/Booth/Experience
→ Agent Context
→ Memory/Knowledge/RAG
→ Messaging/Community
→ Live Experience
→ Navigation/Spatial Runtime.

It must not create:
- a second Feed ranking engine,
- a second Content engine,
- a second Interest/Learning engine,
- a second Memory/RAG engine,
- a second Agent Runtime,
- a second AI Gateway,
- a second Workflow/Mission engine,
- a second Messaging engine,
- a second Spatial engine.

The existing Phase 11 ranking engine remains the ranking authority. The new Universe Scroll/Content Gravity layer is a presentation and discovery composition layer that consumes authoritative ranked candidates plus relationship/context metadata.

### D. AI / Memory / RAG / Learning contract

Allpha's intelligence path remains:

Human Intent
→ Agent
→ bounded Context
→ Memory / Knowledge Retrieval
→ Context Budget
→ AI Gateway / Model Router
→ Agent Runtime
→ Workflow / Mission
→ Policy / Risk / Approval
→ Tool/Domain Execution
→ Review / Telemetry / Learning.

Canonical retrieval:
Query
→ authorization scope
→ structured filters
→ lexical retrieval
→ vector retrieval
→ rerank
→ deduplicate
→ context budget
→ model only when required.

LLM cost policy:
Deterministic Logic
→ SQL / Cache / Search / Vector
→ small model
→ large model only when required.

Memory layers:
Working → Short-Term → Episodic → Semantic → Procedural → Long-Term Knowledge.

Learning path:
Content → Interaction → Behavior Signal → Content Understanding → Interest Affinity → Passion Cluster → Habit Pattern → Goal/Context → Recommendation → New Interaction.

Spatial presence is context, not authority and not sufficient as an isolated learning signal.

### E. Current live reconciliation at handoff

Verified against AllphaDb-Universe on 2026-10-02:

- universe_worlds: 0
- districts: 0
- district_zones: 0
- booths: 0
- active booth 3D assets: 0
- agent_spatial_states: 0
- agent_memory: 0
- knowledge_items: 0
- ai_gateway_requests: 0
- workflows: 0
- missions: 0

This is intentional from the no-fake-data rule. Existing platform catalog records remain separate from business-owned World/District/Zone/Booth records.

Security/performance advisors remain non-GREEN at project level. Current observations include existing RLS-without-policy findings, many authenticated-callable SECURITY DEFINER functions, and multiple permissive policy/index findings. These are tracked as a dedicated hardening gate and must not be silently reclassified as Green.

### F. Full implementation status matrix

Status vocabulary:
- **IMPLEMENTED** — domain foundation and core contracts are implemented; final cross-system/runtime gates can still remain.
- **IMPLEMENTED FOUNDATION** — meaningful implementation exists but one or more critical runtime/domain integrations remain.
- **PARTIAL / ACTIVATION REQUIRED** — substantial implementation exists but the user-facing system is not yet complete.
- **NOT IMPLEMENTED** — no complete domain implementation should be assumed.
- **FINAL GATE** — verification/production phase, not a substitute for missing domain implementation.

#### Phase 00 — Governance & Repository Foundation
**Status: IMPLEMENTED.**
AGENTS.md, monorepo boundaries, app boundaries, source-of-truth rules and engineering workflow exist.
Completion gate: governance audit and repository integrity verification.

#### Phase 01 — Design System & UI Foundation
**Status: IMPLEMENTED FOUNDATION.**
Tokens, typography, spacing, responsive/accessibility foundations, PWA shell, navigation and UI primitives exist.
Remaining activation: token coverage audit, component consistency, mobile/desktop visual verification, accessibility verification and final visual regression.

#### Phase 02 — Complete UI/UX Information Architecture
**Status: IMPLEMENTED FOUNDATION.**
Route/screen inventory and major product surfaces exist.
Remaining activation: every route must have complete loading/empty/error/not-configured/permission-denied/success states, consistent navigation, real API wiring and responsive behavior.

#### Phase 03 — API Contract Layer
**Status: IMPLEMENTED FOUNDATION.**
FastAPI contracts and shared domain boundaries exist.
Remaining activation: complete OpenAPI/contract conformance, error envelope consistency, pagination/filter/sort/idempotency audit, generated/verified client contracts and integration tests.

#### Phase 04 — Supabase PostgreSQL Data Foundation
**Status: IMPLEMENTED.**
Core schema, pgvector, Storage, Realtime, migrations, grants and RLS foundations exist.
Remaining: project-wide security/performance hardening and final production migration/recovery verification.

#### Phase 05 — Identity, Authentication & Authorization
**Status: IMPLEMENTED FOUNDATION.**
Supabase Auth, sessions, RBAC/permissions, organization authorization, JWT/JWKS and RLS alignment exist.
Remaining: authenticated multi-user E2E, session/security hardening and complete authorization matrix.

#### Phase 06 — Human & AI Identity
**Status: IMPLEMENTED FOUNDATION.**
Human/Agent identity, lifecycle, Persona, Passport, capabilities, skills, policies, autonomy, budget, credentials and reputation read model exist.
Remaining: full authenticated lifecycle E2E and runtime coupling to every dependent domain.

#### Phase 07 — Agent Memory & Knowledge
**Status: IMPLEMENTED FOUNDATION.**
Memory, knowledge/chunks/provenance, embeddings and retrieval boundaries exist.
Remaining: real embedding generation, complete hybrid retrieval/reranking/context-budget runtime, authenticated E2E, retention/access-audit runtime and production observability.

#### Phase 08 — Interest / Passion / Habit / Goal / Personalization
**Status: IMPLEMENTED FOUNDATION.**
Ontology, graph, real signals, affinities, passion, habit, explicit goals and personalization refresh engine exist.
Remaining: recommendation activation, multi-signal validation, learning feedback loop and authenticated runtime verification.

#### Phase 09 — Social Graph & Relationship
**Status: IMPLEMENTED FOUNDATION.**
Relationship lifecycle, blocking, mentions, activity, notifications and APIs/UI exist.
Remaining: authenticated multi-user E2E, realtime/notification delivery verification and complete relationship-dependent integrations.

#### Phase 10 — Content Platform
**Status: IMPLEMENTED FOUNDATION.**
Content types, media metadata, Storage-path contracts, topics, revisions, moderation, AI Capsule provenance, telemetry, APIs/UI exist.
Remaining: real binary Storage E2E, moderation runtime, media delivery, Content-to-Universe/Feed integration and complete publishing lifecycle.

#### Phase 11 — Feed, Reels & Discovery
**Status: IMPLEMENTED FOUNDATION + DISCOVERY UX EXPANSION REQUIRED.**
Ranking, Home/Following/For You/Reels/Explore and dependency-aware feeds exist.
Remaining: activate the Allpha Universe Discovery Engine described above; five Feed surfaces; Universe Scroll; Content Gravity; Ask Content; World/Agent transitions; Context/RAG-aware discovery; Moments presentation; real content/media E2E; recommendation evaluation; mobile performance.

#### Phase 12 — Community
**Status: IMPLEMENTED FOUNDATION.**
Community ownership, membership, posts/comments, events/RSVP, reports, moderation and telemetry exist.
Remaining: moderation decision runtime, event/live/content integration, realtime verification, authenticated multi-user E2E and complete discovery integration.

#### Phase 13 — Messaging & Social Communication
**Status: IMPLEMENTED FOUNDATION.**
Human↔Human, Human↔Agent and Agent↔Agent messaging foundations, consent, requests, messages, receipts, reactions, abuse reports, notifications and realtime publication exist.
Remaining: authenticated multi-user realtime E2E, notification delivery runtime, moderation/abuse runtime and all collaboration/live/content integrations.

#### Phase 14 — AI Gateway & Model Router
**Status: IMPLEMENTED FOUNDATION.**
Provider/model registry, routing policies, capability-aware routing, budgets, fallback/retry, safety, telemetry and APIs exist.
Remaining: configured real provider/model E2E, cost/latency/usage enforcement, fallback verification, streaming where required and production observability.

#### Phase 15 — Agent Runtime & Command System
**Status: IMPLEMENTED FOUNDATION.**
Command lifecycle, execution context, planner, capability/policy/risk/approval, tools, telemetry, spend and kill switch exist.
Remaining: authenticated real-Agent execution E2E, tool executor coverage, approval/resume, kill switch, budget/rate-limit behavior and real AI provider integration.

#### Phase 16 — Workflow & Mission Engine
**Status: IMPLEMENTED FOUNDATION.**
Workflow versions/steps/runs, Missions and orchestration exist and delegate to Agent Runtime.
Remaining: trigger/condition/retry/compensation runtime, cross-Agent collaboration, Mission E2E, durable state recovery and observability.

#### Phase 17 — AI Universe
**Status: IMPLEMENTED FOUNDATION / VERIFIED DATABASE.**
Galaxy/World/Interest/Content/Community/Agent/Portal/Presence schema/API/UI and 32 live invariant assertions exist.
Remaining: authenticated real World/Agent creation and membership E2E, portal/visibility runtime, Realtime/spatial integration and Universe Discovery consumption.

#### Phase 18 — Agent Simulation & Spatial Runtime
**Status: IMPLEMENTED FOUNDATION / VERIFIED DATABASE.**
Authoritative spatial state, movement, sessions, interactions, ticks, realtime and APIs exist; bounded persistence/rate limiting and World-level realtime adapter are implemented.
Remaining: authenticated real Agent presence E2E, District/Zone/Booth composition, device/mobile performance and integration with Agent Context/Memory/RAG/Universe Discovery.

#### Phase 19 — Districts
**Status: IMPLEMENTED FOUNDATION.**
Districts, zones, access policies/grants, memberships, entitlements, requests, activity, API/UI and invariant verification exist.
Remaining: authenticated District creation, enterprise ABAC runtime E2E, real Zone composition, realtime and integration with World/Booth/Discovery.

#### Phase 20 — Booth / Tenant Platform
**Status: IMPLEMENTED FOUNDATION + REAL STORAGE LIFECYCLE.**
Booth ownership/tiers/placement, scene/presentation config, assets/slots, moderation, leasing foundation, FastAPI/PWA, private Storage signed upload/read lifecycle and GLB activation contract exist.
Remaining: authenticated real Booth E2E, actual GLB upload/finalize, moderation/publish runtime, 3D composition, spatial anchors and billing/lease runtime.

#### Phase 21 — Theme & World Builder
**Status: IMPLEMENTED FOUNDATION + LIFECYCLE HARDENING.**
Theme/World catalogs, versions, validation, moderation, builder states, safe scene schema and presentation-only tokens exist; current platform catalog has 25 Themes and 25 World Templates.
Remaining: real asset manifest lifecycle, real user-authored publication, renderer/device verification, complete District/Booth binding and production moderation E2E.

#### Phase 22 — Events & Experiences / Live
**Status: IMPLEMENTED FOUNDATION.**
22 template catalog, 22A session core, 22B owned-Agent collaboration, 22C Agent Runtime/AI Gateway activation and 22D realtime conversation/audience foundations exist.
Remaining: authenticated Live E2E, configured AI provider, realtime WebSocket verification, camera/stream transport, voice/TTS, Character/animation compositor, moderation/entitlement/commerce and media runtime.

#### Phase 23 — AI-to-AI Collaboration
**Status: IMPLEMENTED FOUNDATION through 23D.**
23A discovery/request, 23B DM/negotiation, 23C Human approval/agreement and 23D approved-agreement execution binding exist.
Remaining: 23E Review + Reputation + History, proven cross-Agent execution semantics, Workflow/Mission collaboration E2E, realtime/runtime verification and authenticated multi-user E2E.

#### Phase 24 — Marketplace & Commerce
**Status: NOT IMPLEMENTED as a complete runtime domain.**
Commerce foundations may exist in schema dependencies, but do not assume complete catalog/order/payment/payout/refund/commission/Agent-commerce runtime.
Required completion: catalog → product/service → cart/checkout → order → transaction → payment gateway → fulfillment → payout/commission → refund/dispute → Agent commerce → approval/risk → audit/telemetry.

#### Phase 25 — Economy, Credits & Billing
**Status: NOT IMPLEMENTED as a complete runtime domain.**
Required completion: plans → features → entitlements → subscriptions → usage → AI credits → invoices → billing events → payment synchronization → limits → renewals/cancellation → District/Booth pricing → audit/reconciliation.

#### Phase 26 — Security, Governance & Trust
**Status: PARTIAL / ACTIVATION REQUIRED.**
Core policy/risk/approval/kill-switch/RLS/auth primitives already exist, but project-wide Zero Trust hardening, security advisor remediation, abuse/prompt-injection/anti-scam controls and governance consolidation are not complete.
This phase must consume existing engines, not create duplicates.

#### Phase 27 — Super Admin Control Plane
**Status: PARTIAL / ACTIVATION REQUIRED.**
Some admin surfaces and platform moderation exist, but a complete authoritative control plane across Users, Agents, Content, Communities, Universe, Districts, Booths, Themes, Live, Marketplace, Billing, Credits, AI providers/models, Policies, Risk, Moderation, Audit, Flags, Analytics and Configuration is not yet proven complete.

#### Phase 28 — Analytics, Observability & Operational Intelligence
**Status: PARTIAL / ACTIVATION REQUIRED.**
Telemetry foundations exist across domains and AI usage, but unified event taxonomy, trace correlation, KPI/health dashboards, cost observability, recommendation/Agent/commerce analytics and operational alerts are not complete.

#### Phase 29 — API Integration & Local End-to-End Wiring
**Status: NOT IMPLEMENTED AS A COMPLETE GATE.**
Requires verified Web→API→Supabase, Admin→API, Auth propagation, Storage, Realtime, AI Gateway, Workflow/Mission, idempotency, errors and real-data integration across all domains.

#### Phase 30 — Full Feature Activation
**Status: NOT IMPLEMENTED AS A COMPLETE GATE.**
Requires every intended UI surface to have a real API contract, persistence, authorization, workflow, realtime where relevant, audit/telemetry, loading/empty/error/permission states and no dead/stubbed interactions.

#### Phase 31 — End-to-End QA & Security Verification
**Status: NOT IMPLEMENTED.**
Final comprehensive unit/integration/API/RLS/authz/workflow/Agent/approval/commerce/security/prompt-injection/moderation/accessibility/visual/mobile/desktop E2E.

#### Phase 32 — CI/CD
**Status: NOT IMPLEMENTED AS FINAL GATE.**
Lint, typecheck, Python checks, migration validation, RLS tests, API contracts, build, artifact and dependency/security pipelines.

#### Phase 33 — Runtime Verification
**Status: NOT IMPLEMENTED.**
Real local services, Auth, Supabase, Realtime, Storage, AI Gateway, Model Router, workflows, Agents, approvals, commerce, Admin, audit and observability smoke tests.

#### Phase 34 — Staging / Production Readiness
**Status: NOT IMPLEMENTED.**
Environment separation, secrets, migrations, backup/recovery, rollback, rate/capacity, domains/SSL, monitoring/alerts, incident response, retention/privacy/compliance.

#### Phase 35 — Production Deployment & Final Green Gate
**Status: NOT IMPLEMENTED.**
Production migration/deployment, critical E2E, security/performance review, runtime monitoring, rollback proof, accessibility, architecture/prohibited-data audit and final build/deployment verification.

#### Phases 36–38 — Reserved Product Expansion
**Status: RESERVED.**
Do not activate until Phases 00–35 are materially complete and a new owner-approved PRD establishes the expansion.

### G. Completion / activation sub-phases

These are **not new competing top-level phases**. They are completion increments used to finish domains that are currently foundation/partial. They must be executed only after reconciling the relevant existing domain and must reuse existing engines.

#### 01A — Design System Completion
Token coverage audit → component tokenization → state variants → dark/light/system parity → responsive/mobile → accessibility → visual regression.

#### 02A — UX State Completion
Every route/surface gets real loading/empty/error/not-configured/permission-denied/success states; navigation and deep-link consistency verified.

#### 03A — API Contract Completion
OpenAPI ↔ FastAPI ↔ Pydantic ↔ frontend client conformance, pagination/filter/sort/error/idempotency and contract tests.

#### 07A — Memory/RAG Runtime Activation
Real embeddings → hybrid lexical/vector retrieval → rerank → dedupe → context budget → provenance → authorization scope → retrieval telemetry. No second RAG engine.

#### 08A — Learning/Recommendation Activation
Real interaction signals → affinity → passion/habit evidence → explicit goals → recommendation candidate generation → feedback loop. Spatial presence alone is never sufficient.

#### 09A — Social Graph Runtime E2E
Two-user/Agent relationship, block, notification and consent E2E.

#### 10A — Content Media Lifecycle
Real Storage upload → media validation → content publish/moderation → delivery → revision → provenance → telemetry.

#### 11A — Allpha Universe Discovery Engine
Phase 11 ranking → five Feed surfaces → Universe Scroll → Content Gravity → Universe Navigator → Ask Content → Context/RAG-aware actions → Agent/World transition → Moments → Live entry. This is the main UX expansion from the uploaded source.

#### 12A — Community Runtime Completion
Moderation decisions, event integration, realtime, discovery, notifications and Content/Agent/Universe integration.

#### 13A — Messaging Runtime Completion
Realtime multi-user E2E, notification delivery, moderation/abuse, collaboration bridge and Live integration.

#### 14A — AI Provider Activation
Configured provider/model → real generation → streaming → fallback/retry → cost/usage limits → safety → observability.

#### 15A — Agent Execution Completion
Real Agent → command → policy/risk/approval → planner → tool → AI Gateway → execution → spend → result → audit → kill switch.

#### 16A — Workflow/Mission Runtime Completion
Trigger → plan → dependency resolution → approval detection → sequencing → retry → stop conditions → state transition → result aggregation → compensation/recovery.

#### 17A — Universe Runtime Completion
Real World/Galaxy creation → ownership/membership → portals/visibility → Agent presence → Discovery integration → Realtime.

#### 18A — Spatial Runtime Completion
Authenticated Agent → enter → bounded movement persistence → Realtime presence → Zone/District/Booth context → Agent Context → Memory/RAG, with no spatial authority.

#### 19A — District Runtime Completion
Real District/Zone → enterprise ABAC → organization/grant → access requests → activity/realtime → World/Booth/Discovery composition.

#### 20A — Real Booth/GLB Lifecycle Completion
Authenticated owner → District/Zone → Booth → signed upload → actual Storage object → checksum/size verification → finalize → moderation/publish → GLB renderer → spatial anchor.

#### 21A — Theme/World Runtime Completion
Real user-authored Theme/World Template → validation → moderation → publish → scene schema → renderer → District/Booth binding → device performance/accessibility.

#### 22E — Live Media/Character Completion
Live Session → Agent consent/policy/risk → Agent Runtime → AI Gateway → realtime conversation → camera/stream transport → voice/TTS → Character/costume/animation → overlays → audience moderation → commerce/entitlement.

#### 23E — Collaboration Review/Reputation/History Completion
Approved collaboration → real cross-Agent execution → Workflow/Mission → result → Human/Agent review → authoritative reputation event → history. Reputation remains evaluation/history, never authorization.

#### 24A — Commerce Runtime Completion
Catalog → item/product/service → cart/checkout → order → payment → fulfillment → payout/commission → refund/dispute → Agent commerce → approval/risk/audit.

#### 25A — Economy/Billing Completion
Plan → feature → entitlement → subscription → usage → AI credits → invoice → payment event → limit → renewal/cancel → reconciliation → Booth/District pricing.

#### 26A — Zero Trust Hardening
RLS policy audit → SECURITY DEFINER audit → function privilege minimization → policy consolidation → secret/session hardening → rate limits → abuse/prompt injection → anti-scam/impersonation → kill switch → audit governance.

#### 27A — Admin Control Plane Completion
Authoritative CRUD/approval/moderation/configuration for every domain plus audit, flags, providers/models, policy/risk, billing/credits, analytics and QA operations.

#### 28A — Observability Completion
Unified event taxonomy → correlation IDs/traces → domain dashboards → AI cost/latency → recommendation quality → Agent execution → commerce/billing → security signals → operational alerts.

#### 29A — Full Integration Wiring
Web/Admin → FastAPI → Supabase → Storage/Realtime → AI Gateway → Agent Runtime → Workflow/Mission → domain engines; auth propagation, idempotency and error contracts verified.

#### 30A — Product Activation Audit
Route-by-route feature activation audit; eliminate dead buttons/stubs/placeholders; verify every state and telemetry path; verify no frontend privileged bypass.

#### 31A — Comprehensive QA
Unit → integration → contract → RLS → auth/authz → workflow → Agent → approval/risk → commerce → security → accessibility → visual regression → mobile/desktop → critical E2E.

#### 32A — Delivery Pipeline Completion
CI checks, migrations, tests, builds, artifact signing/versioning, dependency/security scans and deployment promotion gates.

#### 33A — Runtime Completion
All local services + Supabase + Auth + Realtime + Storage + AI provider + Agent Runtime + Workflow/Mission + Admin + telemetry verified with real data.

#### 34A — Production Readiness Completion
Environment isolation, secrets, backup/restore, rollback, rate/capacity, domains/SSL, monitoring, incident response, retention/privacy/compliance.

#### 35A — Final Green Certification
Architecture audit + real-data audit + prohibited-data audit + security/performance advisor review + accessibility + critical E2E + build + deployment + rollback + runtime monitoring.

### H. Authenticated Real-Data E2E — immediate next execution gate

The intended E2E is:

Authenticated Human
→ existing authorized World
→ real District
→ real Zone
→ real Booth
→ real user-provided GLB
→ private Storage upload
→ finalize/activate
→ publish/activate according to Booth lifecycle
→ Agent enters Phase 18
→ bounded spatial state
→ Supabase Realtime presence
→ World Runtime composition
→ Booth spatial anchor
→ real GLB renderer
→ Agent Context
→ Memory/Knowledge/RAG context.

The user requested 25 District → 25 Zone → 25 Booth, but **25 records must only be created from real authenticated provisioning and legitimate product use**. Do not seed them as test/demo business records. The E2E should first prove one complete chain, then repeat to 25 only if the authenticated account actually owns/controls the required World/Agent and intentionally creates those records.

A real GLB must come from an actual uploaded asset. Never generate a fabricated Storage URL, placeholder GLB, or fake Storage object.

### I. Definition of complete web app

Allpha is considered product-complete only when each domain has:

PRD
+ Design System/Token
+ UI/UX
+ API Contract
+ FastAPI implementation
+ PostgreSQL schema/migration
+ RLS/authz
+ Storage where required
+ Realtime where required
+ Engine/workflow integration
+ Agent/AI Gateway integration where required
+ Memory/RAG/Knowledge integration where relevant
+ telemetry/observability
+ tests
+ real-data authenticated E2E
+ accessibility
+ responsive mobile/desktop behavior
+ build/CI
+ runtime verification
+ staging/production readiness
+ deployment evidence.

A foundation phase is never silently promoted to GREEN because its files exist.

### J. Continuation protocol for the next conversation

At the beginning of the next conversation:

1. Read this section.
2. Read AGENTS.md.
3. Read the Master PRD and docs/IMPLEMENTATION_PHASES.md.
4. Reconcile current GitHub HEAD and Supabase migration/schema/advisors.
5. Check whether authenticated real World/Agent records exist.
6. If they exist, perform one real District → Zone → Booth → GLB → Phase 18 E2E before scaling.
7. If they do not exist, do not fabricate them; improve activation/runtime contracts or request the real authenticated input required.
8. Continue Phase 23E only after reconciling the cross-Agent execution semantics of 23D.
9. Continue Phase 22E for real media/Character runtime.
10. Activate Phase 11 Universe Discovery Engine as the Feed UX composition layer, not as a new engine.
11. Finish completion sub-phases before claiming any top-level phase GREEN.
12. Keep updating this document after every verified increment.

## HANDOFF STATUS
**Current overall status: IMPLEMENTED FOUNDATION / NOT GREEN.**

Immediate target:
**Authenticated Real-Data E2E + Allpha Universe Discovery Engine activation planning**, with no fake data/assets and no duplicate engines.

---

# MASTER ARCHITECTURE ADDENDUM — 2026-10-03
## Conversation vs AI Service Boundary + Human Owner Takeover + Agent Skill Economy

This addendum is canonical for continuation. It consolidates the latest Allpha decisions about Agent discovery, normal conversation, explicit AI work, Human Owner takeover and the Skill Challenge economy.

## 1. Two interaction classes

Allpha MUST distinguish:

### A. Conversation / Social-Business Interaction — FREE

Discovery can originate from Feed/Content, Moments, Live, Districts, Zones, Booths, Search, Agent Account/Profile, previous conversations or recommendations.

After discovering another Human's AI Agent, a Human may:
- introduce themselves
- ask who the Agent/Human is
- ask about products, prices or offers
- discuss sales
- present a product/business
- network
- negotiate
- discuss partnerships
- have ordinary social/business conversation.

These use the canonical Messaging / Conversation layer only.

Canonical path:
Human → Agent Account → Message / Ask → Conversation → Agent or Human Owner → Response

Rules:
- no Model Router
- no AI Gateway generation
- no Agent Service reservation
- no AI Credit debit
- no AI Service reward
- no Skill Challenge usage merely because a message was sent
- Human Owner may take over.

IMPORTANT: Ask is an interaction primitive, not a billing primitive.

### B. AI Service / Generation Interaction — CREDIT

AI Credits are consumed only when the Human explicitly asks the Agent to perform an AI task such as research, analytics, design, video, content, coding, strategy or another configured AI capability.

Canonical path:
Human → Agent Account → Message / Ask → explicit AI Task → Agent Service → Skill Resolution → Agent Runtime → Memory/RAG where authorized → AI Gateway → Model Router → Generate → Result

Only this path creates AI Service usage and AI Credit debit.

## 2. No duplicate engines

Do NOT create a Conversation AI Engine, Ask Engine, Skill Execution Engine, Skill Generate Engine, Skill Reward Engine or Social AI Engine.

Reuse the existing Messaging, Agent Service, Agent Runtime, Memory/RAG, AI Gateway, Model Router, Workflow/Mission and Economy primitives.

## 3. Human Owner Takeover

An Agent conversation remains one canonical conversation. The Human Owner may enter it directly.

Server-authoritative conversation metadata uses:

{
  "interaction_mode": "conversation | human_takeover",
  "human_takeover_active": true,
  "agent_id": "...",
  "agent_owner_user_id": "..."
}

For Agent conversations, the owner is represented as an agent_owner participant so the owner can read and explicitly take over.

When takeover is active:
- the owner may send as Human
- new paid Agent Service execution on that conversation is blocked
- Agent-generated service output cannot be appended
- no authority is transferred to the Agent
- ownership, capabilities, policy, risk and approval remain unchanged.

The owner can release the conversation back to the Agent.

## 4. Implemented backend boundary

Migration: database/migrations/20261003143000_phase_21_conversation_service_boundary.sql

Implemented RPCs:
- get_agent_conversation_control
- set_agent_conversation_takeover
- hardened create_direct_conversation
- hardened send_message
- hardened reserve_agent_service_request
- hardened append_agent_service_message

API:
- GET /api/v1/messaging/conversations/{conversation_id}/control
- POST /api/v1/messaging/conversations/{conversation_id}/takeover

UI: apps/web/components/messaging-platform.tsx

The Messaging UI explicitly separates normal free Conversation from paid AI Service.

## 5. Skill Challenge economic loop

Skill Challenge is a cross-domain quality/reputation/economic layer, not an AI execution engine.

Canonical loop:
Agent Account → Skills → Human discovers Agent → Conversation OR explicit AI Task → Agent Service → Agent Runtime → AI Gateway/Model Router → Result → Verified Usage → Quality Evaluation → Skill Challenge → Reputation + AI Credit Reward

Normal conversation does not become Skill usage merely because it occurred.

The current Phase 21 reward model is v1:
Reward = Service Credit Cost × Quality Score / 100

with the current verified-outcome cap of 100 AI Credits per quality event.

This is not the final Economy design. Phase 25 may evolve the formula while reusing canonical service, ledger and reputation primitives.

Quality outcomes remain cross-owner, tied to completed Agent Service usage, requester-originated, idempotent and auditable. Self-reward is prohibited.

## 6. Cross-surface product loop

Feed / Content / Moments / Live / District / Booth / Search / Agent Account
→ Agent Profile + Skills
→ Message / Ask
→ Conversation OR explicit AI Task
→ existing Messaging / Agent Service / Agent Runtime stack
→ Result
→ Quality Outcome
→ Skill Challenge
→ Reputation / Reward

Each layer activates only when applicable. A normal conversation must never be forced through the AI generation stack.

## 7. Phase 22 rule

Live is another discovery/interaction surface. It MUST reuse canonical Messaging semantics and the existing Agent Service / Agent Runtime / AI Gateway when a Human explicitly requests AI work.

Live must not create another conversation AI engine.

## 8. Authority safety

Authority remains:
Human Owner → Agent Passport → Capability → Policy → Consent → Risk → Approval → Agent Runtime → Tool / Audit

Conversation status, Human takeover, skill level, quality score, reputation, leaderboard position, spatial presence, Theme, World, Booth or Character never grants Agent authority.

## 9. Verification

Repository test: database/tests/phase_21_conversation_service_boundary_invariants.sql

Live verification: 7/7 conversation/service boundary invariants passed.

No synthetic Human, Agent, Conversation, Message, Service Request, Credit Ledger or Skill records were inserted.

Authenticated multi-user E2E remains a later completion gate because no real Agent business records currently exist for legitimate E2E provisioning.

## 10. Canonical continuation rule

Conversation creates relationship.
AI Service creates computational value.
Verified quality creates reputation.
Reputation can create demand and reward.

Canonical architecture:
Messaging → Conversation → explicit AI Service → Agent Runtime → Memory/RAG → AI Gateway / Model Router → Result → Quality Outcome → Skill Challenge → Economy.

Do not reinterpret ordinary Agent messaging as billable AI execution. Do not create a second engine to enforce this distinction.

---

---

# MASTER ARCHITECTURE ADDENDUM — 2026-10-03 — UNIFIED DISCOVERY → AGENT → INTERACTION → ECONOMY

> This section supersedes any older continuation wording that treats Discovery, Agent Account, Conversation, AI Service, Skill Challenge, Live, District or Booth as separate interaction engines. It is an architectural composition layer over the existing canonical domains.

## 1. Product interaction thesis

Allpha activity starts with **Discovery of a Human-owned AI Agent**.

A Human may discover an Agent through:

- Feed / Content
- Moments
- Live
- Universe / Galaxy / World
- District
- Zone
- Booth / Tenant
- Search / Agent search
- Agent Account / Profile
- previous Conversation
- recommendations / related entities

The discovery surface is only an entry point. It must resolve to the **same authoritative Agent Account**.

Canonical identity:

```text
Human Owner
    ↓ owns
AI Agent Account
    ├── Identity / Passport
    ├── Profile
    ├── Skills
    ├── Skill Levels
    ├── Quality / Reputation
    ├── Portfolio / Content
    ├── Moments
    ├── Live history
    ├── Services
    └── AI Credit earnings / usage history
```

The Agent Account is therefore both:

- a **social identity** in the Universe; and
- an **economic identity** for verified AI work.

It is not a second authority system.

## 2. Unified cross-domain interaction graph

```text
                         ALLPHA UNIVERSE
                              │
        ┌─────────────── Discovery Surfaces ────────────────┐
        │        │          │          │        │            │
      Feed     Moments     Live     District  Booth       Search
        │        │          │          │        │            │
        └────────┴──────────┴──────────┴────────┴────────────┘
                              │
                              ▼
                       AI AGENT ACCOUNT
                              │
              ┌───────────────┼────────────────┐
              │               │                │
           Profile          Skills          Portfolio
              │               │                │
              └───────────────┼────────────────┘
                              │
                       Ask / Message Agent
                              │
                 ┌────────────┴────────────┐
                 │                         │
        NORMAL CONVERSATION          EXPLICIT AI TASK
              FREE                        CREDIT
                 │                         │
                 ▼                         ▼
          Messaging / DM             Agent Service
                 │                         │
                 │                  Skill Resolution
                 │                         │
                 │                  Agent Runtime
                 │                         │
                 │                 Memory / Knowledge
                 │                         │
                 │                    AI Gateway
                 │                         │
                 │                    Model Router
                 │                         │
                 │                      Generate
                 │                         │
                 └──────────────┬──────────┘
                                ▼
                         HUMAN RECEIVES RESULT
                                │
                         verified service usage
                                │
                         quality evaluation
                                │
                     Agent Skill Challenge Layer
                         │                  │
                         ▼                  ▼
                     Reputation        AI Credits
```

There is **one execution path** for AI work. There is **one conversation path** for social/business communication. They meet at the Agent Account but do not collapse into one billing behavior.

## 3. Conversation is not the same as AI Service

### Normal Conversation — free

Examples:

- greeting / introduction
- asking who the Agent/Human is
- asking about a business
- discussing products or prices
- networking
- partnership discussion
- ordinary sales conversation
- negotiation
- follow-up

Canonical path:

```text
Human
 → Agent Account
 → Message / Ask
 → Conversation
 → Agent or Human Owner
 → Response
```

A normal message MUST NOT automatically:

- call Model Router
- call AI Gateway generation
- reserve Agent Service
- debit AI Credits
- create Skill Challenge usage
- create reward

**Ask is an interaction primitive, not a billing primitive.**

### Explicit AI Service — paid/credit-bearing

Examples:

- research
- analytics
- design
- video
- content generation
- coding
- strategy
- configured specialist work

Canonical path:

```text
Human
 → Agent Account
 → Message / Ask
 → explicit AI Task
 → Agent Service
 → Skill Resolution
 → Agent Runtime
 → Memory / RAG (authorized)
 → AI Gateway
 → Model Router
 → Generate
 → Result
```

Only this path creates billable/credit-bearing AI Service usage.

## 4. Human Owner Takeover

An Agent conversation remains **one canonical Conversation**.

The Human Owner may enter the same Conversation and explicitly take over.

Authoritative conversation metadata:

```json
{
  "interaction_mode": "conversation | human_takeover",
  "human_takeover_active": true,
  "agent_id": "<uuid>",
  "agent_owner_user_id": "<uuid>"
}
```

Rules:

1. Owner takeover is server-authoritative.
2. The owner may send as Human while takeover is active.
3. New Agent Service execution on that conversation is blocked while takeover is active.
4. Agent-generated service output cannot be appended while takeover is active.
5. Releasing takeover returns the Conversation to Agent interaction.
6. Takeover never changes Agent ownership, capability, policy, consent, risk or approval.
7. Takeover is an interaction-state change, not an authority escalation.

Existing implementation boundary:

- `get_agent_conversation_control`
- `set_agent_conversation_takeover`
- hardened `create_direct_conversation`
- hardened `send_message`
- hardened `reserve_agent_service_request`
- hardened `append_agent_service_message`

Existing migration:

`database/migrations/20261003143000_phase_21_conversation_service_boundary.sql`

## 5. Skill Challenge is a cross-domain quality/economy layer

Do **not** create a Skill Execution Engine or Skill Reward Engine.

Skill Challenge observes canonical Agent Service usage.

Canonical loop:

```text
Agent Account
 → Skill
 → verified cross-owner usage
 → completed Agent Service
 → quality evaluation
 → Skill Challenge
 → Skill quality / level / reputation
 → AI Credit reward
```

Current v1 reward model:

```text
Reward = Service Credit Cost × Quality Score / 100
```

with the current verified-outcome cap of 100 AI Credits per event.

This is a transparent v1 economic rule, **not the final Phase 25 Economy design**.

Requirements:

- requester and Agent Owner must be different Humans
- service must be completed
- quality outcome must be requester-originated
- outcome must be idempotent
- evidence/dimensions are retained
- self-reward is prohibited
- reward is posted through the canonical AI Credit ledger
- reputation/skill score never grants authority

Future quality evaluators may consume real modality evidence for research, analytics, design, video, content and other skills, but they must feed the same Skill Challenge layer rather than create modality-specific reward engines.

## 6. Discovery surfaces must converge on one Agent Account

Every discovery surface should eventually expose a consistent Agent identity card/action contract:

```text
Agent identity
Owner
Skills
Skill level
Quality/reputation
Services
Portfolio/content
Availability
AI Service cost
Ask / Message
```

Surface-specific context may be retained:

```text
Feed      → source_content_id
Moment    → source_moment_id
Live      → live_session_id
District  → district_id / zone_id
Booth     → booth_id
Search    → query / discovery_context
Profile   → direct_agent
```

This context is metadata for attribution/discovery. It does not create a second interaction engine.

When the Human selects **Ask this Agent**, the UI must resolve the authoritative Agent UUID and use the canonical Messaging/Agent Service APIs.

## 7. One Conversation, multiple entry contexts

The same Agent can be reached from multiple surfaces.

The system MUST NOT create a separate conversation engine for:

- Feed
- Moments
- Live
- District
- Booth
- Search
- Agent Profile

Instead:

```text
Discovery Context
      ↓
Agent Account
      ↓
existing Conversation
      ↓
optional explicit Agent Service
```

Where attribution is required, store source context on the existing conversation/service request using authoritative metadata.

## 8. Live integration rule

Phase 22 Live is another discovery and interaction surface.

Live may expose:

- Agent Host
- Agent Presenter
- Human Host
- audience interaction
- Ask Agent
- Message Agent
- explicit AI task request

But Live MUST reuse:

- Messaging
- Agent Service
- Agent Runtime
- Memory/RAG
- AI Gateway
- Model Router
- existing approval/risk/policy
- existing AI Credit ledger

Live must not create another AI conversation or generation engine.

## 9. Spatial integration rule

District / Zone / Booth / Character / Portal are contextual presentation and discovery layers.

Correct:

```text
Spatial encounter
 → Agent Account
 → Message / Ask
 → Conversation OR explicit AI Service
```

Incorrect:

```text
Spatial proximity
 → automatic authority
 → automatic AI execution
 → automatic billing
```

Spatial presence never grants permission.

## 10. Content / Feed / Moments integration

Content can be:

- authored by a Human
- authored by a Human's Agent
- generated through Agent Service
- a discovery surface for an Agent
- a source context for an explicit AI task

If a Human selects an Agent from Content:

```text
Content
 → Agent Account
 → Ask / Message
```

If the Human asks the Agent to transform/analyze/research the Content:

```text
Content
 → Agent Account
 → explicit AI Task
 → Agent Service
 → source_content_id
 → Agent Runtime
 → result
```

The same canonical Content and Agent Service systems are reused.

## 11. Agent Account as economic identity

The Agent Account should progressively expose an authoritative read model containing:

- identity
- owner
- profile
- skills
- skill level
- quality
- verified usage
- successful usage
- reputation
- portfolio
- content
- moments
- live history
- available services
- AI Credit earnings
- review/outcome history where privacy permits

Economic signals are derived from verified platform activity. They are not permission grants.

No leaderboard, skill level, reward balance or reputation value may bypass:

```text
Human Owner
 → Agent Passport
 → Capability
 → Policy
 → Consent
 → Risk
 → Approval
 → Agent Runtime
 → Tool / Audit
```

## 12. Implementation map — reuse before adding

| Requirement | Canonical implementation |
|---|---|
| Agent discovery | existing Discovery / Feed / Search / spatial surfaces |
| Agent identity | existing Agent domain + Agent Account UI |
| Normal conversation | existing Messaging |
| Human takeover | conversation control RPC/API |
| Explicit AI work | existing Agent Service |
| Skill selection | existing Agent Skill registry |
| AI execution | existing Agent Runtime |
| Memory/knowledge | existing Memory/RAG |
| Model boundary | existing AI Gateway / Model Router |
| Generated content | existing Content / Agent Service materialization |
| AI Credits | existing AI Credit ledger |
| Quality/reward | existing Skill Challenge + quality outcome RPC |
| Live | Phase 22, composing existing interaction primitives |
| District/Booth | existing spatial/discovery composition |
| Audit | existing activity/audit infrastructure |
| Authority | existing Policy/Risk/Approval/Agent Runtime chain |

## 13. Required implementation sequence

Do not implement this as one giant new subsystem. Complete it as vertical slices:

### Slice A — Agent Account discovery contract
- expose Agent Account identity + skills + services consistently
- ensure Feed/Moments/Search/District/Booth/Profile can resolve the same Agent UUID
- preserve source context
- add no new engine

### Slice B — Ask / Conversation contract
- discovery action → existing direct conversation
- ordinary messages remain free
- Agent owner appears as canonical participant for takeover
- takeover/release remains server-authoritative

### Slice C — Explicit AI Service
- distinguish ordinary message from explicit AI task
- pass source context/content ID
- resolve Skill
- reserve credits
- execute existing Agent Runtime
- append result to existing Conversation where appropriate

### Slice D — Verified Skill Challenge
- completed Agent Service → requester quality outcome
- update Skill quality/usage
- post reward through existing ledger
- update reputation/read model
- prevent self-reward and duplicate reward

### Slice E — Cross-surface activation
- Feed
- Moments
- Search
- Agent Profile
- District
- Booth
- Live

All call the same Agent Account → Messaging / Agent Service boundary.

### Slice F — Phase 22 Live integration
- Live entry discovers Agent
- Ask/Message reuses canonical Conversation
- explicit AI task reuses Agent Service
- audience/realtime remains transport/presentation
- no duplicate AI engine

### Slice G — Phase 25 Economy evolution
- retain verified usage ledger
- evolve reward/pricing formula only in canonical Economy
- preserve historical reward provenance
- do not move execution responsibility into Economy

## 14. Database design rule

Prefer existing tables and metadata over new tables.

Potential additions are allowed only where a real normalized relation is required, for example a durable Agent Account read model or explicit discovery attribution relation. Before adding one:

1. search repository
2. inspect live Supabase schema
3. inspect existing RPCs
4. determine whether existing Agent / Content / Discovery / Conversation / Service tables already express the relation
5. only then create a migration

Do not create duplicate tables for:

- agent profiles
- conversations
- messages
- services
- skills
- rewards
- reputation
- discovery
- live chat

## 15. Security and abuse controls

All cross-surface interaction must enforce:

- authenticated identity
- Agent public visibility/availability
- owner relationship
- Social Block rules
- DM policy
- Agent capability
- service eligibility
- AI Credit balance
- idempotency
- rate/abuse limits
- policy/risk/approval where applicable
- audit events
- Human takeover state
- no service-role browser access

Quality/reward additionally requires:

- completed service
- cross-owner requester
- requester-only evaluation
- duplicate-event protection
- ledger idempotency
- auditable evidence

## 16. Empty-state rule

Because fake business data are prohibited, the UI must remain useful with zero Agents/Conversations/Services.

Examples:

- "Belum ada Agent publik yang dapat ditemukan."
- "Belum ada Conversation."
- "Belum ada Skill yang dipublikasikan."
- "Belum ada hasil AI Service."
- "Belum ada verified usage."

Never insert synthetic Agents or Conversations merely to demonstrate the UI.

## 17. Completion status

Current architecture:

- Conversation vs AI Service boundary: **IMPLEMENTED FOUNDATION**
- Human Owner Takeover: **IMPLEMENTED FOUNDATION**
- Skill Challenge v1 reward loop: **IMPLEMENTED FOUNDATION**
- Agent discovery → canonical Agent Account convergence: **ARCHITECTURE DEFINED / CROSS-SURFACE ACTIVATION PENDING**
- Agent Account economic read model: **PARTIAL / ACTIVATION REQUIRED**
- Feed/Moments/Search/District/Booth integration: **PARTIAL / ACTIVATION REQUIRED**
- Live → canonical Messaging/Agent Service integration: **PHASE 22 / FOUNDATION**
- final authenticated multi-user E2E: **PENDING**
- final Economy v2: **PHASE 25**
- final Green: **NOT GREEN**

## 18. Canonical acceptance flow

The final intended human journey is:

```text
Human sees Content / Moment / Live / District / Booth / Search
                    ↓
              discovers Agent
                    ↓
             opens Agent Account
                    ↓
          reviews Skills / Quality
                    ↓
             Ask / Message
              ↙           ↘
     normal conversation   explicit AI task
          FREE                 CREDIT
           ↓                     ↓
     Agent / Owner         Agent Service
           ↓                     ↓
        response        Runtime + RAG + AI Gateway
                                 ↓
                              result
                                 ↓
                         verified quality
                                 ↓
                         Skill Challenge
                           ↙         ↘
                     reputation    AI Credits
```

This is the single cross-domain interaction architecture for Allpha Universe. Do not implement a second path.

## 19. Master continuation instruction

For future implementation, begin from the current repository/live state and execute:

**READ → UNDERSTAND → INSPECT → RECONCILE REPO + SUPABASE → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → REVIEW → REPORT**

Priority order:

1. complete Agent Account discovery contract
2. wire cross-surface Ask/Message actions
3. wire explicit AI Service from the same Agent Account
4. wire verified Skill Challenge outcomes
5. integrate Phase 22 Live
6. evolve Economy in Phase 25
7. final authenticated E2E only after domain completion

Never restart an already implemented engine. Never create fake data. Never claim GREEN without runtime evidence.

---

## PHASE 21A — AGENT ACCOUNT DISCOVERY CONTRACT — IMPLEMENTED FOUNDATION

Implemented as a cross-domain composition layer over existing Agent, Skill, Reputation, Discovery, Content, Spatial, Booth and Live primitives. No duplicate Agent Account table or Agent engine was introduced.

### Canonical Agent Account read model

```text
Existing agents
   +
published agent_skills
   +
agent_skill_challenge_leaderboard
   ↓
Agent Account Discovery Contract
```

Public read model exposes only:
- Agent identity: id, name, handle, description, avatar path, runtime state
- published Skills
- skill level / quality / verified usage / successful usage
- challenge level
- reward credits earned as an economic history signal
- message/ask/profile action contract
- viewer ownership boolean only; owner_user_id is never exposed by the public read model

### Backend

Migration:
`database/migrations/20261003150000_phase_21a_agent_account_discovery_contract.sql`

Canonical RPCs:
- `discover_public_agent_accounts(query, limit, offset)`
- `get_public_agent_account(agent_id)`

Security:
- SECURITY DEFINER
- explicit empty `search_path`
- anonymous EXECUTE revoked
- authenticated EXECUTE only
- public Agent must be active + public
- Social Block rules applied
- only published/enabled Skills exposed
- no private Agent/owner data exposed

FastAPI:
`apps/api/app/api/agent_catalog.py`

Endpoints:
- `GET /api/v1/agent-catalog/accounts`
- `GET /api/v1/agent-catalog/accounts/{agent_id}`

Discovery context resolution supported without new tables:
- `district_id` → existing `agent_spatial_states` + `district_zones`
- `booth_id` → existing Booth `agent_id` / `host_agent_id`
- `live_session_id` → existing Live `host_agent_id`
- `content_id` → existing Content `owner_type=agent` / `owner_id`

### Web surfaces

New reusable component:
- `apps/web/components/agent-account-card.tsx`

New discovery surface:
- `apps/web/app/agents/discover/page.tsx`

New public Agent Account surface:
- `apps/web/app/agents/account/[agent_id]/page.tsx`

Existing surfaces activated:
- Universe Discovery → Agent Account cards
- Feed / Moments / Content → Agent-authored Content resolves to Agent Account
- District → active spatial Agent presence resolves to Agent Account
- Booth → AI Host resolves to Agent Account
- Live → Host Agent resolves to Agent Account
- Search → Agent Discovery endpoint/page resolves to same Agent UUID

### Canonical interaction contract

```text
Discovery Surface
 → authoritative Agent UUID
 → Agent Account
 → Ask / Message
 → existing Messaging
      OR
 → explicit AI Task
 → existing Agent Service
```

Slice A does not create a second Conversation/Ask/Service engine.

### Empty-state behavior

No synthetic Agents/Skills/Conversation/Business records were inserted.

Current live counts:
- Agents: 0
- Agent Skills: 0
- Skill Challenge Leaderboard: 0

Therefore the UI correctly renders legitimate empty states until a real Human creates/publishes an Agent.

### Verification

Migration:
- `phase_21a_agent_account_discovery_contract` applied live

Security verification:
- discovery/account RPCs exist
- SECURITY DEFINER verified
- empty search_path verified
- anonymous EXECUTE revoked
- authenticated grant verified by migration contract

Repository test:
`database/tests/phase_21a_agent_account_discovery_contract_invariants.sql`

The SQL invariant execution passed without inserting business data.

### Status

**PHASE 21A — IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**

The public Agent Account/discovery contract is implemented. Authenticated multi-user verification of a real Agent → discovery surface → Account remains pending because the live database currently contains zero real Agents by design.

Next:
**Slice B — Ask / Conversation Contract**, reusing the existing Messaging + Human Owner Takeover + Conversation Service boundary.

## PHASE 21B — ASK / CONVERSATION CONTRACT — IMPLEMENTED FOUNDATION

Implemented as a composition layer over the existing canonical Messaging + Conversation Service Boundary + Human Owner Takeover. No second Conversation engine, Ask engine, or AI execution engine was introduced.

### Canonical contract

```text
Discovery Surface
 → Agent Account
 → Ask / Message
 → canonical Conversation
 → normal Message / Ask = free interaction

Explicit AI task
 → existing Agent Service
 → Agent Runtime
 → Memory/RAG
 → AI Gateway / Model Router
 → result
```

Important:
- Ask is an interaction primitive, not a billing primitive.
- Normal Message/Ask does not automatically invoke Model Router, AI Gateway, Agent Runtime, reserve Agent Service, debit AI Credits, or create Skill Challenge reward usage.
- Explicit AI work continues through the existing Agent Service boundary.
- Human Owner Takeover remains authoritative and unchanged.
- Proximity/discovery context is provenance only and never grants authority.

### Database

Migration:
database/migrations/20261003160000_phase_21b_ask_conversation_contract.sql
database/migrations/20261003160100_phase_21b_ask_context_hardening.sql

Canonical RPC:
- get_or_create_agent_conversation(agent_id, interaction_mode, source_context, initial_message, client_message_id)

Behavior:
- validates authenticated Human
- validates active/non-archived target Agent
- reuses the latest active/pending direct Human↔Agent Conversation when present
- otherwise delegates creation to existing create_direct_conversation
- records discovery provenance in Conversation metadata
- hardening restricts provenance keys to source_surface, district_id, zone_id, booth_id, live_session_id, content_id, and moment_id
- records Ask/Message mode in message metadata when an initial message is sent
- delegates message creation to existing send_message
- does not create a new Conversation engine

Security:
- SECURITY DEFINER
- empty search_path
- anonymous EXECUTE revoked
- authenticated EXECUTE granted

### FastAPI

Modified:
apps/api/app/api/messaging.py

New endpoint:
- POST /api/v1/messaging/conversations/agent

Payload:
- agent_id
- interaction_mode: message | ask
- optional message
- optional client_message_id
- optional source_context

The endpoint is an authenticated application-boundary wrapper over the canonical RPC.

### Web

Modified:
- apps/web/components/messaging-platform.tsx
- apps/web/components/agent-account-card.tsx
- apps/web/app/agents/account/[agent_id]/page.tsx

Activated behavior:
- Agent Account can enter Messaging directly as Ask or Message
- existing /messages resolves target_type=agent&target_id=...
- optional discovery provenance can be carried with district_id, booth_id, live_session_id, content_id, or moment_id
- the existing Conversation is reused instead of creating a duplicate direct Conversation
- the UI explicitly explains that Ask is free interaction, while AI Service remains a separate paid/credit-bearing path
- Human Owner Takeover controls remain on the same Conversation surface

### Test

Repository test:
database/tests/phase_21b_ask_conversation_contract_invariants.sql

Verified live:
- resolver exists
- SECURITY DEFINER
- empty search_path
- anon execution denied
- authenticated execution granted
- existing direct Conversation RPC remains
- existing send-message RPC remains
- existing Human Owner Takeover RPCs remain
- no Agent or Conversation business records were seeded

Invariant execution:
10/10 passed

### Verification boundary

No authenticated multi-user runtime E2E was fabricated because:
- live Agents = 0
- live Skills = 0
- no real second Human/Agent pair exists for a valid cross-owner test

The implementation is therefore:
**PHASE 21B — IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**

### Next implementation

**Slice C — Explicit AI Service Contract & Skill Resolution**, reusing the existing Agent Service → Agent Runtime → Memory/RAG → AI Gateway / Model Router path.

## PHASE 21C — EXPLICIT AI SERVICE CONTRACT & SKILL RESOLUTION — IMPLEMENTED FOUNDATION

Slice C activates the explicit paid/credit-bearing AI path from the canonical Agent Account and Conversation contract. No second AI execution engine was introduced.

### Canonical contract

```text
Agent Account
 → selected published/active Skill
 → Skill Resolution
 → canonical Agent Conversation
 → explicit AI Service request
 → AI Credit reservation
 → Agent Runtime command
 → Memory/RAG service context
 → AI Gateway / Model Router
 → result
 → canonical Conversation
 → settlement / generated Content
```

### Skill Resolution

New canonical RPC:
- `resolve_public_agent_service(agent_id, skill_name)`

It resolves:
- public active Agent
- cross-owner restriction
- Social Block restrictions
- enabled Agent Skill
- Skill metadata / configuration
- Skill category / level / quality
- catalog risk level
- configured AI Credit cost
- required `ai.generate` capability

Security:
- SECURITY DEFINER
- empty `search_path`
- anon EXECUTE revoked
- authenticated EXECUTE granted

### Explicit AI Service

Existing Agent Service endpoint was reconciled to the canonical Skill Resolver:
- `POST /api/v1/messaging/agent-services/generate`
- `GET /api/v1/messaging/agent-services/resolve`

Important boundary:
- normal Message / Ask remains free
- explicit AI Service is the only path that reserves AI Credits
- service reservation is bound to the canonical Agent Conversation
- a newly resolved Conversation must be active before reservation
- existing `reserve_agent_service_request` remains the authoritative credit/eligibility boundary
- Human Owner Takeover is enforced by the existing reservation RPC
- service execution continues through existing Agent Runtime
- service context continues through existing Memory/RAG visibility rules
- generation continues through existing AI Gateway / Model Router
- result continues through existing `append_agent_service_message`
- settlement continues through existing `complete_agent_service_request`
- failure/refund continues through existing `release_agent_service_request`

### Conversation convergence

If no Conversation ID is supplied, Slice C now uses:
- `get_or_create_agent_conversation`
- interaction mode = `ask`
- canonical discovery provenance only

It no longer creates a separate contextual Conversation engine.

### Web activation

Agent Account Skill Portfolio now exposes:
- **Use Skill**
- **Discuss**

Use Skill enters the existing Messaging surface with the authoritative Agent UUID + selected Skill and resolves the Skill before explicit AI Service execution.

The Messaging surface displays:
- selected Agent
- selected Skill
- Skill level
- current configured AI Credit cost when resolvable
- explicit distinction between free Ask and paid AI Service

### Security / authority

Slice C does not allow:
- self-use of an Agent
- blocked Human ↔ owner interaction
- inactive/private Agent service
- disabled Skill service
- missing `ai.generate` capability
- AI Service execution during Human Owner Takeover
- credit debit outside `reserve_agent_service_request`
- direct browser-side privileged database mutation

### Database

Migrations:
- `database/migrations/20261003171000_phase_21c_explicit_ai_service_skill_resolution.sql`

Repository test:
- `database/tests/phase_21c_explicit_ai_service_skill_resolution_invariants.sql`

Verification:
- **12/12 invariants passed**
- no Service Request or Agent Runtime command seed data inserted

### Current status

**PHASE 21C — IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**

Runtime E2E remains pending because the live database intentionally contains zero real Agents / Skills / Service Requests. No fake business records were inserted.

### Next implementation

**Slice D — Verified Skill Challenge**, connecting completed cross-owner Agent Service usage to requester quality evaluation, Skill Challenge events, reputation signals, and the existing AI Credit reward loop without creating a duplicate reward engine.


## PHASE 21D — VERIFIED SKILL CHALLENGE — IMPLEMENTED FOUNDATION

Slice D completes the requester-side verification path for completed cross-owner Agent Services without creating a second challenge, reward, reputation, or execution engine.

### Canonical flow
Human A → Agent Account of Human B → explicit AI Service → completed Service Request → Human A evaluates result → verified Skill Challenge event → Skill quality/usage update → existing AI Credit reward ledger → Agent Account economic signals

### Skill snapshot on Service Request
agent_service_requests.skill_id now stores the exact agent_skills.id selected at reservation time. This preserves attribution when a Skill is later renamed, disabled, or edited.
The existing reserve_agent_service_request RPC remains the authoritative credit debit, cross-owner eligibility, Agent/Skill availability, Human Owner Takeover, and idempotency boundary.

### Verified outcome read contract
New canonical RPC: list_verifiable_agent_service_requests(p_limit). It exposes to the authenticated requester only completed cross-owner Service Requests that have not yet received a Skill Challenge reward event, including Agent identity, exact Skill snapshot, service type, credit cost, completion timestamp, result references, and current Skill metrics.
FastAPI: GET /api/v1/agent-skills/verifiable-services

### Quality outcome hardening
record_agent_skill_quality_outcome now requires authentication, completed Service Request, requester ownership, cross-owner usage, exact Skill snapshot, quality score 0–100, object-shaped dimensions/evidence, evidence <= 16 KiB, and duplicate-event protection.
Reward remains the existing transparent v1 formula: Service Credit Cost × Quality Score / 100, capped at 100 AI Credits per verified outcome.
Reward is posted only through ai_credit_ledger with source_type=agent_skill_challenge and verified service/result provenance. Skill metrics and the existing challenge leaderboard are updated by the same canonical RPC.

### Web activation
apps/web/app/agents/challenge/page.tsx now exposes completed Service Requests awaiting verification, Evaluate Result, quality score, evidence, and submission through the existing quality outcome endpoint. Skill creation, modification, publishing, and leaderboard remain on the same surface.

### Verification
Repository test: database/tests/phase_21d_verified_skill_challenge_invariants.sql
Live invariant execution: 17/17 passed.
Live Service Requests remain 0; no synthetic business data were inserted.
Security advisor scan was performed. Existing project-wide findings remain; the Phase 21D RPCs have anonymous execution revoked and authenticated execution granted.

### Status
PHASE 21D — IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING
Runtime multi-Human verification remains pending because the live project intentionally has zero real Agent Service Requests/Agents.

### Next
Slice E — Cross-surface activation: Feed, Moments, Search, Agent Profile, District, Booth and Live converge on the same Agent Account → Messaging / Agent Service boundary.


## PHASE 21E — CROSS-SURFACE ACTIVATION — IMPLEMENTED FOUNDATION

Slice E converges existing discovery surfaces onto the canonical Agent Account identity and the existing Messaging / Explicit AI Service boundary.

### Activated surfaces
- Universe / Feed / Moments → Agent Account
- Search → Agent Account
- Agent Account → Ask / Message / Use Skill
- District → Agent Account with district provenance
- Booth → Host Agent Account with booth provenance
- Live → Host Agent Account with live-session provenance
- Messaging → preserves source provenance into the explicit AI Service request

### Canonical provenance
The reusable Agent Account card now accepts discovery context and preserves it across Agent Account navigation, free Ask, and free Message.
Supported provenance: source_surface, district_id, booth_id, live_session_id, content_id, moment_id.
The existing get_or_create_agent_conversation RPC already supports the complete whitelist. No new Conversation engine was introduced.

### Feed / Moments
Agent-authored Content now resolves to the same Agent UUID and opens the canonical Agent Account with source_surface + content_id. Discovery Agent cards preserve the current surface context.

### District
District Agent presence continues to resolve through /api/v1/agent-catalog/accounts?district_id=... and Agent Account actions retain District provenance.

### Booth
Booth Host Agent continues to resolve through /api/v1/agent-catalog/accounts/{host_agent_id} and Agent Account actions retain Booth provenance.

### Live
Live Session host_agent_id is present in the live schema. The Live UI now resolves that exact Host Agent UUID through the canonical Agent Account read model and retains live_session_id provenance.

### Messaging / AI Service
Messaging now forwards source_surface + discovery context into the existing /api/v1/messaging/agent-services/generate contract.
Discovery provenance therefore survives Surface → Agent Account → Conversation → explicit AI Service without creating a surface-specific execution engine.

### Verification
Repository test: database/tests/phase_21e_cross_surface_activation_invariants.sql
Live invariant execution: 11/11 passed.
Verified canonical Agent discovery, Agent Account, Agent Conversation entry, source surface, District, Booth, Live, Content and Moment provenance, plus no duplicate Skill Challenge or Skill Reward engine.
No fake Agent, Conversation, Service Request, Live, Booth, or District data were inserted.

### Status
PHASE 21E — IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING
The live project still has no real Agent/Service/Conversation business dataset, so multi-surface runtime E2E remains pending and is not claimed GREEN.

### Next
Slice F — Phase 22 Live Integration, connecting Live discovery/Agent Account interaction to the existing Phase 22 Live collaboration/runtime boundaries without creating a second Live AI engine or Conversation engine.

## PHASE 22F — LIVE INTEGRATION — IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING

Implemented on `main` and applied to AllphaDb-Universe.

### Canonical Live integration path

`Live Session → Owned Agent Collaboration → Capability → Policy → Consent → Risk → Agent Runtime Command → AI Gateway → Live Message`

No second Live AI engine, Conversation engine, Agent Runtime, or AI Gateway was introduced.

### Character presentation runtime

New table:
- `live_session_character_bindings`

New RPCs:
- `select_live_character(...)`
- `remove_live_character(...)`

Rules:
- only the Live Session owner can select/remove a character
- asset must be real, active and moderation-approved
- asset must belong to the Human or an Agent owned by that Human
- Agent-bound character selection can be bound only to the active Live collaboration for that Agent
- Character presentation cannot change Agent authority
- active binding is unique per Live Session
- binding table is published to Supabase Realtime
- no fake character assets/bindings are created

### Live Agent conversation runtime

Implemented `run_live_conversation_turn()` in the existing `apps/api/app/core/agent_runtime.py`.

The Live turn:
1. validates owned active collaboration and live session
2. collects recent Live conversation context
3. creates the existing canonical Live Agent command
4. reuses existing Agent Runtime planning/execution
5. reuses existing AI Gateway through Agent Runtime
6. writes the Agent response through `create_live_session_message`
7. re-checks Agent active state, capability, policy and kill switch at message persistence time

Audience Ask is exposed through:
- `POST /api/v1/live/sessions/{session_id}/audience/ask`

Character API:
- `GET /api/v1/live/character-assets`
- `GET /api/v1/live/sessions/{session_id}/characters`
- `POST /api/v1/live/sessions/{session_id}/characters`
- `POST /api/v1/live/sessions/{session_id}/characters/remove`

### PWA activation

`apps/web/components/live-streaming-collaboration.tsx` now exposes:
- governed Character asset selection
- active Character binding state
- Character removal
- canonical Live collaboration/runtime controls
- existing Host Agent Account discovery
- existing realtime audience/conversation surface

No Storage URL is fabricated. Character assets remain governed by the existing private Storage/asset lifecycle.

### Security hardening

`create_live_session_message()` now re-checks at the moment an Agent message is persisted:
- authenticated owner
- active Live collaboration
- approved consent
- risk decision allow
- Agent active/owned
- required capability
- active Agent policy
- Agent kill switch disabled
- Live policy enabled

Anonymous execution remains revoked for the new Character RPCs.

### Verification

Repository test:
- `database/tests/phase_22f_live_integration_invariants.sql`

Live Supabase invariant execution:
- **16/16 passed**
- no synthetic Live Sessions
- no synthetic Character bindings
- Realtime publication verified
- Character RPC security/privilege boundaries verified
- Live Agent message authority re-checks verified

Current live data:
- platform Live Experience Templates: 25
- published/validated/performance-passed/approved template versions: 25
- Live Sessions: 0
- Live Collaborations: 0
- Live Messages: 0
- Live Viewers: 0
- Live Audience Interactions: 0
- Character Bindings: 0

Security Advisor was rechecked after the migration. Existing project-wide warnings remain; no new anonymous execution finding was introduced by the Phase 22F Character RPCs.

### Remaining Phase 22 activation gates

Not GREEN yet. The live database intentionally contains no real user-owned Agent/Live business records, so authenticated multi-user E2E cannot be truthfully claimed.

Still pending as separate runtime/production gates:
- real authenticated Human creates a Live Session
- real owned Agent collaboration reaches active state
- real approved Character Storage asset is selected
- real server-side AI provider credential/runtime succeeds
- real Agent Runtime command + AI Gateway request/attempt is observed
- browser Realtime multi-user verification
- actual camera/stream transport provider/runtime
- voice/TTS runtime
- production media compositor/character animation output
- accessibility/performance/browser build verification
- CI/runtime/staging/production gates

Phase 22 remains **IMPLEMENTED FOUNDATION / NOT GREEN**.

### Phase 22F completion hardening

Added server-authoritative Live transport lifecycle:
- `start_live_session(session_id, stream_provider, stream_reference)`
- `end_live_session(session_id)`

These lifecycle RPCs:
- require authenticated ownership of the Live Session
- require a real external stream provider/reference supplied by the caller
- require a valid Live Experience Template + Version
- transition `draft/scheduled → live → ended`
- record `started_at/ended_at`
- keep provider/media transport external; no fake stream URL/provider is generated

FastAPI:
- `POST /api/v1/live/sessions/{session_id}/start`
- `POST /api/v1/live/sessions/{session_id}/end`

Phase 22F invariant test was expanded to **20/20 passed** after adding lifecycle security coverage.

No real Live Session, Agent, Collaboration, Character Binding, Viewer, Message, or Audience Interaction was inserted during implementation.




## Phase 22I — AI Character Asset + Animation Contract

Repository/live status: **IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**.

Implemented:
- 34 platform-ready AI Character runtime assets backed by the existing enabled Agent Character Catalog.
- New `live_character_asset_contracts` table and v1 contract for full-body channels, face channels, voice-driven mouth/jaw proxy, gestures, state machine and performance budget.
- Platform character selection through the canonical Live Character binding RPC.
- Web UI character catalog and Use Character activation.
- Canonical AllphaWorldRenderer platform humanoid runtime with deterministic full-body/face/eye/lip animation.
- GPT-Live voice lifecycle states drive animation: listening → thinking → speaking, with audio level driving mouth/jaw intensity.
- Existing 8 Ready Allpha Uniform presets are already published/approved and claimable by Human users.

Important runtime boundary: animation is presentation only. It never grants Agent authority. The existing Human Owner → Agent Passport → Capability → Policy → Consent → Risk → Approval → Agent Runtime chain remains authoritative.

E2E gate remains open until a real authenticated user creates/uses a Live Session with approved Collaboration, camera/microphone permissions and browser/device runtime. No fake business data was inserted.


## 2026-10-04 — Phase 22I Runtime Orchestration Completion

Phase 22I continuation has been completed at the Web/domain orchestration layer without resetting the existing character, Live, Agent Runtime, AI Gateway, Realtime or renderer architecture.

Implemented in this increment:
- Canonical client-side `AI Character Animation Contract` reducer and semantic gesture mapping.
- Realtime voice event → character state synchronization for listening, thinking, speaking, completion, interruption and error states.
- Facial and gaze presentation signals consumed by the canonical `AllphaWorldRenderer`.
- Duplicate Live `/start` route override removed; transport start is now isolated under the transport endpoint while canonical session lifecycle remains authoritative.
- 10/10 Phase 22I runtime contract invariants passed against AllphaDb-Universe.
- No fake business data, per-frame persistence, duplicate event bus, duplicate renderer, duplicate AI Gateway or duplicate Agent Runtime introduced.

Status remains **IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING** because authenticated browser/device execution with a real user-owned Live Session, approved Collaboration, microphone/camera and configured provider credential has not been performed in this implementation stage.

### Next continuation
**Phase 23 — AI-to-AI Collaboration**, specifically continue **23E — Review + Reputation + History** after reconciling the existing 23A–23D foundation. Do not restart completed 23A–23D work.


## 2026-10-04 — Phase 23E Review + Reputation + History

Phase 23E is implemented at the domain/persistence/API/Web surface layer without replacing existing Collaboration, Reputation, Audit, Agent Runtime or Workflow engines.

Implemented:
- `agent_collaboration_results` durable execution-result history.
- `agent_collaboration_reviews` participant-owned review/evaluation records.
- Existing `agent_reputation_events` remains the authoritative reputation event sink.
- Existing `audit_logs` records result/review evidence.
- Participant-scoped RLS and canonical RPC lifecycle.
- FastAPI result/review/history routes.
- Web `/collaboration/history` review and history surface.
- 12/12 invariants passed on AllphaDb-Universe.
- No fake business/collaboration data seeded.

Reputation remains evaluation/history only. It cannot mutate permissions, capabilities, policy, risk or approval.

Status: **IMPLEMENTED FOUNDATION / REAL COLLABORATION E2E PENDING** because the live project has zero real collaboration business records and no authenticated cross-Agent execution/review flow has been run.

### Next continuation
**Phase 24 — Marketplace & Commerce**, starting with repository/live-Supabase reconciliation of the existing marketplace, commerce, Tenant/Booth, Entitlement, Economy/Billing and Payment dependencies. Do not create a second commerce, wallet or entitlement engine.
