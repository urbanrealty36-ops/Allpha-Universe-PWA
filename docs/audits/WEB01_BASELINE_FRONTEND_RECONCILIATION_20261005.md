# WEB-01 — Baseline & Frontend Reconciliation

Date: 2026-10-05
Status: COMPLETE — BASELINE RECONCILED / IMPLEMENTATION GATE READY
Wave: CW-02.WEB
Repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Baseline commit inspected: 3dd44cb487d03b1ae6dc063deabb4c8e9668c523

## 1. Purpose

WEB-01 establishes the authoritative frontend baseline before the full UI/UX refactor. It reconciles the current Web App routes, components, canonical spatial renderer, API access pattern, existing product surfaces, responsive behavior and CI/PWA readiness.

No architecture expansion is approved by WEB-01.

## 2. Current frontend structure

Current Next.js Web package:
- Next.js 16.3.8
- React 19.2.0
- TypeScript 5.9.3
- Three 0.180.0
- @react-three/fiber 9.3.0
- @react-three/drei 10.7.6
- @supabase/ssr 0.12.7
- @supabase/supabase-js 2.117.2
- workspace design tokens package is already present

Current app route families include:
- admin
- agent
- agents
- agent-collaboration
- agent-runtime
- agent-simulation
- ai
- auth
- avatar-studio
- billing
- blocked
- booths
- collaboration
- communities
- content
- create
- districts
- economy
- events
- explore
- feed
- following
- for-you
- goals
- habits
- interests
- live
- live-experience
- marketplace
- messages
- missions
- my-agent
- notifications
- personalization
- payment
- payouts
- passions
- product-activation
- profile
- reels
- relationships
- runtime
- security
- settings
- social
- social-graph
- theme-builder
- theme-studio
- themes
- universe
- workflows
- world
- world-builder
- worlds

This proves the repository already contains a broad product surface. The main refactor problem is therefore product composition and responsive realization, not absence of every domain surface.

## 3. Current canonical entry

Current apps/web/app/page.tsx resolves to:
UniverseEntrySurface

Authenticated users are routed into:
UniverseProductExperience

The current product surface already uses:
- canonical apiFetch;
- Theme/World runtime catalog;
- Discovery home;
- Live templates;
- owned Agent list;
- Universe/Galaxy/World/District discovery;
- existing ImmersiveUniverseShell;
- existing AllphaWorldRenderer.

## 4. Current canonical spatial implementation

Existing:
- apps/web/components/universe/immersive-universe-shell.tsx
- apps/web/components/world/allpha-world-renderer.tsx
- apps/web/components/district-experience-surface.tsx
- apps/web/app/districts/[district_id]/page.tsx

The current District flow is already:

Universe Home
 → District Selection
 → District Spatial Experience
 → Realtime Presence
 → Booth/Tenant
 → Agent Interaction

WEB-01 therefore treats District as an existing implementation foundation and does not schedule a duplicate District Engine.

## 5. Existing UI surface inventory

Important existing components include:
- agent-account-card
- agent-collaboration-surface
- agent-companion
- agent-control-surface
- agent-factory
- agent-intelligence-panel
- agent-memory-knowledge-surface
- agent-personalization-surface
- agent-runtime-surface
- agent-service-action
- agent-simulation-surface
- ai-gateway-surface
- avatar-studio-surface
- booths-surface
- communities-platform
- content-evolution-panel
- content-platform
- discovery-surface
- district-experience-surface
- districts-surface
- feed-surface
- live-experience-runtime-setup
- live-experience-vertical-slice
- live-gpt-live-voice
- live-streaming-collaboration
- live-webrtc-stage
- messaging-platform
- mission-surface
- personalization-dashboard
- product-activation-surface
- social-graph-dashboard
- social-graph-surface
- theme-builder-surface
- theme-spatial-slice
- theme-studio-surface
- universe-entry-surface
- universe-product-experience
- universe-surface
- universe-theme-navigator
- workflow-mission-surface
- world-builder-surface

This confirms significant functionality already exists but is distributed across many vertical surfaces.

## 6. Current frontend architecture finding

### Strengths

1. Canonical API access exists through apps/web/lib/api.ts.
2. Supabase browser auth is already used by Universe entry and spatial surfaces.
3. The canonical 3D renderer exists and is reused.
4. Theme/World runtime integration already exists.
5. District realtime/Booth/Agent interaction foundation exists.
6. Existing Agent, Live, Theme, Community, Content, Messaging and Marketplace surfaces provide implementation material to refactor rather than recreate.

### Refactor pressure

1. The Web App has many route-level vertical slices.
2. Product navigation is not yet a single responsive Universe Shell.
3. Mobile-first interaction is not yet a universal contract across all routes.
4. PWA installability/offline/update behavior is not yet documented as a complete product contract in the inspected Web baseline.
5. Spatial presentation and ordinary 2D product surfaces are not yet composed under one explicit experience-mode architecture.
6. The current UniverseProductExperience is a useful product surface but still mixes navigation, data loading and presentation in one large component.
7. Content/Feed/Discovery surfaces exist, but the new Universe Scroll / Content Capsule / Content Gravity concept needs a deliberate presentation layer over the same canonical engines.
8. Desktop and mobile visual language needs to converge on the supplied Mobile First reference instead of evolving as independent layouts.

## 7. Canonical binding matrix

