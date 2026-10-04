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


## Continued Evidence Run — Runtime / Feed / Storage / Authorization

### Agent Runtime
- Canonical runtime path remains `Agent Command → Agent Task → Agent Task Step → ai.generate → AI Gateway`.
- `create_agent_command()` authenticated ownership boundary was exercised with the existing authenticated identity.
- Command creation produced owner/requester = authenticated user and entered `planning`.
- Attempting to bypass the state machine directly from `planning` to `ready` was rejected with `INVALID_COMMAND_STATE_TRANSITION`.
- This confirms the runtime transition boundary is authoritative; no direct DB bypass was introduced.
- Full planner/provider execution was not falsely claimed: the FastAPI planner performs Memory/Knowledge retrieval and creates the canonical `ai.generate` step, but an authenticated HTTP execution path still needs to be exercised.
- Runtime live counts remain zero because evidence mutations were rolled back.

### Feed / Discovery
Authenticated transactional evidence proved:
- Agent-owned public Content can be created and published.
- Canonical `get_feed('home',...)` returned the published Agent-owned Content.
- Returned feed item included published status, Agent owner identity, ranking score, position and reason codes.
- Feed engine recorded its request/impression path inside the same transaction.
- No second Feed/Recommendation engine was introduced.

### Storage / Media / Moderation
Verified:
- `allpha-media` and `allpha-documents` buckets exist and are private.
- Authenticated owner Storage policies exist for insert/read/update/delete.
- Public-read is not granted generically.
- Canonical media RPC enforces owner subject, owner-prefixed storage path, and media-type ↔ bucket compatibility.
- Canonical moderation decision RPC requires `admin.read`; approved media becomes `active`, rejected media becomes `blocked`.
- The previously discovered `content_media_assets_read` relationship bug is repaired and verified live.

Not yet proven:
- actual browser/Storage upload object creation;
- media DB registration after a real uploaded object;
- media moderation approval followed by actual Storage read;
- admin moderation decision through authenticated admin session.

### Negative Authorization
Authenticated negative tests returned expected authorization failures:
- forged Agent-owned Content using an unowned random Agent UUID → `CONTENT_OWNER_OWNERSHIP_DENIED`.
- forged runtime command using an unowned random Agent UUID → `AGENT_NOT_FOUND_OR_NOT_OWNED`.
- Direct state-machine jump `planning → ready` → `INVALID_COMMAND_STATE_TRANSITION`.
These tests did not create persistent rows.

### Current Boundary
CW-02 is still OPEN. No architecture, engine, schema family, or authority boundary was duplicated.
Remaining evidence gates are specifically:
1. authenticated FastAPI planner + runtime command E2E;
2. real AI Gateway execution/telemetry, subject to provider readiness;
3. browser/API Feed and Discovery session;
4. actual Storage upload → media registration → moderation → approved read;
5. admin moderation decision;
6. stronger cross-user negative tests if a second authorized test identity becomes available;
7. final build/test verification for CW-02.

## Evidence Run — 2026-10-04 — Admin Boundary + Provider Readiness

### Admin moderation negative authorization
Using the single existing authenticated user (platform role = user), a transactional Agent → Content → moderation-case flow was exercised. The ordinary authenticated user attempted decide_content_moderation(...); the operation was rejected by the canonical admin permission boundary. The entire transaction was rolled back.

Result: PASS — ordinary user cannot perform the admin moderation decision.

Post-rollback live counts remained:
- agents = 0
- content_items = 0
- content_moderation_cases = 0
- agent_commands = 0
- agent_tasks = 0
- agent_task_steps = 0
- ai_gateway_requests = 0
- ai_gateway_attempts = 0
- ai_usage_events = 0

### AI Gateway provider readiness
Live canonical configuration currently contains:
- enabled provider: openai / openai_compatible
- enabled generation model: gpt-6-luna
- enabled embedding model: text-embedding-3-small
- enabled routing policy: allpha-default-openai
- generation capability: ai.generate
- provider credential contract: server-side OPENAI_API_KEY

The database configuration is present and internally consistent. However, the actual FastAPI server-side environment binding and external provider execution are not yet runtime-proven in this evidence run. No provider call was fabricated or executed solely to manufacture a GREEN result.

### FastAPI source reconciliation
Current main.py explicitly mounts the canonical agent_runtime_router, messaging_router, feed_router, discovery_router, content_router, and admin_content_moderation_router. The runtime implementation resolves the canonical sequence Command → Planner → Memory/Knowledge Retrieval → ai.generate step → AI Gateway → result/telemetry; no second runtime or AI engine was introduced.

