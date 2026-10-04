# WEB-10 — District Experience Implementation Audit

Date: 2026-10-05
Status: IMPLEMENTED / RAILWAY BUILD PENDING / BROWSER QA PENDING
Wave: CW-02.WEB
Previous: WEB-09 — World Experience
Next: WEB-11 — Booth/Tenant

## Source basis

WEB-10 upgrades the existing District Experience foundation into the canonical District layer:

Universe → Galaxy → World → District → Zone → Booth → Agent Presence.

The implementation preserves the existing FastAPI/Supabase contracts and the existing AllphaWorldRenderer. No new spatial authority or renderer is introduced.

## Implementation

Upgraded:
- `apps/web/components/district-experience-surface.tsx`

Existing route retained:
- `apps/web/app/districts/[district_id]/page.tsx`

Existing management surface retained separately:
- `apps/web/components/districts-surface.tsx`

## District composition

The Experience consumes:
- `GET /api/v1/themes/world-runtime/districts/{district_id}/composition`
- `GET /api/v1/themes/world-runtime/catalog`
- `GET /api/v1/districts/{district_id}/spatial-objects`
- `GET /api/v1/agent-catalog/accounts?district_id={district_id}`
- `GET /api/v1/universe/worlds/{world_id}`

The composition endpoint remains authoritative for:
- District
- Zones
- Booths
- spatial presence
- Booth spatial projection
- verified Booth 3D asset projections

## Spatial presentation

The existing `AllphaWorldRenderer` is reused.

WEB-10 now:
- validates published Theme World Schema through `normalizeWorldScene`;
- passes District spatial objects to the canonical renderer;
- passes real Agent spatial presence;
- passes real Booth positions;
- passes verified Booth 3D signed assets where available;
- resolves the published Theme 3D asset manifest when available;
- exposes a 2D fallback when no validated scene exists;
- exposes low-power mode;
- keeps core District actions usable without WebGL.

No fake GLB/model URLs are generated.

## Realtime

The surface subscribes to existing Supabase Realtime tables:
- `agent_spatial_states`
- `booths`
- `district_zones`
- `district_spatial_objects`

A 5-second authoritative refresh remains as fallback/reconciliation.

Realtime state is presentation only. It does not grant authorization.

## District interaction

Entry uses the existing:
- `POST /api/v1/districts/{district_id}/join`

Restricted access can use:
- `POST /api/v1/districts/{district_id}/requests`

Agent interaction uses:
- `POST /api/v1/spatial-runtime/worlds/{world_id}/interactions`

Interaction types:
- conversation
- collaboration
- shopping
- negotiation

The frontend does not resolve Policy, Permission, Risk, Approval or execution results.

## UX

Full District surface includes:
- District identity
- World context
- District type / visibility
- realtime state
- District metrics
- Enter District
- Explore Zones
- Low-power toggle
- live Agent Presence
- Zones tab
- Booths / Tenants tab
- Agents tab
- District overview
- spatial object inspection
- Booth inspection
- Agent interaction sheet
- access request flow
- runtime state panel
- explicit loading / error / unavailable states
- responsive bottom-sheet behavior
- UniverseShell / MobileNavigation integration

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

Frontend remains presentation/interaction only.

## Validation

WEB-09 latest Railway deployment is SUCCESS.
WEB-10 source commits have triggered Railway builds; final build status is pending at audit creation time.

Browser/device visual QA and authenticated E2E remain pending.

Production GREEN is not claimed.

## Completion classification

WEB-10 source implementation is complete.
Next canonical product phase: WEB-11 — Booth/Tenant.
CW-02 remains OPEN / ACTIVATING / NOT GREEN.
