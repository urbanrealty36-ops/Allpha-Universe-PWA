# Allpha Universe — Agent Simulation & Spatial Runtime Architecture v1.0

## Purpose
Phase 18 turns the Phase 17 AI Universe spatial foundation into an authoritative runtime boundary for owned AI Agents. It manages spatial state, movement state, interactions, simulation sessions, deterministic tick records and realtime runtime events.

## Canonical runtime
Human authority
→ Agent Runtime / Policy / Capability / Risk / Approval / Budget
→ Universe World membership
→ Spatial Runtime
→ position / movement / presence / interaction
→ Realtime projection

Spatial Runtime never grants Agent authority and never bypasses Phase 15 Agent Runtime.

## Spatial state
agent_spatial_states stores authoritative per-World Agent transform and movement state:
- position
- rotation
- zone
- target position
- speed
- movement state
- metadata

Movement states:
idle, moving, exploring, interacting, collaborating, shopping, negotiating, awaiting_approval, sleeping.

## Presence synchronization
Entering/exiting/updating spatial state also projects to Phase 17 universe_agent_presences. Presence remains a projection and cannot modify Agent ownership, policy, capability, budget or kill switch.

## Interactions
spatial_interactions supports:
- proximity
- conversation
- collaboration
- shopping
- negotiation
- handoff
- custom

Initiators and targets are Human or Agent subjects already present in the World. Agent subjects are always checked against current Human ownership.

## Simulation
simulation_sessions models a World simulation lifecycle:
starting → running → paused → stopped / failed.

Only the World owner can start/pause/resume/stop a session. A partial unique index prevents more than one live session per World.

simulation_ticks enforces monotonic tick sequencing. Tick records are explicit runtime outputs; the platform does not fabricate ticks.

## Runtime events
spatial_runtime_events is an append-oriented telemetry/realtime stream for:
- Agent entered/exited
- movement/state changes
- encounters/interactions
- simulation lifecycle
- ticks

Events are telemetry and never authorization.

## Realtime
The following tables are published to Supabase Realtime:
- agent_spatial_states
- spatial_interactions
- simulation_sessions
- spatial_runtime_events

Authorization remains RLS/API based; Realtime is not an authority bypass.

## API
FastAPI prefix:
'/api/v1/spatial-runtime'

Capabilities:
- read World spatial state
- Agent enter/update/exit
- create/resolve interactions
- start/pause/resume/stop simulation
- inspect/record deterministic ticks
- inspect runtime events

## PWA
Route:
'/agent-simulation'

The screen accepts real World/Agent UUIDs and renders authoritative state. It never creates demo Agents, Worlds, sessions or interactions.

## Security
All five Phase 18 tables use RLS. Direct table writes are revoked from anonymous/authenticated roles. Mutations are SECURITY DEFINER RPCs with empty search_path and ownership checks.

## Runtime boundary
Phase 18 is a spatial/simulation engine boundary, not a free-form autonomous Agent executor. Actual Agent actions continue through Phase 15 Agent Runtime, with Phase 14 AI Gateway where model execution is needed.

## Green gate
Phase 18 is not final GREEN until authenticated multi-user/Agent E2E, spatial state ownership E2E, interaction authorization E2E, simulation lifecycle E2E, tick sequencing E2E, Realtime runtime verification, API/PWA build verification and final runtime/CI gates pass.
