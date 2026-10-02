# ALLPHA UNIVERSE — MASTER CONTINUATION CONTEXT
## Phase 23+ — Engine, 3D Theme/Template, Spatial World, Memory, RAG, Automation, Orchestration & Security

**Date:** 2026-10-02  
**Status:** Canonical continuation artifact for a new AI Agent Code conversation.  
**Product:** Allpha — The Social Network for Humans & AI Agents.  
**Repository:** urbanrealty36-ops/Allpha-Universe-PWA  
**Branch:** main  
**Supabase:** AllphaDb-Universe / qltbacemtvnuzqkterly / PostgreSQL 17 / ap-south-1

> This document supplements and operationalizes the repository's existing `AGENTS.md`, Master PRD, Implementation Phases and Master Continuation Context. Those documents remain authoritative. Never guess when repository or live Supabase inspection can establish the truth.

---

# 1. CURRENT STATE — READ THIS FIRST

The project has progressed through **Phase 23 — AI-to-AI Collaboration**.

Current Phase 23 implementation state:
- 23A Discovery + Eligibility + Collaboration Request — IMPLEMENTED FOUNDATION
- 23B Agent DM + Negotiation — IMPLEMENTED FOUNDATION
- 23C Human Approval + Collaboration Agreement — IMPLEMENTED FOUNDATION
- 23D Execution binding/foundation — implemented in current repository history
- 23E Review + Reputation + History — remaining increment
- Phase 23 overall — **IMPLEMENTED FOUNDATION / NOT GREEN**

Important: the project is NOT starting Phase 20 again.

The major product gap now is different:

**The database/catalog foundations for Theme, World Template and Live Experience Template exist, including 25 platform catalog records, but the actual reusable 3D Theme/Template Engine, real renderer, spatial District/Booth composition, game-like navigation, and production-grade AI Character presentation/live rendering are not yet fully realized.**

A catalog row is not equivalent to:
- a 3D scene
- a rendered environment
- a real asset manifest
- a working navigation graph
- a mobile-capable renderer
- a live character runtime

The next AI Agent Code must close this gap without creating parallel engines.

---

# 2. MANDATORY OPERATING MODE

For every implementation:

```
READ
→ UNDERSTAND
→ INSPECT REPOSITORY
→ INSPECT SUPABASE
→ RECONCILE
→ PLAN
→ IMPLEMENT
→ MIGRATE
→ TEST
→ SECURITY CHECK
→ REVIEW
→ SELF-CHECK
→ REPORT
```

Before changing anything:
1. Read `AGENTS.md`.
2. Read `docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md`.
3. Read `docs/IMPLEMENTATION_PHASES.md`.
4. Read `docs/MASTER_CONTINUATION_CONTEXT.md`.
5. Inspect current `main`.
6. Inspect relevant phase architecture/schema docs.
7. Query live Supabase migration history.
8. Query live schema/RLS/functions/indexes/realtime when relevant.
9. Reconcile repository migrations with live migration history.
10. Reuse existing engines instead of implementing duplicates.

Never invent missing state.

---

# 3. REPOSITORY AND SUPABASE

## GitHub
- Repository: `urbanrealty36-ops/Allpha-Universe-PWA`
- Branch: `main`
- Direct implementation on main is the current project policy.

## Supabase
- Project: `AllphaDb-Universe`
- Ref: `qltbacemtvnuzqkterly`
- Region: `ap-south-1`
- PostgreSQL: 17
- Known status at continuation capture: `ACTIVE_HEALTHY`

Business source of truth:

```
FastAPI + Supabase PostgreSQL
```

Redis, browser state and caches are acceleration only.

SQLite is prohibited.

The browser must never receive service-role credentials.

---

# 4. PRODUCT IDENTITY

**Allpha — The Social Network for Humans & AI Agents**

Core principle:

> Human owns the Agent. Agent represents the Human. Agent interacts with Humans and Agents. Agent acts only within Human-defined authority.

Product principle:

> Unlimited creativity, bounded authority.

Allpha combines:
- Social Network
- Human + AI Identity
- AI Agents
- Content Discovery
- Interest/Passion/Habit/Goal intelligence
- Communities
- Messaging
- AI Gateway
- Agent Runtime
- Workflow/Mission
- AI Universe
- Districts
- Booths/Tenants
- 3D spatial world
- Live Stories
- Streaming
- AI Characters
- AI-to-AI Collaboration
- Marketplace
- Economy
- Governance
- Super Admin

Economy is one domain, not the entire product.

---

# 5. CANONICAL ARCHITECTURE

Monorepo:

```
apps/web   → User PWA → :3000
apps/admin → Super Admin → :3001
apps/api   → FastAPI → :8000
```

Production:
- allpha.com
- admin.allpha.com
- api.allpha.com

Boundary:

```
Web/Admin
   ↓
FastAPI API
   ↓
Supabase PostgreSQL
```

Frontend/Admin must not bypass FastAPI for privileged business mutations.

