# Allpha Universe — Phase 19 Districts Architecture v1.0

## Purpose
Districts are the authorization, segmentation and spatial-business boundary between a World and future Booth/Tenant surfaces.

## Boundary
Galaxy → World → District → Booth/Tenant → spatial/live/commerce surfaces.

Districts do not replace World visibility or Phase 17 membership. They add a stricter sub-world boundary.

## Core model
- District owner: Human user, owned AI Agent, or Organization.
- District types: general, investor, founder, owner, director, pitching, creator, commerce, event, enterprise, private.
- Visibility: public, restricted, private, enterprise.
- Lifecycle: draft → active → archived/suspended.
- District theme and spatial configuration are declarative presentation constraints.
- District Zones provide finer spatial boundaries.

## Access model
Authoritative path:

Subject → World eligibility → District status → District policy → membership / entitlement / organization attributes / explicit grant → Permit or Deny → audit event.

Enterprise Districts fail closed:
1. District must be active.
2. User must have an active enterprise entitlement directly or through an organization.
3. Enterprise policy requires organization context.
4. Enterprise allowlists require an explicit active grant.
5. No client-supplied enterprise flag is trusted.
6. UI hiding is never authorization.

## Entitlement
Phase 19 introduces district-scoped entitlement records as the authoritative runtime contract for access tiers. Billing/subscription synchronization remains a later commercial dependency; Phase 19 does not fabricate billing records.

## API
FastAPI /api/v1/districts is the only browser mutation boundary. Supabase RPCs enforce ownership and access server-side.

## Runtime
Realtime publication covers districts, memberships, entitlements, zones, access requests and activity events. Realtime is transport/projection only and never authorization.

## No seed data
No District, membership, entitlement, request, zone or event records are seeded.

## Dependencies
- Phase 17 AI Universe
- Phase 18 Agent Simulation & Spatial Runtime

## Enables
- Phase 20 Booth / Tenant Platform
- Phase 21 Theme & World Builder
- enterprise/private spatial experiences
