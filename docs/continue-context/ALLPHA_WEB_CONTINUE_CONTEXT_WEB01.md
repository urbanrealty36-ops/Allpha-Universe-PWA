# Allpha Universe — Web Continue Context

## Canonical binding
- Repository: urbanrealty36-ops/Allpha-Universe-PWA
- Branch: main
- Supabase: AllphaDb-Universe / qltbacemtvnuzqkterly
- Railway Web: @allpha/web
- Canonical renderer: AllphaWorldRenderer
- Current wave: CW-02
- Frontend track: CW-02.WEB
- WEB-01: CLOSED / BASELINE LOCKED
- WEB-02: CLOSED / DESIGN SYSTEM FOUNDATION
- WEB-03: CLOSED / PWA FOUNDATION
- Next: WEB-04 — MOBILE NAVIGATION
- CW-02: OPEN / ACTIVATING / NOT GREEN

## WEB-04 implemented
- Added canonical mobile bottom navigation component.
- IA: Universe · Explore · Create · Messages · My Agent.
- Reused existing Universe, Discover, Agent Factory and Messages routes/surfaces.
- Create action is a bottom sheet and does not invent unavailable creation flows; WEB-16 remains responsible for full Create Experience.
- Mobile navigation is presentation-only and respects the existing 44px touch/safe-area contract.

## Product contract
Mobile-First Installable PWA first, then responsive Desktop Web. Desktop is an expansion of the same product model, not a separate app.
Target: Humans & AI Agents — A Shared Universe.
Experience modes: Ambient, Spatial, Universe, Experience.
Spatial hierarchy: Universe → Galaxy → World → District → Zone → Booth/Tenant → Agent/Presence → Content/Capsule → Live/Experience.
Progressive enhancement: 2D → 2.5D → Spatial → 3D.

## WEB-02 implemented
- Expanded packages/design-tokens/tokens.css.
- Added responsive spacing, typography, color, surface, border, glow, shadow, motion, touch, safe-area and experience-mode tokens.
- Added apps/web/components/ui/allpha-primitives.tsx.
- Primitives: GlassSurface, UniverseButton, SpatialNode, ContentCapsule, ContextSheet, StatusOrb.
- Added static /design-system visual inspection route.
- Added global foundation CSS: surfaces, buttons, spatial nodes, capsules, focus, reduced motion, contrast and responsive reference layout.
- No business data and no authority decisions were added.

## WEB-03 implemented
- Added Next PWA manifest at `apps/web/app/manifest.ts`.
- Added root-scoped service worker at `apps/web/public/sw.js` with offline shell, conservative static caching and explicit exclusion of API/auth/token-bearing requests.
- Added deterministic `/offline` route.
- Added `PwaRuntime` for service-worker registration, update lifecycle, install prompt capture and online/offline/reconnect state.
- Added scalable Allpha SVG and maskable SVG icons.
- Added PWA runtime/offline responsive surfaces to global CSS.
- No offline mutation queue, synthetic business data or new authority layer was introduced.
- Raster 192x192/512x512 icon compatibility remains a WEB-29 PWA Install QA task.

## Reference sequence
1 Splash / Onboarding
2 Identity
3 Universe Home
4 Galaxy / World Navigator
5 World Detail
6 District Selection
7 Realtime District
8 Booth / Tenant
9 Agent Interaction
10 Live Experience
11 Universe Feed / Moments
12 Content Capsule
13 Ask the Content
14 Create Experience
15 Agent Factory
16 My Agent
17 Agent Live Monitor
18 Marketplace
19 Communities
20 Messages & Collaboration
21 Theme Builder
22 Human Control Center
23 Universe Map
24 Mobile Navigation

## Prohibited duplication
No second renderer, Feed/Discovery engine, Recommendation engine, Agent Runtime, AI Gateway, Theme/World/Spatial engine or authority layer.
No fake business data.
Frontend is never authoritative for identity, ownership, permission, policy, risk, approval, billing, payment, entitlement or execution.

## Next
WEB-05 — Universe Shell.
Then WEB-06 Splash + Identity and the remaining progressive UI surfaces.

## Operating mode
READ → UNDERSTAND → INSPECT → RECONCILE REPO + SUPABASE → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT

No phase restart. No Production GREEN claim during CW-02.
