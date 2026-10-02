# ALLPHA WORLD ENGINE — Architecture & Implementation Status v1.0

Date: 2026-10-02
Status: IMPLEMENTED FOUNDATION / NOT GREEN

## Purpose
Turn the existing Phase 21 Theme/World catalog into one reusable spatial presentation engine without creating parallel engines or authority paths.

## Canonical pipeline
Theme Catalog → Published Theme Version → World Template Version → validated Scene Schema → Asset Manifest → AllphaWorldRenderer → Spatial Runtime → District/Booth projection → Phase 23 collaboration → Phase 22 Live entry → Character presentation.

## Implemented in this increment

### Asset Manifest & Spatial Foundation
- Reuses existing `theme_assets`, `booth_display_assets` and `booth_display_slots`; no parallel asset registry was created.
- Uses existing Supabase Storage bucket `allpha-world-assets` as the authoritative World asset bucket.
- `GET /api/v1/themes/world-runtime/themes/{theme_id}/asset-manifest` exposes storage paths and lifecycle/safety metadata only; it never fabricates public or signed URLs.
- District composition now returns authoritative District/Zone/Booth records plus presentation-only spatial projections and Booth asset/slot manifests.
- Booth position resolution order is explicit: `scene_config.position` → `display_config.position` → Zone `spatial_config.booth_anchor`.
- Asset and spatial records remain empty when no real business records exist; no synthetic District/Zone/Booth/asset data is seeded.



### Deterministic Scene Contract
`apps/web/lib/world-engine/scene-schema.ts`
- explicit schema version
- environment/terrain/structures/roads/pathways/zones/booths/portals/signage/screens
- lighting/atmosphere/audio/hotspots/spawn points/navigation/camera/performance/accessibility
- rejects top-level executable/authority namespaces
- normalization is deterministic and presentation-only

### Shared Renderer
`apps/web/components/world/allpha-world-renderer.tsx`
- one renderer for platform themes
- React Three Fiber + Three.js
- procedural geometry only; no fake business records
- low-power mode
- camera controls
- zones, spawn points and authorized Booth projections
- progressive renderer boundary; asset manifests remain authoritative future inputs

### Catalog Runtime API
`GET /api/v1/themes/world-runtime/catalog`
- reads existing platform Theme, World Template and Live Experience Template records
- resolves latest published versions
- returns scene configuration without mutating business state
- FastAPI remains the application boundary

### District Composition API
`GET /api/v1/themes/world-runtime/districts/{district_id}/composition`
- reads an authorized District plus its Zones and Booths
- RLS remains authoritative
- no synthetic District/Booth creation

### Navigation
`apps/web/lib/world-engine/navigation.ts`
- consumes explicit navigation graph when present
- deterministic zone graph fallback when absent
- shortest-path helper
- navigation is presentation/context, never authorization

### Preview
`/world`
- displays the real platform catalog
- selects existing catalog rows
- validates scene before rendering
- optional District UUID loads only authoritative Booth projections
- low-power fallback

### Tests
`database/tests/world_engine_catalog_invariants.sql`
- exactly 25 platform Themes
- exactly 25 platform World Templates
- exactly 25 platform Live Experience Templates
- every platform Theme has a published version
- every platform World Template has a published version
- published platform scene schemas are objects and reject top-level `code`/`script`

## Live verification
- platform Themes: 25
- platform World Templates: 25
- platform Live Experience Templates: 25
- platform Theme assets: 0
- Districts: 0
- Booths: 0
- Agent spatial states: 0
- 23D execution binding objects exist and are now reconciled into migration history
- catalog invariants passed

## Security
The Supabase security advisor still reports existing global findings, including many SECURITY DEFINER functions callable by authenticated, RLS tables without policies and existing duplicate policies. These are not newly introduced by the World Engine increment and are not being reclassified as GREEN.

