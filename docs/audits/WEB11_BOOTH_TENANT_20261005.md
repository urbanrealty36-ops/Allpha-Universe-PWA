# WEB-11 — Booth / Tenant Experience Implementation Audit

Date: 2026-10-05
Status: IMPLEMENTED / RAILWAY BUILD PENDING / BROWSER QA PENDING
Wave: CW-02.WEB
Previous: WEB-10 — District Experience
Next: WEB-12 — Agent Experience

## Source basis

The canonical WEB phase plan names WEB-11 as Booth/Tenant after District Experience. The current platform already exposes the Booth/Tenant backend contract through FastAPI → Supabase, including Booth identity, assets, display slots, tenancy leases, publication lifecycle and Agent Host discovery.

This implementation activates that existing contract as a dedicated Web Booth Experience. It does not replace the existing Phase 20 Booth Builder at /booths.

## Implementation

Added:
- `apps/web/components/booth-experience-surface.tsx`
- `apps/web/app/booths/[booth_id]/page.tsx`

Updated:
- `apps/web/components/district-experience-surface.tsx`

District Booth selection now opens the authoritative Booth detail route:
- `/booths/{booth_id}`

The existing `/booths` surface remains the Booth Builder / management workflow.

## Canonical reads

The experience consumes existing contracts:
- GET /api/v1/booths/{booth_id}
- GET /api/v1/booths/{booth_id}/assets/3d
- GET /api/v1/booths/{booth_id}/slots
- GET /api/v1/booths/{booth_id}/leases
- GET /api/v1/themes/world-runtime/districts/{district_id}/composition
- GET /api/v1/themes/world-runtime/catalog
- GET /api/v1/themes/world-runtime/themes/{theme_id}/asset-manifest
- GET /api/v1/universe/worlds/{world_id}
- GET /api/v1/agent-catalog/accounts?booth_id={booth_id}
- GET /api/v1/marketplace/listings?booth_id={booth_id}

## Experience

The Booth surface presents:
- Booth identity / tenant identity
- Booth type and tier
- District / Zone / World context
- branding metadata
- published Marketplace listings
- AI Host / Agent Account
- Agent interaction actions
- Booth tenancy / lease state
- verified 3D assets
- declarative display slots
- Live Entry metadata when configured
- realtime Booth/asset/slot/lease/listing reconciliation
- 5-second authoritative refresh fallback
- low-power mode
- explicit 2D fallback
- responsive bottom-navigation / context-sheet-compatible shell

## Spatial presentation

The existing `AllphaWorldRenderer` remains the sole canonical renderer.

WEB-11:
- validates the existing published Theme World Schema through `normalizeWorldScene`;
- renders the real Booth GLB only when an authoritative signed asset URL is available;
- uses the existing Theme 3D asset manifest when available;
- keeps Booth core information usable without WebGL;
- does not generate synthetic scene/model URLs.

The Booth is rendered as a spatial tenant node inside the existing World/District context. No second renderer or spatial engine is introduced.

## Agent interaction

Agent Host discovery uses the existing:
- GET /api/v1/agent-catalog/accounts?booth_id={booth_id}

Interactions use the existing Spatial Runtime contract:
- POST /api/v1/spatial-runtime/worlds/{world_id}/interactions

Supported interaction intents:
- conversation
- collaboration
- shopping
- negotiation

The frontend sends intent only. Passport, capability, policy, permission, risk, approval and execution remain authoritative.

## Commerce / tenancy boundary

Published Marketplace listings are presentation-only in WEB-11. Order/payment execution remains with the existing Marketplace/Commerce engine.

Lease records are presented from the existing Booth tenancy contract. WEB-11 does not invent pricing, entitlement or billing state and does not calculate lease authority in the browser.

The existing /booths Builder remains available for owner/tenant management workflows.

## Realtime

Supabase Realtime subscriptions are presentation/reconciliation only:
- booths
- booth_display_assets
- booth_display_slots
- booth_leases
- marketplace_listings

Realtime never grants access or authority.

## Architecture compliance

No new:
- renderer
- spatial engine
- Feed/Discovery engine
- Recommendation engine
- Agent Runtime
- AI Gateway
- Theme/World authority
- permission authority
- commerce engine
- billing engine

No fake business data or fake 3D assets were introduced.

## Validation

Source implementation is complete.

Railway build/deployment remains pending.
Browser/device visual QA and authenticated E2E remain pending.
Production GREEN is not claimed.

## Completion classification

WEB-11 source implementation is complete.
Next canonical product phase: WEB-12 — Agent Experience.
CW-02 remains OPEN / ACTIVATING / NOT GREEN.
