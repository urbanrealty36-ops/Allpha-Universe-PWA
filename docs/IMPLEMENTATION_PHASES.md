# Allpha Universe — Full Implementation Phases

## Governing rules

Implementation is performed directly on `main`. `AGENTS.md` is binding.

- No hardcoded business data.
- No fake, mock, dummy, scenario, or placeholder business data.
- No SQLite.
- No fake API responses.
- Backend API is the authoritative application boundary.
- Supabase PostgreSQL is the business-data source of truth.
- Frontend/Admin never bypass the Backend API for privileged operations.
- Secrets never enter browser bundles.
- Authorization, ownership, roles, entitlements, pricing, approvals, risk decisions, and transaction state are server authoritative.
- Exposed database objects require deliberate grants and RLS/policies.
- Loading, empty, not-configured, permission-denied, and error states are legitimate; invented records are prohibited.
- QA, CI/CD, runtime, production and deployment are final gates only.

## Full delivery sequence

### PHASE 00 — Governance & Repository Foundation
AGENTS.md, monorepo boundaries, three independently deployable apps, workspace, source-of-truth rules and engineering docs.

### PHASE 01 — Design System & UI Foundation
Design tokens, typography, spacing, responsive system, accessibility, light/dark/system, PWA shell, navigation and command surfaces.

### PHASE 02 — Complete UI/UX Information Architecture
Route/screen inventory, page states, forms, tables, cards, feed/reels, profile/Agent/world/booth and admin control-plane surfaces.

### PHASE 03 — API Contract Layer
OpenAPI, schemas, errors, pagination/filter/sort, idempotency, versioning, web/admin boundaries and shared contracts.

### PHASE 04 — Supabase PostgreSQL Data Foundation — ✅ IMPLEMENTED
Extensions, migrations, enums, UUIDs, timestamps, constraints, indexes, audit primitives, pgvector, storage, realtime, grants and RLS. No business seed data.

### PHASE 05 — Identity, Authentication & Authorization — ✅ IMPLEMENTED
Supabase Auth, sessions, user/profile provisioning, RBAC/permissions, organization authorization foundation, backend JWT/JWKS verification, Web/Admin SSR auth, API contracts and RLS alignment.

### PHASE 06 — Human & AI Identity Foundation — ✅ IMPLEMENTED
Human identity/profile, AI Identity, Agent lifecycle, persona, Passport, verification, capabilities, skills, permissions, policies/autonomy, budget, credentials and reputation read model.

### PHASE 07 — Agent Memory & Knowledge — ✅ IMPLEMENTED
Memory lifecycle, knowledge/chunk/provenance, embedding persistence, semantic retrieval boundary, retention/expiry, review/delete, access audit and ownership/RLS.

### PHASE 08 — Interest, Passion, Habit & Goal Graph / Personalization Intelligence — ✅ IMPLEMENTED
Dynamic interest ontology, interest graph/edges, real behavior signals, subject affinity, derived passion clusters, recurring habit patterns, explicit goals, goal-interest links, personalization refresh engine, backend API, RLS and User PWA surfaces. No ontology, signal, affinity, passion, habit or goal seed data.

### CROSS-DOMAIN ARCHITECTURE AMENDMENT v1.1 — SCHEMA FOUNDATION IMPLEMENTED
The canonical Master PRD has been expanded for tiered Booth/Tenant, 3D Booth Display, Enterprise-only District ABAC/isolation, and Story/Live AI Character collaboration. Schema foundation is implemented in Supabase, while full runtime activation remains dependency-gated.

Implemented schema foundation:
- District access policies and grants
- Booth/Tenant + lease foundation
- Booth image/video/presentation/3D display assets and slots
- Live sessions
- Live Agent collaboration
- Character/costume/uniform/sticker/icon/animation asset foundation
- Live overlays
- authenticated live viewer presence

Full runtime remains gated by District/Theme/Entitlement/Media/Agent Runtime/AI Gateway/Realtime/Moderation/Commerce dependencies.

### PHASE 09 — Social Graph & Relationship Engine — IMPLEMENTED FOUNDATION
Implemented authoritative social graph for Human ↔ Human, Human ↔ Agent and owned-Agent ↔ Human/Agent relationships. Includes follow, friend, mentor, partner, client, supplier, collaborator and trusted_agent lifecycles; blocking; mentions; social activity; recipient-scoped notifications; PostgreSQL RLS/grants; private authorization helpers; audit/notification triggers; FastAPI `/api/v1/social/*`; and real-data UI surfaces `/social-graph`, `/relationships`, `/following`, `/notifications`, `/blocked`. No synthetic identities or graph records are seeded. Authenticated two-party E2E remains a verification dependency before a final runtime GREEN claim.

### PHASE 10 — Content Platform — IMPLEMENTED FOUNDATION
Implemented authoritative content ownership and lifecycle for Post, Image, Video, Carousel, Article, Document, Presentation, Podcast, Audio, Tutorial, Infographic, Research and AI Capsule. Includes media metadata and controlled Storage-path contract, content-media links, dynamic topics, revisions, moderation submission, AI Capsule provenance, content telemetry, PostgreSQL RLS/grants, FastAPI `/api/v1/content/*`, User PWA Content Library/Create/Detail surfaces, and database invariant tests. No synthetic content/media/topic/Agent records were seeded. Final authenticated E2E, binary Storage upload verification, moderation decision runtime and Phase 14 AI Gateway generation remain separate verification/dependency gates.

