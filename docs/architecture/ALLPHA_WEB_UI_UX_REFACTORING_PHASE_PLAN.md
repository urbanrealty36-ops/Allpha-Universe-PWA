# Allpha Universe — Full Web App UI/UX Refactoring Phase Plan
## 3D-V2 foundation rebuild

The Web UI track is now explicitly gated by a parallel 3D foundation rebuild so WEB-16 and later spatial experiences do not rely on placeholder V1 geometry.

| Phase | Name | Status |
|---|---|---|
| 3D-V2.01 | Art Direction & Master Visual Language | IMPLEMENTED / FOUNDATION LOCKED / RUNTIME VISUAL QA PENDING |
| 3D-V2.02 | Reference Theme / Golden Scene | IMPLEMENTED / CANONICAL RENDERER INTEGRATED / RUNTIME VISUAL QA PENDING |
| 3D-V2.03 | Geometry & Material Asset Factory | IMPLEMENTED / FACTORY FOUNDATION / RUNTIME VISUAL QA PENDING |
| 3D-V2.04 | Character / Live Character V2 | IMPLEMENTED / CHARACTER V2 FOUNDATION / RUNTIME VISUAL QA PENDING |
| 3D-V2.05 | Universe / Galaxy / Orbit V2 | IMPLEMENTED / SPATIAL COMPOSITION V2 FOUNDATION / RUNTIME VISUAL QA PENDING |
| 3D-V2.06 | World / District / Booth V2 | IMPLEMENTED / SPATIAL HIERARCHY V2 FOUNDATION / RUNTIME VISUAL QA PENDING |
| 3D-V2.07 | Capsule / Content / Feed Universe V2 | ✅ IMPLEMENTATION COMPLETE / TYPECHECK + NEXT BUILD VERIFIED / RAILWAY DEPLOYMENT VERIFIED / RUNTIME VISUAL QA PENDING |
| 3D-V2.08 | Live / Human Live / Stage V2 / Human + AI Collaboration Stage | IMPLEMENTATION COMPLETE / RAILWAY BUILD VERIFICATION IN PROGRESS / RUNTIME VISUAL QA PENDING |
| 3D-V2.09 | **Theme V2 Visual Realization — 25 Themes × 14 Categories × 350 3D Templates** | **IMPLEMENTED / LEGACY GLB REJECTED / REAL 3D GENERATION + REALIZATION DEPLOYED / RUNTIME VISUAL QA PENDING** |
| 3D-V2.10 | **REAL 3D Asset Generation & Realization — 25 × 14 = 350** | **IMPLEMENTED / DEPLOYMENT SUCCESS / NEW REAL THEME-AWARE PROCEDURAL 3D ASSET LAYER ACTIVE / RUNTIME QA PENDING** |
| 3D-V2.11 | Portal / Navigation / Spatial FX V2 | PENDING — BLOCKED UNTIL REAL 3D VISUAL QA |
| 3D-V2.12 | Manifest / Renderer Activation — 350 Theme Asset Activation | PENDING |
| 3D-V2.13 | Mobile Performance + Accessibility | PENDING |
| 3D-V2.14 | Visual QA / Runtime Validation | PENDING |
| 3D-V2.15 | V1 → V2 Canonical Cutover | PENDING |

## 3D-V2.10 implementation record — REAL 3D Asset Generation & Realization

Status: **IMPLEMENTED / REAL 3D THEME-AWARE ASSET LAYER ACTIVE / RUNTIME VISUAL QA PENDING**

Decision:
- The supplied 25-theme GLB pack is classified as **legacy placeholder/blockout** and is no longer accepted as the Theme V2 production visual source.
- The renderer must not fall back to the legacy GLB pack for the public Universe hero.
- Theme V2 now resolves to a deterministic real-geometry realization layer derived from the canonical 25 theme profiles and 14 categories.
- The implementation remains presentation-only and continues through the canonical `AllphaWorldRenderer`; no second renderer or authority engine was introduced.

Implemented:
- `apps/web/components/world/theme-v2-real-3d-asset.tsx`
- legacy `ThemeV2SpatialScene` wrapper now delegates to the real asset layer;
- public Universe 3D hero now directly renders the new real asset layer instead of loading the old placeholder GLB;
- theme-specific spatial motifs for all 25 canonical themes;
- category-aware realization for all 14 canonical categories;
- actual depth composition: foreground/midground/background, landmark clusters, orbit layers, portals, stages, capsules, characters and environment structures;
- theme-specific geometry families including crystalline, pagoda, clockwork, coral, cyber-city, desert/solar, dragon, carnival, rainforest/garden, orbital, heroic, aether, lunar/mars, academy, Jakarta/Tokyo, Nusantara, Atlantis, quantum, savanna, forge and fjord motifs;
- reduced-motion and low-power behavior retained;
- 350 combinations remain deterministic: 25 themes × 14 categories.

