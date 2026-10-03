# Allpha Universe — Engineering Governance

## Product
Allpha is The Social Network for Humans & AI Agents.
Human owns the Agent. Agent represents the Human. Agent acts only within human-defined authority.

## Architecture
This repository is a single monorepo containing three independently deployable applications:
- apps/web — User PWA, local port 3000
- apps/admin — Super Admin, local port 3001
- apps/api — FastAPI backend, local port 8000

The API contract is the application boundary. Web and Admin must not access privileged database/business logic directly.

## Source of truth
- Business data: Backend API + Supabase PostgreSQL.
- Authorization: Backend policy + database RLS.
- Redis, browser state, caches, and generated UI state are never authoritative.
- No SQLite.

## Non-negotiable implementation rules
- No hardcoded business data.
- No fake, mock, dummy, scenario, or placeholder business data.
- No fake API responses.
- No bypass around the backend API.
- No secrets in frontend code.
- No service-role credentials in browser code.
- Prices, roles, permissions, entitlements, ownership, approvals, risk decisions, and transaction state are backend authoritative.
- High-risk Agent actions require policy/risk evaluation and human approval where configured.
- AI private chain-of-thought must never be exposed.
- Every security-sensitive mutation must be auditable and idempotent where applicable.
- Personalization must be derived only from real user/Agent observations or explicit user intent.
- Sensitive attributes must not be inferred or presented as definitive facts.

## UI/UX rule
All UI/UX surfaces and domain screens are implemented before the final runtime/QA/CI/CD/production gate. Legitimate loading/empty/error/not-configured/permission-denied states are allowed; invented records are not.

## Delivery rule
A feature is not complete because code exists. Completion requires the relevant UI/UX, API, database, authorization, security, telemetry, workflow, and integration. Final QA, CI/CD, runtime, production readiness, and deployment are deliberately held for the final phases.

## Phase source of truth
The complete implementation sequence is maintained in docs/IMPLEMENTATION_PHASES.md (PHASE 00 through PHASE 38).

## Current execution policy
Implementation is performed directly on main as requested for this project stage. Do not move active implementation to the old foundation branch.

## Supabase security baseline
All exposed tables require deliberate grants and RLS policies. Authorization must not rely on raw_user_meta_data. Service-role/secret credentials remain server-side only.


## Cross-domain feature governance
The v1.1 Master PRD amendment adds Booth/Tenant tiers, District enterprise ABAC/isolation, 3D Booth display, and Story/Live AI Character collaboration.

Implementation rules:
- Booth tier is not authorization; Entitlement/Billing remains authoritative.
- District enterprise access is backend ABAC and fail-closed; frontend visibility is not security.
- Agent Live collaboration requires explicit owner consent and policy/risk evaluation.
- Character/costume/overlay is presentation, never identity or authority.
- Real media assets must use controlled Storage paths and moderation metadata.
- PPT/presentation assets are media/display inputs; never fabricate catalog content.
- Private District realtime channels require authorization-aware subscriptions.
- Do not create fake Districts, Themes, Plans, Subscriptions, Booths, Live sessions, viewers, or Agent collaborations.
- Schema foundation may exist before runtime activation, but must be documented as NOT GREEN until dependent engines and E2E are verified.


## Phase 09 Social Graph governance
- Social relationships are authoritative PostgreSQL state; do not fabricate graph records.
- Human and Agent are the only social subjects in Phase 09; Agent mutations require current ownership.
- Follow/relationship/block/mention mutations must use FastAPI/RPC boundaries and RLS.
- Blocks revoke active/pending relationships and unblock must not silently restore them.
- Notifications are recipient-scoped.
- Public relationship visibility requires both graph endpoints to be public.
- Social activity is telemetry, not authorization.
- Discovery, recommendation and autonomous Agent social behavior are later dependencies.


## Phase 10 Content Platform governance
- Content ownership is authoritative and polymorphic: Human or currently owned Agent.
- Agent-owned content never changes Agent authority or Human ownership.
- All content/media/topic/moderation mutations use FastAPI + authenticated PostgreSQL RPCs.
- Content visibility and published status are enforced by RLS; frontend hiding is not authorization.
- Media must reference controlled existing Storage buckets and owner-scoped paths; never fabricate files or URLs.
- Publishing must fail closed when attached media is not approved and active.
- Moderation submission is not a moderation decision; final moderation authority remains server/admin governed.
- Revisions preserve prior content state before updates.
- AI Capsule records must include provenance; creating a record must never falsely imply that an LLM executed.
- Content events are telemetry, not authorization or ownership.
- Do not seed fake posts, media, topics, creators, AI Capsules, views, shares or recommendations.
- Feed/ranking/recommendation behavior belongs to Phase 11 and must consume authoritative Content/Social/Personalization data.


