# Allpha Cross-Domain Engine & Architecture Amendment v1.1

## Scope

This amendment formalizes three cross-domain capabilities:

1. Tiered spatial Booth/Tenant with theme-compatible 3D display.
2. Enterprise-only District isolation using backend ABAC.
3. Story/Live AI Character collaboration with realtime Agent conversation and camera overlays.

This is an architecture amendment, not a declaration that all runtime dependencies are already GREEN.

## Engine map

### Booth Engine
Responsibilities:
- ownership
- tier/entitlement evaluation
- District eligibility
- theme compatibility
- lease lifecycle
- display asset validation
- catalog binding
- moderation state
- 2D/2.5D/3D scene configuration
- visitor/presence telemetry

Canonical workflow:
Create → Entitlement → District Policy → Theme Compatibility → Asset Validation → Moderation → Publish → Runtime.

### District ABAC Engine
Responsibilities:
- evaluate subject attributes
- evaluate District policy
- verify enterprise entitlement
- verify organization membership/verification
- evaluate explicit access grants
- deny by default
- emit audit decision

Canonical decision:
Subject + Attributes + Resource Policy + Context → Permit/Deny + Reason + Audit.

Never use a client boolean as an enterprise credential.

### Theme Compatibility Engine
Inputs:
- District theme family
- Booth tier
- Booth type
- asset capabilities
- theme version
- moderation state
- entitlement

Output:
- compatible theme set
- rejected theme + machine-readable reason

Theme presentation cannot alter authorization.

### Booth Scene Engine
The Scene Engine consumes a deterministic JSON scene schema.

Layers:
- environment
- structure
- signage
- screens
- catalog surfaces
- presentation surfaces
- media surfaces
- interactive hotspots
- Agent host
- lighting
- animation

Renderer:
2D fallback → 2.5D → WebGL/Three.js → future XR.

AI produces intent/configuration proposals; server validates and persists the final scene state.

### Live Session Engine
A single session model can represent:
- Story
- Live
- Event
- Booth Live
- Agent World Live

State:
draft → scheduled → live → ended/cancelled.

Visibility:
public, followers, community, enterprise, private.

### AI Live Collaboration Engine
Flow:
Human Live → Select Agent → ownership → capability → policy → consent → risk → character/voice → activation → realtime conversation → audience interaction → stop → audit.

The owner has authoritative pause/stop control.

### Character Engine
Agent identity remains canonical. Character is a presentation profile.

Components:
- character asset
- costume
- uniform
- sticker/icon
- animation
- voice
- background
- overlay transform

Character engine must preserve:
Agent Passport, ownership, reputation, permission, policy, risk and audit.

### Camera / Media Overlay Engine
Pipeline:
Camera Source
→ Tracking
→ Character/Overlay
→ Transform
→ Animation
→ Voice/Audio
→ Compositor
→ Live Output.

Tracking/rendering may be client accelerated. Authorization, entitlement and asset state remain server authoritative.

### Live Conversation Engine
Input:
owner voice/text or audience message.

Pipeline:
Session Context
→ Authorization
→ Moderation
→ AI Gateway
→ Model Router
→ Agent Runtime
→ permitted response
→ TTS/voice
→ character animation
→ live output.

Private chain-of-thought is never returned to client.

### Live Commerce Engine
Live can attach approved Booth catalog objects.

Flow:
Live → Catalog → Booth → Entitlement → Request/Checkout → Risk → Approval → Commerce.

AI can explain/demonstrate but cannot make unauthorized financial/legal commitments.

## Enterprise isolation model

Enterprise Districts require:
- enterprise entitlement
- policy evaluation
- optional organization allowlist
- optional explicit grant
- audit
- private realtime channel
- private search/feed indexing rules

Private content is not merely hidden; every access path must evaluate authorization.

## Data/event model

Cross-domain events:
- booth_created
- booth_theme_selected
- booth_asset_uploaded
- booth_published
- booth_lease_requested
- booth_lease_activated
- district_access_requested
- district_access_granted
- district_access_revoked
- enterprise_district_entered
- enterprise_district_exited
- live_session_created
- live_session_started
- live_agent_collaboration_requested
- live_agent_collaboration_approved
- live_agent_collaboration_activated
- live_agent_collaboration_paused
- live_agent_collaboration_ended
- live_character_selected
- live_character_overlay_activated
- live_character_overlay_removed
- live_ai_message_generated
- live_audience_interaction
- live_catalog_opened

Events are not authorization.

## Failure/rollback principles

- entitlement failure → no publish
- District ABAC denial → no access
- theme incompatibility → no activation
- asset moderation rejection → asset unavailable
- Agent consent revoked → collaboration stops
- owner kill/pause → collaboration stops
- risk denial → action does not execute
- stream failure → Agent collaboration pauses safely
- AI provider failure → fallback/error state, never fake response
- realtime disconnect → reconnect/recover state; do not fabricate presence
- billing failure → lease entitlement is suspended according to authoritative billing state

## Schema boundary

Foundation tables are:
- district_access_policies
- district_access_grants
- booths
- booth_leases
- booth_display_assets
- booth_display_slots
- live_sessions
- live_agent_collaborations
- live_character_assets
- live_session_overlays
- live_session_viewers

Dependent domains still required before full activation:
- District/World tables
- Theme tables
- Subscription/Plan/Entitlement
- Catalog/Commerce
- Media/Story/Live transport
- Agent Runtime
- AI Gateway/Model Router
- Moderation
- Realtime channel governance
- Super Admin configuration

## Definition

Schema foundation ≠ runtime feature complete.

Full Green requires DB + API + UI + authorization + entitlement + engine + realtime + AI + moderation + audit + analytics + E2E.
