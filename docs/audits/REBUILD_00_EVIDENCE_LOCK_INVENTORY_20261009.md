# REBUILD-00 — Evidence Lock & Repository/Storage Inventory
**Date:** 2026-10-09  
**Repository:** `urbanrealty36-ops/Allpha-Universe-PWA`, branch `main`  
**Repository HEAD at inspection:** `a2ba44830ff78c242708e5c598113b47a9ad225b`  
**Supabase:** `AllphaDb-Universe` / `qltbacemtvnuzqkterly` / `ap-south-1`

## Status
**IN PROGRESS — inventory established; physical cleanup and runtime verification are not complete.** This document records evidence from the live repository tree and read-only Supabase inventory. It is not a claim that the old Theme assets have already been deleted or that the app has passed production QA.

## 1. Governing contracts confirmed
- `AGENTS.md` says the monorepo contains `apps/web`, `apps/admin`, and `apps/api`; FastAPI remains the application boundary and Supabase Postgres remains the business-data source of truth.
- `apps/web/app/page.tsx` renders `UniverseEntrySurface`.
- `apps/web/app/layout.tsx` imports `apps/web/app/globals.css` and `apps/web/styles/ui-visual-foundation.css`, mounts `PwaRuntime`, and sets Indonesian as the document language.
- The Web package already declares Three.js, React Three Fiber and Drei. Do not add another renderer stack.
- The canonical spatial renderer path includes `apps/web/components/world/allpha-world-renderer.tsx`; preserve it as the canonical renderer until a tested replacement within the same contract is implemented.
- Theme/World asset registration and activation must continue through existing `theme_assets`, Theme/Theme Version, the existing manifest/runtime resolver, Storage authorization and FastAPI/Supabase policy boundaries.

## 2. Current repository footprint
The recursive Git tree contained **975 paths** at the inspected HEAD, of which **169 paths** matched theme/3D/renderer/UI-foundation-related names or directories. That count is a discovery scope, not a count of obsolete files.

### Existing Theme 3D implementation surfaces discovered
- Runtime and renderer: `apps/web/components/world/allpha-world-renderer.tsx`, `cinematic-3d-scene.tsx`, `theme-v2-production-asset-scene.tsx`, `theme-v2-real-3d-asset.tsx`, `theme-v2-spatial-scene.tsx`.
- Theme and asset logic: `apps/web/lib/world-engine/asset-factory.ts`, `procedural-theme.ts`, `production-3d-activation.ts`, `production-3d-asset-pipeline.ts`, `production-3d-runtime-resolver.ts`, `production-realistic-art-v2-13.ts`, `theme-v2-visual-matrix.ts`, `spatial-composition-v2.ts`, `world-district-booth-v2.ts`.
- Theme authoring UI: `apps/web/components/theme-builder-surface.tsx`, `theme-package-generator.tsx`, `theme-spatial-slice.tsx`, `theme-studio-surface.tsx`; routes `/theme-builder`, `/theme-studio`, `/themes`.
- Existing 3D generation/QA automation: multiple `.github/workflows/*3d-v2-12*`, `*3d-v2-13*`, `*v2-13d*`; `scripts/3d/*`; and `tools/theme_assets/generate_allpha_25_theme_3d_pack.py`.
- Existing design and 3D language packages: `packages/design-tokens/3d-visual-language.ts`, `3d-golden-theme-factory.ts`, `tokens.css`.
- Existing visual foundation: `apps/web/styles/ui-visual-foundation.css` (28,024 bytes at inspection), imported globally by the root layout. Do not delete this stylesheet wholesale: it contains shared UI/PWA rules and requires class/import reference analysis before splitting or removal.

## 3. Supabase Storage inventory
Read-only query against `storage.objects` returned one bucket:
- Bucket: `allpha-world-assets`
- Objects at inspection: **453**
- Total stored bytes reported by object metadata: **2,870,364,402** (~2.87 GB)

Previous path-level grouping for this bucket showed:
- `theme-v2-real-3d/v2.13/`: 100 objects (~2.85 GB)
- `theme-v2-real-3d/{theme}/` other theme prefixes: 352 objects (~16.5 MB)
- One additional object outside those groups.

**Important:** this latest aggregate still reports 453 objects. It does not yet prove that the user’s manual deletion has happened. Re-run path-level Storage inventory after the manual cleanup and before any activation work. Do not manipulate `storage.objects` directly with SQL; use the Supabase Storage UI/API.

## 4. Database metadata snapshot
Read-only query against `public.theme_assets` showed **475 rows**, all grouped as `status=active`, `asset_type=3d_scene`, `storage_bucket=allpha-world-assets` at the time of inspection. Metadata rows may outlive deleted Storage objects; after manual Storage cleanup, reconcile every `storage_path` with an actual object and mark/remove stale rows only through the approved application/migration lifecycle, not as a substitute for deleting the file.

## 5. Retirement classification
### Preserve
- `AllphaWorldRenderer` and the established spatial runtime contract.
- Supabase Storage authorization/signed URL handling, `theme_assets`, Theme/Theme Version lifecycle, moderation/safety/performance metadata, FastAPI APIs and security policies.
- Shared identity/auth/PWA runtime and business-domain routes.
- Shared design tokens until actual imports and references are reconciled.

### Candidates for retirement (must verify references before deleting)
- V2.12/V2.13/V2.13D-specific asset-generation, promotion and QA scripts/workflows.
- V1 or procedural scene builders that generate placeholder geometry for production rendering.
- Duplicate theme factories, stale manifest contracts and unused preview components.
- Unused visual helper functions and CSS selectors.

### Prohibited shortcut
Do not delete all files with `theme`, `3d` or `v2` in the name. The current runtime and the legacy authoring/generation pipeline overlap in naming, so removal must be based on import/call-site and workflow reference evidence.

## 6. REBUILD-01 execution checklist
- [x] Confirm canonical repository/branch and read `AGENTS.md`.
- [x] Inspect root route/layout, shared stylesheet imports, Web dependencies, renderer/runtime file inventory.
- [x] Query live Storage object and `theme_assets` counts read-only.
- [ ] Confirm user’s manual Storage deletion with a fresh path-level inventory.
- [ ] Build a reference map for every candidate legacy script/component/workflow.
- [ ] Remove confirmed dead code and V2-only automation; preserve the canonical renderer and APIs.
- [ ] Run TypeScript/build and route/renderer tests.
- [ ] Reconcile every remaining metadata row with an existing Storage object and active manifest.
- [ ] Record exact files removed, test results and remaining blockers.

## 7. Gate decision
REBUILD-00 is **partially evidenced, not GREEN**: source-of-truth contracts and a live inventory are captured, but the Storage path inventory needs re-checking after manual deletion and the full call-site map is still pending. REBUILD-01 may proceed only with narrowly proven dead code while the full reference map is built; broad deletion is blocked until the relevant dependency evidence exists.