---

# 6. TECHNOLOGY BASELINE

Frontend:
- Next.js
- React
- TypeScript
- Tailwind
- PWA
- responsive/mobile-first
- light/default premium UI
- dark mode

Backend:
- Python
- FastAPI
- Pydantic
- async PostgreSQL

Data:
- Supabase PostgreSQL
- pgvector
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Redis only as non-authoritative acceleration

AI:
- AI Gateway
- Model Router
- provider agnostic

Spatial:
- Three.js
- React Three Fiber
- WebGL
- progressive enhancement
- future WebGPU/XR

---

# 7. MASTER PHASE ROADMAP

```
00 Governance & Repository Foundation
01 Design System & UI Foundation
02 Complete UI/UX Information Architecture
03 API Contract Layer
04 Supabase PostgreSQL Data Foundation
05 Identity, Authentication & Authorization
06 Human & AI Identity Foundation
07 Agent Memory & Knowledge
08 Interest, Passion, Habit & Goal Graph
09 Social Graph & Relationship Engine
10 Content Platform
11 Feed, Reels & Discovery
12 Community Platform
13 Messaging & Social Communication
14 AI Gateway & Model Router
15 Agent Runtime & Command System
16 Workflow & Mission Engine
17 AI Universe
18 Agent Simulation & Spatial Runtime
19 Districts
20 Booth / Tenant Platform
21 Theme & World Builder
22 Events & Experiences / Live Stories & Streaming
23 AI-to-AI Collaboration
24 Marketplace & Commerce
25 Economy, Credits & Billing
26 Security, Governance & Trust
27 Super Admin Control Plane
28 Analytics, Observability & Operational Intelligence
29 API Integration & Local End-to-End Wiring
30 Full Feature Activation
31 End-to-End QA & Security Verification
32 CI/CD
33 Runtime Verification
34 Staging / Production Readiness
35 Production Deployment & Final Green Gate
36–38 Reserved Product Expansion
```

Do not reset the roadmap to Phase 20. The current implementation is Phase 23.

---

# 8. CURRENT PHASE 23

## 23A — Discovery / Eligibility / Request
Uses existing:
- Agent ownership
- Agent state
- visibility
- Social Graph
- Social Blocks
- Agent messaging consent
- FastAPI/RPC boundary

## 23B — Agent DM / Negotiation
Reuses existing Messaging:
- `create_direct_conversation()`
- `send_message()`

Negotiation is an extension, not a replacement for Messaging.

## 23C — Human Approval / Collaboration Agreement
Implemented foundation:
- declarative agreement
- durable agreement events
- binding to accepted request/negotiation
- existing approval_requests
- existing risk_assessments
- distinct Human-owner approval semantics
- policy/capability snapshots
- execution recheck
- participant-scoped RLS
- FastAPI agreement API
- PWA approval/proposal surface

Agreement is data, not executable code.

## 23D — Execution
Execution must bind only approved agreements to the existing:
- Agent Runtime
- AI Gateway
- Workflow/Mission
- Policy
- Capability
- Risk
- Approval
- Budget
- Kill Switch

Never create a second execution engine.

## 23E
Review + authoritative reputation + history remains a later increment.

Reputation is history/evaluation, never an authorization shortcut.

---

# 9. CRITICAL PRODUCT GAP — 3D THEME/TEMPLATE REALIZATION

Current live Supabase observation includes:

```
themes = 25
theme_versions = 25
world_templates = 25
world_template_versions = 25
live_experience_templates = 25
live_experience_template_versions = 25
```

These are platform catalog/configuration records.

They do NOT prove 25 production-ready 3D scenes exist.

Maintain this distinction:

```
Catalog Record
≠ Theme Version
≠ Asset
≠ Scene
≠ Renderer
≠ Navigation
≠ Runtime
≠ Live Character
```

The new implementation must make the 25 choices materially usable in the Web App.

Do not create fake screenshots, fake Storage URLs, fake asset records or fake business data merely to make the gallery look populated.

The 25 built-in platform catalog rows should be reconciled with real declarative scene definitions and renderer configurations.

---

# 10. REQUIRED 25+ BUILT-IN THEME/TEMPLATE OPTIONS

At minimum, expose these selectable templates:

## District / World
1. Nusantara Heritage
2. Modern Metropolis
3. Cyber Future
4. Neo Tokyo
5. Digital Garden
6. Space Colony
7. Mars Frontier
8. Ocean City
9. Floating Islands
10. Fantasy Kingdom

## Business / Enterprise
11. Executive District
12. Investor Hub
13. Founder Campus
14. Innovation Lab
15. Commerce Boulevard
16. Luxury Gallery
17. Convention Center
18. Media Center

## Live / Creator
19. Podcast Studio
20. Talkshow Stage
21. Interview Lounge
22. Product Showroom
23. AI Newsroom
24. Creator Arena
25. Virtual Event Hall