| UI concern | Existing source | Canonical authority | WEB-01 decision |
| --- | --- | --- | --- |
| Auth/session | Supabase browser client | Supabase Auth | Reuse |
| API transport | apps/web/lib/api.ts | FastAPI | Reuse |
| Universe shell | UniverseProductExperience + ImmersiveUniverseShell | Web composition | Refactor into UniverseShell |
| 3D renderer | AllphaWorldRenderer | Spatial runtime/theme contracts | Reuse only |
| Theme | Theme runtime catalog | FastAPI/Supabase | Reuse |
| World | World runtime | FastAPI/Supabase | Reuse |
| District | District APIs + district surface | FastAPI/Supabase | Reuse |
| Booth | Booth surfaces/spatial runtime | FastAPI/Supabase | Reuse |
| Agent | Agent Factory/catalog/runtime surfaces | FastAPI/Supabase | Reuse |
| Feed | feed-surface/discovery-surface | Feed/Discovery engine | Reuse |
| Content | content-platform/evolution | Content APIs/DB | Reuse |
| Live | existing Live surfaces | Live runtime | Reuse |
| Messaging | messaging-platform | Messaging engine | Reuse |
| Community | communities-platform | Community engine | Reuse |
| Marketplace | marketplace route/surfaces | Commerce/Economy | Reuse |
| Theme Builder | theme-builder/theme-studio | Theme runtime | Reuse |
| Governance | security/control surfaces | Policy/Permission/Risk/Approval | Reuse |
| PWA | no complete contract observed in WEB-01 inventory | Web platform | WEB-03 |
| Responsive shell | distributed | Web presentation | WEB-02/04/05 |

## 8. Duplicate-engine audit

WEB-01 found no justification for introducing:
- another 3D renderer;
- another Feed Engine;
- another Recommendation Engine;
- another Agent Runtime;
- another AI Gateway;
- another Theme Engine;
- another World Engine;
- another District Engine;
- another Presence Engine;
- another Messaging Engine.

The refactor is a composition and presentation refactor.

## 9. Route strategy

Existing route families are retained during migration.

Target user-facing convergence:

/                  → Universe entry
/universe          → Universe
/worlds            → World discovery
/world/[id]        → World
/districts/[id]    → District
/booths/...        → Booth/Tenant
/agents/...        → Agent
/feed              → Universe Feed / Moments
/content/...       → Content Capsule
/live              → Live
/marketplace       → Marketplace
/communities       → Communities
/messages          → Messages
/my-agent          → My Agent
/theme-studio      → Theme Builder
/security          → Human Control Center

Legacy/technical route families remain available until their experience is migrated. WEB-01 does not delete routes.

## 10. Responsive target

Primary:
- Mobile-first PWA

Progressive:
- Tablet
- Laptop
- Desktop
- Large desktop

Experience modes:
- Ambient
- Spatial
- Universe
- Experience

Core functionality must remain usable without 3D.

## 11. Reference UX reconciliation

The supplied reference establishes:
- Splash / onboarding;
- Human Identity;
- Universe Home;
- Galaxy / World Navigator;
- World Detail;
- District Selection;
- realtime District;
- Booth/Tenant;
- Agent Interaction;
- Live Experience;
- Universe Feed / Moments;
- Content Capsule;
- Ask the Content;
- Create Experience;
- Agent Factory;
- My Agent;
- Agent Live Monitor;
- Marketplace;
- Communities;
- Messages & Collaboration;
- Theme Builder;
- Human Control Center;
- Universe Map 2D/3D;
- Mobile Navigation.

The reference is treated as the visual/product direction, not as authority for backend data or architecture.

## 12. Known gap classes

G1 — Shell fragmentation
Multiple vertical surfaces need one shared responsive shell.

G2 — Mobile-first inconsistency
Mobile navigation, sheets, touch targets and full-screen spatial interactions need one contract.

G3 — Spatial/2D composition
Existing 3D and 2D surfaces need explicit experience modes.

G4 — Feed presentation
Existing Feed/Discovery engine needs Universe Scroll / Moments / Content Capsule presentation.

G5 — Content intelligence presentation
Ask the Content and Content Evolution need UI composition without a new AI engine.

G6 — PWA
Installability/offline/update contract needs implementation and verification.

G7 — Route convergence
Existing vertical routes should gradually converge into the Universe-first experience without destructive route deletion.

G8 — Performance
3D, video and heavy assets need progressive enhancement and lazy loading.

G9 — Accessibility
Universal keyboard, focus, contrast, reduced-motion, semantic and touch contracts need enforcement.

G10 — E2E visual/runtime evidence
Authenticated browser evidence is still required after implementation.

## 13. WEB-01 implementation decision

APPROVED:

Existing engines
      ↓
Existing APIs
      ↓
Existing routes/components
      ↓
NEW SHARED UI COMPOSITION
      ↓
Mobile First PWA
      ↓
Responsive Desktop
      ↓
Spatial enhancement

NOT APPROVED:
- New engine
- New renderer
- New authority
- New fake data
- New duplicate API

## 14. Exit criteria

WEB-01 is considered complete for implementation purposes when:
- baseline repository state is recorded;
- route/component inventory is recorded;
- canonical engine/API bindings are recorded;
- duplicate-engine audit is recorded;
- reference UX is reconciled;
- target responsive architecture is recorded;
- WEB-02 through WEB-34 execution plan is recorded;
- the visual reference and its design intent are preserved in repository documentation;
- no architecture delta is required.

## 15. Current status

WEB-01: CLOSED / BASELINE LOCKED / READY FOR WEB-02

CW-02: OPEN / ACTIVATING / NOT GREEN

No Production GREEN claim is made.
