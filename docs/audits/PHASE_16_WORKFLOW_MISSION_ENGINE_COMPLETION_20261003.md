# Phase 16 — Workflow & Mission Engine Completion Audit
Date: 2026-10-03
Repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Supabase: AllphaDb-Universe / qltbacemtvnuzqkterly

## Scope

Phase 16 completes Workflow Definition/Version/Step, Workflow Run, Mission/Participant/Mission Run orchestration while preserving Phase 15 Agent Runtime as the only execution engine.

## Canonical architecture

Workflow Definition → Version → Steps → Run → Mission → Agent Runtime → Tool / AI Gateway

A Workflow never calls a provider directly and does not create a second executor.

## Completed implementation

### Workflow domain
- Workflow ownership, lifecycle and trigger type.
- Version lifecycle and published-version gating.
- Declarative tool binding against Agent Tool Definitions.
- Step arguments, input schema, conditions, bounded retry policy, risk and approval metadata.
- Workflow Run creation, preparation, cancellation and synchronization.
- Workflow Run Step linkage to Agent Task / Task Step.
- Workflow event telemetry.

### Runtime integration
- Workflow preparation creates an Agent Command through the existing Agent Runtime command path.
- Workflow plan materialization remains Phase 15 authoritative.
- Workflow step control metadata is carried into Agent Runtime task arguments.
- Agent Runtime evaluates declarative conditions:
  - empty condition = execute
  - all = all child conditions must match
  - any = at least one child condition must match
  - path + exists / equals / not_equals / contains
- Agent Runtime supports max 5 attempts, bounded backoff up to 30 seconds, and retries only when the error code is explicitly listed in retryable_codes.
- Condition-false steps become skipped and do not invoke a tool.
- Skipped tool runs are auditable.

### Trigger boundary
- Added authenticated trigger_workflow RPC.
- Supports manual, event, schedule and webhook trigger types at the invocation boundary.
- Trigger requires Workflow ownership, active Workflow, published version and an owned active Agent.
- Optional 24-hour idempotency key prevents duplicate trigger runs.
- Triggered execution still uses Workflow Run → Agent Runtime → Tool / AI Gateway.

### Mission domain
- Mission lifecycle and visibility.
- Participant join and approval decision.
- Published Workflow binding.
- Mission Run creation and synchronization.
- Mission cancellation delegates to Workflow cancellation and therefore Agent Runtime cancellation.
- Fixed Mission SELECT RLS membership predicate that previously compared mp.mission_id to mp.id.

### Web/API
- FastAPI /api/v1/workflows remains the authoritative boundary.
- Added POST /api/v1/workflows/{workflow_id}/trigger.
- /workflows Web surface now selects a real owned Agent rather than requiring a manually entered UUID.
- Web exposes condition/retry JSON configuration and trigger execution.
- Empty states remain authoritative; no synthetic records are shown.

## Security

Verified live:
- All Phase 16 domain tables have RLS enabled.
- trigger_workflow, prepare_workflow_run, sync_workflow_run and record_agent_tool_result are denied to anon and explicitly granted to authenticated.
- Workflow trigger ownership is enforced in SECURITY DEFINER RPC logic.
- Workflow Run preparation revalidates Agent ownership.
- No provider credentials are introduced.
- Existing project-wide Supabase Advisor findings remain outside Phase 16 scope; this phase did not introduce a new anonymous SECURITY DEFINER execution path.

## Live verification

Schema/RPC checks passed:
- trigger_workflow exists.
- prepare_workflow_run exists.
- sync_workflow_run exists.
- skipped Agent Tool Run status is supported.
- anonymous execution privileges are false.
- authenticated execution privileges are true.

Live counts remain intentionally empty:
- workflows: 0
- workflow_versions: 0
- workflow_steps: 0
- workflow_runs: 0
- workflow_run_steps: 0
- workflow_events: 0
- missions: 0
- mission_participants: 0
- mission_runs: 0
- skipped tool runs: 0

## Remaining gates

This is not Green. The project policy defers deployment/runtime E2E until the Web App feature/domain/engine/memory/theme scope is complete.

Deferred:
- authenticated real Workflow execution with a real owned Agent
- real AI provider execution
- approval propagation/resume
- conditional and retry runtime evidence against real failures
- multi-participant Mission E2E
- event/schedule/webhook invocation from deployed infrastructure
- realtime/browser verification
- API/PWA/Admin build and CI
- Vercel/Railway deployment
- production Green
