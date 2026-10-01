# Allpha Universe — Full Implementation Phases

## Governing rules

Implementation is performed directly on `main`. `AGENTS.md` is binding.

- No hardcoded business data.
- No fake, mock, dummy, scenario, or placeholder business data.
- No SQLite.
- No fake API responses.
- Backend API is the authoritative application boundary.
- Supabase PostgreSQL is the business-data source of truth.
- Frontend/Admin never bypass the Backend API for privileged operations.
- Secrets never enter browser bundles.
- Authorization, ownership, roles, entitlements, pricing, approvals, risk decisions, and transaction state are server authoritative.
- Exposed database objects require deliberate grants and RLS/policies.
- Loading, empty, not-configured, permission-denied, and error states are legitimate; invented records are prohibited.
- QA, CI/CD, runtime, production and deployment are final gates only.

## Full delivery sequence

### PHASE 00 — Governance & Repository Foundation
AGENTS.md, monorepo boundaries, three independently deployable apps, workspace, source-of-truth rules and engineering docs.

### PHASE 01 — Design System & UI Foundation
Design tokens, typography, spacing, responsive system, accessibility, light/dark/system, PWA shell, navigation and command surfaces.

### PHASE 02 — Complete UI/UX Information Architecture
Route/screen inventory, page states, forms, tables, cards, feed/reels, profile/Agent/world/booth and admin control-plane surfaces.

### PHASE 03 — API Contract Layer
OpenAPI, schemas, errors, pagination/filter/sort, idempotency, versioning, web/admin boundaries and shared contracts.

### PHASE 04 — Supabase PostgreSQL Data Foundation — ✅ IMPLEMENTED
Extensions, migrations, enums, UUIDs, timestamps, constraints, indexes, audit primitives, pgvector, storage, realtime, grants and RLS. No business seed data.

### PHASE 05 — Identity, Authentication & Authorization — ✅ IMPLEMENTED
Supabase Auth, sessions, user/profile provisioning, RBAC/permissions, organization authorization foundation, backend JWT/JWKS verification, Web/Admin SSR auth, API contracts and RLS alignment.

### PHASE 06 — Human & AI Identity Foundation — ✅ IMPLEMENTED
Human identity/profile, AI Identity, Agent lifecycle, persona, Passport, verification, capabilities, skills, permissions, policies/autonomy, budget, credentials and reputation read model.

### PHASE 07 — Agent Memory & Knowledge — ✅ IMPLEMENTED
Memory lifecycle, knowledge/chunk/provenance, embedding persistence, semantic retrieval boundary, retention/expiry, review/delete, access audit and ownership/RLS.

### PHASE 08 — Interest, Passion, Habit & Goal Graph / Personalization Intelligence — ✅ IMPLEMENTED
Dynamic interest ontology, interest graph/edges, real behavior signals, subject affinity, derived passion clusters, recurring habit patterns, explicit goals, goal-interest links, personalization refresh engine, backend API, RLS and User PWA surfaces. No ontology, signal, affinity, passion, habit or goal seed data.

### PHASE 09 — Social Graph
Follow, connections, relationships, mentions, blocks, social/relationship graphs, notifications and activity events.

### PHASE 10 — Content Platform
Posts, media, carousels, articles, documents, presentations, podcasts/audio, tutorials, infographics, research, AI Capsules, topics, moderation and media contracts.

### PHASE 11 — Feed, Reels & Discovery
Home, Following, For You, Reels, Explore, Live Now, Agent Feed, Knowledge Feed, World Stream, Local/Context Feed, interaction signals, ranking contracts, diversity/novelty, negative feedback and recommendation events.

### PHASE 12 — Community Platform
Communities, memberships, roles, posts, discussions, moderation, events, hybrid human/Agent participation and discovery.

### PHASE 13 — Messaging & Social Communication
DMs, conversations, replies, Agent-human/Agent-Agent communication, delivery state, notifications, abuse controls and consent/privacy.

### PHASE 14 — AI Gateway & Model Router
Provider abstraction, model registry, routing, capability routing, context budgets, cost/latency, fallback/retry, safety and telemetry.

### PHASE 15 — Agent Runtime & Command System
Command API, intent parsing, task command, tools, execution context, state machine, planner, policy, risk, approvals, execution, audit ledger, kill switch and spending/rate limits.

### PHASE 16 — Workflow & Mission Engine
Missions, steps, runs, state transitions, scheduling, retries, idempotency, human-in-loop, outputs, review, completion and recovery.

### PHASE 17 — AI Universe
Universe, Galaxies, Worlds, portals, orbits, constellations, spatial discovery, Agent presence, world streams/events/objects and realtime presence.

### PHASE 18 — Agent Simulation & Spatial Runtime
Movement states, presence, exploration, interaction, collaboration, shopping, negotiation, approval waiting, realtime events and progressive 2D/3D enhancement.

### PHASE 19 — Districts
Districts, zones, buildings, roads, coworking, meeting rooms, events, marketplace/Agent/community zones, pricing, availability and realtime presence.

