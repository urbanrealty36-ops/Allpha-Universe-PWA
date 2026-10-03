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

### PHASE 08 — Interest, Passion, Habit & Goal Graph / Personalization Intelligence — ✅ WEB ACTIVATED / IMPLEMENTED
Dynamic interest ontology, interest graph/edges, real behavior signals, subject affinity, derived passion clusters, recurring habit patterns, explicit goals, goal-interest links, personalization refresh engine, backend API, RLS and User PWA surfaces. Web activation now includes authoritative signal capture, explicit graph refresh, user Interest/Passion/Habit/Goal views, and Agent-scoped personalization context. Discovery Content Gravity consumes the canonical personalization affinity layer; no duplicate recommendation engine is introduced. No ontology, signal, affinity, passion, habit or goal seed data.

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

### PHASE 09 — Social Graph & Relationship Engine — ✅ WEB ACTIVATED / IMPLEMENTED
Canonical Social Graph is now exposed as a dedicated `/social` Web experience over the existing FastAPI `/api/v1/social/*` boundary. The surface provides public Human/AI Agent discovery, follow/unfollow, relationship request accept/reject, relationship/network views, blocking/unblocking, unread social notifications and explicit search. Existing backend lifecycle remains authoritative for Human ↔ Human, Human ↔ Agent and owned-Agent ↔ Human/Agent relationships, with follow, friend, mentor, partner, client, supplier, collaborator and trusted_agent types; mentions; activity; recipient-scoped notifications; PostgreSQL RLS/grants; authorization helpers; and audit/notification triggers. Phase 09 also adds an authenticated public-discovery RPC and an explicit `follow` → Personalization signal bridge; no duplicate graph/recommendation engine and no synthetic graph records are introduced. Authenticated multi-user E2E, realtime verification, accessibility/performance runtime checks and final Green remain deferred until deployment.

### PHASE 10 — Content Platform — ✅ WEB ACTIVATED / IMPLEMENTED
Implemented authoritative content ownership and lifecycle for Post, Image, Video, Carousel, Article, Document, Presentation, Podcast, Audio, Tutorial, Infographic, Research and AI Capsule. Includes media metadata and controlled Storage-path contract, content-media links, dynamic topics, revisions, moderation submission, AI Capsule provenance, content telemetry, PostgreSQL RLS/grants, FastAPI `/api/v1/content/*`, User PWA Content Library/Create/Detail surfaces, and database invariant tests. No synthetic content/media/topic/Agent records were seeded. Final authenticated E2E, binary Storage upload verification, moderation decision runtime and Phase 14 AI Gateway generation remain separate verification/dependency gates.

