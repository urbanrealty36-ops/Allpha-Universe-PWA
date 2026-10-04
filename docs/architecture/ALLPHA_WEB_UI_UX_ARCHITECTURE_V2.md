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
