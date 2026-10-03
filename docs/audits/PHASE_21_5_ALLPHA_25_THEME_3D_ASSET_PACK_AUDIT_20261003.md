# Allpha Universe — Phase 21.5 Theme 3D Asset Pack Audit
Date: 2026-10-03

## Scope

Phase 21.5 materializes the existing 25 platform Themes as a real 3D asset-pack lifecycle without creating duplicate Theme/World records.

## Reconciled live state

Supabase project: `AllphaDb-Universe` (`qltbacemtvnuzqkterly`)

- Platform Themes: 25
- Published platform Theme Versions: 25
- Theme binary assets: 0
- Storage bucket `allpha-world-assets`: private
- Storage objects: 0 before upload activation
- Platform 3D prepare/finalize/archive RPCs: present
- Anonymous EXECUTE on platform 3D RPCs: denied
- Platform Theme Storage read policy: present

The zero binary-asset count is intentional until actual GLB bytes are uploaded and finalized. No fake Storage object or synthetic `theme_assets` row was inserted.

## Implemented

### Database

Migration:
`database/migrations/20261003190000_phase_21_5_allpha_25_theme_3d_asset_pack.sql`

Adds:
- `storage_bucket`
- `content_size_bytes`
- `checksum_sha256`
- `uploaded_at`
- platform 3D prepare/finalize/archive lifecycle
- private Storage read policy for verified platform Theme assets
- platform active-asset index

Security boundary:
**platform admin permission → prepare metadata → signed Storage upload → finalize verifies object ownership + non-zero size → active asset → signed runtime delivery**

### FastAPI

`apps/api/app/api/themes.py`
- POST `/api/v1/themes/platform-assets/{version_id}/3d/upload-url`
- POST `/api/v1/themes/platform-assets/{version_id}/3d/{asset_id}/finalize`

`apps/api/app/api/world_runtime.py`
- Theme asset manifest now exposes verified active assets and server-generated signed URLs.
- `has_binary_3d_pack` is derived from real Storage-backed state.

### PWA

`apps/web/components/universe/immersive-universe-shell.tsx`
- resolves active Theme asset manifest
- mounts only a real signed 3D pack URL

`apps/web/components/world/allpha-world-renderer.tsx`
- loads Theme GLB through the existing renderer
- suppresses static template-only nodes so real Booth/Agent/Portal/Content/Live runtime objects remain authoritative

### Asset artifact

25 low-poly GLB Theme packs were generated and loaded successfully with a GLB parser in the implementation workspace. Each pack contains named template nodes for:
- World environment
- District A/B/C/D
- World landmark
- Booth template
- Agent Character template
- Portal Gateway
- Content AI Capsule
- Live Experience stage

The generated distributable artifact is external to Supabase state and must be uploaded through the authenticated platform-admin lifecycle before it can become active runtime data.

## Invariants

`database/tests/phase_21_5_allpha_25_theme_3d_asset_pack_invariants.sql` checks:
- 25 platform Themes
- 25 published approved Theme Versions
- required Theme Asset lifecycle columns
- required platform 3D RPCs
- anonymous execution denied
- platform Storage read policy present

## Status

**IMPLEMENTED FOUNDATION / STORAGE ACTIVATION PENDING**

This phase must not be reported GREEN until:
1. all 25 generated GLBs are uploaded through the signed-upload path;
2. all 25 are finalized and verified in Supabase Storage;
3. `theme_assets` shows 25 active verified 3D scene assets;
4. authenticated browser E2E loads signed URLs;
5. mobile/desktop performance and accessibility gates pass;
6. API/PWA/Admin builds and CI pass;
7. production runtime verification passes.