Important:
- This phase does **not** claim that the old 25 GLBs were production-ready.
- It also does **not** claim that 350 binary GLB files have been uploaded to Supabase yet.
- The current implementation is the **real 3D generation/realization layer** that can be promoted into the binary asset lifecycle in 3D-V2.12 after runtime QA.

Acceptance gate:
- The Railway screenshot showing a flat wireframe globe is no longer the target.
- V2 is accepted only when the runtime visibly presents genuine spatial geometry and theme identity.
- Browser/device visual QA remains mandatory before GREEN.

## 3D-V2.09 implementation record — Theme V2 visual realization

Status: **IMPLEMENTED VISUAL FOUNDATION / RAILWAY VERIFICATION + RUNTIME VISUAL QA PENDING**

Implemented:
- reusable Theme V2 spatial renderer for Universe / Galaxy / World / District / Booth / Content / Live;
- cinematic orbit rings and depth;
- animated celestial cores and world nodes;
- floating world/district landmarks;
- spatial energy links;
- theme-specific geometry/material/atmosphere derived from the canonical 25-theme design-token profiles;
- 25 × 14 = **350 Theme V2 visual template matrix contract**;
- category-specific spatial grammar and animation vocabulary;
- reduced-motion state-preserving behavior;
- low-power particle/detail reduction;
- public landing/splash/identity 3D scene migrated away from the flat CSS globe/core;
- canonical AllphaWorldRenderer upgraded without introducing a second renderer;
- World / District / Booth spatial layers now receive Theme V2 visual composition before authoritative data overlays;
- Golden Universe / Galaxy / Orbit reference scene upgraded to the same Theme V2 visual language.

