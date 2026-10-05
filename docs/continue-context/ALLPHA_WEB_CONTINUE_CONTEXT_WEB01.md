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
- WEB-05: IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING
- WEB-06: IMPLEMENTED / BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING
- WEB-07: IMPLEMENTED / BUILD + DEPLOYMENT VERIFICATION PENDING / BROWSER QA PENDING
- WEB-08: IMPLEMENTED / BUILD VERIFICATION PENDING / BROWSER QA PENDING
- Next: WEB-17 — MY AGENT
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

## WEB-05 implemented
- Added canonical `UniverseShell` composition around the existing product experience.
- Desktop IA: Universe, Social, Explore, Communities, Missions, Marketplace, My Agent and Create.
- Reused WEB-04 mobile IA: Universe, Explore, Create, Messages, My Agent.
- Added Universe Canvas, Overlay, Context Dock and Command Bar composition slots.
- Preserved existing AllphaWorldRenderer, Feed/Discovery, Theme/World, Agent Runtime, Live and API contracts.
- Railway build/deployment succeeded for final WEB-05 commit; browser/device visual QA and authenticated E2E remain pending.

## WEB-06 implemented
- Added `apps/web/components/identity/universe-identity-experience.tsx` as the canonical Splash + Human Identity presentation surface.
- Public entry now follows Splash → Allpha onboarding → existing Human Identity Gateway.
- Authenticated users bypass the anonymous splash and continue directly into the existing Universe product experience.
- Reused the existing Supabase Auth browser/server boundary and email/password sign-in/sign-up contract.
- Preserved PKCE callback exchange and hardened the callback `next` redirect to same-origin local paths only.
- Sign-up email verification preserves the safe requested destination through the existing callback route.
- Added responsive identity UI, 44px controls, focus-visible states and explicit loading/error/verification feedback.
- No new identity engine, authority layer, database schema, RPC, business seed data or renderer was introduced.
- Railway build/deployment verification completed successfully: deployment `3fae8141-baf4-4f3e-a693-e7d842912236`, commit `3926adcfdd53a37630089cee9ef621632140b1f9`. Browser/device visual QA and authenticated E2E remain pending.

## Next
WEB-07 — Universe Home.
Then WEB-08 Galaxy Navigator and the remaining progressive UI surfaces.

## Operating mode
READ → UNDERSTAND → INSPECT → RECONCILE REPO + SUPABASE → PLAN → IMPLEMENT → MIGRATE → TEST → SECURITY CHECK → REVIEW → SELF-CHECK → REPORT

No phase restart. No Production GREEN claim during CW-02.


## WEB-07 implemented

- Added `apps/web/components/universe/universe-home-experience.tsx` as the active authenticated Universe Home surface.
- Reconciled the supplied Mobile PWA UI/UX concept into the canonical Home layer without implementing later screens prematurely.
- Home includes compact identity header, Universe / Live / For You tabs, Living Universe hero, discovery categories, featured Worlds, Universe Stream, Live Experiences, Agent presence, spatial summary and 82-domain Feature Constellation entry.
- Reused existing API data: Theme/World catalog, Discovery Home, Live templates, My Agents and Galaxy/World/District.
- Reused existing UniverseShell and MobileNavigation.
- Home remains fully usable without 3D/WebGL.
- No fake business data, new renderer, new discovery engine, new Agent Runtime, new AI Gateway or authority layer was introduced.
- Source implementation is complete; Railway build/deployment, browser/device visual QA and authenticated E2E remain validation gates.

## Next
WEB-08 — Galaxy Navigator.


## WEB-08 implemented

- Added `apps/web/components/universe/galaxy-navigator-experience.tsx`.
- Activated Galaxy Navigator from the existing UniverseProductExperience.
- Reused `/api/v1/universe/galaxies` and `/api/v1/universe/worlds?galaxy_id=...`.
- Galaxy selection is bound to the selected authoritative Galaxy ID.
- World cards delegate to the existing `/world?world_id=...` surface.
- Added mobile-first search, Galaxy selection, orbital spatial preview, World discovery, metrics and responsive presentation.
- No fake Galaxy/World business data, new renderer, new discovery engine, ranking engine, Agent Runtime, AI Gateway or authority layer was introduced.
- Source implementation is complete; Railway build verification, browser/device visual QA and authenticated E2E remain validation gates.

## Next
WEB-09 — World Experience.


## WEB-09 implemented