Future additions:
- Webinar
- Conference
- Product Launch
- AMA
- Education/Class
- Gaming/Entertainment
- Virtual Concert
- Community Show
- Creator Show
- Shopping Live
- Agent-to-Agent Show
- Custom Studio
- XR/AR/VR variants

These are presentation templates. They never grant authority.

---

# 11. THEME ENGINE

The platform needs a reusable Theme Engine, not 25 custom pages.

Canonical pipeline:

```
Theme Catalog
 ↓
Theme Version
 ↓
World Template
 ↓
World Template Version
 ↓
Validated Scene Schema
 ↓
Asset Manifest
 ↓
Renderer
 ↓
Spatial Runtime
 ↓
Interactive World
```

Expected Theme/World entities already exist:
- themes
- theme_versions
- theme_assets
- world_templates
- world_template_versions
- world_builder_states

Do not duplicate these tables without proving a schema gap.

---

# 12. DETERMINISTIC 3D SCENE SCHEMA

A scene should be declarative:

```
scene
 ├─ environment
 ├─ terrain
 ├─ structures
 ├─ roads
 ├─ pathways
 ├─ zones
 ├─ booths
 ├─ portals
 ├─ signage
 ├─ screens
 ├─ lighting
 ├─ atmosphere
 ├─ ambient_audio
 ├─ interactive_hotspots
 ├─ spawn_points
 ├─ navigation_graph
 ├─ camera_rules
 ├─ performance_budget
 └─ accessibility
```

The schema must:
- be validated
- be deterministic
- reject arbitrary executable code
- reject scripts
- reject privileged authority fields
- support schema versions
- support migration/compatibility
- be renderer-safe

AI may propose a scene specification; AI must not inject executable scene code.

---

# 13. 3D RENDERER ENGINE

Implement one shared renderer:

```
AllphaWorldRenderer
 ├─ Scene Loader
 ├─ Theme Resolver
 ├─ Asset Resolver
 ├─ Environment
 ├─ Terrain
 ├─ District Layout
 ├─ Zone Renderer
 ├─ Booth Renderer
 ├─ Human Avatar
 ├─ Agent Avatar
 ├─ Character Renderer
 ├─ Navigation
 ├─ Interaction
 ├─ Camera
 ├─ Realtime Adapter
 ├─ Performance Manager
 └─ Accessibility/Fallback
```

Conceptual component:

```tsx
<AllphaWorldRenderer
  world={world}
  district={district}
  template={template}
  theme={theme}
  assets={assets}
  entities={entities}
  navigation={navigation}
  realtime={realtime}
/>
```

The renderer should consume validated authoritative API state.

---

# 14. REUSABLE 3D ASSET FAMILIES

Do not build 25 unrelated environments.

Use reusable families.

Architecture:
- floors
- walls
- doors
- windows
- stages
- booths
- screens

Environment:
- terrain
- vegetation
- water
- sky
- atmosphere
- ambient objects

Props:
- desk
- chair
- microphone
- camera
- product stand
- signage
- interactive devices

Characters:
- Human avatar
- Agent avatar
- Host
- Guest
- Audience
- Character presentation

Themes compose these assets.

Prefer procedural/declarative geometry where appropriate.

Storage assets must be real and authorized.

---

# 15. DISTRICT AS A LIVING/GAME-LIKE WORLD

The target UX is spatial.

```
Enter District
 ↓
Spawn
 ↓
Walk / Tap-to-move / Fast travel
 ↓
See Zones
 ↓
Visit Booth A
 ↓
Visit Booth B
 ↓
Meet Humans
 ↓
Meet AI Agents
 ↓
Talk
 ↓
Negotiate
 ↓
Collaborate
 ↓
Open Live Experience
```

The District is a navigable presentation/runtime layer over authoritative application state.

---

# 16. SPATIAL NAVIGATION ENGINE

Required concepts:
- Spawn Point
- Navigation Node
- Navigation Edge
- Waypoint
- Zone
- Booth Anchor
- Portal
- Destination
- Interaction Radius

Example:

```
District
 ├─ Zone A
 │   ├─ Booth A1
 │   └─ Booth A2
 ├─ Zone B
 │   ├─ Booth B1
 │   └─ Booth B2
 └─ Plaza
     ├─ Agent Hub
     └─ Portal
```

Support:
- free navigation
- tap-to-move
- touch joystick where appropriate
- fast travel
- accessible list/map alternative

---

# 17. PHASE 18 REUSE — DO NOT CREATE A NEW PRESENCE ENGINE

Existing Phase 18 concepts:
- agent_spatial_states
- spatial_interactions
- simulation_sessions
- simulation_ticks
- spatial_runtime_events

Reuse these.

Spatial state is not authority.

Actual Agent actions still pass through Phase 15.

---

# 18. HUMAN / AGENT INTERACTION IN DISTRICTS

Desired interactions:

Human → Agent:
- greeting
- question
- booth information
- demonstration
- quote request
- collaboration request

Agent → Human:
- product explanation
- marketing
- event invitation
- service offer
- information

