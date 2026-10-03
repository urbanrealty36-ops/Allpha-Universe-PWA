# Phase 21B — Theme Runtime / District / Booth Activation Audit

Date: 2026-10-03

## Scope

Activate the existing 25 platform Theme 3D assets in the canonical Theme Runtime and connect embedded `BoothTemplate` presentation to the existing `AllphaWorldRenderer`.

## Live reconciliation

Supabase project: `AllphaDb-Universe` / `qltbacemtvnuzqkterly`

- Platform Themes: 25
- Published Theme Versions: 25
- Storage GLB objects: 25
- Theme 3D assets: 25
- Storage-backed Theme 3D assets: 25
- Runtime-eligible Theme 3D assets: 25
- Storage bucket: `allpha-world-assets` (private)

Runtime eligibility requires:
- asset_type = `3d_scene`
- status = `active`
- moderation_status = `approved`
- safety_status = `passed`
- performance_status = `passed`
- matching real Storage object

All 25 assets satisfy those database/runtime gates.

## Canonical runtime path

`Theme → Theme Version → theme_assets → private Storage → signed runtime URL → AllphaWorldRenderer`

Existing runtime API:

`GET /api/v1/themes/world-runtime/themes/{theme_id}/asset-manifest`

Only active/approved/passed assets are converted into signed read URLs.

## District presentation

The supplied GLB pack contains:
- WorldGround
- District_A
- District_B
- District_C
- District_D
- WorldLandmark

`AllphaWorldRenderer` already loads the Theme GLB as the canonical environment.

District business/spatial objects remain separate runtime overlays and do not become part of the Theme asset's authority boundary.

## Booth presentation

The Theme GLB pack contains `BoothTemplate`.

The canonical renderer was updated in commit:

`a07e604837ecd72b7ba5ffa12752c7a04d5254cf`

When a real Booth-specific 3D asset is available, it remains authoritative. When a Booth has no specific 3D asset but the active Theme GLB contains `BoothTemplate`, the canonical renderer now instantiates that embedded template at the Booth's spatial position.

No second renderer or Booth engine was introduced.

## Asset integrity limitation

The original 25-asset source pack was independently verified against its manifest: all 25 source GLBs match the manifest SHA-256 and byte sizes.

The current Storage metadata confirms all 25 uploaded objects exist with the expected MIME type and matching source-pack byte sizes.

The current SQL/runtime activation gate does not cryptographically re-read the binary bytes from Storage, so `storage_checksum_verified` remains false. The stored manifest checksum is retained as provenance, not presented as a newly computed Storage hash.

## Not yet GREEN

Not yet proven:
- authenticated browser E2E against the live Web App
- signed URL retrieval in an authenticated browser session
- actual Three.js GLB rendering on device
- populated real District/Zone/Booth composition
- mobile/desktop performance
- full CI/build/production gates

Therefore this increment is:

**IMPLEMENTED RUNTIME ACTIVATION / E2E PENDING**

No synthetic business District, Booth, Agent, or World records were created.
