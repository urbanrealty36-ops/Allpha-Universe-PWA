# ALLPHA WORLD ENGINE — Architecture & Implementation Status v1.0

Date: 2026-10-02
Status: IMPLEMENTED FOUNDATION / NOT GREEN

## Purpose
Turn the existing Phase 21 Theme/World catalog into one reusable spatial presentation engine without creating parallel engines or authority paths.

## Canonical pipeline
Theme Catalog → Published Theme Version → World Template Version → validated Scene Schema → Asset Manifest → AllphaWorldRenderer → Spatial Runtime → District/Booth projection → Phase 23 collaboration → Phase 22 Live entry → Character presentation.

## Implemented in this increment

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
1. Real Storage asset manifest lifecycle; no fabricated Storage URLs.
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
