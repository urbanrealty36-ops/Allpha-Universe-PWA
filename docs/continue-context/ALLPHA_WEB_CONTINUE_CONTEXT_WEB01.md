# Allpha Universe — Web Continue Context — WEB-01

This file is the continuation anchor for future Web UI/UX implementation work.

## Canonical binding
- Repository: urbanrealty36-ops/Allpha-Universe-PWA
- Branch: main
- Supabase: AllphaDb-Universe / qltbacemtvnuzqkterly
- Railway Web: @allpha/web
- Canonical renderer: AllphaWorldRenderer
- Current wave: CW-02
- Current frontend track: CW-02.WEB
- WEB-01 status: CLOSED / BASELINE LOCKED
- CW-02 status: OPEN / ACTIVATING / NOT GREEN

## Product contract
Allpha Web is Mobile-First PWA first, then responsive Desktop Web. The desktop experience is an expansion of the same product model, not a separate application.

Target experience:
Humans & AI Agents — A Shared Universe

Experience modes:
1. Ambient
2. Spatial
3. Universe
4. Experience

Spatial hierarchy:
Universe → Galaxy → World → District → Zone → Booth/Tenant → Agent/Presence → Content/Capsule → Live/Experience

## Reference screens
The supplied visual reference establishes the target product sequence:
1. Splash / Onboarding
2. Sign Up / Identity
3. Universe Home
4. Galaxy / World Navigator
5. World Detail
6. District Selection
7. District View / Realtime
8. Booth / Tenant
9. Agent Interaction
10. Live Experience
11. Universe Feed / Moments
12. Content Capsule
13. Ask the Content
14. Create Experience
15. Agent Factory
16. My Agent
17. Agent Live Monitor
18. Marketplace
19. Communities
20. Messages & Collaboration
21. Theme Builder
22. Human Control Center
23. Universe Map
24. Mobile Navigation

The visual is a design reference. Backend truth remains FastAPI/Supabase and canonical engines.

## Current implementation foundation
Already present:
- UniverseEntrySurface
- UniverseProductExperience
- ImmersiveUniverseShell
- AllphaWorldRenderer
- DistrictExperienceSurface
- District route
- Theme/World runtime catalog integration
- Discovery integration
- Live template integration
- Agent list integration
- Realtime District presence foundation
- Booth and Agent interaction foundation
- existing Agent, Content, Feed, Messaging, Community, Marketplace, Theme, Live and Governance surfaces

## WEB-01 findings
The repository already contains a broad Web product surface. The primary problem is composition, responsive realization and PWA consistency, not missing engines.

Required refactor:
- consolidate into a shared UniverseShell;
- establish Mobile First responsive contract;
- add PWA contract;
- compose 2D/2.5D/3D under explicit experience modes;
- progressively migrate existing vertical surfaces;
- preserve routes during migration;
- reuse canonical engines/APIs.

## Prohibited changes
Do not introduce:
- second renderer;
- second Feed/Discovery engine;
- second Recommendation engine;
- second Agent Runtime;
- second AI Gateway;
- second Theme/World/Spatial engine;
- fake business data;
- frontend authority for ownership, permission, policy, risk, approval, billing, payment or execution.

## Next implementation
WEB-02 — Design System Foundation.

Then:
WEB-03 PWA Foundation
WEB-04 Mobile Navigation
WEB-05 Universe Shell
WEB-06 Splash + Identity
WEB-07 Universe Home
WEB-08 Galaxy Navigator
WEB-09 World Experience
WEB-10 District Experience refinement
WEB-11 Booth/Tenant
WEB-12 Agent Experience
WEB-13 Universe Feed / Moments
WEB-14 Content Capsule
WEB-15 Ask the Content
WEB-16 Create Experience
WEB-17 My Agent
WEB-18 Agent Live Monitor
WEB-19 Marketplace
WEB-20 Communities
WEB-21 Messages
WEB-22 Theme Builder
WEB-23 Human Control Center
WEB-24 Universe Map
WEB-25 82-Domain Experience Map
WEB-26 Responsive Engineering
WEB-27 Performance
WEB-28 Accessibility
WEB-29 PWA Install QA
WEB-30 E2E
WEB-31 Security/Authority QA
WEB-32 Visual QA
WEB-33 Runtime Validation
WEB-34 CW-02 Closure Evidence

## Operating mode
READ → UNDERSTAND → INSPECT → RECONCILE REPO + SUPABASE → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT

No phase restart. No Production GREEN claim during CW-02.
