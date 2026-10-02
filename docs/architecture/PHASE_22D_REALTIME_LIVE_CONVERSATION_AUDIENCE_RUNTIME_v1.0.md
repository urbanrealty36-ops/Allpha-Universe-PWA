# Phase 22D — Realtime Live Conversation / Audience Runtime

## Status
IMPLEMENTED FOUNDATION.

Phase 22D activates the realtime boundary on top of the existing Phase 22A Live Session, Phase 22B Human Owner → Owned Agent Collaboration, and Phase 22C Agent Runtime → AI Gateway path.

## Canonical runtime

```
Live Session
  ↓
Active Owned AI Collaboration
  ↓
Existing Agent Runtime — conversation mode
  ↓
Existing AI Gateway / Model Router
  ↓
Durable Live Message
  ↓
Supabase Realtime Broadcast
  ↕
Authenticated Live Audience
  ↕
Supabase Realtime Presence
  ↓
Durable Audience Interaction
```

Realtime is transport/state synchronization only. It does not grant Agent authority.

## Durable data
- `live_session_messages`: owner/agent/system conversation transcript.
- `live_audience_interactions`: reaction/question/raise-hand/poll/share/report interaction records.
- `live_session_viewers`: durable viewer join/leave state; Realtime Presence remains the live connection-state transport.

## Authorization
- Live message reads are limited to the session owner or authenticated users viewing a public live session.
- Message writes are server RPC-only.
- Owner messages require the authenticated session owner.
- Agent messages require the active collaboration, approved consent and `risk_decision=allow`.
- Audience interactions require an authenticated viewer row belonging to the current user.
- Realtime channels use private-channel authorization policies scoped to `live:<session_id>`.
- Client Broadcast writes are not enabled; database triggers emit sanitized events.

## AI boundary
Conversation generation reuses `AgentRuntime` and the existing `AI Gateway`. No second Live executor or second model router was introduced. The Gateway remains responsible for provider/model configuration, safety/routing, usage and cost telemetry.

If no real provider/model is configured, the UI exposes the authoritative error/not-configured state rather than fabricating an Agent response.

## Audience
Presence is ephemeral and comes from authenticated Realtime Presence. Durable viewer/interactions remain PostgreSQL records. The UI never fabricates viewer counts or audience activity.

## Remaining gates
Phase 22D is not final GREEN. Remaining dependencies include:
- authenticated multi-user E2E
- real configured AI provider/model execution
- realtime WebSocket runtime verification
- voice/TTS and media transport
- character/animation compositor
- moderation/entitlement/commerce integration
- build/CI
- runtime/staging/production gates
