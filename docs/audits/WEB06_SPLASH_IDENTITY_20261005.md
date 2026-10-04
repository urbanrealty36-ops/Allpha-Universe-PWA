# WEB-06 — Splash + Identity Implementation Audit

Date: 2026-10-05
Status: IMPLEMENTED / BUILD + DEPLOYMENT VERIFICATION PENDING / BROWSER QA PENDING
Wave: CW-02.WEB
Previous: WEB-05
Next: WEB-07 — Universe Home

## Scope

WEB-06 activates the first-run/public Allpha entry journey and the existing Human Identity Gateway without creating a second authentication or authority system.

Target experience:

```
Splash
  ↓
Allpha Onboarding
  ↓
Human Identity Gateway
  ↓
Supabase Auth
  ↓
Authenticated Universe
```

The reference sequence is aligned to the canonical UI/UX reference flow:
1. Splash / Onboarding
2. Identity
3. Universe Home

## Implemented

- Added `apps/web/components/identity/universe-identity-experience.tsx`.
- Added cinematic Allpha Splash presentation with Universe visual language.
- Added public onboarding surface with explicit Get Started and Sign In actions.
- Added responsive Human Identity Gateway for:
  - Sign In
  - Create Human Identity
  - email/password authentication
  - email verification feedback
  - authenticated redirect
  - explicit error/status states
- Added 44px minimum interactive controls and visible focus states.
- Added mobile-first responsive layout with desktop expansion.
- Added `Suspense` loading boundary to the auth route.
- Authenticated users bypass the anonymous splash and continue into the existing Universe product surface.
- Preserved existing Supabase browser/server client boundary.
- Preserved existing Supabase Auth email/password contract.
- Preserved existing PKCE callback exchange.
- Hardened `apps/web/app/auth/callback/route.ts` so `next` accepts only local paths and cannot become an external/open redirect.
- Sign-up email verification preserves the requested local destination through the existing callback route.

## Architecture / Authority

No new:
- authentication engine;
- identity provider abstraction;
- database schema;
- migration;
- RPC;
- API contract;
- Agent Runtime;
- AI Gateway;
- Theme/World engine;
- spatial engine;
- renderer;
- authorization engine;
- authority layer.

The existing Phase 05 identity/authentication foundation remains canonical.

Frontend only:
- presents identity UI;
- invokes existing Supabase Auth operations;
- displays authenticated state;
- navigates after successful authentication.

Frontend does not decide:
- role;
- ownership;
- permission;
- policy;
- risk;
- approval;
- entitlement;
- Agent authority;
- execution result.

## Security

- Callback destination is constrained to a same-origin local path.
- No service-role credential is introduced into browser code.
- No client-side role or ownership decision is introduced.
- No synthetic user or business seed data is created.
- Password input uses appropriate browser autocomplete semantics.
- Authentication errors are rendered as explicit user-visible status/alert states.

## Visual direction

The implementation follows the existing WEB-02 / UI/UX V2 direction:
- cinematic;
- deep-space base;
- restrained cyan/blue/violet;
- translucent surfaces;
- spatial/orbital visual language;
- minimal chrome;
- mobile-first;
- progressive experience rather than a generic SaaS login page.

The Splash is presentation-only. It does not imply that the browser owns Universe authority.

## Validation

Code-level reconciliation completed against:
- `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`
- `docs/architecture/ALLPHA_WEB_UI_UX_ARCHITECTURE_V2.md`
- `docs/database/PHASE_05_IDENTITY_AUTHORIZATION.md`
- `docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md`
- existing `apps/web/app/auth/*`
- existing `apps/web/lib/supabase/*`
- existing `apps/web/components/universe-entry-surface.tsx`

Build/deployment verification must be completed against the canonical Railway Web service after these commits.

Browser/device visual QA and authenticated E2E cannot be claimed from code inspection alone and remain pending.

## Completion classification

WEB-06 is **IMPLEMENTED** at source level.

It is **not Production GREEN**.

It should advance to WEB-07 after:
1. Railway build/deployment succeeds for the final WEB-06 commit.
2. Browser/device visual QA is performed.
3. Authenticated E2E is performed when test credentials/session are available.

CW-02 remains OPEN / ACTIVATING / NOT GREEN.
