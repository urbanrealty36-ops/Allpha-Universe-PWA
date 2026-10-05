# Public Entry UI/UX Refactor — Splash / Public Universe / Human Identity — 2026-10-05

## Status

IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING

## Reference

The attached reference establishes the visual direction:
1. Splash / Landing — cosmic scene, human character, planet, premium CTA.
2. Public Universe — central Universe/Galaxy, orbiting World nodes, spatial constellation.
3. Human Identity — 3D character/cosmic environment plus glass identity form.

## Implemented

### Splash
- Refactored UniverseSplash into a cinematic mobile-first landing surface.
- Added procedural 3D character + planet scene through the existing React Three Fiber stack.
- Added Allpha branding, Sign In, primary Enter CTA and capability signals.
- Removed synthetic numeric public metrics; only capability labels remain.

### Public Universe
- Existing anonymous Universe entry remains the canonical public state.
- Added a real-time-rendered 3D Universe/Galaxy visual layer.
- Added 3D World nodes and orbiting spatial presentation.
- Existing HTML controls remain authoritative navigation; 3D is decorative/progressive enhancement.

### Human Identity
- Existing UniverseIdentityGateway retained as the canonical Supabase identity boundary.
- Added 3D character/universe visual treatment.
- Sign In / Create Identity remain the same identity flow.
- Google OAuth and email/password remain canonical.
- /auth?mode=signup now opens Create Identity directly.
- No fake Wallet authentication was introduced because no wallet auth contract exists in the current platform.

## Architecture

No new:
- authentication engine
- identity provider
- Agent Runtime
- AI Gateway
- Universe/World renderer
- spatial authority
- database schema
- permission layer

The 3D public visual layer is presentation-only and progressively enhances the existing public/identity flows.

## Asset policy

The provided 25-theme 3D asset pack was inspected. Its manifest identifies WorldGround, District, WorldLandmark, BoothTemplate, AgentCharacterTemplate, PortalGateway, ContentAICapsule and LiveExperienceStage components. This refactor does not fabricate external asset URLs; the public entry visuals use the existing Three/R3F runtime with procedural presentation.

## Railway verification

- Web deployment: edd806f4-5297-4bf3-b895-b6e1178307e3 — SUCCESS
- Web service: @allpha/web — Online 1/1
- API: allpha-api — Online 1/1
- Historical failed deployments before the final CSS fix remain in Railway history; the final deployment is green.

## Validation pending

- Browser/device visual QA
- Authenticated E2E
- Fine-tuning camera/framing against the attached reference on real mobile devices

CW-02 remains OPEN / ACTIVATING / NOT GREEN.
