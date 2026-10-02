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