Files:
- `apps/web/components/world/theme-v2-spatial-scene.tsx`
- `apps/web/lib/world-engine/theme-v2-visual-matrix.ts`
- `apps/web/components/public-universe-3d.tsx`
- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/components/universe-entry-surface.tsx`
- `docs/audits/THEME_V2_3D_UIUX_REFERENCE_FIDELITY_20261005.md`

### 350-template realization boundary

The repository now has an executable visual template contract for all **350 combinations**. This means the 25 themes × 14 categories are renderable through deterministic Theme V2 spatial composition rules.

This does **not** claim that 350 unique production GLB files have been generated. The supplied 25-theme GLB pack remains an asset-pack source requiring canonical storage/manifest activation before it can be treated as production binary coverage.

### Reference acceptance gate

The attached Allpha UI/UX references are the acceptance direction:
- real 3D depth;
- Universe → Galaxy → World → District spatial hierarchy;
- orbit;
- motion;
- atmosphere;
- theme-specific scene identity;
- mobile-first spatial UI;
- premium dark/glass/luminous interface language.

The old flat Railway appearance is explicitly **not** the V2 acceptance target.

### Validation

- Initial Railway deployment exposed duplicate Live Stage prop declarations introduced in the prior V2.08 integration.
- Duplicate declarations have been removed.
- Latest Railway deployment queue is active; build/deployment settlement is still pending.
- Browser/device visual QA is pending.
- Production GREEN is not claimed.

Next after Theme V2 validation:
**3D-V2.10 — Portal / Navigation / Spatial FX V2**

### 3D-V2.01 record

Canonical art direction: `docs/architecture/ALLPHA_3D_V2_01_ART_DIRECTION_MASTER.md`
Design-token implementation: `packages/design-tokens/3d-visual-language.ts`
Audit: `docs/audits/3D_V2_01_ART_DIRECTION_20261005.md`

3D-V2.01 does not create a second renderer or engine. All final spatial presentation continues through `AllphaWorldRenderer` and the existing authoritative Theme/World/asset lifecycle.

WEB-16 remains implemented as a product surface, but its **V2 visual realization/revalidation is gated on the 3D-V2 asset track**.



Status: CANONICAL PLAN / CW-02.WEB
WEB-01: CLOSED / BASELINE LOCKED
WEB-02: CLOSED / DESIGN SYSTEM FOUNDATION
WEB-03: CLOSED / PWA FOUNDATION
Next: WEB-11 — Booth/Tenant
Canonical repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main

| Phase | Name | Status |
|---|---|---|
| WEB-01 | Baseline & Frontend Reconciliation | CLOSED |
| WEB-02 | Design System Foundation | CLOSED |
| WEB-03 | PWA Foundation | CLOSED |
| WEB-04 | Mobile Navigation | CLOSED |
| WEB-05 | Universe Shell | IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-06 | IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-07 | Universe Home | IMPLEMENTED / BUILD + DEPLOYMENT VERIFICATION PENDING / BROWSER QA PENDING |
| WEB-08 | Galaxy Navigator | IMPLEMENTED / BUILD VERIFICATION PENDING / BROWSER QA PENDING |
| WEB-09 | World Experience | IMPLEMENTED / BUILD VERIFICATION PENDING / BROWSER QA PENDING |
| WEB-10 | District Experience | IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-11 | Booth/Tenant | IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-12 | Agent Experience | IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-13 | Universe Feed / Moments | IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-14 | Content Capsule | IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-15 | Ask the Content | IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFICATION PENDING / BROWSER QA PENDING |
| WEB-16 | Create Experience | IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING |
| WEB-17 | My Agent | PENDING |
| WEB-18 | Agent Live Monitor | PENDING |
| WEB-19 | Marketplace | PENDING |
| WEB-20 | Communities | PENDING |
| WEB-21 | Messages & Collaboration | PENDING |
| WEB-22 | Theme Builder | PENDING |
| WEB-23 | Human Control Center | PENDING |
| WEB-24 | Universe Map | PENDING |
| WEB-25 | 82-Domain Experience Map | PENDING |
| WEB-26 | Responsive Engineering | PENDING |
| WEB-27 | Performance | PENDING |
| WEB-28 | Accessibility | PENDING |
| WEB-29 | PWA Install QA | PENDING |
| WEB-30 | E2E Journeys | PENDING |
| WEB-31 | Security / Authority QA | PENDING |
| WEB-32 | Visual QA | PENDING |
| WEB-33 | Runtime Validation | PENDING |
| WEB-34 | CW-02 Closure Evidence | PENDING |

## WEB-04 implementation contract

- Canonical mobile IA: Universe · Explore · Create · Messages · My Agent.
- One mobile bottom navigation for the existing Web/PWA product.
- 44px touch target, safe-area aware, mobile-only presentation.
- Create opens a presentation-only action sheet; Agent Factory is the currently available creation route. Full Create Experience remains WEB-16.
- Navigation emits UI intent only and never becomes an authority source.

## WEB-02 foundation contract

Experience modes: Ambient / Spatial / Universe / Experience.
Progressive enhancement: 2D → 2.5D → Spatial → 3D.
Mobile-first touch target: 44px minimum.
Core actions remain available without 3D.
Reduced motion, visible focus, safe-area and responsive constants are defined.
UI primitives are presentation-only.

## Non-negotiable architecture rules

No second renderer, Feed/Discovery engine, Recommendation engine, Agent Runtime, AI Gateway, Theme/World/Spatial engine or duplicate authority layer.
No fake business data.
Frontend never decides identity, ownership, permissions, policy, risk, approval, billing, payment, entitlement or execution results.
Railway observations remain controlled runtime observation, not Production GREEN.

## WEB-02 records

Architecture: docs/architecture/ALLPHA_WEB_DESIGN_SYSTEM_FOUNDATION.md
Audit: docs/audits/WEB02_DESIGN_SYSTEM_FOUNDATION_20261005.md
Reference: docs/ux/references/README.md
Continue context: docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md

CW-02 remains OPEN / ACTIVATING / NOT GREEN.


## WEB-04 records

Audit: docs/audits/WEB04_MOBILE_NAVIGATION_20261005.md
Component: apps/web/components/navigation/mobile-navigation.tsx

WEB-04 = CLOSED / MOBILE NAVIGATION IMPLEMENTED
CW-02 remains OPEN / ACTIVATING / NOT GREEN.

## WEB-03 foundation contract

- Installable PWA foundation is part of the existing Web product, not a second application.
- Manifest is generated by Next Metadata Route and uses the canonical `/` scope/start URL.
- One root service worker provides offline shell and static asset caching.
- Network-first navigation falls back to cached navigation or `/offline`.
- API/auth/OAuth/token-bearing requests are excluded from caching; mutations are never replayed offline.
- PWA runtime exposes online/offline state, install prompt availability and explicit update activation.
- Offline mode never becomes an authority source for identity, ownership, permission, policy, risk, approval, billing, payment, entitlement or execution.
- SVG icons are the current scalable foundation; raster 192x192 and 512x512 variants remain a WEB-29 install-QA item.

## WEB-03 records

Architecture: docs/architecture/ALLPHA_WEB_PWA_FOUNDATION.md
Audit: docs/audits/WEB03_PWA_FOUNDATION_20261005.md

WEB-03 = CLOSED / FOUNDATION IMPLEMENTED
CW-02 remains OPEN / ACTIVATING / NOT GREEN.


## WEB-05 records

Audit: `docs/audits/WEB05_UNIVERSE_SHELL_20261005.md`

WEB-05 = IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING.
The implementation is on `main` and preserves the canonical UniverseShell, existing engines and authority boundaries. Railway deployment succeeded for the final WEB-05 commit. Browser/device visual QA and authenticated E2E remain pending.

## WEB-06 implementation contract

- Splash is the public Allpha entry experience and does not make identity or authorization decisions.
- Anonymous entry progresses through Splash → public Universe onboarding → Human Identity Gateway.
- Authenticated users continue directly into the existing Universe product surface.
- Human Identity uses the existing Supabase Auth browser/server boundary; no second authentication engine was introduced.
- Sign-in and sign-up use the existing email/password contract.
- PKCE callback remains the existing callback route and now validates the local `next` redirect.
- Email verification redirects through the existing callback route while preserving a safe local destination.
- Identity UI uses the WEB-02 visual foundation: cinematic/deep-space surfaces, responsive layout, 44px touch targets, focus states and accessible status/error states.
- Frontend does not decide role, ownership, permission, policy, risk, approval, entitlement or Agent authority.
- No business seed data, new schema, RPC, AI Gateway, Agent Runtime, Theme/World engine or renderer was added.

## WEB-06 records

Audit: `docs/audits/WEB06_SPLASH_IDENTITY_20261005.md`
Component: `apps/web/components/identity/universe-identity-experience.tsx`
Entry integration: `apps/web/components/universe-entry-surface.tsx`
Auth route: `apps/web/app/auth/page.tsx`
Callback hardening: `apps/web/app/auth/callback/route.ts`

WEB-06 = IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING.
Railway deployment: `3fae8141-baf4-4f3e-a693-e7d842912236` / commit `3926adcfdd53a37630089cee9ef621632140b1f9` / SUCCESS.
Next canonical product phase: WEB-07 — Universe Home.

CW-02 remains OPEN / ACTIVATING / NOT GREEN.


## WEB-07 implementation contract

- Universe Home is the first authenticated product destination after WEB-06 Identity.
- Mobile-first PWA presentation follows the supplied Allpha Mobile PWA UI/UX concept.
- Header exposes compact Allpha identity, notifications and profile.
- Home discovery tabs are Universe, Live and For You.
- Hero presents the Living Universe concept and routes to existing Universe/Agent surfaces.
- Discovery categories are presentation/navigation affordances only.
- Featured World cards use the existing Theme/World catalog.
- Universe Stream uses the existing Discovery/Home API.
- Live cards use the existing Live Template catalog.
- Agent cards use the existing owner-owned Agent API.
- Spatial counts use existing World/District records.
- 82 domains are exposed as a Feature Constellation entry, not 82 navigation items.
- Progressive enhancement is preserved: Home is fully usable without WebGL/3D.
- Existing UniverseShell and MobileNavigation remain canonical.
- No second renderer, Feed/Discovery engine, Recommendation engine, Agent Runtime, AI Gateway, Theme/World engine or authority layer is introduced.

## WEB-07 records

Audit: `docs/audits/WEB07_UNIVERSE_HOME_20261005.md`
Component: `apps/web/components/universe/universe-home-experience.tsx`
Activation: `apps/web/components/universe-product-experience.tsx`

WEB-07 source implementation is complete. Build/deployment verification, browser/device visual QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-08 — Galaxy Navigator.

CW-02 remains OPEN / ACTIVATING / NOT GREEN.


## WEB-08 implementation contract

- Galaxy Navigator is the spatial discovery layer between Universe Home and World Experience.
- It follows the supplied Mobile PWA concept's Galaxy / World Navigator direction.
- It loads authoritative Galaxies from `/api/v1/universe/galaxies`.
- Selecting a Galaxy loads Worlds through the existing `/api/v1/universe/worlds?galaxy_id=...` contract.
- Search filters currently loaded World records only; it does not create a second search engine.
- Navigator filters are presentation state unless the canonical discovery API later exposes authoritative ranking semantics.
- Spatial preview is progressive 2D/2.5D presentation and does not replace AllphaWorldRenderer.
- World selection delegates into the existing World surface and leaves detailed World Experience to WEB-09.
- No second renderer, Feed/Discovery engine, Recommendation engine, Agent Runtime, AI Gateway, Theme/World engine or authority layer is introduced.

## WEB-08 records

Audit: `docs/audits/WEB08_GALAXY_NAVIGATOR_20261005.md`
Component: `apps/web/components/universe/galaxy-navigator-experience.tsx`
Activation: `apps/web/components/universe-product-experience.tsx`

WEB-08 source implementation is complete. Build verification, browser/device visual QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-09 — World Experience.

CW-02 remains OPEN / ACTIVATING / NOT GREEN.


## WEB-10 implementation contract

WEB-10 upgrades the existing District Experience foundation into the canonical District spatial experience.

Composition:

    Universe → Galaxy → World → District
                                  ├── Zone
                                  ├── Spatial Object
                                  ├── Booth / Tenant
                                  └── Agent Presence

Canonical read contracts:
- GET /api/v1/themes/world-runtime/districts/{district_id}/composition
- GET /api/v1/themes/world-runtime/catalog
- GET /api/v1/districts/{district_id}/spatial-objects
- GET /api/v1/agent-catalog/accounts?district_id={district_id}
- GET /api/v1/universe/worlds/{world_id}

Canonical actions:
- POST /api/v1/districts/{district_id}/join
- POST /api/v1/districts/{district_id}/requests
- POST /api/v1/spatial-runtime/worlds/{world_id}/interactions

WEB-10 reuses the existing AllphaWorldRenderer and validates the published World Scene through the existing scene schema. Verified Booth 3D assets and published Theme 3D assets are used only when authoritative signed URLs are available.

Realtime presentation subscribes to existing spatial tables and reconciles with authoritative polling. Realtime does not grant permission.

The District surface is fully usable without 3D through explicit 2D fallback and core contextual controls.

Implementation:
- Component: apps/web/components/district-experience-surface.tsx
- Route: apps/web/app/districts/[district_id]/page.tsx
- Audit: docs/audits/WEB10_DISTRICT_EXPERIENCE_20261005.md

WEB-10 source implementation is complete. Railway build/deployment, browser/device visual QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-11 — Booth/Tenant.


## WEB-11 implementation contract

WEB-11 activates the Booth/Tenant experience after District Experience.

Composition:

    Universe → Galaxy → World → District → Zone → Booth / Tenant
                                                    ├── Identity
                                                    ├── Branding / Theme
                                                    ├── Spatial 3D
                                                    ├── Marketplace Catalog
                                                    ├── AI Host
                                                    ├── Tenancy / Lease State
                                                    ├── Live Entry metadata
                                                    └── Display Assets / Slots

Canonical read contracts:
- GET /api/v1/booths/{booth_id}
- GET /api/v1/booths/{booth_id}/assets/3d
- GET /api/v1/booths/{booth_id}/slots
- GET /api/v1/booths/{booth_id}/leases
- GET /api/v1/themes/world-runtime/districts/{district_id}/composition
- GET /api/v1/themes/world-runtime/catalog
- GET /api/v1/themes/world-runtime/themes/{theme_id}/asset-manifest
- GET /api/v1/universe/worlds/{world_id}
- GET /api/v1/agent-catalog/accounts?booth_id={booth_id}
- GET /api/v1/marketplace/listings?booth_id={booth_id}

Canonical interaction contract:
- POST /api/v1/spatial-runtime/worlds/{world_id}/interactions

WEB-11 reuses the existing AllphaWorldRenderer and normalizeWorldScene contract. Verified signed Booth 3D assets are presentation inputs only. If no validated scene is available, Booth remains usable through a 2D fallback.

The existing /booths Booth Builder is retained as the management surface. WEB-11 adds the dedicated /booths/{booth_id} spatial/public experience and routes District Booth selections into it.

Marketplace listing data is presentation-only; order/payment remains with the existing Commerce/Marketplace engine. Lease state is displayed from the authoritative Booth tenancy contract.

No new renderer, spatial engine, Agent Runtime, AI Gateway, Commerce engine, billing engine or authority layer is introduced.

Implementation:
- Component: apps/web/components/booth-experience-surface.tsx
- Route: apps/web/app/booths/[booth_id]/page.tsx
- District integration: apps/web/components/district-experience-surface.tsx
- Audit: docs/audits/WEB11_BOOTH_TENANT_20261005.md

WEB-11 source implementation and Railway build/deployment are verified. Browser/device visual QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-12 — Agent Experience.


## WEB-12 implementation contract

WEB-12 is the spatial Agent Experience layer:

    Universe → Galaxy → World → District → Zone → Booth → Agent / Presence
                                                       ├── AI Character
                                                       ├── Agent Space
                                                       ├── Interaction HUD
                                                       ├── Presence
                                                       ├── Conversation
                                                       └── Collaboration / Negotiation

Canonical reads reuse:
- GET /api/v1/agent-catalog/accounts/{agent_id}
- GET /api/v1/universe/worlds/{world_id}
- GET /api/v1/themes/world-runtime/catalog
- GET /api/v1/spatial-runtime/worlds/{world_id}/agents/{agent_id}/context
- GET /api/v1/live/character-runtime-catalog?agent_id={agent_id}

Canonical interaction paths reuse:
- POST /api/v1/spatial-runtime/worlds/{world_id}/interactions
- POST /api/v1/messaging/conversations/agent
- POST /api/v1/messaging/conversations/{conversation_id}/messages

WEB-12 reuses AllphaWorldRenderer. It does not create a second Agent renderer, Agent Runtime, AI Gateway, spatial engine, messaging engine or authority layer.

When a validated World Scene and authoritative Agent spatial state exist, the Agent Character is rendered inside that World context. When they do not exist, the surface uses an explicit 2D orbital fallback and does not fabricate presence or scene state.

Agent navigation from World, District and Booth preserves the existing spatial context so the Agent Experience remains inside the Universe hierarchy.

Audit: docs/audits/WEB12_AGENT_EXPERIENCE_20261005.md

WEB-12 source implementation and Railway build/deployment are verified. Browser/device visual QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-13 — Universe Feed / Moments.


## WEB-13 implementation contract

WEB-13 is the Universe Stream / Moments Galaxy. It is not a conventional 2D social feed.

Target composition:

    Universe Stream
        ↓
    Content Gravity Field
        ├── Content Capsule
        ├── World Context
        ├── Agent Presence
        ├── Discovery Relationship
        └── Live Transition

The surface reuses the canonical Feed engine through `get_feed`, the existing Content Gravity service, Universe World Content placement, Universe Agent Presence, public Agent Account discovery, and Live Session records.

Canonical API composition:
- GET /api/v1/discovery/moments
- POST /api/v1/feed/interactions
- POST /api/v1/discovery/content/{content_id}/ask

The Moments surface exposes:
- Universe Stream
- Content Gravity score and reason signals
- orbital/constellation discovery
- Content Capsule context sheet
- World relationships and direct World transition
- Agent owner/presence relationships and Agent Space transition
- Live transition only when an authoritative Live Session relationship exists
- Ask the Content through the existing AI Gateway/permission boundary
- search over the canonical discovery source

No second Feed, Discovery, Recommendation, Content, AI Gateway, Agent Runtime, World, Spatial or Live engine is introduced. CSS orbital/constellation presentation is UI only and never an authority source.

Implementation:
- apps/web/components/universe/universe-moments-experience.tsx
- apps/web/app/moments/page.tsx
- apps/web/app/globals.css
- apps/api/app/api/discovery.py

Validation:
- @allpha/web deployment d6831e61-7810-41ef-8170-15231d0174af — SUCCESS
- @allpha/api deployment 0a6c2c44-dd3f-4b91-9b98-da0a86b3d9fb — SUCCESS
- Browser/device visual QA and authenticated E2E remain pending.
- CW-02 remains OPEN / ACTIVATING / NOT GREEN.

Next canonical product phase: WEB-14 — Content Capsule.


## WEB-14 implementation contract

WEB-14 is the full Content Capsule / Content Experience surface. It is not a generic article or post page.

Canonical journey:

    Moments Capsule
        ↓
    Content Experience
        ├── Original Content
        ├── AI Summary
        ├── Discussion
        ├── Related Content
        ├── Community
        ├── Agent
        ├── Ask the Content
        ├── Live Experience
        └── World

Implementation:
- Route: /content/{content_id}
- Component: apps/web/components/content/content-capsule-experience.tsx
- Styling: apps/web/components/content/content-capsule-experience.module.css
- Existing API composition: GET /api/v1/discovery/content/{content_id}/evolution
- Existing Ask boundary: POST /api/v1/discovery/content/{content_id}/ask
- Existing Content interaction signal: POST /api/v1/content/{content_id}/events
- Existing Community, Agent, Live and World routes are used for transitions.

The Content Evolution service remains a composition layer over canonical Content, reviewed AI Capsule, Community posts/comments, topic relationships, Universe World Content, Live Sessions and Agent ownership. It does not create a second Content, AI, Community, Recommendation, Feed, Agent Runtime, Live or World engine.

AI Summary is displayed only when an authoritative reviewed ai_capsule exists. The UI never fabricates a summary. Ask uses the existing AI Gateway boundary and never executes Agent actions. Media presentation uses authoritative Content Media references; no unsigned or synthetic asset URL is introduced.

Moments now provides a direct transition from its quick Capsule sheet into the full Content Experience.

WEB-14 source implementation is complete. Railway web/API build and deployment verification is complete. Browser/device visual QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-15 — Ask the Content.

CW-02 remains OPEN / ACTIVATING / NOT GREEN.


## WEB-15 implementation contract

WEB-15 deepens the existing Ask the Content boundary. It does not create a second Q&A, chatbot, RAG, AI Gateway or conversation engine.

Canonical flow:

    Content Capsule
        ↓
    Ask the Content
        ├── Content-grounded question
        ├── existing permission-scoped Content context
        ├── optional existing Agent Memory / Knowledge RAG
        ├── canonical AI Gateway
        └── explicit Agent Runtime handoff only when an action request is supplied

Implementation:
- Route: /content/{content_id}/ask
- Component: apps/web/components/content/ask-content-experience.tsx
- Styling: apps/web/components/content/ask-content-experience.module.css
- Existing Ask endpoint: POST /api/v1/discovery/content/{content_id}/ask
- Existing Content context: GET /api/v1/discovery/content/{content_id}/evolution

The full Ask surface adds:
- Content-bounded question workspace
- grounded answer presentation
- local follow-up turns in the current UI session
- visible grounding signals
- reviewed Content/Topic/Discussion/Community/Agent/World/Live context indicators
- direct transitions back into the Content Experience and Universe relationships
- explicit statement that local follow-up turns do not create a new memory/conversation engine

Backend enhancement:
- Ask response now exposes grounding metadata through the existing service/Gateway boundary.
- Content Evolution now exposes canonical Community, Agent and Ask steps in the Content journey.
- No new database table or migration is required.

Security/authority:
- Content remains permission-scoped server-side.
- Private RAG remains optional and requires an owned Agent plus a real query embedding.
- No embedding is fabricated.
- Vector similarity does not grant authorization.
- Action requests remain handoff-only; Ask never executes Agent actions.
- AI provider/model selection remains inside the canonical AI Gateway.

WEB-15 source implementation is complete. Railway verification, browser/device visual QA and authenticated E2E remain validation gates.

Next canonical phase: WEB-16 — Create Experience.

CW-02 remains OPEN / ACTIVATING / NOT GREEN.


## WEB-16 implementation contract

WEB-16 is the canonical Create Experience entry surface. It is a composition/navigation layer over existing domain creation builders, not a new creation engine.

Canonical flow:

    Create Experience
        ↓
    Intent + Universe Context
        ↓
    Existing Domain Builder
        ├── Agent Factory
        ├── Content Platform
        ├── Live Studio / Runtime Setup
        ├── World Builder
        ├── Theme Builder
        ├── Booth Builder
        ├── Community Surface
        └── Workflow / Mission surfaces

Implementation:
- Route: /create
- Component: apps/web/components/create-experience.tsx
- Existing /create placeholder now delegates to Create Experience; /content remains the Content Platform.
- Create navigation from UniverseShell / UniverseProductExperience now enters /create; desktop and mobile Create converge on the same experience.
- Selected context is carried as navigation state (?context=...) and never grants authority. Agent Factory consumes the context hint when supplied.

Architecture:
- No second Content, Agent, Live, World, Theme, Booth, Community or Workflow engine.
- No new database table, migration, AI Gateway, Agent Runtime, renderer or authority layer.
- Destination builders retain ownership of validation, identity, ownership, permission, moderation, policy, risk, approval and publish/activate behavior.
- No synthetic business records are created by the Create hub.

WEB-16 source implementation is complete. Railway build/deployment verification, browser/device visual QA and authenticated E2E remain validation gates.

CW-02 remains OPEN / ACTIVATING / NOT GREEN.



## 3D-V2 — Theme V2 visual direction lock

The attached UI/UX references define the **visual target** for Theme V2. The current Railway screens are explicitly treated as the **pre-V2 / foundation visual state**, not as the acceptance target.

### Reference-derived acceptance direction
- [ ] Real spatial 3D composition, not a flat hero/globe substitute
- [ ] Universe → Galaxy → World → District spatial hierarchy is visibly understandable
- [ ] Orbital motion / orbit rings / celestial depth are present where appropriate to the theme
- [ ] Worlds are composed as actual 3D scenes: planets, islands, cities, structures, environments and spatial layers
- [ ] Camera has depth, parallax and controlled motion; not a static flat background
- [ ] Theme identity is expressed through geometry, material, lighting, atmosphere, particles and motion
- [ ] UI/UX overlay follows the supplied mobile reference language: premium dark space UI, glass surfaces, luminous accents, compact controls and spatial navigation
- [ ] 350 templates are materially differentiated by theme/category; not 350 color swaps of the same flat scene
- [ ] Each template supports a reusable scene grammar while retaining its own visual identity
- [ ] Animation vocabulary is part of the theme template, not an afterthought
- [ ] Mobile performance and reduced-motion variants are defined per template

### 350-template definition

**25 canonical themes × 14 canonical 3D asset/scene categories = 350 theme templates.**

The existing Asset Factory already provides deterministic recipe foundations. Theme V2 now requires the next realization layer: **actual visual scene composition and asset activation**, including geometry, materials, lighting, camera, orbit, atmosphere, animation and responsive UI composition.

A template is not considered visually realized merely because a recipe key exists.

### V2 acceptance rule

A Phase 3D-V2 visual implementation is not considered complete when the code compiles alone. It must demonstrate the supplied reference quality in the running product: **3D, depth, motion, spatial hierarchy, orbit/world/galaxy composition, and coherent UI/UX integration.**

### Explicit non-goal

Do not advance the project to Portal/Navigation V2 as the primary visual milestone while the Theme V2 scene library is still flat/foundation-only. Portal/navigation is downstream of a credible Theme V2 spatial foundation.

## 3D-V2.02 — Golden Theme / Golden Scene

Status: **IMPLEMENTED / CANONICAL RENDERER INTEGRATED / RUNTIME VISUAL QA PENDING**

Golden Theme: Crystal AI City

Implemented:
- Universe visual layer
- Galaxy visual layer
- Orbit visual layer
- Golden Scene factory
- AllphaWorldRenderer integration
- Galaxy Navigator 3D Golden Scene presentation
- mobile/reduced-motion metadata

Files:
- `apps/web/lib/world-engine/golden-scene.ts`
- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/components/universe/galaxy-navigator-experience.tsx`
- `docs/audits/3D_V2_02_UNIVERSE_GALAXY_ORBIT_20261005.md`