### Updated CW-02 boundary
CW-02 remains OPEN / ACTIVATING / NOT GREEN. The remaining blockers are runtime-environment evidence rather than a missing architecture family:
1. authenticated FastAPI HTTP session proving Planner → Execute;
2. actual AI Gateway provider execution and telemetry;
3. actual browser/API Feed + Discovery session;
4. real Storage object upload → media registration → moderation approval → read;
5. admin moderation decision using an authorized admin session;
6. final build/test verification.


## Evidence Run — 2026-10-04 — Runtime Harness / Build Gate Reconciliation

### FastAPI runtime harness
The canonical HTTP runtime surface is present at /api/v1/agent-runtime with POST endpoints for command creation, planning, execution, cancellation and approval. The implementation calls the existing Agent Runtime + AI Gateway modules and does not introduce a second executor.

However, no repository-backed authenticated HTTP/E2E test harness is currently present on main that can exercise a real Supabase access-token session end-to-end. The API test dependency (pytest) is declared, but no pytest suite or CI workflow was found in the repository. Therefore source-level presence is not promoted to runtime evidence.

### Storage runtime gate
Live Storage object counts remain zero for allpha-media and allpha-documents. Canonical Storage/media policies and RPCs are present, but an actual uploaded object has not been created and subsequently read through the authorized path. This gate remains pending.

### Current live business state
After all transactional evidence runs, live counts remain zero for agents, content, agent commands, AI Gateway requests and Storage objects. No synthetic business state was left behind.

### Build / CI gate
The monorepo defines web/admin build scripts and the API declares FastAPI dependencies, but no GitHub Actions workflow is currently present under .github/workflows and no repository pytest suite was found. Final build/CI evidence therefore remains pending and belongs to the CW-02 closure gate rather than being inferred from configuration.

### Conclusion
CW-02 remains OPEN / ACTIVATING / NOT GREEN. No architecture or engine was added. The remaining work is evidence execution: authenticated HTTP runtime + real AI Gateway call, real Storage object lifecycle + moderation read, authorized admin decision, browser/API Feed/Discovery verification, and final build/test verification.

## Evidence Run — 2026-10-04 — Authenticated HTTP Harness Added

### Harness
Added repository-backed harness:
- `apps/api/tests/cw02_authenticated_runtime_evidence.py`
- commit: `772bd9ec80f0b5ac93bb86fae9c51faa455a0909`

The harness targets the existing FastAPI runtime only. It does not create schema, RPC, engine, Agent, Content, Storage object, or mock identity.

Checks implemented:
1. `GET /health` confirms the target is the Allpha FastAPI service.
2. `GET /api/v1/runtime/activation` without Bearer token must return 401.
3. Authenticated `GET /api/v1/runtime/activation` must return canonical activation evidence.
4. Authenticated `GET /api/v1/agent-runtime/commands` must be readable.
5. If `ALLPHA_AGENT_ID` is explicitly supplied for a real owned Agent, the harness exercises command creation → planning → execution through the existing runtime.
6. If `ALLPHA_EXPECT_PERSISTED=true`, missing real Agent ID is treated as a blocker rather than replaced with synthetic data.

Required runtime inputs are deliberately externalized:
- `ALLPHA_API_URL` = actual running FastAPI base URL
- `ALLPHA_ACCESS_TOKEN` = real Supabase authenticated access token
- optional `ALLPHA_AGENT_ID` = real owned Agent UUID

### Execution boundary
The harness could be committed and statically reconciled against the current API contracts, but it was **not falsely marked executed against a live FastAPI URL** because no deployed API base URL and real user access token are available in the current evidence environment. Supabase project connectivity alone does not prove the external FastAPI runtime.

Therefore:
- Harness implementation: PASS
- Authenticated HTTP execution: PENDING ENVIRONMENT INPUT
- Planner/provider execution: PENDING authenticated HTTP run
- No fake token, Agent, Content, or provider result was generated.

### Updated conclusion
CW-02 remains OPEN / ACTIVATING / NOT GREEN. The next evidence action is to run this harness against the actual running FastAPI service with a real authenticated Supabase session and, where available, a real owned Agent. No architecture expansion is justified.



## CW-02.R — Runtime Repair & Activation Stabilization

### Source/runtime repairs completed
The Railway observation cycle exposed concrete source/configuration blockers. They were repaired without introducing new architecture:
- `apps/api/app/api/memory_knowledge.py` — malformed escaped newline in import repaired.
- `apps/api/app/api/economy.py` — malformed escaped newlines in billing subscription routes normalized.
- `apps/api/app/api/security.py` — indentation corruption and escaped-newline route corruption repaired.
- `apps/web/components/theme-spatial-slice.tsx` — malformed escaped newlines repaired.
- `apps/web/components/communities-platform.tsx` — production type-safe error normalization.
- `apps/web/components/universe/immersive-universe-shell.tsx` — Theme/World/Booth spatial type contracts reconciled.
- `apps/web/components/world/allpha-world-renderer.tsx` — district/animation prop contract reconciled.
- `apps/web/hooks/use-live-webrtc.ts` — Supabase Realtime subscribe status handled through the canonical callback contract.
- Railway API `PORT=8000` set so the healthcheck targets the same port as the canonical Uvicorn listener.

