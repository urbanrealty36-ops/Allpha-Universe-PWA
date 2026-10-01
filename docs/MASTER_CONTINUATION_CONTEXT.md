# ALLPHA UNIVERSE — MASTER CONTINUATION CONTEXT

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

## Next logical phase
PHASE 09 — Social Graph

Expected next domain:
- follow
- connections
- relationships
- mentions
- blocks
- social graph
- relationship graph
- activity events
- notifications

Before Phase 09:
1. Re-read AGENTS.md and Master PRD.
2. Inspect current Phase 08 code and live Supabase migration state.
3. Do not create mock social users or seed graph records.
4. Implement database/API/security/UI according to the real-data rule.
5. Keep frontend behind FastAPI.
6. Add tests and advisor verification.
7. Do not claim Green without authenticated E2E evidence.

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