### PHASE 20 — Booth / Tenant Platform
Personal/Creator/Agent/Business Booths, Store, Office, Studio, Community Space, Event Venue, Collaboration Space, members, catalogs, visitors, events, leases, availability, pricing, billing, AI host and reputation.

### PHASE 21 — Theme & World Builder
Templates, versions, assets, world templates, builder state, publishing lifecycle, moderation, performance validation, asset safety and immutable governance/security boundaries.

### PHASE 22 — Events & Experiences
Webinars, AMA, live discussions, networking, conferences, hackathons, competitions, business matching, community events, festivals, launches, workshops, concerts and registration/ticketing contracts.

### PHASE 23 — AI-to-AI Collaboration
Discover, evaluate, Agent DM, negotiate, human approval, collaboration agreement, execute, review, reputation and history.

### PHASE 24 — Marketplace & Commerce
Items, products, services, catalogs, orders, transactions, payouts, commissions, refunds, ledger, buyer/seller lifecycle, Agent commerce and approval policies.

### PHASE 25 — Economy, Credits & Billing
Plans, subscriptions, features, entitlements, feature gates, usage, invoices, billing events, AI credits, consumption, pricing/revenue rules and district pricing.

### PHASE 26 — Security, Governance & Trust
Zero Trust path, authentication, authorization, policy/risk/approval engines, audit ledger, moderation, anti-impersonation, anti-scam, prompt-injection defense, reputation protection, rate limits, data access, kill switch and secret handling.

### PHASE 27 — Super Admin Control Plane
Overview, Users, Agents, Content, Communities, Universe, Galaxies, Worlds, Districts, Booths, Themes, Marketplace, Missions, Events, Plans, Features, Entitlements, Pricing, Revenue, Billing, Credits, AI Providers, Model Router, AI Policies, Agent Policies, Security, Risk, Moderation, Reports, Audit Logs, Feature Flags, Settings, Localization, Notifications, Analytics, Observability, E2E/QA and Configuration Versions.

### PHASE 28 — Analytics, Observability & Operational Intelligence
Product/Agent/content/recommendation events, AI usage, cost, latency, errors, audit telemetry, business metrics, health signals, trace correlation and dashboards.

### PHASE 29 — API Integration & Local End-to-End Wiring
Web→API, Admin→API, API→Supabase, AI Gateway, workflow engine, storage, realtime, auth propagation, authorization, errors, idempotency, local environment contracts and real data only.

### PHASE 30 — Full Feature Activation
Every UI surface connected to its API contract, persistence, workflow, realtime, authorization, audit and analytics; remove non-functional stubs and verify prohibited-data audit.

### PHASE 31 — End-to-End QA & Security Verification
Unit, integration, API contract, database/RLS, auth/authz, workflow, Agent command, approval, commerce idempotency, security, prompt injection, abuse/moderation, accessibility, visual regression, mobile/desktop and critical E2E.

### PHASE 32 — CI/CD
Lint, typecheck, Python checks, tests, API contract validation, migration validation, RLS tests, build, artifact generation, dependency/security scanning, environment separation and deployment pipelines.

### PHASE 33 — Runtime Verification
Local Web :3000, Admin :3001, API :8000, Supabase, Auth, RLS, realtime, storage, AI Gateway, Model Router, workflows, Agent command, approvals, commerce, admin CRUD, audit, observability and real-data smoke tests.

### PHASE 34 — Staging / Production Readiness
Staging/production environments, secrets, migrations, backups, recovery, rollback/compensating actions, rate limits, capacity, domains, SSL, monitoring, alerting, incidents, retention, privacy and compliance configuration.

### PHASE 35 — Production Deployment & Final Green Gate
Production deployment, migration, smoke tests, critical E2E, security advisor, RLS verification, runtime/monitoring verification, rollback verification, architecture audit, prohibited-data audit, accessibility audit and final build/deployment verification.

### PHASE 36 — Reserved Product Expansion
Future owner-approved domain expansion after the current canonical delivery sequence.

### PHASE 37 — Reserved Product Expansion
Future owner-approved domain expansion after the current canonical delivery sequence.

### PHASE 38 — Reserved Product Expansion
Future owner-approved domain expansion after the current canonical delivery sequence.

## Phase completion rule

A phase is not GREEN merely because code exists. The feature definition requires the relevant PRD, DB, API, authorization, security, workflow/engine, UI/UX, telemetry, tests and integration. Final runtime, CI/CD, production readiness and deployment remain separate gates.

## Final Green Gate

UI/UX, domains, API contracts, local apps, backend authority, Supabase, real data, auth, authorization, RLS, security, audit, realtime, workflow, AI Gateway/Model Router, Agent runtime, marketplace/billing, Super Admin, analytics/observability, E2E, accessibility, CI/CD, production readiness, deployment and runtime must all be verified. SQLite, fake/mock/dummy/scenario/placeholder business data and privileged frontend bypasses are prohibited.
