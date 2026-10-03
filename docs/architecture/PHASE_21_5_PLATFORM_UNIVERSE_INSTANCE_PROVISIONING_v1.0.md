# Phase 21/21.5 — Platform Universe Instance Provisioning

## Purpose

Activate the already-published platform Theme + World Template + real 3D asset catalog as canonical Universe instances.

This is an activation/provisioning layer over the existing Phase 17 AI Universe, Phase 19 District, Phase 20 Booth/Tenant and Phase 21 Theme/World engines. It does not introduce a second World, District, Booth, Theme or renderer engine.

## Canonical source chain

Theme Catalog → Theme Version → verified 3D Theme Asset → World Template → World Template Version → Platform World Instance → Platform District Instances → District Zones → Platform Booth Instance → existing AllphaWorldRenderer.

The provisioning layer uses only published platform catalog records and verified theme assets already present in the private allpha-world-assets Storage bucket.

## Platform topology

For each of the 25 published platform World Templates:
- 1 World instance
- 4 District instances mapped to the GLB District_A … District_D components
- 4 Zones per District, derived from the existing World Template world_schema.zones
- 1 Platform Booth per District, bound to the existing booth zone and BoothTemplate presentation component

Result:
- 1 platform Galaxy
- 25 Worlds
- 100 Districts
- 400 Zones
- 100 platform Booths

These are platform-owned product configuration/spatial instances, not user-created business records, demo users, fake Agents, fake Content or fake commerce transactions.

## Ownership boundary

Phase 17 already permits platform at the Galaxy/World schema level. Phase 19/20 previously assumed only Human/Agent/Organization-owned instances. This increment minimally activates a platform lane:
- District owner_type='platform', owner_id=NULL, created_by_user_id=NULL
- Booth platform_owned=true with no Human/Organization/Agent tenant owner
- platform instances are public/active and presentation-only
- user/Agent/Organization ownership rules remain unchanged for normal creator/business instances

Platform instances cannot grant Agent authority, permissions, entitlements, billing, risk, approval or transaction authority.

## 3D composition

World/District/Booth spatial_config / scene_config carries authoritative references to the existing Theme Asset ID and GLB component names. The actual binary remains in the existing Storage lifecycle and is resolved through the existing World Runtime asset manifest and signed-download path.

No new asset registry and no new renderer are introduced.

## Completion status

This increment is IMPLEMENTED / not final GREEN. Remaining later gates include authenticated runtime/browser verification, renderer/device performance/accessibility verification, realtime verification, build/CI, and final production gates.