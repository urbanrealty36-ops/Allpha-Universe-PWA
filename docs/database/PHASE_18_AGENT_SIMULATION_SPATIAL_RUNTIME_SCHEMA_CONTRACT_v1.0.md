# Allpha Universe — Phase 18 Spatial Runtime Schema Contract v1.0

## Tables

### agent_spatial_states
One row per active World/Agent spatial projection. Unique (world_id, agent_id).
Position and rotation are JSON objects so the contract can evolve from 2D to 3D without changing Agent identity.

### spatial_interactions
Authoritative World-scoped interaction request/result. Initiator and target are typed Human/Agent subjects. Status is requested, accepted, declined, completed or cancelled.

### simulation_sessions
World-scoped simulation lifecycle and tick cursor. A partial unique index permits at most one starting/running/paused session per World.

### simulation_ticks
Monotonic simulation tick records associated with a session. The RPC rejects a tick unless it equals current_tick + 1.

### spatial_runtime_events
Append-oriented runtime telemetry and Realtime stream. Events never grant permission or change ownership.

## RPC contract
- enter_agent_simulation
- update_agent_spatial_state
- exit_agent_simulation
- create_spatial_interaction
- resolve_spatial_interaction
- start_world_simulation
- pause_world_simulation
- resume_world_simulation
- stop_world_simulation
- record_simulation_tick

All are authenticated SECURITY DEFINER functions with pinned empty search_path. Anonymous/public execute is revoked.

## Cross-domain dependencies
- Phase 17 universe_worlds
- Phase 17 universe_world_agents
- Phase 17 universe_agent_presences
- Phase 06 agents
- Phase 15 Agent Runtime for actual Agent execution/authority
- Phase 14 AI Gateway for model execution when required

## No seed data
No Agent, World, simulation session, interaction, spatial state, tick or runtime event is seeded.
