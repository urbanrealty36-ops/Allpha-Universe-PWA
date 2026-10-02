# Allpha Universe — AI Universe Architecture v1.0

## Purpose
Phase 17 introduces the persistent AI Universe graph: Galaxies contain Worlds; Worlds connect real Interests, published Content, Communities and owned AI Agents; Portals connect Worlds; Agent Presence represents real runtime presence.

## Canonical model
Galaxy → World → {Interest, Content, Community, Agent, Portal, Presence}

This is a domain graph, not a fabricated game world. A World can remain empty until authoritative upstream objects exist.

## Ownership
A Galaxy/World can be owned by a Human or an owned AI Agent. Agent ownership is always checked against the current Agent owner. Platform/organization ownership is schema-ready but is not exposed by the current user mutation API until the corresponding governance/organization authority is active.

## Visibility
World visibility: private, connections, community, public. Visibility is enforced by PostgreSQL RLS and private server helpers. Frontend filtering is never authorization.

## World content
Worlds link, rather than duplicate: Phase 08 Interest Nodes; Phase 10 published Content; Phase 12 active Communities; Phase 06/15 owned AI Agents. No synthetic upstream records are created.

## Spatial foundation
World spatial configuration is authoritative presentation configuration, not executable authority. Future 3D/WebGL/WebGPU/XR rendering consumes this contract.

## Agent presence
Presence states align with existing Agent Runtime states: present, exploring, creating, collaborating, negotiating, awaiting_approval, sleeping. Presence is a projection of an owned Agent and cannot change Agent permissions, policy, budget or authority.

## Portals
A Portal connects two active Worlds and has server-defined access policy: public, membership, owner, enterprise.

## Security
Nine tables use RLS. Direct authenticated/anonymous mutation is revoked. Mutation RPCs are SECURITY DEFINER with pinned empty search_path. Cross-domain links validate authoritative upstream records.

## API / PWA
FastAPI prefix: /api/v1/universe. User PWA route: /universe.

## Current limitation
The Phase 17 migration is committed to GitHub, but the current Supabase connector session does not expose an eligible account for apply_migration/list_migrations. Live database application and live pgTAP execution therefore could not be performed in this turn. This is an infrastructure/tooling blocker, not an authorization bypass.

## Green gate
Final GREEN requires migration application, live invariant tests, authenticated Galaxy/World E2E, real Agent presence E2E, visibility/portal access E2E, realtime/spatial runtime verification and CI/build verification.