The Golden Scene remains presentation-only. It does not seed or replace authoritative Universe/Galaxy/World records.

## 3D-V2.03 implementation record

3D-V2.03 establishes the deterministic Geometry & Material Asset Factory used to derive theme-aware V2 spatial asset recipes without creating a second runtime or renderer.

Implementation:
- apps/web/lib/world-engine/asset-factory.ts
- packages/design-tokens/package.json export for the existing 3D visual language
- apps/web/lib/world-engine/golden-scene.ts recipe-key binding
- docs/audits/3D_V2_03_GEOMETRY_MATERIAL_FACTORY_20261005.md

Factory contract:
- 25 canonical existing themes
- 14 canonical V2 asset categories
- deterministic theme + category recipe generation
- 350 baseline recipes
- semantic V2 material roles
- mobile part/transparency budgets
- animation vocabulary
- presentation-only boundary
- factory validation gate

The factory does not create GLB binaries, mutate Supabase, issue signed URLs, activate assets, or replace the canonical AllphaWorldRenderer. Production GLB export/validation/storage/manifest activation remain subsequent lifecycle stages.

Next: 3D-V2.04 — Character / Live Character V2.


### 3D-V2.08 implementation checklist
> Note: V2.08 Live/Collaboration is implemented as a runtime capability layer, but the overall Theme V2 visual realization remains open. Its stage must ultimately inherit the realized 3D Theme V2 scene language.

