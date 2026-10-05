# Allpha Universe — UI/UX Architecture V2

Status: CANONICAL UI/UX TARGET FOR CW-02.WEB
Baseline: 2026-10-05

## 1. Product model

Allpha Web is an AI Social Universe delivered as:
- Mobile-First PWA
- Responsive Desktop Web App
- Progressive spatial/3D experience

The Web layer is a presentation and interaction layer over canonical FastAPI/Supabase/engine contracts.

## 2. Experience modes

### Ambient
Premium 2D UI with cinematic depth and subtle spatial effects.

Use for:
- onboarding
- home
- settings
- control center
- messaging
- commerce confirmation

### Spatial
2.5D visual navigation.

Use for:
- discovery
- content gravity
- Moments
- communities
- agent discovery
- world navigation

### Universe
Canonical 3D spatial experience.

Use for:
- Galaxy
- World
- District
- Zone
- Booth
- Agent presence

### Experience
Immersive presentation.

Use for:
- Live
- AI Character
- AI Capsule
- collaborative experience
- spatial commerce
- live stage

## 3. Shell

Canonical target:

    UniverseShell
    ├── UniverseTopBar
    ├── DesktopNavigation
    ├── MobileNavigation
    ├── UniverseCanvas
    ├── UniverseOverlay
    ├── UniverseContextDock
    └── UniverseCommandBar

This is UI composition, not a new engine.

## 4. Responsive contract

### Mobile
- fullscreen canvas
- bottom navigation
- bottom sheets
- touch-first controls
- compact contextual overlays
- progressive 2D → 2.5D → 3D

### Tablet
- split panels where useful
- spatial cards
- overlay context

### Desktop
- optional left navigation
- central Universe canvas
- contextual right rail
- command/search surface

### Large desktop
- expanded spatial canvas
- multi-panel context
- optional immersive experience mode

## 5. Core UI primitives

Universe:
- Node
- Orbit
- Constellation
- Field
- Portal
- Beacon
- Trail
- Capsule
- Sphere
- Gateway

Product:
- World Card
- District Card
- Booth View
- Agent Presence
- Agent Passport
- Content Capsule
- Ask Content
- Live Experience
- Community Card
- Marketplace Card
- Command Bar
- Context Sheet
- Spatial Modal
- Bottom Sheet

## 6. Navigation model

Mobile:
Universe → Explore → Create → Messages → My Agent

Desktop:
Universe → Social → Explore → Communities → Create → Missions → Marketplace → My Agent

Global:
Search / Notifications / Profile / Command Center

## 7. Content model

Content is presented as a Content Capsule rather than a conventional social-media post.

Target evolution:

    Original
      ↓
    AI Summary
      ↓
    Discussion
      ↓
    Community
      ↓
    Related Content
      ↓
    Live Experience
      ↓
    World

Ask the Content receives contextual input:

    Content
    + Creator
    + Agent
    + World
    + User Context
    + Permission

The request then uses the existing AI Gateway/Agent Runtime path.

## 8. Universe Scroll

Universe Scroll is the primary discovery interaction.

It should allow:
- vertical content movement;
- related content exploration;
- orbital/constellation relationships;
- World transitions;
- Agent discovery;
- Community discovery;
- Live discovery.

It must use the existing Feed/Discovery/Recommendation contracts.

## 9. Spatial hierarchy

    Universe
      ↓
    Galaxy
      ↓
    World
      ↓
    District
      ↓
    Zone
      ↓
    Booth/Tenant
      ↓
    Agent / Presence
      ↓
    Content / Capsule
      ↓
    Live / Experience

## 10. Canonical renderer

All 3D presentation must converge on the existing:
AllphaWorldRenderer

No second renderer is permitted.

## 11. Authority boundary

Frontend can:
- render state;
- request actions;
- optimistically animate presentation;
- display pending state.

Frontend cannot authoritatively decide:
- identity;
- ownership;
- permissions;
- policy;
- risk;
- approval;
- transaction amount;
- payment status;
- entitlement;
- billing state;
- Agent execution result;
- audit result.

