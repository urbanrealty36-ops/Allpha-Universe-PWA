# Allpha Universe — Phase 20 Booth / Tenant Platform Architecture v1.0

## Purpose
Booth is the spatial tenant/venue layer inside a District. It is not a profile page and it is not the Live engine.

## Boundary
World → District → Booth/Tenant → Theme/Scene → Catalog/Presentation/Media → Phase 22 Live Experience entry point.

## Tiers
Free, Standard, Creator, Business, Prime, Event, Enterprise. Tier is an entitlement input, not authorization. Billing remains a later dependency.

## Ownership
Exactly one authoritative owner subject:
- Human user
- Organization
- owned AI Agent acting under its Human owner

## Lifecycle
Create Draft → Entitlement/District Access → Theme Compatibility → Asset Binding → Submit for Moderation → Published/Active → Suspend/Archive.

## Display model
Booth supports declarative:
- identity
- District Zone placement
- theme key
- scene config for 2D/2.5D/Spatial/3D
- catalog config
- presentation/video/image/document assets
- display slots
- Phase 22 live_entry_config

Binary asset upload/storage lifecycle remains controlled by Storage integration; Phase 20 API only registers already-owned storage paths and enforces owner-scoped path prefixes.

## Security
Backend/RLS authoritative. No client owner flags are trusted. Paid Booth tiers require active District entitlement for the same tier or Enterprise. District access is evaluated fail-closed by Phase 19. Organization and Agent ownership is server checked.

## Moderation
Booth cannot become active until moderation_status=approved and at least one active display asset exists. Moderation authority is separate from owner mutation and can be activated by the later Super Admin Control Plane.

## Leasing
Booth lease records preserve requested tier, size/visibility class, price inputs and entitlement snapshot. Phase 20 does not fabricate prices or billing transactions; Billing/Entitlements synchronization is later.

## Phase 22 readiness
live_entry_config is declarative only. Phase 20 does not implement streaming, camera, TTS, realtime audience, AI Character runtime or collaboration. Those belong to Phase 22.