- [x] Live Collaboration Stage V2 presentation contract
- [x] Human presenter stage actor presentation
- [x] AI Agent stage actor presentation
- [x] Human ↔ AI Agent collaboration state visualization
- [x] Existing CharacterAnimationSignal integration preserved
- [x] Existing Live Stage asset binding preserved
- [x] Existing Human Presentation runtime binding preserved
- [x] Existing collaboration consent/risk state consumed as runtime presentation input
- [x] Canonical AllphaWorldRenderer integration
- [x] No second renderer / Live engine / Voice engine / WebRTC engine / Agent Runtime introduced
- [x] Authority boundary preserved
- [ ] Railway build/deployment verification
- [ ] Browser/device runtime visual QA
- [ ] Authenticated E2E Live collaboration QA

Audit: `docs/audits/3D_V2_08_LIVE_HUMAN_AI_COLLABORATION_STAGE_20261005.md`

**Implementation phase is complete. Validation gates remain open until Railway and runtime visual QA are verified.**

### 3D-V2.07 checklist closure
- [x] Content spatial composition contract implemented
- [x] Content Capsule presentation integrated into canonical AllphaWorldRenderer
- [x] Feed/Content authoritative data bound into spatial presentation
- [x] Content Gravity / relationship signals represented without creating new authority
- [x] GoldenSpatialLayerView build blocker reconciled using existing V2.05 contract
- [x] TypeScript verification passed
- [x] Next.js production build passed
- [x] Railway production deployment verified successful
- [ ] Browser/device runtime visual QA
- [ ] Authenticated E2E visual/runtime QA

