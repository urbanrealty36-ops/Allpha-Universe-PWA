# Phase 22C — Live Agent Runtime / AI Gateway Activation

## Scope
Bind an active Live Agent Collaboration to the existing Agent Runtime and AI Gateway. No second executor, model router, or Live AI engine is created.

## Canonical path
Active Live Collaboration → Live Runtime Command → existing Agent Runtime plan/execute → existing AI Gateway → configured model/provider.

## Authority gates
- Collaboration must be owned by the authenticated Human Owner.
- Collaboration must be active, consent approved, and risk decision allow.
- Live Session must be scheduled/live when a Live Runtime Command is created.
- Agent Runtime re-checks the Live Collaboration before execution.
- Existing Agent ownership, active status, Agent Policy and kill-switch checks remain authoritative.
- Runtime commands carry explicit `command_source=live`, `live_session_id`, and `live_collaboration_id`.
- AI Gateway receives Live context in request metadata while model/provider selection remains centralized in the existing Gateway.

## Runtime behavior
The existing `AgentRuntime.plan_command()` and `execute_command()` are reused. Existing `AI Gateway.generate()` performs provider/model routing, safety/routing policy checks, usage telemetry, retries and cost accounting.

## Safety
If the Live collaboration is paused/ended/revoked before execution, the runtime fails closed with `LIVE_COLLAB_NOT_ACTIVE`. No direct browser database mutation path is introduced for commands.

## Current boundary
Phase 22C activates command/planning/execution integration. It does not claim realtime media, voice/TTS, character animation, streaming transport or audience runtime completion.