Agent → Agent:
- introduction
- discovery
- negotiation
- partnership proposal
- supplier inquiry
- marketing offer
- collaboration
- referral
- handoff

Canonical flow:

```
Spatial Encounter
 ↓
Context
 ↓
Messaging / Collaboration Request
 ↓
Negotiation
 ↓
Human Approval if required
 ↓
Agreement
 ↓
Agent Runtime
 ↓
Workflow/Mission
```

Proximity is context, never authorization.

---

# 19. AI AGENT ROLES IN DISTRICTS

Possible presentation/operational roles:
- Booth Host
- Sales Agent
- Research Agent
- Guide
- Concierge
- Presenter
- Interviewer
- Negotiator
- Collaborator
- Event Host

A scene saying `role=salesperson` does not grant commerce capabilities.

Authority still comes from:
- Agent identity
- capabilities
- policy
- entitlements
- approval
- risk
- runtime

---

# 20. BOOTH/TENANT MODEL

Booth is a spatial tenant/venue, not a profile page and not the Live engine.

Hierarchy:

```
World
 ↓
District
 ↓
Zone
 ↓
Booth
 ↓
Theme / Scene
 ↓
Catalog / Presentation / Media
 ↓
Live Entry
```

Owner is exactly one authoritative subject:
- Human
- Organization
- owned AI Agent

Tiers:
- Free
- Standard
- Creator
- Business
- Prime
- Event
- Enterprise

Tier is entitlement input, not authorization.

Booth scene cannot modify:
- ownership
- permission
- entitlement
- billing
- reputation
- risk
- approval
- audit
- security

---

# 21. BOOTH BUILDER

Required declarative configuration:

```
Booth
 ├─ identity
 ├─ tier
 ├─ District zone
 ├─ theme
 ├─ scene
 ├─ catalog
 ├─ presentation
 ├─ media
 ├─ Agent host
 └─ live_entry_config
```

Phase 20 live entry is metadata only.

Streaming/Camera/TTS/Audience/Character runtime belongs to Phase 22.

---

# 22. LIVE EXPERIENCE ARCHITECTURE

Phase 22 owns Live.

Canonical flow:

```
Human
 ↓
Create Live Story
 ↓
Select Experience Template
 ↓
Select Participants
 ↓
Ownership
 ↓
Capability
 ↓
Consent
 ↓
Live Policy
 ↓
Risk
 ↓
Character/Voice/Costume
 ↓
AI Gateway
 ↓
Agent Runtime
 ↓
Realtime Live Session
 ↓
Audience
```

Templates include:
- Podcast
- Talkshow
- Interview
- Product Show
- AI Newsroom
- Webinar
- Conference
- Product Launch
- AMA
- Education/Class
- Gaming/Entertainment
- Virtual Concert
- Community Show
- Creator Show
- Shopping Live
- Agent-to-Agent Show

---

# 23. AI CHARACTER ENGINE

Character is a presentation layer.

```
Agent Identity
+
Character Presentation
```

Never:

```
Character = Authority
```

Character assets:
- model
- costume
- uniform
- sticker
- icon
- prop
- animation
- voice
- background
- lighting
- gesture/facial presets
- overlay

Third-party character assets require rights/moderation metadata.

---

# 24. LIVE CAMERA / CHARACTER PIPELINE

Concept:

```
Camera
 ↓
Tracking
 ↓
Character / Overlay
 ↓
Transform
 ↓
Animation
 ↓
Voice / Audio
 ↓
Compositor
 ↓
Live Output
```

Conversation:

```
Audience/Human Input
 ↓
Session Context
 ↓
Permission
 ↓
Moderation
 ↓
AI Gateway
 ↓
Model Router
 ↓
Agent Runtime
 ↓
Response
 ↓
TTS/Voice
 ↓
Animation
 ↓
Output
```

Browser never calls AI provider directly.

---

# 25. WORLD TEMPLATE VS LIVE TEMPLATE

World Template controls:
- environment
- District layout
- zones
- booths
- navigation
- portals
- spatial composition

Live Experience Template controls:
- stage
- participants
- camera
- audience
- screens
- character slots
- overlays
- lighting/audio
- interaction layout

Composition:

```
World Template
 ↓
District
 ↓
Booth
 ↓
Live Entry
 ↓
Live Experience Template
```

---

# 26. WORKFLOW ENGINE

Phase 16 is canonical.

Do not create a new workflow engine.

Lifecycle:

```
Draft
 ↓
Version
 ↓
Active
 ↓
Run
 ↓
Agent Command
 ↓
Task/Step
 ↓
Policy/Risk/Approval
 ↓
Execution
 ↓
Result
```

Mission wraps Workflow.

Workflow must use Phase 15 Agent Runtime.

---

# 27. ORCHESTRATION

Orchestration coordinates:

```
Human Intent
 ↓
Agent
 ↓
Workflow
 ↓
Tools
 ↓
Other Agents
 ↓
Approval
 ↓
Execution
 ↓
Review
```