### PHASE 11 — Feed, Reels & Discovery — IMPLEMENTED FOUNDATION
Implemented authoritative Feed/Reels/Discovery foundation across Home, Following, For You, Reels, Explore plus dependency-aware Live Now, Agent Feed, Knowledge Feed, World Stream and Context surfaces. Added server-side ranking contract using published Content, real Social Follow state, real Interest affinity/topic matches, freshness, engagement, exposure/novelty, creator diversity and explicit negative feedback. Added feed impressions, interaction telemetry, not-interested/mute/hide-topic/report feedback, FastAPI /api/v1/feed/*, User PWA feed surfaces, RLS/grants and Phase 11 pgTAP invariants. No synthetic content, creators, recommendations or signals were seeded.

Runtime boundaries remain explicit: authenticated multi-user E2E, real Storage media delivery, live/world/context engines, recommendation evaluation and final CI/runtime/production gates are not yet GREEN.

### PHASE 11A — Allpha Universe Discovery Engine & Feed Experience — IMPLEMENTED FOUNDATION

Implemented the first production-safe Discovery Experience vertical slice over the existing Feed, Universe and Live engines. Added FastAPI `/api/v1/discovery/home` orchestration for Universe, Following, For You, Moments, Worlds and Live surfaces; no second Feed/Recommendation/World/Live engine was introduced. Added the User PWA Discovery Surface with Universe Scroll, Live Now, Content Gravity presentation, Moments terminology, search, responsive 2D-first presentation and authoritative empty/error/loading states. Discovery composes existing `get_feed`, published Universe Worlds and public Live Sessions; it does not fabricate records or bypass FastAPI. Phase 11A remains FOUNDATION until authenticated E2E, real Content/World/Live data, telemetry validation, accessibility/performance checks and CI/runtime gates are green.

### PHASE 11A.4 — Content Gravity Engine — IMPLEMENTED FOUNDATION

Implemented the first Content Gravity cross-domain relevance layer without creating a second Feed or Recommendation engine. The layer consumes the authoritative `get_feed` ranking as its base and enriches published Content with existing user-scoped Personalization signals, Interest Affinity ↔ Content Topic matches, World Content placement context, and existing Feed reason signals. It returns `gravity_score`, `gravity_signals`, `gravity_reason_codes`, and `gravity_position` while preserving the original Feed ranking metadata.

Implementation:
- FastAPI discovery orchestration now delegates Content candidates to `apps/api/app/services/content_gravity.py`.
- Gravity reads existing `content_topic_links`, `content_topics`, `subject_interest_affinities`, `interest_nodes`, `personalization_signals`, and `universe_world_content`.
- Source failures fail open to the authoritative Feed result; no synthetic score/data is generated.
- User PWA Discovery displays Gravity relevance and contextual reason codes.
- No migration, new table, seed, duplicate Feed engine, duplicate Recommendation engine, or privileged frontend database access was introduced.

Gravity is a relevance/presentation layer only. Ownership, visibility, authorization, Agent authority, risk, approval, billing and transactions remain governed by their canonical backend/domain engines.

Remaining 11A.4 gates:
- authenticated production E2E
- real multi-signal personalization validation
- Content/World/Live populated runtime validation
- accessibility/performance runtime checks
- CI/build verification
- production Green

### PHASE 11A.5 — Ask the Content — IMPLEMENTED FOUNDATION

Implemented the canonical Ask the Content orchestration boundary over existing Content, permission/RLS, Agent Memory, Agent Knowledge, pgvector retrieval RPCs, AI Gateway and Agent Runtime.

Flow:
- Authenticated user requests an answer for a published Content item.
- Content context is loaded through the authenticated Supabase REST boundary; unavailable/private Content is rejected by the existing permission boundary rather than copied around it.
- Content topic and media metadata are included only when accessible to the authenticated user.
- Optional Agent Memory/Knowledge retrieval uses the existing owner-scoped `retrieve_agent_memory` and `retrieve_agent_knowledge` RPCs.
- Vector RAG requires a real query embedding. The system never fabricates an embedding; when one is absent, private vector retrieval reports `embedding_required` and the answer continues using authorized Content Context.
- Generation delegates exclusively to the existing Phase 14 AI Gateway.
- Action requests are represented as an explicit Agent Runtime handoff contract. Ask the Content never executes Agent actions directly.
- UI Ask interaction is recorded through existing Feed interaction telemetry.

Implementation:
- `apps/api/app/services/ask_content.py`
- `apps/api/app/api/ask_content.py`
- `POST /api/v1/discovery/content/{content_id}/ask`
- mounted through `apps/api/app/main.py`
- PWA Ask panel in `apps/web/components/discovery-surface.tsx`

No new database tables or duplicate AI/RAG/Agent engines were introduced.

Remaining 11A.5 gates:
- authenticated runtime E2E with real Content
- real query-embedding provider path for vector RAG
- real Agent Memory/Knowledge data validation
- configured AI Gateway provider/model validation
- Agent Runtime action handoff E2E
- accessibility/performance and CI/build verification
- production Green

### PHASE 11A.6 — Content Evolution — IMPLEMENTED FOUNDATION

Implemented the canonical Content Evolution orchestration described by Master PRD Addendum v1.1.1:

**Original → AI Summary → Discussion → Related Content → Live Experience → World**

The implementation is a composition layer over existing authoritative domains; it does not create a second Content, Recommendation, Community, Live or World engine.

Implementation:
- `apps/api/app/services/content_evolution.py` composes authenticated Content, reviewed AI Capsule, published Community posts, topic-linked published Content, explicitly linked public scheduled/live sessions, and Universe World placement.
- `apps/api/app/api/content_evolution.py` exposes `GET /api/v1/discovery/content/{content_id}/evolution`.
- The route requires authenticated access and only starts from published Content visible through the existing Supabase RLS boundary.
- AI Summary uses only existing reviewed `ai_capsules`; no AI execution is implied or fabricated.
- Related Content uses existing Content Topic links and published public Content; it does not replace Feed/Recommendation ranking.
- Live Experience is available only when Content carries an explicit `metadata.live_session_id` relation to an authoritative public scheduled/live session.
- World transition uses existing `universe_world_content` placement.
- User PWA Discovery now exposes a Content Evolution panel and records transition telemetry through the existing Feed interaction API.

No migration, table, seed, fake Content, fake Community, fake Live session, fake World or duplicate engine was introduced.

Live reconciliation at implementation time:
- Content Items: 0
- Content Revisions: 0
- AI Capsules: 0
- Content Events: 0
- Content Topic Links: 0
- Universe World Content: 0
- Community Posts: 0
- Live Sessions: 0

Therefore the feature is **IMPLEMENTED FOUNDATION / NOT GREEN**. Empty evolution paths are legitimate until real upstream Content is created and published.

Remaining 11A.6 gates:
- authenticated runtime E2E with real published Content
- reviewed AI Capsule runtime validation
- real Community discussion linkage
- real topic-linked related Content validation
- real explicit Content → Live Experience linkage validation
- real Content → World transition validation
- telemetry validation
- accessibility/performance
- API/PWA build and CI
- runtime/production Green gates

### PHASE 11A.7 — Agent Intelligence Layer on Content — IMPLEMENTED FOUNDATION

Implemented the Agent Intelligence composition layer defined by Master PRD Addendum v1.1.1.

Canonical path:
**Content Context → owned Agent context → reviewed AI Capsule / Topics → optional permission-scoped Memory/Knowledge → AI Gateway → Agent Insight**

Implementation:
- `apps/api/app/services/agent_intelligence.py` provides the authoritative orchestration boundary.
- `apps/api/app/api/agent_intelligence.py` exposes `POST /api/v1/discovery/content/{content_id}/agent-intelligence`.
- Only an Agent owned by the authenticated Human may be used.
- Agent context is composed from existing Agent identity, Passport, enabled Capabilities and a sanitized Policy summary; policy rules are not exposed as model authority.
- Content is limited to published Content through the existing authenticated Supabase/RLS boundary.
- Existing reviewed `ai_capsules` and Content Topics are used as evidence when available.
- Existing `retrieve_agent_memory` / `retrieve_agent_knowledge` RAG RPCs are reused when a real query embedding is supplied; no embedding is fabricated.
- Model execution delegates exclusively to the existing Phase 14 AI Gateway.
- Optional action requests produce an explicit Agent Runtime handoff contract only. Agent Intelligence never executes actions directly.
- PWA Discovery now exposes an Agent Intelligence panel, loads real Owned Agents through `/api/v1/agents/me`, and records telemetry through the existing Feed interaction endpoint.
- No second Agent Intelligence, Content, RAG, Recommendation, AI Gateway or Agent Runtime engine was introduced.
- No migration, synthetic Agent, synthetic Content, synthetic Memory/Knowledge, or fake AI output was created.

Runtime reconciliation:
- Agents remain empty in the live database, so the UI correctly shows that Agent Intelligence cannot run until a real Owned Agent exists.
- Content remains empty in the live database, so no synthetic Content was created to demonstrate the feature.
- The implementation therefore remains **IMPLEMENTED FOUNDATION / NOT GREEN**.

Remaining 11A.7 gates:
- authenticated runtime E2E with a real Owned Agent and published Content
- configured AI provider/model execution through the existing AI Gateway
- real reviewed AI Capsule validation
- real Memory/Knowledge retrieval with a real query-embedding provider path
- Agent Runtime action-handoff E2E with policy/risk/approval/re-check
- telemetry validation
- accessibility/performance
- API/PWA build and CI
- runtime/production Green gates

### PHASE 11A.8 — Optional Agent Companion — IMPLEMENTED FOUNDATION

Implemented the optional Agent Companion surface on Discovery Content.

Canonical architecture:
**Content → Optional Companion → existing Agent Intelligence (11A.7) → AI Gateway**
with any action remaining outside Companion and delegated to the existing Agent Runtime boundary.

Implementation:
- `apps/web/components/agent-companion.tsx` provides an opt-in, contextual companion attached to Content.
- Companion loads only real Owned Agents through the existing `GET /api/v1/agents/me` boundary.
- Companion reuses the existing `POST /api/v1/discovery/content/{content_id}/agent-intelligence` endpoint; no second conversational/Agent Intelligence engine was created.
- Companion provides contextual prompts, free-form questions, Agent selection and a compact insight response.
- Companion exposes RAG/evidence metadata returned by the existing Agent Intelligence layer.
- Companion is explicitly optional and remains closed until the user opens it.
- Companion records interaction telemetry through the existing Feed interaction endpoint.
- Companion does not create Agents, Content, Memory, Knowledge or synthetic responses.
- Companion does not execute Agent actions. Action authority remains Agent Runtime → Policy/Permission → Risk → Approval → Execution.

No database migration, table, RPC, provider, duplicate Agent engine or duplicate RAG engine was introduced.

Live runtime condition:
- Agents: 0
- Content Items: 0
- AI Capsules: 0
- Agent Memory: 0
- Knowledge: 0

Therefore 11A.8 is **IMPLEMENTED FOUNDATION / NOT GREEN**.

Remaining 11A.8 gates:
- authenticated runtime E2E with a real Owned Agent + published Content
- configured AI provider/model runtime validation
- real reviewed AI Capsule / Memory / Knowledge evidence validation
- real query-embedding provider path for RAG
- Companion latency/error/empty-state validation
- action-request boundary E2E through Agent Runtime, Policy, Risk and Approval
- telemetry validation
- accessibility/performance
- API/PWA build and CI
- runtime/production Green

### PHASE 11A — FULL DISCOVERY DOMAIN COMPLETION — IN PROGRESS

Phase 11A is now governed as a full-domain delivery phase rather than a foundation-only milestone. The phase must provide a complete Universe Discovery experience over the existing Feed, Universe, World and Live engines without creating duplicate engines.

Completed implementation increments:
- 11A.1 Discovery orchestration: Universe, Following, For You, Moments, Worlds and Live.
- 11A.4 Content Gravity composition over authoritative Feed + existing Personalization/Interest/World signals.
- 11A.5 Ask the Content over authorized Content Context + existing Memory/Knowledge RAG + AI Gateway, with Agent Runtime handoff only for actions.
- 11A.6 Content Evolution: Original → AI Summary → Discussion → Related Content → Live Experience → World.
- 11A.7 Agent Intelligence over owned Agent context + Content + optional permission-scoped RAG + AI Gateway.
- 11A.8 Optional Agent Companion reusing Agent Intelligence.
- 11A.9 Universe Theme Navigator with authoritative published Theme catalog and progressive 2D / 2.5D / procedural 3D presentation.

11A.9 implementation:
- Added apps/web/components/universe-theme-navigator.tsx.
- Reads GET /api/v1/themes/world-runtime/catalog; no Theme records are hardcoded in the browser.
- Exposes real published platform Theme selection and presentation mode controls.
- 2D is the accessible baseline.
- 2.5D provides depth-oriented presentation without changing authority.
- 3D uses the published World/Scene schema and Theme Design Tokens to render a procedural spatial preview through the existing Three.js / React Three Fiber stack.
- 3D presentation is explicitly presentation-only and cannot grant Agent, ownership, permission, billing or governance authority.
- The component reports the real binary asset-manifest condition; it does not fabricate Storage objects or signed URLs.
- DiscoverySurface now mounts the Universe Theme Navigator on the Universe/Home surface.

11A Theme Runtime invariant gate:
- 25 published platform Themes.
- 25 published v1 Theme Versions.
- all 25 use allpha-3d-progressive.
- all 25 declare a presentation-only authority boundary.
- all 25 satisfy the configured LOD/mobile/target FPS performance contract.
- all 25 satisfy the required accessibility contract.
- Live invariant: PASS.
- Binary theme_assets: still 0 by design; no synthetic assets were created.
- Storage allpha-world-assets: still 0 by design.

11A remains NOT GREEN until the full authenticated runtime path is verified with real user-owned Agent + published Content, configured AI provider/model, real RAG/embedding path where applicable, telemetry, browser accessibility/performance, API/PWA/Admin builds and CI/runtime gates.
### PHASE 11A.10 — Agent Skill / Type / Character Catalog — IMPLEMENTED FOUNDATION

Implemented a platform catalog for real Agent creation, informed by the taxonomy in the public 500-AI-Agents-Projects reference.

Live catalog:
- 46 reusable Agent Skills across research, knowledge/RAG, data, content, marketing, sales, support, productivity, education, engineering, orchestration, observability, multimodal, legal, finance, healthcare, operations and industry/security domains.
- 25 Agent Types with default skill bundles and recommended capability keys.
- 15 AI Character archetypes with persona, tone, interaction-style and presentation defaults.
- Catalog records are platform configuration, not user-owned Agents.
- Authenticated users can read enabled catalog entries through /api/v1/agent-catalog.
- Agent creation now accepts optional agent_type_key, character_key and skill_keys; type defaults are expanded into Agent-owned agent_skills and character defaults into the owned Agent persona.
- Catalog skills do not grant capabilities or permissions automatically. Human authority remains explicit through existing Agent capability, permission, policy, risk and approval controls.
- No synthetic user-owned Agent was created.

Live invariant:
- Agent Skills: 46
- Agent Types: 25
- AI Characters: 15
- Invalid default skill references: 0
- Invalid Character profile objects: 0

Phase 11A remains NOT GREEN until a real authenticated user creates/owns an Agent, real Content exists, AI provider/model is configured, and the complete runtime path is exercised.
### PHASE 12 — Community Platform
Communities, memberships, roles, posts, discussions, moderation, events, hybrid human/Agent participation and discovery.

### PHASE 13 — Messaging & Social Communication
DMs, conversations, replies, Agent-human/Agent-Agent communication, delivery state, notifications, abuse controls and consent/privacy.

### PHASE 14 — AI Gateway & Model Router — IMPLEMENTED FOUNDATION
Implemented the server-side AI execution boundary with provider registry, model registry, normalized capabilities, global/user/Agent routing policies, context/output/cost/timeout/retry budgets, capability-aware routing, provider adapters, fallback/retry, request/attempt/usage telemetry, safety gating, input fingerprints and response hashes. Added FastAPI /api/v1/ai/config, /api/v1/ai/generate, /api/v1/ai/usage and /api/v1/ai/requests plus User PWA /ai. Provider secrets remain server-side environment variables and no provider/model seed data is inserted.

Final runtime GREEN remains gated on real provider/model configuration, authenticated generation, retry/fallback, safety behavior, telemetry, CI/build and E2E/runtime verification.

### PHASE 15 — Agent Runtime & Command System — IMPLEMENTED FOUNDATION
Implemented Human-owned Agent command lifecycle, execution contexts, task/step state machine, Tool Definition registry, AI-Gateway-backed planner, capability validation, policy/autonomy/risk evaluation, Human Approval integration, execution telemetry, tool runs, spend ledger, rate limits and kill switch. Added FastAPI /api/v1/agent-runtime/* and User PWA /agent-runtime. Canonical built-in ai.generate tool delegates to Phase 14 AI Gateway. No synthetic Agent/command/task records are seeded.

Final runtime GREEN remains gated on authenticated Agent command E2E, real AI provider configuration, planner execution, approval/resume, kill switch, budget/rate-limit behavior, tool executor coverage, CI/build and runtime verification.

### PHASE 16 — Workflow & Mission Engine — IMPLEMENTED FOUNDATION
Workflow/version/step definitions, workflow runs, mission/participant/mission-run orchestration, API/PWA surfaces, RLS and secured RPCs. Workflow execution delegates to the Phase 15 Agent Runtime; no second executor is created. Final authenticated E2E, real AI runtime, approvals, retry/trigger runtime, CI/build and final Green remain separate gates.

### PHASE 17 — AI Universe — IMPLEMENTED FOUNDATION / VERIFIED DATABASE
Implemented Galaxy → World → Interest / Content / Community / Agent / Portal / Presence with RLS, ownership RPCs, FastAPI /api/v1/universe and User PWA /universe. Migration 20261002110000_phase_17_ai_universe is applied to AllphaDb-Universe and the 32 Phase 17 invariant assertions pass live. No business seed data exists.

Final GREEN remains gated by authenticated Galaxy/World E2E, Agent ownership/presence E2E, portal/visibility E2E, realtime/spatial runtime verification and CI/build.

### PHASE 18 — Agent Simulation & Spatial Runtime — IMPLEMENTED FOUNDATION / VERIFIED DATABASE
Implemented authoritative Agent spatial state, movement states, Human/Agent spatial interactions, World simulation sessions, monotonic simulation ticks and realtime runtime events. Added 5 RLS tables, 10 SECURITY DEFINER mutation RPCs, realtime publication, FastAPI /api/v1/spatial-runtime and User PWA /agent-simulation. Phase 18 depends on Phase 17 World/Agent membership and keeps Phase 15 Agent Runtime authoritative for actual Agent actions. No synthetic Agents, Worlds, sessions, states, interactions, ticks or events are seeded.

Live verification: 44 Phase 18 invariant assertions pass against AllphaDb-Universe.

Final GREEN remains gated by authenticated Agent/spatial E2E, interaction authorization E2E, simulation lifecycle/tick runtime, Realtime subscription verification, API/PWA build, CI and final runtime gates.

### PHASE 18 — Agent Simulation & Spatial Runtime
Movement states, presence, exploration, interaction, collaboration, shopping, negotiation, approval waiting, realtime events and progressive 2D/3D enhancement.

### PHASE 19 — Districts
Districts, zones, buildings, roads, coworking, meeting rooms, events, marketplace/Agent/community zones, pricing, availability and realtime presence.

### PHASE 20 — Booth / Tenant Platform
Personal/Creator/Agent/Business Booths, Store, Office, Studio, Community Space, Event Venue, Collaboration Space, members, catalogs, visitors, events, leases, availability, pricing, billing, AI host and reputation.

### PHASE 21 — Theme & World Builder
Templates, versions, assets, world templates, builder state, publishing lifecycle, moderation, performance validation, asset safety and immutable governance/security boundaries.

### PHASE 21 — Theme & World Builder — IMPLEMENTED FOUNDATION
Implemented on main and applied to AllphaDb-Universe.

### Database
Migration: `phase_21_theme_world_builder` (live migration version `20261002033548`).
Tables: themes, theme_versions, theme_assets, world_templates, world_template_versions, world_builder_states.

### API/UI
FastAPI: `apps/api/app/api/themes.py`, `apps/api/app/api/world_builder.py`.
PWA: `/theme-builder` and `/world-builder`.
Generic 503 Theme/Builder stubs were removed from the fallback domain router.

### Security / governance
- RLS enabled and forced on all Phase 21 tables.
- Mutation path is FastAPI → authenticated Supabase RPC.
- Mutation RPCs are SECURITY DEFINER with pinned empty search_path and authenticated EXECUTE only.
- Theme tokens are restricted to `theme.*` namespaces.
- Protected authority namespaces cannot be supplied as Theme tokens.
- Builder scene schema rejects top-level `code` and `script`.
- No Storage objects, URLs, Themes, Templates or Builder States are fabricated.

### Verification
- Live migration present.
- 6 Phase 21 tables present with RLS.
- 11 Phase 21 mutation/validation RPCs present; all SECURITY DEFINER + empty search_path.
- Business rows remain empty by design.
- Phase 21 invariant SQL is committed at `database/tests/phase_21_theme_world_builder_invariants.sql`.

### Not GREEN / remaining gates
Authenticated multi-user E2E, moderation decision runtime, real Storage asset validation, performance/accessibility runtime validation, builder/template publication runtime, API/PWA build, CI, Realtime where applicable, and final production Green gates remain pending.

### Next
PHASE 22 — Events & Experiences / Live Stories & Streaming.

### PHASE 21 — Theme & World Builder — IMPLEMENTED FOUNDATION + LIFECYCLE HARDENING
Implemented on `main` and applied to AllphaDb-Universe.

Runtime hardening added:
- Theme token namespace enforcement with protected-authority rejection.
- Recursive World/Builder scene schema safety validation.
- Theme version structural validation for schema, performance and accessibility configuration.
- World Template version validation, submit and publish lifecycle.
- Theme and World Template platform moderation RPCs guarded by `admin.manage`.
- Platform moderator RLS read boundary for Theme/Template moderation queues.
- User PWA Theme Builder now creates versions, validates versions and submits Themes for review.
- User PWA World Builder now consumes real published Themes/Templates and supports validate/submit lifecycle.
- Super Admin Theme moderation surface is API-authoritative and token-based.

Migrations:
- `20261002040000_phase_21_theme_world_builder_runtime_hardening`
- `20261002040100_phase_21_theme_world_builder_admin_read`
- `20261002040200_phase_21_theme_world_builder_rls_policy_consolidation`
- `20261002040300_phase_21_theme_world_builder_token_namespace_fix`
- `20261002040200_phase_21_theme_world_builder_rls_policy_consolidation`
- `20261002040300_phase_21_theme_world_builder_token_namespace_fix`

Business data remains empty by design.

Not GREEN:
- authenticated multi-user E2E
- real Storage upload/safety lifecycle
- actual renderer performance/accessibility runtime validation
- publication E2E
- API/PWA/Admin build verification
- CI
- Realtime/runtime verification where applicable
- final production/runtime gates

Next dependency: Phase 22 — Events & Experiences / Live Stories & Streaming.

### PHASE 22 — Events & Experiences / Live Stories & Streaming

Phase 22 is implemented incrementally. Phase 22A establishes the Live Session Core; 22B and later sub-stages extend Human Owner → Owned AI Agent collaboration, capability/policy/consent/risk, character/voice, realtime media and audience interaction.

### PHASE 22A — Live Session Core — IMPLEMENTED FOUNDATION

Implemented on main and applied to AllphaDb-Universe.

- Versioned binding from live_sessions to approved platform live_experience_templates and live_experience_template_versions.
- Human Owner-scoped Live Session access through Supabase RLS.
- Lifecycle: draft → scheduled → live → ended, with draft/scheduled → cancelled.
- Server-side immutability of owner and template binding.
- scheduled_at support and server-populated started_at / ended_at.
- FastAPI session list/create/read/update and lifecycle endpoints.
- PWA /live session setup and owner lifecycle controls.
- Invariant test and architecture documentation.
- No synthetic users, Agents, sessions, viewers, assets or stream records.

Migration: 20261002052000_phase_22a_live_session_core.

Phase 22A deliberately does not activate AI Agent collaboration. Phase 22B is the next domain step: select an Agent owned by the Human Owner, verify ownership/capability, resolve Live Policy → Consent → Risk, then activate the existing Agent Runtime/AI Gateway path.


### PHASE 22B — Human Owner → Owned AI Agent Collaboration — IMPLEMENTED FOUNDATION

Implemented the canonical Human Owner → Owned AI Agent collaboration boundary on top of Phase 22A.

- Reuses the existing live_agent_collaborations table; no parallel Live engine or Agent executor.
- Explicit owned-Agent selection from the authenticated Human Owner.
- Server-side Agent ownership verification.
- Active Agent + verified Passport requirement.
- Explicit required capability verification against existing Agent capability records.
- Enabled Agent Policy is mandatory; latest policy version is snapshotted.
- Agent kill-switch is fail-closed for request and activation.
- Explicit Human consent lifecycle: pending → approved/revoked.
- Live-specific policy/risk gate records pending/allow/deny without creating a second risk engine.
- Activation re-checks ownership, capability, policy and kill-switch before collaboration becomes active.
- Owner-scoped collaboration read surface and API-authoritative mutation RPCs.
- PWA /live now exposes owned-Agent selection, mode, required capability, consent and activation controls.
- No synthetic Agent, collaboration, session, viewer, stream or risk business data is seeded.

Migration:
- 20261002051941_phase_22b_live_agent_collaboration
- 20261002051953_phase_22b_live_agent_collaboration_api_wrappers

Not GREEN:
- authenticated multi-user E2E
- real Agent runtime execution from Live
- AI Gateway/realtime conversation activation
- camera/stream transport
- voice/TTS
- character/animation compositor
- audience interaction
- moderation/entitlement/commerce integration
- API/PWA build and CI
- runtime/production gates

Next: PHASE 22C — Live Agent Runtime / AI Gateway Activation boundary.


### PHASE 22C — Live Agent Runtime / AI Gateway Activation — IMPLEMENTED FOUNDATION

Phase 22C binds active Live Agent Collaboration to the existing Agent Runtime and AI Gateway.

- Added Live context to Agent Commands: `live_session_id`, `live_collaboration_id`, `command_source`.
- Added server-authoritative `create_live_agent_command` gate.
- Live command creation requires active collaboration, approved consent, risk decision `allow`, owned Live Session and scheduled/live session state.
- Existing `AgentRuntime.plan_command()` and `execute_command()` are reused.
- Existing `AI Gateway.generate()` remains the model/provider routing boundary.
- Runtime execution re-checks Live Collaboration state and fails closed if collaboration is no longer active.
- AI Gateway requests receive Live runtime context in metadata.
- Existing risk assessment, approval, Agent Policy, kill-switch, cost and usage telemetry paths remain in force.
- PWA Live UI now exposes Runtime → AI Gateway command creation, planning and execution controls.
- No synthetic Agents, Live Sessions, commands, AI Gateway requests or provider output were created.

Not GREEN:
- real authenticated Agent/Live execution with configured provider
- realtime conversation/media
- voice/TTS
- character/animation
- audience runtime
- streaming transport
- multi-user E2E
- build/CI
- runtime/production gates

Next: PHASE 22D — Realtime Live Conversation / Audience Runtime boundary.

### PHASE 22D — Realtime Live Conversation / Audience Runtime — IMPLEMENTED FOUNDATION

Phase 22D activates the realtime conversation and audience boundary without creating a second Live engine or Agent executor.

- Durable `live_session_messages` transcript for Owner/Agent/System conversation.
- Durable `live_audience_interactions` for reactions, questions, raise-hand, poll response, share and report.
- Existing `live_session_viewers` extended with one-user-per-session uniqueness and server-authoritative join/leave RPCs.
- Existing Agent Runtime now exposes a Live conversation-turn path that reuses the existing AI Gateway / Model Router.
- Agent response persistence requires active Live Collaboration, approved consent and risk decision `allow`.
- Supabase Realtime Broadcast emits sanitized message/interaction events from database triggers.
- Supabase Realtime Presence tracks authenticated live audience state; viewer counts are not fabricated.
- Private Live channel authorization is scoped to `live:<session_id>` and checks public-live or session-owner access.
- Client-side Broadcast writes are disabled; privileged mutations remain FastAPI → authenticated Supabase RPC.
- PWA /live adds realtime transcript, active Agent conversation, authenticated audience join, Presence and interaction surfaces.

Migrations:
- `20261002052400_phase_22d_realtime_live_conversation_audience_runtime`
- `20261002052500_phase_22d_realtime_live_conversation_audience_hardening`
- `20261002052600_phase_22d_realtime_live_conversation_privilege_hardening`
- `20261002052700_phase_22d_realtime_topic_validation_hardening`

Tests/docs:
- `database/tests/phase_22d_realtime_live_conversation_audience_runtime_invariants.sql`
- `docs/architecture/PHASE_22D_REALTIME_LIVE_CONVERSATION_AUDIENCE_RUNTIME_v1.0.md`

Not GREEN:
- authenticated multi-user E2E
- real configured AI provider/model execution
- realtime WebSocket runtime verification
- voice/TTS and media transport
- character/animation compositor
- moderation/entitlement/commerce integration
- API/PWA build and CI
- runtime/staging/production gates

Next: PHASE 23 — AI-to-AI Collaboration

### PHASE 23 — AI-to-AI Collaboration
Discover, evaluate, Agent DM, negotiate, human approval, collaboration agreement, execute, review, reputation and history.

### PHASE 23 — AI-to-AI Collaboration — 23A IMPLEMENTED FOUNDATION

Phase 23 is implemented incrementally on top of existing Social Graph, Messaging, Agent Policy/Capability/Passport, Approval/Risk, Reputation, Agent Runtime, AI Gateway and Workflow/Mission engines.

#### Increment 23A — Discovery + Eligibility + Collaboration Request
Implemented:
- public Agent discovery through a sanitized authenticated RPC
- active/public Agent eligibility filtering
- capability-aware discovery
- Social Block enforcement
- Agent inbound-message consent enforcement
- authoritative collaboration request persistence
- requester/recipient ownership-scoped decisions
- forced RLS and authenticated-only RPC execution
- FastAPI /api/v1/agent-collaboration/*

Migration:
- database/migrations/20261002053000_phase_23a_agent_collaboration_discovery_request.sql

Tests/docs:
- database/tests/phase_23a_agent_collaboration_discovery_request_invariants.sql
- docs/architecture/PHASE_23_AI_TO_AI_COLLABORATION_v1.0.md

No Agent, user, collaboration request or negotiation data was seeded.

Not GREEN:
- Agent DM/negotiation
- Human approval + risk binding to collaboration agreement
- declarative collaboration agreement
- Agent Runtime/AI Gateway execution binding
- Workflow/Mission collaboration execution
- review/reputation/history integration
- authenticated multi-user E2E
- realtime/runtime/build/CI/production gates

Next: Phase 23B — Agent DM + Negotiation.

### PHASE 23B — Agent DM + Negotiation — IMPLEMENTED FOUNDATION

Implemented:
- existing Agent DM conversation engine reused on accepted collaboration requests
- existing Messaging policy / Social Graph / Block checks remain authoritative
- collaboration-level negotiation state
- durable negotiation events
- authenticated participant-scoped reads
- server-authoritative negotiation message RPC
- PWA negotiation surface

Migration:
- database/migrations/20261002053100_phase_23b_agent_dm_negotiation.sql

Tests:
- database/tests/phase_23b_agent_dm_negotiation_invariants.sql

No synthetic users, Agents, conversations, messages, negotiations or events were seeded.

Not GREEN:
- Human approval + Risk binding
- Collaboration Agreement
- autonomous negotiation via Agent Runtime/AI Gateway
- Workflow/Mission execution
- review/reputation/history
- authenticated multi-user E2E
- realtime/runtime/build/CI/production gates

Next: Phase 23C — Human Approval + Collaboration Agreement.

### PHASE 23C — Human Approval + Collaboration Agreement — IMPLEMENTED FOUNDATION

Implemented on main and applied to AllphaDb-Universe.

- Added declarative agent collaboration agreements linked one-to-one with the accepted collaboration request and negotiation.
- Reuses existing Approval Request and Risk Assessment boundaries; no second approval/risk engine.
- One Human approval request per distinct Agent owner; same Human owning both Agents requires one approval.
- Agreement captures purpose, requested capabilities, declarative scope/constraints/terms, policy-version snapshots, enabled-capability snapshots, risk level and expiry.
- Agreement never grants capability, permission or Agent Policy authority.
- Risk assessment uses existing risk_assessments with action agent.collaboration.commit and execution_recheck_required=true.
- Agreement mutations are authenticated RPC-only; browser has SELECT-only access under participant-scoped RLS.
- Added agreement lifecycle: pending_approval → approved/rejected/expired/cancelled.
- Added durable agreement events for creation, approval request, approval, rejection, expiry and cancellation.
- Negotiation transitions to agreed when an agreement is created.
- FastAPI /api/v1/agent-collaboration/agreements endpoints added for list/read/events/create/approve/reject/cancel.
- PWA collaboration surface now exposes agreement proposal and Human approval controls.
- No synthetic users, Agents, agreements, approvals, risk records or business data were seeded.

Migration:
- database/migrations/20261002062253_phase_23c_human_approval_collaboration_agreement.sql
- database/migrations/20261002062516_phase_23c_human_approval_collaboration_agreement_fk_indexes.sql

Tests:
- database/tests/phase_23c_human_approval_collaboration_agreement_invariants.sql

Architecture:
- docs/architecture/PHASE_23C_HUMAN_APPROVAL_COLLABORATION_AGREEMENT_v1.0.md

Not GREEN:
- authenticated multi-user E2E
- real Agent Runtime/provider execution
- execution binding to Workflow/Mission
- realtime/runtime verification
- build/CI
- production gates

Next: Phase 23D — Execution.

### PHASE 23D — Execution — IMPLEMENTED FOUNDATION

Implemented approved Agreement → existing Agent Runtime execution binding. Added collaboration_agreement_id to agent_commands, authenticated create_collaboration_execution_command(), Agreement/Agent/capability validation, expiry enforcement, and execution-time re-checks in begin_agent_execution(). Added FastAPI execution binding endpoint, architecture doc, and invariants. No new Runtime, AI Gateway, Workflow or Mission engine; no synthetic commands.

Migration: database/migrations/20261002063000_phase_23d_execution_agreement_binding.sql
Test: database/tests/phase_23d_execution_invariants.sql
Architecture: docs/architecture/PHASE_23D_EXECUTION_v1.0.md

Status: IMPLEMENTED FOUNDATION — NOT GREEN. Full authenticated E2E, real provider execution, workflow/mission end-to-end, realtime, CI/CD and production gates remain later.

Next: Phase 23E — Review + Reputation + History.

### PHASE 24 — Marketplace & Commerce
Items, products, services, catalogs, orders, transactions, payouts, commissions, refunds, ledger, buyer/seller lifecycle, Agent commerce and approval policies.

### PHASE 25 — Economy, Credits & Billing
Plans, subscriptions, features, entitlements, feature gates, usage, invoices, billing events, AI credits, consumption, pricing/revenue rules and district pricing.

### PHASE 26 — Security, Governance & Trust
Zero Trust path, authentication, authorization, policy/risk/approval engines, audit ledger, moderation, anti-impersonation, anti-scam, prompt-injection defense, reputation protection, rate limits, data access, kill switch and secret handling.

### PHASE 27 — Super Admin Control Plane
Overview, Users, Agents, Content, Communities, Universe, Galaxies, Worlds, Districts, Booths, Themes, Marketplace, Missions, Events, Plans, Features, Entitlements, Pricing, Revenue, Billing, Credits, AI Providers, Model Router, AI Policies, Agent Policies, Security, Risk, Moderation, Reports, Audit Logs, Feature Flags, Settings, Localization, Notifications, Analytics, Observability, E2E/QA and Configuration Versions.

### PHASE 28 — Analytics, Observability & Operational Intelligence
Product/Agent/content/recommendation events, AI usage, cost, latency, errors, audit telemetry, business metrics, health signals, trace correlation and dashboards.

### PHASE 29 — API Integration & Local End-to-End Wiring
Web→API, Admin→API, API→Supabase, AI Gateway, workflow engine, storage, realtime, auth propagation, authorization, errors, idempotency, local environment contracts and real data only.

### PHASE 30 — Full Feature Activation
Every UI surface connected to its API contract, persistence, workflow, realtime, authorization, audit and analytics; remove non-functional stubs and verify prohibited-data audit.

### PHASE 31 — End-to-End QA & Security Verification
Unit, integration, API contract, database/RLS, auth/authz, workflow, Agent command, approval, commerce idempotency, security, prompt injection, abuse/moderation, accessibility, visual regression, mobile/desktop and critical E2E.

### PHASE 32 — CI/CD
Lint, typecheck, Python checks, tests, API contract validation, migration validation, RLS tests, build, artifact generation, dependency/security scanning, environment separation and deployment pipelines.

### PHASE 33 — Runtime Verification
Local Web :3000, Admin :3001, API :8000, Supabase, Auth, RLS, realtime, storage, AI Gateway, Model Router, workflows, Agent command, approvals, commerce, admin CRUD, audit, observability and real-data smoke tests.

### PHASE 34 — Staging / Production Readiness
Staging/production environments, secrets, migrations, backups, recovery, rollback/compensating actions, rate limits, capacity, domains, SSL, monitoring, alerting, incidents, retention, privacy and compliance configuration.

### PHASE 35 — Production Deployment & Final Green Gate
Production deployment, migration, smoke tests, critical E2E, security advisor, RLS verification, runtime/monitoring verification, rollback verification, architecture audit, prohibited-data audit, accessibility audit and final build/deployment verification.

### PHASE 36 — Reserved Product Expansion
Future owner-approved domain expansion after the current canonical delivery sequence.

### PHASE 37 — Reserved Product Expansion
Future owner-approved domain expansion after the current canonical delivery sequence.

### PHASE 38 — Reserved Product Expansion
Future owner-approved domain expansion after the current canonical delivery sequence.

## Phase completion rule

A phase is not GREEN merely because code exists. The feature definition requires the relevant PRD, DB, API, authorization, security, workflow/engine, UI/UX, telemetry, tests and integration. Final runtime, CI/CD, production readiness and deployment remain separate gates.

## Final Green Gate

UI/UX, domains, API contracts, local apps, backend authority, Supabase, real data, auth, authorization, RLS, security, audit, realtime, workflow, AI Gateway/Model Router, Agent runtime, marketplace/billing, Super Admin, analytics/observability, E2E, accessibility, CI/CD, production readiness, deployment and runtime must all be verified. SQLite, fake/mock/dummy/scenario/placeholder business data and privileged frontend bypasses are prohibited.

### PHASE 12 — Community Platform — IMPLEMENTED FOUNDATION
Implemented Community Platform foundation for Human, AI Agent and Organization communities. Includes community ownership, visibility/join policy, membership roles/lifecycle, topic/interest links, Content-backed posts, threaded comments, community events/RSVP, reports, moderation cases, activity telemetry, PostgreSQL RLS/grants, FastAPI /api/v1/communities/*, User PWA community directory/detail surfaces and 39 pgTAP invariants. No synthetic communities, members, posts, comments, events, attendees or reports were seeded.

Final authenticated multi-user E2E, moderation decision runtime, event integration, CI/build, runtime verification and final Green remain separate gates.

### PHASE 13 — Messaging & Social Communication — IMPLEMENTED FOUNDATION
Implemented authoritative messaging foundation for Human↔Human, Human↔Agent and owned-Agent↔Agent communication. Includes communication preferences/consent, direct conversations, participant lifecycle, conversation requests, messages, replies, edit/delete, delivery/read receipts, reactions, abuse reports, activity telemetry, integration with Social Blocks/Relationships and existing notifications, PostgreSQL RLS/grants, Supabase Realtime publication, FastAPI `/api/v1/messaging/*`, User PWA `/messages`, and 41 pgTAP invariants. No synthetic conversations, participants, messages, receipts, reactions or reports were seeded.

Final authenticated multi-user E2E, realtime subscription verification, abuse/moderation runtime, notification delivery runtime, CI/build and final Green remain separate gates.


## PHASE 19 — Districts — IMPLEMENTED FOUNDATION

Implemented on main. Depends on Phase 17 AI Universe and Phase 18 Agent Simulation & Spatial Runtime.

### Database
Migration: 20261002020000_phase_19_districts.sql
Tables: districts, district_memberships, district_entitlements, district_zones, district_access_requests, district_activity_events.
Existing district_access_policies and district_access_grants are now FK-bound to districts.

### Authorization
District access is server-side and fail-closed. Enterprise access requires active enterprise entitlement; organization context is enforced and allowlisted enterprise access requires an explicit active grant. Client flags are never trusted.

### API/PWA
FastAPI: apps/api/app/api/districts.py, prefix /api/v1/districts.
PWA: /districts via apps/web/components/districts-surface.tsx.

### Verification
Live invariant suite: 26/26 passed. No synthetic District, membership, entitlement, access request, zone or activity records exist.

### Not GREEN
Authenticated multi-user E2E, enterprise ABAC runtime E2E, organization/grant combinations, realtime runtime verification, API/PWA build, CI and production Green gates remain pending.

### Next
PHASE 20 — Booth / Tenant Platform.


## PHASE 20 — Booth / Tenant Platform — IMPLEMENTED FOUNDATION

Implemented on main. Depends on Phase 19 Districts and provides the spatial tenant boundary for Phase 21 Theme/World Builder and Phase 22 Live Stories/Streaming/Experiences.

Implemented database/API/UI:
- Booth ownership: Human, Organization, or owned AI Agent, exactly one authoritative owner.
- Tiers: Free, Standard, Creator, Business, Prime, Event, Enterprise.
- District/Zone placement with FK hardening.
- District access and paid-tier entitlement checks server-side.
- District theme compatibility check.
- Declarative 2D/2.5D/Spatial/3D scene configuration.
- Catalog/presentation/media configuration and owner-scoped asset path validation.
- Display assets: image, video, presentation, 3D scene, document.
- Display slots and asset binding.
- Booth moderation/publish lifecycle.
- Booth leasing foundation without fabricated billing/pricing state.
- Declarative live_entry_config for Phase 22; no Live runtime is implemented in Phase 20.
- Booth activity telemetry and Supabase Realtime publication.
- FastAPI /api/v1/booths/* and PWA /booths.

Verification:
- Live Phase 20 invariant suite: 25/25 passed.
- Booth, lease and display business data remain empty by design.

Not GREEN:
- authenticated multi-user Booth E2E
- real Storage upload/moderation runtime
- moderation decision runtime
- entitlement/billing synchronization
- lease/payment runtime
- realtime runtime verification
- API/PWA build verification
- CI/runtime/production Green gates

Next: PHASE 21 — Theme & World Builder.


### PHASE 22 — Live Stories / Streaming / Experiences — TEMPLATE CATALOG IMPLEMENTED
Implemented the built-in Live Streaming Collaboration presentation catalog on top of the existing Live schema foundation.

Implemented:
- Platform-owned Live Experience Template registry + immutable v1 configuration.
- 25 built-in Human + AI collaboration formats: Podcast, Talkshow, Interview, Product Show, News/Discussion, Webinar, Conference, Investor Pitch, Product Launch, AMA, Debate, Education, Research, Community, Creator, Shopping, Concert, Music, Gaming, Workshop, Demo Day, Town Hall, Roundtable, Coaching and Agent-to-Agent.
- FastAPI GET catalog/version endpoints under /api/v1/live.
- PWA /live Live Streaming Collaboration studio with catalog filtering and template preview.
- Presentation-only safety contract: no code/script and no authority namespaces.
- Human Owner control surface, AI role suggestions, overlays, audience surfaces, responsive and accessibility configuration.

Verification:
- 25 platform templates.
- 25 published/validated/performance-passed/approved v1 versions.
- 0 platform creator ownership fields.
- 0 unsafe template schemas.
- live_sessions/live_agent_collaborations/live_session_viewers remain empty by design.
- Phase 22 template invariant SQL passes live.

Not GREEN:
- camera/stream transport runtime
- TTS/voice runtime
- realtime AI conversation runtime
- Character/animation compositor runtime
- authenticated Live Session creation/activation E2E
- audience interaction runtime
- moderation/entitlement/commerce integration
- API/PWA build/CI/runtime/production gates

## PHASE 11A.11 — Universal Allpha Agent Catalog Expansion — IMPLEMENTED FOUNDATION

Expanded the Agent catalog from a primarily business-oriented baseline into a global social-Universe capability system aligned with Allpha's Human + AI social model.

Expanded catalog coverage includes:
- Social: discovery, networking, introductions, conversations, relationships and community facilitation/moderation.
- Content/Discovery: content conversation, contextualization, repurposing and Feed context.
- News/Media: monitoring, briefing, fact checking, trends, interviews and media hosting.
- Commerce: product discovery/matching, product showcase, marketplace listings, buyer/seller assistance, offers and transaction preparation.
- Collaboration: negotiation support, project proposals/scoping/review, partnership matching and facilitation.
- Presentation: presentation design/delivery, pitch coaching/review and public communication.
- Interview/Review: interview preparation/hosting/moderation, reviewer and constructive critique roles.
- Events/Live: planning, organizing, registration, speakers, agendas, hosting, co-hosting, moderation, audience engagement, programming and recaps.
- Universe: World navigation/storytelling, District discovery/hosting, Booth discovery/assistance and spatial interaction guidance.
- Personal/Private: personal assistance, private knowledge support, life organization, private conversation and reflection support.
- Education: learning companion and mentor coaching.

Catalog expansion adds 65 Skills, 46 Agent Types and 19 AI Characters on top of the existing baseline. The live catalog is now 111 Skills, 71 Agent Types and 34 Characters.

Architectural boundary remains:
- Agent Type = what the Agent is designed to do.
- Skill = composable capability.
- AI Character = how the Agent presents/interacts.
- Character does not grant authority, permissions or capabilities.
- Skills do not automatically grant permissions/capabilities.
- Actual actions remain Agent Runtime → Policy/Permission → Risk → Approval → Execution.
- District, Booth/Tenant, Live, Feed/Content and World context remain canonical domain engines; catalog entries only describe Agent roles/capabilities for those contexts.

Reference provenance:
The external 500-AI-Agents-Projects repository is used as a broad use-case taxonomy/reference. Allpha-specific social, Universe, District, Booth, Live, commerce and personal definitions are authored for the Allpha architecture rather than copied implementations. The upstream repository itself describes a broad catalog spanning frameworks and industries and emphasizes reproducibility, safety, data provenance and human-in-the-loop for higher-risk use cases. citeturn0search0turn0search2

Verification:
- Live Supabase catalog expansion applied.
- Expanded Character JSON shape hardened to object profiles.
- Agent Type default-skill references remain valid.
- Provenance for expanded Skills/Types reconciled to the Allpha catalog reference.
- No user-owned Agent, Content, World, Booth or Live business records were fabricated.

Not GREEN:
- Real user-owned Agent creation E2E remains pending.
- AI Gateway provider/model runtime remains unconfigured.
- Real Content/Memory/Knowledge/RAG and telemetry remain empty.
- Agent Factory UI/runtime E2E, accessibility/performance, API/PWA/Admin build and CI gates remain pending.


## PHASE 11A.12 — Allpha Agent Factory — IMPLEMENTED FOUNDATION

Implemented the first end-to-end Agent Factory surface over the canonical Agent, Agent Catalog, Universe and Policy engines.

Factory flow:
**Create Agent → Identity → Agent Type → Skills → AI Character → Universe Context → Experience Mode → Authority & Policy → Preview → Create Agent**

Implemented surfaces:
- `/agents` — authenticated My Agents surface using real `GET /api/v1/agents/me` data.
- `/agents/create` — authenticated Agent Factory wizard.
- `/agents/[agent_id]` — authenticated Agent detail/configuration summary.

Factory configuration:
- Agent Type from the 71-entry platform catalog.
- Skills from the 111-entry platform catalog, with Type default skills preselected and user override.
- AI Character from the 34-entry platform catalog with presentation preview.
- Universe Context: Universe, World, District, Zone, Booth/Tenant, Live, Feed, Content, Personal and Private.
- Experience modes: Social, Networking, Communication, Commerce, Education, News, Live, Event, Presentation/MC, Collaboration/Partnership, Personal, Private, Creator/Content.
- Authority & Policy: autonomy, visibility and spending/approval boundaries.

Persistence/security:
- Factory metadata is stored in existing `agent_identities.metadata.factory_config`; it is identity/context metadata, not authority.
- Canonical `create_agent_identity` RPC now accepts factory configuration transactionally and the legacy overload was removed to avoid RPC ambiguity.
- Explicit Type, Character, Skill and resource context selections fail closed with 422 before Agent creation when invalid/unavailable.
- Character/Skill selections do not grant permissions; actual authority remains Agent Policy → Risk → Approval → Agent Runtime.
- No synthetic Agent or business records are created by the Factory.

Runtime status remains FOUNDATION until an authenticated user actually creates a real Agent and the resulting Agent → Content/Universe/Live → AI Gateway → Agent Runtime paths are exercised. API/PWA/Admin CI and browser accessibility/performance gates also remain pending.


### PHASE 11A.13 — Real Agent Activation E2E — IMPLEMENTED FOUNDATION

Activated the previously disabled Agent Runtime command boundary.

Canonical runtime path:
**Authenticated User → Create real Agent → Agent Passport/Policy → Agent Catalog → Universe Context → Content/Feed → Agent Intelligence → OpenAI AI Gateway → Agent Runtime → Telemetry**

Implementation:
- POST /api/v1/agents remains the canonical authenticated Agent Factory creation boundary.
- Factory configuration persists Type, Character, experience mode and Universe Context in Agent identity metadata.
- Agent creation provisions the canonical Agent Passport, owner Policy and Budget through create_agent_identity.
- Catalog Skills are validated against enabled platform catalog records; catalog metadata does not grant authority.
- Content context in Agent Factory now requires a real published Content resource and loads it from /api/v1/content?status=published.
- POST /api/v1/agents/{agent_id}/command is now activated and delegates to the existing Agent Runtime:
  1. create_command
  2. plan_command
  3. execute_command
- Agent Runtime remains the only action boundary; Policy/Risk/Approval checks remain server-side.
- AI execution remains exclusively through the existing AI Gateway. The browser never calls OpenAI directly.
- Agent Detail now exposes a real Agent Runtime Command Console for authenticated owner testing.
- Runtime telemetry is preserved through authoritative agent_commands, agent_task_steps, ai_gateway_requests and ai_gateway_attempts; no second telemetry engine was introduced.

Security/authority invariants:
- Only the authenticated owner can load/use the Agent.
- Invalid/empty commands fail closed.
- AI provider credentials remain server environment configuration; they are never stored in browser code or Agent metadata.
- No synthetic Agent, Content, World, Live session or telemetry event was created.

Runtime blockers still required before GREEN:
- A real authenticated browser session must create/use an actual owned Agent.
- Live Content/Feed data is still empty in the current database, so Content → Discovery → Agent Intelligence cannot yet be runtime-proven.
- OpenAI provider/model configuration is still not enabled in Supabase and the FastAPI deployment must have the server-side OpenAI key bound to the configured credential environment variable.
- Real Agent Memory/Knowledge embedding path remains optional for the first non-RAG activation and required for full RAG verification.
- GitHub CI/build/runtime E2E must pass before production GREEN.


### PHASE 11A.14 — Real Runtime Activation & Completion — IMPLEMENTED FOUNDATION

Implemented the first runtime-activation layer for the completed 11A Discovery + Agent surface.

Runtime activation path:
**Authenticated User → Agent Factory → Agent Passport/Policy/Budget → Agent Catalog → Universe Context → Content/Discovery → AI Gateway → Agent Runtime → Telemetry**

Implemented:
- Activated the first real OpenAI provider configuration in PostgreSQL using the canonical AI Gateway boundary.
- Provider configuration stores only the credential environment variable name OPENAI_API_KEY; no secret value is stored in Supabase or source control.
- Configured the initial gpt-6-luna model for ai.generate/text execution and an Allpha global routing policy.
- Added GET /api/v1/runtime/activation to report runtime readiness using real database state and server-side credential presence without exposing secrets.
- Added authenticated PWA /runtime Activation Center with real Agent selection and an optional Gateway smoke test.
- Gateway smoke test delegates to the existing /api/v1/ai/generate boundary and therefore remains server-side; it does not create synthetic Agent, Content or telemetry records.
- Added database/tests/phase_11a14_runtime_activation_invariants.sql covering provider, model, routing-policy and secret-reference invariants.
- Existing Agent Runtime, Discovery, Agent Intelligence, Companion, Content and Feed engines remain canonical; no duplicate runtime/AI/recommendation/RAG engine was introduced.

Live state at implementation time:
- Agents: 0
- Published Content: 0
- Feed interactions: 0
- AI Gateway requests: 0
- AI Gateway attempts: 0
- Agent commands: 0
- Enabled AI providers: 1
- Enabled AI models: 1
- Agent Skills: 111
- Agent Types: 71
- AI Characters: 34

Current runtime blockers:
- A real authenticated user-owned Agent has not yet been created.
- Published real Content has not yet been created.
- The FastAPI deployment environment has not been verified to contain OPENAI_API_KEY; PostgreSQL only references the variable name.
- No real AI Gateway request/attempt has yet been observed.
- No real Agent Runtime command has yet been observed.
- Discovery telemetry has not yet been observed.
- Browser accessibility/performance and API/PWA/Admin build/CI execution remain pending.
- RAG embedding generation remains unconfigured; no embeddings are fabricated.

Therefore Phase 11A.14 is **IMPLEMENTED FOUNDATION / NOT GREEN**. It becomes runtime GREEN only after the authenticated user creates real Agent + Content, the server-side OpenAI credential is bound, the Gateway smoke test succeeds, Agent Runtime command execution succeeds, Discovery telemetry is observed, and build/CI/browser/security gates pass.