- Added `apps/web/components/world/world-experience.tsx`.
- Activated `apps/web/app/world/page.tsx`.
- World identity is loaded from `GET /api/v1/universe/worlds/{world_id}`.
- Districts, linked Agents, Content, Portals and Presence reuse existing World API contracts.
- Published Theme/World schema is reused for the existing `AllphaWorldRenderer`.
- Enter World uses the existing authoritative join contract.
- No synthetic membership, agent, content, district or portal counts are introduced.
- Missing Scene remains an explicit state; no fake scene is generated.
- Source implementation is complete; Railway build/deployment, browser/device QA and authenticated E2E remain validation gates.

Audit: `docs/audits/WEB09_WORLD_EXPERIENCE_20261005.md`

Next canonical product phase: WEB-10 — District Experience.


## WEB-10 implemented

WEB-10 upgrades the existing District Experience foundation into the full canonical District surface.

Implementation:
- `apps/web/components/district-experience-surface.tsx`
- existing route: `apps/web/app/districts/[district_id]/page.tsx`
- audit: `docs/audits/WEB10_DISTRICT_EXPERIENCE_20261005.md`

The surface composes authoritative District → Zone → Spatial Object → Booth → Agent Presence state, validates the published World Scene, reuses `AllphaWorldRenderer`, resolves verified signed 3D assets when available, supports realtime + 5-second reconciliation polling, 2D fallback, low-power mode, District entry, access request, and Agent spatial interactions.

No new renderer, engine, authority layer, or fake spatial/business data was introduced.

WEB-10 source implementation is complete. Railway build/deployment, browser/device QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-11 — Booth/Tenant.


## WEB-11 implemented

WEB-11 activates the dedicated Booth/Tenant experience after District Experience.

Implementation:
- apps/web/components/booth-experience-surface.tsx
- apps/web/app/booths/[booth_id]/page.tsx
- District integration in apps/web/components/district-experience-surface.tsx
- audit: docs/audits/WEB11_BOOTH_TENANT_20261005.md

The surface consumes the existing Booth detail, verified 3D asset, display slot, lease, District composition, Theme/World runtime, Agent Account discovery and Marketplace listing contracts.

Experience includes:
- Booth / Tenant identity
- District / Zone / World context
- branding and theme presentation
- published Marketplace listings
- AI Host / Agent Account
- Spatial Runtime Agent interactions
- tenancy / lease state
- verified Booth 3D assets
- display slots
- Live Entry metadata
- Supabase Realtime reconciliation
- 5-second authoritative refresh fallback
- low-power mode
- 2D fallback

District Booth selections now route to /booths/{booth_id}. The existing /booths Booth Builder remains the management workflow.

No new renderer, spatial engine, Agent Runtime, AI Gateway, Commerce engine, billing engine, permission authority or fake business/3D data was introduced.

WEB-11 source implementation and Railway build/deployment are verified. Browser/device visual QA and authenticated E2E remain validation gates.

Next canonical product phase: WEB-12 — Agent Experience.
CW-02 remains OPEN / ACTIVATING / NOT GREEN.


WEB-11 final deployment evidence:
- source commit: b45e2613d3de409a55d78414b7f25b2025b70dca
- @allpha/web deployment: 4807026a-213e-4810-ae24-ba6d8b6a44d2
- status: SUCCESS
- region: asia-southeast1-eqsg3a
- production route verified by build manifest: /booths/[booth_id]

Browser/device visual QA and authenticated E2E remain pending. CW-02 is not Production GREEN.


## WEB-12 implemented

WEB-12 Agent Experience is implemented as an in-Universe Agent Space rather than a conventional profile page.

Implementation:
- apps/web/components/agent-experience-surface.tsx
- apps/web/app/agents/[agent_id]/page.tsx
- apps/web/app/globals.css
- World/District/Booth Agent entry links preserve spatial context.
- Existing AllphaWorldRenderer is reused for validated World Scene + Agent Presence.
- Existing Live Character Runtime catalog is reused for Agent Character presentation.
- Explicit orbital 2D fallback is used when no validated scene/presence exists.
- Agent HUD exposes Passport, Skills, Conversation, Presence, Collaboration and Negotiation intents.
- Conversation uses existing Messaging/Agent Conversation contracts.
- Collaboration and negotiation use existing Spatial Runtime interaction contracts.
- Realtime spatial presence is reconciled with authoritative polling.
- No duplicate renderer, Agent Runtime, AI Gateway, spatial engine, messaging engine or authority layer introduced.

Final Railway deployment:
- 46325da6-d447-4764-a546-70ae20b8586e
- SUCCESS
- commit d4b39e8d993db32d8cefa0132747d5cc8d2de2a6

Browser/device visual QA and authenticated E2E remain pending.

Next: WEB-13 — Universe Feed / Moments.