Orchestrator responsibilities:
- participant resolution
- capability matching
- bounded planning
- dependency resolution
- approval detection
- sequencing
- retries
- stop conditions
- state transitions
- result aggregation

Orchestrator cannot invent permissions.

---

# 28. AGENT RUNTIME

Phase 15 is canonical.

Lifecycle:

```
received
planning
ready
running
waiting_approval
completed
failed
cancelled
killed
denied
```

Every executable action checks:
- Human ownership
- Agent active state
- Capability
- Policy
- Risk
- Approval
- Budget
- Rate limit
- Kill switch

Tool execution remains server-side.

---

# 29. AI GATEWAY / MODEL ROUTER

All model calls:

```
FastAPI
 ↓
AI Gateway
 ↓
Model Router
 ↓
Provider
```

Never expose provider secrets.

Provider/model/routing configuration is authoritative.

Gateway should enforce:
- capability-aware routing
- policy budgets
- input/output limits
- timeouts
- retry/fallback
- cost estimation
- usage telemetry
- idempotency
- safety policy

Do not persist private chain-of-thought.

---

# 30. LLM COST/USAGE OPTIMIZATION

Priority is low unnecessary LLM consumption.

Rule:

```
Deterministic Logic
 ↓
SQL / Cache / Search / Vector
 ↓
Small model if enough
 ↓
Large model only when required
```

Use:
1. intent classification
2. semantic caching
3. embedding caching
4. context filtering
5. short summaries
6. retrieval instead of full-history prompts
7. small models for simple tasks
8. premium models for complex tasks
9. batching
10. asynchronous jobs
11. streaming only where useful
12. per-Agent budgets
13. per-user budgets
14. daily/monthly limits
15. tool-specific limits
16. idempotency
17. cancellation
18. structured output
19. prompt deduplication
20. context compression

Never trade security for cost reduction.

---

# 31. MEMORY ARCHITECTURE

Use layered memory:

```
Working Memory
 ↓
Short-Term
 ↓
Episodic
 ↓
Semantic
 ↓
Procedural
 ↓
Long-Term Knowledge
```

## Working
Current session/task context.

## Episodic
Observed events:
- met Agent
- visited Booth
- completed collaboration
- approval/rejection
- event attendance

Must have provenance.

## Semantic
Generalized knowledge with:
- source
- confidence
- scope
- timestamp
- expiry/review

Do not present uncertain inference as fact.

## Procedural
Approved ways of performing work.

Procedural memory never bypasses current policy/capability checks.

---

# 32. HYBRID MEMORY

Combine:

```
Keyword Search
+
Vector Search
+
Structured Filters
+
Recency
+
Authority
+
Confidence
+
Relationship Context
```

Pipeline:

```
Query
 ↓
Authorization scope
 ↓
Structured filtering
 ↓
Lexical retrieval
 ↓
Vector retrieval
 ↓
Rerank
 ↓
Deduplicate
 ↓
Context budget
 ↓
LLM
```

Vector similarity never grants authorization.

---

# 33. RAG

RAG can retrieve only authorized information:
- Agent-owned knowledge
- authorized organization knowledge
- public content
- District information
- Booth catalog
- approved presentations
- relevant collaboration history
- conversation summaries
- workflow documentation

Pipeline:

```
Query
 ↓
Identity
 ↓
Authorization scope
 ↓
Retrieval
 ↓
RLS / ownership / visibility
 ↓
Rerank
 ↓
Context
 ↓
LLM
```

No private knowledge leakage.

---

# 34. SPATIAL CONTEXT RAG

When an Agent is in a District, contextual retrieval may include:
- current District
- current Zone
- current Booth
- nearby authorized Agents
- relevant interests
- current collaboration
- relevant catalog
- active Live event

Do not send the entire District database to an LLM.

---

# 35. AUTOMATION

Automation must reuse:
- Workflow
- Mission
- Agent Runtime
- AI Gateway

Examples:
- daily booth summary
- new lead notification
- collaboration follow-up
- event preparation
- post-live summary
- catalog update

Automation requires:
- trigger
- condition
- action
- owner
- authorization
- retry
- audit
- cancel/kill path

No autonomous action beyond authority.

---

# 36. EVENT ARCHITECTURE

Events are telemetry/coordination inputs, not authorization.

Examples:
- booth_created
- booth_published
- district_access_requested
- enterprise_access_granted
- live_session_started
- live_agent_collaboration_activated
- agent_collaboration_requested
- agent_collaboration_negotiated
- agent_collaboration_approved
- agent_collaboration_executed

Authoritative state remains DB/policy/RPC state.

---

# 37. SUPABASE SECURITY BASELINE

Required:
- RLS on exposed business tables
- deliberate grants
- direct writes revoked where RPC is authoritative
- SECURITY DEFINER only when justified
- pinned/empty search_path
- anon/public execute revoked for private mutations
- ownership checked server-side
- Agent ownership checked server-side
- organization membership checked server-side
- fail-closed access
- audit
- idempotency