### Railway runtime evidence
- API deployment `b1d113c3-818c-4ab9-8790-6dcde4e29863` — SUCCESS / ONLINE.
- Web deployment `a8b63323-04cb-49d2-8872-f967f5a0dd59` — SUCCESS / ONLINE.
- Admin deployment `e2139815-28fd-4a06-942a-da5e32e895de` — SUCCESS / ONLINE.
- API `GET /health` — HTTP 200 confirmed.
- Railway healthcheck completed successfully after the `PORT=8000` repair.
- Unauthenticated runtime activation is still governed by the canonical FastAPI authentication boundary and is expected to return 401.

### Remaining CW-02.R gate
Authenticated runtime activation is still pending because the evidence environment does not contain a real user access token/real owned Agent for the external FastAPI harness. No fake token, user, Agent, provider output, or business data was introduced.

Detailed CW-02.R record:
`docs/audits/CW02R_RUNTIME_REPAIR_ACTIVATION_STABILIZATION_20261004.md`

CW-02 remains **OPEN / ACTIVATING / NOT GREEN**.


## CW-02 Web App Universe Entry & Authenticated UX Activation

Implemented without architecture expansion:
- `/` is now the canonical Universe-first Web App entry.
- `/universe` resolves through the same entry surface so direct navigation does not diverge.
- Anonymous users see a Universe-first public spatial entry and an identity CTA; Login/Register is not the primary landing experience.
- Authenticated users enter the existing canonical `ImmersiveUniverseShell`.
- Supabase Auth remains the identity/session authority.
- Existing FastAPI + Supabase authorization remains authoritative.
- Auth return paths are constrained to local application paths to avoid open redirects.
- User-facing E2E Setup navigation was removed from the Universe surface; QA tooling remains available separately.
- No duplicate Universe renderer, identity engine, API, or authority layer was introduced.

Implementation record:
`docs/audits/CW02_WEB_UNIVERSE_ENTRY_AUTHENTICATED_UX_20261004.md`

Railway Web evidence:
- CW-02 Universe-entry build completed successfully on Next.js 16.3.8 / Turbopack.
- TypeScript check passed.
- Static generation completed.
- Dynamic Agent route collision remained resolved.
- Serving `GET /` returned HTTP 200 on the active Web deployment.
- Latest Universe-entry commits are continuing through Railway deployment observation.

Boundary:
- Web routing/build/deployment readiness: PASS.
- Real browser-authenticated Universe session: PENDING.
- Real Agent Runtime / AI provider execution: PENDING.
- Storage/Moderation E2E: PENDING.
- CW-02 overall: OPEN / ACTIVATING / NOT GREEN.


## CW-02 — Frontend Product UX Realization

Implemented after the frontend + Theme/World/Live reconciliation. No new wave, engine, schema family, renderer, or authority boundary was introduced.

### Product surface activation
- Authenticated `/` and `/universe` now enter `UniverseProductExperience`.
- Added responsive product navigation: Universe, Discover, Worlds, Agents, Live.
- Desktop uses a compact spatial command/navigation chrome; mobile uses a bottom navigation surface.
- Universe view continues to use the existing canonical `ImmersiveUniverseShell` and `AllphaWorldRenderer`.
- Discover view reads the existing Discovery home API and renders only authoritative returned Content.
- Worlds view reads the existing published Theme/World runtime catalog and provides visual destination selection without creating duplicate Theme/World records.
- Agents view reads `/api/v1/agents/me`; zero Agents remains an explicit empty state rather than synthetic data.
- Live view reads published Live Experience Templates and routes creation to the existing Live Studio.

### Existing canonical product surfaces reused
- Agent Factory remains `/agents/create` and the existing `AgentFactory` implementation.
- Theme Studio remains `/theme-studio` and reuses the existing Theme/World/3D workflow.
- Live Studio remains `/live` and reuses the existing Live Session, Agent Collaboration, Character Binding, Runtime and Realtime contracts.
- No second renderer, Theme Engine, World Engine, Live Engine, Character Engine, Agent Runtime, Feed Engine or AI Gateway was introduced.

### Live runtime reconciliation remains explicit
Live Supabase state observed during this increment:
- live stage assets = 0;
- live character assets = 34 active;
- live character asset contracts = 34 active;
- live sessions = 0;
- stage bindings = 0;
- character bindings = 0;
- camera sources = 0;
- human presentations = 0;
- voice bindings = 0;
- Agents = 0.

Therefore the UI now exposes the correct product paths but does not claim Live/Agent runtime completion. The zero Live Stage Asset count remains a concrete runtime activation boundary.

