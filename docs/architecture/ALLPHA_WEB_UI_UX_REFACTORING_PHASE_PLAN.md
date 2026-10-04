# Allpha Universe — Full Web App UI/UX Refactoring Phase Plan

Status: ACTIVE PLAN / CW-02.WEB
Canonical repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Baseline commit at WEB-01 start: 3dd44cb487d03b1ae6dc063deabb4c8e9668c523

## Product contract

Allpha Web is a Mobile-First, Installable PWA with a responsive Desktop Web expansion. Mobile is not a shrunk desktop layout. Desktop and mobile share one product model, one authority model, one API layer and the existing canonical engines.

Primary experience:
- Humans & AI Agents
- A Shared Universe
- Universe-first navigation
- Hybrid 2D + 2.5D + spatial + 3D progressive enhancement
- No fake business data
- Server-authoritative identity, ownership, permissions, policy, risk, approval, transactions and runtime

## Refactoring waves inside CW-02.WEB

| Phase | Name | Scope | Status |
| --- | --- | --- | --- |
| WEB-01 | Baseline & Frontend Reconciliation | Inventory, route/component/API binding, duplication detection, current UX gap register | ACTIVE |
| WEB-02 | Design System Foundation | Responsive tokens, spatial primitives, accessibility/motion contracts | PENDING |
| WEB-03 | PWA Foundation | Manifest, installability, service worker/offline shell, update lifecycle | PENDING |
| WEB-04 | Mobile Navigation | Mobile-first navigation, sheets, touch-first interaction | PENDING |
| WEB-05 | Universe Shell | Shared responsive shell, top bar, navigation, canvas, overlays, context dock | PENDING |
| WEB-06 | Splash + Identity | Splash, onboarding, identity gateway | PENDING |
| WEB-07 | Universe Home | Universe canvas, discovery entry, worlds/live/content | PENDING |
| WEB-08 | Galaxy Navigator | Galaxy/world spatial navigation and transitions | PENDING |
| WEB-09 | World Experience | World detail, districts, people, live, content | PENDING |
| WEB-10 | District Experience | Realtime district spatial surface | EXISTING FOUNDATION |
| WEB-11 | Booth/Tenant | Spatial booth/tenant experience | PENDING |
| WEB-12 | Agent Experience | Agent presence, passport, interaction, skills/capabilities | PENDING |
| WEB-13 | Universe Feed / Moments | Universe Scroll, Moments, Following, For You, Worlds, Live | PENDING |
| WEB-14 | Content Capsule | Content intelligence presentation and evolution | PENDING |
| WEB-15 | Ask the Content | Contextual AI interaction through canonical AI Gateway/Runtime | PENDING |
| WEB-16 | Create Experience | Moment, Story, Video, Capsule, World, Community, AI/Live Experience | PENDING |
| WEB-17 | My Agent | Agent profile, genome, skills, memory, activity | PENDING |
| WEB-18 | Agent Live Monitor | Runtime state, tasks, approvals, activity and telemetry | PENDING |
| WEB-19 | Marketplace | Agent/service/product/experience commerce UX | PENDING |
| WEB-20 | Communities | Community/world/agent/content connections | PENDING |
| WEB-21 | Messages & Collaboration | 2D-first messaging with spatial context | PENDING |
| WEB-22 | Theme Builder | Theme → World → Scene → Asset → Renderer workflow | PENDING |
| WEB-23 | Human Control Center | Identity, security, permissions, approvals, usage and connected agents | PENDING |
| WEB-24 | Universe Map | 2D/3D Universe → Galaxy → World → District → Zone → Booth | PENDING |
| WEB-25 | 82-Domain Experience Map | Surface capabilities without exposing 82 engines/menu items | PENDING |
| WEB-26 | Responsive Engineering | Mobile/tablet/laptop/desktop/large desktop behavior | PENDING |
| WEB-27 | Performance | Progressive loading, device capability, 3D fallback | PENDING |
| WEB-28 | Accessibility | Keyboard, semantic HTML, focus, contrast, reduced motion, touch | PENDING |
| WEB-29 | PWA Install QA | Android/iOS/desktop install and update validation | PENDING |
| WEB-30 | E2E Journeys | Critical cross-domain journeys | PENDING |
| WEB-31 | Security / Authority QA | Frontend authority boundary and negative tests | PENDING |
| WEB-32 | Visual QA | Reference comparison across breakpoints | PENDING |
| WEB-33 | Runtime Validation | Controlled Railway observation + authenticated browser/runtime evidence | PENDING |
| WEB-34 | CW-02 Closure Evidence | Final evidence pack and closure decision | PENDING |

## Non-negotiable architecture rules

1. No second renderer. Reuse AllphaWorldRenderer.
2. No second Feed/Discovery/Recommendation engine.
3. No second Agent Runtime.
4. No second AI Gateway.
5. No second Theme/World/Spatial engine.
6. No fake Agents, Content, Worlds, Districts, Booths, transactions or runtime telemetry.
7. Frontend never becomes authority for permission, ownership, price, entitlement, approval, policy, risk or transaction state.
8. WebRTC remains transport, not authority.
9. Vector similarity never overrides permission/privacy/ownership/policy.
10. Mobile and desktop are two responsive presentations of the same product contract.
11. Core functionality remains available without 3D.
12. Railway observations during CW-02 are controlled runtime observation, not Production GREEN.

## Target information architecture

Mobile:
Universe / Explore / Create / Messages / My Agent

Desktop:
Universe / Social / Explore / Communities / Create / Missions / Marketplace / My Agent

Global:
Search / Notifications / Profile / Command Center

## Target spatial hierarchy

Universe → Galaxy → World → District → Zone → Booth/Tenant → Agent/Presence → Content/Capsule → Live/Experience

## Closure rule

WEB-01 is complete only when the current frontend has an explicit inventory and reconciliation matrix showing:
- route inventory;
- component inventory;
- canonical engine bindings;
- API bindings;
- responsive/PWA gaps;
- duplicate/legacy surface risks;
- reference UX gaps;
- implementation sequence;
- no architecture expansion required.

WEB-01 does not claim CW-02 GREEN.