## 12. PWA contract

Required:
- web manifest;
- icons;
- installable standalone experience;
- service worker/offline shell;
- update lifecycle;
- online/offline/reconnect states;
- safe handling of server-required operations;
- accessible install guidance.

Offline must never fabricate successful server operations.

## 13. Accessibility

Required:
- semantic HTML;
- keyboard navigation;
- focus states;
- accessible labels;
- contrast;
- reduced motion;
- screen reader support;
- touch targets;
- explicit error/loading/offline states;
- status not communicated by color alone.

## 14. Performance

Progressive enhancement:

    2D
     ↓
    2.5D
     ↓
    Spatial
     ↓
    3D

Heavy modules are lazy-loaded:
- 3D renderer;
- video/live;
- maps;
- high-resolution media;
- immersive assets.

## 15. 82-domain presentation rule

The 82 domains are not 82 navigation items and not 82 engines.

They appear as capabilities and behaviors grouped into:
- Identity & Graph
- Content & Discovery
- Social & Collaboration
- Commerce & Economy
- Universe & Spatial
- Governance & Trust
- Platform & Operations

## 16. Implementation principle

Refactor existing surfaces incrementally. Do not replace working canonical engines merely to achieve a visual redesign.

Every increment must follow:

READ → UNDERSTAND → INSPECT → RECONCILE → IMPLEMENT → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT


## 17. WEB-06 — Splash + Identity activation

WEB-06 activates the public entry and existing Human Identity Gateway without creating a second identity/authentication architecture.

Canonical entry:

    Splash
      ↓
    Public Allpha Onboarding
      ↓
    Human Identity Gateway
      ↓
    Existing Supabase Auth
      ↓
    Authenticated Universe

### Presentation rules

- Splash is presentation-only.
- Public onboarding communicates the product model: Humans & AI Agents — A Shared Universe.
- Identity Gateway supports the existing email/password sign-in and sign-up contract.
- Authenticated sessions enter the existing Universe product surface.
- Email verification uses the existing PKCE callback path.
- Callback destinations must be constrained to local same-origin paths.
- Identity UI uses the existing WEB-02 design foundation and remains mobile-first.
- Loading, error and verification states are explicit.
- Interactive controls target at least 44px.
- Focus-visible states remain available for keyboard users.

### Authority rules

WEB-06 does not decide:
- identity authority;
- platform role;
- ownership;
- permissions;
- policy;
- risk;
- approval;
- entitlement;
- Agent authority.

Supabase Auth and the existing server-side authorization foundation remain canonical.

### Implementation records

- Component: `apps/web/components/identity/universe-identity-experience.tsx`
- Entry integration: `apps/web/components/universe-entry-surface.tsx`
- Auth route: `apps/web/app/auth/page.tsx`
- Callback: `apps/web/app/auth/callback/route.ts`
- Audit: `docs/audits/WEB06_SPLASH_IDENTITY_20261005.md`

WEB-06 source implementation is complete. Browser/device QA and authenticated E2E remain validation gates; CW-02 is not Production GREEN.


## 18. WEB-07 — Universe Home activation

WEB-07 is the authenticated Universe Home layer immediately after WEB-06 Identity.

### Home composition

    UniverseShell
      ↓
    Universe Home
      ├── Compact Identity Header
      ├── Universe / Live / For You
      ├── Living Universe Hero
      ├── Discovery Categories
      ├── Featured Worlds
      ├── Universe Stream
      ├── Live Experiences
      ├── Agent Presence
      ├── Spatial Summary
      └── 82-Domain Feature Constellation

### Data contracts

The Home surface reuses the existing canonical product calls:
- Theme / World Runtime catalog
- Discovery Home
- Live Template catalog
- My Agents
- Galaxy → World → District discovery

No Home-specific duplicate data authority is introduced.

### Visual contract

