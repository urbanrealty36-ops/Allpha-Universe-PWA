# CW-02 — Real Agent + Content Activation Checkpoint
Date: 2026-10-04
Repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Supabase: AllphaDb-Universe / qltbacemtvnuzqkterly

## Objective
Activate the existing canonical Agent and Content engines with real authenticated lifecycle evidence. Do not create duplicate engines and do not seed fake business data.

## Live evidence at CW-02 start
- agents: 0
- content_items: 0
- agent_type_catalog enabled: 71
- agent_skill_catalog enabled: 111
- agent_character_catalog enabled: 34

The empty business tables are accepted as truthful state; no synthetic users, Agents, or Content will be inserted to make the dashboard appear active.

## Canonical Agent path
Human Identity → Agent Factory/create_agent_identity → Agent Identity → Persona → Passport → Policy → Budget → Skills/Capabilities → Agent Runtime → AI Gateway → Result/Telemetry.

Existing authoritative API:
- /api/v1/agents
- /api/v1/agent-catalog
- /api/v1/agent-skills
- /api/v1/agent-runtime

Existing authoritative RPC:
- create_agent_identity

Existing runtime boundary:
- Agent Runtime / Phase 15
- AI Gateway / Phase 14
- no second executor

## Canonical Content path
Human/Agent ownership → create_content → Content lifecycle → Media Asset → Moderation → Publish → Feed/Discovery → AI Capsule/Ask/Generate → telemetry.

Existing authoritative API:
- /api/v1/content
- /api/v1/stories
- /api/v1/feed
- /api/v1/discovery
- /api/v1/ask-content
- /api/v1/content-evolution

Existing authoritative RPCs:
- create_content
- create_media_asset
- attach_content_media
- submit_content_moderation
- publish_content

## CW-02 closure gates

### Agent activation
1. Authenticated Human can create an Agent.
2. Server resolves Agent type/character/skills from enabled platform catalogs.
3. Agent ownership is enforced server-side/RLS.
4. Agent identity, persona, passport, policy and budget are created/reconciled.
5. Agent appears in authenticated Agent Account discovery only according to visibility/authorization.
6. Agent command can enter the canonical Agent Runtime.
7. Planner uses only canonical AI Gateway.
8. Capability/policy/risk/approval boundaries remain authoritative.
9. Runtime result and telemetry are persisted.
10. Kill-switch / failure / idempotency behavior is proven.

### Content activation
1. Authenticated Human or authorized Agent can create Content.
2. Owner authority is server-side.
3. Content revision/event lifecycle persists.
4. Media asset creation and attachment use canonical Storage/media boundary.
5. Moderation submission/decision is authoritative.
6. Publish transition is policy-controlled.
7. Published Content appears in Feed/Discovery according to visibility.
8. Agent-owned Content preserves Agent→Human ownership boundary.
9. AI Capsule/Ask/Generate uses existing AI Gateway and Content context authorization.
10. Content telemetry feeds existing Feed/Personalization/Analytics paths.

## No-green rule
CW-02 is not GREEN until authenticated runtime evidence exists. Source/API/schema presence alone is insufficient.

## First implementation targets
- verify authenticated Agent Factory lifecycle against live Supabase;
- verify authenticated Content lifecycle against live Supabase;
- verify ownership/RLS/permission boundaries;
- verify media Storage lifecycle without fake assets;
- verify publish/moderation state machine;
- verify Agent Runtime handoff from a real Agent;
- verify Feed/Discovery consumption of published Content;
- add only missing contracts/repairs found by the evidence run.

## Deferred to later waves
- full cross-owner Agent Service economy: CW-03
- Theme/World/3D traversal: CW-04
- Live/Character/Voice/WebRTC: CW-05
- Commerce/Billing/Economy: CW-06
- Governance/Security/Observability hardening: CW-07
- CI/Staging/Production/Final Green: CW-08

## Status
CW-02 = OPEN / AUDITING + ACTIVATING.


## Evidence Run — 2026-10-04

### Authenticated execution harness
- Live Supabase contains exactly 1 active Auth user.
- No new user was created.
- Lifecycle evidence used the existing authenticated identity through a transactional database session with `request.jwt.claim.sub` and PostgreSQL role `authenticated`.
- Every evidence mutation was wrapped in `BEGIN ... ROLLBACK`; no Agent or Content remained persisted.
- Post-run business counts remain: agents = 0; content_items = 0; content_media = 0; content_media_assets = 0; content_moderation_cases = 0; content_events = 0.

### Agent lifecycle evidence
Initial authenticated run exposed a real blocker:
`create_agent_identity()` failed while inserting `agent_identities` because the shared trigger function `private.guard_agent_identity_verification()` referenced `NEW.status` even when fired for `agent_identities`, which has no `status` column.

Repaired:
- `private.guard_agent_identity_verification()` now branches on `TG_TABLE_NAME` before reading table-specific fields.
- Credential `status` remains server-authoritative.
- Agent Identity / Passport verification fields remain server-authoritative.
- Migration recorded in:
  `supabase/migrations/20261004011000_cw02_fix_agent_verification_guard_trigger.sql`

Authenticated rollback evidence after repair:
- Agent Factory `create_agent_identity` succeeded.
- Agent row plus Identity, Persona, Passport, Policy and Budget creation completed inside the transaction.
- Transaction rolled back; no synthetic Agent remains.

### Content lifecycle evidence
Authenticated rollback evidence after the Agent repair:
- Agent-owned `create_content` succeeded.
- `publish_content` succeeded for a draft public Content item with no media dependency.
- Authenticated RLS could read the resulting event rows inside the transaction.
- Event evidence: `created` + `published`.
- Transaction rolled back; no synthetic Content remains.

### Media RLS gap discovered and repaired
Live policy inspection found a real SQL alias defect in `content_media_assets_read`:
- Previous public-read branch compared `cm.media_asset_id = cm.id`, a self-reference on `content_media`.
- Correct relationship is `cm.media_asset_id = content_media_assets.id`, joined to `content_items` for published/public authorization.

Repaired live and recorded in:
- `supabase/migrations/20261004010000_cw02_fix_content_media_asset_public_read_policy.sql`

Verified live policy now requires:
- authenticated role;
- asset `status = active`;
- `moderation_status = approved`;
- asset is attached to Content;
- attached Content is `published` and `public`;
- or the authenticated user owns the media subject.

### Current evidence boundary
Proven:
- authenticated Agent Factory creation path;
- authenticated Agent dependent-row creation;
- authenticated Agent ownership/RLS boundary at lifecycle level;
- authenticated Agent-owned Content creation;
- authenticated Content publication;
- authenticated Content event visibility;
- media public-read RLS defect identified and repaired;
- no persistent synthetic business data introduced.

Not yet proven:
- browser/API real-session E2E from the deployed PWA;
- Agent Runtime planner/provider execution from the newly created Agent;
- real AI Gateway generation and telemetry;
- Agent discovery/feed consumption in a browser session;
- media Storage upload + approved moderation + public media read E2E;
- moderation decision/admin approval E2E;
- cross-user privacy/authorization negative tests;
- CI/build/runtime production verification.

## Status Update
CW-02 remains OPEN / ACTIVATING. The evidence run is materially progressed, but CW-02 is not GREEN and must not be closed until the remaining authenticated runtime and browser/API E2E gates are proven.