## WEB-13 implemented

WEB-13 Universe Feed / Moments is implemented as the Universe Stream / Moments Galaxy rather than a conventional 2D feed.

Implementation:
- `apps/web/components/universe/universe-moments-experience.tsx`
- `apps/web/app/moments/page.tsx`
- `apps/api/app/api/discovery.py`
- `apps/web/app/globals.css`
- Universe Home Feed entry now opens `/moments`.

Experience:
- Content Capsule
- Content Gravity
- orbit / constellation discovery
- World context
- Agent owner / presence
- Live transitions
- Ask the Content
- search
- mobile-first responsive surface

Final deployment evidence:
- Web: `d6831e61-7810-41ef-8170-15231d0174af` SUCCESS
- API: `0a6c2c44-dd3f-4b91-9b98-da0a86b3d9fb` SUCCESS

Railway Web uses the existing Next.js Webpack build path for this deployment after a Turbopack cache-file failure during validation.

Browser/device visual QA and authenticated E2E remain pending. CW-02 is not Production GREEN.

Next: WEB-14 — Content Capsule.

## WEB-14 completion handoff — 2026-10-05

WEB-14 Content Capsule is source-implemented on main.

Route:
- /content/{content_id}

Canonical experience:
- Original Content
- AI Summary
- Discussion
- Related Content
- Community
- Agent
- Ask the Content
- Live Experience
- World

Existing canonical backend composition:
- GET /api/v1/discovery/content/{content_id}/evolution
- POST /api/v1/discovery/content/{content_id}/ask
- POST /api/v1/content/{content_id}/events

The Content Evolution service now returns authoritative Content body/context, Topics, Media references, reviewed AI Capsule, Community discussions/comments, Communities, topic-related Content, Live relationship, World relationships/details and owner Agent relationship.

Moments quick Capsule now links into the full Content Experience.

No duplicate engine/renderer/authority/runtime was added. No synthetic AI Summary or media URL was fabricated.

Pending validation:
- Railway web/API build + deployment verification (VERIFIED)
- browser/device visual QA
- authenticated E2E
- CW-02 remains OPEN / ACTIVATING / NOT GREEN

Next canonical phase: WEB-15 — Ask the Content.


## WEB-15 completion handoff — 2026-10-05

WEB-15 Ask the Content is source-implemented on main.

Route:
- /content/{content_id}/ask

The full Ask Experience deepens the existing Ask Content service and canonical AI Gateway rather than introducing another Q&A/chatbot/RAG engine.

Existing canonical boundaries:
- POST /api/v1/discovery/content/{content_id}/ask
- GET /api/v1/discovery/content/{content_id}/evolution

Implemented:
- Content-grounded Ask workspace
- local follow-up turns in the current UI session
- visible grounding/context signals
- optional existing private RAG status visibility
- Agent/Community/World/Live transitions
- direct return to Content Experience
- Ask response grounding metadata
- Content Evolution path now includes Community, Agent and Ask

No new DB migration or duplicate engine was introduced.

Pending:
- Railway web/API build + deployment verification
- browser/device visual QA
- authenticated E2E
- CW-02 remains OPEN / ACTIVATING / NOT GREEN

Next canonical phase: WEB-16 — Create Experience.


## WEB-16 completion handoff — 2026-10-05

WEB-15 Railway verification is complete:
- Web deployment 3caf03ef-c805-46e6-9a09-15547b487292 — SUCCESS
- API deployment 1df24aec-f899-4515-8409-7c6054140fa8 — SUCCESS
- Commit e2f3c83f4cb73c4a6ae336beb5eb5dd5704f2574

WEB-16 Create Experience source implementation is complete.

Route:
- /create

Implementation:
- apps/web/components/create-experience.tsx
- apps/web/app/create/page.tsx
- apps/web/components/universe-product-experience.tsx
- apps/web/components/agent-factory.tsx

The /create surface is the single Create hub for existing canonical builders: Agent, Content, Live, World, Theme, Booth, Community and Workflow/Mission. It carries an optional context navigation hint and explicitly states that context does not grant authority.

The previous /create route rendered the generic Content Platform. That was reconciled so /content remains the Content Platform and /create is now the dedicated Create Experience.

No new engine, database schema, migration, renderer or authority layer was added.

Deployment verification:
- Railway Web deployment bf4406e3-5184-4d5a-bc15-e4e7c4a0d52a — SUCCESS
- commit 321aa3d6b207c62b45524bb82de5a53a0edbb4d9

Pending validation:
- browser/device visual QA
- authenticated E2E

Next canonical phase: WEB-17 — My Agent.
