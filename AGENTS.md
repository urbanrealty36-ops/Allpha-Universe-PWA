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