WEB-07 follows the supplied Allpha Mobile PWA UI/UX concept:
- premium cinematic dark surface;
- cyan / blue / violet spatial glow;
- compact mobile chrome;
- Universe / Live / For You tabs;
- world/category discovery;
- AI Agent presence;
- progressive spatial visual language.

### Progressive enhancement

Home is fully usable without WebGL/3D. Spatial visuals are presentation enhancement only. The canonical AllphaWorldRenderer remains the only renderer for actual 3D experiences in later spatial phases.

### Authority

Home renders server-derived state and emits navigation/action intent. It does not decide identity, ownership, permission, policy, risk, approval, entitlement, billing, payment or Agent execution results.

### Implementation record

- Component: `apps/web/components/universe/universe-home-experience.tsx`
- Activation: `apps/web/components/universe-product-experience.tsx`
- Audit: `docs/audits/WEB07_UNIVERSE_HOME_20261005.md`

WEB-07 source implementation is complete. Browser/device visual QA and authenticated E2E remain validation gates. CW-02 is not Production GREEN.


## 19. WEB-08 — Galaxy Navigator activation

WEB-08 is the spatial discovery layer after Universe Home and before World Experience.

### Composition

    UniverseShell
      ↓
    Galaxy Navigator
      ├── Navigator Header
      ├── Search
      ├── All / Trending / Popular / New presentation controls
      ├── 2D Orbital Galaxy Preview
      ├── Galaxy Selection
      ├── World Discovery
      └── Spatial Chain Context

### Canonical data

    /api/v1/universe/galaxies
             ↓
    selected galaxy
             ↓
    /api/v1/universe/worlds?galaxy_id=...
             ↓
    World cards
             ↓
    existing World surface

No duplicate Galaxy/World authority is created.

### Progressive spatial behavior

The Navigator is usable as 2D UI first and may progressively enhance toward 2.5D/3D. It does not introduce a renderer. Actual canonical 3D presentation continues to converge on AllphaWorldRenderer.

### Authority

The frontend may select a Galaxy or World for navigation, but it cannot decide ownership, permission, entitlement, policy, risk, approval or execution authority.

### Implementation record

- Component: `apps/web/components/universe/galaxy-navigator-experience.tsx`
- Activation: `apps/web/components/universe-product-experience.tsx`
- Audit: `docs/audits/WEB08_GALAXY_NAVIGATOR_20261005.md`

WEB-08 source implementation is complete. Build verification and browser/device QA remain validation gates. CW-02 is not Production GREEN.

## 20. WEB-09 — World Experience activation

WEB-09 is the World Detail / World Experience layer after Galaxy Navigator and before District Experience.

Canonical data contracts:
- GET /api/v1/universe/worlds/{world_id}
- GET /api/v1/districts?world_id={world_id}
- GET /api/v1/universe/worlds/{world_id}/agents
- GET /api/v1/universe/worlds/{world_id}/content
- GET /api/v1/universe/worlds/{world_id}/portals
- GET /api/v1/universe/worlds/{world_id}/presence
- GET /api/v1/themes/world-runtime/catalog

The World Experience presents World identity, description, Enter World, Districts / People / Live / Content tabs, authoritative linked-record counts, and the existing AllphaWorldRenderer when a published Theme world schema is available.

Enter World uses the existing POST /api/v1/universe/worlds/{world_id}/join contract. Frontend state changes only after successful server acceptance.

No second renderer, discovery engine, recommendation engine, authority layer, Theme/World engine, Agent Runtime or AI Gateway is introduced.

Implementation:
- Component: apps/web/components/world/world-experience.tsx
- Route: apps/web/app/world/page.tsx
- Audit: docs/audits/WEB09_WORLD_EXPERIENCE_20261005.md

WEB-09 source implementation is complete. Build/deployment verification, browser/device QA and authenticated E2E remain validation gates. CW-02 is not Production GREEN.

Next canonical product phase: WEB-10 — District Experience.


## 21. WEB-10 — District Experience activation

WEB-10 is the canonical District spatial experience after World Experience and before Booth/Tenant.

### Composition

    World
      ↓
    District
      ├── Zone
      ├── Spatial Object
      ├── Booth / Tenant
      └── Agent Presence

