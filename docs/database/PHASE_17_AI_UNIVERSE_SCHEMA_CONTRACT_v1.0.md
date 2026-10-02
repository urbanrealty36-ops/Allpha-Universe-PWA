# Phase 17 — AI Universe Schema Contract v1.0

Tables:
- universe_galaxies
- universe_worlds
- universe_world_memberships
- universe_world_interests
- universe_world_content
- universe_world_communities
- universe_world_agents
- universe_world_portals
- universe_agent_presences

Relationships:
Galaxy 1→N World.
World N↔N Interest, Content, Community, Agent.
World 1→N outgoing/incoming Portal.
World N↔N Agent Presence with one current presence row per Agent/World.

Authoritative dependencies:
Interest → Phase 08.
Content → Phase 10.
Community → Phase 12.
Agent → Phase 06/15.

No duplicate source-of-truth records are created.