### PHASE 11 — Feed, Reels & Discovery — ✅ WEB ACTIVATED / IMPLEMENTED
Implemented authoritative Feed/Reels/Discovery foundation across Home, Following, For You, Reels, Explore plus dependency-aware Live Now, Agent Feed, Knowledge Feed, World Stream and Context surfaces. Added server-side ranking contract using published Content, real Social Follow state, real Interest affinity/topic matches, freshness, engagement, exposure/novelty, creator diversity and explicit negative feedback. Added feed impressions, interaction telemetry, not-interested/mute/hide-topic/report feedback, FastAPI /api/v1/feed/*, User PWA feed surfaces, RLS/grants and Phase 11 pgTAP invariants. No synthetic content, creators, recommendations or signals were seeded.

Runtime boundaries remain explicit: authenticated multi-user E2E, real Storage media delivery, live/world/context engines, recommendation evaluation and final CI/runtime/production gates remain deferred until Vercel/Railway deployment. Phase 11 implementation itself now has reconciled Supabase RPCs, authoritative ranking/telemetry/feedback, and Web Feed/Reels/Discovery surfaces.

### PHASE 11A — Allpha Universe Discovery Engine & Feed Experience — ✅ WEB ACTIVATED / IMPLEMENTED

Implemented the first production-safe Discovery Experience vertical slice over the existing Feed, Universe and Live engines. Added FastAPI `/api/v1/discovery/home` orchestration for Universe, Following, For You, Moments, Worlds and Live surfaces; no second Feed/Recommendation/World/Live engine was introduced. Added the User PWA Discovery Surface with Universe Scroll, Live Now, Content Gravity presentation, Moments terminology, search, responsive 2D-first presentation and authoritative empty/error/loading states. Discovery composes existing `get_feed`, published Universe Worlds and public Live Sessions; it does not fabricate records or bypass FastAPI. Phase 11A Web activation is implemented; authenticated E2E, real Content/World/Live population, telemetry validation, accessibility/performance checks and CI/runtime gates remain deferred until deployment. The attached Feed UX specification is now reflected by Universe Navigator, Universe Scroll-oriented discovery, Moments terminology, Content Gravity, Ask Content, and 2D-first progressive spatial presentation.

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
### PHASE 12 — Community Platform — WEB COMPLETED / RUNTIME GATE DEFERRED

The authoritative Community Platform is fully activated across DB contract, FastAPI and User PWA without creating a second Content, Social Graph, Feed or World engine.

Implemented:
- Community ownership: Human, owned Agent and authorized Organization.
- Server-authoritative visibility, join policy and membership roles.
- Membership lifecycle: join, leave, approval, reject, suspend, ban, restore.
- Community posts reference canonical Phase 10 Content.
- Threaded comments.
- Community-scoped events and authenticated RSVP.
- Reports → moderation cases → server-authoritative moderation decisions.
- Community Topics with optional Phase 08 Interest Node linkage.
- Community Topic links.
- Community ↔ Universe World linkage through the existing World engine.
- Community activity telemetry/audit records.
- RLS + security-definer RPC boundaries + anonymous execute hardening.
- FastAPI /api/v1/communities lifecycle and completion endpoints.
- User PWA /communities + detail interaction surface.
- Universe Discovery now composes real Communities alongside Content, Worlds and Live.
- Empty/not-configured states remain authoritative; no demo business data was created.

Completion endpoints:
- topics list/create/link
- world links list/create
- moderation cases list/decision

Live state remains intentionally empty:
- Communities: 0
- Memberships: 0
- Posts: 0
- Comments: 0
- Events: 0
- Reports: 0
- Event attendees: 0
- Moderation cases: 0

Status: WEB COMPLETED / RUNTIME GATE DEFERRED. Authenticated multi-user E2E, real Human↔Agent participation, real Content linkage, moderation decision runtime, RSVP/capacity runtime, Universe Discovery runtime, accessibility/performance, CI/build, deployment and production Green remain later gates.

### PHASE 13 — Messaging & Social Communication — WEB ACTIVATED / IMPLEMENTED

Phase 13 is implemented as one canonical Messaging Engine, with FastAPI → Supabase as the authoritative mutation boundary. It now covers Human↔Human, Human↔Agent, cross-owner Human→another person's public AI Agent, contextual sharing, realtime transport, privacy/block authorization, Agent skill scope, AI Gateway execution, and AI Credit attribution.

Implemented subphases:
- 13.1 Messaging DB Audit — reconciled conversations, participants, requests, messages, delivery, reactions, reports, communication preferences and realtime publication.
- 13.2 Conversation Lifecycle — direct conversation creation, participants, request/accept/reject, active status and contextual metadata.
- 13.3 Message Lifecycle — send, reply, edit, delete, delivery/read state, reactions and reporting.
- 13.4 Human ↔ Human — authoritative DM lifecycle through existing messaging RPCs.
- 13.5 Human ↔ Agent — Human can converse with an Agent subject; owned-Agent authorization remains enforced.
- 13.6 Agent ↔ Agent Policy — existing collaboration/runtime boundaries remain canonical; no duplicate Agent messaging engine was introduced.
- 13.7 Content/World/Community Sharing — conversation metadata now supports contextual source references; existing Content/Community/Universe engines remain canonical sources.
- 13.8 Realtime Messaging — existing Supabase Realtime publication is used for message transport; realtime never grants authorization.
- 13.9 Notification Integration — request/report/social notification foundations remain authoritative; notification delivery remains a later authenticated runtime gate.
- 13.10 Block / Privacy / Authorization — DM preferences, block checks, Agent visibility and server-side authorization are enforced before cross-owner Agent service execution.
- 13.11 AI Conversation → AI Gateway — cross-owner Agent service requests route through the canonical Phase 15 Agent Runtime, then the canonical AI Gateway and capability-aware model/policy router.
- 13.12 Agent Runtime Integration — Agent Service requests become canonical Agent Runtime commands with requester/owner separation, policy/capability/kill-switch/risk/approval checks, spend enforcement and AI Gateway execution; no second execution engine is created.
- 13.13 Web Messaging UX — /messages now includes conversation management plus an Agent Services surface.
- 13.14 Mobile Responsive — messaging and Agent Service controls remain responsive in the existing PWA surface.
- 13.15 Security/RLS/RPC — new service/credit tables use RLS; privileged RPCs use pinned search_path, explicit auth.uid checks and authenticated-only EXECUTE.
- 13.16 Repository ↔ Supabase Reconciliation — committed migration: database/migrations/20261003190000_phase_13_messaging_agent_services_credit_attribution.sql.
- 13.17 Documentation & Coverage Audit — Phase 13 coverage recorded here and in the Phase 13 audit.
- Cross-owner Agent Memory — only public Knowledge and explicitly service-visible Agent Memory may enter a cross-owner service context; private memory is excluded.

#### Cross-owner AI Agent Service / Skill Economy

A Human may meet an AI Agent owned by another Human and ask that Agent questions or request generation only within the Agent's published Skill. Examples include a public Agent with a Health/Kesehatan skill receiving educational health questions, or a Content/Feed/Moment context asking an Agent to explain or generate related content.

Authoritative workflow:
Human → public Agent discovery → Skill validation → block/privacy validation → AI Credit reservation/debit → Agent Policy/Passport/Capability boundary → AI Gateway → generated result → Agent-authored message → service completion → Credit reward to Agent Owner.

Important rules:
- The Human cannot select a cheaper credit price from the client. The server resolves the Agent Skill configuration and its credit_cost; default is 1 AI Credit when no configured skill cost exists.
- Credits are never fabricated or seeded. Current balances remain 0 until a future authorized grant/purchase/economy flow adds credits.
- On successful Agent Service completion, the requester's debited Credits are recorded as a reward for the Human Owner of the Agent.
- If generation fails before completion, the requester's Credits are refunded.
- Idempotency prevents duplicate service charges/rewards.
- Public cross-owner Agent services exclude the requester's own Agent and blocked owners.
- Health/medical Agent responses are constrained to educational scope and must not claim professional credentials, diagnosis, prescriptions or individualized treatment authority.
- Agent identity, ownership, permissions, authority, risk and governance remain independent of visual Theme/World presentation.

New authoritative domain:
- agent_service_requests
- ai_credit_ledger
- get_ai_credit_balance()
- list_public_agent_services()
- reserve_agent_service_request()
- complete_agent_service_request()
- release_agent_service_request()
- create_contextual_direct_conversation()
- append_agent_service_message()
- reconciled create_ai_gateway_request() to authorize foreign-Agent execution only when an active service reservation exists.

New FastAPI surface:
- GET /api/v1/messaging/agent-services
- GET /api/v1/messaging/credits
- POST /api/v1/messaging/agent-services/generate

Current state remains intentionally empty:
- Conversations: 0
- Messages: 0
- Agent Service Requests: 0
- AI Credit Ledger: 0
- Seeded AI Credits: 0

Status: WEB ACTIVATED / IMPLEMENTED / NOT GREEN. Deployment/runtime gates remain deferred per project policy: authenticated multi-user E2E, Human↔Human, Human↔Agent, cross-owner Agent Skill execution, real AI Gateway generation, credit debit/reward/refund settlement, realtime delivery/read receipts, notification delivery, attachment/storage runtime, accessibility/performance, CI/build, Vercel/Railway deployment and production Green.
### PHASE 14 — AI Gateway & Model Router — ✅ IMPLEMENTED
Implemented the server-side AI execution boundary with provider registry, model registry, normalized capabilities, global/user/Agent routing policies, context/output/cost/timeout/retry budgets, capability-aware routing, provider adapters, fallback/retry, request/attempt/usage telemetry, safety gating, input fingerprints and response hashes. Added FastAPI /api/v1/ai/config, /api/v1/ai/generate, /api/v1/ai/usage and /api/v1/ai/requests plus User PWA /ai. Provider secrets remain server-side environment variables and no provider/model seed data is inserted.

### PHASE 14A — AI Provider Activation & Runtime Readiness — ✅ IMPLEMENTED
Completed the provider-activation layer without introducing a second AI engine.

Implemented:
- Live AllphaDb-Universe configuration for the first enabled OpenAI provider, enabled gpt-6-luna generation model and global allpha-default-openai routing policy.
- Server-side credential contract remains environment-only through OPENAI_API_KEY; no secret value is stored in PostgreSQL, GitHub or the browser.
- Added authenticated GET /api/v1/ai/health readiness diagnostics. It reports provider/model/routing readiness and whether the referenced server environment variable is populated, but never returns credential material.
- PWA /ai now surfaces Gateway Readiness alongside configured models and usage telemetry.
- Added database/tests/phase_14_ai_gateway_activation_invariants.sql with 17 live assertions covering provider activation, model/policy binding, secret-reference hygiene, authenticated-only RPC execution, RLS read boundaries and absence of synthetic request/usage data.
- Existing AI Gateway → Model Router → provider adapter → telemetry path remains canonical. Agent Runtime and higher-level features continue to call this gateway rather than a duplicate provider client.

Live reconciliation after activation:
- enabled providers: 1
- enabled models: 1
- enabled routing policies: 1
- AI Gateway requests: 0
- AI Gateway attempts: 0
- AI usage events: 0

Current gates:
- FastAPI deployment must expose OPENAI_API_KEY before a real provider call can succeed.
- Authenticated real generation, retry/fallback behavior, safety-gate behavior, telemetry persistence, browser accessibility/performance, API/PWA/Admin build and CI, and production runtime remain unverified.
- The health endpoint is a readiness diagnostic, not proof of provider inference.

Therefore Phase 14/14A are **IMPLEMENTED / NOT GREEN**. Feature, domain, engine, policy, telemetry, provider-configuration and cross-owner runtime integration are implemented; final Green remains deferred to deployed authenticated provider execution, retry/fallback runtime evidence, safety/runtime verification, build/CI and production gates.


### PHASE 15 — Agent Runtime & Command System — ✅ IMPLEMENTED
Implemented Human-owned Agent command lifecycle, execution contexts, task/step state machine, Tool Definition registry, AI-Gateway-backed planner, capability validation, policy/autonomy/risk evaluation, Human Approval integration, execution telemetry, tool runs, spend ledger, rate limits and kill switch. Added FastAPI /api/v1/agent-runtime/* and User PWA /agent-runtime. Canonical built-in ai.generate tool delegates to Phase 14 AI Gateway. No synthetic Agent/command/task records are seeded.

Final runtime GREEN remains gated on authenticated Agent command E2E, real AI provider configuration, planner execution, approval/resume, kill switch, budget/rate-limit behavior, tool executor coverage, CI/build and runtime verification.

### PHASE 15 — Agent Runtime & Execution — ✅ IMPLEMENTED

Reconciled and hardened the canonical Agent Runtime rather than creating a second execution engine.

Canonical runtime:
**Human Owner → Agent Passport/Policy → Command → Plan → Risk → Approval when required → Execution → Tool / AI Gateway → Result → Audit/Telemetry**

Implemented/verified:
- Authenticated Human-owned Agent command creation with ownership, active-Agent and kill-switch checks.
- Idempotent command creation, policy/autonomy snapshot and command rate limiting.
- Declarative planner delegated exclusively through the Phase 14 AI Gateway.
- Scoped Runtime Context RPC for both owner and authorized cross-owner Agent Service requester.
- Cross-owner planning receives only non-private Agent context; private policy rules, capability constraints and private persona remain excluded.
- Declarative plan materialization against the authoritative Tool Definition registry.
- Capability validation and tool risk derivation before execution.
- Human approval boundary for high/critical/rule-required execution.
- Approval expiry is a real future 15-minute window rather than an immediately-expired timestamp.
- Approval resume rechecks Agent status, kill switch, current policy and current capabilities.
- Command transition telemetry preserves the actual previous state.
- Completion/failure/cancel/kill transitions reconcile execution context, task/step state and Agent runtime state.
- Canonical Agent Runtime → Phase 14 AI Gateway remains the only AI execution path.
- Existing Live Collaboration, collaboration agreement and Phase 13 cross-owner Agent Service paths remain under the same runtime authorization boundary.
- Anonymous execution/context RPC access remains denied; authenticated access is explicitly granted.
- No synthetic Agent, command, task, approval, risk, tool-run or spend records are seeded.

Live reconciliation:
- Agents: 0
- Commands: 0
- Tasks: 0
- Task Steps: 0
- Tool Definitions: 1
- Tool Runs: 0
- Runtime Events: 0
- Execution Contexts: 0
- Spend Events: 0
- Approval Requests: 0
- Risk Assessments: 0

Phase 15 is **IMPLEMENTED / NOT GREEN**. The feature/domain/engine integration is complete at repository + live-schema level. Authenticated real Agent execution, real provider execution, approval/resume E2E, kill-switch/budget/rate-limit runtime evidence, broader tool executor coverage, API/PWA/Admin build/CI, browser accessibility/performance and deployment remain final verification gates.

### PHASE 16 — Workflow & Mission Engine — IMPLEMENTED FOUNDATION
Workflow/version/step definitions, workflow runs, mission/participant/mission-run orchestration, API/PWA surfaces, RLS and secured RPCs. Workflow execution delegates to the Phase 15 Agent Runtime; no second executor is created. Final authenticated E2E, real AI runtime, approvals, retry/trigger runtime, CI/build and final Green remain separate gates.

### PHASE 16 — Workflow & Mission Engine v3 — ✅ WEB ACTIVATED / IMPLEMENTED / NOT GREEN

Reconciled and completed the existing Phase 16 Workflow/Mission foundation without creating a second executor. Workflow remains an orchestration layer above the canonical Phase 15 Agent Runtime.

Canonical orchestration boundary:
**Workflow Definition → Version → Steps → Run → Mission → Agent Runtime → Tool / AI Gateway**

Implemented/verified:
- Workflow, version and step lifecycle with published-version gating.
- Declarative tool binding, input arguments, conditions, bounded retry policy and risk/approval metadata.
- Workflow Run preparation creates the authoritative Agent Command and materializes its plan through Phase 15 Agent Runtime.
- Workflow preparation now carries the _workflow_control metadata into Runtime steps so conditions/retry policies are executable without a second executor.
- Canonical Agent Runtime now evaluates declarative all/any/path conditions and supports bounded retries only for explicitly listed retryable error codes.
- Condition-false steps are recorded as skipped and reconciled back into Workflow Run steps; no tool execution occurs for skipped steps.
- Workflow Run synchronization now links workflow_run_steps to authoritative Agent task/task-step records.
- Workflow trigger boundary supports manual/event/schedule/webhook invocation through authenticated ownership checks and 24-hour idempotency keys; execution still proceeds through Agent Runtime.
- Mission lifecycle, visibility, participant join/approval decision and published-workflow binding.
- Mission Run delegates to the canonical Workflow Engine and synchronizes from Workflow Run state.
- Workflow and Mission cancellation remain owner-authoritative and propagate to Agent Runtime command cancellation.
- Anonymous trigger/prepare/sync/tool-result execution remains denied; authenticated execution is explicitly granted.
- Web /workflows now uses the real owned-Agent selector and exposes trigger execution plus condition/retry configuration; empty states remain authoritative.
- No synthetic Workflow, Mission, Agent, Run or Tool records were seeded.

Live reconciliation:
- Workflows: 0
- Workflow Versions: 0
- Workflow Steps: 0
- Workflow Runs: 0
- Workflow Run Steps: 0
- Workflow Events: 0
- Missions: 0
- Mission Participants: 0
- Mission Runs: 0
- Skipped Tool Runs: 0

Phase 16 is **IMPLEMENTED / NOT GREEN**. The feature/domain/engine integration is now implemented at repository + live-schema level. Final gates remain authenticated real Workflow/Mission execution, real AI provider execution, approval propagation, conditional/retry runtime evidence, multi-participant Mission E2E, failure/recovery, realtime, API/PWA/Admin build/CI, deployment and production Green.

### PHASE 17 — AI Universe — WEB/UI ACTIVATED / IMPLEMENTED / RUNTIME E2E PENDING
Implemented Galaxy → World → Interest / Content / Community / Agent / Portal / Presence with RLS, ownership RPCs, FastAPI /api/v1/universe and User PWA /universe. Migration 20261002110000_phase_17_ai_universe is applied to AllphaDb-Universe and the 32 Phase 17 invariant assertions pass live. No business seed data exists.

Phase 17 UI/UX was reconciled against the Project Universe references: /universe is spatial-first, full-bleed and 3D-oriented rather than a dashboard. Real Galaxies are rendered from the authoritative Universe API; the 25 platform Themes remain explicitly separated as 3D Theme Templates/configuration. The bottom dashboard-like Quick List grid was replaced by a compact floating spatial command dock.

Galaxy → World / Theme activation follow-up:
- Galaxy nodes now use an explicit spatial transition treatment before entering a World.
- The 25 platform Themes are selectable spatial Theme Template nodes inside the Galaxy scene.
- Theme selection is explicit; there is no implicit `themes[0]` fallback.
- The selected Theme Template becomes the presentation context until an authoritative World/District/Booth `theme_key` takes precedence.
- The World spatial HUD identifies the active Theme Template.
- Binary 3D remains governed by the signed Theme asset-manifest lifecycle; procedural rendering remains the fallback when no active binary asset exists.

Runtime E2E remains gated by authenticated Galaxy/World traversal, Agent ownership/presence, portal/visibility, realtime/spatial runtime, CI/build and deployment.

### PHASE 17.1 — Living Universe 3D Experience — WEB/UI ACTIVATED / RUNTIME E2E PENDING

Implemented the first immersive spatial realization of Phase 17 over the existing Universe, Theme/World Runtime and Phase 18 spatial foundations. No second World/Spatial/Agent engine was introduced.

Implemented:
- Rebuilt PWA /universe as a full-bleed Living Universe shell instead of a developer-preview/card surface.
- Galaxy → World transition with spatial camera staging, transition treatment, orbit navigation and mobile low-power fallback.
- World surface with real published Worlds when available, plus the existing 25 platform Themes as a visual atlas only; no creator/business Worlds are fabricated.
- World → District transition through the authoritative District API.
- District composition through `/api/v1/themes/world-runtime/districts/{district_id}/composition`, reusing authoritative zones, Booth projections, active 3D assets and Phase 18 spatial presence.
- Booths rendered as spatial objects, with verified active 3D Scene assets loaded only from server-signed Storage URLs; procedural presentation remains a fallback when no 3D asset exists.
- Agent/Character presence rendered from authoritative presence/spatial-state data when positions are available; presentation never grants Agent authority.
- World Portals rendered as spatial gateway objects and routed through the existing Universe portal boundary.
- Feed/Content surfaced as spatial Content nodes; selecting a node opens the existing reviewed AI Capsule endpoint rather than creating a second intelligence engine.
- AI Capsule presented as contextual/spatial insight over the existing Content → AI Capsule lifecycle.
- Mobile gesture/HUD behavior: touch drag/orbit, swipe up/down HUD, compact contextual controls and low-power/reduced-motion rendering.
- Extended the canonical World renderer to accept Booth, Portal, Content and Presence spatial objects without creating a second 3D renderer.
- Performance guardrails use low-power DPR, reduced density and R3F performance bounds; R3F guidance favors shared rendering and avoiding unnecessary remounting.

Files:
- `apps/web/components/universe/immersive-universe-shell.tsx`
- `apps/web/components/world/allpha-world-renderer.tsx`

No migration or business data seed was required.

Live reconciliation at implementation time:
- Galaxies: 0
- Worlds: 0
- Districts: 0
- Booths: 0
- World Portals: 0
- Universe Agent Presences: 0
- Agent Spatial States: 0
- Published platform Themes: 25
- Published Theme Versions: 25
- Theme Assets: 0

Therefore this increment is **IMPLEMENTED FOUNDATION / NOT GREEN**. The visual shell is implemented against authoritative empty states, but authenticated browser E2E, real 3D asset delivery, real Agent spatial presence, Portal traversal, Content/AI Capsule runtime, mobile accessibility/performance, API/PWA/Admin build and CI, and production runtime remain verification gates.

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

### PHASE 21.5 — ALLPHA 25 THEME 3D ASSET PACK — IMPLEMENTED FOUNDATION / STORAGE ACTIVATION PENDING

Implemented on `main` and applied to AllphaDb-Universe.

Scope:
- Treats the existing 25 platform Themes + 25 published Theme Versions as the canonical 3D template catalog; no duplicate Theme records are created.
- Adds verified binary 3D asset lifecycle fields to `theme_assets`: private Storage bucket, byte size, SHA-256, upload timestamp and immutable activation metadata.
- Adds platform-admin-only prepare/finalize/archive RPCs for the `allpha-world-assets` bucket.
- Adds FastAPI signed-upload lifecycle endpoints for platform Theme 3D assets.
- World Runtime asset manifest now returns only verified active/approved/safe/performance-passed binary assets with server-generated signed URLs.
- PWA Universe shell consumes the manifest and mounts a verified Theme GLB into the existing Allpha World Renderer without creating a second renderer.
- Renderer hides static template-only Booth/Agent/Portal/Content/Live nodes from the Theme pack so real server-authoritative runtime objects remain the active interactive layer.
- 25 low-poly Theme GLB packs were generated and independently loaded/validated in the implementation workspace. The distributable pack is provided as an implementation artifact; it is not treated as Supabase Storage state until an authenticated platform-admin upload/finalization flow completes.

Canonical component contract per pack:
Galaxy/World environment → District templates → Booth template → Agent/Character presentation → Portal template → Content/AI Capsule object → Live Experience stage.

Database:
- Migration: `20261003190000_phase_21_5_allpha_25_theme_3d_asset_pack.sql`
- Invariant test: `database/tests/phase_21_5_allpha_25_theme_3d_asset_pack_invariants.sql`
- Live platform Themes: 25
- Live published Theme Versions: 25
- Live Theme binary assets: 0
- Live Storage objects in `allpha-world-assets`: 0

Security:
- Platform 3D mutation RPCs require `admin.manage`.
- Anonymous EXECUTE is revoked.
- Storage bucket remains private.
- Browser receives only time-limited signed URLs for verified active assets.
- Theme assets remain presentation-only; they cannot modify ownership, Agent authority, permissions, billing, risk, approvals or governance.

Not GREEN:
- 25 GLB packs are generated and validated locally, but are not yet uploaded/finalized in Supabase Storage.
- Authenticated Super Admin upload E2E and finalization have not been exercised.
- Browser/device 3D performance/accessibility validation is pending.
- API/PWA/Admin build and CI status is not verified.
- Production runtime remains pending.

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

### PHASE 22G — Live Experience 3D Stage + Human Presentation Runtime — IMPLEMENTED FOUNDATION

Implemented on main and applied to AllphaDb-Universe.

Canonical workflow:
Human Live Session → Live Experience Template → Theme 3D / LiveExperienceStage component → optional dedicated Stage 3D asset → Human-owned Agent Collaboration → Real device camera → Human Face/Body Presence Check → Human Uniform/Costume → Human Presentation Binding → Live Experience activation.

Implemented:
- live_session_stage_bindings for authoritative session-to-theme/stage composition.
- Reuses the existing allpha-world-assets Theme 3D pack and the existing LiveExperienceStage component contract; no second renderer.
- Dedicated Live Stage GLB upload/finalize/list lifecycle reuses existing live_experience_stage_assets and signed Storage URLs.
- Stage runtime endpoint returns signed asset URLs only for approved/active assets and identifies AllphaWorldRenderer as the renderer boundary.
- live_session_camera_sources registers the Human's real browser/device camera as a media source; no raw camera frames are persisted.
- live_human_presence_verifications records Face/Body presence readiness and stream liveness. It intentionally does not store face embeddings/raw frames and is not legal/KYC identity verification.
- live_human_costume_templates supports user-authored 3D costumes/uniform templates with private Storage + moderation lifecycle.
- Existing uniform_catalog / user_uniforms remain the canonical platform/owned uniform system; Live only binds an owned uniform or an approved custom costume.
- live_session_human_presentations binds camera + presence verification + costume/appearance state.
- activate_live_experience() is the final server-authoritative runtime gate and can require an already-active Live Agent Collaboration.
- Face/body presentation state never grants Agent authority, ownership, capability, permission, billing entitlement or execution rights.
- Custom categories include superhero, business shirt, suit/tie, formal, Nusantara, traditional, cultural, uniform, fantasy, sci-fi, creator and custom. Licensed IP costumes must be supplied under appropriate rights; Allpha does not seed unlicensed IP assets.

API:
- POST /api/v1/live/sessions/{session_id}/stage
- GET /api/v1/live/sessions/{session_id}/stage-runtime
- POST /api/v1/live/templates/{template_version_id}/stage-assets/upload-url
- POST /api/v1/live/stage-assets/{asset_id}/finalize
- GET /api/v1/live/templates/{template_version_id}/stage-assets
- POST /api/v1/live/sessions/{session_id}/camera
- GET /api/v1/live/sessions/{session_id}/camera
- POST /api/v1/live/sessions/{session_id}/presence-check
- GET /api/v1/live/sessions/{session_id}/presence-check
- GET/POST /api/v1/live/sessions/{session_id}/human-presentation
- GET /api/v1/live/costumes/catalog
- POST /api/v1/live/costumes/custom
- POST /api/v1/live/costumes/custom/{costume_id}/finalize
- POST /api/v1/live/costumes/custom/{costume_id}/moderate
- GET /api/v1/live/sessions/{session_id}/human-presentation-public
- POST /api/v1/live/sessions/{session_id}/activate-experience

Database:
- phase_22g_live_experience_3d_stage_human_presentation
- phase_22g_live_human_presentation_uniform_ownership_hardening
- phase_22g_live_custom_costume_moderation
- phase_22g_live_public_human_presentation_runtime

Security:
- All new privileged mutations use SECURITY DEFINER RPCs with empty search_path.
- Anonymous EXECUTE is revoked; authenticated EXECUTE is granted.
- Session ownership is checked server-side.
- Storage remains private and browser receives signed URLs.
- No raw biometric template, face embedding or camera frame is stored.

Not GREEN:
- Real authenticated multi-user E2E is still pending.
- Actual device/browser face/body detector coverage is limited to the presentation-readiness contract; this is not legal identity verification.
- Dedicated Stage 3D asset upload/moderation needs real authorized asset lifecycle testing.
- The current Theme pack contains the LiveExperienceStage component contract; dedicated Stage GLBs are optional overrides and no synthetic stage assets were seeded.
- API/PWA build, CI, realtime/media transport, voice/TTS, character animation/compositor and production runtime gates remain pending.
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


### PHASE 25 — Economy, Credits & Billing — IMPLEMENTED FOUNDATION / MIDTRANS E2E CONFIGURATION PENDING

Implemented the canonical Economy/Billing boundary and centralized Midtrans payment path without creating a second wallet, credit ledger, payment engine, entitlement engine or Agent Service engine.

Implemented:
- Existing `ai_credit_ledger` retained as the authoritative credit ledger and balance source.
- Credit products + credit purchases linked to Commerce Orders.
- Billing plans, subscriptions and invoices linked to Commerce Orders.
- Commerce Order `order_kind` distinguishes marketplace, credit purchase, subscription and other centralized transactions.
- Midtrans Snap adapter in FastAPI; Server Key remains server-side only.
- Allpha Web App checkout now routes Marketplace Commerce, credit purchases and subscriptions through the same Midtrans boundary.
- Midtrans notification endpoint with SHA-512 signature verification and idempotent settlement processing.
- Settlement RPC is callable only by `service_role`; authenticated/anon cannot invoke it.
- Successful Midtrans settlement posts credit purchases into existing `ai_credit_ledger` and activates subscription/invoice state.
- Successful Marketplace settlement activates existing commerce entitlements.
- Midtrans status lookup is available for authenticated order/payment references.
- Economy and Billing PWA surface plus centralized payment-result surface.
- RLS/grants and invariant test coverage.

Required server configuration:
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY` (reserved for future Snap.js/popup usage)
- `MIDTRANS_ENVIRONMENT=sandbox|production`
- `SUPABASE_SERVICE_ROLE_KEY` for server-only webhook settlement path
- `ALLPHA_PUBLIC_WEB_URL` for payment finish redirect

No real credit products, plans, users, payments, subscriptions, invoices or settlement rows were seeded.

Remaining Phase 25 gates:
- Configure real Midtrans Sandbox credentials and Payment Notification URL.
- Authenticated Marketplace → Midtrans → webhook → paid → entitlement E2E.
- Authenticated Credit Purchase → Midtrans → webhook → ledger credit E2E.
- Subscription initial checkout → invoice paid → subscription active E2E.
- Midtrans expiry/deny/cancel/refund reconciliation.
- Recurring subscription renewal automation remains provider/configuration dependent and is not fabricated.
- Build/runtime/CI and final Green remain deferred to final verification phases.

### PHASE 24 — Marketplace & Commerce — IMPLEMENTED FOUNDATION / PAYMENT PROVIDER E2E PENDING
Implemented the canonical Marketplace & Commerce boundary without creating a second Agent Service, Credit Ledger, Entitlement, Authorization or Risk engine.

Implemented:
- Marketplace listings for product/service with Human, Agent, Organization and Booth seller bindings.
- Agent service listing validation against existing Agent ownership, enabled Skill and enabled Capability state.
- Listing publication boundary with moderation-pending state; discovery exposes only published + approved listings.
- Marketplace offers and seller/buyer response lifecycle.
- Commerce orders + immutable item snapshots.
- Payment intent boundary with provider-neutral `pending_provider` state; no fabricated checkout URL or payment success.
- Commerce entitlements as order-linked entitlement records, ready for paid fulfillment.
- Append-only commerce events plus existing audit_logs integration.
- Idempotent order/event boundary.
- RLS, grants, ownership/participant policies and indexed foreign-key access paths.
- FastAPI `/api/v1/marketplace/*` boundary.
- User PWA Marketplace surface with real-data discovery, empty state, order creation and order history.
- Database invariant test and zero fabricated commerce business rows.

Canonical reuse:
- Existing `agent_service_requests` / Agent Runtime path remains the Agent service execution engine.
- Existing `ai_credit_ledger` remains the economic ledger; Phase 24 does not create a second wallet/ledger.
- Existing District/Booth/Entitlement/Policy/Risk/Audit foundations remain authoritative.
- Payment provider execution/callback and settlement are intentionally not fabricated; provider configuration and economic settlement continue into Phase 25 and final runtime verification.

Remaining Phase 24 gates:
- authenticated seller/buyer E2E with real user-owned listings
- moderation approval runtime
- configured external payment provider adapter + verified callback
- paid-order → entitlement activation runtime
- Agent service purchase → existing Agent Service/Runtime execution E2E
- inventory concurrency/load validation
- accessibility/performance and build/runtime verification
- final Green remains deferred to the final verification phases.

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


## PHASE 19 — Districts — IMPLEMENTED FOUNDATION / SPATIAL LAYER ACTIVATED

Implemented on main. Depends on Phase 17 AI Universe and Phase 18 Agent Simulation & Spatial Runtime.

### Database
Base migration: 20261002020000_phase_19_districts.sql.
Completion migration: 20261003150127 phase_19_district_spatial_objects.
Existing tables: districts, district_memberships, district_entitlements, district_zones, district_access_requests, district_activity_events, district_spatial_objects.
District spatial objects cover building, road, coworking, meeting_room, event, marketplace, agent_zone and community_zone.

### Authorization
District access remains server-side and fail-closed. Spatial objects inherit District owner/access boundaries; object creation/activation is server-authorized. Client flags are never trusted.

### API/PWA
FastAPI: apps/api/app/api/districts.py, prefix /api/v1/districts.
PWA: /districts via apps/web/components/districts-surface.tsx.
Canonical AllphaWorldRenderer now supports District spatial-object presentation without creating a second renderer.

### Realtime
district_spatial_objects is published through Supabase Realtime. No synthetic District, Zone or spatial-object records were seeded.

### Not GREEN
Authenticated multi-user E2E, enterprise ABAC runtime E2E, organization/grant combinations, realtime browser verification, API/PWA build, CI, performance/accessibility and production Green gates remain pending.

### Next
PHASE 20 — Booth / Tenant Platform, after remaining Phase 19 dependency reconciliation.


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


### PHASE 21/21.5 — Platform Universe Instance Provisioning — IMPLEMENTED

Activated the existing platform Theme + World Template catalog as canonical public Universe instances without introducing a second World/District/Booth/Theme/renderer engine.

Live topology:
- 1 platform Galaxy
- 25 platform Worlds
- 100 platform Districts, four per World, mapped to existing GLB District_A–D components
- 400 active Zones, four per District, derived from the existing World Template world_schema.zones
- 100 active/approved platform Booths, one per District, bound to the existing booth Zone and BoothTemplate presentation component

Platform instances are product/spatial configuration, not fabricated user/Agent/organization business records. Normal Human/Agent/Organization ownership semantics remain unchanged. The existing Theme Asset, Storage, World Runtime and AllphaWorldRenderer paths remain authoritative.

Migration:
- database/migrations/20261004040000_phase_21_5_platform_universe_instance_provisioning.sql

Invariants:
- database/tests/phase_21_5_platform_universe_instance_provisioning_invariants.sql

Architecture:
- docs/architecture/PHASE_21_5_PLATFORM_UNIVERSE_INSTANCE_PROVISIONING_v1.0.md

Status: IMPLEMENTED / NOT FINAL GREEN. Runtime/browser renderer, device performance/accessibility, realtime, build/CI and production gates remain later.

Next: PHASE 22 — Live Stories / Streaming / Experiences, continuing the existing Phase 22I completion contract.

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


## Phase 22I — AI Character Asset + Animation Contract

**Status: IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**

- Platform AI Character Runtime Catalog activated for every enabled entry in `agent_character_catalog`.
- 34 platform-ready character runtime assets registered as `platform_catalog` procedural humanoids; no user/business seed data.
- `live_character_asset_contracts` v1 defines full-body, face, voice/viseme proxy, gesture and state-machine channels.
- Runtime states: idle, listening, thinking, speaking, emphasis, greeting, acknowledge, farewell.
- Canonical `select_live_character` now permits platform catalog assets while preserving ownership checks for user/Agent-owned assets.
- Web App Live Experience now exposes an AI Character picker and Use Character action.
- Canonical `AllphaWorldRenderer` renders the platform character procedurally and consumes GPT-Live lifecycle/audio-level signals for body, eyes, facial expression and lip/jaw movement.
- Existing OpenAI GPT-Live WebRTC voice path remains the only Live voice engine; no duplicate voice/AI engine introduced.
- Existing 8 published/approved Allpha platform uniforms remain selectable through the existing claim flow.
- No per-frame animation state is persisted in Supabase.
- Final runtime E2E still requires a real authenticated Live Session + approved Collaboration + device microphone/camera and browser execution; no fake business data was inserted.


## Phase 22I — Runtime Orchestration Completion Update

**Status: IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**

Continuation completed without replacing the existing Phase 22I architecture:
- Added canonical client-side AI Character Animation Contract reducer in `apps/web/lib/live-character-animation.ts`.
- Realtime voice lifecycle now maps transcript/audio/interruption/error events into the existing animation state contract.
- Canonical `AllphaWorldRenderer` now consumes facial and gaze presentation signals in addition to body/lip state.
- Removed the duplicate `/sessions/{session_id}/start` route override by separating the transport start endpoint from the canonical Live Session lifecycle endpoint.
- Added Phase 22I runtime contract invariant suite: **10/10 passed** on the canonical AllphaDb-Universe project.
- No per-frame animation persistence, duplicate event bus, duplicate renderer, duplicate AI Gateway, duplicate Agent Runtime, fake users, fake Agents, fake Live Sessions, or fake business data were introduced.

External provider verification remains a runtime gate. OpenAI's current public pricing confirms `gpt-live-1` as a GPT-Live voice session model; the repository's authenticated WebRTC/provider execution still requires a real configured credential and real Live Session/Collaboration/device runtime before E2E can be marked complete.

**Next implementation phase:** **Phase 23 — AI-to-AI Collaboration**, continuing at **23E — Review + Reputation + History** after reconciling the existing 23A–23D foundation. Do not restart 23A–23D.


## Phase 23E — Review + Reputation + History

**Status: IMPLEMENTED FOUNDATION / REAL COLLABORATION E2E PENDING**

Implemented without creating a second reputation or collaboration engine:
- Durable `agent_collaboration_results` execution-result history bound to the existing Collaboration Agreement / Request / Negotiation and optional Agent Command / Workflow Run.
- Durable `agent_collaboration_reviews` with participant ownership, 1–5 rating, outcome, dimensions and review text.
- Existing `agent_reputation_events` is the authoritative reputation event sink; review publication creates a bounded reputation delta and never changes capability, permission, policy, risk or approval state.
- Existing `audit_logs` records result and review publication evidence.
- Participant-scoped RLS for result/review history.
- Canonical RPCs: `record_agent_collaboration_result`, `submit_agent_collaboration_review`, `get_agent_collaboration_history`.
- FastAPI endpoints added under `/api/v1/agent-collaboration`.
- Web review/history surface added at `/collaboration/history`.
- Invariant suite: **12/12 passed** on canonical AllphaDb-Universe.
- No fake Agents, collaboration requests, agreements, results, reviews or reputation events were seeded.

Runtime/cross-Agent E2E remains pending because the canonical database currently contains zero real collaboration requests/negotiations/agreements/commands. This is an intentional empty-data state, not a failure.

**Next implementation phase:** **Phase 24 — Marketplace & Commerce**, beginning with reconciliation of the existing marketplace/commerce foundation and its dependencies on Tenant/Booth, Entitlement, Economy/Billing, Payment and Authorization. Do not assume commerce tables are production-ready merely because schema exists.


## PHASE 26 — SECURITY, GOVERNANCE & TRUST + SELLER PAYOUTS
- Status: IMPLEMENTED FOUNDATION / REAL MONEY-MOVEMENT E2E PENDING.
- Reuses Policy, Permission, Risk, Approval, Audit and Trust/Safety foundations.
- Adds seller payout account, payout request and payout event workflow.
- Marketplace seller earnings derive only from captured Midtrans-backed paid/completed Commerce orders.
- Every payout request is high-risk and requires existing Approval Request + Super Admin permission-gated decision.
- Super Admin records processing/paid/failed state and disbursement reference; no automatic bank-transfer provider is fabricated.
- No second wallet, payment gateway, ledger, commerce, risk or approval engine.
- No payout business data seeded.

### Next Phase
**PHASE 27 — Super Admin Control Plane**
Overview: Users, Agents, Content, Communities, Universe, Galaxies, Worlds, Districts, Booths, Themes, Marketplace, Missions, Events, Plans, Features, Entitlements, Pricing, Revenue, Billing, Credits, AI Providers, Model Router, AI Policies, Agent Policies, Security, Risk, Moderation, Reports, Audit Logs, Feature Flags, Settings, Localization, Notifications, Analytics, Observability, E2E/QA and Configuration Versions.