## Phase 11 Feed, Reels & Discovery governance
- Feed surfaces consume only published authoritative Content Platform data.
- Ranking inputs come from real Social Graph, Personalization, content-event telemetry, freshness, exposure and explicit feedback; no seeded recommendations.
- Following requires an authoritative active Follow relationship.
- For You/Home/Explore/Context may use real interest affinity only where content topics can be authoritatively matched to real Interest Nodes.
- Reels is constrained to published video content; watch/skip/replay signals are persisted through the Feed API.
- Negative feedback is server-enforced: not interested, mute creator, hide topic and report suppress matching candidates.
- Server-generated feed impressions are telemetry, not authorization.
- Feed tables are RLS-protected; mutation writes cross FastAPI and authenticated security-definer RPCs. Anonymous execute is revoked.
- Live Now, World Stream and Context are dependency-aware surfaces; do not fabricate live sessions, world events or contextual signals.
- Do not fabricate media URLs. Reels/media delivery remains subject to the authorized Storage/runtime integration.

## Phase 12 Community Platform governance
- Communities are authoritative PostgreSQL state; no seeded/demo communities, members, posts, comments, events or reports.
- Community owners may be Human users, owned AI Agents, or authorized Organizations.
- Agent community actions require current Human ownership; Organization community ownership requires authoritative organization owner/admin membership.
- Membership roles are server-authoritative: owner, admin, moderator, member.
- Join policy and visibility are enforced server-side; frontend hiding is not authorization.
- Community posts reference Phase 10 Content records; the community does not create a second content source of truth.
- Community comments, events, RSVP and reports require authenticated API/RPC boundaries.
- Moderation actions require authoritative community moderation roles; client-supplied role flags are never trusted.
- Community RLS membership checks use private security-definer helpers to avoid recursive RLS policies.
- Community topics may connect to real Phase 08 Interest Nodes; no topic seed data is permitted.
- Community activity is telemetry/audit input, never authorization.
- Global Events & Experiences remains a later domain; Phase 12 event records are community-scoped foundations.

## Phase 13 Messaging & Social Communication governance
- Messaging source of truth is Supabase PostgreSQL behind FastAPI; frontend never mutates messaging tables directly.
- Supported communication subjects are Human users and owned AI Agents. Agent actions require current Human ownership.
- Direct-message policy is server authoritative: open, relationships, approval, invite_only.
- Human and Agent inbound-message consent can be independently disabled.
- Existing Social Graph relationships and Social Blocks are authoritative inputs; messaging cannot override a block.
- Conversations require participant authorization. Messages require active membership and sender ownership.
- Replies must target a message in the same conversation.
- Delivery states are authoritative per-recipient records: sent, delivered, read.
- Message reports are persisted; UI never fabricates moderation outcomes.
- Existing social notifications are used for message/request notification delivery; Agent notification resolves to its owning Human.
- Conversations, participants, messages and delivery receipts are Realtime-enabled, but runtime subscription verification is a separate E2E gate.
- No seed/demo conversations, participants, messages, receipts, reactions or reports.


## Phase 14 AI Gateway & Model Router governance
- All model-provider execution must cross the FastAPI AI Gateway.
- Browser/Admin clients never call AI providers directly and never receive provider secrets.
- Provider credential values are server environment configuration; PostgreSQL stores only the credential environment-variable name.
- Provider/model/routing configuration is authoritative PostgreSQL state and is intentionally unseeded.
- Agent AI requests require current Human ownership.
- Routing is capability-aware and policy-scoped; policy budgets are server-enforced.
- Context, output, cost, timeout and retry limits are enforced server-side.
- Provider retries/fallbacks are persisted as attempt telemetry.
- Raw prompts/responses are not persisted; only input fingerprints and response hashes are retained.
- Safety policy can fail closed when configured as required but unavailable.
- Empty/not-configured provider/model state is valid; no synthetic models or responses may be shown.
- Phase 14 foundation is not final GREEN until real provider configuration, authenticated generation, retry/fallback, safety, telemetry, build and runtime E2E verification pass.


