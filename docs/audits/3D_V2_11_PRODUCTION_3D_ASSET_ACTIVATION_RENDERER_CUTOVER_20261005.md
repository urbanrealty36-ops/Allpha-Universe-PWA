# 3D-V2.11 — Production 3D Asset Activation & Canonical Renderer Cutover

Date: 2026-10-05
Repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Canonical renderer: AllphaWorldRenderer
Canonical bucket: allpha-world-assets
Canonical root: theme-v2-real-3d/{theme}/{category}.glb

## Implemented

- Production activation matrix: 25 themes × 14 categories = 350.
- Canonical runtime boundary remains presentation-only.
- ThemeV2SpatialScene now uses a production-manifest-first cutover.
- ThemeV2ProductionAssetScene resolves the public theme asset manifest and loads the exact category GLB from its signed URL.
- Procedural Theme V2 realization is an exclusive fallback and is not rendered alongside a resolved production GLB.
- Added scripts/3d/activate-production-assets.mjs.
- Added pnpm activate:3d:assets.
- Activation runner uploads through Supabase Storage API, verifies every object, then registers theme_assets against the published platform theme version.
- Default runner mode is staged/pending. Active promotion requires ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED=true.
- Runner never deletes legacy assets.
- Service-role credentials are server-side only.

## Supabase evidence

Inspection of AllphaDb-Universe on 2026-10-05 confirmed:
- 25 published platform themes, approved.
- Each theme has a published version with validation/performance passed and moderation approved.
- Existing theme_assets population is currently 1 asset per theme.
- No V2 350-object population was present in allpha-world-assets at inspection time.

## Physical activation gate

The connected Supabase tool surface does not expose a binary Storage upload action, so the 350 local GLBs cannot be truthfully marked physically uploaded/active from this chat execution.

The repository now contains the server-side activation runner required to complete physical promotion outside this connector limitation.

Required sequence:
1. Run pnpm activate:3d:assets against the validated production pack with server-side Supabase credentials.
2. Confirm 350 Storage objects and 350 theme_assets rows.
3. Verify public manifest signed URLs for every theme/category.
4. Run browser and real-device visual QA.
5. Only after approval, run --activate with ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED=true.
6. Keep legacy rollback paths until runtime QA and rollback window are closed.

## Status

- 350-asset activation contract: PASS
- Canonical renderer cutover code: PASS
- Manifest-first runtime resolution: PASS
- Exclusive procedural fallback: PASS
- Legacy protection: PASS
- Physical Supabase binary upload: BLOCKED by connector capability
- Signed URL verification: OPEN
- Browser/device visual QA: OPEN
- Final GREEN: NOT CLAIMED
