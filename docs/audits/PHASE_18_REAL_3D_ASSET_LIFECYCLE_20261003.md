# Phase 18 — Real 3D Asset Lifecycle: Booth + Live Stage + AI Character

Date: 2026-10-03

## Status

IMPLEMENTED ASSET LIFECYCLE / AUTHENTICATED STORAGE + RUNTIME E2E PENDING

This increment closes the missing real-asset lifecycle between existing domain workflow/renderer foundations and runtime presentation.

## Implemented

### Booth

Booth already had the authoritative lifecycle and remains canonical:

prepare → signed upload → Storage object verification → active asset → slot binding → published Booth → signed runtime asset → AllphaWorldRenderer.

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