Never use `raw_user_meta_data` as authorization authority.

---

# 38. ENTERPRISE DISTRICT ABAC

```
Subject
 ↓
Attributes
 ↓
District Policy
 ↓
Entitlement
 ↓
Organization Context
 ↓
Explicit Grant
 ↓
Permit / Deny
```

No client `enterprise=true`.

Private Districts must prevent unauthorized:
- presence
- feed
- search
- realtime
- membership discovery
- Booth discovery

---

# 39. THEME/TEMPLATE SECURITY

Theme tokens are presentation-only.

Allowed namespaces are limited to presentation/theme namespaces, e.g.:

```
theme.color.*
theme.typography.*
theme.radius.*
theme.background.*
theme.effects.*
theme.avatar.*
theme.spatial.*
```

Never allow generated configuration to override:

```
security.*
permission.*
policy.*
risk.*
ownership.*
verification.*
reputation.*
audit.*
billing.*
entitlement.*
approval.*
```

Reject:
- arbitrary code
- scripts
- executable callbacks
- privileged URLs/config
- hidden authority flags

---

# 40. SPATIAL SECURITY

Movement near an Agent is not permission.

```
Encounter
 ↓
Context
 ↓
Intent
 ↓
Permission
 ↓
Policy
 ↓
Action
```

A user walking into a Booth cannot automatically:
- access private data
- message a blocked subject
- negotiate on behalf of another owner
- execute a payment
- sign an agreement

---

# 41. AGENT NEGOTIATION

Desired flow:

```
Agent A enters/encounters Booth B
 ↓
Discover Agent B
 ↓
Introduction
 ↓
Business inquiry
 ↓
Offer
 ↓
Negotiation
 ↓
Agreement proposal
 ↓
Human approval when required
 ↓
Agreement
 ↓
Execution
```

An Agent saying “I agree” is not itself legal/financial authorization.

Negotiation is state/history, not authority.

---

# 42. 3D PERFORMANCE

The world must work on mobile.

Use:
- LOD
- instancing
- texture compression
- texture atlases
- lazy loading
- frustum culling
- occlusion where useful
- chunk loading
- Booth-level loading
- low-power mode
- reduced effects
- capability detection

Do not load the entire Universe.

---

# 43. WORLD CHUNKING

```
District
 ├─ Chunk A
 ├─ Chunk B
 ├─ Chunk C
 └─ Chunk D
```

Load nearby chunks based on player position.

Unload distant chunks.

Realtime should focus on relevant nearby entities.

---

# 44. REALTIME STATE

Use Realtime for transport/projection.

Do not persist every animation frame.

Persist meaningful state:
- position changes at bounded intervals
- state transitions
- interactions
- simulation ticks
- important events

Client interpolation handles visual smoothness.

---

# 45. DATABASE PRINCIPLE FOR 3D

Persist:
- scene configuration
- template reference
- theme reference
- asset manifest
- navigation metadata
- authoritative spatial state
- meaningful interaction/event records

Do not store raw rendering frames in PostgreSQL.

---

# 46. FIRST-ENTRY THEME UX

Target:

```
Create/Enter World or District
 ↓
Choose Theme
 ↓
Theme Gallery
 ↓
25+ options
 ↓
Preview
 ↓
Select
 ↓
Load validated scene
 ↓
Configure
 ↓
Enter
```

Each card should show:
- name
- category
- description
- real preview
- supported contexts
- performance class
- compatibility

Prefer preview generated by the same renderer.

Do not use fabricated screenshots.

---

# 47. WORLD BUILDER

Builder supports:
- choose theme
- choose world template
- configure layout
- configure zones
- place Booth anchors
- configure portals
- spawn points
- navigation
- preview
- validate
- submit
- moderation
- publish

Builder state is draft state, not World authority.

---

# 48. AI-GENERATED SCENE PROPOSAL

Safe pipeline:

```
Natural Language
 ↓
AI structured proposal
 ↓
Schema validation
 ↓
Security namespace validation
 ↓
Performance validation
 ↓
Preview
 ↓
Human confirmation
 ↓
Backend persistence
```

No direct LLM → SQL.

No LLM → executable scene code.

---

# 49. CONTENT / CATALOG / PRESENTATION

Booths can present:
- images
- videos
- presentations
- documents where supported
- catalog entries
- 3D display assets
- Live entry

Assets must be real and authorized.

No fake URLs.

No fake product/business records.

---

# 50. MEMORY + PERSONALIZATION

Existing Phase 08 Interest/Passion/Habit/Goal system is authoritative.

Rules:
- interest from explicit input or real observation
- passion from repeated evidence
- habit from repeated patterns
- goals from explicit intent
- no sensitive inference as fact
- no seed/demo behavior

Spatial behavior can generate signals only from real events.

---

# 51. OBSERVABILITY

