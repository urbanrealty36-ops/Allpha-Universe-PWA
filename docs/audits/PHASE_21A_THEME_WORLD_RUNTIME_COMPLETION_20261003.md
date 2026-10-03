# Phase 21A — Theme / World Runtime Completion
Date: 2026-10-03

## Purpose

Complete the first missing runtime increment identified during Phase 18 continuation reconciliation without creating a second World/3D engine.

## Repository / Database baseline

- Repository: urbanrealty36-ops/Allpha-Universe-PWA
- Branch: main
- Supabase: AllphaDb-Universe / qltbacemtvnuzqkterly
- Canonical renderer: apps/web/components/world/allpha-world-renderer.tsx
- Canonical runtime API: apps/api/app/api/world_runtime.py
- Theme asset lifecycle RPCs:
  - prepare_platform_theme_3d_asset
  - finalize_platform_theme_3d_asset
  - archive_platform_theme_3d_asset

Live reconciliation on 2026-10-03:
- themes: 25
- theme_versions: 25
- world_templates: 25
- live_experience_templates: 25
- theme_assets: 0
- storage objects in allpha-world-assets: 0

The zero asset/object state is preserved. No synthetic Storage object or business record was created.

## Implemented in this increment

### 1. Canonical Theme Navigator renderer consolidation

apps/web/components/universe-theme-navigator.tsx no longer maintains a second Three.js / React Three Fiber world renderer.

It now:
- consumes the authoritative Theme/World catalog;
- normalizes the published World Scene through the existing scene schema;
- renders 3D/2.5D through AllphaWorldRenderer;
- requests the authoritative Theme asset manifest;
- uses a verified signed binary 3D asset when one is active;
- falls back to the canonical procedural renderer when binary assets are not yet active.

This preserves the architecture invariant:

Theme → World Template → Scene Schema → AllphaWorldRenderer → Spatial Runtime.

### 2. World Preview asset lifecycle activation

apps/web/components/world/world-preview-surface.tsx now requests the Theme asset manifest for the selected Theme and passes the first verified binary 3D asset to the canonical renderer.

The UI explicitly distinguishes:
- verified binary 3D pack active;
- procedural fallback active;
- asset manifest unavailable.

### 3. Super Admin 3D asset activation UI

apps/admin/app/themes/page.tsx now exposes the existing platform 3D asset lifecycle:
- request signed upload URL through FastAPI;
- upload the GLB with Supabase signed upload access;
- calculate SHA-256 in the browser;
- finalize the asset through FastAPI;
- retain server-side validation, moderation and publication boundaries.

No service-role credential is exposed to the browser.

### 4. Source asset verification

The supplied Allpha 25 Theme 3D asset pack was independently verified:
- 25 GLB files;
- glTF 2.0 container headers;
- manifest byte sizes match;
- SHA-256 checksums match the manifest for all 25 assets;
- each asset declares the canonical presentation components:
  WorldGround, District_A/B/C/D, WorldLandmark, BoothTemplate, AgentCharacterTemplate, PortalGateway, ContentAICapsule, LiveExperienceStage.

The source pack is an asset-authoring input. It is not treated as live business data until uploaded through the authoritative Storage lifecycle.

## Architecture invariants preserved

- No new World Renderer.
- No new Theme Engine.
- No new Spatial Runtime.
- No direct privileged frontend database access.
- No service-role key in browser.
- No synthetic World/District/Booth/Agent records.
- Theme/3D presentation cannot grant authority, ownership, capability, entitlement, billing, approval, risk clearance or audit authority.
- FastAPI remains the application boundary.
- Supabase PostgreSQL remains authoritative.
- Realtime remains projection/transport only.
- Memory/RAG, AI Gateway, Agent Runtime and Workflow/Mission remain canonical existing engines.

## Remaining completion gate

The remaining missing part is real Storage activation of the 25 supplied GLBs. The code path is now wired, but the live database correctly remains at 0 assets until actual authenticated upload/finalization occurs.

After real assets are activated, the next verification increment should prove one complete real chain:

Authenticated Super Admin
→ Theme Version
→ signed GLB upload
→ object/checksum verification
→ Theme Asset activation
→ published Theme
→ World Runtime asset manifest
→ signed download
→ AllphaWorldRenderer
→ real 3D Theme
→ District / Zone / Booth overlays
→ Agent spatial presence
→ Feed / Content / Portal / Live entry presentation.

Only after that chain is verified should the 25-Theme activation be expanded.

## Status

PHASE 21A — IMPLEMENTED RUNTIME WIRING / REAL STORAGE ACTIVATION PENDING

This is intentionally not marked GREEN.