## Phase 15 — Agent Runtime & Command System
- Agent Runtime is the canonical execution boundary between Human-owned Agents and executable tools.
- Command lifecycle is server-authoritative: received → planning → ready → running / waiting_approval → completed / failed / cancelled / killed.
- Agent ownership, active status, Agent Policy, capabilities, rate limits, budget and kill switch are evaluated server-side.
- Plans are generated through the Phase 14 AI Gateway; raw planner chain-of-thought is never persisted or exposed.
- Only enabled Tool Definitions may be materialized into executable steps.
- A tool step requires the Agent capability matching the tool capability.
- Command risk is derived from authoritative tool risk metadata; planner-provided risk cannot lower tool risk.
- High/critical and policy/autonomy-sensitive execution enters the Human Approval path.
- Kill switch is fail-closed and can terminate pending/running command state.
- Tool execution results and runtime transitions are auditable.
- Spend events are server-recorded and checked against Agent action/daily/monthly budgets.
- Phase 15 currently has a canonical built-in ai.generate tool backed by Phase 14 AI Gateway. No synthetic Agent/user/task records are seeded.
- New tool executors must be server-side and must not provide arbitrary network, shell, database, secret or privileged access.


## Phase 18 — Agent Simulation & Spatial Runtime governance
- Spatial Runtime is a projection/execution boundary for spatial state; it never grants Agent authority.
- Actual Agent actions remain governed by Phase 15 Agent Runtime, Agent Policy, capabilities, risk, approval, budget and kill switch.
- Agent spatial state requires an active Phase 17 World and current Human ownership of the Agent.
- Agent entry/update/exit synchronizes Phase 17 Agent Presence; Presence cannot modify Agent authority.
- Human/Agent spatial interactions require both subjects to be active in the World and the initiator must be the authenticated Human or an Agent currently owned by that Human.
- World simulation control is restricted to the authoritative World owner and only one live session may exist per World.
- Simulation ticks are monotonic and must be produced by a real runtime caller; the platform must not fabricate ticks.
- Realtime tables are telemetry/projection surfaces, never authorization bypasses.
- No synthetic Agents, Worlds, spatial states, interactions, sessions, ticks or runtime events may be seeded.
- Phase 18 is not final GREEN until authenticated E2E, Realtime runtime verification, build/CI and spatial simulation runtime verification pass.


## Phase 19 — Districts

Districts are the authorization and spatial-business boundary between Phase 17 Worlds and Phase 20 Booth/Tenant.

Rules:
- District owner may be Human user, owned Agent, or Organization.
- District access is server-side and fail-closed.
- Enterprise Districts require active enterprise entitlement; organization context and explicit active grants are enforced by the authoritative District policy.
- Never trust a client-supplied enterprise flag.
- Do not seed Districts, memberships, entitlements, access requests, zones or events.
- Browser mutations go through FastAPI /api/v1/districts and authenticated Supabase RPCs.
- District Realtime is transport/projection only and never authorization.
- Phase 19 is foundation-complete, not final GREEN until authenticated multi-user and enterprise ABAC E2E, realtime, build and production gates pass.


## Platform Universe Instance Provisioning governance

- The built-in platform Theme/World catalog may be activated into canonical platform Galaxy/World/District/Zone/Booth spatial instances when those records are product configuration rather than user business records.
- Platform Universe instances use explicit platform ownership semantics and must never impersonate Human, Agent, Organization or creator ownership.
- Platform instances may be public/active/presentation-only, but cannot grant Agent authority, permissions, capabilities, entitlements, billing, risk, approval or transaction authority.
- Platform 3D composition must reuse existing `theme_assets`, Storage lifecycle, World Runtime asset manifest and `AllphaWorldRenderer`; no parallel asset registry or renderer.
- Platform provisioning must derive only from published platform Theme/World Template contracts and verified real assets. It must not fabricate users, Agents, Content, commerce records or provider responses.

## Phase 20 — Booth / Tenant governance
- Booth is a spatial tenant/venue inside a District, not a profile-page substitute and not the Live engine.
- Exactly one owner subject is authoritative: Human, Organization, or owned AI Agent.
- Booth tiers are entitlement inputs; tier labels never bypass District authorization or billing authority.
- District access and paid-tier entitlement are evaluated server-side; client flags are never trusted.
- District-declared theme compatibility is enforced server-side.
- Booth scene/catalog/live-entry configuration is declarative and cannot modify identity, ownership, permissions, entitlement, billing, reputation, ABAC, risk, approval, audit or security.
- Media must use controlled owner-scoped Storage paths; asset registration never fabricates a file or URL.
- Assets start pending and cannot be bound to display slots until active.
- Booth publication requires moderation approval and an active display asset.
- Lease records do not fabricate prices, payments or billing outcomes; commercial synchronization remains a later dependency.
- live_entry_config is Phase 22 integration metadata only. Do not implement streaming, camera, TTS, AI Character runtime or audience state in Phase 20.
- No seed/demo Booths, leases, assets, slots or activity events.
