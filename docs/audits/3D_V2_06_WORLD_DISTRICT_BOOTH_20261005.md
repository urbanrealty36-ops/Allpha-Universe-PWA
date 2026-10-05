# 3D-V2.06 — World / District / Booth V2

Date: 2026-10-05
Status: IMPLEMENTED / SPATIAL HIERARCHY V2 FOUNDATION / RUNTIME VISUAL QA PENDING

## Scope
V2.06 upgrades the existing canonical spatial renderer so the World → District → Booth hierarchy has an explicit 3D composition contract and can present real authoritative scene objects without inventing authority.

## Implemented
- `apps/web/lib/world-engine/world-district-booth-v2.ts`
- `apps/web/components/world/allpha-world-renderer.tsx`
- World focal/core with four District spatial anchors.
- District focal/core with Booth spatial anchors.
- Booth focal/core with portal and Content Capsule presentation anchors.
- District and Booth path hierarchy.
- Foreground / midground / background depth scaling.
- Existing authoritative scene structures / booths are surfaced when available.
- Hotspots retain the existing renderer interaction callback.
- Presentation-only V2 composition metadata.
- Mobile-aware geometry budgets.
- Reduced-motion handling.
- Progressive enhancement: 2D → 2.5D → Spatial → 3D.

## Architecture boundary
No new renderer, World engine, District engine, Booth engine, authority layer, Agent Runtime, Live Runtime, Feed/Discovery engine, asset manifest, or signed URL lifecycle was introduced.

The V2 composition factory is presentation-only. Existing API/Supabase scene, district and booth records remain authoritative.

## Visual target
### World
Recognizable central World identity → District landmarks → connected spatial paths → deep environment.

### District
District identity → Booth cluster → pathways → spatial tenant hierarchy.

### Booth
Booth identity → portal → spatial Content Capsules → tenant/Agent surface.

## Not claimed complete
- production GLB replacement
- 25-theme runtime validation
- 350 final templates
- final V2 asset manifest cutover
- browser/device visual QA
- production visual GREEN
- WEB-16 completion

CW-02 remains OPEN / ACTIVATING / NOT GREEN until runtime/browser/device validation is completed.