## Known remaining gaps
1. Storage upload/signing lifecycle is still delegated to the existing asset RPC/storage authorization path; this increment exposes only the authoritative read manifest.
2. Real District/Zone/Booth spatial composition when authoritative business records exist.
3. Phase 18 realtime spatial projection and bounded position persistence.
4. Phase 23 collaboration encounter/request/execution UI wiring.
5. Phase 22 Live entry and character runtime wiring.
6. Character asset/voice/animation pipeline.
7. Mobile performance measurement on actual devices.
8. Accessibility verification.
9. API/PWA build verification and CI.
10. Authenticated E2E using real users/Agents only.

## Non-goals
- no second Agent Runtime
- no second Workflow/Mission engine
- no second Messaging engine
- no new authority model
- no fake Districts, Booths, Agents, Live sessions or business activity
- no executable scene code

## Status
World Engine foundation is implemented incrementally. It is not GREEN and does not replace final Phases 29–35 runtime/QA/production gates.

## AI Context / Memory / RAG integration

The World Engine is not an isolated renderer. Agent intelligence is composed through existing canonical engines:

Spatial Runtime → Spatial Context → existing Agent Memory / Knowledge retrieval → Context Budget → AI Gateway / Model Router → Agent Runtime → Workflow / Mission → Policy / Risk / Approval → execution

Existing Supabase foundations verified live:
- agent_memory
- agent_memory_embeddings
- knowledge_items
- knowledge_chunks
- retrieve_agent_memory(...)
- retrieve_agent_knowledge(...)
- ai_gateway_requests
- ai_gateway_attempts
- agent_execution_contexts
- workflows / workflow_versions / workflow_runs
- missions / mission_runs
- agent_spatial_states

New integration layer:
- apps/api/app/core/agent_context.py
- apps/api/app/api/agent_context.py
- GET /api/v1/agent-context/{agent_id}

This is a bounded context assembler, not a second Memory, RAG, Agent Runtime or Orchestration engine. It reads authorized state through existing RLS and keeps deterministic context first.

### Spatial Context RAG

When a valid World/District context exists, the context envelope can contain:
- current spatial state
- bounded Agent memory
- bounded Knowledge
- approved collaboration agreements
- Live collaboration state

Vector retrieval remains the existing retrieve_agent_memory / retrieve_agent_knowledge path. Vector similarity never grants authorization.

### LLM usage policy

The integration follows the source architecture:
1. deterministic logic
2. SQL / cache / search / vector retrieval
3. small model where sufficient
4. large model only when required

The context assembler itself performs no unnecessary LLM call.

The AI Gateway remains the only model boundary and retains usage telemetry, model routing, budget, retry/fallback, idempotency and safety responsibilities.

### Learning

The source Master PRD defines the learning loop as:

Content → Interaction → Behavior Signal → Content Understanding → Interest Affinity → Passion Cluster → Habit Pattern → Goal/Context Signal → Recommendation → New Interaction.

Spatial context can become one contextual signal, but it must not be treated as a standalone learning fact. Learning must use multiple signals and retain provenance.

### Orchestration

Phase 16 Workflow/Mission and Phase 15 Agent Runtime remain canonical. Spatial encounter, collaboration, Live and Character flows feed context into these engines; they do not create alternative orchestration/execution paths.


### Phase 18 — Spatial Runtime Adapter
- Reuses existing `agent_spatial_states`, `spatial_runtime_events`, `universe_agent_presences` and Supabase Realtime publication.
- Existing `update_agent_spatial_state` remains the authoritative persistence boundary; it now enforces bounded speed, required XYZ position shape, and a 100ms persistence floor.
- Every accepted spatial state update continues to project presence through existing `upsert_universe_agent_presence`.
- Added `GET /api/v1/spatial-runtime/worlds/{world_id}/agents/{agent_id}/context` to compose current spatial state with authoritative District → Zone → Booth context.
- Added browser Realtime adapter for `agent_spatial_states`; no second realtime/spatial engine.
- Spatial context explicitly carries `spatial_context_grants_permission=false`; authority remains in existing Agent Policy/RLS/Risk/Approval boundaries.
- Spatial context is a deterministic input to the existing Agent Context layer; it does not invoke an LLM per movement/update.