**Implementation phase is closed. Validation/visual QA remains an explicit downstream gate.**

## 3D-V2.07 implementation record

3D-V2.07 establishes the spatial Content / Feed Universe presentation layer while preserving the existing Content, Feed, Discovery, Content Gravity and Ask contracts.

Implementation:
- `apps/web/lib/world-engine/content-spatial-v2.ts`
- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/components/world/world-experience.tsx`
- `docs/audits/3D_V2_07_CAPSULE_CONTENT_FEED_UNIVERSE_20261005.md`

Implemented:
- spatial Content Capsule presentation;
- Content Gravity field;
- optional authoritative gravity weighting;
- explicit related-content spatial links only when authoritative relationship metadata exists;
- relationship-count presentation signal;
- authoritative World → Content binding;
- mobile/low-power node budget;
- reduced-motion behavior;
- presentation-only validation boundary;
- canonical AllphaWorldRenderer integration;
- GoldenSpatialLayerView reconciliation using the existing V2.05 spatial composition contract.

Architecture boundary:
- no second Content engine;
- no second Feed/Discovery engine;
- no second Gravity engine;
- no second renderer;
- no AI Gateway or Agent Runtime duplication;
- no authority, permission, policy, risk, approval, billing or ownership decisions in the spatial layer;
- no synthetic Content records.

Validation status:
- implementation committed to `main`;
- Railway verification deployment triggered;
- TypeScript check and Next.js production build verified on Railway; deployment settlement remains pending at record update time;
- browser/device visual QA pending;
- authenticated E2E pending;
- Production GREEN not claimed.

Next: **3D-V2.08 — Live / Human Live / Stage V2**.



## 3D-V2.04 implementation record

3D-V2.04 upgrades the existing Character / Live Character presentation contract.

Implementation:
- apps/web/lib/live-character-v2.ts
- apps/web/components/world/allpha-world-renderer.tsx
- docs/audits/3D_V2_04_CHARACTER_LIVE_V2_20261005.md

The existing CharacterAnimationSignal remains canonical. The existing Live Character Runtime catalog remains canonical. AllphaWorldRenderer remains the only spatial renderer.

Character V2 adds:
- 25-theme-aware character profiles
- theme-specific silhouette and wardrobe/material language
- face, gaze and viseme capability contract
- canonical live animation states/intents
- mobile performance budget
- reduced-motion semantic fallback
- richer procedural/reference character presentation

When an authoritative GLB character exists, the existing GLB path remains preferred. Procedural Character V2 is the presentation/reference fallback.

Status: IMPLEMENTED / CHARACTER V2 FOUNDATION / RUNTIME VISUAL QA PENDING

Next: 3D-V2.05 — Universe / Galaxy / Orbit V2.
