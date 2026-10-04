# CW-02 — Web App Universe Entry & Authenticated UX Activation
Date: 2026-10-04
Status: IMPLEMENTED / RUNTIME DEPLOYMENT OBSERVATION ACTIVE / NOT GREEN
Parent wave: CW-02 — Agent + Content Activation

## Objective
Activate the existing canonical Allpha Universe experience as the Web App entry surface without creating a second Universe renderer, identity system, API, or authority boundary.

## Canonical reconciliation
- Root Web App `/` previously rendered a landing-only placeholder.
- Existing canonical Universe experience is `ImmersiveUniverseShell` at `/universe`.
- Supabase-backed Universe API endpoints require authenticated context.
- Therefore the correct boundary is:
  - unauthenticated: Universe-first public entry / identity gateway CTA;
  - authenticated: existing canonical `ImmersiveUniverseShell`;
  - authentication remains Supabase Auth;
  - authorization and ownership remain server-side.

## Implemented
1. Added `apps/web/components/universe-entry-surface.tsx`.
   - Detects the existing Supabase browser session.
   - Anonymous users receive a Universe-first spatial entry experience rather than a login-first screen.
   - Authenticated users are passed directly into the existing `ImmersiveUniverseShell`.
   - Authenticated chrome exposes existing Profile and Agents surfaces plus sign-out.
   - No business data, Agent, Content, or mock identity is fabricated.
2. Replaced `apps/web/app/page.tsx` with the canonical Universe entry surface.
3. Replaced `apps/web/app/universe/page.tsx` with the same canonical entry surface so direct navigation and root navigation do not diverge.
4. Updated `apps/web/app/auth/page.tsx`.
   - Auth remains Supabase Auth.
   - Safe `next` return path is supported.
   - Sign-in/sign-up returns to the requested Universe route.
   - Auth UI is presented as an identity gateway, not the primary Web App experience.
5. Removed the visible `E2E Setup` link from the user-facing `/universe` page.
   - The E2E route/tooling remains available for QA; it is not exposed as production navigation.
6. Existing canonical Universe traversal remains unchanged:
   `Galaxy → World → District → Booth → Theme/3D → Agent Presence → Content/Portal`.

## Deployment evidence
Railway @allpha/web accepted the changes and the CW-02 build sequence reached successful Next.js compilation on the first completed in-flight build:
- Next.js 16.3.8 / Turbopack build passed.
- TypeScript check passed.
- Static generation completed.
- No dynamic route collision remained.
- GET / on the currently serving deployment returned HTTP 200.
- The latest Universe-entry commits were queued for sequential deployment observation.

## Security / authority boundary
- No new authorization engine.
- No new identity engine.
- No service-role usage in browser.
- No OpenAI credential in Web App.
- Browser API calls continue to obtain the authenticated Supabase access token through the existing browser client and send it to the canonical FastAPI API.
- Supabase Auth session refresh remains handled by the existing Next.js proxy.

## Remaining runtime boundary
This implementation proves Web App routing/build/deployment readiness, but does not by itself prove:
- a real browser-authenticated session through Railway;
- real Agent creation;
- real Agent Runtime planner/provider execution;
- real AI Gateway provider execution;
- Storage/moderation E2E;
- final CW-02 GREEN.

## Conclusion
The Web App entry/UX gap is implemented without architecture expansion. CW-02 remains OPEN until the remaining authenticated runtime, Agent, Content, Storage/Moderation, and final evidence gates are executed.