### Source commits
- `a4d40f7631c39783bf488da8e6b96c993d3caa6a` — add CW-02 Universe Product UX surface.
- `0816f7a926ec14e3cdb73751f91f166c0ac0bd29` — route authenticated Universe entry into Product UX.

### Railway observation
The Web service automatically started deployment observation for both implementation commits. The latest deployment observed is building from `0816f7a926ec14e3cdb73751f91f166c0ac0bd29`. This is controlled runtime observation only, not Production GREEN.

### Current boundary
CW-02 remains **OPEN / ACTIVATING / NOT GREEN**.
Remaining closure evidence includes authenticated browser/session verification, real Agent creation/runtime execution, provider execution/telemetry, Feed/Discovery runtime verification, real Storage/media/moderation lifecycle, authorized admin moderation, and final build/test evidence.


## CW-02 — Runtime Activation & End-to-End Reconciliation — 2026-10-04

### Contract reconciliation completed
The current Web Product UX contracts were reconciled against the live FastAPI source rather than inferred from frontend types:

- `GET /api/v1/themes/world-runtime/catalog` returns `{ data: [...] }`.
- `GET /api/v1/discovery/home` returns a composed response with `content`, `worlds`, `communities`, `live`, `agents` and navigation/source metadata.
- `GET /api/v1/live/templates` returns `{ data: [...] }`.
- `GET /api/v1/agents/me` returns `{ data: [...] }`.
- All four routes use the existing `get_auth_context` boundary.
- `apiFetch` sends the real Supabase access token as a Bearer token to the canonical Railway FastAPI service.

### Frontend runtime hardening
`apps/web/components/universe-product-experience.tsx` was hardened so the four product surfaces are reconciled independently with `Promise.allSettled`.

This prevents a single domain/API failure from hiding otherwise healthy Universe, Worlds, Agents or Live surfaces. The UI now:
- preserves successfully loaded authoritative data;
- reports unavailable domains explicitly;
- provides a retry action;
- never fills failed domains with synthetic business data.

Implementation commit:
`540cab9234a2ded2f05fd111bc0ae01e2f2eb399`

### E2E evidence harness
Added:
`apps/api/tests/cw02_runtime_activation_e2e_reconciliation.py`

The harness verifies:
1. public API health;
2. unauthenticated rejection for canonical protected runtime/product routes;
3. authenticated World catalog contract;
4. authenticated Discovery contract;
5. authenticated Live template contract;
6. authenticated owned-Agent list contract;
7. authenticated Runtime Activation contract;
8. authenticated Agent Runtime command listing;
9. optional real owned-Agent read;
10. optional real owned-Agent command → plan → execute path.

It does not fabricate an identity, Agent, Content, token, provider result or business transaction.

Harness commit:
`4e93255678ea7ae2f838b294eea04d9711d8efd8`

### Controlled Railway runtime observation
Current Railway observation:
- `allpha-api`: deployment `c65967b5-d46b-4eaa-85b8-20ccd22cc0db` = SUCCESS.
- API `GET /health` = HTTP 200.
- Protected World/Discovery/Live/Agent endpoints = HTTP 401 without a Supabase access token, as required.
- `@allpha/web`: deployment `f11d6800-c119-41a3-af1d-4804c35322f2` = SUCCESS.
- `@allpha/admin`: deployment `e2139815-28fd-4a06-942a-da5e32e895de` = SUCCESS.

These observations are controlled runtime evidence only and are not Production GREEN.

### Live Supabase reconciliation
Current live counts:
- published platform Themes: 25
- published platform World Templates: 25
- published platform Live Experience Templates: 25
- Agents: 0
- Content items: 0
- Live Sessions: 0
- Live Experience Stage Assets: 0
- active Live Character Assets: 34
- active Live Character Asset Contracts: 34
- Stage Bindings: 0
- Camera Sources: 0
- Human Presentations: 0
- Voice Bindings: 0

This confirms that the catalog surfaces have authoritative data available, while real Agent/Content/Live runtime activation remains genuinely empty.

### Current gate
CW-02 remains **OPEN / ACTIVATING / NOT GREEN**.

The remaining blocker is no longer API route-shape uncertainty. The next required evidence is a real authenticated Supabase session against the running FastAPI service, followed by real Agent creation/runtime execution, real Content publication/Discovery telemetry, Storage/media lifecycle, authorized moderation, and provider execution telemetry.


### Post-commit deployment observation
After the runtime-hardening commit, Railway completed:
- `@allpha/web` deployment `b6fab30e-bf7c-4c58-b9d4-8a50a288bfd1` — SUCCESS; Next.js build, TypeScript and 73-page generation completed; container reached Ready.
- `allpha-api` deployment `66a54e22-8dd7-4582-aba7-9c95e913e453` — SUCCESS; /healthcheck passed.

No Railway configuration or secret was changed by this increment.
