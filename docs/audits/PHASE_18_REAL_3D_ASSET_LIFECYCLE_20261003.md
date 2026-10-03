# Phase 18 — Real 3D Asset Lifecycle: Booth + Live Stage + AI Character

Date: 2026-10-03

## Status

IMPLEMENTED ASSET LIFECYCLE / AUTHENTICATED STORAGE + RUNTIME E2E PENDING

This increment closes the missing real-asset lifecycle between existing domain workflow/renderer foundations and runtime presentation.

## Implemented

### Booth

Booth already had the authoritative lifecycle and remains canonical. Spatial Slice now consumes its signed active 3D asset and passes model_url into AllphaWorldRenderer:

prepare → signed upload → Storage object verification → active asset → signed runtime asset → Spatial Slice → AllphaWorldRenderer.

Slot binding remains available through the existing Booth domain API.

No duplicate Booth asset engine was created.

### Live Experience Stage

Added public.live_experience_stage_assets with:

- template version binding
- controlled Storage bucket/path
- GLB MIME validation
- pending → active → archived lifecycle
- moderation state
- SHA-256 checksum
- content size
- upload verification timestamp
- creator ownership
- RLS and explicit authenticated grant

Added server-authoritative RPC lifecycle:

- prepare_live_stage_3d_asset
- finalize_live_stage_3d_asset
- archive_live_stage_3d_asset
- moderate_live_stage_3d_asset

Added FastAPI endpoints under /api/v1/live-assets.

Runtime only returns a signed URL when:

- asset is active
- asset moderation is approved
- template version is published + approved
- template is published

### AI Character

Extended existing live_character_assets instead of creating a duplicate character asset domain.

Added:

- storage_bucket
- content_size_bytes
- checksum_sha256
- uploaded_at
- 3D agent index

Added server-authoritative RPC lifecycle:

- prepare_agent_character_3d_asset
- finalize_agent_character_3d_asset
- archive_agent_character_3d_asset
- moderate_agent_character_3d_asset

Character runtime only exposes a signed URL when:

- asset_type = character
- status = active
- moderation_status = approved
- Agent status = active

### Storage

Reused existing private buckets:

- allpha-world-assets
- allpha-agent-assets

Added Storage read policies for approved/active Live Stage and AI Character assets.

Uploads continue to use short-lived signed upload URLs. The browser never receives service-role credentials.

### Renderer

AllphaWorldRenderer now accepts:

- liveStageUrl
- agentCharacterUrl

The renderer remains the canonical engine boundary.

Live Experience now composes:

Theme binary environment
→ Live Stage GLB
→ Booth nodes
→ Agent spatial state
→ Agent Character GLB

Character rendering remains presentation-only and does not change identity, authority, capability, policy, consent, risk, approval, billing or audit.

### UI

Added:

- Admin /live-stage-assets lifecycle/moderation surface
- Admin /character-assets moderation queue
- Avatar Studio AI Character 3D GLB upload
- Live Experience runtime asset status
- Theme 3D + Live Stage + AI Character runtime wiring

No fake catalog/business records were seeded.

## Supabase security verification

Verified:

- Live Stage table RLS enabled
- Live Stage explicit authenticated SELECT grant
- AI Character explicit authenticated SELECT grant
- private Storage buckets exist
- Storage visibility policies require approved/active assets
- lifecycle functions require authenticated execution
- archive functions have anonymous EXECUTE revoked
- existing baseline advisor findings remain elsewhere in the project

Supabase's current platform guidance requires explicit grants for newly created public tables as the Data API exposure behavior rolls out; the migration includes the required explicit grant.

## Runtime gate still pending

Not Green yet.

Required evidence:

1. authenticated upload of a real Live Stage GLB
2. authenticated upload of a real AI Character GLB
3. Storage object verification
4. admin moderation approval
5. signed runtime URL retrieval
6. authenticated Live Session → Collaboration → Agent Presence
7. real Live Stage GLB rendered in AllphaWorldRenderer
8. real AI Character GLB rendered at authoritative spatial presence
9. Booth real GLB + Live Stage + AI Character rendered together
10. browser E2E and CI/build verification

Until those gates are executed, procedural/fallback and empty/not-activated states remain legitimate.

## No fake data

No Live Stage asset rows or AI Character asset rows were seeded. Empty asset state is intentional until a real owner/admin uploads and approves actual GLB files.

## Authenticated E2E gate execution — 2026-10-03

The implementation was re-verified against the live Supabase project before attempting the final E2E gate.

Verified live:

- live_experience_stage_assets exists with Storage/checksum/moderation lifecycle columns.
- Live Stage lifecycle RPCs exist: prepare_live_stage_3d_asset, finalize_live_stage_3d_asset, archive_live_stage_3d_asset, moderate_live_stage_3d_asset.
- AI Character lifecycle RPCs exist: prepare_agent_character_3d_asset, finalize_agent_character_3d_asset, archive_agent_character_3d_asset, moderate_agent_character_3d_asset.
- live_experience_stage_assets and live_character_assets have authenticated access/RLS controls.
- allpha-world-assets currently has zero objects.
- allpha-agent-assets currently has zero objects.
- No test/business asset rows were inserted.

### Final gate status

NOT EXECUTED / NOT GREEN

A real authenticated browser E2E cannot be truthfully marked complete from the current execution environment because this conversation runtime has no writable browser/runtime session connected to the local FastAPI/Web services, and the repository does not currently expose a deployed E2E target.

The required gate remains:

real Booth GLB
→ real Live Stage GLB
→ real AI Character GLB
→ authenticated signed upload
→ Storage verification
→ admin moderation
→ authenticated signed download
→ Live Session
→ Collaboration consent
→ Collaboration activation
→ Agent World Presence
→ AllphaWorldRenderer
→ browser assertion

No fake Storage object or SQL-inserted storage.objects row is being used as a substitute. Supabase explicitly recommends creating/deleting Storage objects through the Storage API rather than manipulating storage.objects directly.

The next execution environment must provide:

- an isolated/staging Supabase target or explicit E2E cleanup credentials
- authenticated owner credentials
- authenticated Super Admin credentials with admin.manage
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_API_URL
- running FastAPI on :8000
- running Web PWA on :3000
- Playwright Chromium

Playwright is the intended browser gate because it provides authenticated browser state, Chromium execution, screenshots/traces, and CI integration.