### Experience

The District surface presents:
- District identity and World context
- type / visibility
- realtime state
- Zone discovery
- Booth / Tenant discovery
- Agent Presence
- spatial object discovery
- District metrics
- Enter District
- access request
- Agent interaction
- responsive context sheets

### Canonical contracts

Read:
- GET /api/v1/themes/world-runtime/districts/{district_id}/composition
- GET /api/v1/themes/world-runtime/catalog
- GET /api/v1/districts/{district_id}/spatial-objects
- GET /api/v1/agent-catalog/accounts?district_id={district_id}
- GET /api/v1/universe/worlds/{world_id}

Action:
- POST /api/v1/districts/{district_id}/join
- POST /api/v1/districts/{district_id}/requests
- POST /api/v1/spatial-runtime/worlds/{world_id}/interactions

### Spatial rules

- Existing `AllphaWorldRenderer` remains canonical.
- Existing `normalizeWorldScene` validates the published scene before 3D rendering.
- Verified signed Booth 3D assets may be rendered through existing renderer support.
- Published Theme 3D assets may be resolved through the existing World Runtime asset manifest.
- If no validated scene exists, District remains usable through a 2D fallback.
- Realtime presence is display state only and never grants authority.
- Core actions remain available without WebGL.

### Authority

The District surface never decides identity, ownership, permissions, policy, risk, approval, billing, payment, entitlement or Agent execution result.

### Implementation

- Component: `apps/web/components/district-experience-surface.tsx`
- Route: `apps/web/app/districts/[district_id]/page.tsx`
- Audit: `docs/audits/WEB10_DISTRICT_EXPERIENCE_20261005.md`

WEB-10 source implementation is complete. Build/deployment, browser/device QA and authenticated E2E remain validation gates. CW-02 is not Production GREEN.

Next canonical product phase: WEB-11 — Booth/Tenant.


## 22. WEB-11 — Booth / Tenant Experience activation

WEB-11 is the Booth/Tenant experience immediately after District Experience.

### Composition

    Universe
      ↓
    Galaxy
      ↓
    World
      ↓
    District
      ↓
    Zone
      ↓
    Booth / Tenant
      ├── Identity
      ├── Branding / Theme
      ├── Spatial presentation
      ├── Marketplace catalog
      ├── AI Host
      ├── Tenancy / Lease state
      ├── Display Assets / Slots
      └── Live Entry metadata

### Canonical contracts

The Web surface reuses existing FastAPI/Supabase contracts:
- Booth detail
- Booth verified 3D assets
- Booth display slots
- Booth leases
- District composition
- Theme catalog / Theme asset manifest
- World context
- Agent Account discovery by Booth
- Marketplace listing discovery by Booth
- Spatial Runtime interaction

No Booth-specific authority is recreated in the Web layer.

### Spatial rules

- AllphaWorldRenderer remains the only canonical renderer.
- normalizeWorldScene remains the validation boundary for the published Theme/World scene.
- Booth GLB presentation is allowed only from the existing signed 3D asset contract.
- Theme 3D assets are resolved through the existing World Runtime asset manifest.
- Missing/invalid scene falls back to a fully usable 2D Booth experience.
- Realtime updates are reconciliation/presentation only.

### Agent rules

The Booth AI Host is an existing Agent Account reference. WEB-11 may present the public Agent Account and emit conversation/collaboration/shopping/negotiation intent through the existing Spatial Runtime interaction contract.

WEB-11 does not grant Agent authority or execute Agent work directly.

### Commerce and tenancy rules

Marketplace listings are rendered from the existing Commerce/Marketplace read contract. WEB-11 does not calculate prices, create payment state or execute orders.

Lease records are rendered from the existing Booth tenancy contract. Browser presentation does not decide entitlement, ownership, billing or lease activation.

### Web IA

- District Booth selection → /booths/{booth_id}
- /booths remains the existing Booth Builder / management workflow.
- /booths/{booth_id} is the canonical spatial Booth/Tenant experience.