Record:
- request ID
- correlation ID
- actor
- owner
- entity
- action
- result
- latency
- error code
- model usage
- cost where appropriate

Never log:
- provider secrets
- access tokens
- private chain-of-thought
- unnecessary sensitive data

---

# 52. IDEMPOTENCY

Important mutations should support idempotency:
- create
- publish
- join
- request
- approve
- execute
- send
- negotiate
- start Live
- stop Live

Retry must not duplicate authoritative records.

---

# 53. ERROR CONTRACT

Use structured errors such as:

```
AUTH_REQUIRED
FORBIDDEN
NOT_FOUND
OWNERSHIP_REQUIRED
CAPABILITY_REQUIRED
ENTITLEMENT_REQUIRED
APPROVAL_REQUIRED
RISK_DENIED
POLICY_DENIED
KILL_SWITCH_ACTIVE
THEME_NOT_COMPATIBLE
ASSET_NOT_READY
MODERATION_REQUIRED
TEMPLATE_INVALID
SCENE_INVALID
PERFORMANCE_BUDGET_EXCEEDED
```

Never return fake success.

---

# 54. EMPTY STATE POLICY

Valid:
- no Districts
- no Booths
- no Agents nearby
- no Live sessions
- no user-created content
- no collaborations
- no catalog items

Do not seed fake business activity.

Platform Theme/Template catalogs are controlled platform configuration and are the exception where explicit product provisioning is required.

---

# 55. DATABASE DOMAIN MAP

Current live domain families include:

## Identity
- users
- profiles
- identities
- organizations
- organization_members
- agents
- agent_personas
- agent_skills
- agent_capabilities
- agent_passports
- agent_permissions
- agent_policies
- agent_identities
- agent_credentials
- agent_budgets
- agent_reputation_events

## Memory / Knowledge
- agent_memory
- agent_memory_embeddings
- agent_memory_access_events
- knowledge_items
- knowledge_chunks
- knowledge_access_events

## Personalization
- interest_nodes
- interest_edges
- personalization_signals
- subject_interest_affinities
- passion_clusters
- passion_cluster_interests
- habit_patterns
- personalization_goals
- goal_interest_links

## District
- districts
- district_memberships
- district_entitlements
- district_zones
- district_access_requests
- district_activity_events
- district_access_policies
- district_access_grants

## Booth
- booths
- booth_leases
- booth_display_assets
- booth_display_slots
- booth_activity_events

## Theme/World
- themes
- theme_versions
- theme_assets
- world_templates
- world_template_versions
- world_builder_states

## Live
- live_experience_templates
- live_experience_template_versions
- live_sessions
- live_agent_collaborations
- live_character_assets
- live_session_overlays
- live_session_viewers
- live_session_messages
- live_audience_interactions

## Collaboration
- agent_collaboration_requests
- agent_collaboration_negotiations
- agent_collaboration_negotiation_events
- agent_collaboration_agreements
- agent_collaboration_agreement_events

This is a domain map, not proof that every runtime integration is complete.

---

# 56. LIVE MIGRATION RECONCILIATION

Known migration history reaches Phase 23.

Representative live versions:

```
20261002023135 phase_20_booth_tenant_platform
20261002023158 phase_20_booth_fk_hardening
20261002023456 phase_20_agent_tier_entitlement_hardening

20261002033548 phase_21_theme_world_builder
20261002035215 phase_21_theme_world_builder_runtime_hardening
20261002035247 phase_21_theme_world_builder_admin_read
20261002035435 phase_21_theme_world_builder_rls_policy_consolidation
20261002035504 phase_21_theme_world_builder_token_namespace_fix
20261002041140 phase_21_builtin_platform_theme_catalog

20261002042348 phase_22_live_experience_templates
20261002044134 phase_22a_live_session_core
20261002051941 phase_22b_live_agent_collaboration
20261002053404 phase_22d_realtime_live_conversation_audience_runtime

20261002060824 phase_23a_agent_collaboration_discovery_request
20261002061221 phase_23b_agent_dm_negotiation
20261002061408 phase_23b_messaging_negotiation_bridge_hardening
20261002062253 phase_23c_human_approval_collaboration_agreement
20261002062516 phase_23c_human_approval_collaboration_agreement_fk_indexes
```

Always query live history before applying a new migration.

---

# 57. SECURITY MAXIM

> Creativity may change presentation; it must never change authority.

Generated:
- Theme
- World
- Booth
- Character
- Avatar
- Animation
- Scene
- Workflow proposal
- AI response

must remain bounded by authoritative state.

---

# 58. AI MAXIM

> AI can propose, reason, retrieve, communicate and orchestrate within authority; AI cannot manufacture authority.

AI cannot grant itself:
- ownership
- capability
- budget
- permission
- approval
- entitlement
- enterprise access
- legal authority

---

# 59. ENGINE MAXIM

> One canonical engine per responsibility.

Reuse:
- Phase 14 AI Gateway
- Phase 15 Agent Runtime
- Phase 16 Workflow/Mission
- Phase 17 Universe
- Phase 18 Spatial Runtime
- Phase 19 District
- Phase 20 Booth
- Phase 21 Theme/World Builder
- Phase 22 Live
- Phase 23 Collaboration

Do not build parallel versions.

---

# 60. TARGET END-USER EXPERIENCE

```
Open Allpha
 ↓
Create/enter Universe
 ↓
Choose one of 25+ themes
 ↓
Preview real scene
 ↓
Enter District
 ↓
Move like a lightweight game
 ↓
See Zones and Booths
 ↓
Walk/teleport Booth → Booth
 ↓
Meet Humans
 ↓
Meet AI Agents
 ↓
Communicate
 ↓
Negotiate
 ↓
Collaborate
 ↓
Watch/enter Live Story
 ↓
AI Character appears
 ↓
Audience interacts
 ↓
Return to District
```

This is the intended product direction.

---

# 61. MOBILE / ACCESSIBILITY

3D must not be desktop-only.

Provide:
- touch controls
- tap-to-move
- fast travel
- map/list fallback
- low-power mode
- reduced motion
- reduced effects
- keyboard support
- focus states
- captions
- semantic interaction alternatives
- 2D/2.5D fallback

3D enhances the product; it must not become the only path to core functionality.

---

# 62. TESTING

For every new engine/domain:

## Database
- schema invariants
- FK integrity
- RLS
- grants
- function security
- indexes
- realtime publication where applicable

## API
- authentication
- ownership
- validation
- authorization
- error contract
- idempotency

## Renderer
- schema validation
- deterministic rendering
- asset resolution
- missing-asset handling
- navigation
- performance budgets
- mobile fallback

## E2E target

```
Human
 → create District
 → choose Theme
 → create Booth
 → place Booth
 → enter District
 → navigate
 → meet Agent
 → communicate
 → negotiate
 → approve
 → execute
 → enter Live
 → select Character
 → audience interaction
```

Do not fabricate users/Agents to fake this gate.

---

# 63. FINAL GREEN RULE

A phase is not GREEN because files/tables exist.

GREEN requires evidence for relevant:
- PRD
- DB
- API
- authorization
- security
- engine
- workflow
- UI/UX
- telemetry
- tests
- integration
- build
- runtime
- authenticated E2E

Phases 31–35 remain the final QA/CI/runtime/staging/production gates.

---

# 64. IMMEDIATE ENGINE PRIORITY

The next engineering priority is to turn the existing catalog foundations into a real product experience.

Recommended order:

1. Reconcile 25 built-in Theme/World/Live catalog rows.
2. Define/finalize deterministic scene schema.
3. Implement shared 3D renderer.
4. Implement real preview renderer.
5. Connect all 25 themes to renderer configurations.
6. Implement District scene composition.
7. Implement Booth scene composition.
8. Implement spatial navigation.
9. Connect Phase 18 spatial state.
10. Connect Phase 23 collaboration.
11. Connect Phase 22 Live entry.
12. Implement AI Character presentation runtime.
13. Implement mobile/performance fallback.
14. Add engine invariants and API tests.
15. Add authenticated E2E.
16. Update continuation docs.

Do not recreate Phase 23.

---

# 65. DO NOT CLAIM COMPLETE WITHOUT RUNTIME EVIDENCE

Do not call these complete merely because database tables exist:
- 3D Theme Engine
- World Renderer
- District Renderer
- Booth Renderer
- Navigation Engine
- Character Renderer
- Live Character Runtime
- production realtime spatial runtime
- full hybrid memory
- full RAG
- full automation
- full orchestration
- production 3D performance
- production streaming/WebRTC
- production AI voice/TTS
- authenticated end-to-end collaboration

---

# 66. CONTINUATION CONTRACT

A new AI Agent Code must preserve:
- current architecture
- existing migrations
- current security boundaries
- current design system
- current design tokens
- current API contracts
- existing engine ownership
- existing Supabase state
- no-fake-data rule
- fail-closed security
- direct implementation on main
- final Green gates

The repository is now a cumulative AI-native social/spatial platform, not a simple CRUD application.

Final system direction:

```
ALLPHA
├─ Social Network
├─ Human Identity
├─ AI Identity
├─ AI Agents
├─ Memory
│  ├─ Working
│  ├─ Episodic
│  ├─ Semantic
│  ├─ Procedural
│  └─ Hybrid RAG
├─ Content
├─ Interest Graph
├─ Communities
├─ Messaging
├─ AI Gateway
├─ Agent Runtime
├─ Workflow / Mission
├─ AI Universe
├─ Spatial Runtime
├─ Districts
├─ Booths / Tenants
├─ Theme / World Builder
├─ 3D World Engine
├─ Live Experiences
├─ AI Characters
├─ AI ↔ AI Collaboration
├─ Marketplace
├─ Economy
├─ Governance
└─ Super Admin
```

**Preserve the boundary: unlimited creativity, bounded authority.**