### Implementation records

- Component: apps/web/components/booth-experience-surface.tsx
- Route: apps/web/app/booths/[booth_id]/page.tsx
- District integration: apps/web/components/district-experience-surface.tsx
- Audit: docs/audits/WEB11_BOOTH_TENANT_20261005.md

WEB-11 source implementation and Railway build/deployment are verified. Browser/device visual QA and authenticated E2E remain validation gates. CW-02 is not Production GREEN.


## 17. WEB-12 Agent Experience activation

Agent is an in-Universe spatial entity, not only a profile page.

Target composition:

    Agent Space
    ├── AI Character
    ├── Presence HUD
    ├── Spatial context
    ├── Agent Passport
    ├── Skills / capabilities
    ├── Conversation
    └── Collaboration / Negotiation

The Agent surface reuses the existing AllphaWorldRenderer when a validated World Scene and authoritative spatial state are available. Character presentation reuses the existing Live Character Runtime catalog. Absence of a validated scene or presence state is shown explicitly through progressive fallback.

Agent actions remain presentation intents. Conversation uses the existing Messaging contracts; collaboration and negotiation use the existing Spatial Runtime boundary. No new Agent Runtime, renderer, messaging engine, spatial engine or authority layer is introduced.

WEB-12 implementation:
- apps/web/components/agent-experience-surface.tsx
- apps/web/app/agents/[agent_id]/page.tsx
- docs/audits/WEB12_AGENT_EXPERIENCE_20261005.md

Railway build/deployment verified. Browser/device visual QA and authenticated E2E remain pending.


## 18. WEB-13 Universe Stream / Moments Galaxy activation

WEB-13 is the Spatial discovery presentation of Content.

    Content Capsule
        ├── Gravity
        ├── World Context
        ├── Agent Presence
        ├── Discovery Relationship
        └── Live Transition

The Web surface is backed by the existing Feed engine and Content Gravity service. The new `/api/v1/discovery/moments` route is a composition/presentation contract; it does not create a second Feed or Discovery engine.

Spatial presentation is CSS/UI only:
- orbit distance follows the authoritative Gravity score;
- constellation nodes represent returned Content, World and Agent records;
- presence is read-only presentation;
- Live transition navigates only to an existing authoritative Live Session;
- Content Capsule context can hand off to existing Ask the Content.

Canonical implementation:
- `apps/web/components/universe/universe-moments-experience.tsx`
- `apps/web/app/moments/page.tsx`
- `apps/api/app/api/discovery.py`
- `docs/audits/WEB13_UNIVERSE_MOMENTS_20261005.md`

No new renderer, recommendation engine, spatial engine, Feed engine, AI Gateway or authority layer is introduced.

## WEB-14 — Content Capsule / Content Experience

The Content Capsule is the canonical presentation boundary between Universe Moments and the broader Content ecosystem.

Moments Capsule → Content Experience → AI Summary → Discussion → Related Content → Community → Agent → Ask → Live → World

The surface composes existing authoritative domains:
- Content Items / Content Media / Content Topics
- reviewed AI Capsules
- Community Posts / Comments / Communities
- topic-based related Content
- Universe World Content placement
- Live Sessions
- owned/public Agent identity
- existing Ask the Content → AI Gateway boundary

No new Content engine, summary engine, recommendation engine, community engine, Agent Runtime, AI Gateway, Live engine or World engine is introduced.

The UI owns presentation state only. It does not infer publication, permission, ownership, entitlement, Agent authority, Live state or World access. Empty and unavailable relationship states remain explicit. AI summaries are shown only from reviewed ai_capsules; Ask uses the existing permission-scoped Content + AI Gateway path.

Implementation:
- apps/web/app/content/[content_id]/page.tsx
- apps/web/components/content/content-capsule-experience.tsx
- apps/web/components/content/content-capsule-experience.module.css
- apps/api/app/services/content_evolution.py

WEB-14 remains subject to Railway build/deployment verification, browser/device visual QA and authenticated E2E.
